# Despesas Fixas Mensais + Fechamento Mensal — Fase 1

**Data:** 2026-06-09
**Status:** Aprovado (design) — aguardando revisão do spec
**Fase:** 1 de 2

> Esta é a **Fase 1** da feature de Precificação. Cobre a camada de dados:
> cadastro de despesas fixas mensais e o fechamento mensal consolidado.
> A **Fase 2** (sugestão de preço, simulador, status visual do produto,
> listagem de precificação e configuração global de CMV/margem/taxas) terá
> spec próprio, escrito depois que a Fase 1 estiver validada com dados reais.

---

## 1. Contexto e objetivo

O sistema já calcula o **custo direto** de cada produto pela ficha técnica
(`Produto.CalcularCustoFicha()`) e a **margem de lucro** sobre esse custo
(`Produto.CalcularMargemLucro()`). Já existe **faturamento confiável** derivado
de `VendaDiaria.QuantidadeVendida × Produto.PrecoVenda` (mesma base usada no
relatório Produção/Vendas).

O que falta é uma **camada mensal de despesas fixas da empresa** (aluguel, folha,
água, energia, gás, internet, contabilidade, manutenção, sistema, marketing) e um
**fechamento mensal** que cruze faturamento, custo direto e despesas fixas para
mostrar margem bruta, margem operacional, percentual de despesas fixas e prime cost.

### Regra central — separação de custos

1. **Custo direto do produto** — vem da ficha técnica existente. NÃO é alterado.
2. **Despesas fixas mensais** — operacionais da empresa, em tabela própria.
   NUNCA entram na ficha técnica nem viram CMV direto do produto.
3. **Margem bruta** — faturamento − custo direto.
4. **Margem operacional** — faturamento − custo direto − despesas fixas.

Aluguel, folha, energia, água e gás **não** são ingredientes.

---

## 2. Decisões de design (confirmadas)

| Tema | Decisão |
|---|---|
| Entrega | Em 2 fases. Esta é a Fase 1 (despesas + fechamento). |
| Faturamento mensal | **Automático** das vendas + **override manual** opcional por competência. |
| Config de precificação (CMV alvo, margem, taxas) | Config global única — **Fase 2**. Não entra agora. |
| Permissões | **Admin + Coordenador** veem e editam. Operadores não acessam. |
| Exclusão de despesa | **Soft delete** (`Ativo = false`), consistente com o padrão de cadastros. |

---

## 3. Modelo de dados (Domain)

### 3.1 Entidade `DespesaFixa`

Segue o padrão de `Produto` (construtor privado, factory `Criar`, métodos de
mutação, campos de auditoria).

| Campo | Tipo | Regras |
|---|---|---|
| `Id` | `Guid` | gerado na criação |
| `Competencia` | `DateTime` | normalizada para o 1º dia do mês (ex.: `2026-06-01`) |
| `Categoria` | `CategoriaDespesaFixa` | obrigatória |
| `Descricao` | `string?` | opcional |
| `Valor` | `decimal` | **> 0** (bloqueia zero/negativo via `DomainException`) |
| `Observacao` | `string?` | opcional |
| `DataLancamento` | `DateTime` | default = data atual; editável |
| `Ativo` | `bool` | soft delete (`Cancelar()` → `false`) |
| `CriadoEm` / `CriadoPor` | `DateTime` / `Guid` | auditoria |
| `AtualizadoEm` / `AtualizadoPor` | `DateTime` / `Guid` | auditoria |

Métodos: `Criar(...)`, `Atualizar(...)`, `Cancelar(atualizadoPor)`.
Normalização de competência: helper interno que reduz qualquer `DateTime` ao
primeiro dia do mês em UTC.

### 3.2 Enum `CategoriaDespesaFixa`

```
Aluguel = 1
FolhaPagamento = 2
Agua = 3
Energia = 4
Gas = 5
Internet = 6
Contabilidade = 7
Manutencao = 8
Sistema = 9
Marketing = 10
Outros = 11
```

`FolhaPagamento` é categoria separada justamente para permitir o cálculo de
**Prime Cost** (custo direto + folha) no fechamento.

### 3.3 Entidade `FaturamentoMensal`

Guarda **apenas** o override manual de faturamento por competência. Todo o resto
do fechamento é calculado, não persistido.

| Campo | Tipo | Regras |
|---|---|---|
| `Id` | `Guid` | |
| `Competencia` | `DateTime` | 1º dia do mês, **única** (índice único) |
| `ValorManual` | `decimal?` | quando preenchido (> 0), sobrepõe o calculado; `null` = usa automático |
| audit | CriadoEm/Por, AtualizadoEm/Por | |

Upsert por competência (cria se não existe, atualiza se existe).

---

## 4. Fechamento Mensal — query consolidada

`ObterFechamentoMensalQuery(Competencia)` → `FechamentoMensalDto`. Tudo calculado
em memória a partir de vendas + despesas + ficha técnica. **Não recalcula nem
altera a ficha técnica** — apenas a consome.

