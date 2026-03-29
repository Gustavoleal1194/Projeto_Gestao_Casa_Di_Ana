# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Sistema de Gestão Operacional para a cafeteria **Casa di Ana**. Backend ASP.NET Core 8 (Clean Architecture + CQRS) + Frontend React 18 + TypeScript + Tailwind CSS v4.

---

## Comandos

### Backend

```bash
# Buildar — SEMPRE pelo projeto API (evita lock de DLL)
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build"

# Rodar (porta 5130)
powershell.exe -Command "dotnet run --project src/CasaDiAna.API"

# Parar processos dotnet antes de rebuildar
powershell.exe -Command "Stop-Process -Name 'CasaDiAna.API' -Force; Start-Sleep 1"
```

> **Atenção (Windows):** `dotnet build` na raiz falha por lock de DLL quando a API está rodando. Se aparecer erro de cache (`CoreCompileInputs.cache`), deletar `src/CasaDiAna.Application/obj` e rebuildar.

### Frontend

```bash
cd frontend
npm install
npm run dev   # Vite dev server — porta 5173
npm run build
npx tsc --noEmit  # checagem de tipos sem build
```

### Testes

```bash
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test"
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test --filter 'NomeDoTeste'"
```

### Migrations (EF Core)

```bash
dotnet ef migrations add NomeDaMigration --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API
dotnet ef database update --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API
```

Para remover constraints PostgreSQL que o EF não rastreia (ex: CHECK constraints criadas via SQL puro), criar a migration manualmente e usar `migrationBuilder.Sql("ALTER TABLE ... DROP CONSTRAINT IF EXISTS ...")`.

### Autenticação manual

```bash
curl -s http://localhost:5130/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@casadiana.com","senha":"Admin@123"}'
```

No Swagger: colar **apenas o token** (sem `Bearer `), pois o scheme `SecuritySchemeType.Http` adiciona o prefixo.

**Usuário seed:** `admin@casadiana.com` / `Admin@123` criado automaticamente na inicialização se o banco estiver vazio (`Program.cs`).

**Swagger em produção:** desabilitado por padrão. Para habilitar no Render, adicionar env var `Swagger__Habilitado=true` no serviço `casadiana-api`.

---

## Arquitetura Backend

### Camadas

```
CasaDiAna.Domain         — Entities, Enums, DomainException, interfaces de repositório
CasaDiAna.Application    — Commands, Queries, Handlers, DTOs, ValidationBehavior
CasaDiAna.Infrastructure — Repositórios EF Core, AppDbContext, JwtService, CurrentUserService
CasaDiAna.API            — Controllers, ExceptionHandlingMiddleware, Program.cs
```

A API não referencia Domain diretamente — acessa via Application e Infrastructure.

### CQRS com MediatR

Cada operação é um `record : IRequest<TResponse>`. O handler implementa `IRequestHandler`. Validators via FluentValidation são executados automaticamente pelo `ValidationBehavior` no pipeline — lançam `ValidationException` (HTTP 400) antes do handler.

Padrão de módulo:
```
Application/Ingredientes/
  Commands/CriarIngrediente/
    CriarIngredienteCommand.cs          ← record : IRequest<IngredienteDto>
    CriarIngredienteCommandValidator.cs ← AbstractValidator<...>
    CriarIngredienteCommandHandler.cs   ← IRequestHandler + internal static ToDto()
  Queries/ListarIngredientes/...
  Dtos/IngredienteDto.cs
```

`internal static ToDto(Entity e)` fica no handler de `Criar` e é reutilizado por todos os handlers do módulo.

### Respostas da API

Todas usam `ApiResponse<T>` (`Application/Common/ApiResponse.cs`):

```json
{ "sucesso": true,  "dados": { ... }, "erros": [] }
{ "sucesso": false, "dados": null,    "erros": ["mensagem"] }
```

Mapeamento de exceções via `ExceptionHandlingMiddleware`:
- `ValidationException` → 400
- `DomainException` → 422
- `UnauthorizedAccessException` → 401
- `Exception` → 500

### Banco de dados

PostgreSQL, EF Core 8, Npgsql. Schemas:
- `auth` — `usuarios`
- `estoque` — ingredientes, categorias, fornecedores, unidades_medida, movimentacoes, entradas_mercadoria, itens_entrada, inventarios, itens_inventario
- `producao` — produtos, categorias_produto, itens_ficha_tecnica, producoes_diarias, vendas_diarias, perdas_produto

**Todas as colunas mapeadas explicitamente** via `HasColumnName()` em snake_case nas classes `IEntityTypeConfiguration<T>` em `Infrastructure/Persistence/Configurations/`. Não confiar em convenções automáticas do EF.

### Armadilha: coleções readonly em entidades

Entidades com `private readonly List<T>` (ex: `Inventario`) **não podem receber filhos via `_db.Update()`** após a criação. O EF gera `DbUpdateConcurrencyException`.

