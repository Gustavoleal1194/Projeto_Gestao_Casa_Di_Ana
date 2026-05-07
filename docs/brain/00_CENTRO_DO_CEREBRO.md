---
name: Centro do Cérebro – Casa di Ana
description: Ponto de entrada do BrainOS. Memória operacional viva do projeto Casa di Ana ERP.
type: index
status: existente
ultima_atualizacao: 2026-04-30
---

# 🧠 Centro do Cérebro – Casa di Ana ERP

> **BrainOS:** memória operacional viva do projeto.
> Ponto de entrada para qualquer agente (Claude, Cursor, humano) antes de tarefas relevantes.

---

## ⚡ Protocolo para agentes — pré-task

> **Não leia tudo. Leia o mínimo certo.**

### Sempre (obrigatório)
1. `12_ERROS_RESOLVIDOS/ERROS_RESOLVIDOS.md` — nunca repetir E1–E10+.
2. Context pack da área → tabela em [[ROTINA_PRE_TASK]] ou `CasaDiAna/CLAUDE.md`.
3. `04_MODULOS/MOD_<modulo>.md` do módulo afetado.

### Somente se a task exigir
- [[STATUS_SNAPSHOT]] — se precisar checar estado atual de módulos.
- [[OPEN_LOOPS]] — se a área tem pendências conhecidas.
- [[REGRAS_BACKEND_CRITICAS]] — se toca regras de domínio.

### Nunca ler por padrão
- Este arquivo e [[MOC]] são portais de navegação, não contexto de task.
- `90_TEMPLATES/`, `99_INBOX/`, `13_ACADEMICO/` — raramente relevantes.

> Protocolo completo: [[ROTINA_PRE_TASK]] · Pós-task: [[ROTINA_POS_TASK]]

---

## 🎯 O que é o projeto

**Casa di Ana ERP** — Sistema de Gestão Operacional para uma cafeteria artesanal.

- **Stack:** ASP.NET Core 8 (Clean Architecture + CQRS) · React 18/19 · TypeScript · Tailwind CSS v4 · PostgreSQL 15.
- **Idioma obrigatório:** **português do Brasil** em código, UI, commits, docs e brain.
- **Domínio:** estoque, produção, vendas, compras, inventários, etiquetas, notificações.
- **Fonte de verdade:** [[PROJECT_MEMORY]] e o código em `CasaDiAna/`.

> Detalhes completos em [[PROJECT_MEMORY]] e [[ARQUITETURA]].

---

## 🗺️ Mapa rápido

| Pasta                          | Conteúdo                                                            |
| ------------------------------ | ------------------------------------------------------------------- |
| `00_CENTRO_DO_CEREBRO.md`      | Este arquivo — porta de entrada.                                    |
| `01_MOC/`                      | Map of Content — índices vivos por área.                            |
| `02_CONTEXT_PACKS/`            | Resumos densos para agentes (uso rápido em tasks).                  |
| `03_PROJECT_MEMORY/`           | Memória profunda do projeto — visão, arquitetura, mapa.             |
| `04_MODULOS/`                  | Uma nota por módulo/feature detectado.                              |
| `05_REGRAS_NEGOCIO/`           | Regras de negócio explícitas.                                       |
| `06_DECISOES/`                 | Decisões técnicas registradas.                                      |
| `07_STATUS/`                   | Snapshot do estado atual detectado.                                 |
| `08_TASK_LOG/`                 | Histórico resumido de tasks relevantes.                             |
| `09_OPEN_LOOPS/`               | Dúvidas, pendências, pontos a confirmar.                            |
| `10_IA_PROMPTS/`               | Prompts reutilizáveis para Claude/Cursor.                           |
| `11_APRENDIZADOS/`             | Aprendizados que valem para o futuro.                               |
| `12_ERROS_RESOLVIDOS/`         | Bugs/erros já resolvidos com causa e cura.                          |
| `13_ACADEMICO/`                | Anotações acadêmicas (TCC, banca, monografia).                      |
| `90_TEMPLATES/`                | Templates Markdown para criar novas notas rapidamente.              |
| `99_INBOX/`                    | Ideias soltas para triar depois.                                    |

---

## 🔥 Top atalhos

- [[MOC]] — índice principal
- [[PROJECT_MEMORY]] — visão geral profunda
- [[ARQUITETURA]] — Clean Architecture + CQRS + frontend feature-based
- [[STATUS_SNAPSHOT]] — estado atual detectado
- [[OPEN_LOOPS]] — pendências e dúvidas
- [[REGRAS_BACKEND_CRITICAS]] — regras que se violadas quebram o sistema
- [[CONTEXT_PACK_BACKEND]] · [[CONTEXT_PACK_FRONTEND]] · [[CONTEXT_PACK_ESTOQUE]]
- [[ROTINA_POS_TASK]] — como atualizar o brain após uma task

---

## 🚦 Convenções deste vault

- **Idioma:** pt-BR sempre.
- **Status válidos:** `existente`, `em_andamento`, `planejado`, `a_confirmar`.
- **Links internos:** `[[Nome-da-Nota]]` no padrão Obsidian.
- **Frontmatter YAML** em toda nota (mínimo: `name`, `description`, `type`, `status`).
- **Evidências** por caminho relativo a partir da raiz do repo (ex.: `CasaDiAna/src/CasaDiAna.API/Program.cs:144`).
- **Nunca** salvar segredos, senhas, tokens ou connection strings reais aqui.

---

## ⚠️ Limites do BrainOS

- Não substitui o código — sempre cruzar com a fonte real antes de afirmar.
- Memórias podem envelhecer — datas no frontmatter ajudam a julgar staleness.
- Se houver conflito entre brain e código, **registre** em [[OPEN_LOOPS]] em vez de "consertar" silenciosamente.
