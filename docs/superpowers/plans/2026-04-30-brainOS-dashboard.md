# BrainOS Dashboard MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar dashboard local em HTML/JS puro com visualização 3D do grafo do vault Obsidian, embutível via iframe no Obsidian.

**Architecture:** `generate.js` lê `docs/brain/**/*.md`, extrai wikilinks e frontmatter, e escreve `dashboard/brain_data.json`. `dashboard/index.html` faz `fetch('brain_data.json')` no boot e constrói a cena Three.js com os dados reais. Um servidor Python expõe a pasta via HTTP para o Obsidian embutir via iframe.

**Tech Stack:** Node.js (stdlib apenas: `fs`, `path`), Three.js r128 (CDN), Python `http.server` (embutido no Python 3), HTML/CSS/JS vanilla.

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `dashboard/generate.js` | Criar | Lê vault → produz `brain_data.json` |
| `dashboard/brain_data.json` | Gerado | Fonte de dados do HTML (gitignored) |
| `dashboard/index.html` | Criar | Visualização Three.js adaptada do design |
| `.gitignore` | Modificar | Ignorar `brain_data.json` |
| `docs/brain/BrainOS_Live.md` | Criar | Nota Obsidian com iframe embutido |

---

## Task 1: Scaffold da pasta dashboard e .gitignore

**Files:**
- Create: `dashboard/.gitkeep`
- Modify: `.gitignore`

- [ ] **Step 1: Criar a pasta `dashboard/`**

```bash
mkdir dashboard
```

Verifique que a pasta existe: `ls dashboard`

- [ ] **Step 2: Adicionar `brain_data.json` ao `.gitignore`**

Abra `.gitignore` na raiz do projeto e adicione ao final:

```
# BrainOS Dashboard — gerado automaticamente
dashboard/brain_data.json
_design_bundle/
neural_network_design.html
```

- [ ] **Step 3: Criar placeholder para commitar a pasta vazia**

```bash
echo "" > dashboard/.gitkeep
```

- [ ] **Step 4: Commit**

```bash
git add dashboard/.gitkeep .gitignore
git commit -m "chore(dashboard): scaffold pasta dashboard e gitignore"
```

---

## Task 2: Escrever `dashboard/generate.js`

**Files:**
- Create: `dashboard/generate.js`

- [ ] **Step 1: Criar `dashboard/generate.js` com o conteúdo completo abaixo**

```js
'use strict';
const fs   = require('fs');
const path = require('path');

const VAULT_DIR = path.resolve(__dirname, '../docs/brain');
const OUTPUT    = path.resolve(__dirname, 'brain_data.json');

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
    const content = fs.readFileSync(fp, 'utf8');
    const fm     = parseFrontmatter(content);

    if (fm.brain_skip === true) return;

    const isHub = name === '00_CENTRO_DO_CEREBRO';
    const type  = isHub ? 'bridge' : (fm.brain_type || FOLDER_TYPE[folder] || 'ctx');
    const info  = fm.brain_info || `${name}\n${folder || 'raiz'}`;

    registry.set(id, { id, label: name, type, info, isHub, links: parseWikilinks(content) });
    labelIndex.set(name.toLowerCase(), id);
    labelIndex.set(id, id);
  });

  // --- pass 2: resolve edges + inDegree ---
  const edgeSet  = new Set();
  const edges    = [];
  const inDegree = new Map([...registry.keys()].map(k => [k, 0]));

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
      inDegree.set(target, inDegree.get(target) + 1);
      inDegree.set(node.id, inDegree.get(node.id) + 1);
    });
  });

  // --- pass 3: layout + finalise nodes ---
  const clusterTotal = {};
  const clusterIdx   = {};
  registry.forEach(n => { clusterTotal[n.type] = (clusterTotal[n.type] || 0) + 1; });
  Object.keys(clusterTotal).forEach(t => { clusterIdx[t] = 0; });

  const nodes = [];
  registry.forEach(node => {
    const deg    = inDegree.get(node.id) || 0;
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
    nodes.push({ id: node.id, label: node.label, type: node.type, r: Math.round(r * 100) / 100, p, info: node.info });
  });

  const data = {
    nodes,
    edges,
    meta: { generatedAt: new Date().toISOString(), totalNodes: nodes.length, totalEdges: edges.length },
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
```

- [ ] **Step 2: Executar o script e verificar a saída**

```bash
node dashboard/generate.js
```

Saída esperada (números vão variar):
```
[BrainOS] 47 nós · 83 arestas → brain_data.json
```

