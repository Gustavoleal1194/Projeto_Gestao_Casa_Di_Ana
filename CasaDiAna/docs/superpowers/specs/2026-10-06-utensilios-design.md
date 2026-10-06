# Cadastro de Utensílios + Entrada via Notas

**Data:** 2026-10-06
**Status:** Aprovado (design) — aguardando revisão do spec

---

## 1. Contexto e objetivo

O sistema só cadastra **Ingredientes** para dar entrada via Entradas de Mercadoria.
Na prática, o mesmo fluxo de "nota que chega do fornecedor" também traz **produtos de
limpeza, embalagens e outros utensílios** que hoje não têm onde ser lançados — ou são
ignorados, ou forçados (errado) dentro do cadastro de Ingrediente.

Esta feature cria um cadastro de **Utensílio**, paralelo a Ingrediente, com categoria
própria, e permite lançá-lo na **mesma nota** de Entrada de Mercadoria junto com
ingredientes.

---

## 2. Decisões de design (confirmadas)

| Tema | Decisão |
|---|---|
| Categoria | **Entidade própria `CategoriaUtensilio`** — não reaproveita `CategoriaIngrediente`. Segue o padrão já replicado 2x no projeto (`CategoriaProduto`, `CategoriaDespesa`): cada domínio tem sua categoria. |
| Mistura na nota | **Sim.** Uma `EntradaMercadoria` pode ter itens de ingrediente **e** de utensílio juntos — reflete a nota fiscal real do fornecedor. |
| Escopo desta entrega | **Só cadastro + entrada.** Correção de Estoque, Inventário Físico e Notificação de estoque baixo continuam exclusivos de Ingrediente (ver §13 — fora de escopo). |
| Campos do Utensílio | Nome, categoria, unidade de medida, estoque mínimo/máximo, **código interno**, custo unitário (atualizado pela entrada). Sem campos de embalagem/ficha técnica (não se aplicam). |
| Movimentação (histórico) | **Entidade própria `MovimentacaoUtensilio`**, não FK dupla nullable na `Movimentacao` existente — mesmo padrão de "uma entidade por domínio". |
| Permissões | Mesmas de Ingrediente hoje (autenticado; sem restrição extra de papel). |

---

## 3. Modelo de dados (Domain)

### 3.1 Entidade `CategoriaUtensilio`

Cópia exata de `CategoriaIngrediente`:

| Campo | Tipo | Regras |
|---|---|---|
| `Id` | `Guid` | |
| `Nome` | `string` | obrigatório, único entre ativas |
| `Ativo` | `bool` | soft delete |
| `CriadoEm`/`Por`, `AtualizadoEm`/`Por` | | auditoria |

Métodos: `Criar(nome, criadoPor)`, `Atualizar(nome, atualizadoPor)`, `Desativar(atualizadoPor)`.

### 3.2 Entidade `Utensilio`

Mirror simplificado de `Ingrediente` (sem `QuantidadeEmbalagemValor`/`UnidadeEmbalagem`,
que só fazem sentido para insumo de receita):

| Campo | Tipo | Regras |
|---|---|---|
| `Id` | `Guid` | |
| `Nome` | `string` | obrigatório |
| `CodigoInterno` | `string?` | opcional, único quando informado |
| `CategoriaUtensilioId` | `Guid?` | opcional |
| `UnidadeMedidaId` | `short` | obrigatório (FK para `UnidadeMedida`, tabela já existente e compartilhada) |
| `EstoqueAtual` | `decimal` | gerido só por `AtualizarEstoque`, nunca editado direto |
| `EstoqueMinimo` | `decimal` | **≥ 0** |
| `EstoqueMaximo` | `decimal?` | quando informado, **≥ EstoqueMinimo** |
| `CustoUnitario` | `decimal?` | atualizado a cada entrada; **≥ 0** |
| `Ativo` | `bool` | soft delete |
| `CriadoEm`/`Por`, `AtualizadoEm`/`Por` | | auditoria |

Navegação: `UnidadeMedida?`, `CategoriaUtensilio?`.

Métodos (idênticos em forma aos de `Ingrediente`): `Criar(...)`, `Atualizar(...)`,
`Desativar(atualizadoPor)`, `AtualizarEstoque(novoSaldo, atualizadoPor)` (clamp em 0,
`Math.Max(0, novoSaldo)` — mesma regra do domínio de Ingrediente),
`AtualizarCusto(custoUnitario, atualizadoPor)`, `EstaBaixoDoMinimo()`.

