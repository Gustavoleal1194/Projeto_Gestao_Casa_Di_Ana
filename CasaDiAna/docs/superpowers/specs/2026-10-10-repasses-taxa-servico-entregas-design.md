# Taxa de Serviço e Entregas na Importação e no Fechamento

**Data:** 2026-10-10
**Status:** Aprovado (design), aguardando revisão do spec

---

## 1. Contexto e objetivo

O CSV de vendas do PDV traz, além dos produtos, linhas de **taxa de serviço**
(ex.: `77;TAXA DE SERVIÇO;Indefinido;9,04;411;3719,4`) e de **entrega**
(ex.: `Entrega longe`, `Entrega perto`). Hoje essas linhas são descartadas
silenciosamente em `CsvVendasParser.IsIgnorado` e o valor desaparece do sistema:
não aparece na prévia, não é contado como "Ignorado" e não entra no faturamento.

Esse dinheiro **entra no caixa da casa e depois é repassado**:

- **Entregas:** 100% vai para o motoboy.
- **Taxa de serviço (10%):** a casa retém **25%** mais **3%** de taxa do cartão,
  ambos calculados sobre o valor total da taxa. A equipe recebe o restante (72%).

Objetivo: registrar quanto entrou de cada um, mostrar em campos próprios no
fechamento mensal como receita e lançar o repasse como saída.

---

## 2. Decisões de design (confirmadas)

| Tema | Decisão |
|---|---|
| Entra na receita? | **Sim.** Receita total = produtos + taxa + entregas, cada um em campo próprio. |
| Repasse | Lançado como saída no fechamento: equipe = taxa × (1 − retenção − cartão); motoboys = 100% das entregas. |
| Cálculo da taxa | Percentuais **somados sobre o total** (opção A). Ex.: R$ 1.000 de taxa → casa R$ 280, equipe R$ 720. |
| Percentuais | **Configuráveis** em uma configuração própria (`ConfiguracaoRepasse`), editável na tela de Fechamento Mensal. Não reaproveita `ConfiguracaoPrecificacao.Taxas`, que é conceito de formação de preço. |
| Percentuais retroativos | **Não.** Cada importação grava um snapshot dos percentuais vigentes; mudar a configuração não recalcula meses já importados. |
| Onde os valores são guardados | Na própria `ImportacaoVendas` (sem tabela nova de lançamentos). Lançamento manual de taxa ou entrega fica fora do escopo. |
| Faturamento manual | Continua substituindo **só a receita de produtos**. Taxa e entregas vêm sempre das importações. |
| Margens | Passam a usar a **receita líquida** (receita total − repasses). |
| Dashboard ("Receita Estimada") | Fora do escopo, sem alteração. |
| Importações antigas | Ficam com taxa e entrega zeradas (o dado foi descartado na época). O bloqueio de hash impede reimportar o mesmo arquivo; não há migração de dados. |

---

## 3. Classificação das linhas (Application)

### 3.1 Regra única

Hoje a regra "começa com `taxa` / `entrega`" existe duplicada em
`CsvVendasParser.IsIgnorado` (Infrastructure) e
`ProcessarPreviewVendasCommandHandler.IsIgnorado` (Application), cada um com sua
própria cópia de `Normalizar`.

Passa a existir um único classificador em
`Application/ImportacaoVendas/Services/ClassificadorLinhaVenda.cs`:

```csharp
public enum TipoRepasse { TaxaServico = 1, Entrega = 2 }

public static class ClassificadorLinhaVenda
{
    // Nome normalizado (sem acento, minúsculo) começando com "taxa" → TaxaServico;
    // com "entrega" → Entrega; senão null (linha de produto).
    public static TipoRepasse? ClassificarRepasse(string nome);
}
```

`TipoRepasse` fica em `Domain/Enums/` porque é usado pela entidade
`ImportacaoVendas` (seção 5).

### 3.2 Parser

`CsvVendasParser` **para de filtrar** taxa e entrega: devolve todas as linhas
válidas (nome não vazio, quantidade > 0, total parseável). `IsIgnorado` e a cópia
de `Normalizar` usada só por ele são removidos. Os testes `Parse_TaxaDeServico_Ignorada`,
`Parse_EntregaLonge_Ignorada`, `Parse_MultiplasLinhas_TaxaFiltrada_RestanteImportado`
e `IsIgnorado_SoTaxaEEntrega` passam a afirmar que as linhas **são devolvidas**, e a
classificação ganha testes próprios.