- [ ] **Step 3: Validar o JSON gerado**

```bash
node -e "const d=require('./dashboard/brain_data.json'); console.log('nodes:', d.nodes.length, '| edges:', d.edges.length, '| sample:', JSON.stringify(d.nodes[0]))"
```

Saída esperada: objeto JSON com `id`, `label`, `type`, `r`, `p` (array [x,y,z]), `info`.

Se `nodes` for 0, verifique se `VAULT_DIR` aponta para `docs/brain/` a partir da raiz do projeto (o script usa `__dirname` = `dashboard/`, então `../docs/brain` deve resolver corretamente).

- [ ] **Step 4: Commit**

```bash
git add dashboard/generate.js
git commit -m "feat(brainOS): adicionar generate.js — vault → brain_data.json"
```

---

## Task 3: Escrever `dashboard/index.html`

**Files:**
- Create: `dashboard/index.html`

- [ ] **Step 1: Criar `dashboard/index.html` com o conteúdo completo abaixo**

Este é o `neural_network.html` do design bundle adaptado para consumir `brain_data.json` dinamicamente.

```html
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>BrainOS · Neural Graph · Casa di Ana</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Sora:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:#000;overflow:hidden;font-family:'JetBrains Mono',monospace}
canvas{position:fixed;inset:0;display:block}
#scanlines{position:fixed;inset:0;z-index:5;pointer-events:none;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,140,0.015) 2px,rgba(0,255,140,0.015) 4px)}
.bracket{position:fixed;z-index:6;pointer-events:none;width:36px;height:36px}
.bracket::before,.bracket::after{content:'';position:absolute;background:#00FF8C;opacity:.5}
.bracket.tl{top:18px;left:18px}.bracket.tl::before{top:0;left:0;width:100%;height:1.5px}.bracket.tl::after{top:0;left:0;width:1.5px;height:100%}
.bracket.tr{top:18px;right:18px}.bracket.tr::before{top:0;right:0;width:100%;height:1.5px}.bracket.tr::after{top:0;right:0;width:1.5px;height:100%}
.bracket.bl{bottom:18px;left:18px}.bracket.bl::before{bottom:0;left:0;width:100%;height:1.5px}.bracket.bl::after{bottom:0;left:0;width:1.5px;height:100%}
.bracket.br{bottom:18px;right:18px}.bracket.br::before{bottom:0;right:0;width:100%;height:1.5px}.bracket.br::after{bottom:0;right:0;width:1.5px;height:100%}
#header{position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:10;text-align:center;pointer-events:none}
.sys-label{font-size:9px;letter-spacing:.25em;text-transform:uppercase;color:#00FF8C;opacity:.6;margin-bottom:6px;display:flex;align-items:center;justify-content:center;gap:8px}
.sys-label span{display:inline-block;width:4px;height:4px;border-radius:50%;background:#00FF8C;box-shadow:0 0 8px #00FF8C;animation:blink 1.5s ease infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
.sys-title{font-family:'Sora',sans-serif;font-size:20px;font-weight:700;letter-spacing:-.015em;color:#fff;line-height:1.1}
.sys-title .c1{color:#00D4FF}.sys-title .c2{color:#7C3AED}.sys-title .c3{color:#00FF8C}
.sys-version{font-size:9px;letter-spacing:.2em;color:rgba(255,255,255,.25);margin-top:5px}
#left-panel{position:fixed;top:50%;left:20px;transform:translateY(-50%);z-index:10;display:flex;flex-direction:column;gap:4px;pointer-events:none;max-width:170px}
.panel-block{background:rgba(0,0,0,.75);border:1px solid rgba(0,255,140,.15);padding:10px 13px;border-radius:3px}
.panel-title{font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:#00FF8C;opacity:.7;margin-bottom:8px}
.panel-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;font-size:10px}
.panel-row:last-child{margin-bottom:0}
.panel-key{color:rgba(255,255,255,.40)}
.panel-val{color:rgba(255,255,255,.85);font-variant-numeric:tabular-nums}
.panel-val.cyan{color:#00D4FF}.panel-val.purple{color:#A78BFA}.panel-val.green{color:#00FF8C}.panel-val.amber{color:#D4960C}
#right-panel{position:fixed;top:50%;right:20px;transform:translateY(-50%);z-index:10;display:flex;flex-direction:column;gap:4px;pointer-events:none;max-width:160px}
#bottom-bar{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:10;display:flex;gap:8px;pointer-events:auto}
.ctrl{display:flex;align-items:center;gap:6px;padding:7px 13px;border-radius:3px;background:rgba(0,0,0,.80);border:1px solid rgba(0,255,140,.18);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.50);cursor:pointer;transition:border-color 150ms,color 150ms;font-family:'JetBrains Mono',monospace}
.ctrl:hover{border-color:rgba(0,255,140,.55);color:#fff}
.ctrl .ci{font-size:13px;line-height:1}
#tt{position:fixed;z-index:30;pointer-events:none;opacity:0;transition:opacity 150ms ease}
.ttb{background:rgba(0,0,0,.92);border:1px solid rgba(0,212,255,.25);padding:10px 14px;border-radius:3px;min-width:180px;box-shadow:0 0 20px rgba(0,212,255,.10)}
.tt-head{display:flex;align-items:center;gap:7px;margin-bottom:6px}
.tt-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.tt-name{font-size:12px;font-weight:700;color:#fff;letter-spacing:.02em}
.tt-type{font-size:8.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.40);margin-bottom:5px}
.tt-info{font-size:10.5px;color:rgba(255,255,255,.55);line-height:1.55;font-family:'JetBrains Mono',monospace}
#telemetry{position:fixed;top:20px;right:22px;z-index:10;pointer-events:none;text-align:right}
.tele-row{font-size:9px;letter-spacing:.14em;color:rgba(0,255,140,.55);line-height:1.8;font-variant-numeric:tabular-nums}
.tele-row b{color:#00FF8C}
#loading{position:fixed;inset:0;z-index:50;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:'JetBrains Mono',monospace}
#loading .ld-title{font-family:'Sora',sans-serif;font-size:18px;font-weight:700;color:#fff}
#loading .ld-sub{font-size:10px;letter-spacing:.2em;color:#00FF8C;opacity:.7;text-transform:uppercase}
#loading .ld-err{font-size:11px;color:#FF6B6B;max-width:340px;text-align:center;line-height:1.6;display:none}
</style>
</head>
<body>

<div id="loading">
  <div class="ld-title">BrainOS</div>
  <div class="ld-sub">Carregando grafo do vault...</div>
  <div class="ld-err" id="ld-err"></div>
</div>

<div id="scanlines" style="display:none"></div>
<div class="bracket tl" style="display:none"></div>
<div class="bracket tr" style="display:none"></div>
<div class="bracket bl" style="display:none"></div>
<div class="bracket br" style="display:none"></div>

<div id="header" style="display:none">
  <div class="sys-label"><span></span>SISTEMA OPERACIONAL · CASA DI ANA<span></span></div>
  <div class="sys-title"><span class="c1">BRAIN</span><span style="color:rgba(255,255,255,.25)">OS</span> <span style="color:rgba(255,255,255,.25)">/</span> <span class="c3">VAULT GRAPH</span></div>
  <div class="sys-version" id="sys-version">NEURAL GRAPH v1.0 · TOPOLOGY MAP</div>
</div>

<div id="left-panel" style="display:none">
  <div class="panel-block">
    <div class="panel-title">// Grafo</div>
    <div class="panel-row"><span class="panel-key">Nós</span><span class="panel-val" id="sn">—</span></div>
    <div class="panel-row"><span class="panel-key">Arestas</span><span class="panel-val" id="se">—</span></div>
    <div class="panel-row"><span class="panel-key">Partículas</span><span class="panel-val" id="sp">—</span></div>
  </div>
  <div class="panel-block" id="stack-panel">
    <div class="panel-title">// Clusters</div>
    <div id="cluster-rows"></div>
  </div>
</div>

<div id="right-panel" style="display:none">
  <div class="panel-block">
    <div class="panel-title">// Status</div>
    <div class="panel-row"><span class="panel-key">Vault</span><span class="panel-val green">online</span></div>
    <div class="panel-row"><span class="panel-key">Gerado</span><span class="panel-val cyan" id="gen-time">—</span></div>
    <div class="panel-row"><span class="panel-key">TLS</span><span class="panel-val cyan">local</span></div>
  </div>
</div>

<div id="telemetry" style="display:none">
  <div class="tele-row">UTC <b id="clock">--:--:--</b></div>
  <div class="tele-row">FPS <b id="fps">60</b></div>
  <div class="tele-row">CAM <b id="cam-info">0°</b></div>
</div>

<div id="bottom-bar" style="display:none">
  <button class="ctrl" id="breset"><span class="ci">⊙</span>RESET</button>
  <button class="ctrl" id="bpause"><span class="ci" id="picon">⏸</span><span id="plabel">PAUSE</span></button>
  <button class="ctrl" id="bexplode"><span class="ci">✦</span><span id="elabel">EXPLODE</span></button>
</div>

<div id="tt">
  <div class="ttb">
    <div class="tt-head"><div class="tt-dot" id="tt-dot"></div><div class="tt-name" id="ttn"></div></div>
    <div class="tt-type" id="ttt"></div>
    <div class="tt-info" id="tti"></div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
/* ═══ PALETTE ══════════════════════════════════════════════ */
const P = {
  claude:   { hex: 0x00D4FF, css: '#00D4FF' },
  obsidian: { hex: 0x7C3AED, css: '#7C3AED' },
  erp:      { hex: 0x00FF8C, css: '#00FF8C' },
  infra:    { hex: 0xD4960C, css: '#D4960C' },
  bridge:   { hex: 0xFF6B6B, css: '#FF6B6B' },
  ctx:      { hex: 0x556677, css: '#556677' },
};
const TYPE_HEX = Object.fromEntries(Object.entries(P).map(([k,v])=>[k,v.hex]));
const TYPE_CSS = Object.fromEntries(Object.entries(P).map(([k,v])=>[k,v.css]));

const CLUSTER_LABEL = { claude:'Claude AI', obsidian:'Obsidian', erp:'ERP', infra:'Infra', bridge:'Bridge', ctx:'Context' };
const CLUSTER_CLASS = { claude:'cyan', obsidian:'purple', erp:'green', infra:'amber', bridge:'', ctx:'' };

/* ═══ BOOTSTRAP ════════════════════════════════════════════ */
fetch('brain_data.json')
  .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
  .then(data => init(data))
  .catch(err => {
    document.getElementById('ld-err').style.display = 'block';
    document.getElementById('ld-err').textContent =
      `Erro ao carregar brain_data.json:\n${err.message}\n\nRode: node dashboard/generate.js\ne depois: python -m http.server 7700 --directory dashboard`;
  });

function showUI() {
  ['scanlines','header','left-panel','right-panel','telemetry','bottom-bar']
    .forEach(id => document.getElementById(id).style.display = '');
  document.querySelectorAll('.bracket').forEach(el => el.style.display = '');
  document.getElementById('loading').style.display = 'none';
}

function init(data) {
  const NODES = data.nodes;
  const EDGES = data.edges;

  /* panels */
  document.getElementById('sn').textContent = NODES.length;
  document.getElementById('se').textContent = EDGES.length;
  const genDate = new Date(data.meta.generatedAt);
  document.getElementById('gen-time').textContent =
    `${genDate.getUTCHours().toString().padStart(2,'0')}:${genDate.getUTCMinutes().toString().padStart(2,'0')}`;
  document.getElementById('sys-version').textContent =
    `NEURAL GRAPH v1.0 · ${NODES.length} NÓS · ${EDGES.length} ARESTAS`;

  /* cluster counts for right panel */
  const clusterCount = {};
  NODES.forEach(n => { clusterCount[n.type] = (clusterCount[n.type]||0)+1; });
  const clusterRows = document.getElementById('cluster-rows');
  Object.entries(clusterCount).sort((a,b)=>b[1]-a[1]).forEach(([type, count]) => {
    const color = TYPE_CSS[type] || '#aaa';
    const label = CLUSTER_LABEL[type] || type;
    const cls   = CLUSTER_CLASS[type] || '';
    const row = document.createElement('div');
    row.className = 'panel-row';
    row.innerHTML = `<span class="panel-key" style="display:flex;align-items:center;gap:5px"><span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block"></span>${label}</span><span class="panel-val ${cls}">${count}</span>`;
    clusterRows.appendChild(row);
  });

  /* ═══ THREE SETUP ════════════════════════════════════════ */
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 1);
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000510, 0.008);

  const camera = new THREE.PerspectiveCamera(52, innerWidth/innerHeight, 0.1, 600);
  window.addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
  });

  scene.add(new THREE.AmbientLight(0x112244, 0.5));
  const ptLight  = new THREE.PointLight(0x00D4FF, 1.5, 60);
  ptLight.position.set(-9, 5, 5);
  scene.add(ptLight);
  const ptLight2 = new THREE.PointLight(0x00FF8C, 1.2, 60);
  ptLight2.position.set(0, -8, 5);
  scene.add(ptLight2);

  /* grid floor */
  const grid = new THREE.GridHelper(120, 60, 0x001122, 0x001122);
  grid.material.transparent = true; grid.material.opacity = 0.6;
  grid.position.y = -18; scene.add(grid);

  const horiz = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 40),
    new THREE.MeshBasicMaterial({ color:0x00FF8C, transparent:true, opacity:0.012, side:THREE.DoubleSide })
  );
  horiz.rotation.x = Math.PI/2; horiz.position.y = -18; scene.add(horiz);

  /* glow texture factory */
  function makeGlow(hex) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const ct = cv.getContext('2d');
    const r=(hex>>16)&255, g=(hex>>8)&255, b=hex&255;
    const gr = ct.createRadialGradient(64,64,0,64,64,64);
    gr.addColorStop(0,   `rgba(${r},${g},${b},1)`);
    gr.addColorStop(0.3, `rgba(${r},${g},${b},0.5)`);
    gr.addColorStop(1,   `rgba(${r},${g},${b},0)`);
    ct.fillStyle = gr; ct.fillRect(0,0,128,128);
    return new THREE.CanvasTexture(cv);
  }
  const glowMaps = {};
  Object.entries(TYPE_HEX).forEach(([k,v]) => { glowMaps[k] = makeGlow(v); });

  /* ═══ NODE MESHES ════════════════════════════════════════ */
  const meshMap = {}, origPos = {};

  NODES.forEach(d => {
    const col  = TYPE_HEX[d.type] || 0x556677;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(d.r, 32, 32),
      new THREE.MeshBasicMaterial({ color: col })
    );
    mesh.position.set(...d.p);
    mesh.userData = d;
    scene.add(mesh);

    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowMaps[d.type] || glowMaps.ctx,
      blending: THREE.AdditiveBlending, transparent:true, depthWrite:false, opacity:0.80,
    }));
    sp.scale.set(d.r*11, d.r*11, 1);
    mesh.add(sp);

    meshMap[d.id] = mesh;
    origPos[d.id] = [...d.p];
  });

  /* hub ring (maior nó bridge = hub) */
  const hubNode = NODES.filter(n=>n.type==='bridge').sort((a,b)=>b.r-a.r)[0];
  if (hubNode && meshMap[hubNode.id]) {
    const hubMesh = meshMap[hubNode.id];
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(hubNode.r+1.2, 0.04, 8, 80),
      new THREE.MeshBasicMaterial({ color:0xFF6B6B, transparent:true, opacity:0.45 })
    );
    ring.rotation.x = Math.PI/2.5; hubMesh.add(ring);
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(hubNode.r+2.0, 0.025, 8, 80),
      new THREE.MeshBasicMaterial({ color:0x00D4FF, transparent:true, opacity:0.25 })
    );
    ring2.rotation.x = Math.PI/3; ring2.rotation.z = Math.PI/5; hubMesh.add(ring2);
    hubMesh.userData._ring  = ring;
    hubMesh.userData._ring2 = ring2;
  }

  /* ═══ EDGES ══════════════════════════════════════════════ */
  const edgeLines = [];
  EDGES.forEach(({ a, b }) => {
    const ma = meshMap[a], mb = meshMap[b];
    if (!ma || !mb) return;
    const isBridge = (NODES.find(n=>n.id===a)?.type==='bridge') || (NODES.find(n=>n.id===b)?.type==='bridge');
    const col = isBridge ? 0xFF6B6B : 0x113355;
    const op  = isBridge ? 0.70 : 0.25;
    const geo = new THREE.BufferGeometry();
    const pa = ma.position, pb = mb.position;
    geo.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([pa.x,pa.y,pa.z, pb.x,pb.y,pb.z]), 3
    ));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color:col, transparent:true, opacity:op, blending:THREE.AdditiveBlending, depthWrite:false
    }));
    scene.add(line);
    edgeLines.push({ line, a, b });
  });

  /* ═══ PARTICLES ══════════════════════════════════════════ */
  const PC = Math.min(300, EDGES.length * 4 || 1);
  const pbuf = new Float32Array(PC*3), cbuf = new Float32Array(PC*3);
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(pbuf, 3));
  pgeo.setAttribute('color',    new THREE.BufferAttribute(cbuf, 3));
  scene.add(new THREE.Points(pgeo, new THREE.PointsMaterial({
    size:0.35, vertexColors:true, transparent:true,
    blending:THREE.AdditiveBlending, depthWrite:false,
  })));
  document.getElementById('sp').textContent = PC;

  const particles = Array.from({ length: PC }, (_, i) => ({
    edge: EDGES[i % EDGES.length], t: Math.random(), speed: 0.004 + Math.random()*0.008,
  }));

  function tickParticles() {
    particles.forEach((p, i) => {
      p.t += p.speed;
      if (p.t > 1) { p.t = 0; p.edge = EDGES[Math.floor(Math.random()*EDGES.length)]; }
      const ma = meshMap[p.edge?.a], mb = meshMap[p.edge?.b];
      if (!ma || !mb) return;
      pbuf[i*3]   = ma.position.x + (mb.position.x - ma.position.x)*p.t;
      pbuf[i*3+1] = ma.position.y + (mb.position.y - ma.position.y)*p.t;
      pbuf[i*3+2] = ma.position.z + (mb.position.z - ma.position.z)*p.t;
      const h = TYPE_HEX[NODES.find(n=>n.id===p.edge.a)?.type] || 0x00D4FF;
      cbuf[i*3]=(h>>16&255)/255; cbuf[i*3+1]=(h>>8&255)/255; cbuf[i*3+2]=(h&255)/255;
    });
    pgeo.attributes.position.needsUpdate = true;
    pgeo.attributes.color.needsUpdate    = true;
  }

  /* stars */
  const spos = new Float32Array(3000*3);
  for (let i=0;i<3000;i++){spos[i*3]=(Math.random()-.5)*400;spos[i*3+1]=(Math.random()-.5)*400;spos[i*3+2]=(Math.random()-.5)*400;}
  const sgeo = new THREE.BufferGeometry();
  sgeo.setAttribute('position', new THREE.BufferAttribute(spos,3));
  scene.add(new THREE.Points(sgeo, new THREE.PointsMaterial({
    size:0.09, color:0x112244, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false,
  })));

  /* ═══ CAMERA ═════════════════════════════════════════════ */
  const cam = { theta:0.2, phi:0, radius:42, paused:false, exploded:false };
  let drag = null;

  renderer.domElement.addEventListener('mousedown', e => {
    if (e.button!==0) return;
    drag = { x:e.clientX, y:e.clientY, theta:cam.theta, phi:cam.phi };
  });
  window.addEventListener('mousemove', e => {
    if (drag) {
      cam.phi   = drag.phi   + (e.clientX - drag.x)*0.009;
      cam.theta = drag.theta + (e.clientY - drag.y)*0.007;
      cam.theta = Math.max(-1.2, Math.min(1.2, cam.theta));
    } else { hoverCheck(e); }
  });
  window.addEventListener('mouseup', () => { drag = null; });
  renderer.domElement.addEventListener('wheel', e => {
    cam.radius += e.deltaY*0.04;
    cam.radius  = Math.max(12, Math.min(90, cam.radius));
  }, { passive:true });

  function applyCamera() {
    camera.position.set(
      cam.radius*Math.sin(cam.phi)*Math.cos(cam.theta),
      cam.radius*Math.sin(cam.theta),
      cam.radius*Math.cos(cam.phi)*Math.cos(cam.theta)
    );
    camera.lookAt(0,-1,0);
  }

  /* ═══ HOVER / TOOLTIP ════════════════════════════════════ */
  const ray = new THREE.Raycaster(), m2 = new THREE.Vector2();
  const tt  = document.getElementById('tt');

  function hoverCheck(e) {
    m2.x = (e.clientX/innerWidth)*2-1;
    m2.y = -(e.clientY/innerHeight)*2+1;
    ray.setFromCamera(m2, camera);
    const hits = ray.intersectObjects(Object.values(meshMap));
    if (hits.length) {
      const d = hits[0].object.userData;
      document.getElementById('ttn').textContent = d.label;
      document.getElementById('ttt').textContent = '[ '+d.type.toUpperCase()+' ]';
      document.getElementById('ttt').style.color = TYPE_CSS[d.type]||'#aaa';
      document.getElementById('tti').textContent = d.info;
      document.getElementById('tt-dot').style.background  = TYPE_CSS[d.type]||'#aaa';
      document.getElementById('tt-dot').style.boxShadow   = `0 0 8px ${TYPE_CSS[d.type]||'#aaa'}`;
      tt.style.opacity = '1';
      tt.style.left = (e.clientX+16)+'px';
      tt.style.top  = (e.clientY-8)+'px';
    } else { tt.style.opacity = '0'; }
  }

  /* ═══ CONTROLS ═══════════════════════════════════════════ */
  document.getElementById('breset').onclick = () => { cam.theta=0.2; cam.phi=0; cam.radius=42; };
  document.getElementById('bpause').onclick = function() {
    cam.paused = !cam.paused;
    document.getElementById('picon').textContent  = cam.paused ? '▶' : '⏸';
    document.getElementById('plabel').textContent = cam.paused ? 'RESUME' : 'PAUSE';
  };
  document.getElementById('bexplode').onclick = function() {
    cam.exploded = !cam.exploded;
    document.getElementById('elabel').textContent = cam.exploded ? 'COLLAPSE' : 'EXPLODE';
    const f = cam.exploded ? 1.9 : 1.0;
    NODES.forEach(d => { meshMap[d.id].userData._tgt = origPos[d.id].map(v=>v*f); });
  };

  /* ═══ CLOCK ══════════════════════════════════════════════ */
  function updateClock() {
    const n = new Date();
    document.getElementById('clock').textContent =
      `${String(n.getUTCHours()).padStart(2,'0')}:${String(n.getUTCMinutes()).padStart(2,'0')}:${String(n.getUTCSeconds()).padStart(2,'0')}`;
  }
  setInterval(updateClock, 1000); updateClock();

  /* ═══ RENDER LOOP ════════════════════════════════════════ */
  const clk = new THREE.Clock();
  let t0=0, fpsCount=0, fpsTimer=0;

  function animate() {
    requestAnimationFrame(animate);
    const dt = clk.getDelta();
    if (!cam.paused) cam.phi += 0.0014;
    applyCamera();

    /* explode lerp */
    NODES.forEach(d => {
      const m = meshMap[d.id];
      if (m.userData._tgt) {
        const t = m.userData._tgt;
        m.position.x += (t[0]-m.position.x)*0.07;
        m.position.y += (t[1]-m.position.y)*0.07;
        m.position.z += (t[2]-m.position.z)*0.07;
      }
    });

    /* edge update */
    edgeLines.forEach(({ line, a, b }) => {
      const pa=meshMap[a].position, pb=meshMap[b].position;
      const pos=line.geometry.attributes.position;
      pos.setXYZ(0,pa.x,pa.y,pa.z); pos.setXYZ(1,pb.x,pb.y,pb.z);
      pos.needsUpdate=true;
    });

    tickParticles();

    /* breathe */
    t0+=dt; fpsCount++; fpsTimer+=dt;
    if (fpsTimer>=0.5) {
      document.getElementById('fps').textContent=Math.round(fpsCount/fpsTimer);
      fpsCount=0; fpsTimer=0;
    }
    NODES.forEach((d,i) => {
      const m=meshMap[d.id];
      m.scale.setScalar(1+0.04*Math.sin(t0*1.5+i*0.7));
      m.material.color.setHex(TYPE_HEX[d.type]||0x556677);
      m.material.color.multiplyScalar(0.7+0.3*Math.sin(t0*1.0+i*0.5));
    });

    /* hub rings */
    if (hubNode && meshMap[hubNode.id]) {
      const r1=meshMap[hubNode.id].userData._ring;
      const r2=meshMap[hubNode.id].userData._ring2;
      if (r1) r1.rotation.y+=dt*0.6;
      if (r2) r2.rotation.y-=dt*0.4;
    }

    ptLight.intensity  = 1.2+0.8*Math.sin(t0*1.8);
    ptLight2.intensity = 1.0+0.6*Math.sin(t0*1.4+1);
    document.getElementById('cam-info').textContent=Math.round(cam.phi*180/Math.PI%360)+'°';

    renderer.render(scene, camera);
  }

  showUI();
  animate();
}
</script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/index.html
git commit -m "feat(brainOS): adicionar index.html — visualização 3D Three.js do vault"
```

---

## Task 4: Testar o dashboard no browser

**Files:** nenhum arquivo novo

- [ ] **Step 1: Garantir que o JSON está gerado**

```bash
node dashboard/generate.js
```

Saída esperada: `[BrainOS] N nós · M arestas → brain_data.json`

- [ ] **Step 2: Subir servidor local**

Em um terminal separado (mantenha rodando):

```bash
python -m http.server 7700 --directory dashboard
```

Saída esperada: `Serving HTTP on 0.0.0.0 port 7700 ...`

- [ ] **Step 3: Abrir no browser e verificar**

Abra `http://localhost:7700` no browser.

