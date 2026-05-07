---
name: PROJECT_MEMORY – Casa di Ana ERP
description: Visão geral profunda do projeto. Origem, propósito, escopo, papéis, ambientes.
type: project_memory
status: existente
ultima_atualizacao: 2026-05-07
fontes:
  - CasaDiAna/README.md
  - CasaDiAna/CLAUDE.md
  - CasaDiAna/docs/BANCO_DE_DADOS.md
---

# 🧠 Memória profunda – Casa di Ana ERP

## Quem usa

Cafeteria artesanal **Casa di Ana**. Equipe operacional com proficiência variável em informática — UI **deve ser simples e intuitiva**.

## Por que existe

Pequenos negócios do setor alimentício enfrentam falta de visibilidade sobre o que entra, o que é produzido e o que sai do estoque. O ERP centraliza:

- Controle de ingredientes em tempo real.
- Entrada de mercadoria por fornecedor com nota fiscal.
- Inventário físico comparativo (real vs. sistema).
- Produção diária com baixa automática via ficha técnica.
- Vendas diárias e perdas por produto.
- Relatórios operacionais com PDF.
- Notificações automáticas de estoque crítico.
- Etiquetas (Completa, Simples, Nutricional ANVISA).
- Gestão de usuários por papel.

## Resumo executivo

- Nome interno: **Casa di Ana ERP** / **Sistema de Gestão Operacional**.
- Backend ASP.NET Core 8 + Clean Architecture + CQRS.
- Frontend React 18/19 + TypeScript + Tailwind CSS v4 (Vite).
- PostgreSQL 15.
- Hospedagem em Render (free plan).

## Papéis de usuário

`Admin`, `Coordenador`, `Compras`, `OperadorCozinha`, `OperadorPanificacao`, `OperadorBar`.

> Detalhes em [[REGRA_PAPEIS_USUARIO]].

## Ambientes

| Ambiente   | URL                              | Observação                                                |
| ---------- | -------------------------------- | --------------------------------------------------------- |
| Local back | http://localhost:5130            | `dotnet run --project src/CasaDiAna.API`                  |
| Local front| http://localhost:5173            | `npm run dev` em `CasaDiAna/frontend`                     |
| Docker     | back :8080 / front :3000         | `docker-compose up --build`                               |
| Produção — frontend | https://casadiana-frontend.onrender.com/ | Build no plano free leva 10–18 min sem cache. |
| Produção — API      | https://casadiana-api.onrender.com/api   | Migrations rodam no startup via `db.Database.Migrate()`. Seed: `admin@casadiana.com` / `Admin@123`. |

> Configuração completa em [[CONTEXT_PACK_DEPLOY_RENDER]].

## Seed inicial

`admin@casadiana.com` / `Admin@123` é criado automaticamente quando o banco está vazio. Ver `CasaDiAna/src/CasaDiAna.API/Program.cs:152-167`.

## Idioma

**pt-BR obrigatório** em código, UI, commits, docs, brain. Nunca usar inglês para nomes de domínio, mensagens ou comentários no código próprio.

## Documentos âncora (fora do brain)

- `CasaDiAna/README.md` — visão pública.
- `CasaDiAna/CLAUDE.md` — contrato curto para Claude.
- `CasaDiAna/docs/BANCO_DE_DADOS.md` — schema atualizado por configurations.
- `docs/superpowers/plans/` — planos de feature (24 planos em 2026-04-30).
- `docs/superpowers/specs/` — specs de design por feature.

## Como esta memória se mantém viva

- Ao concluir uma task relevante, atualizar a nota do módulo afetado e o [[STATUS_SNAPSHOT]].
- Ao tomar uma decisão técnica, registrar em `06_DECISOES/` (template em [[TEMPLATE_DECISAO]]).
- Ao resolver um bug não trivial, registrar em `12_ERROS_RESOLVIDOS/`.
- Conflitos entre brain e código: registrar em [[OPEN_LOOPS]] em vez de "consertar" silenciosamente.
