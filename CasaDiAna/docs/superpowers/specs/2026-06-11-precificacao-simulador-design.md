# Precificação + Simulador de Preço — Fase 2

**Data:** 2026-06-11
**Status:** Aprovado (design) — aguardando revisão do spec
**Fase:** 2 de 2 (sequência da Fase 1 — Despesas Fixas + Fechamento Mensal)

> A Fase 1 entregou a camada de despesas fixas e o fechamento mensal consolidado
> (incl. `DespesaFixaPercentual` por competência). A Fase 2 usa esse percentual + o
> custo direto da ficha técnica para sugerir preços, simular cenários e classificar
> os produtos por saúde de margem.

---

## 1. Objetivo

Permitir que gestão (Admin/Coordenador) analise produto a produto: custo direto x
preço atual x despesas fixas, e obtenha **preço sugerido**, **margem líquida estimada**
e um **status visual**, além de um **simulador** para responder "se eu vender por X,
ainda tenho margem?".

### Regra central (mantida da Fase 1)
- **Custo direto** vem da ficha técnica (`Produto.CalcularCustoFicha()`) — não é alterado.
- **Despesas fixas** entram apenas como **rateio estimado** (via `DespesaFixaPercentual`
  do mês), nunca como CMV direto do produto.
- Distinguir **margem de contribuição** (preço − custo direto) de **margem líquida
  estimada** (preço − custo direto − rateio fixo).

---

## 2. Decisões de design (confirmadas)

| Tema | Decisão |
|---|---|
| Onde fica a matemática | **Função pura única no frontend** (`precificacaoMath.ts`), reusada pela listagem e pelo simulador. Backend devolve só insumos crus. |
| Simulador | **Modal por produto**, pré-preenchido, recalcula na hora. |
| Status visual | **5 níveis** com limiares concretos (seção 6). |
| Config de alvos | **Linha única** `ConfiguracaoPrecificacao` (CmvAlvo, MargemDesejada, Taxas), frações decimais. Defaults: CMV 30% / margem 20% / taxas 0%. |
| Ordenação/filtro da listagem | **Client-side** (dezenas de produtos; sem paginação server-side). |
| Permissões | **Admin + Coordenador** (igual Fase 1). |

---

## 3. Modelo de dados (Domain)

### 3.1 `ConfiguracaoPrecificacao` (linha única)

| Campo | Tipo | Regras |
|---|---|---|
| `Id` | `Guid` | |
| `CmvAlvo` | `decimal` | fração 0–1 (ex.: 0.30); **> 0 e < 1** |
| `MargemDesejada` | `decimal` | fração 0–1; **≥ 0 e < 1** |
| `Taxas` | `decimal` | fração 0–1; **≥ 0 e < 1** |
| `AtualizadoEm` / `AtualizadoPor` | `DateTime` / `Guid` | auditoria |

- Métodos: factory `Padrao(criadoPor)` (0.30 / 0.20 / 0.00) e
  `Atualizar(cmvAlvo, margemDesejada, taxas, atualizadoPor)` com guardas de domínio.
- Persistência de "linha única": tabela `financeiro.configuracao_precificacao`; o
  repositório expõe `ObterAsync()` (retorna a única linha ou `null`) e `AdicionarAsync`.
  O handler de leitura cria a config padrão se não existir.

> Não há entidade para a análise nem para o simulador — são **calculados**.

---

## 4. Backend — casos de uso (CQRS)

Módulo `Application/Precificacao/{Commands,Queries,Dtos}`.

### 4.1 Configuração
- `ObterConfiguracaoPrecificacaoQuery` → `ConfiguracaoPrecificacaoDto(CmvAlvo, MargemDesejada, Taxas)`.
  Se não existir linha, cria a padrão e a retorna.
- `AtualizarConfiguracaoPrecificacaoCommand(CmvAlvo, MargemDesejada, Taxas)` → DTO.
  Validator: cada fração em `[0,1)`, `CmvAlvo > 0`.

### 4.2 Análise (insumos crus)
- `ObterAnalisePrecificacaoQuery(Competencia)` → `AnalisePrecificacaoDto`:
  ```
  AnalisePrecificacaoDto(
    DateTime Competencia,
    decimal? DespesaFixaPercentual,          // via ObterFechamentoMensalQuery (MediatR)
    ConfiguracaoPrecificacaoDto Config,
    IReadOnlyList<ProdutoPrecificacaoDto> Produtos)

  ProdutoPrecificacaoDto(
    Guid Id, string Nome, string? CategoriaNome,
    decimal PrecoVenda, decimal CustoDireto, bool TemFicha)
  ```
