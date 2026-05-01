---
name: MOD_CORRECAO_ESTOQUE
description: Correção de estoque em lote — informa qtd real e gera ajustes
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 🛠️ Módulo: Correção de Estoque

## Status detectado
**existente** — backend `Application/Estoque/`, frontend `features/estoque/correcao/`.

## Objetivo
Corrigir múltiplos ingredientes ao mesmo tempo, sem o overhead de um inventário formal.

## Fluxo geral
- Selecionar ingredientes + informar qtd real.
- Backend gera `Movimentacao` `AjustePositivo` ou `AjusteNegativo` para cada diferença.
- Atualiza `EstoqueAtual`.

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/Estoque/`
- Controller: `API/Controllers/EstoqueController.cs`
- Frontend: `CasaDiAna/frontend/src/features/estoque/correcao/`

## Regras relacionadas
- [[REGRA_MOVIMENTACAO_RASTREAVEL]]

## Módulos relacionados
- [[MOD_INGREDIENTES]]
- [[MOD_INVENTARIOS]]

## O que NÃO fazer
- Não usar correção como atalho para entrada de mercadoria — perderia rastreabilidade do fornecedor + NF.
