---
name: CONTEXT_PACK_BACKEND
description: Pack denso para tasks no backend ASP.NET Core 8 + Clean Arch + CQRS
type: context_pack
status: existente
ultima_atualizacao: 2026-04-30
---

# 🧰 Context pack — Backend

## Quando usar
Você foi designado para implementar/alterar handlers, validators, controllers, repositórios, migrations ou serviços do backend.

## Status resumido
- ASP.NET Core 8 + EF Core 8 + PostgreSQL 15.
- Clean Arch: `Domain → Application → Infrastructure → API` (deps unidirecionais).
- CQRS via MediatR (`record : IRequest<T>` + handler).
- Validação no pipeline (`ValidationBehavior<,>`) — falha = 400.
- Resposta padrão `ApiResponse<T> { sucesso, dados, erros }`.

## Responsabilidades por camada
- **Domain** — entidades + métodos de domínio + enums + interfaces de repositório.
- **Application** — Commands/Queries + Handlers + Validators + DTOs.
- **Infrastructure** — `AppDbContext`, Configurations (snake_case explícito), Repositórios, Services.
- **API** — Controllers (sem regra), Middleware, `Program.cs`.

## Regras críticas
- [[REGRA_MOVIMENTACAO_RASTREAVEL]] — alterou estoque? gere `Movimentacao`.
- [[REGRA_ENTRADA_ATUALIZA_CUSTO]] — entrada atualiza estoque **e** custo.
- [[REGRA_SOFT_DELETE_NOMEEXISTE]] — `NomeExisteAsync` filtra `ativo = true`.
- [[REGRA_FILTROS_DATA_EXCLUSIVO]] — `< ate.Date.AddDays(1)`.
- [[REGRA_COLECAO_READONLY_DBUPDATE]] — não usar `_db.Update(parent)` para inserir filho readonly.
- [[REGRA_2FA_TOTP_FORMATO]] — validator do TOTP só `^\d{6}$`.
- Build sempre por `dotnet build src/CasaDiAna.API` (lock de DLL no Windows).
- ASP.NET remapeia `sub` → `ClaimTypes.NameIdentifier`. Não usar `JwtRegisteredClaimNames.Sub`.

## Módulos relacionados
- [[MOC_MODULOS]] (índice de todos)

## Arquivos / docs de referência
- `CasaDiAna/CLAUDE.md`
- `CasaDiAna/README.md`
- `CasaDiAna/docs/BANCO_DE_DADOS.md`
- `Application/Common/ValidationBehavior.cs`
- `API/Middleware/ExceptionHandlingMiddleware.cs`
- `API/Program.cs` (boot + rate limit + CORS + seed)

## Cuidados
- Nunca pular a validação fluent.
- DTOs reutilizam `internal static ToDto(Entity e)` do handler de Criar.
- Configurations devem mapear **toda** coluna explicitamente em snake_case.
- Migrations: revisar SQL antes de rodar `dotnet ef database update`.
- Nada de mudar contrato `ApiResponse<T>` sem registrar [[DEC]].

## Prompt curto para agentes
> "Você está editando o backend Casa di Ana ERP (Clean Arch + CQRS via MediatR + EF Core 8 + PostgreSQL). Toda regra crítica está em [[REGRAS_BACKEND_CRITICAS]]. Antes de implementar, verifique a nota do módulo afetado em `04_MODULOS/`. Use envelope `ApiResponse<T>`, snake_case explícito, validator antes do handler, e gere `Movimentacao` em qualquer mudança de estoque. Pt-BR sempre."
