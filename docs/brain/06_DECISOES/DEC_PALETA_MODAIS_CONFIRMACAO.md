---
name: DEC_PALETA_MODAIS_CONFIRMACAO
description: Decisão de usar âmbar como única cor de acento em todos os modais de confirmação
type: decisao
status: existente
data: 2026-04-30
---

# Decisão: Paleta âmbar como padrão único nos modais de confirmação

## Contexto

Ao implementar modais de confirmação animados em todos os formulários (plan 2026-04-29), cada modal recebeu uma cor de acento diferente por módulo:
- Ingredientes → verde (#16A34A)
- Produto → azul (#2563EB)
- Perdas → vermelho (#DC2626)
- Fornecedor → teal (#0891B2)
- Inventário Início → roxo (#7C3AED)

## Decisão

**Todos os modais de confirmação usam âmbar `#D4960C` como única cor de acento.** Cores por módulo foram removidas.

## Motivo

O Design System do projeto (`design_libs/confirmation_animations/README.md`) define *Brand amber* como cor primária da identidade visual. A referência validada (`ConfirmacaoProducaoModal.tsx`) usa âmbar. Cores semânticas por módulo fragmentam a identidade e não foram especificadas no DS.

## Impacto

8 arquivos corrigidos (2026-04-30):
- `ConfirmacaoIngredienteModal.tsx` — verde → âmbar; fontSize 22; chip 16
- `ConfirmacaoProdutoModal.tsx` — azul → âmbar; fontSize 22
- `ConfirmacaoPerdasModal.tsx` — vermelho → âmbar; chip 16; info box âmbar
- `ConfirmacaoFornecedorModal.tsx` — teal → âmbar; fontSize 22; info box âmbar
- `ConfirmacaoInicioInventarioModal.tsx` — roxo → âmbar; fontSize 22; info box âmbar
- `ConfirmacaoFinalizacaoInventarioModal.tsx` — verde → âmbar; adicionado botão secundário "Fechar"
- `ConfirmacaoFichaTecnicaModal.tsx` — fontSize 20 → 22
- `ConfirmacaoVendaModal.tsx` — checkmark verde → âmbar; label âmbar

## O que NÃO fazer

Não criar variantes coloridas de modais de confirmação por módulo. Se for necessário distinguir semântica (ex: ação destrutiva), usar texto e ícone, não cor de acento.
