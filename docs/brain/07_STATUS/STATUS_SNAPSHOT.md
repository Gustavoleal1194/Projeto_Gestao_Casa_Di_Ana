---
name: STATUS_SNAPSHOT – 2026-05-07
description: Estado atual detectado do projeto a partir de código, docs e plans
type: status
status: existente
data_snapshot: 2026-05-07
ultima_revisao: 2026-05-07
---

# 📊 Status snapshot — 2026-05-07

> Snapshot baseado em leitura direta do repositório. Confirmar antes de afirmar staleness.

## Stack detectada

- **Backend:** ASP.NET Core 8 · C# 13 · MediatR 12.4.1 · FluentValidation 11.x · EF Core 8.0.11 · Npgsql 8.0.11 · BCrypt.Net-Next · Mapster 7.4.0 · Swashbuckle 6.9.0.
- **Frontend:** React **19.2.4** · Vite 8 · TypeScript 5.9 · Tailwind 4 · Zustand 5 · React Hook Form 7 · Zod 4 · Axios 1 · ECharts 6 · framer-motion 12 · cobe (globo 3D) · jsPDF 4.
- **Banco:** PostgreSQL 15.
- **Hosting:** Render (free).

## Áreas / status

| Área                                   | Status         | Notas                                                                 |
| -------------------------------------- | -------------- | --------------------------------------------------------------------- |
| Auth + 2FA TOTP                        | existente      | Refactor TOTP (abr 2026); painel animado; rate limit `login`/`reenvio2fa` |
| Usuários                               | existente      | Admin only; soft delete; campos lastLogin                              |
| Minha Conta (perfil + 2FA)             | existente      | Plan 2026-04-24 executado                                              |
| Ingredientes / Estoque                 | existente      | Campo `quantidadeEmbalagem` (condicional para Pacote); auto-geração de `codigoInterno`; modal de confirmação animado |
| Categorias (ingrediente / produto)     | existente      | CRUD com soft delete                                                   |
| Unidades de medida                     | existente      | Seed imutável (8 unidades)                                             |
| Fornecedores                           | existente      | Máscaras CNPJ + Telefone (frontend + backend validados); modal de confirmação animado |
| Entrada de Mercadoria                  | existente      | `RecebidoPor` adicionado; modal de confirmação animado                 |
| Inventário Físico                      | existente      | Modal de confirmação ao iniciar e finalizar                            |
| Correção de Estoque                    | existente      | Em lote                                                                |
| Notificações de Estoque                | existente      | Sincroniza no boot; sem canal externo (push/email/sms)                 |
| Produtos + Ficha Técnica               | existente      | Modal de confirmação animado em ficha técnica (6ad0994)                |
| Produção Diária                        | existente      | Modal animado — referência (`ConfirmacaoProducaoModal.tsx`)            |
| Vendas Diárias                         | existente      | Modal animado em `RegistrarVendaPage`                                  |
| Perdas                                 | existente      | Modal animado adicionado (946e962)                                     |
| Importação de Vendas                   | existente      | CSV operativo; modal de confirmação na criação rápida de produto       |
| Etiquetas                              | existente      | Completa, Simples, Nutricional ANVISA + histórico                      |
| Relatórios                             | existente      | 5 relatórios com PDF; Comparação de Preços adicionada (118a48c)        |
| Dashboard                              | existente      | ECharts (sem Recharts — README corrigido em 2026-04-30)               |
| Filter Bar                             | existente      | Componente FilterBar com chips e btn-filter (plan 2026-04-26 executado)|
| Design System Dark Premium             | existente      | `:root` dark premium; 4 componentes novos; `Toast/ModalDesativar/CampoTexto/SelectCampo` em paths globais; tema claro via `[data-theme=light]` (toggle instável — ver open loop) |
| BrainOS Dashboard                      | existente      | Three.js 3D `dashboard/index.html`; `generate.js` → `brain_data.json`; clique abre nota no Obsidian |
| Segurança                              | existente      | IDOR em Entradas + Inventários corrigido com testes; security headers nginx; CORS fechado; secrets removidos do docker-compose |

## Plans — classificação

> 24 planos classificados com base em commits do git (2026-04-30).

