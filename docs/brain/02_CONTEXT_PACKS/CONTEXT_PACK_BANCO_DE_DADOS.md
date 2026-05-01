---
name: CONTEXT_PACK_BANCO_DE_DADOS
description: Pack para tasks em modelagem, migrations, queries diretas
type: context_pack
status: existente
ultima_atualizacao: 2026-04-30
---

# 🧰 Context pack — Banco de Dados

## Quando usar
Adicionar coluna, criar migration, alterar schema, escrever query EF, debugar performance.

## Status resumido
- PostgreSQL 15 + EF Core 8 + Npgsql.
- Schemas: `auth`, `estoque`, `producao`.
- 17 migrations aplicadas automaticamente em `Program.cs`.
- snake_case **explícito** em toda coluna.
- `CasaDiAna/docs/BANCO_DE_DADOS.md` é a referência viva (gerada a partir das Configurations).

## Regras críticas
- Nunca confiar em convenção automática — sempre `HasColumnName(...)`.
- Enums em `varchar` usam `HasConversion`.
- `criado_por`/`atualizado_por` armazenam UUID **sem FK** para `auth.usuarios`.
- `Npgsql.EnableLegacyTimestampBehavior=true` (Program.cs:20) — DateTime `Kind=Unspecified` em `timestamptz`.
- Buildar pelo projeto API (lock de DLL no Windows).
- Migrations: `--project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API`.

## Arquivos / docs de referência
- `Infrastructure/Persistence/AppDbContext.cs`
- `Infrastructure/Persistence/Configurations/`
- `Infrastructure/Persistence/Migrations/`
- `CasaDiAna/docs/BANCO_DE_DADOS.md`

## Cuidados
- Migration nova: rodar `dotnet ef migrations add` revisar o SQL gerado.
- Soft delete: filtros padrão devem honrar `ativo = true`.
- Constraints CHECK de estoque foram **removidas** propositalmente — não recriar sem registrar [[DEC]].

## Prompt curto
> "Task em banco/EF do Casa di Ana ERP. Schemas `auth`, `estoque`, `producao`. snake_case explícito em toda coluna. Migrations rodam em todo boot. `CasaDiAna/docs/BANCO_DE_DADOS.md` é a referência. Buildar pela API (`src/CasaDiAna.API`)."
