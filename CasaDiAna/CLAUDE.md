# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Sistema de Gestão Operacional para a cafeteria **Casa di Ana**. Backend ASP.NET Core 8 (Clean Architecture + CQRS) + Frontend React 18 + TypeScript + Tailwind CSS v4. Todo conteúdo em português do Brasil.

---

## Comandos

```bash
# Backend — buildar SEMPRE pelo projeto API (lock de DLL no Windows se buildar na raiz)
dotnet build src/CasaDiAna.API
dotnet run --project src/CasaDiAna.API          # porta 5130
dotnet test tests/CasaDiAna.Application.Tests

# Migration
dotnet ef migrations add NomeDaMigration --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API
dotnet ef database update --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API

# Frontend (dentro de frontend/)
npm run dev        # porta 5173
npx tsc --noEmit   # checagem de tipos
```

**Seed:** `admin@casadiana.com` / `Admin@123` criado automaticamente se banco vazio.

---

## Arquitetura e convenções críticas

### Backend

**CQRS:** `record : IRequest<TResponse>` + handler. `internal static ToDto(Entity e)` fica no handler de `Criar` e é reutilizado por todos os handlers do módulo. Validators FluentValidation rodam via pipeline antes do handler (400 automático).

**Respostas:** Todas via `ApiResponse<T>` — `{ sucesso, dados, erros }`. Exceções mapeadas em `ExceptionHandlingMiddleware`: `ValidationException`→400, `DomainException`→422, `UnauthorizedAccessException`→401.

**EF Core:** Todas as colunas mapeadas explicitamente com `HasColumnName()` em snake_case nos `IEntityTypeConfiguration<T>`. Não confiar em convenções automáticas.

**Armadilha — coleções readonly:** Entidades com `private readonly List<T>` não aceitam filhos via `_db.Update()` — gera `DbUpdateConcurrencyException`. Inserir o filho diretamente pelo repositório.

**Armadilha — `ICurrentUserService`:** ASP.NET Core remapeia `sub` para `ClaimTypes.NameIdentifier`. Nunca usar `JwtRegisteredClaimNames.Sub`.

**Soft delete:** `NomeExisteAsync` deve filtrar `ativo = true`, senão bloqueia criação com nome de entidade desativada.

**Estoque:** Toda alteração de `EstoqueAtual` exige um `Movimentacao` com `ReferenciaTipo` + `ReferenciaId`. Ao registrar entrada, chamar **tanto** `AtualizarEstoque()` **quanto** `AtualizarCusto()` — sem custo, ficha técnica retorna zero. Estoque é clampado em 0 pelo domínio.

**Filtros de data:** Usar `< ate.Date.AddDays(1)` (exclusivo) para incluir registros do dia inteiro.

**2FA (TOTP):** Sistema usa app autenticador — não SMS. Endpoints: `POST /auth/login` → `POST /auth/verificar-2fa`. O validator aceita apenas `^\d{6}$` — recovery codes (`XXXX-XXXX`) nunca chegam ao handler. Não verificar BCrypt de recovery codes dentro do handler TOTP: BCrypt ~200ms/chamada gera latência visível no caminho de erro.

### Frontend

**Design tokens:** Usar `var(--ada-heading)`, `var(--ada-surface)` etc. definidos em `index.css`. Não usar classes Tailwind de cor direta (`bg-white`, `text-stone-900`) — quebra o tema escuro.

**Formulários:** `resolver: zodResolver(schema) as any` — cast necessário por conflito de tipos com campos opcionais.

**Datas:** Backend retorna `"2026-03-28T00:00:00"`. Usar `new Date(valor)` diretamente — não concatenar `'T12:00:00'`.

**Módulo de referência:** `src/features/estoque/ingredientes/` — copiar estrutura para novos módulos.

**Componentes obrigatórios:** `<PageHeader>` para cabeçalho de página (nunca `h1` solto), `<SkeletonTable>` durante loading, `<EmptyState>` para lista vazia, `<div className="overflow-x-auto">` em toda tabela.

### Deploy (Render)

Builds no plano free levam 10–18 min sem cache de layers. `DATABASE_URL` sem porta → usar `5432` como fallback. `VITE_API_URL` é injetada em build-time via `frontend/.env.production`.

---

## Obsidian Brain / BrainOS

O BrainOS em `docs/brain/` é a memória operacional do projeto. **Siga o protocolo abaixo antes de qualquer task.**

### Protocolo pré-task (obrigatório)

**Sempre ler:**
1. `docs/brain/12_ERROS_RESOLVIDOS/ERROS_RESOLVIDOS.md` — evita repetir erros já resolvidos (E1–E10+).
2. O context pack da área da task (tabela abaixo).
3. `docs/brain/04_MODULOS/MOD_<MODULO>.md` do módulo afetado.

**Context pack por área:**

| Área | Arquivo em `02_CONTEXT_PACKS/` |
|---|---|
| Formulário frontend (qualquer) | `CONTEXT_PACK_FORMULARIOS_FRONTEND.md` + `CONTEXT_PACK_FRONTEND.md` |
| Frontend sem formulário | `CONTEXT_PACK_FRONTEND.md` |
| Backend (handlers, validators, controllers) | `CONTEXT_PACK_BACKEND.md` |
| Ingredientes, Entradas, Inventário, Estoque | `CONTEXT_PACK_ESTOQUE.md` |
| Produtos, Produção, Vendas, Perdas | `CONTEXT_PACK_PRODUCAO.md` |
| Deploy, Docker, Render, build | `CONTEXT_PACK_DEPLOY_RENDER.md` |
| Auth, 2FA, Login, Usuários | `CONTEXT_PACK_AUTH_2FA.md` |
| Relatórios, PDF | `CONTEXT_PACK_RELATORIOS.md` |
| Etiquetas | `CONTEXT_PACK_ETIQUETAS.md` |
| Migrations, banco, EF Core | `CONTEXT_PACK_BANCO_DE_DADOS.md` |

**Carregar apenas se a task exigir:** `STATUS_SNAPSHOT.md`, `OPEN_LOOPS.md`, `REGRAS_BACKEND_CRITICAS.md`, `ARQUITETURA.md`.

**Nunca ler por padrão:** `00_CENTRO_DO_CEREBRO.md`, `01_MOC/`, `90_TEMPLATES/`, `99_INBOX/`, `13_ACADEMICO/`.

> Protocolo completo: `docs/brain/10_IA_PROMPTS/ROTINA_PRE_TASK.md`
> Pós-task: `docs/brain/10_IA_PROMPTS/ROTINA_POS_TASK.md`

### Outras regras
- **Não assumir status** de feature sem verificar o código atual.
- Conflitos entre brain e código: registrar em `docs/brain/09_OPEN_LOOPS/OPEN_LOOPS.md`.
- **Nunca** salvar segredos, tokens, senhas ou connection strings no vault.
