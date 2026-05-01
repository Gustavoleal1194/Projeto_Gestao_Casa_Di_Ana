---
name: PERSISTENCIA_E_BANCO – PostgreSQL + EF Core 8
description: Schemas, entidades, migrations e regras de mapeamento
type: project_memory
status: existente
ultima_atualizacao: 2026-04-30
fontes:
  - CasaDiAna/docs/BANCO_DE_DADOS.md
  - CasaDiAna/src/CasaDiAna.Infrastructure/Persistence/Migrations/
---

# 🗄️ Persistência e Banco de Dados

## Stack

- **SGBD:** PostgreSQL 15
- **ORM:** Entity Framework Core 8 + Npgsql 8.0.11
- **Quirk Npgsql:** `AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true)` em `Program.cs:20` — permite `DateTime` com `Kind=Unspecified` em colunas `timestamptz`.

## Schemas

- `auth` — autenticação (usuários, código de recuperação)
- `estoque` — unidades, categorias, ingredientes, fornecedores, entradas, movimentações, inventários, notificações, histórico de etiquetas
- `producao` — produtos, ficha técnica, produção, vendas, perdas, modelo de etiqueta nutricional, importação de vendas

## Convenções

- Todas as colunas em `snake_case`, mapeadas **explicitamente** com `HasColumnName()` em `IEntityTypeConfiguration<T>`.
- PKs `uuid` geradas no domínio (`Guid.NewGuid()`), exceto `unidades_medida.id` que é `smallint`.
- `criado_por`/`atualizado_por` armazenam UUID do usuário **sem FK** para `auth.usuarios` (decisão consciente, ver [[REGRAS_BACKEND_CRITICAS]]).
- Enums armazenados como `varchar` usam `HasConversion` explícito.
- Propriedades computadas (ex. `ItemEntradaMercadoria.CustoTotal`, `ItemInventario.Diferenca`) são `Ignore`d — não existem como coluna.

## Migrations (17 detectadas em 2026-04-30)

| Migration                                          | Resumo                                              |
| -------------------------------------------------- | --------------------------------------------------- |
| `CriacaoInicial`                                   | schema base                                         |
| `AddModuloProducao`                                | produtos, ficha técnica, produção, vendas           |
| `RemoverCheckEstoqueNaoNegativo`                   | remove constraint check de estoque                  |
| `RemoverCheckSaldoMovimentacaoNaoNegativo`         | remove constraint em movimentações                  |
| `AdicionarPerdaProduto`                            | perdas de produto                                   |
| `AddNotificacoesEstoque`                           | notificações automáticas                            |
| `AddDiasValidadeToProduto` (revertida)             | dias_validade — depois removida                     |
| `AddHistoricoImpressaoEtiquetas`                   | histórico de etiquetas; remove dias_validade        |
| `RemoveDiasValidadeDeProduto`                      | (idem acima, mantido por consistência da history)   |
| `AddModeloEtiquetaNutricional`                     | modelo nutricional por produto                      |
| `AddCamposNutricionaisAnvisa`                      | campos ANVISA na etiqueta                           |
| `AdicionarImportacaoVendas`                        | módulo de importação CSV                            |
| `Add2FaFields`                                     | 2FA inicial                                         |
| `RefatorarTotpAuth`                                | refactor 2FA → TOTP puro (sem SMS)                  |
| `AdicionarCamposLoginUsuario`                      | campos de último login etc.                         |
| `ZerarEstoqueNegativo`                             | zera saldos negativos previamente acumulados        |
| `AddRecebidoPorToEntradas`                         | quem recebeu a entrada                              |

> Migrations são aplicadas automaticamente em `Program.cs:147-167` na inicialização.

## Soft delete

Têm coluna `ativo`: `CategoriaIngrediente`, `CategoriaProduto`, `Ingrediente`, `Fornecedor`, `Produto`, `Usuario`. Desativação **não apaga** — só marca `ativo = false`.

> Regra: `NomeExisteAsync` deve filtrar `ativo = true` para não bloquear criação. Ver [[REGRA_SOFT_DELETE_NOMEEXISTE]].

## Rastreabilidade de movimentações

Cada `Movimentacao` carrega `ReferenciaTipo` (string) + `ReferenciaId` (GUID), apontando para a origem (entrada, inventário, produção, correção). Ver [[REGRA_MOVIMENTACAO_RASTREAVEL]].

## Comandos úteis

```bash
# Criar migration
dotnet ef migrations add NomeDaMigration \
  --project src/CasaDiAna.Infrastructure \
  --startup-project src/CasaDiAna.API

# Aplicar
dotnet ef database update \
  --project src/CasaDiAna.Infrastructure \
  --startup-project src/CasaDiAna.API
```

> ⚠️ Buildar **sempre** pelo projeto `src/CasaDiAna.API` (lock de DLL no Windows se buildar pela raiz). Ver [[REGRAS_BACKEND_CRITICAS]].
