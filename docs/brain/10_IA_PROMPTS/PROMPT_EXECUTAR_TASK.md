---
name: PROMPT_EXECUTAR_TASK
description: Executar uma task com context pack carregado
type: prompt
status: existente
---

# Prompt: executar task com context pack

```
Execute a task abaixo no projeto Casa di Ana ERP.

CARREGUE PRIMEIRO:
- `docs/brain/02_CONTEXT_PACKS/{{context_pack}}.md`
- Nota do módulo em `docs/brain/04_MODULOS/{{nota_modulo}}.md`
- `docs/brain/05_REGRAS_NEGOCIO/REGRAS_BACKEND_CRITICAS.md`

REGRAS:
- Pt-BR sempre.
- Se a task implicar mudança de regra/decisão, peça confirmação antes.
- Não introduza dependência nova sem registrar [[DEC]].
- Após implementar, liste o que mudar no brain (módulos, decisões, status, open loops).

TASK:
{{task}}
```
