---
name: MOD_PRODUTOS_FICHA_TECNICA
description: Produtos finais com ficha técnica (ingredientes por unidade produzida)
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 🍰 Módulo: Produtos + Ficha Técnica

## Status detectado
**existente** — CRUD + ficha técnica + modelo nutricional.

## Objetivo
Cadastrar produtos finais com a composição (ingrediente + qtd por unidade) usada para baixar estoque na produção.

## Fluxo geral
- Cadastrar produto (categoria, nome, dados nutricionais ANVISA).
- Editar ficha técnica: lista de `ItemFichaTecnica` (ingrediente + qtd + unidade).
- Custo do produto calculado pela ficha (`Produto.CalcularCustoFicha()`).

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/Produtos/`
- Domain: `Domain/Entities/Produto.cs`, `ItemFichaTecnica.cs`
- Frontend: `CasaDiAna/frontend/src/features/producao/produtos/`
- Recente: commit `feat(ficha-tecnica): adicionar modal de confirmação animado`
- Migrations relacionadas: `AddModuloProducao`, `AddCamposNutricionaisAnvisa`, `AddModeloEtiquetaNutricional`

## Regras relacionadas
- [[REGRA_ENTRADA_ATUALIZA_CUSTO]] (sem custo de ingrediente, ficha retorna 0)
- [[REGRA_SOFT_DELETE_NOMEEXISTE]]
- [[REGRA_COLECAO_READONLY_DBUPDATE]]

## Módulos relacionados
- [[MOD_INGREDIENTES]]
- [[MOD_PRODUCAO_DIARIA]]
- [[MOD_VENDAS_DIARIAS]]
- [[MOD_PERDAS]]
- [[MOD_ETIQUETAS]]

## Pontos de atenção
- Adicionar `ItemFichaTecnica` via `_db.Update(produto)` falha por causa do `private readonly List<T>` — usar repositório.
- Custo calculado dinamicamente; não persistir no `Produto`.

## O que NÃO fazer
- Não duplicar nomes considerando soft delete (filtrar `ativo = true`).
- Não permitir produzir produto sem ficha técnica (a_confirmar — verificar regra).
