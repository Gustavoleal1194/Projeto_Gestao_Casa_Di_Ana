# BrainOS Dashboard MVP — Design Spec

_Data: 2026-04-30_

---

## Objetivo

Criar um dashboard local em HTML/JS puro que lê dados do vault Obsidian via JSON e exibe uma visualização 3D interativa do grafo de conhecimento do projeto Casa di Ana. O dashboard pode ser embutido via iframe dentro de notas do Obsidian sem necessidade de plugin.

---

## Arquitetura

```
ProjetoGestao/
├── docs/brain/**/*.md        ← fonte da verdade (vault Obsidian existente)
└── dashboard/
    ├── generate.js           ← script Node.js: lê vault → escreve brain_data.json
    ├── brain_data.json       ← gerado automaticamente (gitignored)
    └── index.html            ← neural_network.html adaptado (fetch do JSON)
```

**Servidor local:** `python -m http.server 7700 --directory dashboard`

**Embedding no Obsidian** (em qualquer nota `.md`):
```html
<iframe src="http://localhost:7700" width="100%" height="700" style="border:none"></iframe>
```
Requer "Allow iframes" nas configurações do Obsidian.

---

## Componentes

### `generate.js`

Script Node.js (sem dependências externas além de `fs` e `path`) com três responsabilidades:

1. **Node discovery** — caminha recursivamente por `docs/brain/**/*.md`; cada arquivo = um nó; id = slug do nome do arquivo; cluster = pasta pai
2. **Edge detection** — regex `\[\[([^\]|#]+)\]\]` extrai todos os wikilinks de cada arquivo; cada link resolvido para um nó existente = aresta bidirecional
3. **Node sizing** — `radius = clamp(0.4 + inDegree × 0.12, 0.4, 2.2)` — nós mais referenciados ficam maiores

**Flag `--watch`:** usa `fs.watch()` nativo para detectar mudanças em `docs/brain/` e regenerar `brain_data.json` automaticamente.

**Frontmatter opcional** (parsed via regex, sem dependência yaml):
```yaml
brain_type: claude     # override de cluster
brain_info: "Texto do tooltip"
brain_skip: true       # exclui da visualização
```

**Saída (`brain_data.json`):**
```json
{
  "nodes": [
    { "id": "mod-dashboard", "label": "MOD_DASHBOARD", "type": "erp", "r": 0.8, "info": "..." }
  ],
  "edges": [
    { "a": "mod-dashboard", "b": "moc" }
  ],
  "meta": { "generatedAt": "2026-04-30T...", "totalNodes": 47, "totalEdges": 83 }
}
```

### `index.html`

Adaptação do `neural_network.html` do design bundle:

- Remove array `NODES` hardcoded
- Boot sequence: `fetch('brain_data.json')` → parse → build Three.js scene
- Layout 3D por cluster: cada cluster tem centro fixo no espaço 3D; nós são distribuídos em esfera ao redor usando golden angle para evitar sobreposição
- Painel esquerdo: contagens reais (nós, arestas, partículas)
- Painel direito: clusters reais com contagens dinâmicas
- Preserva toda a estética original: Three.js, scanlines, corner brackets, telemetria, FPS, drag/orbit, explode/collapse

---

## Mapeamento pasta → cluster

| Pasta | Cluster | Cor |
|---|---|---|
| `04_MODULOS/` | `erp` | `#00FF8C` |
| `02_CONTEXT_PACKS/` | `claude` | `#00D4FF` |
| `10_IA_PROMPTS/` | `claude` | `#00D4FF` |
| `03_PROJECT_MEMORY/` | `obsidian` | `#7C3AED` |
| `01_MOC/` | `obsidian` | `#7C3AED` |
| `05_REGRAS_NEGOCIO/` | `infra` | `#D4960C` |
| `06_DECISOES/` | `infra` | `#D4960C` |
| `07_STATUS/` | `bridge` | `#FF6B6B` |
| `08_TASK_LOG/` … `13_ACADEMICO/` | `ctx` | `#556677` |
| `00_CENTRO_DO_CEREBRO.md` | hub central | nó gigante `r=2.2` |

Centros dos clusters no espaço 3D (preserva visual original):
- claude: `[-9, 0, 0]`
- obsidian: `[9, 2, 0]`
- erp: `[0, -8, 0]`
- infra: `[2, -3, -7]`
- bridge/ctx: `[0, 0, 0]` (centro)

---

## Fluxo de dados

```
docs/brain/*.md
      │
      ▼ generate.js
brain_data.json
      │
      ▼ fetch() no boot do index.html
Three.js scene
      │
      ▼ python http.server 7700
iframe no Obsidian
```

---

## Como rodar

```bash
# 1. Gerar o JSON (uma vez)
node dashboard/generate.js

# 2. Gerar e assistir mudanças
node dashboard/generate.js --watch

# 3. Subir servidor local (terminal separado)
python -m http.server 7700 --directory dashboard

# 4. Abrir no browser (opcional)
http://localhost:7700

# 5. Embutir no Obsidian
# Colar em qualquer nota .md:
# <iframe src="http://localhost:7700" width="100%" height="700" style="border:none"></iframe>
```

---

## Critérios de aceitação

- [ ] `generate.js` produz JSON válido com todos os arquivos `.md` do vault como nós
- [ ] Wikilinks `[[X]]` viram arestas; links para arquivos inexistentes são ignorados silenciosamente
- [ ] `brain_skip: true` no frontmatter exclui o nó do grafo
- [ ] `--watch` regenera o JSON em < 2s após salvar um arquivo no vault
- [ ] `index.html` carrega e renderiza sem erros com o JSON gerado
- [ ] Node sizes refletem o in-degree (nós mais linkados ficam maiores)
- [ ] Clusters corretos por pasta (cor e grupo)
- [ ] Tooltip mostra label, tipo e info do nó
- [ ] Drag/orbit, zoom, pause, explode funcionam
- [ ] Funciona embutido via iframe no Obsidian (testado com `python http.server`)

---

## Fora do escopo (MVP)

- Plugin Obsidian nativo (próximo passo)
- Busca/filtro de nós
- Edição de notas pelo dashboard
- Sincronização em tempo real sem `--watch`
- Deploy remoto

---

## Próximos passos pós-MVP

1. Empacotar `generate.js` + `index.html` como plugin Obsidian (usar Obsidian Plugin API)
2. Substituir `fs.watch` pelo hook nativo `vault.on('modify')` do plugin
3. Adicionar painel de métricas (cards com contagem de módulos, decisões, erros resolvidos)
4. Filtros por cluster, busca por nome de nó
