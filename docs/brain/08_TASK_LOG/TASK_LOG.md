---
name: TASK_LOG – histórico de tasks relevantes
description: Registro humano de tasks que mudaram o projeto. Não inventar histórico.
type: task_log
status: existente
ultima_atualizacao: 2026-05-07
---

# 🪵 Task Log

> Apenas tasks que mudaram o projeto. Use [[TEMPLATE_TASK_LOG]] como base.
> Ordem: mais recente no topo.

## 2026-05-06 — Melhorias de formulários: Ingredientes e Fornecedores
- **Task:** plan `2026-05-06-formularios-ingredientes-fornecedores.md`
- **Áreas:** backend (Domain, Application, Infrastructure, migrations), frontend (form, hooks, types)
- **Resultado:**
  - **Ingredientes:** novo campo `quantidadeEmbalagem` (varchar 100 nullable) propagado Domain → Application → EF → frontend; campo condicional no form (só aparece quando unidade = Pacote, obrigatório nesse caso via `superRefine`); auto-geração de `codigoInterno` a partir das iniciais do nome + sufixo aleatório ao preencher 3+ letras em modo criação.
  - **Fornecedores:** máscaras de CNPJ (`00.000.000/0000-00`) e Telefone (`(XX) XXXX-XXXX` / `(XX) XXXXX-XXXX`) via `Controller` RHF; strip antes de enviar ao backend; validação Zod frontend + FluentValidation backend (14 dígitos CNPJ, 10-11 dígitos telefone).
  - Migration: `20260506214149_AdicionarQuantidadeEmbalagem`.
  - Bug E7 documentado: `ref={field.ref}` em `CampoTexto` (sem `forwardRef`) causa TS2322 no build Docker — removido após falha de deploy.
- **Notas relacionadas:** [[MOD_INGREDIENTES]], [[MOD_FORNECEDORES]], [[ERROS_RESOLVIDOS]] (E7), [[CONTEXT_PACK_FRONTEND]].

## 2026-05-01 — BrainOS Dashboard MVP + Design System Dark Premium

### BrainOS Dashboard
- **Task:** spec e plan em `docs/brain/` + `docs/brain/dashboard/`.
- **Áreas:** documentação/ferramental.
- **Resultado:** dashboard 3D em Three.js (`dashboard/index.html`) lê `brain_data.json` gerado por `generate.js`; clicar em nó abre nota no Obsidian via `obsidian://open`; fixes de performance, crash em EDGES vazio e XSS.

### Design System Dark Premium
- **Task:** plan `2026-05-01-design-system-dark-premium.md`.
- **Áreas:** frontend — `index.css`, componentes UI/form, todas as pages.
- **Resultado:** dark premium aplicado como padrão (`:root` escuro); 4 componentes criados (`FiltroPeriodo`, `StatusBadge`, `TabelaAcoesLinha`, `KpiCard`); `Toast`, `ModalDesativar`, `CampoTexto`, `SelectCampo` movidos para paths globais; imports atualizados; accent bars nas tabelas.
- **Observação:** toggle de tema (claro/escuro) teve múltiplos ciclos de fix+revert — tema claro via `[data-theme=light]` ainda instável em alguns módulos.

### Correções de segurança (acompanharam o design system)
- **Resultado:** IDOR corrigido em Entradas e Inventários + testes; security headers no nginx; CORS aberto fechado; command injection em `serve.js` eliminado; secrets hardcoded removidos do `docker-compose`.

## 2026-04-30 — Criação do BrainOS
- **Task:** estruturar `docs/brain/` como memória operacional do projeto (Obsidian).
- **Áreas:** documentação.
- **Resultado:** vault inicial criado. Sem alterar código fonte / build / banco.
- **Notas relacionadas:** [[CENTRO_DO_CEREBRO]], [[MOC]], [[STATUS_SNAPSHOT]], [[OPEN_LOOPS]].

---

## Como registrar uma task aqui

1. Copiar [[TEMPLATE_TASK_LOG]] no topo.
2. Preencher data (formato `YYYY-MM-DD`), título, áreas, resultado, notas relacionadas.
3. Atualizar [[STATUS_SNAPSHOT]] se a task mudou status de algum módulo.
