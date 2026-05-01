---
name: CONTEXT_PACK_RELATORIOS
description: Pack para tasks em relatórios (5 tipos com PDF)
type: context_pack
status: existente
ultima_atualizacao: 2026-04-30
---

# 🧰 Context pack — Relatórios

## Quando usar
Adicionar/alterar relatório, ajustar filtros, gerar PDF.

## Status resumido
- 5 relatórios: Estoque Atual, Movimentações, Entradas, Produção vs Vendas, Insumos.
- PDF via `jspdf` + `jspdf-autotable` no frontend (`lib/pdf.ts`).
- Não há exportação Excel.

## Regras críticas
- [[REGRA_FILTROS_DATA_EXCLUSIVO]] — `< ate.Date.AddDays(1)`.
- Não introduzir regra de domínio nos handlers de relatório (são queries).

## Arquivos / docs de referência
- Backend: `Application/Relatorios/`, `API/Controllers/RelatoriosController.cs`.
- Frontend: `features/relatorios/`, `lib/pdf.ts`.

## Cuidados
- Filtrar movimentações por tipo, ingrediente e período.
- Performance: paginar / agregar no backend; evitar carregar tudo.
- Exportar PDF respeitando layout (logo, cabeçalho, paginação).

## Prompt curto
> "Task em relatórios do Casa di Ana ERP. Use `m.CriadoEm < ate.Date.AddDays(1)` para incluir o dia inteiro. Os 5 relatórios existentes estão em `Application/Relatorios/Queries/`. PDF é gerado no frontend via `lib/pdf.ts`."
