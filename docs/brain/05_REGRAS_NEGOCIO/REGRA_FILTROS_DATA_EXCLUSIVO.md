---
name: REGRA_FILTROS_DATA_EXCLUSIVO
description: Filtro de data superior é exclusivo no nível do dia (ate.Date.AddDays(1))
type: regra
status: existente
ultima_atualizacao: 2026-04-30
---

# Regra: filtros de data — limite superior exclusivo

**Regra:** ao filtrar por intervalo de data inclusivo no nível do dia, usar:

```csharp
m.CriadoEm < ate.Date.AddDays(1)
```

**Why:** `<= ate` ignora registros das horas posteriores a `00:00:00` daquele dia, perdendo movimentações reais. Esta regra está documentada explicitamente no README e no CLAUDE.md.

**How to apply:**
- Sempre normalizar `ate` para data (sem hora) e somar 1 dia.
- Aplicar em handlers de relatório e listagens com filtro de período.

**Onde aplica:**
- [[MOD_RELATORIOS]] (todos), listagens com filtro de data em qualquer módulo.

**Evidências:** `Application/Relatorios/Queries/*.cs`.