---

## 4. Prévia e confirmação da importação

### 4.1 Prévia (`ProcessarPreviewVendasCommandHandler`)

- `StatusImportacao` ganha `Repasse = 5`. Na API ele trafega como string camelCase
  `"repasse"`, como os demais enums.
- Linha classificada como repasse → `ItemPreviewDto` com `Status = Repasse`,
  `TipoRepasse` preenchido e sem sugestões de produto. Ela não passa pelo matching.
- O ramo `Ignored` por nome é removido (era código morto). `Ignored` continua no
  enum por compatibilidade, sem uso por nome.
- `ItemPreviewDto` ganha `TipoRepasse? TipoRepasse`.
- `PreviewImportacaoDto` ganha `TotalRepasses` (contagem de linhas),
  `TotalTaxaServico` e `TotalEntregas` (soma de `ValorTotal` por tipo).

### 4.2 Confirmação (`ConfirmarImportacaoCommand`)

- Ganha `decimal TotalTaxaServico` e `decimal TotalEntregas`.
- O validator exige `>= 0` em ambos.
- O handler lê a `ConfiguracaoRepasse` vigente (ou a padrão, se não existir) e
  grava na importação: `DataVenda`, os dois totais e o snapshot dos percentuais.
- Uma importação **só de repasses** (sem itens de produto) é válida.
- `ResultadoImportacaoDto` ganha `TotalTaxaServico` e `TotalEntregas`.

**Confiança nos totais enviados pelo cliente:** igual às contagens já enviadas hoje
(`TotalIgnoradas`, `TotalNaoEncontradas`), os totais vêm da prévia pelo cliente. O
confirmar não recebe o arquivo para reprocessá-lo, e mudar isso foge ao escopo.
O sistema é interno e autenticado, e o validator bloqueia negativos.

### 4.3 Frontend (`ImportacaoVendasPage` e `ConfirmacaoImportacaoModal`)

- Novo status visual **"Repasse"** na tabela da prévia, com o valor da linha, sem
  seletor de produto.
- Novo card de contagem "Repasses" ao lado de "Ignorados".
- O modal de confirmação mostra "Taxa de serviço: R$ X" e "Entregas: R$ Y" quando
  houver valor.
- O envio inclui `totalTaxaServico` e `totalEntregas` vindos da prévia.
- Linhas com status `repasse` não entram em `itens`.

---

## 5. Modelo de dados

### 5.1 `ImportacaoVendas` (campos novos)

| Campo | Tipo | Coluna |
|---|---|---|
| `DataVenda` | `DateTime?` (null em importações antigas) | `data_venda` (date) |
| `TotalTaxaServico` | `decimal` | `total_taxa_servico` numeric(12,2), default 0 |
| `TotalEntregas` | `decimal` | `total_entregas` numeric(12,2), default 0 |
| `PercentualRetencaoCasa` | `decimal` | `percentual_retencao_casa` numeric(6,4), default 0 |
| `PercentualTaxaCartao` | `decimal` | `percentual_taxa_cartao` numeric(6,4), default 0 |

Propriedades calculadas, ignoradas pelo EF:

- `RepasseEquipe = TotalTaxaServico × (1 − PercentualRetencaoCasa − PercentualTaxaCartao)`
- `RepasseMotoboys = TotalEntregas`

`Criar(...)` recebe os novos valores. O domínio valida totais `>= 0` e percentuais
em [0, 1) com soma < 1, lançando `DomainException`.

### 5.2 Entidade nova `ConfiguracaoRepasse`

Segue o padrão singleton de `ConfiguracaoPrecificacao`:

| Campo | Tipo | Padrão |
|---|---|---|
| `Id` | Guid | |
| `PercentualRetencaoCasa` | decimal | 0,25 |
| `PercentualTaxaCartao` | decimal | 0,03 |
| `AtualizadoEm` / `AtualizadoPor` | auditoria | |

- `Padrao(criadoPor)` cria com os valores padrão.
- `Atualizar(retencao, cartao, usuario)` valida cada valor em [0, 1) e a soma < 1.
- Tabela `financeiro.configuracao_repasse` (mesmo schema de `configuracao_precificacao`),
  com colunas em snake_case via `HasColumnName` e percentuais com `HasPrecision(6, 4)`.

