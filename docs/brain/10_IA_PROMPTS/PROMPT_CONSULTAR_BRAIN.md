---
name: PROMPT_CONSULTAR_BRAIN
description: Antes de responder, garanta que leu o brain
type: prompt
status: existente
---

# Prompt: consultar o brain antes de responder

```
Antes de responder à tarefa abaixo, consulte o BrainOS deste projeto em `docs/brain/`:
1. Abra `00_CENTRO_DO_CEREBRO.md` e `01_MOC/MOC.md`.
2. Identifique o(s) módulo(s) afetados em `04_MODULOS/` e leia.
3. Carregue o(s) [[CONTEXT_PACK_*]] correspondente(s) em `02_CONTEXT_PACKS/`.
4. Verifique [[STATUS_SNAPSHOT]] e [[OPEN_LOOPS]] para regras vigentes e pendências.
5. NÃO assuma o status de uma feature — verifique o código atual.
6. Se encontrar conflito entre brain e código, registre em [[OPEN_LOOPS]] em vez de "consertar" silenciosamente.

TAREFA:
{{tarefa}}
```
