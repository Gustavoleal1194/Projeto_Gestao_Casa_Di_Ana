---
name: TEMPLATE_MODULO
description: Template para uma nota em 04_MODULOS/
type: template
---

```markdown
---
name: MOD_<SLUG>
description: <descrição em uma linha>
type: modulo
status: existente | em_andamento | planejado | a_confirmar
ultima_atualizacao: YYYY-MM-DD
---

# <emoji> Módulo: <Nome>

## Status detectado
**<status>** — <observação curta>.

## Objetivo
<1-3 frases sobre o porquê do módulo>

## Fluxo geral
- ...
- ...

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/<Pasta>/`
- Domain: `Domain/Entities/<Entidade>.cs`
- Frontend: `frontend/src/features/<area>/<modulo>/`
- Plans/specs: `docs/superpowers/plans/...`
- Migrations relacionadas: `...`

## Regras relacionadas
- [[REGRA_*]]

## Módulos relacionados
- [[MOD_*]]

## Pontos de atenção
- ...

## O que NÃO fazer
- ...
```
