---
name: REGRA_MOVIMENTACAO_RASTREAVEL
description: Toda alteração de EstoqueAtual exige uma Movimentação com ReferenciaTipo + ReferenciaId
type: regra
status: existente
ultima_atualizacao: 2026-04-30
---

# Regra: movimentação rastreável

**Regra:** sempre que `Ingrediente.EstoqueAtual` for alterado, gerar uma `Movimentacao` com:
- `TipoMovimentacao` (Entrada, AjustePositivo, AjusteNegativo, SaidaProducao)
- `ReferenciaTipo` (string identificando a origem; ex.: `"EntradaMercadoria"`, `"Inventario"`, `"ProducaoDiaria"`, `"CorrecaoEstoque"`)
- `ReferenciaId` (GUID do agregado de origem)

**Why:** rastreabilidade é o coração da auditoria de estoque. Sem isso, divergências entre saldo e operações ficam impossíveis de investigar.

**How to apply:**
- Toda chamada a `AtualizarEstoque()` deve estar **acompanhada** da criação da movimentação no mesmo handler.
- Cancelamentos devem **estornar** com uma movimentação inversa, **não apagar** a original.

**Onde aplica:**
- [[MOD_ENTRADAS]], [[MOD_INVENTARIOS]], [[MOD_PRODUCAO_DIARIA]], [[MOD_CORRECAO_ESTOQUE]].

**Evidências:** `Domain/Entities/Movimentacao.cs`, `Application/.../Commands/Registrar*.cs`.
