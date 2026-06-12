# Despesas (Fixas + Variáveis) + Compras das Notas — Redesenho do Financeiro

**Data:** 2026-06-11
**Status:** Aprovado (design) — aguardando revisão do spec
**Relacionado:** evolui a Fase 1 (Despesas Fixas + Fechamento) e respeita a Fase 2 (Precificação).

---

## 1. Objetivo

Hoje o financeiro só tem "Despesas Fixas", o que dá uma visão incompleta das saídas
da empresa. Este redesenho torna o módulo completo, com três blocos:
1. **Despesas fixas** (overhead recorrente) — já existe.
2. **Despesas variáveis** (variam com a operação) — novo.
3. **Compras (notas)** — total de insumos comprados no mês, **somente leitura**,
   consumido do módulo de Entradas (não é registro manual).

---

## 2. Decisões de design (confirmadas)

| Tema | Decisão |
|---|---|
| Modelo | Unificar `DespesaFixa` → entidade **`Despesa`** com campo **`Tipo` (Fixa \| Variável)**. Uma CRUD, uma tabela. |
| Categorias | Enum compartilhado `CategoriaDespesa` (renomeia `CategoriaDespesaFixa`, mesmos valores) + categorias de variável (taxa de cartão, comissão delivery, embalagens, frete). |
| Compras | **Read-only**, derivadas das Entradas confirmadas do mês (reusa a lógica de `EntradasRelatorioQueryHandler`). Não viram `Despesa`. |
| Contábil — rateio | `DespesaFixaPercentual` da precificação **continua = despesas FIXAS / faturamento** (não muda). Compras e variáveis **ficam fora** do rateio (evita double-count: insumo já está no custo direto; variável já é coberta por "taxas %"). |
| Contábil — fechamento | Duas lentes claras: **Margem operacional** (accrual, usa custo direto) e **Total de saídas no mês** (caixa, usa compras). Ver §5. |
| Permissões | Admin + Coordenador (mantém). |

> **Por que compras ficam fora da margem operacional:** custo direto = COGS do que foi
> **vendido** (accrual); compras = insumos **comprados** no mês (caixa). Somar os dois
> contaria o insumo duas vezes. Então a margem operacional usa custo direto; as compras
> aparecem só na visão de caixa ("total de saídas").

---

## 3. Modelo de dados (Domain)

### 3.1 Renomear `DespesaFixa` → `Despesa` + `Tipo`
Campos atuais mantidos (`Competencia`, `Categoria`, `Descricao`, `Valor`, `Observacao`,
`DataLancamento`, `Ativo`, auditoria) + **novo** `Tipo` (`TipoDespesa`). Factory
`Criar(...)` e `Atualizar(...)` ganham o parâmetro `tipo`. `NormalizarCompetencia`
permanece (já reusada pela precificação/fechamento).

### 3.2 `TipoDespesa` (enum novo)
```
Fixa = 1
Variavel = 2
```

### 3.3 `CategoriaDespesa` (renomeia `CategoriaDespesaFixa`)
Mesmos valores 1–11 + novos para variável:
```
... (1–11 existentes: Aluguel..Outros) ...
TaxaCartao = 12
ComissaoDelivery = 13
Embalagens = 14
Frete = 15
```
> Categorias são **compartilhadas** entre tipos (uma despesa de "Marketing" pode ser fixa
> ou variável). A UI sugere as mais comuns por tipo, mas não bloqueia.

### 3.4 Migration `RenomearDespesaFixaParaDespesaComTipo`
- `RENAME TABLE financeiro.despesas_fixas → financeiro.despesas`.
- `ADD COLUMN tipo int NOT NULL DEFAULT 1` (backfill **Fixa** nas linhas existentes — dados preservados).
- Coluna `categoria` continua int (`HasConversion<int>`); novos valores não exigem migração de dados.

---

## 4. Backend — casos de uso

