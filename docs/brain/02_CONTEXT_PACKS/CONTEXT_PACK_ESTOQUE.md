---
name: CONTEXT_PACK_ESTOQUE
description: Pack para tasks na área de estoque (ingredientes, entradas, inventários, correção, notificações)
type: context_pack
status: existente
ultima_atualizacao: 2026-04-30
---

# 🧰 Context pack — Estoque

## Quando usar
Mexer em qualquer fluxo que altere `EstoqueAtual` ou cadastre cadeia de suprimentos: ingredientes, fornecedores, entradas, inventários, correções, notificações.

## Status resumido
- Schema `estoque` no Postgres.
- Toda alteração de estoque cria `Movimentacao` com `ReferenciaTipo`+`ReferenciaId`.
- Domínio clampa em 0 (`Ingrediente.AtualizarEstoque`).
- Notificações automáticas (`Atenção`, `Crítico`, `Zerado`).
- Inventário: `EmAndamento → Finalizado | Cancelado`.

## Responsabilidades dos módulos
- [[MOD_INGREDIENTES]] — cadastro central (com soft delete).
- [[MOD_FORNECEDORES]] — fornecedores das entradas.
- [[MOD_ENTRADAS]] — entrada de NF, atualiza estoque + custo.
- [[MOD_INVENTARIOS]] — contagem física, gera ajustes.
- [[MOD_CORRECAO_ESTOQUE]] — ajuste manual em lote.
- [[MOD_NOTIFICACOES_ESTOQUE]] — alertas automáticos.

## Regras críticas
- [[REGRA_MOVIMENTACAO_RASTREAVEL]]
- [[REGRA_ENTRADA_ATUALIZA_CUSTO]]
- [[REGRA_SOFT_DELETE_NOMEEXISTE]]
- [[REGRA_COLECAO_READONLY_DBUPDATE]]
- [[REGRA_ESTOQUE_PODE_FICAR_NEGATIVO_OU_CLAMP]] (a_confirmar)

## Arquivos / docs de referência
- `Application/{Ingredientes,Fornecedores,Entradas,Inventarios,Estoque,Notificacoes}/`
- `Domain/Entities/{Ingrediente,Movimentacao,EntradaMercadoria,Inventario,...}.cs`
- `frontend/src/features/estoque/`, `features/entradas/`, `features/inventarios/`, `features/fornecedores/`, `features/notificacoes/`

## Cuidados
- Toque em estoque sem `Movimentacao` é bug.
- Não cancelar entrada sem estornar a movimentação.
- Notificações: na alteração da regra (1.5×, =, =0), atualizar [[MOD_NOTIFICACOES_ESTOQUE]] e o service.

## Prompt curto
> "Task na área de estoque do Casa di Ana ERP. Toda mudança de `EstoqueAtual` exige `Movimentacao` rastreável. Entrada chama `AtualizarEstoque` + `AtualizarCusto`. Soft delete em ingrediente/fornecedor/categorias. Veja [[MOD_INGREDIENTES]] como referência."
