---
name: DEC_EF_SNAKE_CASE_EXPLICITO
description: Mapear toda coluna explicitamente em snake_case via IEntityTypeConfiguration<T>
type: decisao
status: existente
ultima_atualizacao: 2026-04-30
---

# Decisão: snake_case explícito no EF

**Decisão:** todo nome de tabela e coluna é mapeado **explicitamente** com `HasColumnName(...)` em `IEntityTypeConfiguration<T>` (Configurations/). Sem convenções automáticas.

**Why:**
- PostgreSQL é case-sensitive em quote — mapeamento implícito por convenção do EF gera identifiers `PascalCase` que precisam de aspas no SQL.
- Migrations geradas ficam previsíveis e legíveis.
- Refatorar nome de propriedade C# **não** quebra a coluna (sem duplo trabalho).

**Onde aplica:**
- Toda entidade no `AppDbContext`.

**Evidências:** `CasaDiAna/src/CasaDiAna.Infrastructure/Persistence/Configurations/`, `CasaDiAna/docs/BANCO_DE_DADOS.md`.
