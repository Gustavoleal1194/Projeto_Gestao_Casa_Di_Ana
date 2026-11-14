# Baixa automática de insumos pela venda — Design

**Data:** 2026-11-14
**Status:** Fase 1 implementada (2026-11-14) — decisões D1–D4 aprovadas conforme recomendação
**Módulos afetados:** Produtos, Produção Diária, Vendas Diárias, Importação de Vendas, Perdas, Relatórios, Dashboard

---

## 1. Problema

Hoje a venda e a produção são eventos independentes:

| Evento | Baixa ingredientes? | Registra custo? |
|---|---|---|
| Produção (manual) | Sim, pela ficha técnica | Sim (`CustoTotal`) |
| Venda (importada do PDV ou manual) | **Não** | **Não** |

Consequência: quando um item é vendido sem que a produção tenha sido lançada,

- o estoque de ingredientes fica **acima do real** (alertas, inventário e compras ficam errados);
- o custo do que foi vendido é desconhecido, e Dashboard/Relatórios precisam de fallbacks
  (commits `9c6ae91`, `7f07dfe`: "margem usa custo da ficha quando não há produção");
- o relatório Produção vs Vendas mostra "vendeu mais do que produziu", que é ruído, não informação.

Lançar automaticamente "toda venda = produção" não resolve: apaga sobras e perdas, conta duas
vezes itens produzidos em lote e vendidos em vários dias, e duplica quando a produção manual é
lançada depois da importação.

## 2. Princípios

1. **Cada produto tem um modo de controle de estoque.** Não existe uma regra única certa para
   café e para bolo.
2. **A venda é um fato e nunca é bloqueada.** Ela vem do PDV; o sistema se adapta a ela.
3. **Dado inferido é sempre sinalizado.** O que o sistema deduz (produção automática) fica
   separado e visível em relação ao que foi lançado por uma pessoa.
4. **Uma única implementação de "baixar a ficha técnica".** Produção, venda e produção
   automática usam o mesmo serviço de domínio/aplicação.

## 3. Modelo

### 3.1 Modos de controle (`TipoProduto`)

| Valor | Rótulo na UI | Exemplos | Baixa dos ingredientes | Produção manual |
|---|---|---|---|---|
| `Produzido = 1` *(existente)* | **Produzido em lote** | bolo, torta, salgado, pão de queijo | Na produção | Sim |
| `Revenda = 2` *(existente)* | Revenda | refrigerante, água | Nenhuma (sem ficha) | Não |
| `FeitoNaHora = 3` *(novo)* | **Feito na hora** | café, sanduíche, suco | **Na venda** | Não |

- O nome do membro `Produzido` é mantido para não quebrar o wire format da API
  (enums trafegam como string camelCase); muda só o rótulo exibido.
- Produtos existentes continuam `Produzido`. O gestor reclassifica os itens "feitos na hora"
  pelo cadastro de produtos (ver §7, Migração).

### 3.2 Ficha técnica

A semântica não muda: `ItemFichaTecnica.QuantidadePorUnidade` é **por unidade vendida**
(a mesma unidade do PDV). Lançar produção em "lotes" (ex.: 1 bolo = 12 fatias) é uma
melhoria de UX da Fase 3 e não altera a ficha.

---

## 4. Fase 1 — Baixa na venda para itens "Feito na hora"

Resolve a maior parte das "vendas sem produção" com risco baixo.

### 4.1 Primitivo: `BaixaFichaTecnicaService`

Extraído do `RegistrarProducaoCommandHandler` (passos 2–4 atuais). Ele:

- recebe `Produto` (com ficha), `quantidade`, `TipoMovimentacao`, `referenciaTipo`, `referenciaId`;
- baixa cada ingrediente (`AtualizarEstoque`), cria a `Movimentacao` correspondente e devolve o
  **custo total** calculado pelo custo unitário atual dos ingredientes;
- aceita um **cache de ingredientes** por operação, para a importação (dezenas de vendas) não
  fazer N consultas por produto;
- **não** chama `SalvarAsync`: quem chama controla a transação (um único `SaveChanges`);
- devolve os ingredientes afetados para a verificação de notificações de estoque baixo
  (`INotificacaoEstoqueService`) depois do commit.

`RegistrarProducaoCommandHandler` passa a usar o serviço. O comportamento não muda (coberto
pelos testes existentes).