| Plan | Status | Evidência principal |
| ---- | ------ | ------------------- |
| 2026-03-25-arquitetura-modulo-estoque | executado | módulo estoque completo |
| 2026-03-25-modelagem-banco-estoque | executado | 17 migrations |
| 2026-03-25-plano-01-infraestrutura-base | executado | API rodando, Clean Arch completa |
| 2026-03-27-design-visual-ingredientes | executado | feature `ingredientes/` completa |
| 2026-03-27-ingredientes-etapa1-service | executado | service e repositório existem |
| 2026-03-27-ingredientes-etapa2-listagem | executado | `IngredientesPage` existe |
| 2026-03-27-ingredientes-etapa3-formulario | executado | `IngredienteFormPage` existe |
| 2026-03-27-categorias | executado | feature `categorias/` completa |
| 2026-03-27-fornecedores | executado | feature `fornecedores/` completa |
| 2026-03-27-entradas | executado | feature `entradas/` completa |
| 2026-03-27-inventarios | executado | feature `inventarios/` completa |
| 2026-04-04-sistema-notificacoes-estoque | executado | feature `notificacoes/` completa |
| 2026-04-04-modulo-etiquetagem | executado | feature `etiquetas/` completa |
| 2026-04-05-refactor-formularios-erp | executado | c728800 refactor PageHeader+forms |
| 2026-04-11-upgrade-visual-erp-premium | executado | globo 3D, painel 2FA animado, CSS keyframes premium |
| 2026-04-11-importacao-pdf-vendas | executado | feature `importacao-vendas/` + commits e36ac07, b25ef95 |
| 2026-04-17-login-globo-3d-futurista | executado | 0bfb4f9 feat(auth): globo 3D |
| 2026-04-19-refactor-2fa-totp | executado | c3ccce9 migration RefatorarTotpAuth |
| 2026-04-24-perfil-usuario-2fa-lastlogin | executado | bac660a MinhaContaPage; 83d2d39 UsuariosPage lastLogin |
| 2026-04-24-2fa-animated-panel | executado | dcb4480 TwoFactorPanel animado |
| 2026-04-24-confirmacoes-venda-producao | executado | d9047b7 ProducaoModal; 1ee9fea VendaModal |
| 2026-04-25-comparacao-precos-ingredientes | executado | 118a48c ComparacaoPrecoPage |
| 2026-04-26-redesign-filter-bar | executado | 1add17c FilterBar; c94d842 redesign CSS |
| 2026-04-29-modal-confirmacao-todos-formularios | executado | 5731f0b ingredientes; f655385 produtos; 946e962 perdas; cf2f28f fornecedores; 3fb2245+563a0ae inventarios; 6ad0994 ficha-tecnica; b25ef95 importacao-vendas |
| 2026-04-30-brainOS-dashboard | executado | d8aed9b nó abre Obsidian; 37bb23e Three.js; 5cf6c43 fixes |
| 2026-05-01-design-system-dark-premium | executado_parcial | dark premium `:root` ativo; toggle tema claro instável (múltiplos reverts — db3cd2f, 7f274f4) |
| 2026-05-06-formularios-ingredientes-fornecedores | executado | 1ab5ad3→08a4e89 — 12 commits; E7 documentado |

## Backend rodando em (local)

- API: `http://localhost:5130`
- Migrations: aplicadas no boot (`Program.cs`)
- Admin seed: `admin@casadiana.com` / `Admin@123` (criado se banco vazio)
- Notificações sincronizadas no boot

## Frontend rodando em (local)

- SPA: `http://localhost:5173`
- API URL: `VITE_API_URL` em `frontend/.env.development`

## Pontos a confirmar (open loops remanescentes)

- `EstoqueAtual` realmente clampa em 0? (`Domain/Entities/Ingrediente.cs`) — ver [[OPEN_LOOP_ESTOQUE_NEGATIVO]].
- `PerdaProduto` faz baixa de estoque dos ingredientes? — ver [[OPEN_LOOP_PERDAS_BAIXA]].
- `frontend/src/features/design_libs/` é experimental ou prevista? — untracked, ver [[OPEN_LOOP_DESIGN_LIBS]].
- Pasta `src/` na raiz (apenas `obj/`) é resíduo? — ver [[OPEN_LOOP_SRC_RAIZ]].
- Importação de vendas via PDF está em produção ou só CSV? — ver [[OPEN_LOOP_IMPORTACAO_PDF]].
- Contagem real de testes unitários (era 28 em 2026-03-27) — ver [[OPEN_LOOP_BACKEND_DOCS_TESTES]].
- Toggle tema claro/escuro instável — `[data-theme=light]` em alguns módulos ainda com cores erradas (múltiplos reverts em db3cd2f, 7f274f4) — ver [[OPEN_LOOP_TEMA_TOGGLE]].

## Riscos detectados

- **Memória estática externa** (`~/.claude/memory/project_casadiana.md`) estava datada de 2026-03-27 e dizia "Backend 100% concluído, próximo passo Frontend" — totalmente desatualizada. Atualizar via fluxo de auto-memory (fora deste vault).
- 6 plans estão untracked no git (criados mas não commitados): `refactor-formularios-erp`, `upgrade-visual-erp-premium`, `refactor-2fa-totp`, `2fa-animated-panel`, `confirmacoes-venda-producao`, `comparacao-precos-ingredientes`. Todos executados; commitar ou manter como artefato local.
