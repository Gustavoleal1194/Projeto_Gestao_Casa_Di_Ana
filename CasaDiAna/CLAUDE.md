# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Sistema de Gestão Operacional para a cafeteria **Casa di Ana**. Backend ASP.NET Core 8 (Clean Architecture + CQRS) + Frontend React 18 + TypeScript + Tailwind CSS v4.

---

## Comandos

### Backend

```bash
# Buildar — SEMPRE pelo projeto API (evita lock de DLL)
dotnet build src/CasaDiAna.API

# Rodar (porta 5130)
dotnet run --project src/CasaDiAna.API

# Parar processos dotnet antes de rebuildar (Windows)
powershell.exe -Command "Stop-Process -Name 'CasaDiAna.API' -Force; Start-Sleep 1"
```

> **Atenção (Windows):** `dotnet build` na raiz falha por lock de DLL quando a API está rodando. Se aparecer erro de cache (`CoreCompileInputs.cache`), deletar `src/CasaDiAna.Application/obj` e rebuildar.

### Frontend

```bash
cd frontend
npm run dev      # Vite dev server — porta 5173
npx tsc --noEmit # checagem de tipos sem build
```

### Testes

```bash
dotnet test tests/CasaDiAna.Application.Tests
dotnet test tests/CasaDiAna.Application.Tests --filter 'NomeDoTeste'
```

### Migrations (EF Core)

```bash
dotnet ef migrations add NomeDaMigration --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API
dotnet ef database update --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API
```

Para remover constraints PostgreSQL que o EF não rastreia (ex: CHECK constraints criadas via SQL puro), criar a migration manualmente com `migrationBuilder.Sql("ALTER TABLE ... DROP CONSTRAINT IF EXISTS ...")`.

### Autenticação manual

```bash
curl -s http://localhost:5130/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@casadiana.com","senha":"Admin@123"}'
```

No Swagger: colar **apenas o token** (sem `Bearer `), pois o scheme `SecuritySchemeType.Http` adiciona o prefixo.

**Usuário seed:** `admin@casadiana.com` / `Admin@123` criado automaticamente na inicialização se o banco estiver vazio (`Program.cs`).

**Swagger em produção:** desabilitado por padrão. Habilitar via env var `Swagger__Habilitado=true` no Render.

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
- `estoque` — ingredientes, categorias, fornecedores, unidades_medida, movimentacoes, entradas_mercadoria, itens_entrada, inventarios, itens_inventario, notificacoes_estoque, historico_impressao_etiquetas
- `producao` — produtos, categorias_produto, itens_ficha_tecnica, producoes_diarias, vendas_diarias, perdas_produto, modelos_etiqueta_nutricional

**Todas as colunas mapeadas explicitamente** via `HasColumnName()` em snake_case nas classes `IEntityTypeConfiguration<T>` em `Infrastructure/Persistence/Configurations/`. Não confiar em convenções automáticas do EF.

### Armadilhas conhecidas

**Coleções readonly em entidades:** Entidades com `private readonly List<T>` (ex: `Inventario`) **não podem receber filhos via `_db.Update()`** após a criação — o EF gera `DbUpdateConcurrencyException`. Inserir o filho diretamente:
```csharp
inventario.AdicionarItem(...);
var novoItem = inventario.Itens.Last();
await _inventarios.AdicionarItemAsync(novoItem, ct);
await _inventarios.SalvarAsync(ct);
```

**ICurrentUserService:** O ASP.NET Core remapeia o claim `sub` para `ClaimTypes.NameIdentifier`. **Nunca usar `JwtRegisteredClaimNames.Sub`** no `CurrentUserService`.

**Soft delete:** Métodos `NomeExisteAsync` **devem filtrar por `ativo = true`** — caso contrário bloqueiam criação de registros com nome de entidade desativada.

**Filtros de data em relatórios:** Usar `m.CriadoEm < ate.Date.AddDays(1)` (exclusivo no limite superior) para incluir registros do dia inteiro.

### Estoque e movimentações

Toda alteração de `EstoqueAtual` gera obrigatoriamente um `Movimentacao` com:
- `TipoMovimentacao`: `Entrada`, `AjustePositivo`, `AjusteNegativo`, `SaidaProducao`
- `ReferenciaTipo` + `ReferenciaId`: rastreabilidade da origem

Ao registrar uma entrada de mercadoria, chamar **tanto** `ingrediente.AtualizarEstoque()` **quanto** `ingrediente.AtualizarCusto()` — sem o custo, o cálculo de custo de produção via ficha técnica retorna zero.

