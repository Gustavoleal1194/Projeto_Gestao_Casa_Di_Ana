---
name: PROMPT_ATUALIZAR_BRAIN
description: Atualizar BrainOS após uma task relevante
type: prompt
status: existente
---

# Prompt: atualizar brain após task

```
Você acabou de concluir a task abaixo. Atualize o BrainOS:

1. Acrescente uma entrada em `docs/brain/08_TASK_LOG/TASK_LOG.md` (no topo, formato `YYYY-MM-DD`).
2. Atualize `docs/brain/07_STATUS/STATUS_SNAPSHOT.md` para refletir mudanças de status de módulos / áreas.
3. Se a task envolveu uma decisão técnica não trivial, crie nota em `docs/brain/06_DECISOES/DEC_*.md` usando [[TEMPLATE_DECISAO]].
4. Se introduziu/alterou uma regra de negócio, atualize `docs/brain/05_REGRAS_NEGOCIO/`.
5. Se resolveu um bug não trivial, adicione entrada em `docs/brain/12_ERROS_RESOLVIDOS/ERROS_RESOLVIDOS.md`.
6. Atualize a nota do(s) módulo(s) em `docs/brain/04_MODULOS/MOD_*.md` (status, evidências, pontos de atenção).
7. Mova/feche pendências em `docs/brain/09_OPEN_LOOPS/OPEN_LOOPS.md` resolvidas pela task.

NÃO crie documentação decorativa. Seja denso.

TASK CONCLUÍDA:
{{descricao}}
```
