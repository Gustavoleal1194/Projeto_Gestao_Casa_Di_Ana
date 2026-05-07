---
name: MOD_INGREDIENTES
description: Cadastro de ingredientes com estoque, mínimo/máximo, custo unitário, quantidade por embalagem
type: modulo
status: existente
ultima_atualizacao: 2026-05-07
ultima_revisao: 2026-05-07
---

# 🥚 Módulo: Ingredientes

## Status detectado
**existente** — CRUD completo + módulo de referência do frontend.

## Objetivo
Manter o cadastro central de ingredientes da cafeteria com estoque rastreável.

## Fluxo geral
- Cadastrar ingrediente: nome, unidade, categoria, mínimo, máximo, custo unitário.
- Editar (mantém histórico via movimentações para qualquer alteração de estoque).
- Soft delete (`ativo = false`).
- Estoque alterado por entrada de mercadoria, produção (saída), inventário, correção manual — sempre com `Movimentacao`.

## Campos especiais (atualizado 2026-05-07)

### `quantidadeEmbalagemValor` (decimal?, BD: `quantidade_embalagem_valor`) + `unidadeEmbalagem` (string?, BD: `unidade_embalagem`)
- Migration `20260507030643_RefatorarQuantidadeEmbalagem`: removeu `quantidade_embalagem` (varchar), adicionou `quantidade_embalagem_valor` (numeric 15,4 nullable) e `unidade_embalagem` (varchar 10 nullable, enum `"ml"` / `"g"`).
- Campo condicional no frontend: seção "Embalagem" só aparece quando a unidade selecionada é "Pacote" (flag `_ehPacote` oculto no schema).
- Validação cruzada via `superRefine`: se um dos dois estiver preenchido, o outro é obrigatório.
- Frontend: `quantidadeEmbalagemValor` usa `Controller` + `CampoTexto type="number"`; `unidadeEmbalagem` usa `Controller` + `SelectCampo` (opções `ml` / `g`).
- Backend FluentValidation: `.GreaterThan(0).When(...)` e `.Must(v => v == "ml" || v == "g").When(...)`.

### `codigoInterno` — auto-geração no frontend
- No modo criação: ao preencher ≥3 letras no nome, o código interno é sugerido automaticamente.
- Formato: iniciais das primeiras 3 palavras em maiúsculas + `-` + número aleatório 100-999. Ex: "Farinha de Trigo" → `FDT-437`.
- O usuário pode sobrescrever livremente; se apagar e o campo ficar vazio, a sugestão regenera ao digitar mais.
- Limite: 30 caracteres (Zod e FluentValidation alinhados).

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/Ingredientes/`
- Domain: `CasaDiAna/src/CasaDiAna.Domain/Entities/Ingrediente.cs`
- Repo: `CasaDiAna/src/CasaDiAna.Infrastructure/Repositories/IngredienteRepository.cs`
- Controller: `CasaDiAna/src/CasaDiAna.API/Controllers/IngredientesController.cs`
- Frontend: `CasaDiAna/frontend/src/features/estoque/ingredientes/`
- Plans: 3 etapas em `docs/superpowers/plans/2026-03-27-ingredientes-etapa{1,2,3}*.md`

## Regras relacionadas
- [[REGRA_MOVIMENTACAO_RASTREAVEL]]
- [[REGRA_ENTRADA_ATUALIZA_CUSTO]]
- [[REGRA_SOFT_DELETE_NOMEEXISTE]]
- [[REGRA_COLECAO_READONLY_DBUPDATE]]

## Módulos relacionados
- [[MOD_CATEGORIAS_INGREDIENTE]]
- [[MOD_UNIDADES_MEDIDA]]
- [[MOD_ENTRADAS]]
- [[MOD_INVENTARIOS]]
- [[MOD_CORRECAO_ESTOQUE]]
- [[MOD_NOTIFICACOES_ESTOQUE]]
- [[MOD_PRODUTOS_FICHA_TECNICA]]

## Pontos de atenção
- **Módulo de referência** do frontend: copiar a estrutura `pages/components/services` ao criar novos módulos.
- Estoque clampado em 0 pelo domínio (após `ZerarEstoqueNegativo`).
- Custo unitário é único por ingrediente — sem histórico (gap conhecido).

## O que NÃO fazer
- Não chamar `_db.Update(ingrediente)` para inserir filhos via `private readonly List<T>` — `DbUpdateConcurrencyException`. Inserir filhos pelo repositório.
- Não alterar `EstoqueAtual` sem criar `Movimentacao`.
- Não esquecer de filtrar `ativo = true` em `NomeExisteAsync`.
