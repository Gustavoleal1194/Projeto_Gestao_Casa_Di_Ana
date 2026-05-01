---
name: MOD_FORNECEDORES
description: Cadastro de fornecedores (CNPJ, contato, e-mail)
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 🚚 Módulo: Fornecedores

## Status detectado
**existente** — CRUD com soft delete.

## Objetivo
Manter fornecedores referenciados pelas entradas de mercadoria.

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/Fornecedores/`
- Domain: `Domain/Entities/Fornecedor.cs`
- Frontend: `CasaDiAna/frontend/src/features/fornecedores/`
- Plans: `docs/superpowers/plans/2026-03-27-fornecedores.md`, modal de confirmação animado.

## Regras relacionadas
- [[REGRA_SOFT_DELETE_NOMEEXISTE]]

## Módulos relacionados
- [[MOD_ENTRADAS]]

## Pontos de atenção
- Fornecedor desativado **não** deve aparecer no select de entrada (filtrar `ativo = true`).

## O que NÃO fazer
- Não excluir fornecedor com entradas vinculadas — usar soft delete.
