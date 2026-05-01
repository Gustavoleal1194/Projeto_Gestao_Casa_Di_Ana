---
name: PROMPT_REGISTRAR_ERRO
description: Registrar um erro resolvido em 12_ERROS_RESOLVIDOS/
type: prompt
status: existente
---

# Prompt: registrar erro resolvido

```
Adicione uma entrada em `docs/brain/12_ERROS_RESOLVIDOS/ERROS_RESOLVIDOS.md` (ou crie nota dedicada se for grande). Use [[TEMPLATE_ERRO_RESOLVIDO]].

Conteúdo mínimo:
- ID curto (E#)
- Sintoma
- Causa raiz (1-3 frases)
- Cura
- Como evitar (link para [[REGRA_*]] correspondente)

Se a cura virou regra/decisão, criar/atualizar a nota em `05_REGRAS_NEGOCIO/` ou `06_DECISOES/`.

ERRO:
{{descrição}}
```
