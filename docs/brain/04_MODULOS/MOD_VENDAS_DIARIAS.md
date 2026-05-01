---
name: MOD_VENDAS_DIARIAS
description: Registro de vendas diárias por produto
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 💰 Módulo: Vendas Diárias

## Status detectado
**existente** — manual + importação por arquivo (CSV/PDF).

## Objetivo
Registrar quantos produtos foram vendidos por dia. Não baixa estoque (a saída é registrada na produção).

## Fluxo geral
- Manual: data + produto + qtd + valor.
- Importação: ver [[MOD_IMPORTACAO_VENDAS]].
- Modal animado de confirmação (`RegistrarVendaPage.tsx`).

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/VendasDiarias/`
- Domain: `Domain/Entities/VendaDiaria.cs`
- Frontend: `CasaDiAna/frontend/src/features/producao/vendas-diarias/`
- Plans: `docs/superpowers/plans/2026-04-24-confirmacoes-venda-producao.md`

## Regras relacionadas
- (não impacta estoque diretamente)

## Módulos relacionados
- [[MOD_PRODUTOS_FICHA_TECNICA]]
- [[MOD_IMPORTACAO_VENDAS]]
- [[MOD_PRODUCAO_DIARIA]]
- [[MOD_RELATORIOS]] (Produção vs Vendas)

## Pontos de atenção
- Verificar duplicidade ao importar do mesmo arquivo CSV.

## O que NÃO fazer
- Não confundir baixa de estoque com venda — é a produção que abate estoque.