**Solução:** método específico no repositório para inserir o filho diretamente:
```csharp
inventario.AdicionarItem(...);
var novoItem = inventario.Itens.Last();
await _inventarios.AdicionarItemAsync(novoItem, ct);
await _inventarios.SalvarAsync(ct);
```

### ICurrentUserService

O ASP.NET Core remapeia o claim `sub` para `ClaimTypes.NameIdentifier`. **Nunca usar `JwtRegisteredClaimNames.Sub`** no `CurrentUserService`.

### Soft delete

Entidades com `Ativo` usam soft delete. Métodos `NomeExisteAsync` **devem filtrar por `ativo = true`** — caso contrário bloqueiam criação de registros com nome de entidade desativada.

### Estoque e movimentações

Toda alteração de `EstoqueAtual` gera obrigatoriamente um `Movimentacao` com:
- `TipoMovimentacao`: `Entrada`, `AjustePositivo`, `AjusteNegativo`, `SaidaProducao`
- `ReferenciaTipo` + `ReferenciaId`: rastreabilidade da origem

Ao registrar uma entrada de mercadoria, chamar **tanto** `ingrediente.AtualizarEstoque()` **quanto** `ingrediente.AtualizarCusto()` — sem o custo, o cálculo de custo de produção via ficha técnica retorna zero.

Produção diária **não valida estoque suficiente** — é registrada após o fato. Estoque pode ficar negativo.

### Segurança implementada

- **Rate limiting:** `[EnableRateLimiting("login")]` no `AuthController` — máx. 10 tentativas/min por IP (HTTP 429)
- **Security headers:** `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy` adicionados via middleware em `Program.cs`
- **CORS:** restrito a `Authorization`, `Content-Type`, `Accept` e métodos `GET/POST/PUT/DELETE/PATCH/OPTIONS`
- **Senha:** mínimo 8 chars + maiúscula + minúscula + número + especial (validator em `CriarUsuarioCommandValidator`)
- **JWT:** expiração configurável via `Jwt:ExpiracaoMinutos` (padrão: 60 min)

### Filtros de data em relatórios

`MovimentacaoRepository.ListarAsync` usa `m.CriadoEm < ate.Date.AddDays(1)` (exclusivo). Todos os novos filtros por data devem seguir o mesmo padrão para incluir registros do dia inteiro.

### Módulos implementados

| Módulo | Endpoints principais |
|---|---|
| Auth | `POST /api/auth/login` |
| Categorias Ingrediente | `GET/POST /api/categorias`, `PUT/DELETE /api/categorias/{id}` |
| Unidades de Medida | `GET /api/unidades-medida` |
| Ingredientes | `GET/POST /api/ingredientes`, `GET/PUT/DELETE /api/ingredientes/{id}` |
| Fornecedores | `GET/POST /api/fornecedores`, `GET/PUT/DELETE /api/fornecedores/{id}` |
| Entradas | `GET/POST /api/entradas`, `GET /api/entradas/{id}`, `POST /api/entradas/{id}/cancelar` |
| Inventários | `GET/POST /api/inventarios`, `GET /api/inventarios/{id}`, `POST /api/inventarios/{id}/itens\|finalizar\|cancelar` |
| Categorias Produto | `GET/POST /api/categorias-produto`, `PUT/DELETE /api/categorias-produto/{id}` |
| Produtos | `GET/POST /api/produtos`, `GET/PUT/DELETE /api/produtos/{id}`, `GET/POST /api/produtos/{id}/ficha-tecnica` |
| Produção Diária | `GET/POST /api/producao-diaria` |
| Vendas Diárias | `GET/POST /api/vendas-diarias` |
| Perdas | `GET/POST /api/perdas` |
| Estoque (Correção) | `POST /api/estoque/correcoes` |
| Usuários | `GET/POST /api/usuarios`, `DELETE /api/usuarios/{id}`, `PATCH /api/usuarios/{id}/senha` (Admin only) |
| Relatórios | `GET /api/relatorios/estoque-atual\|movimentacoes\|entradas\|producao-vendas\|insumos-producao` |

---

## Deploy (Docker + Render)

### Estrutura Docker

- **Backend:** `CasaDiAna/Dockerfile` — multi-stage `dotnet/sdk:8.0` → `dotnet/aspnet:8.0`, porta 8080
- **Frontend:** `CasaDiAna/frontend/Dockerfile` — multi-stage `node:20-alpine` → `nginx:alpine`, porta 80
- **Local:** `CasaDiAna/docker-compose.yml` — postgres:5433, api:8080, frontend:3000

### render.yaml

O repositório git tem raiz em `ProjetoGestao/`. Os caminhos no `render.yaml` são relativos à raiz do repo:
```yaml
dockerfilePath: ./CasaDiAna/Dockerfile          # backend
dockerContext:  ./CasaDiAna                      # backend
dockerfilePath: ./CasaDiAna/frontend/Dockerfile  # frontend
dockerContext:  ./CasaDiAna/frontend             # frontend
```

