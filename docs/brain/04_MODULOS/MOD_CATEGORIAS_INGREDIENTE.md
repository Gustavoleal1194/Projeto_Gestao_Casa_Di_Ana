---
name: MOD_CATEGORIAS_INGREDIENTE
description: Categorias de classificação dos ingredientes
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 🏷️ Módulo: Categorias de Ingrediente

## Status detectado
**existente** — CRUD com soft delete.

## Objetivo
Classificar ingredientes (ex.: laticínios, secos, perecíveis).

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/Categorias/`
- Domain: `Domain/Entities/CategoriaIngrediente.cs`
- Frontend: `CasaDiAna/frontend/src/features/estoque/categorias/`
- Plans: `docs/superpowers/plans/2026-03-27-categorias.md`

## Regras relacionadas
- [[REGRA_SOFT_DELETE_NOMEEXISTE]]

## Módulos relacionados
- [[MOD_INGREDIENTES]]

## Pontos de atenção
- `NomeExisteAsync` deve filtrar `ativo = true`.

## O que NÃO fazer
- Não confundir com [[MOD_CATEGORIAS_PRODUTO]] (entidade e schema diferentes).
