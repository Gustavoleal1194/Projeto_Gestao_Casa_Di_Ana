---
name: DEC_ESTOQUE_ZERAR_NEGATIVO
description: Saldos negativos pré-existentes foram zerados; domínio passa a clampar em 0
type: decisao
status: existente
ultima_atualizacao: 2026-04-30
data_decisao: 2026-04-25
---

# Decisão: zerar estoque negativo + clamp no domínio

**Decisão:** em 2026-04-25 a migration `ZerarEstoqueNegativo` zerou todos os saldos negativos. O domínio (`Ingrediente.AtualizarEstoque`) passa a clampar em 0.

**Why:**
- Permitir negativo no banco era para refletir realidade operacional, mas relatórios e dashboards ficaram com números difíceis de interpretar.
- Clampar em 0 no domínio mantém a flexibilidade (registrar produção sem estoque) mas garante UX consistente.

**Coexistência com migrations anteriores:**
- `RemoverCheckEstoqueNaoNegativo` (2026-03-28) removeu a constraint do banco.
- `ZerarEstoqueNegativo` (2026-04-25) corrigiu dados pendentes.
- Combinação: banco aceita negativo, domínio não persiste negativo.

**Onde aplica:** [[MOD_INGREDIENTES]], [[MOD_PRODUCAO_DIARIA]], [[MOD_INVENTARIOS]], [[MOD_CORRECAO_ESTOQUE]].

**Status:** **existente** — confirmar exatamente o método de domínio em [[OPEN_LOOP_ESTOQUE_NEGATIVO]].
