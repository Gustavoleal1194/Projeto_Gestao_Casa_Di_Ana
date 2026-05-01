---
name: MOD_ENTRADAS
description: Entrada de mercadoria — múltiplos itens, NF, fornecedor, atualiza estoque + custo
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 📥 Módulo: Entrada de Mercadoria

## Status detectado
**existente** — registro, cancelamento e listagem; com `RecebidoPor` (migration `AddRecebidoPorToEntradas`).

## Objetivo
Registrar a chegada de mercadoria com nota fiscal, atualizando estoque e custo unitário do ingrediente.

## Fluxo geral
1. Selecionar fornecedor + nº NF + data.
2. Adicionar itens (ingrediente, qtd, custo por item).
3. Salvar → para cada item:
   - cria `Movimentacao` `Entrada` referenciando a entrada;
   - chama `Ingrediente.AtualizarEstoque(qtd, +)`;
   - chama `Ingrediente.AtualizarCusto(custo)`.
4. Status: `Pendente` → `Confirmada` (a_confirmar nomes exatos do enum).
5. Cancelar entrada → estorna o estoque.

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/Entradas/`
- Domain: `Domain/Entities/EntradaMercadoria.cs`, `ItemEntradaMercadoria.cs`
- Frontend: `CasaDiAna/frontend/src/features/entradas/`
- Plans: `docs/superpowers/plans/2026-03-27-entradas.md`
- Migrations: `CriacaoInicial`, `AddRecebidoPorToEntradas`

## Regras relacionadas
- [[REGRA_MOVIMENTACAO_RASTREAVEL]]
- [[REGRA_ENTRADA_ATUALIZA_CUSTO]]

## Módulos relacionados
- [[MOD_FORNECEDORES]]
- [[MOD_INGREDIENTES]]
- [[MOD_RELATORIOS]] (relatório de entradas)

## Pontos de atenção
- Sem `AtualizarCusto`, ficha técnica retorna custo **zero** — testar.
- `ItemEntradaMercadoria.CustoTotal` é computado e `Ignore`d pelo EF.

## O que NÃO fazer
- Não usar `_db.Update(entrada)` para adicionar `Itens` (private readonly list) — vai gerar `DbUpdateConcurrencyException`.
- Não cancelar entrada sem estornar a movimentação correspondente.
