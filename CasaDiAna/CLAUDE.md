# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Sistema de Gestão Operacional para a cafeteria **Casa di Ana**. Backend ASP.NET Core 8 com Clean Architecture. Frontend React ainda não implementado.

## Comandos

### Build e execução

```bash
# Buildar (sempre pelo projeto API para resolver todas as dependências)
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build"

# Rodar a API (porta 5130)
powershell.exe -Command "dotnet run --project src/CasaDiAna.API"

# Swagger disponível em: http://localhost:5130/swagger
```

> **Atenção (Windows):** `dotnet build` na raiz da solução falha frequentemente por lock de DLL quando a API está rodando. Sempre parar processos `dotnet` antes de buildar na raiz, ou buildar diretamente de `src/CasaDiAna.API`. Se aparecer erro de cache (`CoreCompileInputs.cache`), deletar `src/CasaDiAna.Application/obj` e rebuildar.

### Testes

```bash
# Todos os testes
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test"

# Teste específico
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test --filter 'NomeDoTeste'"
```

### Migrations (EF Core)

```bash
# Listar migrations
dotnet ef migrations list --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API

# Criar nova migration
dotnet ef migrations add NomeDaMigration --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API

# Aplicar migrations
dotnet ef database update --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API
```

### Autenticação para testes manuais

```bash
# Login (retorna token JWT)
curl -s http://localhost:5130/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@casadiana.com","senha":"Admin@123"}'
```

No Swagger: clicar em **Authorize** e colar **apenas o token** (sem prefixo `Bearer `), pois o scheme `SecuritySchemeType.Http` adiciona o prefixo automaticamente.

## Arquitetura

### Camadas

```
CasaDiAna.Domain         — Entities, Enums, Exceptions, Interfaces dos repositórios
CasaDiAna.Application    — Commands, Queries, Handlers, DTOs, ValidationBehavior
CasaDiAna.Infrastructure — Repositórios (EF Core), AppDbContext, JwtService, CurrentUserService
CasaDiAna.API            — Controllers, Middleware, Program.cs
```

A API não referencia Domain diretamente — passa por Application e Infrastructure.

### CQRS com MediatR

Cada operação é um `record` que implementa `IRequest<TResponse>`. O handler correspondente implementa `IRequestHandler<TCommand, TResponse>`. Validators são registrados automaticamente pelo `ValidationBehavior` no pipeline do MediatR — se a validação falhar, lança `ValidationException` (HTTP 400) antes de chegar ao handler.

**Padrão de um módulo completo** (ex: Ingredientes):

```
Application/
  Ingredientes/
    Commands/
      CriarIngrediente/
        CriarIngredienteCommand.cs        ← record : IRequest<IngredienteDto>
        CriarIngredienteCommandValidator.cs ← AbstractValidator<CriarIngredienteCommand>
        CriarIngredienteCommandHandler.cs  ← IRequestHandler + ToDto() estático
      AtualizarIngrediente/...
      DesativarIngrediente/...
    Queries/
      ListarIngredientes/...
      ObterIngrediente/...
    Dtos/
      IngredienteDto.cs
      IngredienteResumoDto.cs
```

O método `internal static ToDto(Entity e)` fica no handler de `Criar` e é reutilizado por todos os outros handlers do mesmo módulo.

### Respostas da API

Todas as respostas usam `ApiResponse<T>` (`Application/Common/ApiResponse.cs`):

```json
{ "sucesso": true,  "dados": { ... }, "erros": [] }
{ "sucesso": false, "dados": null,    "erros": ["mensagem"] }
```

Mapeamento de exceções (`ExceptionHandlingMiddleware`):
- `ValidationException` → **400** (FluentValidation, campos inválidos)
- `DomainException` → **422** (regra de negócio violada)
- `UnauthorizedAccessException` → **401**
- `Exception` → **500**

### Banco de dados

PostgreSQL com EF Core 8, Npgsql. Schemas:
- `auth` — `usuarios`
- `estoque` — todas as demais tabelas

Todas as colunas são mapeadas explicitamente via `HasColumnName()` em snake_case. Não confiar em convenções automáticas do EF. Configurações ficam em `Infrastructure/Persistence/Configurations/`.

`UnidadeMedida` é uma lookup table com seed via `HasData()` na migration inicial (KG, L, UN, etc.).

### Estoque e movimentações

Toda alteração de `EstoqueAtual` de um `Ingrediente` gera obrigatoriamente um registro em `Movimentacoes` com:
- `TipoMovimentacao`: `Entrada`, `AjustePositivo`, `AjusteNegativo`, `SaidaProducao`
- `ReferenciaTipo` + `ReferenciaId`: rastreabilidade da origem (ex: `"EntradaMercadoria"`, `"Inventario"`)

Fluxo de `RegistrarEntrada`: para cada item → `entrada.AdicionarItem()` + `ingrediente.AtualizarEstoque()` + `Movimentacao.Criar()` + salvar tudo de uma vez.

### Armadilha: entidades com coleções `readonly`

Entidades de domínio com coleções `private readonly List<T>` (ex: `Inventario._itens`) **não podem ser atualizadas via `_db.Update(entidade)`** quando a entidade foi carregada do banco. O EF trata os novos filhos com GUID não-padrão como `Modified` (não `Added`), gerando `DbUpdateConcurrencyException`.

**Solução**: ao adicionar um item filho a uma entidade já persistida, usar um método específico no repositório para inserir o filho diretamente:

```csharp
// IInventarioRepository
Task AdicionarItemAsync(ItemInventario item, CancellationToken ct = default);

// No handler:
inventario.AdicionarItem(...);
var novoItem = inventario.Itens.Last();
await _inventarios.AdicionarItemAsync(novoItem, ct);
await _inventarios.SalvarAsync(ct);
```

O mesmo padrão se aplica a qualquer entidade que precise ter filhos adicionados após a criação inicial.

### ICurrentUserService

Lê o usuário autenticado do `HttpContext`. O ASP.NET Core JWT middleware remapeia o claim `sub` para `ClaimTypes.NameIdentifier` — **nunca usar `JwtRegisteredClaimNames.Sub`** no `CurrentUserService`, pois não será encontrado.

### Módulos implementados

| Módulo | Endpoints |
|---|---|
| Auth | `POST /api/auth/login` |
| Categorias | `GET/POST /api/categorias`, `PUT/DELETE /api/categorias/{id}` |
| Unidades de Medida | `GET /api/unidades-medida` |
| Ingredientes | `GET/POST /api/ingredientes`, `GET/PUT/DELETE /api/ingredientes/{id}` |
| Fornecedores | `GET/POST /api/fornecedores`, `GET/PUT/DELETE /api/fornecedores/{id}` |
| Entradas | `GET/POST /api/entradas`, `GET /api/entradas/{id}`, `POST /api/entradas/{id}/cancelar` |
| Inventários | `GET/POST /api/inventarios`, `GET /api/inventarios/{id}`, `POST /api/inventarios/{id}/itens`, `POST /api/inventarios/{id}/finalizar`, `POST /api/inventarios/{id}/cancelar` |
| Relatórios | `GET /api/relatorios/estoque-atual`, `GET /api/relatorios/movimentacoes`, `GET /api/relatorios/entradas` |

### Testes

Projeto `CasaDiAna.Application.Tests` com xUnit, Moq, FluentAssertions. Testa apenas a camada Application (handlers). Repositórios são mockados — **não usar banco real nos testes**. Padrão: mock dos repositórios + `_currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId)`.

Para múltiplas chamadas ao mesmo método mockado com retornos diferentes, usar `SetupSequence`.