Estoque é clampado em 0 pelo domínio (`Math.Max(0, novoSaldo)` em `Ingrediente.AtualizarEstoque`) — nunca fica negativo. Produção diária **não valida estoque suficiente** — é registrada após o fato.

### Autenticação 2FA (TOTP)

O 2FA usa **TOTP** (Time-based One-Time Password) via app autenticador (Google Authenticator, Authy etc.) — **não SMS**.

**Fluxo de setup:**
1. `POST /api/auth/iniciar-setup-2fa` → gera secret TOTP + QR code URL + 8 códigos de recuperação (formato `XXXX-XXXX`)
2. `POST /api/auth/confirmar-setup-2fa` → valida código do app, salva secret (`TotpSecret`) e hashes dos códigos de recuperação

**Fluxo de login com 2FA habilitado:**
1. `POST /api/auth/login` → valida credenciais → retorna `Requer2Fa: true` + `TokenTemporario`
2. `POST /api/auth/verificar-2fa` → valida código TOTP com `ITotpService.ValidarCodigo()` → retorna JWT completo

O `TokenTemporario` tem claim `tipo=temp` e vida curta. O `VerificarOtpCommandValidator` aceita **apenas** `^\d{6}$` (6 dígitos numéricos) — códigos de recuperação (`XXXX-XXXX`) precisam de endpoint separado se implementados no futuro.

Códigos de recuperação são armazenados como BCrypt hashes em `auth.codigos_recuperacao`. **Não verificar BCrypt em loop dentro do handler de TOTP** — BCrypt é lento (~200ms/chamada) e isso causa latência visível no caminho de erro.

### Segurança implementada

- **Rate limiting:** `[EnableRateLimiting("login")]` no `AuthController` — máx. 10 tentativas/min por IP (HTTP 429)
- **Security headers:** `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy` em `Program.cs`
- **CORS:** restrito a `Authorization`, `Content-Type`, `Accept` e métodos `GET/POST/PUT/DELETE/PATCH/OPTIONS`
- **Senha:** mínimo 8 chars + maiúscula + minúscula + número + especial (`CriarUsuarioCommandValidator`)
- **JWT:** expiração configurável via `Jwt:ExpiracaoMinutos` (padrão: 60 min)

### Módulos implementados

| Módulo | Endpoints principais |
|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/verificar-2fa`, `POST /api/auth/iniciar-setup-2fa`, `POST /api/auth/confirmar-setup-2fa` |
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
| Usuários | `GET/POST /api/usuarios`, `DELETE /api/usuarios/{id}`, `PATCH /api/usuarios/{id}/senha`, `POST /api/usuarios/{id}/habilitar-2fa`, `POST /api/usuarios/{id}/desabilitar-2fa` |
| Notificações | `GET /api/notificacoes`, `PATCH /api/notificacoes/{id}/lida`, `POST /api/notificacoes/marcar-todas-lidas` |
| Etiquetas | `POST /api/etiquetas/historico`, `GET /api/etiquetas/historico/{produtoId}`, `GET/PUT /api/produtos/{id}/modelo-etiqueta-nutricional` |
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
- Builds no plano free levam 10–18 minutos — não há cache de layers entre deploys

### Variável VITE_API_URL

Vite substitui `import.meta.env.VITE_*` em **tempo de build**, não em runtime. A URL de produção é injetada via:
1. `frontend/.env.production` → `VITE_API_URL=https://casadiana-api.onrender.com/api`
2. `ARG/ENV VITE_API_URL` no `frontend/Dockerfile` como fallback
3. `define` no `vite.config.ts` lê `process.env.VITE_API_URL`

---

## Arquitetura Frontend

### Stack

React 18, TypeScript, Vite, Tailwind CSS v4, React Router v6, Zustand (auth), Axios, React Hook Form + Zod, Recharts + ECharts (gráficos), jsPDF + jspdf-autotable (PDF).

### Estrutura de features

```
frontend/src/
  features/
    auth/
      components/hero/   ← Globe3DScene, NeuralMesh (animação da tela de login)
      components/form/   ← LoginForm, TwoFactorPanel (painel TOTP animado)
      lib/globeConfig.ts ← tokens do globo, CAPITAIS[], GLOBE_NODES, constantes de rotação
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
    notificacoes/
    usuarios/
    etiquetas/
  components/
    layout/  ← MainLayout (Sidebar + Outlet), Sidebar, TopHeader
    ui/      ← PageHeader, EmptyState, SkeletonTable, LoadingState
    form/    ← FormCard, FormSection, CampoTexto, SelectCampo, FormTextarea, FormActions, Spinner
  lib/
    api.ts            ← instância Axios com JWT interceptor
    pdf.ts            ← funções de export PDF (jsPDF + autotable)
  store/authStore.ts  ← Zustand com persist, expõe temPapel()
  types/
    estoque.ts        ← tipos de ingredientes, movimentações, entradas, relatórios
    producao.ts       ← tipos de produtos, produção, vendas, perdas
  routes/AppRoutes.tsx
```