### 3.3 Entidade `MovimentacaoUtensilio`

Cópia de `Movimentacao`, trocando `IngredienteId` por `UtensilioId`:

| Campo | Tipo |
|---|---|
| `Id` | `Guid` |
| `UtensilioId` | `Guid` |
| `Tipo` | `TipoMovimentacao` (reusa o enum existente — só `Entrada` é emitido nesta entrega) |
| `Quantidade` | `decimal` |
| `SaldoApos` | `decimal` |
| `ReferenciaTipo` | `string?` (`"EntradaMercadoria"`) |
| `ReferenciaId` | `Guid?` |
| `Observacoes` | `string?` |
| `CriadoEm`/`CriadoPor` | auditoria |

Sem endpoint de consulta nesta entrega (não há relatório de movimentações de utensílio
pedido) — existe para não perder o histórico de estoque desde já, consistente com a
regra do projeto "toda alteração de estoque exige um registro de movimentação".

### 3.4 `EntradaMercadoria` e `ItemEntradaUtensilio` (aditivo, sem breaking change)

Nova entidade filha, irmã de `ItemEntradaMercadoria`:

| Campo | Tipo |
|---|---|
| `Id` | `Guid` |
| `EntradaId` | `Guid` |
| `UtensilioId` | `Guid` |
| `Quantidade` | `decimal` (> 0) |
| `CustoUnitario` | `decimal` (≥ 0) |
| `CustoTotal` | computado: `Quantidade * CustoUnitario` |

`EntradaMercadoria` ganha uma **segunda coleção**, ao lado de `Itens` (ingredientes,
inalterada):

```csharp
public IReadOnlyCollection<ItemEntradaUtensilio> ItensUtensilio => _itensUtensilio.AsReadOnly();
private readonly List<ItemEntradaUtensilio> _itensUtensilio = new();

public void AdicionarItemUtensilio(Guid utensilioId, decimal quantidade, decimal custoUnitario)
{
    if (Status != StatusEntrada.Confirmada)
        throw new DomainException("Não é possível adicionar itens a uma entrada cancelada.");
    if (quantidade <= 0)
        throw new DomainException("Quantidade deve ser maior que zero.");
    if (custoUnitario < 0)
        throw new DomainException("Custo unitário não pode ser negativo.");
    if (_itensUtensilio.Any(i => i.UtensilioId == utensilioId))
        throw new DomainException("Utensílio já adicionado nesta entrada.");

    _itensUtensilio.Add(ItemEntradaUtensilio.Criar(Id, utensilioId, quantidade, custoUnitario));
}
```

Uma entrada pode ter `Itens` vazio + `ItensUtensilio` preenchido, o inverso, ou ambos —
mas **não pode ter os dois vazios** (validada no `RegistrarEntradaCommandValidator`).

---

## 4. Casos de uso (Application — CQRS)

### 4.1 Módulo `Application/CategoriasUtensilio` (espelha `Categorias` de ingrediente)
- `CriarCategoriaUtensilioCommand(Nome)` → `CategoriaUtensilioDto`
- `AtualizarCategoriaUtensilioCommand(Id, Nome)` → DTO
- `DesativarCategoriaUtensilioCommand(Id)` → `Unit`
- `ListarCategoriasUtensilioQuery(ApenasAtivas = true)` → `IReadOnlyList<CategoriaUtensilioDto>`
- `CategoriaUtensilioDto(Id, Nome, Ativo)`
- Validator: `Nome` obrigatório, ≤100; unicidade via `NomeExisteAsync` (filtra `Ativo`).

