---
name: CONTEXT_PACK_PRODUCAO
description: Pack para tasks em produção (produtos, ficha técnica, produção diária, vendas, perdas, importação)
type: context_pack
status: existente
ultima_atualizacao: 2026-04-30
---

# 🧰 Context pack — Produção

## Quando usar
Mexer em produtos finais, ficha técnica, registro de produção/vendas/perdas, ou importação de vendas via arquivo.

## Status resumido
- Schema `producao`.
- Produção diária baixa estoque dos ingredientes via ficha técnica (`SaidaProducao`).
- Vendas diárias **não** baixam estoque (a baixa é na produção).
- Modal animado de confirmação após sucesso (`ConfirmacaoProducaoModal.tsx`).

## Responsabilidades dos módulos
- [[MOD_PRODUTOS_FICHA_TECNICA]] — produto + composição.
- [[MOD_PRODUCAO_DIARIA]] — registro de produção (baixa estoque).
- [[MOD_VENDAS_DIARIAS]] — registro manual.
- [[MOD_IMPORTACAO_VENDAS]] — importação CSV/PDF + criação rápida de produto.
- [[MOD_PERDAS]] — perdas de produto pronto.
- [[MOD_CATEGORIAS_PRODUTO]] — agrupamento.

## Regras críticas
- [[REGRA_MOVIMENTACAO_RASTREAVEL]]
- [[REGRA_ENTRADA_ATUALIZA_CUSTO]] (sem custo no ingrediente, ficha = 0)
- [[REGRA_COLECAO_READONLY_DBUPDATE]] (`ItemFichaTecnica`)

## Arquivos / docs de referência
- `Application/{Produtos,ProducaoDiaria,VendasDiarias,ImportacaoVendas,Perdas,CategoriasProduto}/`
- `Domain/Entities/{Produto,ItemFichaTecnica,ProducaoDiaria,VendaDiaria,PerdaProduto,ImportacaoVendas}.cs`
- `frontend/src/features/producao/`
- `frontend/src/features/producao/producao-diaria/components/ConfirmacaoProducaoModal.tsx` (referência de modal)

## Cuidados
- Produção sem ficha técnica não baixa estoque → não permitir.
- `Produto.CalcularCustoFicha()` depende do custo do ingrediente.
- Importação: validar via FluentValidation antes do handler; deduplicar.

## Prompt curto
> "Task em produção (Casa di Ana ERP). Produção baixa estoque via ficha técnica; vendas não baixam. Modal animado de confirmação segue `ConfirmacaoProducaoModal.tsx`. Cuide do custo unitário (depende de [[REGRA_ENTRADA_ATUALIZA_CUSTO]])."
