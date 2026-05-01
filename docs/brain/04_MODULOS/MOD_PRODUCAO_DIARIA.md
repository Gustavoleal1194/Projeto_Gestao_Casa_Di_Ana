---
name: MOD_PRODUCAO_DIARIA
description: Registro de produção diária — baixa de estoque automática via ficha técnica
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 🥐 Módulo: Produção Diária

## Status detectado
**existente** — com modal de confirmação animado (referência do padrão).

## Objetivo
Registrar quanto foi produzido por dia/produto e abater os ingredientes do estoque proporcionalmente à ficha técnica.

## Fluxo geral
1. Selecionar produto + qtd produzida + data.
2. Para cada `ItemFichaTecnica`:
   - calcula `qtd × itemFicha.Quantidade`;
   - cria `Movimentacao` `SaidaProducao` referenciando a produção;
   - chama `Ingrediente.AtualizarEstoque(-quantidade)`.
3. Custo da produção calculado via ficha técnica.
4. Modal animado de confirmação no frontend.

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/ProducaoDiaria/`
- Domain: `Domain/Entities/ProducaoDiaria.cs`
- Frontend: `CasaDiAna/frontend/src/features/producao/producao-diaria/`
- Componente referência: `frontend/src/features/producao/producao-diaria/components/ConfirmacaoProducaoModal.tsx`
- Plans: `docs/superpowers/plans/2026-04-24-confirmacoes-venda-producao.md`

## Regras relacionadas
- [[REGRA_MOVIMENTACAO_RASTREAVEL]]
- [[REGRA_ENTRADA_ATUALIZA_CUSTO]] (impacta custo de produção)

## Módulos relacionados
- [[MOD_PRODUTOS_FICHA_TECNICA]]
- [[MOD_VENDAS_DIARIAS]]
- [[MOD_PERDAS]]
- [[MOD_RELATORIOS]] (Produção vs Vendas, Insumos)

## Pontos de atenção
- Estoque pode ficar negativo (constraint check removida, mas há clamp em 0 no domínio — confirmar comportamento atual).
- `ConfirmacaoProducaoModal.tsx` é o **template** que outros formulários estão sendo migrados para imitar (ver plan 2026-04-29).

## O que NÃO fazer
- Não registrar produção sem ficha técnica (sem ela não há baixa de estoque coerente).
