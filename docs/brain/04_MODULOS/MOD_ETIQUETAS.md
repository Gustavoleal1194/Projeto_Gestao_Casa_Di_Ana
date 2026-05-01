---
name: MOD_ETIQUETAS
description: Geração e impressão de etiquetas (Completa, Simples, Nutricional ANVISA)
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 🏷️ Módulo: Etiquetas

## Status detectado
**existente** — três tipos, com modelo nutricional persistido por produto e histórico.

## Objetivo
Padronizar e imprimir etiquetas para produtos e ingredientes em diferentes formatos.

## Tipos
| Tipo         | Tamanho      | Uso                                                        |
| ------------ | ------------ | ---------------------------------------------------------- |
| Completa     | 100×80 mm    | Logo, nome, fabricação, validade — impressora colorida     |
| Simples      | 70×30 mm     | Nome + validade — impressora térmica (produtos e ingredientes) |
| Nutricional  | 80×130 mm    | Tabela ANVISA com %VD                                      |

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/Etiquetas/`
- Domain: `Domain/Entities/HistoricoImpressaoEtiqueta.cs`, `ModeloEtiquetaNutricional.cs`, enum `TipoEtiqueta`
- Frontend: `CasaDiAna/frontend/src/features/etiquetas/` + `frontend/src/lib/etiquetasService.ts`
- Plans: `docs/superpowers/plans/2026-04-04-modulo-etiquetagem.md`
- Migrations: `AddHistoricoImpressaoEtiquetas`, `AddModeloEtiquetaNutricional`, `AddCamposNutricionaisAnvisa`

## Regras relacionadas
- (PDF) usa `jspdf` + `jspdf-autotable`.

## Módulos relacionados
- [[MOD_PRODUTOS_FICHA_TECNICA]]
- [[MOD_INGREDIENTES]]
- [[MOD_RELATORIOS]] (PDF)

## Pontos de atenção
- Modelo nutricional **por produto** é salvo no banco e recarregado ao abrir.
- Histórico de impressões registra por produto.

## O que NÃO fazer
- Não inventar campos nutricionais fora dos normalizados pela ANVISA (migration `AddCamposNutricionaisAnvisa`).
- Não imprimir produto sem ficha técnica para etiqueta nutricional.
