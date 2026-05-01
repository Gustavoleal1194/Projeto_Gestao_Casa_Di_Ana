'use strict';
const fs   = require('fs');
const path = require('path');

const VAULT_DIR    = path.resolve(__dirname, '../docs/brain');
const PROJECT_ROOT = path.resolve(__dirname, '..');
const VAULT_NAME   = path.basename(PROJECT_ROOT);
const OUTPUT       = path.resolve(__dirname, 'brain_data.json');

const FOLDER_TYPE = {
  '01_MOC':              'obsidian',
  '02_CONTEXT_PACKS':    'claude',
  '03_PROJECT_MEMORY':   'obsidian',
  '04_MODULOS':          'erp',
  '05_REGRAS_NEGOCIO':   'infra',
  '06_DECISOES':         'infra',
  '07_STATUS':           'bridge',
  '08_TASK_LOG':         'ctx',
  '09_OPEN_LOOPS':       'ctx',
  '10_IA_PROMPTS':       'claude',
  '11_APRENDIZADOS':     'ctx',
  '12_ERROS_RESOLVIDOS': 'ctx',
  '13_ACADEMICO':        'ctx',
};

const CLUSTER_CENTER = {
  claude:   [-9,  0,  0],
  obsidian: [ 9,  2,  0],
  erp:      [ 0, -8,  0],
  infra:    [ 2, -3, -7],
  bridge:   [ 0,  0,  0],
  ctx:      [ 1,  4,  3],
};

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  m[1].split(/\r?\n/).forEach(line => {
    const colon = line.indexOf(':');
    if (colon < 0) return;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
    out[key] = val === 'true' ? true : val === 'false' ? false : val;
  });
  return out;
}

function parseWikilinks(content) {
  const re = /\[\[([^\]|#\r\n]+)/g;
  const links = [];
  let m;
  while ((m = re.exec(content)) !== null) links.push(m[1].trim());
  return links;
}

function walkMd(dir) {
  const result = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) result.push(...walkMd(full));
    else if (e.name.endsWith('.md')) result.push(full);
  }
  return result;
}

function spherePoint(idx, total, spread) {
  const phi   = Math.acos(1 - 2 * (idx + 0.5) / Math.max(total, 1));
  const theta = Math.PI * (1 + Math.sqrt(5)) * idx;
  return [
    spread * Math.sin(phi) * Math.cos(theta),
    spread * Math.cos(phi),
    spread * Math.sin(phi) * Math.sin(theta),
  ];
}

function generate() {
  if (!fs.existsSync(VAULT_DIR)) {
    console.error(`[BrainOS] Vault não encontrado: ${VAULT_DIR}`);
    process.exit(1);
  }
  const files = walkMd(VAULT_DIR);

  // --- pass 1: build node registry ---
  const registry = new Map(); // id → node draft
  const labelIndex = new Map(); // lowercase label → id

  files.forEach(fp => {
    const rel    = path.relative(VAULT_DIR, fp);
    const parts  = rel.split(path.sep);
    const folder = parts.length > 1 ? parts[0] : '';
    const name   = parts[parts.length - 1].replace(/\.md$/, '');
    const id     = slugify(name);
    let content;
    try { content = fs.readFileSync(fp, 'utf8'); } catch { return; }
    const fm     = parseFrontmatter(content);

    if (fm.brain_skip === true) return;

    const isHub = name === '00_CENTRO_DO_CEREBRO';
    const type  = isHub ? 'bridge' : (fm.brain_type || FOLDER_TYPE[folder] || 'ctx');
    const info  = fm.brain_info || `${name}\n${folder || 'raiz'}`;

    const obsidianPath = path.relative(PROJECT_ROOT, fp).replace(/\\/g, '/');
    registry.set(id, { id, label: name, type, info, isHub, obsidianPath, links: parseWikilinks(content) });
    labelIndex.set(name.toLowerCase(), id);
    labelIndex.set(id, id);
  });

  // --- pass 2: resolve edges + degree ---
  const edgeSet  = new Set();
  const edges    = [];
  const degree = new Map([...registry.keys()].map(k => [k, 0]));

  registry.forEach(node => {
    node.links.forEach(raw => {
      const target = registry.has(slugify(raw))
        ? slugify(raw)
        : labelIndex.get(raw.toLowerCase());
      if (!target || target === node.id || !registry.has(target)) return;
      const key = [node.id, target].sort().join('~~');
      if (edgeSet.has(key)) return;
      edgeSet.add(key);
      edges.push({ a: node.id, b: target });
      degree.set(target, degree.get(target) + 1);
      degree.set(node.id, degree.get(node.id) + 1);
    });
  });

  // --- pass 3: layout + finalise nodes ---
  const clusterTotal = {};
  const clusterIdx   = {};
  registry.forEach(n => { clusterTotal[n.type] = (clusterTotal[n.type] || 0) + 1; });
  Object.keys(clusterTotal).forEach(t => { clusterIdx[t] = 0; });

  const nodes = [];
  registry.forEach(node => {
    const deg    = degree.get(node.id) || 0;
    const r      = node.isHub ? 2.2 : Math.min(2.2, Math.max(0.4, 0.4 + deg * 0.12));
    const center = CLUSTER_CENTER[node.type] || [0, 0, 0];
    const spread = Math.max(4, 3 + Math.sqrt(clusterTotal[node.type] || 1) * 1.4);
    const idx    = clusterIdx[node.type];
    clusterIdx[node.type]++;
    const [dx, dy, dz] = spherePoint(idx, clusterTotal[node.type], spread);
    const p = [
      Math.round((center[0] + dx) * 100) / 100,
      Math.round((center[1] + dy) * 100) / 100,
      Math.round((center[2] + dz) * 100) / 100,
    ];
    nodes.push({ id: node.id, label: node.label, type: node.type, r: Math.round(r * 100) / 100, p, info: node.info, obsidianPath: node.obsidianPath });
  });

  const data = {
    nodes,
    edges,
    meta: { generatedAt: new Date().toISOString(), totalNodes: nodes.length, totalEdges: edges.length, vaultName: VAULT_NAME },
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2), 'utf8');
  console.log(`[BrainOS] ${nodes.length} nós · ${edges.length} arestas → brain_data.json`);
  return data;
}

// --- CLI entrypoint ---
generate();

if (process.argv.includes('--watch')) {
  console.log('[BrainOS] Monitorando docs/brain/ ...');
  let debounce;
  fs.watch(VAULT_DIR, { recursive: true }, (_, filename) => {
    if (!filename?.endsWith('.md')) return;
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      process.stdout.write(`[BrainOS] Alteração: ${filename} → `);
      try { generate(); } catch (e) { console.error('Erro:', e.message); }
    }, 500);
  });
}