Checklist visual:
- [ ] Tela preta com tela de loading "Carregando grafo do vault..."
- [ ] Loading desaparece e grafo 3D aparece em < 2 segundos
- [ ] Nós visíveis em clusters de cores diferentes (verde, ciano, roxo, âmbar)
- [ ] Partículas se movendo entre nós
- [ ] Hover em um nó exibe tooltip com label, tipo e info
- [ ] Drag com mouse esquerdo orbita a câmera
- [ ] Scroll zoom in/out
- [ ] Botão EXPLODE separa os nós; COLLAPSE reagrupa
- [ ] Painel esquerdo mostra contagem real de nós e arestas
- [ ] Painel direito mostra clusters com contagens

**Se `brain_data.json` não for encontrado:** o loading mostra mensagem de erro em vermelho com instruções. Verifique se está acessando via `http://localhost:7700` e não pelo protocolo `file://`.

- [ ] **Step 4: Testar modo watch**

Em um terminal, rode:

```bash
node dashboard/generate.js --watch
```

Em outro terminal:
```bash
python -m http.server 7700 --directory dashboard
```

Abra um arquivo `.md` qualquer em `docs/brain/`, adicione `[[MOC]]` e salve. O terminal com `--watch` deve exibir:
```
[BrainOS] Alteração: 04_MODULOS\MOD_DASHBOARD.md → [BrainOS] N nós · M arestas → brain_data.json
```

