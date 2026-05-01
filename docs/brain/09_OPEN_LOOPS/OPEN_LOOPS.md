---
name: OPEN_LOOPS – pendências e dúvidas em aberto
description: Pontos a confirmar, conflitos detectados, decisões pendentes
type: open_loops
status: existente
ultima_atualizacao: 2026-04-30
---

# ❓ Open Loops

> Pontos abertos. Resolver = mover para [[DEC]] / [[REGRA]] / [[ERRO_RESOLVIDO]] e retirar daqui.

## Comportamento de domínio

### [[OPEN_LOOP_ESTOQUE_NEGATIVO]]
- **Pergunta:** o método `Ingrediente.AtualizarEstoque` realmente clampa em 0? Ou apenas algumas migrations zeraram o saldo histórico?
- **Importância:** afeta produção sem estoque, inventário, correção.
- **Próximo passo:** abrir `Domain/Entities/Ingrediente.cs` e validar lógica.

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

## Dados a confirmar

### [[OPEN_LOOP_BACKEND_DOCS_TESTES]]
- **Sintoma:** memória externa diz "28 testes unitários passando" (2026-03-27) — número provavelmente mudou.
- **Próximo passo:** rodar `dotnet test tests/CasaDiAna.Application.Tests` e atualizar [[STATUS_SNAPSHOT]].

## Memória externa do agente (auto-memory)

### [[OPEN_LOOP_MEMORY_DESATUALIZADA]]
- **Sintoma:** `~/.claude/projects/.../memory/project_casadiana.md` (data 2026-03-27) diz "Backend 100%, próximo passo: Frontend".
- **Hoje (2026-04-30):** frontend completo, com 2FA, etiquetas, relatórios, dashboard.
- **Próximo passo:** atualizar a memória externa quando aplicável (fora deste vault).

---

## ✅ Fechados

### [FECHADO] OPEN_LOOP_DOC_REACT_RECHARTS
- **Sintoma original:** README listava React 18 + Recharts; package.json tinha React 19.2.4 + ECharts 6.
- **Resolução (2026-04-30):** `CasaDiAna/README.md` corrigido — React 18 → 19, linha Recharts removida, ECharts consolidado como única lib de gráficos.

### [FECHADO] OPEN_LOOP_PLANS_STATUS
- **Sintoma original:** 24 planos sem índice de status.
- **Resolução (2026-04-30):** todos os 24 plans classificados como `executado` com evidência de commit em [[STATUS_SNAPSHOT]].
