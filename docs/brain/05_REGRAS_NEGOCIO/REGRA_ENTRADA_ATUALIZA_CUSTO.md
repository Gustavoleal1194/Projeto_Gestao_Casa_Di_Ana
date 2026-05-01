---
name: REGRA_ENTRADA_ATUALIZA_CUSTO
description: Ao registrar entrada, chamar AtualizarEstoque + AtualizarCusto no Ingrediente
type: regra
status: existente
ultima_atualizacao: 2026-04-30
---

# Regra: entrada atualiza estoque **e** custo

**Regra:** ao registrar entrada de mercadoria, o handler deve chamar **tanto** `Ingrediente.AtualizarEstoque(qtd, +)` **quanto** `Ingrediente.AtualizarCusto(custo)`.

**Why:** sem custo atualizado, o cálculo de ficha técnica em `Produto.CalcularCustoFicha()` retorna **zero**, o que invalida relatórios financeiros e tabelas de produção.

**How to apply:**
- Sempre que houver `ItemEntradaMercadoria` confirmado, atualizar custo unitário pelo valor do item.
- Se o sistema evoluir para histórico de custos, manter compatibilidade desta regra (custo "atual" continua sendo o do último item processado).

**Onde aplica:**
- [[MOD_ENTRADAS]] (ver [[MOD_PRODUTOS_FICHA_TECNICA]] como consumidor downstream).

**Evidências:** `Application/Entradas/Commands/RegistrarEntrada*.cs`, `Domain/Entities/Ingrediente.cs`.
