---
name: DEC_TAILWIND_TOKENS_CSS_VARS
description: Tema visual via CSS custom properties (--ada-*) declaradas em index.css
type: decisao
status: existente
ultima_atualizacao: 2026-04-30
---

# Decisão: tokens de tema via CSS variables

**Decisão:** todo o sistema visual usa tokens em CSS custom properties prefixadas com `--ada-` (ex.: `--ada-heading`, `--ada-surface`), declarados em `frontend/src/index.css`.

**Why:**
- Tema escuro / claro alternável sem reescrever JSX.
- Tailwind v4 funciona bem com tokens; usar classes diretas (`bg-white`, `text-stone-900`) **quebra** o tema.

**How to apply:**
- Em vez de `className="bg-white"`, usar `style={{ backgroundColor: 'var(--ada-surface)' }}` ou utilities arbitrárias `bg-[color:var(--ada-surface)]`.
- Componentes compartilhados em `components/form/` e `components/ui/` já consomem tokens — preferir eles.

**Onde aplica:** todo o frontend.

**Onde NÃO aplica:**
- O design lib em `frontend/src/features/design_libs/` é experimental (untracked) — verificar se conflita.
