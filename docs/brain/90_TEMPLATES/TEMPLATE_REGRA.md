---
name: TEMPLATE_REGRA
description: Template para nota em 05_REGRAS_NEGOCIO/
type: template
---

```markdown
---
name: REGRA_<SLUG>
description: <regra em uma linha>
type: regra
status: existente | em_andamento | a_confirmar
ultima_atualizacao: YYYY-MM-DD
---

# Regra: <título>

**Regra:** <frase imperativa, curta>

**Why:** <motivação; histórico de bug ou restrição que justificou>

**How to apply:**
- <quando aplicar>
- <pseudocódigo se ajudar>

**Onde aplica:** [[MOD_*]]

**Evidências:** `CasaDiAna/src/.../Arquivo.cs`, plan `docs/superpowers/plans/...`
```