Campos do DTO:

| Campo | Cálculo |
|---|---|
| `Competencia` | entrada |
| `FaturamentoCalculado` | Σ `Venda.Qtd × Produto.PrecoVenda` no mês |
| `FaturamentoManual` | `FaturamentoMensal.ValorManual` (nullable) |
| `FaturamentoUsado` | `FaturamentoManual ?? FaturamentoCalculado` |
| `CustoDiretoTotal` | Σ `Venda.Qtd × Produto.CalcularCustoFicha()` |
| `TotalDespesasFixas` | Σ despesas ativas da competência |
| `DespesasPorCategoria[]` | `{ Categoria, CategoriaNome, Total }` |
| `FolhaPagamento` | Σ despesas da categoria `FolhaPagamento` |
| `DespesaFixaPercentual` | `TotalDespesasFixas / FaturamentoUsado` — **null se faturamento = 0** |
| `MargemBruta` | `FaturamentoUsado − CustoDiretoTotal` |
| `MargemOperacional` | `FaturamentoUsado − CustoDiretoTotal − TotalDespesasFixas` |
| `PrimeCost` | `CustoDiretoTotal + FolhaPagamento` |

Observações:
- `CustoDiretoTotal` usa a **ficha técnica atual** (`CalcularCustoFicha()`),
  alinhado ao que a Fase 2 usará para preço sugerido — não o custo histórico
  de produção do relatório Produção/Vendas.
- Filtro de mês: `Competencia` (1º dia) ≤ data < primeiro dia do mês seguinte,
  seguindo o padrão de filtro de data exclusivo do projeto.

---

## 5. Casos de uso (Application — CQRS)

Dois módulos irmãos seguindo o padrão de uma pasta por módulo do projeto
(como `VendasDiarias`, `Perdas`): `Application/DespesasFixas/{Commands,Queries,Dtos}`
e `Application/FechamentoMensal/{Commands,Queries,Dtos}`.

**Commands** (`record : IRequest<T>` + handler + validator):
- `CriarDespesaFixaCommand` → `DespesaFixaDto`
- `AtualizarDespesaFixaCommand` → `DespesaFixaDto`
- `CancelarDespesaFixaCommand` → `Unit` (soft delete)
- `DefinirFaturamentoManualCommand(Competencia, ValorManual?)` → `FaturamentoMensalDto` (upsert)

**Queries**:
- `ListarDespesasFixasQuery(Competencia)` → `DespesasFixasMesDto { Itens[], Total, TotalPorCategoria[] }`
- `ObterFechamentoMensalQuery(Competencia)` → `FechamentoMensalDto`

**Validators** (FluentValidation, 400 automático via pipeline):
- `Valor > 0`
- `Categoria` dentro do enum
- `Competencia` informada
- `ValorManual` (quando presente) `> 0`

**DTOs**:
- `DespesaFixaDto(Id, Competencia, Categoria, CategoriaNome, Descricao, Valor, Observacao, DataLancamento, Ativo)`
- `DespesasFixasMesDto(Competencia, Total, IReadOnlyList<DespesaFixaDto> Itens, IReadOnlyList<TotalCategoriaDto> TotalPorCategoria)`
- `FechamentoMensalDto(...)` — campos da seção 4
- `FaturamentoMensalDto(Competencia, ValorManual)`

`ToDto` estático no handler de `Criar`, reutilizado pelos demais (padrão do projeto).

---

## 6. API

Dois controllers, ambos `[Authorize(Roles = "Admin,Coordenador")]`, respostas via
`ApiResponse<T>`.

**`DespesasFixasController`** (`api/despesas-fixas`):
- `GET ?competencia=YYYY-MM-DD` → `DespesasFixasMesDto`
- `POST` → cria
- `PUT {id}` → atualiza
- `DELETE {id}` → cancela (soft, 204)

**`FechamentoMensalController`** (`api/fechamento-mensal`):
- `GET ?competencia=YYYY-MM-DD` → `FechamentoMensalDto`
- `PUT faturamento-manual` → `DefinirFaturamentoManualCommand`

---

## 7. Frontend

Novo grupo **"Financeiro"** na Sidebar, visível apenas quando
`temPapel('Admin') || temPapel('Coordenador')`:
- **Despesas Fixas** → `/financeiro/despesas`
- **Fechamento Mensal** → `/financeiro/fechamento`

Pastas espelhando `features/producao`:
```
features/financeiro/despesas-fixas/{components,hooks,pages,services}
features/financeiro/fechamento-mensal/{components,hooks,pages,services}
```

### 7.1 Tela Despesas Fixas
- Seletor de **competência** (mês/ano) no topo.
- `KpiCard` com **total do mês**.
- Tabela (`overflow-x-auto`): Categoria · Descrição · Valor · Data de lançamento · Ações (editar/remover).
- Modal "Nova/Editar despesa" (padrão `ModalCategoriaProduto`): competência, categoria (select), descrição, valor, observação, data de lançamento.
- Remoção via `ModalDesativar`.
- `SkeletonTable` no loading, `EmptyState` para mês sem despesas.

