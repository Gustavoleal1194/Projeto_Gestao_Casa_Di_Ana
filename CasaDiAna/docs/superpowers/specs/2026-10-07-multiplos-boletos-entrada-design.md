# Múltiplos Boletos por Entrada de Mercadoria

**Data:** 2026-10-07
**Status:** Aprovado (design) — aguardando revisão do spec

---

## 1. Contexto e objetivo

Hoje `EntradaMercadoria` guarda um único boleto por nota: `TemBoleto: bool` +
`DataVencimentoBoleto: DateTime?`, setados uma vez na criação (não há edição de
entrada, só cancelamento). Na prática, algumas notas de fornecedor vêm com **mais de
um boleto**, cada um com sua própria data de vencimento (ex.: nota parcelada em 2x).
O sistema hoje só permite registrar um vencimento por nota, perdendo a informação dos
demais.

Esta feature troca o campo único por uma **lista de vencimentos de boleto por nota**.

---

## 2. Decisões de design (confirmadas)

| Tema | Decisão |
|---|---|
| Campos do boleto | **Só data de vencimento.** Sem valor/parcela — o sistema nunca rastreou valor de boleto separado do custo total da nota, e isso não muda aqui. |
| Edição pós-criação | Nenhuma — mesmo comportamento de hoje (boletos são definidos só no registro da entrada; não há tela de editar entrada). |
| Coluna "Venc. Boleto" na listagem | Badge do vencimento **mais próximo** + contador quando houver mais de um (ex.: "15/06 · +2"). A lista completa só aparece no detalhe da entrada. |
| Banner "boletos vencem em até 3 dias" | Continua contando **por nota** (usa o vencimento mais próximo de cada entrada), não por boleto individual — evita buscar a lista completa só para a listagem. |
| Mínimo de boletos | Nenhum — "tem boleto" marcado sem nenhuma data ainda é bloqueado pelo formulário (pelo menos 1 linha com data válida), igual à regra atual de "informe a data". |

---

## 3. Modelo de dados (Domain)

### 3.1 Entidade nova `BoletoEntrada`

Mirror simplificado de `ItemEntradaUtensilio` (sem custo/quantidade — só a data):

| Campo | Tipo |
|---|---|
| `Id` | `Guid` |
| `EntradaId` | `Guid` |
| `DataVencimento` | `DateTime` |

Criada internamente só por `EntradaMercadoria.AdicionarBoleto(...)` (`internal static Criar`,
mesmo padrão de `ItemEntradaMercadoria.Criar`/`ItemEntradaUtensilio.Criar`).

### 3.2 `EntradaMercadoria` (alteração)

- **Remove** os campos escalares `TemBoleto` (bool) e `DataVencimentoBoleto` (DateTime?).
- **Adiciona** a coleção `Boletos` (mesmo padrão de `Itens`/`ItensUtensilio`: `IReadOnlyCollection<BoletoEntrada>` + backing `List<BoletoEntrada>` privado) e o método:
  ```csharp
  public void AdicionarBoleto(DateTime dataVencimento)
  {
      if (Status != StatusEntrada.Confirmada)
          throw new DomainException("Não é possível adicionar boleto a uma entrada cancelada.");
      _boletos.Add(BoletoEntrada.Criar(Id, dataVencimento));
  }
  ```
- **Adiciona** 2 propriedades computadas (mesmo padrão de `CustoTotal`/`TotalItens` já existentes):
  ```csharp
  public bool TemBoleto => _boletos.Count > 0;
  public DateTime? ProximoVencimentoBoleto => _boletos.Count > 0 ? _boletos.Min(b => b.DataVencimento) : null;
  ```
  `TemBoleto` continua existindo como propriedade (nome preservado para não quebrar nenhum consumidor que só verifica a flag), só deixa de ser um campo próprio e passa a ser derivado da coleção.
- `Criar(...)`: remove os parâmetros `temBoleto`/`dataVencimentoBoleto` — boletos são adicionados via `AdicionarBoleto` em loop, depois da criação, no handler (mesmo padrão de itens/utensílio).

---

## 4. Migration (preserva dados)

Uma migration `AddBoletosEntrada`, escrita à mão (não só o que o `dotnet ef migrations add`
gera automaticamente — precisa de backfill):

1. `CreateTable boletos_entrada` (schema `estoque`): `id` (uuid, PK), `entrada_id` (uuid, FK →
   `entradas_mercadoria`, `OnDelete Cascade`), `data_vencimento` (timestamp, obrigatório).
   Índices: `IX_boletos_entrada_entrada_id`, `IX_boletos_entrada_data_vencimento`.
2. **Backfill:** `INSERT INTO estoque.boletos_entrada (id, entrada_id, data_vencimento)
   SELECT gen_random_uuid(), id, data_vencimento_boleto FROM estoque.entradas_mercadoria
   WHERE tem_boleto = true AND data_vencimento_boleto IS NOT NULL` — preserva o boleto
   único de toda entrada existente como o primeiro (e único) boleto dela.
3. `DropIndex IX_entradas_mercadoria_data_vencimento_boleto`, `DropColumn data_vencimento_boleto`,
   `DropColumn tem_boleto` de `entradas_mercadoria`.

