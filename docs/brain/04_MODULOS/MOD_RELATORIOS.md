---
name: MOD_RELATORIOS
description: 5 relatórios operacionais com exportação PDF
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 📊 Módulo: Relatórios

## Status detectado
**existente** — cinco relatórios, todos com PDF.

## Lista
1. **Estoque Atual** — posição de todos os ingredientes; filtro "abaixo do mínimo".
2. **Movimentações** — entradas/saídas com filtros por data, tipo, ingrediente.
3. **Entradas** — resumo de entradas por período.
4. **Produção vs Vendas** — comparativo por produto/período.
5. **Insumos de Produção** — consumo de ingredientes por período, filtros por produto/ingrediente.

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/Relatorios/`
- Controller: `API/Controllers/RelatoriosController.cs`
- Frontend: `CasaDiAna/frontend/src/features/relatorios/` + `frontend/src/lib/pdf.ts`

## Regras relacionadas
- [[REGRA_FILTROS_DATA_EXCLUSIVO]] — `m.CriadoEm < ate.Date.AddDays(1)`

## Módulos relacionados
- todos os módulos de estoque, produção, vendas

## Pontos de atenção
- Exportação Excel ainda não existe (gap conhecido).
- Filtros de data sempre exclusivos no fim.

## O que NÃO fazer
- Não usar `<= ate` no filtro de data — quebra registros do dia inteiro.
- Não introduzir cálculos de negócio aqui que pertencem ao domínio.