### 7.2 Tela Fechamento Mensal
- Seletor de competência.
- `KpiCard`s: Faturamento usado · Total despesas fixas · Despesa fixa % · Margem bruta · Margem operacional · Prime cost.
- Tabela de despesas por categoria.
- Input de **faturamento manual** com selo indicando "automático" (quando vazio) ou "manual" (quando preenchido), e exibição do valor calculado das vendas como referência.
- Quando não há faturamento: aviso claro "Informe o faturamento para calcular os percentuais" e percentuais exibidos como "—".

### 7.3 Reaproveitamento
`PageHeader`, `FilterBar`/`FiltroPeriodo`, `KpiCard`, `StatusBadge`,
`SkeletonTable`, `EmptyState`, `ModalDesativar`, `TabelaAcoesLinha`, tokens
`--ada-*`. Formulários com `zodResolver(schema) as any`. Datas seguindo a regra
do projeto (`new Date(valor)` direto, sem concatenar `T12:00:00`).

---

## 8. Infraestrutura

- `IEntityTypeConfiguration<DespesaFixa>` e `<FaturamentoMensal>` com **todas as
  colunas em snake_case** via `HasColumnName()`. Índice único em
  `FaturamentoMensal.Competencia`.
- Repositórios + interfaces no Domain, registrados na DI (`DependencyInjection`).
- Uma migration: `AddDespesasFixasEFechamentoMensal`.

---

## 9. Validações e casos-limite

| Caso | Comportamento |
|---|---|
| Mês sem despesas | Total = 0; fechamento com despesas zeradas; % pendente |
| Mês sem faturamento (sem vendas e sem manual) | `DespesaFixaPercentual = null`; UI mostra "—" e aviso |
| Valor ≤ 0 | Bloqueado no domínio e no validator |
| Divisão por zero (faturamento = 0) | Guarda retorna `null` |
| Despesa cancelada | Excluída de todas as somas (filtro `Ativo = true`) |
| Override manual = 0 ou negativo | Bloqueado; tratar como "limpar override" só quando `null` |
| Competência em formatos variados | Normalizada para 1º dia do mês antes de salvar/filtrar |

---

## 10. Critérios de aceite (Fase 1)

- [ ] Cadastrar, editar e remover (soft) despesa fixa por competência.
- [ ] Somar corretamente o total da competência e o total por categoria.
- [ ] Faturamento automático calculado das vendas; override manual funcional.
- [ ] `DespesaFixaPercentual` calculado quando há faturamento; pendente quando não há.
- [ ] Fechamento mostra margem bruta, margem operacional e prime cost.
- [ ] Custo direto reaproveitado da ficha técnica (sem alterá-la).
- [ ] Sidebar/rotas restritas a Admin + Coordenador.
- [ ] Cálculos protegidos contra divisão por zero, nulos e valores inválidos.
- [ ] Interface consistente com o padrão visual atual (tokens `--ada-*`, primitivos de UI).

---

## 11. Testes

- **Backend** (`CasaDiAna.Application.Tests`): handlers de criar/atualizar/cancelar
  despesa; `ObterFechamentoMensalQueryHandler` cobrindo mês sem despesas, mês sem
  faturamento, override manual, prime cost e percentuais com guarda de zero.
- **Manual**:
  - *Despesas*: criar despesas em 2 categorias num mês, verificar total e total
    por categoria; editar valor; remover e confirmar saída das somas; filtrar por
    competência diferente (vazia → `EmptyState`).
  - *Fechamento*: com vendas no mês, conferir faturamento automático; preencher
    faturamento manual e ver o selo "manual" e os percentuais mudarem; zerar o
    manual e voltar ao automático; mês sem vendas → percentual "—" + aviso.

---

## 12. Pendências / validar com dados reais do cliente

- **Definição de custo direto total**: usamos ficha técnica atual × quantidade
  vendida. Confirmar com o cliente se faz sentido vs. custo histórico de produção.
- **Categorias**: lista inicial fixa no enum. Se o cliente precisar de categorias
  customizáveis, vira tabela — fora do escopo agora.
- **Prime cost** depende de a folha ser lançada na categoria `FolhaPagamento`.
- **Competência vs. regime de caixa**: despesa é alocada por competência informada,
  não pela data de pagamento. Validar se atende à realidade contábil do cliente.

---

## 13. Esboço da Fase 2 (não implementar agora)

Tela **Precificação** + **Simulador** + **listagem geral** + **status visual do
produto**, usando uma **config global** (CMV alvo, margem desejada, taxas %) e o
`DespesaFixaPercentual` da Fase 1. Fórmulas previstas: preço sugerido por CMV alvo
(`custo / cmvAlvo`), preço por margem líquida desejada
(`custo / (1 − despesaFixa% − taxas% − margem%)`, bloqueando soma ≥ 100%), rateio
fixo estimado, lucro estimado e margem líquida estimada por unidade. Spec próprio.