> Ordem importa: criar tabela → backfill → só então apagar as colunas antigas.

---

## 5. Casos de uso (Application)

### 5.1 `RegistrarEntradaCommand` (ajuste)

Troca:
```csharp
bool TemBoleto = false,
DateTime? DataVencimentoBoleto = null,
```
por:
```csharp
IReadOnlyList<DateTime>? DatasVencimentoBoleto = null,
```
(lista vazia/null = sem boleto; aditivo quanto à posição dos demais parâmetros, mas
**substitui** os 2 campos de boleto antigos — não é uma troca aditiva-only como a de
Utensílios, é uma mudança de contrato do boleto especificamente).

### 5.2 `RegistrarEntradaCommandValidator` (ajuste)

Troca a regra única:
```csharp
RuleFor(x => x.DataVencimentoBoleto).NotNull()...When(x => x.TemBoleto);
```
por uma regra por item da lista:
```csharp
RuleForEach(x => x.DatasVencimentoBoleto).ChildRules(data =>
{
    data.RuleFor(d => d)
        .GreaterThanOrEqualTo(_ => DateTime.UtcNow.Date)
        .WithMessage("A data de vencimento do boleto deve ser hoje ou no futuro.");
});
```
Sem regra de "mínimo 1" no validator — isso é responsabilidade do formulário (o usuário
só vê o campo de data quando marca "tem boleto", e o form garante pelo menos 1 linha).

### 5.3 `RegistrarEntradaCommandHandler` (ajuste)

Depois de `EntradaMercadoria.Criar(...)` (sem os parâmetros de boleto), loop:
```csharp
foreach (var data in request.DatasVencimentoBoleto ?? Array.Empty<DateTime>())
    entrada.AdicionarBoleto(data);
```

### 5.4 DTOs (ajuste)

Novo `BoletoDto(Guid Id, DateTime DataVencimento)`.

`EntradaMercadoriaDto` (detalhe) troca `TemBoleto`/`DataVencimentoBoleto` por
`Boletos: IReadOnlyList<BoletoDto>` (lista completa).

`EntradaMercadoriaResumoDto` (listagem) troca `TemBoleto`/`DataVencimentoBoleto` por:
```csharp
DateTime? ProximoVencimentoBoleto,
int TotalBoletos,
```
(resumo fica leve — não carrega a lista inteira, só o suficiente pra renderizar o badge
+ contador da listagem, consistente com o resumo já não carregar `Itens`/`ItensUtensilio`
completos).

`ListarEntradasQueryHandler`/`ObterEntradaQueryHandler`/`CancelarEntradaCommandHandler`:
`RegistrarEntradaCommandHandler.ToDto` (reaproveitado pelos 3) passa a projetar `Boletos`
a partir de `e.Boletos`, e o resumo a partir de `e.ProximoVencimentoBoleto`/`e.Boletos.Count`.

---

## 6. Infraestrutura

- `BoletoEntradaConfiguration` (`IEntityTypeConfiguration<BoletoEntrada>`): schema `estoque`,
  tabela `boletos_entrada`, colunas snake_case, FK com `OnDelete Cascade` — mesmo padrão
  de `Itens`/`ItensUtensilio`. Na prática nunca dispara (não existe exclusão física de
  entrada hoje, só cancelamento lógico via `Status`), mantido só por consistência.
- `EntradaMercadoriaConfiguration`: remove `Property(TemBoleto)`/`Property(DataVencimentoBoleto)`
  e os respectivos índices; adiciona `HasMany(e => e.Boletos).WithOne()...OnDelete(Cascade)` +
  `Navigation(e => e.Boletos).UsePropertyAccessMode(Field)` (mesmo padrão de `Itens`).
- `AppDbContext`: novo `DbSet<BoletoEntrada> BoletosEntrada`.
- `EntradaMercadoriaRepository.ObterPorIdComItensAsync`/`ListarAsync`: adicionar
  `.Include(e => e.Boletos)`.
- Repositório próprio **não é necessário** — boletos são sempre acessados via a
  `EntradaMercadoria` pai (mesmo padrão de `ItemEntradaMercadoria`, que também não tem
  repositório dedicado).

---

## 7. Frontend

### 7.1 Tipos (`types/estoque.ts`)

```typescript
export interface Boleto {
  id: string
  dataVencimento: string
}
```
`EntradaMercadoria` (detalhe) troca `temBoleto`/`dataVencimentoBoleto` por `boletos: Boleto[]`.
`EntradaMercadoriaResumo` (listagem) troca os mesmos 2 campos por
`proximoVencimentoBoleto: string | null` + `totalBoletos: number`.
`RegistrarEntradaInput` troca `temBoleto`/`dataVencimentoBoleto` por
`datasVencimentoBoleto?: string[]`.
`EntradaFormValues` troca `temBoleto: boolean` + `dataVencimentoBoleto: string` por
`temBoleto: boolean` + `boletos: { dataVencimento: string }[]`.

### 7.2 `EntradaFormPage.tsx`