### 4.2 Módulo `Application/Utensilios` (espelha `Ingredientes`)
- `CriarUtensilioCommand(Nome, UnidadeMedidaId, EstoqueMinimo, CodigoInterno?, CategoriaUtensilioId?, EstoqueMaximo?)` → `UtensilioDto`
- `AtualizarUtensilioCommand(Id, ...)` → DTO
- `DesativarUtensilioCommand(Id)` → `Unit`
- `ListarUtensiliosQuery(ApenasAtivos = true)` → `IReadOnlyList<UtensilioResumoDto>`
- `ObterUtensilioQuery(Id)` → `UtensilioDto`
- `UtensilioDto(Id, Nome, CodigoInterno, CategoriaUtensilioId, CategoriaNome, UnidadeMedidaId, UnidadeMedidaCodigo, EstoqueAtual, EstoqueMinimo, EstoqueMaximo, CustoUnitario, Ativo)`
- `UtensilioResumoDto(Id, Nome, UnidadeMedidaCodigo, EstoqueAtual)` — igual ao padrão de `IngredienteResumoDto` (usado nos pickers de formulário).
- Validators: `EstoqueMinimo ≥ 0`; `EstoqueMaximo ≥ EstoqueMinimo` quando informado; `CodigoInterno` único quando informado (via `CodigoInternoExisteAsync`).

### 4.3 `Entradas` (ajuste aditivo)
- `RegistrarEntradaCommand` ganha `ItensUtensilio: IReadOnlyList<ItemEntradaUtensilioInputDto> = []`.
- `ItemEntradaUtensilioInputDto(UtensilioId, Quantidade, CustoUnitario)`.
- `RegistrarEntradaCommandValidator`: adiciona regra `Itens.Any() || ItensUtensilio.Any()` ("adicione pelo menos um item") — substitui a regra atual que só olhava `Itens`.
- `RegistrarEntradaCommandHandler`: depois do loop de ingredientes (inalterado), novo loop simétrico:
  1. Carrega utensílios distintos pedidos (`IUtensilioRepository`), valida existência e `Ativo`.
  2. Para cada item: `entrada.AdicionarItemUtensilio(...)`; `utensilio.AtualizarEstoque(estoqueAtual + quantidade, ...)`; `utensilio.AtualizarCusto(custoUnitario, ...)`; `_utensilios.Atualizar(utensilio)`.
  3. Grava `MovimentacaoUtensilio.Criar(..., TipoMovimentacao.Entrada, ..., referenciaTipo: "EntradaMercadoria", referenciaId: entrada.Id)` via `IMovimentacaoUtensilioRepository`.
  4. **Não** chama `INotificacaoEstoqueService` para utensílio (serviço é Ingrediente-only por escopo — §13).
- `EntradaMercadoriaDto` ganha `ItensUtensilio: IReadOnlyList<ItemEntradaUtensilioDto>` e `CustoTotal` passa a somar os dois (`Itens.Sum + ItensUtensilio.Sum`).
- `ItemEntradaUtensilioDto(Id, UtensilioId, UtensilioNome, UnidadeMedidaCodigo, Quantidade, CustoUnitario, CustoTotal)` — espelha `ItemEntradaDto`.
- `CancelarEntradaCommandHandler`: **sem alteração de regra** — cancelar a entrada não reverte estoque hoje (mesmo comportamento já existente para ingrediente); confirmado como consistente, não é regressão desta feature.

### 4.4 `ToDto` reutilizado
Handler de `Criar*` expõe `internal static ToDto(...)` reaproveitado pelos demais handlers do módulo, padrão do projeto.

---

## 5. API

### 5.1 `CategoriasUtensilioController` (`api/categorias-utensilio`)
Mesmo shape de `CategoriasController` (ingrediente): `[Authorize]`, `GET`, `GET {id}`,
`POST` (201), `PUT {id}`, `DELETE {id}` (204, soft delete).

### 5.2 `UtensiliosController` (`api/utensilios`)
Mesmo shape de `IngredientesController`: `[Authorize]`, `GET ?apenasAtivos=`,
`GET {id:guid}`, `POST` (201), `PUT {id:guid}`, `DELETE {id:guid}` (204).

### 5.3 `EntradasController`
Sem mudança de rota. `POST /api/entradas` aceita o novo campo opcional `itensUtensilio`
no body (camelCase, igual ao resto da API).

---

## 6. Frontend

### 6.1 Novo módulo `features/estoque/utensilios/`
Estrutura espelhando `features/estoque/ingredientes/`: `components/`, `hooks/
(useUtensilios.ts)`, `pages/ (UtensiliosPage.tsx, UtensilioFormPage.tsx)`,
`services/ (utensiliosService.ts)`. Tipos em `types/estoque.ts` (ou arquivo próprio,
seguindo convenção do projeto): `Utensilio`, `UtensilioResumo`, `UtensilioFormValues`.

