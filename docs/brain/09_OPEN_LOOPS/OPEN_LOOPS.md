---
name: OPEN_LOOPS – pendências e dúvidas em aberto
description: Pontos a confirmar, conflitos detectados, decisões pendentes
type: open_loops
status: existente
ultima_atualizacao: 2026-05-07
---

# ❓ Open Loops

> Pontos abertos. Resolver = mover para [[DEC]] / [[REGRA]] / [[ERRO_RESOLVIDO]] e retirar daqui.

## Comportamento de domínio


### [[OPEN_LOOP_PERDAS_BAIXA]]
- **Pergunta:** registrar `PerdaProduto` faz baixa de estoque dos ingredientes correspondentes? Ou só registra a perda?
- **Importância:** impacta consistência de estoque pós-perda.
- **Próximo passo:** ler handler `Application/Perdas/Commands/RegistrarPerda*.cs`.

### [[OPEN_LOOP_IMPORTACAO_PDF]]
- **Pergunta:** o parser de PDF está realmente em produção, ou apenas o de CSV (`CsvVendasParser`)?
- **Próximo passo:** revisar `Application/ImportacaoVendas/Services/`.

## Estrutura do repo

### [[OPEN_LOOP_DESIGN_LIBS]]
- **Sintoma:** `CasaDiAna/frontend/src/features/design_libs/` está untracked no git.
- **Pergunta:** é experimental, sandbox de UI, ou esquecimento?
- **Próximo passo:** decidir adicionar `.gitignore` ou commitar.

### [[OPEN_LOOP_SRC_RAIZ]]
- **Sintoma:** `ProjetoGestao/src/` (raiz) só contém `obj/`. Não é a fonte real (que vive em `CasaDiAna/src/`).
- **Pergunta:** resíduo de build? Pode ser apagado?
- **Próximo passo:** confirmar com Gustavo antes de limpar.

### [[OPEN_LOOP_OBSIDIAN_VAULT]]
- **Sintoma:** `.obsidian/` está untracked.
- **Pergunta:** versionar config do vault (workspace, plugins) é desejável?
- **Próximo passo:** decidir; eventualmente adicionar `.obsidian/workspace.json` ao gitignore mas commitar `community-plugins`.

### [[OPEN_LOOP_PLANS_UNTRACKED]]
- **Sintoma:** 6 plans executados estão untracked no git (não commitados):
  `refactor-formularios-erp`, `upgrade-visual-erp-premium`, `refactor-2fa-totp`, `2fa-animated-panel`, `confirmacoes-venda-producao`, `comparacao-precos-ingredientes`.
- **Status das features:** todas executadas (evidência em commits — ver [[STATUS_SNAPSHOT]]).
- **Próximo passo:** commitar os 6 arquivos de plan ou manter como artefatos locais (decisão do Gustavo).


---

## ✅ Fechados

### [FECHADO] OPEN_LOOP_DOC_REACT_RECHARTS
- **Sintoma original:** README listava React 18 + Recharts; package.json tinha React 19.2.4 + ECharts 6.
- **Resolução (2026-04-30):** `CasaDiAna/README.md` corrigido — React 18 → 19, linha Recharts removida, ECharts consolidado como única lib de gráficos.

### [FECHADO] OPEN_LOOP_PLANS_STATUS
- **Sintoma original:** 24 planos sem índice de status.
- **Resolução (2026-04-30):** todos os 24 plans classificados como `executado` com evidência de commit em [[STATUS_SNAPSHOT]].

### [FECHADO] OPEN_LOOP_BACKEND_DOCS_TESTES
- **Sintoma original:** contagem de testes unitários defasada (dizia 28 em 2026-03-27).
- **Resolução (2026-05-07):** plan `2026-05-07-formularios-profissionais-tipos-corretos` confirmou **84 testes unitários passando** em `dotnet test`. Memória e STATUS_SNAPSHOT atualizados.

### [FECHADO] OPEN_LOOP_ESTOQUE_NEGATIVO
- **Pergunta original:** `Ingrediente.AtualizarEstoque` realmente clampa em 0?
- **Resolução (2026-05-07):** confirmado lendo `Domain/Entities/Ingrediente.cs:107` — `EstoqueAtual = Math.Max(0, novoSaldo)`. Clamp em 0 é garantido pelo domínio em toda operação de saída. `REGRA_ESTOQUE_PODE_FICAR_NEGATIVO_OU_CLAMP` atualizada para `existente`.

### [FECHADO] OPEN_LOOP_TEMA_TOGGLE
- **Sintoma original:** múltiplos ciclos de fix+revert no toggle claro/escuro (db3cd2f, 7f274f4).
- **Resolução (2026-05-07):** implementação estável confirmada. `:root` = dark premium (padrão); `[data-theme="light"]` = override do tema claro; `[data-theme="dark"]` = overrides para classes Tailwind legadas. `useTheme.ts` seta `data-theme` no `document.documentElement`; toggle existe no `TopHeader`. Funciona corretamente.

### [FECHADO] OPEN_LOOP_MEMORY_DESATUALIZADA
- **Sintoma original:** `~/.claude/projects/.../memory/project_casadiana.md` desatualizada (data 2026-03-27).
- **Resolução (2026-05-07):** rewrite completo da memória — stack real, URLs de produção, todos os módulos, convenções críticas E7–E10, padrão `z.preprocess`. Atualizada em sessão de 2026-05-07.