- Implementação: `ListarComFichaAsync(apenasAtivos: true)` para custo/preço/categoria;
  `_mediator.Send(new ObterFechamentoMensalQuery(competencia))` para o `DespesaFixaPercentual`
  (reaproveita 100% a Fase 1, sem reescrever o cálculo). `CustoDireto = produto.CalcularCustoFicha()`;
  `TemFicha = produto.Tipo == Revenda ? CustoUnitario != null : ItensFicha.Any()`.

### 4.3 API — `PrecificacaoController` `[Authorize(Roles="Admin,Coordenador")]`
- `GET /api/precificacao/configuracao` → `ConfiguracaoPrecificacaoDto`
- `PUT /api/precificacao/configuracao` → atualiza
- `GET /api/precificacao/analise?competencia=YYYY-MM-DD` → `AnalisePrecificacaoDto`

---

## 5. Frontend — função pura (núcleo)

`features/financeiro/precificacao/precificacaoMath.ts` — **única fonte das fórmulas**,
usada pela listagem e pelo simulador.

```
Entrada por produto: { precoVenda, custoDireto, temFicha }
Config/contexto:     { cmvAlvo, margemDesejada, taxas, despesaFixaPct }  // frações; despesaFixaPct pode ser null
Overrides (simulador, opcionais): { precoVenda?, cmvAlvo?, margemDesejada?, taxas? }
```

Derivados (com `dfp = despesaFixaPct ?? 0`):
- `cmvAtual = preco > 0 ? custo / preco : null`
- `margemContribuicao = preco - custo`
- `rateioFixo = preco * dfp`
- `lucroEstimado = preco - custo - rateioFixo`
- `margemLiquidaEst = preco > 0 ? lucroEstimado / preco : null`
- `custoMaximoPermitido = preco * cmvAlvo`
- `precoSugeridoPorCmv = cmvAlvo > 0 ? custo / cmvAlvo : null`
- `denom = 1 - dfp - taxas - margemDesejada`
- `precoSugeridoPorMargem = denom > 0 ? custo / denom : null` (denom ≤ 0 → `invalido: true`, mensagem)
- `precoSugerido = precoSugeridoPorMargem ?? precoSugeridoPorCmv` (primário p/ a coluna "diferença")
- `diferenca = precoSugerido != null ? precoSugerido - preco : null`

Saída inclui `status` (seção 6) e flags `semCusto` (custo ≤ 0 ou `!temFicha`) e
`somaInvalida` (denom ≤ 0). Quando `semCusto`, esconder as sugestões na UI (não exibir
"R$ 0,00" enganoso) e marcar badge "ficha incompleta".

---

## 6. Status visual (5 níveis, avaliados por severidade)

Ordem de prioridade (primeiro que casar vence), usando `margemLiquidaEst` e `cmvAtual`:

1. **Prejuízo estimado** — `lucroEstimado < 0`
2. **Custo alto** — `cmvAtual > cmvAlvo` (custo da ficha acima do máximo permitido), lucro ≥ 0
3. **Abaixo do ideal** — `margemLiquidaEst < margemDesejada`
4. **Atenção** — `margemDesejada ≤ margemLiquidaEst < margemDesejada + 0.05`
5. **Saudável** — `margemLiquidaEst ≥ margemDesejada + 0.05`

Caso `semCusto` ou `preco ≤ 0`: status neutro "Indefinido" (sem classificar).
A banda de 5 pontos percentuais (`0.05`) da "Atenção" é uma constante nomeada,
fácil de ajustar.

---

## 7. Frontend — telas

Novo item **"Precificação"** no grupo **Financeiro** da Sidebar (Admin/Coordenador),
rota `/financeiro/precificacao`. Pasta `features/financeiro/precificacao/{components,hooks,pages,services}`
+ `precificacaoMath.ts`.

### 7.1 Tela Precificação
- Seletor de **competência** (mês de referência).
- **Editor da config** (CMV alvo, margem desejada, taxas — em %), com botão salvar;
  aviso se a soma `despesaFixa% + taxas% + margem% ≥ 100%`.
- Banner quando `despesaFixaPercentual == null`: "Defina o faturamento do mês no
  Fechamento para o rateio de despesas fixas" (com link para `/financeiro/fechamento`).
- **Listagem geral** (`overflow-x-auto`): produto · categoria · preço atual · custo ficha ·
  CMV% · margem contribuição · margem líquida est. · preço sugerido · diferença · status.
  - **Filtros** (client-side): categoria, status, atalhos "abaixo do ideal" / "prejuízo" / "custo alto".
  - **Ordenações** (client-side): menor margem líquida, maior diferença (atual×sugerido),
    maior CMV, maior custo direto, maior lucro estimado.
