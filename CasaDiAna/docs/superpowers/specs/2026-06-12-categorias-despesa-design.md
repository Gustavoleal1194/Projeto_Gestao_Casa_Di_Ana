# Categorias de Despesa gerenciáveis (CRUD) — Design

**Data:** 2026-06-12
**Status:** Aprovado (design) — aguardando revisão do spec
**Relacionado:** evolui o módulo de Despesas (redesenho de 2026-06-11).

---

## 1. Objetivo

Hoje a categoria de despesa é um **enum fixo** no código — o usuário não consegue criar
categorias próprias. Este trabalho transforma a categoria num **cadastro gerenciável**
(CRUD), como já existe para Categorias de Produto/Ingrediente, com a categoria pertencendo
a um **tipo (Fixa ou Variável)**.

---

## 2. Decisões de design (confirmadas)

| Tema | Decisão |
|---|---|
| Categoria | Vira entidade **`CategoriaDespesa`** (CRUD), espelhando `CategoriaProduto`. |
| Tipo | A **categoria** pertence a um `TipoDespesa` (Fixa/Variável). O **tipo da despesa passa a vir da categoria** (fonte única; remove o campo duplicado em `Despesa`). |
| Folha de pagamento | Flag `EhFolhaPagamento` na categoria (uma marcada por padrão) — preserva o **prime cost** do Fechamento com categorias dinâmicas. |
| UI de gestão | Modal **"Gerenciar categorias"** na tela Despesas (em contexto), filtrado pelo tipo do toggle. |
| Permissões | Admin + Coordenador (mantém). |

---

## 3. Modelo de dados

### 3.1 Nova entidade `CategoriaDespesa`
```
Id (Guid)
Nome (string, obrigatório, único entre ativas)
Tipo (TipoDespesa: Fixa | Variavel)
EhFolhaPagamento (bool)
Ativo (bool)  -- soft delete
CriadoEm/Por, AtualizadoEm/Por
```
Métodos `Criar(nome, tipo, ehFolhaPagamento, criadoPor)`, `Atualizar(nome, tipo, ehFolhaPagamento, atualizadoPor)`, `Desativar(atualizadoPor)`.

### 3.2 `Despesa` (alteração)
- **Remove** os campos enum `Categoria` (`CategoriaDespesa` enum) e `Tipo` (`TipoDespesa`).
- **Adiciona** `CategoriaDespesaId` (Guid, FK) + navegação `CategoriaDespesa? Categoria`.
- `Criar`/`Atualizar` passam a receber `categoriaDespesaId` (sem tipo/categoria enum).
- O **tipo da despesa** é derivado de `Categoria.Tipo` (não é armazenado em `Despesa`).

### 3.3 Enums
- **Remove** o enum `CategoriaDespesa` (substituído pela entidade homônima).
- **Mantém** `TipoDespesa { Fixa=1, Variavel=2 }` (agora usado por `CategoriaDespesa`).

### 3.4 `TotalCategoriaDto` (muda de forma)
`(Guid CategoriaId, string CategoriaNome, decimal Total)` — antes era `(CategoriaDespesa Categoria, decimal Total)`. Usado por `DespesasMesDto` e `FechamentoMensalDto`.

---

## 4. Migration `AddCategoriasDespesa` (preserva dados)

1. Cria `financeiro.categorias_despesa`.
2. **Semeia as 15 categorias atuais** com GUIDs fixos, tipo e flag de folha:
   - Fixa: Aluguel, Folha de pagamento (`EhFolhaPagamento=true`), Água, Energia, Gás, Internet, Contabilidade, Manutenção, Sistema, Marketing, Outros.
   - Variável: Taxa de cartão, Comissão delivery, Embalagens, Frete.
3. Adiciona `categoria_despesa_id` (uuid, FK → categorias_despesa, `OnDelete Restrict`).
4. **Backfill**: `UPDATE despesas SET categoria_despesa_id = <guid semeado> WHERE categoria = <int enum>` para os 15 valores.
5. Remove as colunas antigas `categoria` e `tipo` de `despesas`.
6. `categoria_despesa_id` vira `NOT NULL` após o backfill.

> A migration é escrita à mão (insert/seed + backfill + drop) — preserva as despesas existentes.

---

## 5. Backend — casos de uso

### 5.1 Módulo `Application/CategoriasDespesa` (espelha `CategoriasProduto`)
- `CriarCategoriaDespesaCommand(Nome, Tipo, EhFolhaPagamento)` → `CategoriaDespesaDto`
- `AtualizarCategoriaDespesaCommand(Id, Nome, Tipo, EhFolhaPagamento)` → DTO
- `DesativarCategoriaDespesaCommand(Id)` → Unit (soft delete)
- `ListarCategoriasDespesaQuery(Tipo?, ApenasAtivas=true)` → `IReadOnlyList<CategoriaDespesaDto>`
- `CategoriaDespesaDto(Id, Nome, Tipo, EhFolhaPagamento, Ativo)`
- Validators: `Nome` obrigatório/≤100, `Tipo` válido. Unicidade de nome entre ativas via `NomeExisteAsync` (filtra `Ativo`).
- Repositório `ICategoriaDespesaRepository` (Obter, Listar, NomeExiste, Adicionar, Atualizar, Salvar).

