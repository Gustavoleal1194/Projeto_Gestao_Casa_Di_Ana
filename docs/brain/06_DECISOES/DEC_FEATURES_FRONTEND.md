---
name: DEC_FEATURES_FRONTEND
description: Frontend organizado por features independentes em src/features/
type: decisao
status: existente
ultima_atualizacao: 2026-04-30
---

# Decisão: organização feature-based no frontend

**Decisão:** cada módulo funcional vive em `src/features/<area>/<modulo>/` com `pages/`, `components/`, `services/` próprios. Sem acoplamento horizontal entre features.

**Why:**
- Apaga ou move uma feature inteira sem ramificações em pastas globais.
- Encoraja serviços HTTP locais — não há service global gigante.
- Estado global mínimo (apenas `authStore`).

**How to apply:**
- Módulo de referência: `features/estoque/ingredientes/`. Copiar e adaptar.
- Componentes realmente compartilhados moram em `components/`, `shared/components/` ou `components/form/`.

**Onde aplica:** todo o frontend.

**Onde NÃO aplica:**
- Auth, layout, store global.
