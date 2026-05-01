---
name: ROTINA_POS_TASK
description: Checklist curta para atualizar o BrainOS após uma task relevante
type: rotina
status: existente
ultima_atualizacao: 2026-04-30
---

# 🔄 Rotina pós-task

> Marque cada item ao concluir.

- [ ] Atualizei `08_TASK_LOG/TASK_LOG.md` com a entrada nova (no topo, com data).
- [ ] Atualizei `07_STATUS/STATUS_SNAPSHOT.md` se algum módulo mudou de status.
- [ ] Atualizei a(s) nota(s) em `04_MODULOS/MOD_*.md` (status, evidências, pontos de atenção).
- [ ] Se introduziu nova decisão: criei `06_DECISOES/DEC_*.md`.
- [ ] Se introduziu nova regra: criei `05_REGRAS_NEGOCIO/REGRA_*.md` e atualizei [[REGRAS_BACKEND_CRITICAS]] se crítica.
- [ ] Se resolveu bug não trivial: registrei em `12_ERROS_RESOLVIDOS/ERROS_RESOLVIDOS.md`.
- [ ] Movi pendências resolvidas para fora de `09_OPEN_LOOPS/`.
- [ ] Atualizei links em `01_MOC/MOC.md` se criei nota nova.
- [ ] Verifiquei se o `CasaDiAna/CLAUDE.md` ainda está consistente com o que mudei (se não, abrir [[OPEN_LOOP]]).

> Vale 5 minutos. Economiza 30 minutos no próximo onboarding de agente.
