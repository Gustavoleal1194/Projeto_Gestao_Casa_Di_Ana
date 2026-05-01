---
name: DEC_SOFT_DELETE
description: Entidades com referência transversal usam soft delete via coluna ativo
type: decisao
status: existente
ultima_atualizacao: 2026-04-30
---

# Decisão: soft delete

**Decisão:** entidades que aparecem como referência em outras (categoria, ingrediente, fornecedor, produto, usuário) **não são apagadas** — recebem `ativo = false`.

**Why:**
- Histórico operacional precisa preservar referências antigas.
- Hard delete quebraria entradas, produções, vendas anteriores.

**How to apply:**
- Listagens padrão filtram `ativo = true`.
- `NomeExisteAsync` também filtra `ativo = true` (ver [[REGRA_SOFT_DELETE_NOMEEXISTE]]).
- "Excluir" no UI vira "Desativar".

**Onde aplica:**
- `CategoriaIngrediente`, `CategoriaProduto`, `Ingrediente`, `Fornecedor`, `Produto`, `Usuario`.
