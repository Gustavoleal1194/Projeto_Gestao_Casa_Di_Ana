---
name: TEMPLATE_DECISAO
description: Template para nota em 06_DECISOES/
type: template
---

```markdown
---
name: DEC_<SLUG>
description: <decisão em uma linha>
type: decisao
status: existente | em_andamento | planejado
ultima_atualizacao: YYYY-MM-DD
data_decisao: YYYY-MM-DD
---

# Decisão: <título>

**Decisão:** <frase única, clara>.

**Why:** <motivações concretas, com referência a incidentes/restrições>

**Trade-offs descartados:** <opções consideradas e por que não>

**How to apply:** <quando/onde a decisão se aplica na prática>

**Onde aplica:** [[MOD_*]], [[REGRA_*]]

**Evidências:** <caminhos, plans, migrations, commits>
```