**Armadilhas já resolvidas:**
- `.dockerignore` na raiz (`CasaDiAna/.dockerignore`) é o que o Render usa para o build do frontend — `frontend/` estava excluindo tudo inclusive `.env.production`
- `dotnet restore` deve apontar para o `.csproj` da API, não para a `.sln` (que referencia projeto de testes não copiado)
- `DATABASE_URL` do Render não tem porta explícita → `uri.Port == -1` → usar `5432` como fallback em `DependencyInjection.cs`

### Variável VITE_API_URL

Vite substitui `import.meta.env.VITE_*` em **tempo de build**, não em runtime. A URL de produção é injetada via:
1. `frontend/.env.production` → `VITE_API_URL=https://casadiana-api.onrender.com/api`
2. `ARG/ENV VITE_API_URL` no `frontend/Dockerfile` como fallback
3. `define` no `vite.config.ts` lê `process.env.VITE_API_URL`

---

## Arquitetura Frontend

### Stack

React 18, TypeScript, Vite, Tailwind CSS v4, React Router v6, Zustand (auth), Axios, React Hook Form + Zod, Recharts (gráficos), jsPDF + jspdf-autotable (PDF).

### Estrutura de features

```
frontend/src/
  features/
    auth/
    dashboard/
    estoque/
      ingredientes/   ← módulo de referência para novos módulos
      categorias/
      correcao/
    fornecedores/
    entradas/
    inventarios/
    producao/
      produtos/
      categorias-produto/
      producao-diaria/
      vendas-diarias/
      perdas/
    relatorios/
    usuarios/
  components/layout/  ← MainLayout (Sidebar + Outlet), Sidebar
  lib/
    api.ts            ← instância Axios com JWT interceptor
    pdf.ts            ← funções de export PDF (jsPDF + autotable)
  store/authStore.ts  ← Zustand com persist, expõe temPapel()
  types/
    estoque.ts        ← tipos de ingredientes, movimentações, relatórios
    producao.ts       ← tipos de produtos, produção, vendas, perdas
  routes/AppRoutes.tsx
```

### Padrões frontend

- **Módulo de referência:** `src/features/estoque/ingredientes/` — copiar estrutura para novos módulos
- **Componentes reutilizáveis** em `features/estoque/ingredientes/components/`: `Toast`, `CampoTexto`, `SelectCampo`, `ModalDesativar`, `Paginacao`
- **Formulários:** React Hook Form + Zod com `resolver: zodResolver(schema) as any` (cast necessário por conflito de tipos com campos opcionais)
- **Autenticação:** `useAuthStore()` expõe `usuario`, `logout`, `temPapel(...papeis)`. Papéis: `Admin`, `Coordenador`, `Compras`, `Operador` (somente leitura)
- **Design:** tema "Café Rústico Refinado" — `amber-700` primário, `stone-900` sidebar, `stone-50` fundo
- **Datas da API:** o backend retorna datas como `"2026-03-28T00:00:00"`. Usar `new Date(valor)` diretamente — **não concatenar** `'T12:00:00'` (gera Invalid Date)

### Responsividade mobile

`MainLayout.tsx` gerencia estado `sidebarAberta`. Em mobile (`< md`):
- Barra de topo `stone-900` com botão ☰ (sticky, dentro do fluxo — não fixed)
- Overlay escuro + `Sidebar` com `fixed` e `translate-x` condicional
- Sidebar recebe props `aberta` e `onFechar`; cada `NavLink` chama `onFechar` ao navegar

Ao adicionar novas tabelas, sempre envolver com `<div className="overflow-x-auto">`. Cabeçalhos de página com título + botões devem usar `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.

### Dashboard

`DashboardPage.tsx` contém dois componentes reutilizáveis internos:
- `DashboardCard` — KPI card com 4 variantes (`default`, `positivo`, `negativo`, `alerta`)
- `ChartContainer` — wrapper de gráfico com título, subtítulo, rodapé de legenda e estado vazio

Paleta semântica dos gráficos (aplicar consistentemente em novos gráficos):
- `#22c55e` verde → vendido / positivo
- `#ef4444` vermelho → perda / negativo
- `#f97316` laranja → produção
- `#3b82f6` azul → neutro / estoque

O gráfico de Produção vs Vendas é stacked bar: **Vendido + Perda + Restante = total produzido**. `LabelList.formatter` deve ser tipado como `(v: unknown) => string` para compatibilidade com Recharts.

### Testes (backend)

`CasaDiAna.Application.Tests` — xUnit, Moq, FluentAssertions. Testa apenas handlers. Repositórios são mockados. Para múltiplos retornos do mesmo mock usar `SetupSequence`.