- `SkeletonTable` no loading, `EmptyState` se não houver produtos ativos.

### 7.2 Simulador (modal por produto)
Botão "Simular" na linha → modal pré-preenchido com os números do produto. Inputs:
margem desejada, CMV alvo, taxas, **preço simulado**. Recalcula na hora (mesma
`precificacaoMath`): preço sugerido, lucro estimado, margem líquida estimada, CMV
resultante, status. Bloqueia com mensagem se soma de % ≥ 100%.

### 7.3 Reaproveitamento
`PageHeader`, `KpiCard`, `StatusBadge`, `FilterBar`/`FilterButton`, `SkeletonTable`,
`EmptyState`, tokens `--ada-*`. Enums/labels e helpers de competência da Fase 1
(`features/financeiro/shared/competencia.ts`). Formatação `formatarBRL`/`formatarPercentual`
reutilizadas (mover para `shared` se necessário).

---

## 8. Infraestrutura
- `IEntityTypeConfiguration<ConfiguracaoPrecificacao>` (schema `financeiro`, snake_case).
- Repositório + interface registrados na DI.
- Uma migration: `AddConfiguracaoPrecificacao`. Aplica no Render via `Migrate()` no startup.

---

## 9. Validações e casos-limite

| Caso | Comportamento |
|---|---|
| Mês sem faturamento (`despesaFixa% = null`) | rateio tratado como 0; banner de aviso + link ao Fechamento |
| Produto sem ficha / custo 0 | flag `semCusto`; esconde sugestões; badge "ficha incompleta"; status "Indefinido" |
| Preço de venda 0 | não ocorre (domínio exige > 0); guarda mesmo assim → CMV/margem "—" |
| `denom ≤ 0` (despesaFixa% + taxas% + margem% ≥ 100%) | bloqueia preço por margem, mensagem clara |
| CMV alvo 0 | `precoSugeridoPorCmv = null` (validator impede salvar CMV alvo ≤ 0) |
| Produto inativo | excluído da análise (`apenasAtivos: true`) |
| Frações fora de `[0,1)` na config | bloqueado no validator e no domínio |

---

## 10. Critérios de aceite (Fase 2)
- [ ] Editar e persistir a config global (CMV alvo, margem desejada, taxas).
- [ ] Listagem por competência com CMV%, margem contribuição, margem líquida est., preço sugerido, diferença e status — reusando custo da ficha e o `%` de despesa fixa do mês.
- [ ] Preço sugerido por CMV alvo e por margem líquida desejada, com bloqueio quando soma ≥ 100%.
- [ ] Simulador (modal) recalcula na hora ao mudar margem/CMV/taxas/preço.
- [ ] Status: saudável / atenção / abaixo do ideal / prejuízo / custo alto, com regras da seção 6.
- [ ] Filtros e ordenações client-side funcionando.
- [ ] Sem alterar ficha técnica / CMV direto do produto.
- [ ] Guardas: divisão por zero, custo 0, mês sem faturamento, percentuais inválidos.
- [ ] Interface consistente com os primitivos e tokens atuais.

---

## 11. Testes
- **Backend** (`CasaDiAna.Application.Tests`): `ObterConfiguracaoPrecificacaoQueryHandler`
  (cria padrão quando ausente), `AtualizarConfiguracaoPrecificacaoCommandHandler`,
  `ObterAnalisePrecificacaoQueryHandler` (monta insumos; só ativos; `DespesaFixaPercentual`
  vindo do fechamento; `CustoDireto`/`TemFicha` corretos).
- **Frontend** (vitest, se houver runner; senão teste manual): `precificacaoMath` — tabela de
  casos cobrindo CMV%, sugestões, `denom ≤ 0`, `semCusto`, `despesaFixaPct null`, e cada status.
  *(A função pura é o ponto de maior valor para teste unitário — priorizar.)*
- **Manual / E2E** (staging Render, login seed): editar config; analisar uma competência com
  despesas e faturamento; conferir uma linha à mão; simular; checar filtros/ordenações.

---

## 12. Pendências / validar com dados reais
- Limiar de 5pp da "Atenção" e a ordem de severidade dos status — calibrar com o cliente.
- Taxas **não** entram no lucro/margem líquida realizados (só no preço-alvo), conforme o
  spec original — confirmar se o cliente quer taxas também no lucro estimado depois.
- "Preço sugerido" primário = por margem líquida (fallback CMV) — validar a preferência.
- Custo direto = ficha técnica atual (herdado da decisão da Fase 1).

---

## 13. Fora de escopo (YAGNI)
Alvos de CMV/margem por produto; taxa por categoria; persistir simulações; histórico de
preços sugeridos; paginação server-side. Tudo pode virar fase futura se necessário.