### 5.3 Migration

`AddRepassesImportacaoVendas`: adiciona as cinco colunas em `producao.importacoes_vendas`
e cria `configuracao_repasse`. Não insere linha de configuração: a query devolve
`Padrao` quando ela não existe, como em Precificação.

---

## 6. Configuração de repasses (API)

No `FechamentoMensalController` (`api/fechamento-mensal`):

- `GET configuracao-repasse` devolve `ConfiguracaoRepasseDto(PercentualRetencaoCasa, PercentualTaxaCartao)`.
- `PUT configuracao-repasse` usa `AtualizarConfiguracaoRepasseCommand`, com validator
  FluentValidation espelhando as regras do domínio.

O frontend trabalha em percentual (25, 3) e converte para fração (0,25, 0,03) no
service, como já faz em Precificação.

---

## 7. Fechamento mensal

### 7.1 Cálculo (`ObterFechamentoMensalQueryHandler`)

- `IImportacaoVendasRepository` ganha
  `ListarPorDataVendaAsync(DateTime inicio, DateTime fim, CancellationToken)`, com o
  filtro de data exclusivo `< fim`, seguindo a regra do projeto.
- A partir das importações do mês:

```
ReceitaProdutos   = FaturamentoUsado (calculado ou manual, como hoje)
ReceitaTaxaServico = Σ TotalTaxaServico
ReceitaEntregas    = Σ TotalEntregas
ReceitaTotal       = ReceitaProdutos + ReceitaTaxaServico + ReceitaEntregas
RepasseEquipe      = Σ RepasseEquipe
RepasseMotoboys    = Σ RepasseMotoboys
TotalRepasses      = RepasseEquipe + RepasseMotoboys
ReceitaLiquida     = ReceitaTotal − TotalRepasses

TotalSaidas           = fixas + variáveis + compras + TotalRepasses
DespesaFixaPercentual = fixas / ReceitaLiquida   (null se ReceitaLiquida ≤ 0)
MargemBruta           = ReceitaLiquida − custoDireto
MargemOperacional     = ReceitaLiquida − custoDireto − fixas − variáveis
PrimeCost             = sem alteração
```

Sem taxa e entrega no mês, todos os números ficam idênticos aos de hoje.

### 7.2 `FechamentoMensalDto` (campos novos)

`ReceitaTaxaServico`, `ReceitaEntregas`, `ReceitaTotal`, `RepasseEquipe`,
`RepasseMotoboys`, `TotalRepasses`, `ReceitaLiquida`. Os campos atuais continuam,
e `FaturamentoUsado` segue significando a receita de produtos.

### 7.3 Frontend (`FechamentoMensalPage`)

- Novo bloco **"Receitas e repasses"**: Receita de produtos, Taxa de serviço,
  Entregas, **Receita total**, Repasse à equipe, Repasse aos motoboys, **Receita
  líquida da casa**.
- Os KPIs de margem passam a refletir a receita líquida, e o rótulo deixa isso claro.
- Botão "Configurar repasses" abre um modal com os dois percentuais, usando os
  componentes de formulário existentes (zod + react-hook-form) e tokens `--ada-*`.
- A linha de valor reaproveita o componente de linha já usado na página.
  Se não existir um, ele é extraído antes de ser usado nos dois blocos, para não
  duplicar JSX.

---

## 8. Testes

- **Domain:** `ImportacaoVendas` (cálculo de repasses, validações) e
  `ConfiguracaoRepasse` (padrão e validações).
- **Application:** `ClassificadorLinhaVenda`; prévia (status `Repasse`, totais);
  confirmação (grava totais, snapshot dos percentuais, importação só de repasses,
  validator); fechamento (com e sem repasses, faturamento manual + repasses,
  receita líquida zero); handlers de configuração.
- **Infrastructure:** os testes do parser são ajustados conforme 3.2.
- **Frontend:** `npx tsc -b --noEmit` e verificação manual da importação e do
  fechamento no navegador.

---

## 9. Fora do escopo

- Dashboard / "Receita Estimada".
- Lançamento manual de taxa ou entrega.
- Controle de pagamento individual a garçons e motoboys.
- Reprocessar importações antigas.