### 5.2 `Despesas` (ajuste)
- `CriarDespesaCommand(Competencia, CategoriaDespesaId, Descricao, Valor, Observacao, DataLancamento)` (sem tipo/categoria enum).
- `AtualizarDespesaCommand(Id, CategoriaDespesaId, …)`.
- Handlers validam categoria existente e ativa (`DomainException` se não).
- `DespesaDto(Id, Competencia, CategoriaDespesaId, CategoriaNome, Tipo, Descricao, Valor, Observacao, DataLancamento, Ativo)` — `Tipo`/`CategoriaNome` vêm da categoria.
- `ListarDespesasQuery(Competencia, Tipo?)`: repositório carrega `Include(d => d.Categoria)`; totais fixas/variáveis e `TotalPorCategoria` agrupados por `Categoria.Tipo` / categoria.

### 5.3 Fechamento (ajuste, mantém semântica)
- Carrega despesas com `Include(Categoria)`.
- `TotalDespesasFixas` = soma onde `Categoria.Tipo == Fixa`; `TotalDespesasVariaveis` onde `Variavel`.
- `FolhaPagamento` = soma onde `Categoria.EhFolhaPagamento`.
- `DespesaFixaPercentual` = `TotalDespesasFixas / faturamento` — **inalterado** → **precificação não muda**.
- `DespesasPorCategoria` usa o novo `TotalCategoriaDto` (id/nome).

### 5.4 API
- Novo `CategoriasDespesaController` (`api/categorias-despesa`), `[Authorize(Roles="Admin,Coordenador")]`: GET (lista, filtro `?tipo=`), POST, PUT, DELETE.
- `DespesasController`: body passa a usar `categoriaDespesaId` (sem tipo/categoria). `GET /despesas` e `GET /despesas/compras` inalterados de rota.

---

## 6. Frontend

### 6.1 Gestão de categorias
- Botão **"Gerenciar categorias"** na tela Despesas → modal `ModalGerenciarCategorias`: lista categorias do **tipo do toggle** (Fixa/Variável), com adicionar/editar/remover (nome + checkbox "é folha de pagamento"). Reaproveita o padrão de `Categorias de Produto`.
- `categoriasDespesaService` (listar por tipo, criar, atualizar, desativar).

### 6.2 Formulário de despesa
- O dropdown de categoria passa a ser **dinâmico**: carrega as categorias **ativas do tipo selecionado** via API. `DespesaInput = { competencia, categoriaDespesaId, descricao, valor, observacao, dataLancamento }` (sem tipo/categoria enum — o tipo vem da categoria).
- Se não houver categoria do tipo, o modal orienta a criar uma primeiro.

### 6.3 Tabela/labels
- A coluna "Categoria" mostra `categoriaNome` do DTO (não mais label de enum). Remove `CATEGORIA_DESPESA_LABELS`/opções estáticas de `shared/competencia.ts` (mantém `TIPO_DESPESA_LABELS`, formatadores e helpers de competência).

---

## 7. Validações e casos-limite
- Nome de categoria obrigatório, ≤100, único entre ativas.
- Categoria em uso: **soft delete** (`Ativo=false`) só a esconde de novos lançamentos; despesas existentes continuam resolvendo a categoria (carregada por id, independente de `Ativo`). FK `Restrict` impede exclusão física.
- Despesa exige `categoriaDespesaId` de categoria **ativa** (validado no handler) — `Tipo` obrigatório válido na categoria.
- Mês sem despesas/categorias → totais 0, EmptyState; dropdown vazio orienta criar categoria.
- Prime cost: soma das despesas cujas categorias têm `EhFolhaPagamento` (seed marca só "Folha de pagamento").
- Migration preserva dados via seed + backfill por GUID fixo.

---

## 8. Critérios de aceite
- [ ] Criar/editar/remover categoria de despesa (Fixa ou Variável) pela tela Despesas.
- [ ] Dropdown de categoria no lançamento é dinâmico e filtrado pelo tipo.
- [ ] Lançar despesa usando categoria cadastrada; o tipo da despesa vem da categoria.
- [ ] Listagem e fechamento separam fixas/variáveis pela categoria; prime cost via flag de folha.
- [ ] `DespesaFixaPercentual` continua só fixas → precificação inalterada.
- [ ] Migration semeia as 15 categorias e faz backfill sem perder despesas existentes.
- [ ] Categorias antigas (enum) viram registros editáveis; é possível adicionar novas.

---

## 9. Testes
- **Backend** (`CasaDiAna.Application.Tests`): CRUD de `CategoriaDespesa` (criar com tipo+folha, nome duplicado bloqueado, desativar); `CriarDespesaCommandHandler` validando categoria ativa; `ListarDespesasQuery` separando totais por `Categoria.Tipo`; `ObterFechamentoMensalQueryHandler` cobrindo folha via flag e fixa/variável via categoria.
- **Frontend**: tsc + lint.
- **E2E** (staging): criar categoria variável nova; lançar despesa nela; conferir listagem/fechamento; conferir que a folha (flag) alimenta o prime cost; confirmar precificação intacta.

---

## 10. Pendências / validar com dados reais
- Permitir mais de uma categoria marcada como folha? (hoje a soma cobre todas as marcadas — seed marca só uma.)
- Reaproveitar (ou não) os nomes/acentos exatos das categorias semeadas conforme o cliente usa.

---

## 11. Fora de escopo (YAGNI)
Cor/ícone por categoria; ordenação manual; categorias por usuário; mexer em Entradas, ficha
técnica ou no rateio de precificação.
