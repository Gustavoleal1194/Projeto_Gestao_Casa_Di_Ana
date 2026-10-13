# Editar entrada de mercadoria — Design

**Data:** 2026-10-13
**Módulo:** Entradas

## Objetivo

Permitir corrigir uma entrada já salva sem precisar cancelá-la e lançá-la de novo, nos casos que não afetam o estoque: dados do cabeçalho, boletos e custo unitário dos itens (erro de digitação de preço).

Hoje a única ação sobre uma entrada salva é **Cancelar**, que estorna o estoque.

## Escopo

### Editável (somente entradas `Confirmada`)

- Fornecedor (deve existir e estar ativo)
- Número da nota fiscal
- Data da entrada
- Recebido por
- Observações
- Datas de vencimento dos boletos — a lista enviada **substitui** a lista atual
- Custo unitário de cada item de ingrediente e de utensílio

### Fora de escopo

- Quantidade, troca, inclusão ou remoção de itens. Para isso continua valendo cancelar e lançar de novo. A edição **nunca** altera estoque nem gera movimentações.
- Histórico/auditoria de versões da entrada além de `AtualizadoEm`/`AtualizadoPor`.

## Permissão

A mesma regra do cancelamento:

- **Frontend:** o botão aparece para `PAPEIS_EDICAO`.
- **Backend:** só o autor da entrada (`CriadoPor`) ou um `Admin` pode editar. Os demais recebem `UnauthorizedAccessException`.

## Regra do custo

`Ingrediente.CustoUnitario` e `Utensilio.CustoUnitario` representam o **custo da última compra**. Esse custo é usado na precificação e no custo da produção diária.

Depois de aplicar a edição, para **cada item** da entrada:

- se esta entrada for a **entrada confirmada mais recente** que contém aquele ingrediente/utensílio, o custo do cadastro passa a ser o custo do item;
- caso contrário, o cadastro não é alterado.

"Mais recente" é a maior `DataEntrada`, com desempate pelo maior `CriadoEm`, e considera a `DataEntrada` **já editada**.

Consequências:

- Corrigir o preço de uma compra antiga não faz o custo atual regredir.
- Se a data editada torna esta entrada a mais recente, o custo do cadastro é sincronizado, mesmo sem mudança de custo.
- A regra é idempotente: aplicá-la duas vezes dá o mesmo resultado.
- Produções já registradas guardaram o custo da época e **não** são recalculadas.
- Compras do mês, fechamento mensal e relatórios leem os itens da entrada e refletem a correção automaticamente.

## Boletos

O validator de registro exige vencimento a partir de hoje. Na edição, uma entrada antiga pode ter boletos já vencidos. Regra:

- Uma data que **já existia** na entrada é aceita mesmo no passado.
- Uma data **nova** deve ser hoje ou no futuro.

A checagem fica no handler, porque depende do estado salvo. A mensagem é a mesma do registro.

## Backend

### Domínio

**`EntradaMercadoria`**

- `AtualizarCabecalho(Guid fornecedorId, DateTime dataEntrada, string? numeroNotaFiscal, string? recebidoPor, string? observacoes, Guid atualizadoPor)`
- `SubstituirBoletos(IEnumerable<DateTime> datasVencimento, Guid atualizadoPor)`
- `AlterarCustoItem(Guid itemId, decimal custoUnitario, Guid atualizadoPor)`
- `AlterarCustoItemUtensilio(Guid itemId, decimal custoUnitario, Guid atualizadoPor)`

Comportamento comum dos métodos:

- Todos lançam `DomainException` se a entrada estiver cancelada.
- Os de custo lançam `DomainException` se o item não pertencer à entrada ou se o custo for negativo.
- Todos atualizam `AtualizadoEm`/`AtualizadoPor`.
- A guarda de entrada cancelada e a validação de custo são extraídas para helpers privados, reaproveitados por `AdicionarItem*`/`AdicionarBoleto`. Assim não há duplicação.

**`ItemEntradaMercadoria` / `ItemEntradaUtensilio`**

- `internal void AlterarCustoUnitario(decimal custoUnitario)`. `CustoTotal` continua sendo derivado de quantidade × custo.

### Aplicação — `Entradas/Commands/EditarEntrada/`