Tela de listagem: mesma estrutura de `IngredientesPage` — `PageHeader`,
`SkeletonTable`, `EmptyState`, busca/filtro por categoria, coluna de estoque atual com
destaque quando `estaBaixoDoMinimo` (reaproveita o componente visual já usado em
Ingredientes, se existir um `StatusEstoqueBadge` compartilhado — senão, extrair um
agora em vez de duplicar o JSX, conforme padrão de qualidade do projeto).

Formulário: campos Nome, Categoria (select, com link/atalho para gerenciar
categorias), Unidade de Medida (select), Estoque Mínimo, Estoque Máximo (opcional),
Código Interno (opcional). Zod com `z.preprocess` nos campos numéricos (padrão
obrigatório do projeto), `resolver as any` e `handleSubmit(fn as any)`.

Tela "Gerenciar categorias de utensílio": mesmo padrão de modal já usado em
Categorias de Produto/Despesa (`ModalGerenciarCategorias` — avaliar reaproveitar o
componente genérico se a forma já for parametrizável; senão, componente análogo
próprio em `utensilios/components/`).

### 6.2 Sidebar
Novo item **"Utensílios"** no grupo Estoque, logo abaixo de "Ingredientes"
(`href: '/estoque/utensilios'`, ícone a escolher na mesma família `@heroicons/react`
usada pelos outros itens, cor própria não usada ainda no grupo).

### 6.3 `EntradaFormPage` (ajuste)
A lista "Itens da Entrada" ganha uma coluna **Tipo** (select: Ingrediente | Utensílio)
por linha, antes da coluna do item. Trocar o tipo na linha troca o dropdown exibido
(ingrediente vs. utensílio) e limpa o valor selecionado da linha. Grid de colunas passa
de `[1fr_110px_130px_36px]` para `[100px_1fr_110px_130px_36px]`.

Schema Zod: cada linha do array `itens` passa a ter `tipo: 'ingrediente' | 'utensilio'`
+ `itemId` (em vez de `ingredienteId` fixo) + `quantidade` + `custoUnitario`. No
`onSubmit`, o form particiona o array único em dois (`itens` filtrando
`tipo === 'ingrediente'`, `itensUtensilio` filtrando `tipo === 'utensilio'`) antes de
chamar `entradasService.registrar`. Isso é só mapeamento no form — a UX continua
"uma lista de itens", como já é hoje.

`ConfirmacaoEntradaModal`: a lista de itens confirmados passa a concatenar
`itens` (ingrediente) + `itensUtensilio`, cada um com um rótulo/ícone indicando o tipo.

### 6.4 Reaproveitamento
`PageHeader`, `SkeletonTable`, `EmptyState`, `CampoTexto`, `SelectCampo`,
`FormSection`, `FormActions`, `FormCard`, `Toast`, `ModalDesativar` (prop `entidade="utensílio"`,
já genérico desde o fix do bug de categoria hardcoded — ver `ERROS_RESOLVIDOS` E6),
tokens `--ada-*`.

---

## 7. Infraestrutura

- `IEntityTypeConfiguration<CategoriaUtensilio>`, `<Utensilio>`, `<MovimentacaoUtensilio>`,
  `<ItemEntradaUtensilio>` — todas com colunas em snake_case via `HasColumnName()`,
  schema `estoque` (mesmo schema de Ingrediente/Categoria/Movimentacao/ItemEntradaMercadoria).
- Repositórios `ICategoriaUtensilioRepository`, `IUtensilioRepository`,
  `IMovimentacaoUtensilioRepository` — mesma forma dos repositórios de Ingrediente
  (`ObterPorIdAsync`, `ListarAsync`, `AdicionarAsync`, `Atualizar`, `SalvarAsync`, mais
  o `NomeExisteAsync`/`CodigoInternoExisteAsync` equivalente).
- `EntradaMercadoriaRepository`: `ObterPorIdComItensAsync` passa a incluir também
  `.Include(e => e.ItensUtensilio).ThenInclude(i => i.Utensilio)`.
- DI (`DependencyInjection.cs`): registrar os 3 repositórios novos.
- Uma migration: `AddUtensilios` — cria as 4 tabelas novas (`categorias_utensilio`,
  `utensilios`, `movimentacoes_utensilio`, `itens_entrada_utensilio`), sem alterar
  nenhuma tabela existente (puramente adição, sem backfill).

---

## 8. Validações e casos-limite