O checkbox "Pagamento via boleto" continua. Quando marcado, em vez de 1 campo de data,
vira uma **lista dinâmica** (mesmo padrão `useFieldArray` já usado na seção "Itens da
Entrada" desta mesma tela): cada linha é 1 `CampoTexto type="date"` + botão remover;
botão "Adicionar boleto" abaixo da lista. Zod:
```typescript
temBoleto: z.boolean().default(false),
boletos: z.array(z.object({ dataVencimento: z.string() })),
```
com `.refine` no schema geral: se `temBoleto`, `boletos` deve ter pelo menos 1 item com
`dataVencimento` não vazia (mesma mensagem de hoje, "Informe a data de vencimento do
boleto.", aplicada ao índice da primeira linha vazia). No submit, `datasVencimentoBoleto:
values.temBoleto ? values.boletos.map(b => b.dataVencimento) : undefined`.

### 7.3 `EntradasPage.tsx`

`BadgeBoleto` passa a receber `{ proximoVencimento, totalBoletos }` em vez de só a data:
mesma lógica de cor (vencido/≤3 dias/normal) baseada em `proximoVencimento`, com
`totalBoletos > 1` acrescentando "· +{totalBoletos - 1}" ao lado da data. O banner de
alerta (`boletosVencendo`) continua filtrando por `e.proximoVencimentoBoleto` dentro de
≤3 dias — mesma granularidade de hoje (por nota).

### 7.4 `EntradaDetalhePage.tsx`

O bloco "Boleto:" vira uma lista (um item por boleto), cada um mostrando a data
formatada — mesmo estilo visual do bloco atual, só repetido por boleto. Quando
`boletos.length === 0`, o bloco inteiro não aparece (mesmo comportamento de hoje com
`temBoleto` falso).

### 7.5 Reaproveitamento

Mesmo padrão de `useFieldArray` + `CampoTexto` já usado para "Itens da Entrada" no
próprio `EntradaFormPage.tsx` — nenhum componente novo de UI precisa ser criado.

---

## 8. Validações e casos-limite

| Caso | Comportamento |
|---|---|
| "Tem boleto" marcado, nenhuma data preenchida | Bloqueado no formulário (mesma mensagem de hoje) |
| Data de boleto no passado | Bloqueado (`GreaterThanOrEqualTo` hoje), igual regra atual |
| "Tem boleto" desmarcado | `datasVencimentoBoleto` não é enviado; `Boletos` fica vazio; `TemBoleto` computado = false |
| Entrada com 1 boleto (caso comum, igual hoje) | Badge mostra só a data, sem contador |
| Entrada com 2+ boletos | Badge mostra o mais próximo + "+N"; detalhe lista todos |
| Cancelamento de entrada | Sem alteração — boletos não são tocados ao cancelar (cancelar nunca os tocou, era só um campo informativo) |
| Dados existentes na migration | 1:1 preservados — toda entrada com `tem_boleto=true` ganha exatamente 1 linha em `boletos_entrada` com a data que já tinha |

---

## 9. Critérios de aceite

- [ ] Registrar entrada com 2+ boletos de datas diferentes.
- [ ] Listagem mostra o vencimento mais próximo + contador quando há mais de um.
- [ ] Detalhe da entrada lista todos os boletos da nota.
- [ ] Banner de alerta (≤3 dias) continua funcionando, agora baseado no vencimento mais próximo de cada nota.
- [ ] Entrada sem boleto comporta-se exatamente como hoje (sem bloco de boleto no detalhe, badge "—" na listagem).
- [ ] Migration preserva os boletos já cadastrados (1 boleto por entrada existente, com a mesma data).
- [ ] `tsc --noEmit` zero erros; suíte de testes backend passando.

---

## 10. Testes

- **Backend:** `EntradaMercadoriaTests` (domínio) cobrindo `AdicionarBoleto` (múltiplas
  datas, bloqueio em entrada cancelada) e as propriedades computadas `TemBoleto`/
  `ProximoVencimentoBoleto` (vazio → null/false; 1 boleto; 2+ boletos → menor data).
  `RegistrarEntradaCommandHandlerTests`: caso novo com 2+ datas de boleto; caso sem
  boleto (lista vazia/null). `RegistrarEntradaValidatorBoletoTests`: ajustar os testes
  existentes para a nova forma de comando (lista em vez de bool+data única); caso novo
  com 1 data no passado dentro da lista bloqueado.
- **Frontend:** `tsc --noEmit`; teste manual adicionando/removendo linhas de boleto no
  formulário.
- **Manual (staging):** registrar entrada com 2 boletos; conferir badge "data · +1" na
  listagem; abrir detalhe e ver as 2 datas; registrar outra com 1 data vencendo em 2
  dias e confirmar que o banner aparece.

---

## 11. Fora de escopo (YAGNI)

- Valor/parcela por boleto (confirmado fora de escopo pelo usuário).
- Edição de entrada já registrada (não existe hoje, não é criado aqui).
- Marcar boleto como "pago" — sistema não tem conceito de pagamento, só de vencimento informativo.
- Banner contando boletos individualmente em vez de por nota.
