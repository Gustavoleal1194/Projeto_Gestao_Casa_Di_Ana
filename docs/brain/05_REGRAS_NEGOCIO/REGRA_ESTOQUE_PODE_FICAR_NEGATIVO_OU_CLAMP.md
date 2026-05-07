---
name: REGRA_ESTOQUE_PODE_FICAR_NEGATIVO_OU_CLAMP
description: Estoque negativo é permitido pelo banco (constraint removida) e clampado em 0 pelo domínio
type: regra
status: existente
ultima_atualizacao: 2026-05-07
---

# Regra: estoque negativo (a_confirmar comportamento atual)

**Regra atual (declarada nos docs):**
- O banco **não** tem mais constraint CHECK de estoque ≥ 0 (migrations `RemoverCheckEstoqueNaoNegativo` e `RemoverCheckSaldoMovimentacaoNaoNegativo`).
- O **domínio** clampa em 0 (`AtualizarEstoque` não permite valor menor que 0 no resultado final).
- Migration `ZerarEstoqueNegativo` (2026-04-25) zerou saldos negativos pré-existentes.

**Why:** a cafeteria precisava registrar produções/vendas mesmo sem estoque suficiente refletindo a realidade operacional. Em paralelo, manter `0` como piso evita `EstoqueAtual` negativo aparecendo em telas e PDFs.

**How to apply:**
- Operações de saída chamam o método de domínio que clampa em 0.
- Relatórios podem assumir `EstoqueAtual >= 0`.

**Status:**
- ✅ **confirmado (2026-05-07)** — `Domain/Entities/Ingrediente.cs:107`: `EstoqueAtual = Math.Max(0, novoSaldo)`. Clamp em 0 garantido pelo domínio. Nenhum handler persiste valor negativo — todos passam pelo método `AtualizarEstoque`. Banco sem constraint é intencional (flexibilidade operacional); o piso 0 é responsabilidade do domínio, não do banco.

**Onde aplica:**
- [[MOD_INGREDIENTES]], [[MOD_PRODUCAO_DIARIA]], [[MOD_INVENTARIOS]].

**Evidências:**
- Migrations: `20260328035529_RemoverCheckEstoqueNaoNegativo`, `20260328035920_RemoverCheckSaldoMovimentacaoNaoNegativo`, `20260425125424_ZerarEstoqueNegativo`.
- `CasaDiAna/CLAUDE.md` (linha sobre clamp em 0).
- `Domain/Entities/Ingrediente.cs` (verificar `AtualizarEstoque`).
