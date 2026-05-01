---
name: CONTEXT_PACK_ETIQUETAS
description: Pack para tasks em etiquetas (Completa, Simples, Nutricional ANVISA)
type: context_pack
status: existente
ultima_atualizacao: 2026-04-30
---

# 🧰 Context pack — Etiquetas

## Quando usar
Imprimir etiqueta, alterar layout, ajustar tabela nutricional, manter histórico.

## Status resumido
- Três tipos com tamanhos fixos (100×80, 70×30, 80×130 mm).
- Modelo nutricional persistido por produto (`ModeloEtiquetaNutricional`).
- Histórico de impressões registrado por produto.
- ANVISA: campos nutricionais padronizados (`AddCamposNutricionaisAnvisa`).

## Regras críticas
- Não imprimir etiqueta nutricional sem ficha técnica.
- Tamanhos fixos — não alterar sem revisar impressoras-alvo.

## Arquivos / docs de referência
- `Application/Etiquetas/`, `Domain/Entities/{HistoricoImpressaoEtiqueta,ModeloEtiquetaNutricional}.cs`.
- `frontend/src/features/etiquetas/`, `lib/etiquetasService.ts`.
- Plan: `docs/superpowers/plans/2026-04-04-modulo-etiquetagem.md`.

## Cuidados
- Persistir modelo nutricional ao salvar.
- Registrar histórico em toda impressão.

## Prompt curto
> "Task em etiquetas do Casa di Ana ERP. Três tipos (Completa, Simples, Nutricional ANVISA). Modelo nutricional é persistido por produto. Não imprimir sem ficha técnica."