### 4.2 Nova movimentação

`TipoMovimentacao.SaidaVenda = 5`, com `ReferenciaTipo = "VendaDiaria"` e `ReferenciaId = venda.Id`.
O frontend de Movimentações (filtro, KPIs, stream, chart) passa a tratar o novo tipo como saída.

### 4.3 Custo na venda

`VendaDiaria` ganha `CustoTotal` (`decimal?`, coluna `custo_total`, nullable):

- `FeitoNaHora` com ficha → custo da baixa no momento da venda (snapshot);
- demais casos → `null` (vendas históricas continuam `null`).

O custo vendido de itens feitos na hora deixa de depender de fallback, porque há o valor real
da época.

### 4.4 Regras

| Situação | Comportamento |
|---|---|
| Venda de `FeitoNaHora` **com** ficha | Registra a venda, baixa os ingredientes (`SaidaVenda`), grava `CustoTotal` |
| Venda de `FeitoNaHora` **sem** ficha | Registra a venda sem baixa, `CustoTotal = null`, e devolve um **aviso** (não bloqueia) |
| Venda de `Produzido` ou `Revenda` | Como hoje (a Fase 2 trata `Produzido`) |
| `RegistrarProducao` de `FeitoNaHora` | `DomainException`: "O produto 'X' é feito na hora; os insumos são baixados na venda." |
| Ingrediente com estoque insuficiente | Baixa normalmente; o domínio já clampa em 0 e a notificação de estoque baixo dispara |

### 4.5 Pontos de entrada

- `RegistrarVendaCommandHandler` (venda manual);
- `ConfirmarImportacaoCommandHandler` (importação do PDV): baixa todas as vendas `FeitoNaHora`
  no mesmo `SaveChanges` da importação. O `ResultadoImportacaoDto` ganha
  `ProdutosSemFicha: string[]` para a tela de resultado exibir o aviso.

### 4.6 Fora do escopo da Fase 1

- **Editar ou excluir venda/produção:** não existe hoje. Quando existir, deverá estornar as
  movimentações pela `ReferenciaId` (o modelo já permite).
- **Reimportação do mesmo dia com outro arquivo:** já duplica vendas hoje (o hash só bloqueia
  o mesmo arquivo). Com a Fase 1, duplicaria também a baixa. Ver Decisão D3.

---

## 5. Fase 2 — Saldo de produto pronto para itens "Produzido em lote"

### 5.1 Conceito

Cada produto `Produzido` tem um **saldo de produto pronto** (a "vitrine"), em unidades vendidas.

| Evento | Efeito no saldo |
|---|---|
| Produção manual | **+ quantidade** (e baixa os ingredientes, como hoje) |
| Venda | **− quantidade** |
| Perda | **− quantidade** |
| Ajuste de vitrine (contagem) | define o saldo contado |

### 5.2 Produção automática (cobre o déficit)

Se uma venda ou perda deixaria o saldo negativo, o sistema cria uma `ProducaoDiaria` com
`Origem = Automatica` e quantidade igual ao déficit, baixa os ingredientes pelo
`BaixaFichaTecnicaService` (`SaidaProducao`) e deixa o saldo em 0.

- Produto `Produzido` **sem ficha** → não há como gerar a produção automática; o saldo fica
  em 0 (sem baixa) e o aviso da importação lista o produto (mesma regra da §4.4).
- `ProducaoDiaria` ganha `Origem` (`Manual = 1`, `Automatica = 2`; coluna `origem`,
  default `Manual` para os registros existentes) e `VendaOrigemId` opcional (rastreabilidade).

### 5.3 Compensação (produção manual lançada depois da venda)

Caso comum: a importação das vendas do dia D roda antes de alguém lançar a produção do dia D.

Ao registrar uma **produção manual** do produto P na data D:

1. procura produções **automáticas** de P na data D com quantidade em aberto;
2. abate a quantidade manual dessas automáticas (reduz ou zera o registro automático) e
   **estorna** a baixa de ingredientes correspondente (`AjustePositivo` com
   `ReferenciaTipo = "ProducaoDiaria"` da automática);
3. o restante da quantidade manual entra no saldo normalmente.

Resultado: lançar a produção antes ou depois da importação gera o mesmo estoque final.
A janela de compensação é a **mesma data** (Decisão D2).

### 5.4 Persistência do saldo

