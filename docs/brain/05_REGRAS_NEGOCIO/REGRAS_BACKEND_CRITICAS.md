---
name: REGRAS_BACKEND_CRITICAS
description: Regras e armadilhas que se violadas quebram o sistema (compiladas do CLAUDE.md)
type: regra
status: existente
ultima_atualizacao: 2026-04-30
fontes:
  - CasaDiAna/CLAUDE.md
---

# ⚠️ Regras backend críticas

> **Nota:** se uma regra abaixo for violada, há histórico de bug recorrente. Não relaxar sem registrar [[DEC]] e [[OPEN_LOOPS]].

## Build / dev

- **Buildar pelo projeto API**: `dotnet build src/CasaDiAna.API`. Buildar pela raiz no Windows causa **lock de DLL**.
- Migrations sempre com `--project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API`.

## CQRS / Pipeline

- Cada operação é `record : IRequest<TResponse>` + handler `IRequestHandler<,>`.
- `internal static ToDto(Entity e)` fica no handler de **Criar** e é reutilizado pelos demais handlers do módulo.
- Validators rodam antes do handler via `ValidationBehavior<,>` — falha gera 400 automático.

## ApiResponse

- Tudo retorna `ApiResponse<T>` com `{ sucesso, dados, erros }`.
- `ExceptionHandlingMiddleware` mapeia exceções:
  - `ValidationException` → 400
  - `DomainException` → 422
  - `UnauthorizedAccessException` → 401
  - `Exception` → 500

## EF Core

- **Snake_case explícito** em todas as colunas via `IEntityTypeConfiguration<T>` (`HasColumnName(...)`).
- Não confiar em convenções automáticas.

## Armadilha — coleções `private readonly List<T>`

`_db.Update(entidade)` para inserir filhos quebra com `DbUpdateConcurrencyException`. **Inserir o filho diretamente pelo repositório.** (Ver [[REGRA_COLECAO_READONLY_DBUPDATE]].)

## Armadilha — `ICurrentUserService`

ASP.NET Core remapeia `sub` para `ClaimTypes.NameIdentifier`. Nunca usar `JwtRegisteredClaimNames.Sub` ao ler claim.

## Soft delete

- `NomeExisteAsync` deve filtrar `ativo = true`. Sem isso, registros desativados bloqueiam criação. Ver [[REGRA_SOFT_DELETE_NOMEEXISTE]].

## Estoque

- Toda alteração de `EstoqueAtual` exige **uma `Movimentacao`** com `ReferenciaTipo` + `ReferenciaId`.
- Entrada deve chamar **tanto `AtualizarEstoque()` quanto `AtualizarCusto()`**. Sem custo, ficha técnica retorna zero.
- Estoque é clampado em 0 pelo domínio.

## Filtros de data

- Usar `< ate.Date.AddDays(1)` (exclusivo) para incluir registros do dia inteiro. Ver [[REGRA_FILTROS_DATA_EXCLUSIVO]].

## 2FA / TOTP

- Sistema usa app autenticador — **não SMS**.
- Validator do código aceita apenas `^\d{6}$`. Recovery code (`XXXX-XXXX`) **não chega** ao handler TOTP.
- Não validar BCrypt de recovery code dentro do handler TOTP (~200ms = latência visível).

## Frontend (compactado)

- Tokens `var(--ada-*)` em `index.css`. Não usar classes Tailwind de cor direta — quebra tema escuro.
- Form: `resolver: zodResolver(schema) as any`.
- Datas: backend retorna `"2026-03-28T00:00:00"`. Usar `new Date(valor)` direto.
- Componentes obrigatórios: `<PageHeader>`, `<SkeletonTable>` em loading, `<EmptyState>` em listas vazias, `<div className="overflow-x-auto">` em toda tabela.
