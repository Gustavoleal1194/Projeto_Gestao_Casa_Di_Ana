---
name: PROMPT_PLANEJAR_FEATURE
description: Planejar uma feature sem implementar
type: prompt
status: existente
---

# Prompt: planejar feature sem implementar

```
Você é um arquiteto. Planeje a feature abaixo SEM escrever código.

CONTEXTO OBRIGATÓRIO (leia antes):
- `docs/brain/00_CENTRO_DO_CEREBRO.md`
- `docs/brain/01_MOC/MOC.md`
- nota do(s) módulo(s) afetado(s) em `docs/brain/04_MODULOS/`
- `docs/brain/02_CONTEXT_PACKS/CONTEXT_PACK_BACKEND.md` e/ou `CONTEXT_PACK_FRONTEND.md`
- regras críticas em `docs/brain/05_REGRAS_NEGOCIO/REGRAS_BACKEND_CRITICAS.md`

ENTREGUE EM PT-BR:
1. Objetivo + critérios de aceite
2. Mudanças por camada (Domain / Application / Infrastructure / API / Frontend)
3. Migrations necessárias e ordem de execução
4. Impacto em módulos vizinhos (com links [[MOD_*]])
5. Riscos / pontos a confirmar
6. Checklist de testes (unit + manuais)
7. Atualizações de brain após executar (quais notas mexer)

NÃO escreva código de produção. Pode esboçar pseudocódigo curto se ajudar.

FEATURE:
{{descricao}}
```