- `Produto.SaldoPronto` (`decimal`, coluna `saldo_pronto`, default 0), alterado apenas por
  métodos de domínio (`EntrarProducao`, `SairVenda`, `SairPerda`, `AjustarSaldo`), que devolvem
  o déficit quando houver;
- `MovimentacaoProduto` (nova tabela, ledger): `ProdutoId`, `Tipo`, `Quantidade`, `SaldoApos`,
  `ReferenciaTipo`, `ReferenciaId`, `Data`, `CriadoPor`. É o mesmo padrão de `Movimentacao`
  dos ingredientes: todo saldo tem trilha de auditoria.

### 5.5 Relatórios e Dashboard

- **Produção vs Vendas:** separa a produção em *manual* e *automática*;
- **Dashboard:** KPI "Produção automática no período" (quantidade e % do total), um indicador de
  disciplina de lançamento da equipe;
- **Custo vendido / margem:** passa a vir de `VendaDiaria.CustoTotal` (Fase 1) e das produções
  (manuais e automáticas). Os fallbacks de "custo da ficha quando não há produção" ficam
  restritos a dados históricos.

---

## 6. Fase 3 — Opcional, depois de usar as Fases 1 e 2

- **Produção em lotes:** o produto define `UnidadesPorLote` (ex.: 12); a tela de produção
  permite lançar "2 bolos" e converte para 24 unidades;
- **Perecível do dia:** produto marcado como "vende no dia"; no fechamento, o saldo restante vira
  perda automática sinalizada ("sobra não registrada");
- **Estoque de revenda:** saldo próprio para itens `Revenda`, com entrada pela nota fiscal.

---

## 7. Migração e implantação

1. Migration: `vendas_diarias.custo_total` (null), `producoes_diarias.origem` (default 1),
   `producoes_diarias.venda_origem_id` (null), `produtos.saldo_pronto` (default 0) e a tabela
   `movimentacoes_produto` (Fase 2).
2. Nenhum dado histórico é recalculado: vendas antigas não geram baixa retroativa.
3. Depois do deploy da Fase 1: o gestor revisa o cadastro e muda para **Feito na hora** os itens
   preparados na hora. A listagem de Produtos ganha filtro por tipo para facilitar.
4. Fase 2: o saldo começa em 0 para todos. Recomenda-se um **ajuste de vitrine** no primeiro dia,
   senão as primeiras vendas de itens já prontos geram produções automáticas.

O sistema está em staging (pré-lançamento), então não há dado real de produção a preservar.

---

## 8. Testes (`tests/CasaDiAna.Application.Tests`)

**Fase 1**
- `BaixaFichaTecnicaService`: baixa por item, movimentação com referência, custo calculado,
  ingrediente compartilhado entre produtos na mesma operação (cache);
- `RegistrarProducao`: regressão de comportamento; rejeita `FeitoNaHora`;
- `RegistrarVenda`: `FeitoNaHora` com ficha baixa e grava custo; sem ficha não baixa;
  `Produzido`/`Revenda` inalterados;
- `ConfirmarImportacao`: baixa em lote num único save; `ProdutosSemFicha` preenchido.

**Fase 2**
- Venda com saldo suficiente não gera produção automática;
- Venda com déficit gera automática igual ao déficit e zera o saldo;
- Perda com déficit segue a mesma regra;
- Compensação: produção manual depois da importação abate a automática e estorna os
  ingredientes; o estoque final é igual ao da ordem inversa;
- Compensação parcial (manual menor que a automática) e excedente (manual maior que a automática).

---

## 9. Decisões em aberto (para o Gustavo)

| # | Decisão | Recomendação |
|---|---|---|
| D1 | Venda de `FeitoNaHora` sem ficha: avisar ou bloquear a importação? | **Avisar.** A venda é fato do PDV; bloquear trava o caixa do dia |
| D2 | Janela de compensação da produção manual: mesma data, ou D e D-1? | **Mesma data.** É simples e previsível; D-1 pode ser adicionado se a operação pedir |
| D3 | Bloquear segunda importação da **mesma data de venda** (não só do mesmo arquivo)? | **Sim**, com confirmação explícita. Com baixa automática, duplicar vendas passa a duplicar estoque |
| D4 | Ordem de entrega | **Fase 1 → uso real por alguns dias → Fase 2** |
