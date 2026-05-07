---
name: ROTINA_PRE_TASK
description: Protocolo de carregamento mínimo de contexto antes de qualquer task — economiza tokens e evita erros
type: rotina
status: existente
ultima_atualizacao: 2026-05-07
---

# ⚡ Rotina pré-task — carregamento de contexto

> **Regra de ouro:** carregar apenas o que a task precisa. Ler tudo é desperdício de tokens e degrada o desempenho.

---

## Passo 1 — SEMPRE ler (obrigatório, independente da task)

| Arquivo | Por quê |
|---|---|
| `12_ERROS_RESOLVIDOS/ERROS_RESOLVIDOS.md` | Para nunca repetir erros já documentados (E1–E10+) |
| Context pack da área (tabela abaixo) | Resumo denso com regras, padrões e caminhos da área |

---

## Passo 2 — Identificar área e carregar o context pack certo

| Se a task envolver… | Ler este(s) context pack(s) |
|---|---|
| Qualquer formulário frontend | `CONTEXT_PACK_FORMULARIOS_FRONTEND.md` **+** `CONTEXT_PACK_FRONTEND.md` |
| Frontend sem formulário (tabelas, componentes, UI) | `CONTEXT_PACK_FRONTEND.md` |
| Backend geral (handlers, validators, controllers) | `CONTEXT_PACK_BACKEND.md` |
| Ingredientes, Categorias, Unidades, Fornecedores, Entradas, Inventário, Estoque | `CONTEXT_PACK_ESTOQUE.md` |
| Produtos, Ficha Técnica, Produção, Vendas, Perdas, Importação | `CONTEXT_PACK_PRODUCAO.md` |
| Deploy, Docker, Dockerfile, Render, build, migrations em produção | `CONTEXT_PACK_DEPLOY_RENDER.md` |
| Auth, 2FA TOTP, Login, Usuários, Sessão | `CONTEXT_PACK_AUTH_2FA.md` |
| Relatórios, PDF, jsPDF | `CONTEXT_PACK_RELATORIOS.md` |
| Etiquetas (Completa, Simples, Nutricional ANVISA) | `CONTEXT_PACK_ETIQUETAS.md` |
| Migrations, EF Core, schema PostgreSQL, banco | `CONTEXT_PACK_BANCO_DE_DADOS.md` |

---

## Passo 3 — Ler nota do módulo afetado

```
04_MODULOS/MOD_<MODULO>.md
```

Disponíveis: `MOD_INGREDIENTES`, `MOD_FORNECEDORES`, `MOD_ENTRADAS`, `MOD_INVENTARIOS`, `MOD_CORRECAO_ESTOQUE`, `MOD_NOTIFICACOES_ESTOQUE`, `MOD_PRODUTOS_FICHA_TECNICA`, `MOD_PRODUCAO_DIARIA`, `MOD_VENDAS_DIARIAS`, `MOD_PERDAS`, `MOD_IMPORTACAO_VENDAS`, `MOD_ETIQUETAS`, `MOD_RELATORIOS`, `MOD_DASHBOARD`, `MOD_AUTH_LOGIN_2FA`, `MOD_USUARIOS`, `MOD_MINHA_CONTA`, `MOD_CATEGORIAS_INGREDIENTE`, `MOD_CATEGORIAS_PRODUTO`, `MOD_UNIDADES_MEDIDA`.

---

## Passo 4 — Carregar SOMENTE se a task exigir

| Arquivo | Carregar quando… |
|---|---|
| `07_STATUS/STATUS_SNAPSHOT.md` | Task ampla, precisa checar status atual de módulos ou plans |
| `09_OPEN_LOOPS/OPEN_LOOPS.md` | Área tem pendências conhecidas que podem afetar a task |
| `05_REGRAS_NEGOCIO/REGRAS_BACKEND_CRITICAS.md` | Task toca regras de domínio (estoque, custo, movimentações) |
| `03_PROJECT_MEMORY/PROJECT_MEMORY.md` | Precisa de URLs de produção ou visão geral do projeto |
| `06_DECISOES/DEC_*.md` | Task questiona uma decisão técnica existente |
| `03_PROJECT_MEMORY/ARQUITETURA.md` | Task muda a arquitetura ou cria nova camada |

---

## ❌ O que NÃO ler (a não ser que explicitamente necessário)

- `00_CENTRO_DO_CEREBRO.md` — é portal de navegação, não contexto de task
- `01_MOC/MOC.md` e `01_MOC/MOC_MODULOS.md` — índices, não conteúdo
- `90_TEMPLATES/` — apenas ao criar novas notas no brain
- `99_INBOX/` — ideias brutas, raramente relevante
- `13_ACADEMICO/` — contexto de TCC, não de implementação
- `10_IA_PROMPTS/` (exceto esta rotina) — prompts, não regras de negócio

---

## Checklist rápido (copiar ao iniciar task)

```
- [ ] Li ERROS_RESOLVIDOS.md
- [ ] Identifiquei context pack(s) da área e li
- [ ] Li MOD_<modulo>.md do módulo afetado
- [ ] (Se necessário) li STATUS_SNAPSHOT, OPEN_LOOPS, REGRAS_BACKEND_CRITICAS
- [ ] Não li arquivos desnecessários
```

---

## Por que essa ordem importa

1. **ERROS_RESOLVIDOS primeiro** — evita repetir E1–E10 antes de qualquer linha de código.
2. **Context pack da área** — resumo denso com exatamente o que o agente precisa; substitui ler 10+ notas.
3. **Nota do módulo** — evidências de código reais (caminhos, campos, regras específicas).
4. **Resto só se precisar** — STATUS_SNAPSHOT tem muito mais do que uma task típica precisa.

> Ver também: [[ROTINA_POS_TASK]] para atualizar o brain após concluir.