- `EditarEntradaCommand(Guid EntradaId, Guid FornecedorId, DateTime DataEntrada, string RecebidoPor, string? NumeroNotaFiscal, string? Observacoes, IReadOnlyList<DateTime>? DatasVencimentoBoleto, IReadOnlyList<CustoItemInputDto>? CustosItens, IReadOnlyList<CustoItemInputDto>? CustosItensUtensilio) : IRequest<EntradaMercadoriaDto>`
- `CustoItemInputDto(Guid ItemId, decimal CustoUnitario)`. Itens omitidos mantêm o custo atual.
- `EditarEntradaCommandValidator`:
  - Mesmas regras de cabeçalho do registro: fornecedor e data obrigatórios, NF ≤ 60, recebido por obrigatório e ≤ 100.
  - Custo ≥ 0.
  - `ItemId` não vazio e sem repetição.
  - As regras de cabeçalho em comum com `RegistrarEntradaCommandValidator` são extraídas para um ponto único, sem duplicação.
- `EditarEntradaCommandHandler`:
  1. Carrega a entrada com itens. Se não existir: "Entrada não encontrada."
  2. Checa a permissão (autor ou Admin).
  3. Se o fornecedor mudou, valida que existe e está ativo.
  4. Valida as datas de boleto novas, conforme a seção Boletos.
  5. Aplica as alterações via métodos de domínio.
  6. Aplica a regra do custo aos ingredientes e utensílios dos itens.
  7. Salva e devolve o DTO usando o mapeamento existente (`ToDto`).
- A regra de permissão autor/Admin, hoje inline em `CancelarEntradaCommandHandler`, é extraída para um helper compartilhado e usada pelos dois handlers.

### Repositório

`IEntradaMercadoriaRepository` ganha uma consulta que, dada uma entrada e os ids de ingredientes/utensílios, informa para quais deles **existe outra entrada confirmada mais recente** contendo o item, conforme o critério da regra do custo. Uma consulta por tipo de item, sem N+1.

### API

`PUT /api/entradas/{id}`:

- Body: o command sem `EntradaId`, que vem da rota.
- Retornos: `200` com `ApiResponse<EntradaMercadoriaDto>`, `400` para validação e `422` para regra de domínio.

## Frontend

- **`entradasService`:** `editar(id, payload)`. Os tipos de payload ficam em `types/estoque.ts`.
- **`EntradaDetalhePage`:** botão **Editar** ao lado de **Cancelar Entrada**, com as mesmas condições de exibição (papel em `PAPEIS_EDICAO` e status `Confirmada`). Ele navega para `/entradas/:id/editar`.
- **Rota** `/entradas/:id/editar` em `AppRoutes`, protegida como a de nova entrada.
- **`EntradaFormPage` em modo edição** (detectado pelo `id` na rota):
  - Carrega a entrada e preenche o cabeçalho e os boletos.
  - As linhas de item ficam com ingrediente/utensílio e quantidade em somente leitura, sem adicionar ou remover linhas. Só o custo unitário fica editável.
  - O título e o botão principal dizem "Editar entrada" / "Salvar alterações".
  - O modal de confirmação mostra o total antes → depois quando houver mudança de custo.
  - Ao salvar: `PUT`, toast de sucesso e volta para o detalhe. Erros da API são exibidos como no registro.
  - Se a entrada estiver cancelada ou não for encontrada, mostra uma mensagem e o link de volta.
- A lógica específica do modo edição é isolada (hook/componente) para que `EntradaFormPage` não cresça com condicionais espalhadas.

## Testes

**Domínio:**

- Editar cabeçalho de entrada cancelada lança exceção.
- Custo negativo lança exceção.
- Item inexistente lança exceção.
- `SubstituirBoletos` troca a lista.
- `CustoTotal` é recalculado.

**Handler:**

- Usuário sem permissão é rejeitado.
- Fornecedor inativo é rejeitado.
- Boleto antigo mantido é aceito; boleto novo no passado é rejeitado.
- O custo propaga quando esta é a entrada mais recente e não propaga quando existe uma mais recente.
- Mudança de data que torna a entrada a mais recente sincroniza o custo.
- O estoque e as movimentações não são alterados.

**Validator:** regras de cabeçalho e de custo.

## Critérios de sucesso

- Uma entrada confirmada pode ter cabeçalho, boletos e custos corrigidos pela tela, sem mexer no estoque.
- O custo do cadastro de ingrediente/utensílio só muda quando a entrada editada é a compra mais recente daquele item.
- Os testes existentes de entradas continuam passando.