| Caso | Comportamento |
|---|---|
| Entrada sem nenhum item (nem ingrediente nem utensílio) | Bloqueada pelo validator — "Adicione pelo menos um item." |
| Entrada só com utensílio, sem ingrediente | Permitida — `Itens` vazio, `ItensUtensilio` preenchido |
| Utensílio inativo selecionado na entrada | `DomainException` — "Utensílio 'X' está inativo." (mesmo texto/padrão de Ingrediente) |
| Utensílio duplicado na mesma entrada | Bloqueado — "Utensílio já adicionado nesta entrada." |
| Estoque mínimo/máximo inválidos | Mesmas guardas de `Ingrediente` (`EstoqueMaximo < EstoqueMinimo` → `DomainException`) |
| Código interno duplicado | Bloqueado no validator (`CodigoInternoExisteAsync`, filtra `Ativo`) |
| Desativar categoria em uso | Soft delete — não bloqueia; utensílios existentes continuam resolvendo a categoria por id, igual padrão de Despesa |
| Cancelar entrada com itens de utensílio | Mesmo comportamento atual (sem reversão de estoque) — consistente, não é regressão |

---

## 9. Critérios de aceite

- [ ] Cadastrar, editar, listar e desativar Utensílio (CRUD completo).
- [ ] Cadastrar, editar, listar e desativar Categoria de Utensílio.
- [ ] Nova entrada de mercadoria aceita ingredientes e utensílios na mesma nota.
- [ ] Entrada com utensílio atualiza `EstoqueAtual` e `CustoUnitario` do utensílio e grava `MovimentacaoUtensilio`.
- [ ] Entrada só com ingrediente continua funcionando exatamente como hoje (sem regressão).
- [ ] Entrada sem nenhum item (dos dois tipos) é bloqueada com mensagem clara.
- [ ] Sidebar tem o item "Utensílios"; rota e tela funcionam no padrão visual do projeto.
- [ ] `tsc --noEmit` zero erros; suíte de testes backend passando (existentes + novos).

---

## 10. Testes

- **Backend** (`CasaDiAna.Application.Tests`):
  - `CategoriaUtensilioTests` (domínio: criar, atualizar, desativar) + handlers (criar
    com nome duplicado bloqueado, listar, desativar) — espelha os testes de
    `CategoriasDespesa`/`Categorias`.
  - `UtensilioTests` (domínio: criar com estoque mínimo negativo bloqueado, máximo <
    mínimo bloqueado, `AtualizarEstoque` clampa em 0, `EstaBaixoDoMinimo`).
  - `RegistrarEntradaCommandHandlerTests`: casos novos — entrada só com utensílio;
    entrada mista (ingrediente + utensílio); entrada sem nenhum item bloqueada;
    utensílio inativo bloqueado; utensílio duplicado na mesma entrada bloqueado.
  - Reexecutar a suíte existente de Entradas sem alteração esperada (garante que o
    campo aditivo não quebrou nada).
- **Frontend**: `tsc --noEmit`; teste manual do formulário de entrada misturando tipos
  na mesma nota.
- **Manual / E2E (staging Render)**: criar categoria de utensílio; cadastrar 2
  utensílios; registrar entrada com 1 ingrediente + 1 utensílio na mesma nota; conferir
  estoque e custo atualizados nas duas listagens; conferir confirmação mostrando os
  dois tipos.

---

## 11. Pendências / validar com uso real

- Ícone da Sidebar para "Utensílios" — escolher na implementação (não é decisão de
  arquitetura).
- Se `ModalGerenciarCategorias` do financeiro é genérico o suficiente para reaproveitar
  tal qual ou precisa de uma cópia adaptada — decidir durante a implementação olhando
  o componente real.

---

## 12. Fora de escopo (YAGNI)

- Correção de Estoque, Inventário Físico e Notificação de estoque baixo para
  Utensílio — ficam exclusivos de Ingrediente nesta entrega. Extensão natural futura:
  os repositórios/entidades já ficam no formato certo para isso (mesma forma de
  Ingrediente), sem retrabalho de modelagem quando for pedido.
- Relatório de movimentações / comparação de preço de utensílio.
- Reversão de estoque ao cancelar entrada (não existe para ingrediente hoje; fora de
  escopo mexer nisso agora para os dois tipos).
- Ficha técnica / custo de produção envolvendo utensílio (não se aplica ao conceito).
