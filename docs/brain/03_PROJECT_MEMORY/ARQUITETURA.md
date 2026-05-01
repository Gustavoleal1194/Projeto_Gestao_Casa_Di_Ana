---
name: ARQUITETURA – Backend Clean + CQRS, Frontend feature-based
description: Camadas, fluxo de request, regras de dependência, pontos de extensão
type: project_memory
status: existente
ultima_atualizacao: 2026-04-30
---

# 🏛️ Arquitetura

## Backend – Clean Architecture + CQRS via MediatR

```
┌────────────────────────────────────────┐
│              CasaDiAna.API             │  Controllers · Middleware · Program.cs
├────────────────────────────────────────┤
│         CasaDiAna.Application          │  Commands · Queries · Handlers · Validators · DTOs
├────────────────────────────────────────┤
│         CasaDiAna.Infrastructure       │  EF Core · Repositórios · Services
├────────────────────────────────────────┤
│           CasaDiAna.Domain             │  Entidades · Enums · Interfaces · DomainException
└────────────────────────────────────────┘
```

**Regra de ouro:**
- `Domain` não importa nenhuma outra camada.
- `Application` importa apenas `Domain`.
- `Infrastructure` implementa interfaces do `Domain`.
- `API` orquestra mas não contém regra de negócio.

### CasaDiAna.Domain
- 21 entidades em `Entities/` (Ingrediente, Movimentacao, Produto, ItemFichaTecnica, Inventario, Usuario, ImportacaoVendas, etc.).
- Enums: `PapelUsuario`, `TipoMovimentacao`, `StatusEntrada`, `StatusInventario`, `TipoNotificacaoEstoque`, `TipoEtiqueta`.
- `DomainException` → HTTP 422.

### CasaDiAna.Application
- Cada operação é `record : IRequest<TResponse>` (Command ou Query).
- Handlers `IRequestHandler<TCommand, TResponse>`.
- Validators `AbstractValidator<T>` (FluentValidation).
- `ValidationBehavior<,>` (pipeline MediatR) executa validação **antes** do handler — falha gera HTTP 400 automático.
- DTOs mapeados via `internal static ToDto()` no handler de criar; reutilizados pelos demais handlers do módulo.

### CasaDiAna.Infrastructure
- `AppDbContext` com 20+ DbSets em schemas `auth`, `estoque`, `producao`.
- Configurations fluent **explícitas em snake_case** — sem convenções automáticas (ver [[DEC_EF_SNAKE_CASE_EXPLICITO]]).
- Services: `JwtService`, `CurrentUserService`, `NotificacaoEstoqueService`, `TotpService`, `CsvVendasParser`.
- Repositórios — um por agregado.

### CasaDiAna.API
- 18 controllers REST, todos via `IMediator` (sem regra de negócio).
- `ExceptionHandlingMiddleware` → converte exceções em `ApiResponse<T>` + status HTTP.
- `Program.cs`: configura serviços, aplica migrations, cria admin seed, sincroniza notificações.
- Rate limit: `login` 10/min, `reenvio2fa` 1/min.
- Authorization policy `Pre2Fa` (claim `tipo=pre2fa`) para o passo intermediário do 2FA.

## Fluxo do request (back)

```
HTTP Request (Bearer JWT)
  → ExceptionHandlingMiddleware
  → Controller cria Command/Query
  → IMediator.Send
  → ValidationBehavior  (FluentValidation; falha = 400)
  → Handler  (acessa Repository / chama métodos de domínio na entidade)
  → Repository → AppDbContext → PostgreSQL
  ← DTO
  ← ApiResponse<T> { sucesso, dados, erros }
```

## Resposta padrão

```json
{ "sucesso": true,  "dados": { ... }, "erros": [] }
{ "sucesso": false, "dados": null,    "erros": ["mensagem"] }
```

| Exceção                          | HTTP |
| -------------------------------- | ---- |
| `ValidationException`            | 400  |
| `UnauthorizedAccessException`    | 401  |
| `DomainException`                | 422  |
| `Exception`                      | 500  |

> Detalhes em [[DEC_API_RESPONSE_ENVELOPE]].

## Frontend – feature-based

`src/features/<area>/<modulo>/` — cada módulo independente:

```
features/estoque/ingredientes/
├── pages/        IngredientesPage.tsx, IngredienteFormPage.tsx
├── components/   Toast, ModalDesativar etc.
└── services/     ingredientesService.ts (HTTP)
```

Estado global: apenas `authStore` (Zustand) com persistência localStorage.
Form: `react-hook-form` + `zod` (resolver com cast `as any` por causa de campos opcionais).
HTTP: Axios com interceptor injetando Bearer e tratando 401 (logout automático).
Tema: tokens em CSS vars (`--ada-*`) — ver [[DEC_TAILWIND_TOKENS_CSS_VARS]].

> **Módulo de referência:** `features/estoque/ingredientes/` — copiar estrutura para novos módulos.

## Pontos de extensão conhecidos

- Notificações via push/e-mail: `NotificacaoEstoqueService` já cria a notificação; falta canal externo.
- Exportação Excel: handlers de relatório poderiam emitir xlsx além de PDF.
- Multi-unidade: todas as entidades têm `CriadoPor`/`AtualizadoPor`; adicionar `UnidadeId` + filtro global no `AppDbContext` segmentaria por loja.
- Histórico de custo de ingrediente: ainda não há.

> Cuidado: ao planejar evoluções, ler primeiro [[STATUS_SNAPSHOT]] e [[OPEN_LOOPS]].
