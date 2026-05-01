---
name: MOD_INVENTARIOS
description: Inventário físico comparativo (contado vs sistema), gera ajustes de estoque
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 📋 Módulo: Inventário Físico

## Status detectado
**existente** — fluxo completo com modal de confirmação animado.

## Objetivo
Confrontar saldo do sistema com a contagem física e gerar ajustes (positivos/negativos).

## Estados
`EmAndamento` → `Finalizado` | `Cancelado`

## Fluxo geral
1. Iniciar inventário (modal de confirmação).
2. Adicionar itens contados (qtd real).
3. Finalizar → para cada item com diferença:
   - cria `Movimentacao` `AjustePositivo` ou `AjusteNegativo` referenciando o inventário;
   - atualiza `EstoqueAtual` do ingrediente (clampado em 0).
4. Cancelar → não gera ajustes.

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/Inventarios/`
- Domain: `Domain/Entities/Inventario.cs`, `ItemInventario.cs` (com `Diferenca` `Ignore`d)
- Frontend: `CasaDiAna/frontend/src/features/inventarios/`
- Plans: `docs/superpowers/plans/2026-03-27-inventarios.md`
- Commits recentes: `feat(inventarios): adicionar modal de confirmação ao iniciar/finalizar inventário`

## Regras relacionadas
- [[REGRA_MOVIMENTACAO_RASTREAVEL]]
- [[REGRA_ESTOQUE_PODE_FICAR_NEGATIVO_OU_CLAMP]] (a_confirmar)

## Módulos relacionados
- [[MOD_INGREDIENTES]]
- [[MOD_CORRECAO_ESTOQUE]]

## Pontos de atenção
- Finalizar é destrutivo do ponto de vista do estoque — confirmar via modal.
- Soft delete não se aplica (estado é `Cancelado`).

## O que NÃO fazer
- Não permitir reabrir inventário após `Finalizado` (definitivo).
- Não tratar `Diferenca` como coluna persistida — é computada.