### Padrões frontend

- **Módulo de referência:** `src/features/estoque/ingredientes/` — copiar estrutura para novos módulos
- **Componentes reutilizáveis** em `src/components/ui/`: `PageHeader`, `EmptyState`, `SkeletonTable`, `LoadingState`
- **Cabeçalho de página:** sempre usar `<PageHeader titulo="..." breadcrumb={[...]} subtitulo={...} actions={...} />` — nunca `h1` solto
- **Estado vazio:** usar `<EmptyState icon={...} iconColor="..." titulo="..." descricao="..." action={...} />` dentro de `ada-surface-card`
- **Estado de carregamento:** usar `<SkeletonTable colunas={N} linhas={5} />` enquanto `loading === true`
- **Formulários:** React Hook Form + Zod com `resolver: zodResolver(schema) as any` (cast necessário por conflito de tipos com campos opcionais)
- **Autenticação:** `useAuthStore()` expõe `usuario`, `logout`, `temPapel(...papeis)`. Papéis: `Admin`, `Coordenador`, `Compras`, `OperadorCozinha`, `OperadorPanificacao`, `OperadorBar`
- **Design tokens:** definidos em `src/index.css` como CSS custom properties (`--ada-bg`, `--ada-surface`, `--ada-border`, etc.) — usar via `style={{ color: 'var(--ada-heading)' }}` ou classes `.btn-primary`, `.ada-surface-card`, `.table-th`, `.table-td`, etc.
- **Datas da API:** o backend retorna datas como `"2026-03-28T00:00:00"`. Usar `new Date(valor)` diretamente — **não concatenar** `'T12:00:00'` (gera Invalid Date)
- **Temas:** não usar classes Tailwind como `bg-white` ou `text-stone-900` diretamente — usar `var(--ada-surface)` e `var(--ada-heading)` para que tema escuro funcione

### Componentes CSS globais (index.css)

| Classe | Uso |
|---|---|
| `.ada-page` | Container de página com padding responsivo e max-width |
| `.ada-surface-card` | Card com borda, fundo e sombra padrão |
| `.btn-primary` | Botão CTA âmbar |
| `.btn-secondary` | Botão secundário com borda |
| `.btn-danger` | Botão de ação destrutiva |
| `.filter-bar` | Container de filtros com borda e padding |
| `.filter-input` | Input/select de filtro |
| `.table-th` / `.table-td` | Células de tabela com density ERP compacto |
| `.table-head-row` | Linha de cabeçalho de tabela |
| `.table-row` | Linha de dados com hover |
| `.badge-active/inactive/warning/danger` | Badges de status |
| `.row-action-btn` | Botão de ação em linha de tabela |
| `.dashboard-card` | Card do dashboard com hover via CSS |
| `.notification-panel` | Painel dropdown de notificações |
| `.skeleton` | Elemento com animação shimmer |
| `.cell-truncate` | Célula com truncate + ellipsis |

### Responsividade mobile

`MainLayout.tsx` gerencia estado `sidebarAberta`. Em mobile (`< md`):
- Barra de topo `stone-900` com botão ☰ (sticky, dentro do fluxo — não fixed)
- Overlay escuro + `Sidebar` com `fixed` e `translate-x` condicional
- Sidebar recebe props `aberta` e `onFechar`; cada `NavLink` chama `onFechar` ao navegar

Ao adicionar novas tabelas, sempre envolver com `<div className="overflow-x-auto">`.

### Notificações — TopHeader dropdown

O sino no `TopHeader` abre um dropdown inline (`notification-panel`) que carrega as últimas 8 notificações não lidas via `notificacoesService.listar(false)`. Não navega para `/notificacoes` no clique — a navegação só ocorre no botão "Ver todas" dentro do painel.

### Dashboard

`DashboardPage.tsx` usa `DashboardCard` (componente interno) com hover via classe `.dashboard-card` — sem `onMouseEnter`/`onMouseLeave` inline.

Paleta semântica dos gráficos:
- `#10b981` verde → vendido / positivo
- `#f43f5e` vermelho → perda / negativo
- `#f59e0b` âmbar → produção
- `#60a5fa` azul → neutro / tendência

### Testes (backend)

`CasaDiAna.Application.Tests` — xUnit, Moq, FluentAssertions. Testa apenas handlers. Repositórios são mockados. Para múltiplos retornos do mesmo mock usar `SetupSequence`.
