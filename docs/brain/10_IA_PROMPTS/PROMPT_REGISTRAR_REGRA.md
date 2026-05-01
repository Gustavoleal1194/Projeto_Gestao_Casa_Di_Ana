---
name: PROMPT_REGISTRAR_REGRA
description: Registrar uma regra de negócio em 05_REGRAS_NEGOCIO/
type: prompt
status: existente
---

# Prompt: registrar regra de negócio

```
Crie uma nota em `docs/brain/05_REGRAS_NEGOCIO/REGRA_<slug>.md` baseada em [[TEMPLATE_REGRA]].

Conteúdo mínimo:
- Regra (frase curta, imperativa)
- **Why:** motivação (incluindo bugs/incidentes que justificaram)
- **How to apply:** quando/como aplicar (com pseudocódigo se ajudar)
- Onde aplica (módulos / arquivos)
- Status

Atualize [[REGRAS_BACKEND_CRITICAS]] se for crítica.
Atualize [[MOC]] na seção "Regras de negócio".

REGRA:
{{descrição}}
```