Recarregue `http://localhost:7700` — o grafo deve refletir a mudança.

---

## Task 5: Criar nota de embedding no Obsidian

**Files:**
- Create: `docs/brain/BrainOS_Live.md`

- [ ] **Step 1: Criar a nota**

Crie `docs/brain/BrainOS_Live.md` com o conteúdo:

```markdown
---
brain_skip: true
---

# BrainOS Live View

> **Para usar:** rode `node dashboard/generate.js --watch` e `python -m http.server 7700 --directory dashboard` na raiz do projeto.

<iframe src="http://localhost:7700" width="100%" height="700" style="border:none;border-radius:8px"></iframe>

---

*Grafo gerado automaticamente a partir dos wikilinks do vault.*  
*Atualize qualquer `.md` para regenerar o grafo em < 2s.*
```

- [ ] **Step 2: Habilitar iframes no Obsidian**

Em Obsidian: `Configurações → Aparência → Renderização segura de HTML` → desativar.

Ou via `Configurações → Opções da comunidade → Plugins instalados → Custom CSS` — não necessário se desativar renderização segura.

Alternativa mais segura: instalar o plugin **"HTML Reader"** da comunidade Obsidian.

- [ ] **Step 3: Abrir a nota no Obsidian e verificar o iframe**

Abra `BrainOS_Live.md` no Obsidian em modo de visualização (não edição). O grafo 3D deve aparecer embutido.

