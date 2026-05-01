---
name: MOD_IMPORTACAO_VENDAS
description: Importação de vendas via arquivo (CSV/PDF) com criação rápida de produto
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 📥 Módulo: Importação de Vendas

## Status detectado
**existente** — backend com `CsvVendasParser`, frontend com modal de criação rápida de produto.

## Objetivo
Acelerar registro de vendas a partir de exportações de PDV/sistemas externos.

## Fluxo geral
- Upload de arquivo.
- Backend parseia (`CsvVendasParser`) e propõe vendas + produtos novos.
- Usuário confirma; modal permite criar rapidamente produto não cadastrado.
- Persiste vendas e (se aplicável) produtos.

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/ImportacaoVendas/` (Commands, Dtos, Services)
- Service: `CasaDiAna/src/CasaDiAna.Infrastructure/Services/CsvVendasParser.cs`
- Domain: `Domain/Entities/ImportacaoVendas.cs`
- Repo: `Infrastructure/Repositories/ImportacaoVendasRepository.cs`
- Controller: `API/Controllers/ImportacaoVendasController.cs`
- Frontend: `CasaDiAna/frontend/src/features/producao/importacao-vendas/`
- Plans: `docs/superpowers/plans/2026-04-11-importacao-pdf-vendas.md`
- Commit recente: `feat(importacao-vendas): adicionar modal de confirmação na criação rápida de produto`
- Migration: `AdicionarImportacaoVendas`

## Regras relacionadas
- (a_confirmar) — verificar deduplicação por linha/data/produto.

## Módulos relacionados
- [[MOD_VENDAS_DIARIAS]]
- [[MOD_PRODUTOS_FICHA_TECNICA]]

## Pontos de atenção
- O parser é estável para CSV; **PDF** parece ter sido o foco do plan de abril — a_confirmar se está em produção ou em ramificação.

## O que NÃO fazer
- Não confiar em colunas livres do CSV — sempre validar via FluentValidation antes do handler.
