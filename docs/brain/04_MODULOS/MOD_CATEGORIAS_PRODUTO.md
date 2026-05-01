---
name: MOD_CATEGORIAS_PRODUTO
description: Categorias de classificação dos produtos finais
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 🏷️ Módulo: Categorias de Produto

## Status detectado
**existente** — CRUD com soft delete; schema `producao`.

## Objetivo
Agrupar produtos finais (bolos, doces, salgados, bebidas) para filtros e relatórios.

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/CategoriasProduto/`
- Frontend: `CasaDiAna/frontend/src/features/producao/categorias-produto/`
- Domain: `Domain/Entities/CategoriaProduto.cs`

## Regras relacionadas
- [[REGRA_SOFT_DELETE_NOMEEXISTE]]

## Módulos relacionados
- [[MOD_PRODUTOS_FICHA_TECNICA]]

## O que NÃO fazer
- Não fundir com [[MOD_CATEGORIAS_INGREDIENTE]] — domínios diferentes.