### 4.1 Renome do módulo `DespesasFixas` → `Despesas`
`Application/Despesas/{Commands,Queries,Dtos}`:
- `CriarDespesaCommand(Competencia, Tipo, Categoria, Descricao, Valor, Observacao, DataLancamento)`
- `AtualizarDespesaCommand(Id, Tipo, …)`
- `CancelarDespesaCommand(Id)`
- `ListarDespesasQuery(Competencia, Tipo?)` → `DespesasMesDto(Competencia, TotalFixas, TotalVariaveis, IReadOnlyList<DespesaDto> Itens, IReadOnlyList<TotalCategoriaDto> TotalPorCategoria)`
  - `DespesaDto` ganha `Tipo`. Quando `Tipo` filtro informado, retorna só daquele tipo; os totais `TotalFixas`/`TotalVariaveis` consideram **todas** as despesas do mês (para os KPIs).
- Validators: `Tipo` `IsInEnum`; demais regras mantidas.

### 4.2 Compras (consolidação read-only)
- `ObterComprasMesQuery(Competencia)` → `ComprasMesDto(Competencia, TotalCompras, IReadOnlyList<CompraNotaDto> Itens)`
  - `CompraNotaDto(Guid EntradaId, string Fornecedor, string? NumeroNotaFiscal, DateTime Data, decimal Total)`
  - Implementação: `IEntradaMercadoriaRepository.ListarAsync(inicio, fim)`, filtra `Status == Confirmada`, soma `Itens.Sum(i => i.CustoTotal)` por entrada (mesma lógica do relatório de entradas). Mês = `[comp, comp.AddMonths(1).AddDays(-1)]` (boundary inclusivo do repo, como na Fase 1).

### 4.3 Fechamento Mensal (atualizado)
`FechamentoMensalDto` ganha:
- `TotalDespesasFixas` (já existe — passa a somar só `Tipo == Fixa`)
- **`TotalDespesasVariaveis`** (novo — soma `Tipo == Variavel`)
- **`TotalCompras`** (novo — das notas)
- **`TotalSaidas`** = `TotalDespesasFixas + TotalDespesasVariaveis + TotalCompras` (caixa)
- `MargemOperacional` recalculada = `FaturamentoUsado − CustoDiretoTotal − TotalDespesasFixas − TotalDespesasVariaveis`
- `DespesaFixaPercentual` **inalterado** = `TotalDespesasFixas / FaturamentoUsado` (só fixas → precificação não muda)
- `PrimeCost`, `MargemBruta`, `FolhaPagamento` mantidos.
- Handler passa a injetar `IEntradaMercadoriaRepository` (ou envia `ObterComprasMesQuery` via MediatR) e a separar despesas por `Tipo`.

### 4.4 Precificação — **não muda**
`ObterAnalisePrecificacaoQuery` continua lendo `DespesaFixaPercentual` (agora corretamente só fixas). Nenhuma alteração de código na precificação.

### 4.5 API
- Renomear controller/rota: `DespesasFixasController` (`api/despesas-fixas`) → **`DespesasController`** (`api/despesas`), com os mesmos verbos + `tipo` no body/query.
- Novo: `GET /api/despesas/compras?competencia=` → `ComprasMesDto`.
- `FechamentoMensalController` inalterado de rota (DTO ganha campos).
- Todos `[Authorize(Roles="Admin,Coordenador")]`.

---

## 5. Fechamento — as duas lentes (texto para o usuário leigo)
- **Margem operacional**: "quanto sobrou do que foi vendido, depois do custo dos produtos e das despesas fixas e variáveis." = faturamento − custo direto − fixas − variáveis.
- **Total de saídas no mês (caixa)**: "quanto dinheiro saiu no mês" = fixas + variáveis + compras de insumos.
- A tela explica em uma linha cada um, para não confundir.

---

## 6. Frontend

### 6.1 Renome do módulo `despesas-fixas` → `despesas`
`features/financeiro/despesas/{components,hooks,pages,services}`. Sidebar: item passa a
**"Despesas"** (rota `/financeiro/despesas`).

### 6.2 Tela Despesas
- **Toggle Fixa / Variável** no topo: filtra a lista e define o `tipo` ao cadastrar (o modal abre já com o tipo selecionado).
- KPIs: **Total fixas**, **Total variáveis**, **Total geral (mês)**.
- Tabela de despesas do tipo selecionado (categoria, descrição, valor, data, ações) — modal de cadastro/edição ganha o campo tipo (ou herda do toggle); remoção via `ModalDesativar`.
- Card **"Compras do mês (notas)"** read-only: total + pequena lista (fornecedor · nota · data · valor) e link para `/entradas`. Vem de `GET /despesas/compras`.