- [ ] **Step 4: Commit final**

```bash
git add dashboard/ docs/brain/BrainOS_Live.md
git commit -m "feat(brainOS): adicionar nota de embedding BrainOS_Live.md

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-review do plano

**Cobertura do spec:**
- ✅ `generate.js` com node discovery, edge detection, node sizing — Task 2
- ✅ Flag `--watch` — Task 2, Step 1 (fim do arquivo)
- ✅ Frontmatter `brain_skip`, `brain_type`, `brain_info` — Task 2, Step 1 (`parseFrontmatter`)
- ✅ `brain_data.json` com estrutura especificada — Task 2, Step 1 (objeto `data`)
- ✅ `index.html` adaptado com `fetch()` — Task 3
- ✅ Boot com loading state — Task 3 (`#loading` div)
- ✅ Painel esquerdo com contagens reais — Task 3
- ✅ Painel direito com clusters dinâmicos — Task 3
- ✅ Tooltip, drag/orbit, zoom, pause, explode — Task 3 (preservados do design)
- ✅ Hub central (`00_CENTRO_DO_CEREBRO.md`) — Task 2 (`isHub`)
- ✅ Mapeamento pasta → cluster — Task 2 (`FOLDER_TYPE`)
- ✅ Centros 3D por cluster — Task 2 (`CLUSTER_CENTER`)
- ✅ Golden angle distribution — Task 2 (`spherePoint`)
- ✅ Embedding no Obsidian — Task 5
- ✅ `.gitignore` para `brain_data.json` — Task 1

**Placeholders:** nenhum.

**Consistência de tipos:** `slugify()` é usado em Task 2 tanto para geração de IDs quanto para resolução de wikilinks. `p` é sempre `[x,y,z]` numérico. `r` é sempre float. Consistente com o que `index.html` espera em `d.p` e `d.r`.
