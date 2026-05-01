---
name: MOD_NOTIFICACOES_ESTOQUE
description: Notificações automáticas de estoque (Atenção, Crítico, Zerado)
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 🔔 Módulo: Notificações de Estoque

## Status detectado
**existente** — service rodando na inicialização e após mudanças de estoque (a_confirmar gatilhos exatos).

## Objetivo
Avisar a equipe quando ingredientes ficam abaixo do mínimo ou zerados.

## Níveis
- **Atenção** — `EstoqueAtual ≤ 1,5 × EstoqueMinimo`
- **Crítico** — `EstoqueAtual ≤ EstoqueMinimo`
- **Zerado** — `EstoqueAtual = 0`

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/Notificacoes/`
- Service: `CasaDiAna/src/CasaDiAna.Infrastructure/Services/NotificacaoEstoqueService.cs` (a sincronizar com `Application/Notificacoes/Services/`)
- Domain: `Domain/Entities/NotificacaoEstoque.cs`, enum `TipoNotificacaoEstoque`
- `Program.cs:164-167` chama `SincronizarAsync()` na inicialização
- Frontend: `CasaDiAna/frontend/src/features/notificacoes/`
- Plans: `docs/superpowers/plans/2026-04-04-sistema-notificacoes-estoque.md`
- Migration: `AddNotificacoesEstoque`

## Regras relacionadas
- [[REGRA_MOVIMENTACAO_RASTREAVEL]] (origem de movimentações)

## Módulos relacionados
- [[MOD_INGREDIENTES]]
- [[MOD_DASHBOARD]]

## Pontos de atenção
- Hoje a notificação **não** sai por canal externo (push, e-mail, SMS) — só fica no banco. Possível evolução conhecida.
- A sincronização inicial roda **em todo boot** da API.

## O que NÃO fazer
- Não gerar notificações duplicadas para o mesmo ingrediente no mesmo nível em curto intervalo (verificar idempotência ao alterar a regra).