### 6.3 Tela Fechamento
Ganha os KPIs/linhas: despesas variáveis, compras (notas), total de saídas; e a margem
operacional recalculada. Mantém faturamento auto/manual, % despesa fixa, prime cost.

### 6.4 Tipos/labels
`CATEGORIA_DESPESA_LABELS` ganha as 4 categorias novas (string camelCase: `taxaCartao`,
`comissaoDelivery`, `embalagens`, `frete`). Novo `TIPO_DESPESA_LABELS` (`fixa`/`variavel`).
Enums seguem o padrão **string camelCase** sobre a API (Fase 1).

---

## 7. Migração / compatibilidade
- Renome de tabela preserva dados; `tipo` default Fixa nas linhas existentes.
- Renome do enum `CategoriaDespesaFixa → CategoriaDespesa` não muda valores no banco (int) nem na wire (camelCase).
- **Quebra de contrato de API** (`/despesas-fixas` → `/despesas`): aceitável — só há staging (sem usuários reais); o frontend é atualizado junto.
- Aplica no Render via `Migrate()` no startup (deploy).

---

## 8. Validações e casos-limite
- `Tipo` obrigatório e válido; `Valor > 0`; categoria válida; competência presente (mantém Fase 1).
- Mês sem despesas / sem compras → totais 0; cards vazios com EmptyState.
- Compras: só entradas **confirmadas** (canceladas fora da soma).
- Fechamento sem faturamento → `% despesa fixa` null (mantém); margem operacional ainda calculável (pode ser negativa).
- Divisão por zero protegida (mantém).

---

## 9. Critérios de aceite
- [ ] Cadastrar/editar/remover despesa escolhendo **Fixa** ou **Variável**.
- [ ] Listar por tipo e ver total fixas, total variáveis e total geral do mês.
- [ ] Card "Compras do mês" mostrando total e itens das notas confirmadas (read-only).
- [ ] Fechamento com despesas fixas, variáveis, compras, total de saídas e margem operacional recalculada.
- [ ] `DespesaFixaPercentual` (precificação) permanece só com despesas fixas — precificação inalterada.
- [ ] Migration renomeia a tabela e backfilla `tipo = Fixa` sem perder dados.
- [ ] Compras nunca entram no rateio de precificação nem na margem operacional (sem double-count).
- [ ] UI consistente com tokens/primitivos; texto pt-BR claro para leigo.

---

## 10. Testes
- **Backend** (`CasaDiAna.Application.Tests`): renomear os testes de `DespesasFixas` → `Despesas`; cobrir `Tipo` em criar/atualizar; `ListarDespesasQuery` separando totais fixas/variáveis; `ObterComprasMesQuery` (soma só confirmadas; canceladas fora); `ObterFechamentoMensalQueryHandler` cobrindo: separação fixa/variável, `TotalCompras`, `TotalSaidas`, `MargemOperacional` recalculada e `DespesaFixaPercentual` só fixas.
- **Frontend**: tsc + lint (sem runner — Fase 1/2).
- **E2E** (staging Render, login seed): cadastrar 1 fixa + 1 variável; conferir totais; conferir card de compras com uma entrada real do mês; conferir fechamento (variáveis, compras, total de saídas, margem operacional) à mão; confirmar que a precificação (% despesa fixa) não mudou.

---

## 11. Pendências / validar com dados reais
- Conjunto de categorias variáveis (taxa cartão, comissão delivery, embalagens, frete) — ajustar com o cliente.
- Se o cliente quiser, futuramente, variáveis também no rateio de precificação (hoje fora, para não conflitar com "taxas %").
- Nomenclatura "margem operacional" vs "total de saídas" — validar clareza com o usuário leigo.

---

## 12. Fora de escopo (YAGNI)
Módulo de Entradas (só consumido, não alterado); custo direto/ficha técnica; rateio de
precificação; previsão/orçamento; recorrência automática de despesas; conciliação de boletos.
