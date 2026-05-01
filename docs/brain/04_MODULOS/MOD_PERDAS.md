---
name: MOD_PERDAS
description: Registro de perdas de produto com justificativa
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 🗑️ Módulo: Perdas de Produto

## Status detectado
**existente** — modal de confirmação animado **planejado** (plan 2026-04-29).

## Objetivo
Registrar quando um produto pronto é perdido (queimou, vencido, derrubado).

## Fluxo geral
- Selecionar produto + qtd + motivo + data.
- Persistir perda; ainda **a_confirmar** se gera movimentação reversa de estoque dos ingredientes.

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/Perdas/`
- Domain: `Domain/Entities/PerdaProduto.cs`
- Frontend: `CasaDiAna/frontend/src/features/producao/perdas/`
- Migration: `AdicionarPerdaProduto`

## Regras relacionadas
- a_confirmar: existe regra de baixa correlata?

## Módulos relacionados
- [[MOD_PRODUTOS_FICHA_TECNICA]]
- [[MOD_RELATORIOS]]

## Pontos de atenção
- Plan `docs/superpowers/plans/2026-04-29-modal-confirmacao-todos-formularios.md` (Task 1) padroniza o modal de confirmação aqui.

## O que NÃO fazer
- Não excluir registros de perda — eles compõem histórico operacional.
