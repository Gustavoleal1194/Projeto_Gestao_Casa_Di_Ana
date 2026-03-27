# Plano 1 – Infraestrutura Base | Casa di Ana

> **Para agentes:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. Os passos usam sintaxe de checkbox (`- [ ]`) para rastreamento.

**Goal:** Criar a solução ASP.NET Core com 4 camadas (Domain, Application, Infrastructure, API), PostgreSQL via EF Core 8, JWT, Swagger, MediatR e endpoint de login — base pronta para receber as features do módulo de estoque.

**Architecture:** Clean Architecture com 4 projetos .NET 8. JWT com Access Token (1h). MediatR com pipeline de validação via FluentValidation. EF Core com Npgsql, schema `estoque` + `auth`.

**Tech Stack:** .NET 8 · ASP.NET Core Web API · PostgreSQL 16 · EF Core 8 (Npgsql) · MediatR 12 · FluentValidation 11 · Mapster 7 · JWT Bearer · Swashbuckle 6 · xUnit 2 · Moq 4 · FluentAssertions 6 · BCrypt.Net-Next 4

---

## Arquivos criados neste plano

```
CasaDiAna.sln
src/
  CasaDiAna.Domain/
    Exceptions/DomainException.cs
    Entities/UnidadeMedida.cs
    Entities/CategoriaIngrediente.cs
    Entities/Ingrediente.cs
    Entities/Fornecedor.cs
    Entities/EntradaMercadoria.cs
    Entities/ItemEntradaMercadoria.cs
    Entities/Inventario.cs
    Entities/ItemInventario.cs
    Entities/Movimentacao.cs
    Entities/Usuario.cs
    Enums/TipoMovimentacao.cs
    Enums/StatusEntrada.cs
    Enums/StatusInventario.cs
    Enums/PapelUsuario.cs
    Interfaces/IIngredienteRepository.cs
    Interfaces/IFornecedorRepository.cs
    Interfaces/IEntradaMercadoriaRepository.cs
    Interfaces/IInventarioRepository.cs
    Interfaces/IMovimentacaoRepository.cs
    Interfaces/IUsuarioRepository.cs
  CasaDiAna.Application/
    Common/ApiResponse.cs
    Common/ValidationBehavior.cs
    Common/ICurrentUserService.cs
    Auth/Commands/Login/LoginCommand.cs
    Auth/Commands/Login/LoginCommandHandler.cs
    Auth/Commands/Login/LoginCommandValidator.cs
    Auth/Dtos/TokenDto.cs
  CasaDiAna.Infrastructure/
    Persistence/AppDbContext.cs
    Persistence/Configurations/UnidadeMedidaConfiguration.cs
    Persistence/Configurations/CategoriaIngredienteConfiguration.cs
    Persistence/Configurations/IngredienteConfiguration.cs
    Persistence/Configurations/FornecedorConfiguration.cs
    Persistence/Configurations/EntradaMercadoriaConfiguration.cs
    Persistence/Configurations/InventarioConfiguration.cs
    Persistence/Configurations/MovimentacaoConfiguration.cs
    Persistence/Configurations/UsuarioConfiguration.cs
    Repositories/IngredienteRepository.cs
    Repositories/FornecedorRepository.cs
    Repositories/UsuarioRepository.cs
    Services/JwtService.cs
    Services/CurrentUserService.cs
    DependencyInjection.cs
  CasaDiAna.API/
    Controllers/AuthController.cs
    Middleware/ExceptionHandlingMiddleware.cs
    Program.cs
    appsettings.json
    appsettings.Development.json
tests/
  CasaDiAna.Application.Tests/
    Common/ValidationBehaviorTests.cs
    Auth/LoginCommandHandlerTests.cs
```

---

## Tarefa 1: Criar a solução e projetos

**Arquivos:** `CasaDiAna.sln` e todos os `.csproj`

- [ ] **Passo 1: Criar estrutura de pastas e solução**

```bash
mkdir -p CasaDiAna/src CasaDiAna/tests
cd CasaDiAna
dotnet new sln -n CasaDiAna
```

- [ ] **Passo 2: Criar os projetos**

```bash
dotnet new classlib -n CasaDiAna.Domain        -o src/CasaDiAna.Domain        -f net8.0
dotnet new classlib -n CasaDiAna.Application   -o src/CasaDiAna.Application   -f net8.0
dotnet new classlib -n CasaDiAna.Infrastructure -o src/CasaDiAna.Infrastructure -f net8.0
dotnet new webapi   -n CasaDiAna.API           -o src/CasaDiAna.API           -f net8.0
dotnet new xunit    -n CasaDiAna.Application.Tests -o tests/CasaDiAna.Application.Tests -f net8.0
```

- [ ] **Passo 3: Adicionar projetos à solução**

```bash
dotnet sln add src/CasaDiAna.Domain/CasaDiAna.Domain.csproj
dotnet sln add src/CasaDiAna.Application/CasaDiAna.Application.csproj
dotnet sln add src/CasaDiAna.Infrastructure/CasaDiAna.Infrastructure.csproj
dotnet sln add src/CasaDiAna.API/CasaDiAna.API.csproj
dotnet sln add tests/CasaDiAna.Application.Tests/CasaDiAna.Application.Tests.csproj
```

- [ ] **Passo 4: Configurar referências entre projetos**

```bash
# Application depende de Domain
dotnet add src/CasaDiAna.Application/CasaDiAna.Application.csproj reference \
  src/CasaDiAna.Domain/CasaDiAna.Domain.csproj

# Infrastructure depende de Application e Domain
dotnet add src/CasaDiAna.Infrastructure/CasaDiAna.Infrastructure.csproj reference \
  src/CasaDiAna.Application/CasaDiAna.Application.csproj
dotnet add src/CasaDiAna.Infrastructure/CasaDiAna.Infrastructure.csproj reference \
  src/CasaDiAna.Domain/CasaDiAna.Domain.csproj

# API depende de Application e Infrastructure
dotnet add src/CasaDiAna.API/CasaDiAna.API.csproj reference \
  src/CasaDiAna.Application/CasaDiAna.Application.csproj
dotnet add src/CasaDiAna.API/CasaDiAna.API.csproj reference \
  src/CasaDiAna.Infrastructure/CasaDiAna.Infrastructure.csproj

# Tests depende de Application
dotnet add tests/CasaDiAna.Application.Tests/CasaDiAna.Application.Tests.csproj reference \
  src/CasaDiAna.Application/CasaDiAna.Application.csproj
dotnet add tests/CasaDiAna.Application.Tests/CasaDiAna.Application.Tests.csproj reference \
  src/CasaDiAna.Domain/CasaDiAna.Domain.csproj
```

- [ ] **Passo 5: Remover arquivos de template desnecessários**

```bash
rm src/CasaDiAna.Domain/Class1.cs
rm src/CasaDiAna.Application/Class1.cs
rm src/CasaDiAna.Infrastructure/Class1.cs
rm src/CasaDiAna.API/Controllers/WeatherForecastController.cs
rm src/CasaDiAna.API/WeatherForecast.cs
rm tests/CasaDiAna.Application.Tests/UnitTest1.cs
```

- [ ] **Passo 6: Verificar compilação**

```bash
dotnet build
```
Esperado: `Build succeeded. 0 Error(s)`

---

## Tarefa 2: Pacotes NuGet

**Arquivos:** todos os `.csproj`

- [ ] **Passo 1: Pacotes do Domain**

```bash
# Domain é puro — sem dependências externas
```

- [ ] **Passo 2: Pacotes da Application**

```bash
cd src/CasaDiAna.Application
dotnet add package MediatR --version 12.4.1
dotnet add package FluentValidation --version 11.11.0
dotnet add package Mapster --version 7.4.0
```

- [ ] **Passo 3: Pacotes da Infrastructure**

```bash
cd ../CasaDiAna.Infrastructure
dotnet add package Microsoft.EntityFrameworkCore --version 8.0.11
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 8.0.11
dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.11
dotnet add package BCrypt.Net-Next --version 4.0.3
dotnet add package Microsoft.AspNetCore.Http.Abstractions --version 2.3.0
```

- [ ] **Passo 4: Pacotes da API**

```bash
cd ../CasaDiAna.API
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.0.11
dotnet add package Swashbuckle.AspNetCore --version 6.9.0
dotnet add package MediatR --version 12.4.1
dotnet add package FluentValidation.AspNetCore --version 11.3.0
```

- [ ] **Passo 5: Pacotes dos Tests**

```bash
cd ../../tests/CasaDiAna.Application.Tests
dotnet add package Moq --version 4.20.72
dotnet add package FluentAssertions --version 6.12.2
dotnet add package Microsoft.NET.Test.Sdk --version 17.12.0
```

- [ ] **Passo 6: Verificar compilação**

```bash
cd ../..
dotnet build
```
Esperado: `Build succeeded. 0 Error(s)`

---

## Tarefa 3: Enums do Domínio

**Arquivos:** `src/CasaDiAna.Domain/Enums/`

- [ ] **Passo 1: Criar enums**

`src/CasaDiAna.Domain/Enums/PapelUsuario.cs`
```csharp
namespace CasaDiAna.Domain.Enums;

public enum PapelUsuario
{
    Admin = 1,
    Coordenador = 2,
    OperadorCozinha = 3,
    OperadorPanificacao = 4,
    OperadorBar = 5,
    Compras = 6
}
```

`src/CasaDiAna.Domain/Enums/TipoMovimentacao.cs`
```csharp
namespace CasaDiAna.Domain.Enums;

public enum TipoMovimentacao
{
    Entrada = 1,
    AjustePositivo = 2,
    AjusteNegativo = 3,
    SaidaProducao = 4
}
```

`src/CasaDiAna.Domain/Enums/StatusEntrada.cs`
```csharp
namespace CasaDiAna.Domain.Enums;

public enum StatusEntrada
{
    Confirmada = 1,
    Cancelada = 2
}
```

`src/CasaDiAna.Domain/Enums/StatusInventario.cs`
```csharp
namespace CasaDiAna.Domain.Enums;

public enum StatusInventario
{
    EmAndamento = 1,
    Finalizado = 2,
    Cancelado = 3
}
```

- [ ] **Passo 2: Verificar compilação**

```bash
dotnet build src/CasaDiAna.Domain
```
Esperado: `Build succeeded. 0 Error(s)`

---

## Tarefa 4: Entidades do Domínio

**Arquivos:** `src/CasaDiAna.Domain/`

- [ ] **Passo 1: DomainException**

`src/CasaDiAna.Domain/Exceptions/DomainException.cs`
```csharp
namespace CasaDiAna.Domain.Exceptions;

public class DomainException : Exception
{
    public DomainException(string mensagem) : base(mensagem) { }
}
```

- [ ] **Passo 2: Entidade Usuario**

`src/CasaDiAna.Domain/Entities/Usuario.cs`
```csharp
using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Domain.Entities;

public class Usuario
{
    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string SenhaHash { get; private set; } = string.Empty;
    public PapelUsuario Papel { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }

    private Usuario() { }

    public static Usuario Criar(string nome, string email, string senhaHash, PapelUsuario papel)
    {
        return new Usuario
        {
            Id = Guid.NewGuid(),
            Nome = nome,
            Email = email.ToLowerInvariant(),
            SenhaHash = senhaHash,
            Papel = papel,
            Ativo = true,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow
        };
    }

    public bool SenhaCorreta(string senha) =>
        BCrypt.Net.BCrypt.Verify(senha, SenhaHash);
}
```

> **Nota:** BCrypt é referenciado aqui, mas o assembly está em Infrastructure. Para manter o Domain puro, extraia a verificação para um serviço na Application (`IPasswordHasher`) se desejar separação estrita. Para este projeto, a dependência direta é aceitável.

- [ ] **Passo 3: UnidadeMedida e CategoriaIngrediente**

`src/CasaDiAna.Domain/Entities/UnidadeMedida.cs`
```csharp
namespace CasaDiAna.Domain.Entities;

public class UnidadeMedida
{
    public short Id { get; private set; }
    public string Codigo { get; private set; } = string.Empty;
    public string Descricao { get; private set; } = string.Empty;

    private UnidadeMedida() { }
}
```

`src/CasaDiAna.Domain/Entities/CategoriaIngrediente.cs`
```csharp
namespace CasaDiAna.Domain.Entities;

public class CategoriaIngrediente
{
    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    private CategoriaIngrediente() { }

    public static CategoriaIngrediente Criar(string nome, Guid criadoPor)
    {
        return new CategoriaIngrediente
        {
            Id = Guid.NewGuid(),
            Nome = nome,
            Ativo = true,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor,
            AtualizadoPor = criadoPor
        };
    }
}
```

- [ ] **Passo 4: Entidade Ingrediente**

`src/CasaDiAna.Domain/Entities/Ingrediente.cs`
```csharp
using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class Ingrediente
{
    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string? CodigoInterno { get; private set; }
    public Guid? CategoriaId { get; private set; }
    public short UnidadeMedidaId { get; private set; }
    public decimal EstoqueAtual { get; private set; }
    public decimal EstoqueMinimo { get; private set; }
    public decimal? EstoqueMaximo { get; private set; }
    public string? Observacoes { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    public UnidadeMedida? UnidadeMedida { get; private set; }
    public CategoriaIngrediente? Categoria { get; private set; }

    private Ingrediente() { }

    public static Ingrediente Criar(
        string nome,
        short unidadeMedidaId,
        decimal estoqueMinimo,
        Guid criadoPor,
        string? codigoInterno = null,
        Guid? categoriaId = null,
        decimal? estoqueMaximo = null,
        string? observacoes = null)
    {
        if (estoqueMinimo < 0)
            throw new DomainException("Estoque mínimo não pode ser negativo.");
        if (estoqueMaximo.HasValue && estoqueMaximo < estoqueMinimo)
            throw new DomainException("Estoque máximo não pode ser menor que o mínimo.");

        return new Ingrediente
        {
            Id = Guid.NewGuid(),
            Nome = nome,
            CodigoInterno = codigoInterno,
            CategoriaId = categoriaId,
            UnidadeMedidaId = unidadeMedidaId,
            EstoqueAtual = 0,
            EstoqueMinimo = estoqueMinimo,
            EstoqueMaximo = estoqueMaximo,
            Observacoes = observacoes,
            Ativo = true,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor,
            AtualizadoPor = criadoPor
        };
    }

    public void Atualizar(
        string nome,
        short unidadeMedidaId,
        decimal estoqueMinimo,
        Guid atualizadoPor,
        string? codigoInterno = null,
        Guid? categoriaId = null,
        decimal? estoqueMaximo = null,
        string? observacoes = null)
    {
        if (estoqueMinimo < 0)
            throw new DomainException("Estoque mínimo não pode ser negativo.");
        if (estoqueMaximo.HasValue && estoqueMaximo < estoqueMinimo)
            throw new DomainException("Estoque máximo não pode ser menor que o mínimo.");

        Nome = nome;
        CodigoInterno = codigoInterno;
        CategoriaId = categoriaId;
        UnidadeMedidaId = unidadeMedidaId;
        EstoqueMinimo = estoqueMinimo;
        EstoqueMaximo = estoqueMaximo;
        Observacoes = observacoes;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public void Desativar(Guid atualizadoPor)
    {
        Ativo = false;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public void AtualizarEstoque(decimal novoSaldo, Guid atualizadoPor)
    {
        if (novoSaldo < 0)
            throw new DomainException("Estoque não pode ser negativo.");
        EstoqueAtual = novoSaldo;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public bool EstaBaixoDoMinimo() => EstoqueAtual < EstoqueMinimo;
}
```

- [ ] **Passo 5: Entidade Fornecedor**

`src/CasaDiAna.Domain/Entities/Fornecedor.cs`
```csharp
namespace CasaDiAna.Domain.Entities;

public class Fornecedor
{
    public Guid Id { get; private set; }
    public string RazaoSocial { get; private set; } = string.Empty;
    public string? NomeFantasia { get; private set; }
    public string? Cnpj { get; private set; }
    public string? Telefone { get; private set; }
    public string? Email { get; private set; }
    public string? ContatoNome { get; private set; }
    public string? Observacoes { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    private Fornecedor() { }

    public static Fornecedor Criar(
        string razaoSocial,
        Guid criadoPor,
        string? nomeFantasia = null,
        string? cnpj = null,
        string? telefone = null,
        string? email = null,
        string? contatoNome = null,
        string? observacoes = null)
    {
        return new Fornecedor
        {
            Id = Guid.NewGuid(),
            RazaoSocial = razaoSocial,
            NomeFantasia = nomeFantasia,
            Cnpj = cnpj,
            Telefone = telefone,
            Email = email,
            ContatoNome = contatoNome,
            Observacoes = observacoes,
            Ativo = true,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor,
            AtualizadoPor = criadoPor
        };
    }

    public void Atualizar(
        string razaoSocial,
        Guid atualizadoPor,
        string? nomeFantasia = null,
        string? cnpj = null,
        string? telefone = null,
        string? email = null,
        string? contatoNome = null,
        string? observacoes = null)
    {
        RazaoSocial = razaoSocial;
        NomeFantasia = nomeFantasia;
        Cnpj = cnpj;
        Telefone = telefone;
        Email = email;
        ContatoNome = contatoNome;
        Observacoes = observacoes;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public void Desativar(Guid atualizadoPor)
    {
        Ativo = false;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }
}
```

- [ ] **Passo 6: Entidades de Entrada de Mercadoria**

`src/CasaDiAna.Domain/Entities/EntradaMercadoria.cs`
```csharp
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class EntradaMercadoria
{
    public Guid Id { get; private set; }
    public Guid FornecedorId { get; private set; }
    public string? NumeroNotaFiscal { get; private set; }
    public DateTime DataEntrada { get; private set; }
    public string? Observacoes { get; private set; }
    public StatusEntrada Status { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    public Fornecedor? Fornecedor { get; private set; }
    public IReadOnlyCollection<ItemEntradaMercadoria> Itens => _itens.AsReadOnly();
    private readonly List<ItemEntradaMercadoria> _itens = new();

    private EntradaMercadoria() { }

    public static EntradaMercadoria Criar(
        Guid fornecedorId,
        DateTime dataEntrada,
        Guid criadoPor,
        string? numeroNotaFiscal = null,
        string? observacoes = null)
    {
        return new EntradaMercadoria
        {
            Id = Guid.NewGuid(),
            FornecedorId = fornecedorId,
            NumeroNotaFiscal = numeroNotaFiscal,
            DataEntrada = dataEntrada,
            Observacoes = observacoes,
            Status = StatusEntrada.Confirmada,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor,
            AtualizadoPor = criadoPor
        };
    }

    public void AdicionarItem(Guid ingredienteId, decimal quantidade, decimal custoUnitario)
    {
        if (Status != StatusEntrada.Confirmada)
            throw new DomainException("Não é possível adicionar itens a uma entrada cancelada.");
        if (quantidade <= 0)
            throw new DomainException("Quantidade deve ser maior que zero.");
        if (custoUnitario < 0)
            throw new DomainException("Custo unitário não pode ser negativo.");
        if (_itens.Any(i => i.IngredienteId == ingredienteId))
            throw new DomainException("Ingrediente já adicionado nesta entrada.");

        _itens.Add(ItemEntradaMercadoria.Criar(Id, ingredienteId, quantidade, custoUnitario));
    }

    public void Cancelar(Guid atualizadoPor)
    {
        if (Status == StatusEntrada.Cancelada)
            throw new DomainException("Entrada já está cancelada.");

        Status = StatusEntrada.Cancelada;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }
}
```

`src/CasaDiAna.Domain/Entities/ItemEntradaMercadoria.cs`
```csharp
namespace CasaDiAna.Domain.Entities;

public class ItemEntradaMercadoria
{
    public Guid Id { get; private set; }
    public Guid EntradaId { get; private set; }
    public Guid IngredienteId { get; private set; }
    public decimal Quantidade { get; private set; }
    public decimal CustoUnitario { get; private set; }
    public decimal CustoTotal => Quantidade * CustoUnitario;

    public Ingrediente? Ingrediente { get; private set; }

    private ItemEntradaMercadoria() { }

    internal static ItemEntradaMercadoria Criar(
        Guid entradaId,
        Guid ingredienteId,
        decimal quantidade,
        decimal custoUnitario)
    {
        return new ItemEntradaMercadoria
        {
            Id = Guid.NewGuid(),
            EntradaId = entradaId,
            IngredienteId = ingredienteId,
            Quantidade = quantidade,
            CustoUnitario = custoUnitario
        };
    }
}
```

- [ ] **Passo 7: Entidades de Inventário**

`src/CasaDiAna.Domain/Entities/Inventario.cs`
```csharp
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class Inventario
{
    public Guid Id { get; private set; }
    public DateTime DataRealizacao { get; private set; }
    public string? Descricao { get; private set; }
    public StatusInventario Status { get; private set; }
    public DateTime? FinalizadoEm { get; private set; }
    public string? Observacoes { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    public IReadOnlyCollection<ItemInventario> Itens => _itens.AsReadOnly();
    private readonly List<ItemInventario> _itens = new();

    private Inventario() { }

    public static Inventario Criar(DateTime dataRealizacao, Guid criadoPor, string? descricao = null, string? observacoes = null)
    {
        return new Inventario
        {
            Id = Guid.NewGuid(),
            DataRealizacao = dataRealizacao,
            Descricao = descricao,
            Status = StatusInventario.EmAndamento,
            Observacoes = observacoes,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor,
            AtualizadoPor = criadoPor
        };
    }

    public void AdicionarItem(Guid ingredienteId, decimal quantidadeSistema, decimal quantidadeContada, string? observacoes = null)
    {
        if (Status != StatusInventario.EmAndamento)
            throw new DomainException("Não é possível modificar um inventário já finalizado ou cancelado.");
        if (_itens.Any(i => i.IngredienteId == ingredienteId))
            throw new DomainException("Ingrediente já incluído neste inventário.");

        _itens.Add(ItemInventario.Criar(Id, ingredienteId, quantidadeSistema, quantidadeContada, observacoes));
    }

    public void Finalizar(Guid atualizadoPor)
    {
        if (Status != StatusInventario.EmAndamento)
            throw new DomainException("Apenas inventários em andamento podem ser finalizados.");
        if (!_itens.Any())
            throw new DomainException("Não é possível finalizar um inventário sem itens.");

        Status = StatusInventario.Finalizado;
        FinalizadoEm = DateTime.UtcNow;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public void Cancelar(Guid atualizadoPor)
    {
        if (Status == StatusInventario.Finalizado)
            throw new DomainException("Inventários finalizados não podem ser cancelados.");

        Status = StatusInventario.Cancelado;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }
}
```

`src/CasaDiAna.Domain/Entities/ItemInventario.cs`
```csharp
namespace CasaDiAna.Domain.Entities;

public class ItemInventario
{
    public Guid Id { get; private set; }
    public Guid InventarioId { get; private set; }
    public Guid IngredienteId { get; private set; }
    public decimal QuantidadeSistema { get; private set; }
    public decimal QuantidadeContada { get; private set; }
    public decimal Diferenca => QuantidadeContada - QuantidadeSistema;
    public string? Observacoes { get; private set; }

    public Ingrediente? Ingrediente { get; private set; }

    private ItemInventario() { }

    internal static ItemInventario Criar(
        Guid inventarioId,
        Guid ingredienteId,
        decimal quantidadeSistema,
        decimal quantidadeContada,
        string? observacoes = null)
    {
        return new ItemInventario
        {
            Id = Guid.NewGuid(),
            InventarioId = inventarioId,
            IngredienteId = ingredienteId,
            QuantidadeSistema = quantidadeSistema,
            QuantidadeContada = quantidadeContada,
            Observacoes = observacoes
        };
    }
}
```

- [ ] **Passo 8: Entidade Movimentacao**

`src/CasaDiAna.Domain/Entities/Movimentacao.cs`
```csharp
using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Domain.Entities;

public class Movimentacao
{
    public Guid Id { get; private set; }
    public Guid IngredienteId { get; private set; }
    public TipoMovimentacao Tipo { get; private set; }
    public decimal Quantidade { get; private set; }
    public decimal SaldoApos { get; private set; }
    public string? ReferenciaTipo { get; private set; }
    public Guid? ReferenciaId { get; private set; }
    public string? Observacoes { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }

    public Ingrediente? Ingrediente { get; private set; }

    private Movimentacao() { }

    public static Movimentacao Criar(
        Guid ingredienteId,
        TipoMovimentacao tipo,
        decimal quantidade,
        decimal saldoApos,
        Guid criadoPor,
        string? referenciaTipo = null,
        Guid? referenciaId = null,
        string? observacoes = null)
    {
        return new Movimentacao
        {
            Id = Guid.NewGuid(),
            IngredienteId = ingredienteId,
            Tipo = tipo,
            Quantidade = quantidade,
            SaldoApos = saldoApos,
            CriadoPor = criadoPor,
            ReferenciaTipo = referenciaTipo,
            ReferenciaId = referenciaId,
            Observacoes = observacoes,
            CriadoEm = DateTime.UtcNow
        };
    }
}
```

- [ ] **Passo 9: Verificar compilação do Domain**

```bash
dotnet build src/CasaDiAna.Domain
```
Esperado: `Build succeeded. 0 Error(s)`

- [ ] **Passo 10: Commit**

```bash
git init
git add src/CasaDiAna.Domain tests/CasaDiAna.Application.Tests CasaDiAna.sln
git commit -m "feat: adicionar entidades e enums do domínio"
```

---

## Tarefa 5: Interfaces dos Repositórios

**Arquivos:** `src/CasaDiAna.Domain/Interfaces/`

- [ ] **Passo 1: IIngredienteRepository**

`src/CasaDiAna.Domain/Interfaces/IIngredienteRepository.cs`
```csharp
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IIngredienteRepository
{
    Task<Ingrediente?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Ingrediente>> ListarAsync(bool apenasAtivos = true, CancellationToken ct = default);
    Task<bool> CodigoInternoExisteAsync(string codigo, Guid? ignorarId = null, CancellationToken ct = default);
    Task AdicionarAsync(Ingrediente ingrediente, CancellationToken ct = default);
    void Atualizar(Ingrediente ingrediente);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

- [ ] **Passo 2: IFornecedorRepository**

`src/CasaDiAna.Domain/Interfaces/IFornecedorRepository.cs`
```csharp
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IFornecedorRepository
{
    Task<Fornecedor?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Fornecedor>> ListarAsync(bool apenasAtivos = true, CancellationToken ct = default);
    Task<bool> CnpjExisteAsync(string cnpj, Guid? ignorarId = null, CancellationToken ct = default);
    Task AdicionarAsync(Fornecedor fornecedor, CancellationToken ct = default);
    void Atualizar(Fornecedor fornecedor);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

- [ ] **Passo 3: IEntradaMercadoriaRepository**

`src/CasaDiAna.Domain/Interfaces/IEntradaMercadoriaRepository.cs`
```csharp
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IEntradaMercadoriaRepository
{
    Task<EntradaMercadoria?> ObterPorIdComItensAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<EntradaMercadoria>> ListarAsync(DateTime? de = null, DateTime? ate = null, CancellationToken ct = default);
    Task AdicionarAsync(EntradaMercadoria entrada, CancellationToken ct = default);
    void Atualizar(EntradaMercadoria entrada);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

- [ ] **Passo 4: IInventarioRepository**

`src/CasaDiAna.Domain/Interfaces/IInventarioRepository.cs`
```csharp
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IInventarioRepository
{
    Task<Inventario?> ObterPorIdComItensAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Inventario>> ListarAsync(CancellationToken ct = default);
    Task AdicionarAsync(Inventario inventario, CancellationToken ct = default);
    void Atualizar(Inventario inventario);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

- [ ] **Passo 5: IMovimentacaoRepository**

`src/CasaDiAna.Domain/Interfaces/IMovimentacaoRepository.cs`
```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Domain.Interfaces;

public interface IMovimentacaoRepository
{
    Task<IReadOnlyList<Movimentacao>> ListarPorIngredienteAsync(Guid ingredienteId, DateTime? de = null, DateTime? ate = null, CancellationToken ct = default);
    Task<IReadOnlyList<Movimentacao>> ListarAsync(DateTime de, DateTime ate, TipoMovimentacao? tipo = null, CancellationToken ct = default);
    Task AdicionarAsync(Movimentacao movimentacao, CancellationToken ct = default);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

- [ ] **Passo 6: IUsuarioRepository**

`src/CasaDiAna.Domain/Interfaces/IUsuarioRepository.cs`
```csharp
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> ObterPorEmailAsync(string email, CancellationToken ct = default);
    Task<Usuario?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task AdicionarAsync(Usuario usuario, CancellationToken ct = default);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

- [ ] **Passo 7: Verificar compilação e commit**

```bash
dotnet build src/CasaDiAna.Domain
git add src/CasaDiAna.Domain/Interfaces
git commit -m "feat: adicionar interfaces dos repositórios"
```
Esperado: `Build succeeded. 0 Error(s)`

---

## Tarefa 6: Application — ApiResponse, ValidationBehavior e ICurrentUserService

**Arquivos:** `src/CasaDiAna.Application/Common/`

- [ ] **Passo 1: Escrever o teste para ValidationBehavior**

`tests/CasaDiAna.Application.Tests/Common/ValidationBehaviorTests.cs`
```csharp
using CasaDiAna.Application.Common;
using FluentAssertions;
using FluentValidation;
using MediatR;
using Moq;

namespace CasaDiAna.Application.Tests.Common;

public class ValidationBehaviorTests
{
    private record ComandoValido : IRequest<string>;
    private record ComandoInvalido : IRequest<string>;

    private class ValidatorValido : AbstractValidator<ComandoValido>
    {
        public ValidatorValido() { }
    }

    private class ValidatorInvalido : AbstractValidator<ComandoInvalido>
    {
        public ValidatorInvalido()
        {
            RuleFor(x => x).Must(_ => false).WithMessage("Erro de validação.");
        }
    }

    [Fact]
    public async Task DevePassar_QuandoNaoHaValidadores()
    {
        var behavior = new ValidationBehavior<ComandoValido, string>(Enumerable.Empty<IValidator<ComandoValido>>());
        var next = new Mock<RequestHandlerDelegate<string>>();
        next.Setup(n => n()).ReturnsAsync("ok");

        var resultado = await behavior.Handle(new ComandoValido(), next.Object, CancellationToken.None);

        resultado.Should().Be("ok");
    }

    [Fact]
    public async Task DevePassar_QuandoValidacaoOk()
    {
        var validators = new[] { new ValidatorValido() };
        var behavior = new ValidationBehavior<ComandoValido, string>(validators);
        var next = new Mock<RequestHandlerDelegate<string>>();
        next.Setup(n => n()).ReturnsAsync("ok");

        var resultado = await behavior.Handle(new ComandoValido(), next.Object, CancellationToken.None);

        resultado.Should().Be("ok");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoValidacaoFalha()
    {
        var validators = new[] { new ValidatorInvalido() };
        var behavior = new ValidationBehavior<ComandoInvalido, string>(validators);
        var next = new Mock<RequestHandlerDelegate<string>>();

        var acao = () => behavior.Handle(new ComandoInvalido(), next.Object, CancellationToken.None);

        await acao.Should().ThrowAsync<ValidationException>()
            .WithMessage("*Erro de validação*");
    }
}
```

- [ ] **Passo 2: Executar o teste — deve falhar**

```bash
dotnet test tests/CasaDiAna.Application.Tests --filter "ValidationBehaviorTests"
```
Esperado: FAIL — `ValidationBehavior` não existe.

- [ ] **Passo 3: Implementar ApiResponse**

`src/CasaDiAna.Application/Common/ApiResponse.cs`
```csharp
namespace CasaDiAna.Application.Common;

public class ApiResponse<T>
{
    public bool Sucesso { get; private set; }
    public T? Dados { get; private set; }
    public IReadOnlyList<string> Erros { get; private set; } = Array.Empty<string>();

    private ApiResponse() { }

    public static ApiResponse<T> Ok(T dados) =>
        new() { Sucesso = true, Dados = dados };

    public static ApiResponse<T> Erro(params string[] erros) =>
        new() { Sucesso = false, Erros = erros };

    public static ApiResponse<T> Erro(IEnumerable<string> erros) =>
        new() { Sucesso = false, Erros = erros.ToList().AsReadOnly() };
}
```

- [ ] **Passo 4: Implementar ValidationBehavior**

`src/CasaDiAna.Application/Common/ValidationBehavior.cs`
```csharp
using FluentValidation;
using MediatR;

namespace CasaDiAna.Application.Common;

public class ValidationBehavior<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any())
            return await next();

        var context = new ValidationContext<TRequest>(request);
        var failures = _validators
            .Select(v => v.Validate(context))
            .SelectMany(r => r.Errors)
            .Where(f => f is not null)
            .ToList();

        if (failures.Any())
            throw new ValidationException(failures);

        return await next();
    }
}
```

- [ ] **Passo 5: Implementar ICurrentUserService**

`src/CasaDiAna.Application/Common/ICurrentUserService.cs`
```csharp
namespace CasaDiAna.Application.Common;

public interface ICurrentUserService
{
    Guid UsuarioId { get; }
    string Email { get; }
    string Papel { get; }
}
```

- [ ] **Passo 6: Executar os testes — devem passar**

```bash
dotnet test tests/CasaDiAna.Application.Tests --filter "ValidationBehaviorTests"
```
Esperado: `Passed! 3 test(s)`

- [ ] **Passo 7: Commit**

```bash
git add src/CasaDiAna.Application/Common tests/CasaDiAna.Application.Tests/Common
git commit -m "feat: adicionar ApiResponse, ValidationBehavior e ICurrentUserService"
```

---

## Tarefa 7: Application — Login

**Arquivos:** `src/CasaDiAna.Application/Auth/`

- [ ] **Passo 1: Escrever o teste para LoginCommandHandler**

`tests/CasaDiAna.Application.Tests/Auth/LoginCommandHandlerTests.cs`
```csharp
using CasaDiAna.Application.Auth.Commands.Login;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Auth;

public class LoginCommandHandlerTests
{
    private readonly Mock<IUsuarioRepository> _repositorio = new();
    private readonly Mock<IJwtService> _jwtService = new();
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        _handler = new LoginCommandHandler(_repositorio.Object, _jwtService.Object);
    }

    [Fact]
    public async Task DeveRetornarToken_QuandoCredenciaisValidas()
    {
        var senhaHash = BCrypt.Net.BCrypt.HashPassword("senha123");
        var usuario = Usuario.Criar("Ana", "ana@casa.com", senhaHash, PapelUsuario.Admin);
        _repositorio.Setup(r => r.ObterPorEmailAsync("ana@casa.com", default))
                    .ReturnsAsync(usuario);
        _jwtService.Setup(j => j.GerarToken(usuario)).Returns("token-jwt");

        var resultado = await _handler.Handle(
            new LoginCommand("ana@casa.com", "senha123"), CancellationToken.None);

        resultado.Token.Should().Be("token-jwt");
        resultado.Nome.Should().Be("Ana");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUsuarioNaoEncontrado()
    {
        _repositorio.Setup(r => r.ObterPorEmailAsync(It.IsAny<string>(), default))
                    .ReturnsAsync((Usuario?)null);

        var acao = () => _handler.Handle(
            new LoginCommand("x@x.com", "123"), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoSenhaInvalida()
    {
        var senhaHash = BCrypt.Net.BCrypt.HashPassword("correta");
        var usuario = Usuario.Criar("Ana", "ana@casa.com", senhaHash, PapelUsuario.Admin);
        _repositorio.Setup(r => r.ObterPorEmailAsync("ana@casa.com", default))
                    .ReturnsAsync(usuario);

        var acao = () => _handler.Handle(
            new LoginCommand("ana@casa.com", "errada"), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
```

- [ ] **Passo 2: Executar o teste — deve falhar**

```bash
dotnet test tests/CasaDiAna.Application.Tests --filter "LoginCommandHandlerTests"
```
Esperado: FAIL — `LoginCommandHandler` não existe.

- [ ] **Passo 3: Criar IJwtService no Domain**

`src/CasaDiAna.Domain/Interfaces/IJwtService.cs`
```csharp
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IJwtService
{
    string GerarToken(Usuario usuario);
}
```

- [ ] **Passo 4: Criar DTOs e Command**

`src/CasaDiAna.Application/Auth/Dtos/TokenDto.cs`
```csharp
namespace CasaDiAna.Application.Auth.Dtos;

public record TokenDto(string Token, string Nome, string Papel);
```

`src/CasaDiAna.Application/Auth/Commands/Login/LoginCommand.cs`
```csharp
using CasaDiAna.Application.Auth.Dtos;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.Login;

public record LoginCommand(string Email, string Senha) : IRequest<TokenDto>;
```

`src/CasaDiAna.Application/Auth/Commands/Login/LoginCommandValidator.cs`
```csharp
using FluentValidation;

namespace CasaDiAna.Application.Auth.Commands.Login;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-mail é obrigatório.")
            .EmailAddress().WithMessage("E-mail inválido.");

        RuleFor(x => x.Senha)
            .NotEmpty().WithMessage("Senha é obrigatória.");
    }
}
```

`src/CasaDiAna.Application/Auth/Commands/Login/LoginCommandHandler.cs`
```csharp
using CasaDiAna.Application.Auth.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, TokenDto>
{
    private readonly IUsuarioRepository _usuarios;
    private readonly IJwtService _jwtService;

    public LoginCommandHandler(IUsuarioRepository usuarios, IJwtService jwtService)
    {
        _usuarios = usuarios;
        _jwtService = jwtService;
    }

    public async Task<TokenDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorEmailAsync(request.Email, cancellationToken)
            ?? throw new UnauthorizedAccessException("E-mail ou senha inválidos.");

        if (!usuario.SenhaCorreta(request.Senha))
            throw new UnauthorizedAccessException("E-mail ou senha inválidos.");

        var token = _jwtService.GerarToken(usuario);
        return new TokenDto(token, usuario.Nome, usuario.Papel.ToString());
    }
}
```

- [ ] **Passo 5: Adicionar BCrypt ao projeto de testes**

```bash
cd tests/CasaDiAna.Application.Tests
dotnet add package BCrypt.Net-Next --version 4.0.3
cd ../..
```

- [ ] **Passo 6: Executar os testes — devem passar**

```bash
dotnet test tests/CasaDiAna.Application.Tests --filter "LoginCommandHandlerTests"
```
Esperado: `Passed! 3 test(s)`

- [ ] **Passo 7: Commit**

```bash
git add src/CasaDiAna.Application/Auth src/CasaDiAna.Domain/Interfaces/IJwtService.cs \
        tests/CasaDiAna.Application.Tests/Auth
git commit -m "feat: adicionar LoginCommand com handler, validator e testes"
```

---

## Tarefa 8: Infrastructure — AppDbContext e Configurações EF

**Arquivos:** `src/CasaDiAna.Infrastructure/Persistence/`

- [ ] **Passo 1: Criar AppDbContext**

`src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs`
```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<UnidadeMedida> UnidadesMedida => Set<UnidadeMedida>();
    public DbSet<CategoriaIngrediente> CategoriasIngrediente => Set<CategoriaIngrediente>();
    public DbSet<Ingrediente> Ingredientes => Set<Ingrediente>();
    public DbSet<Fornecedor> Fornecedores => Set<Fornecedor>();
    public DbSet<EntradaMercadoria> EntradasMercadoria => Set<EntradaMercadoria>();
    public DbSet<ItemEntradaMercadoria> ItensEntradaMercadoria => Set<ItemEntradaMercadoria>();
    public DbSet<Inventario> Inventarios => Set<Inventario>();
    public DbSet<ItemInventario> ItensInventario => Set<ItemInventario>();
    public DbSet<Movimentacao> Movimentacoes => Set<Movimentacao>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("public");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
```

- [ ] **Passo 2: Configuração de Usuario**

`src/CasaDiAna.Infrastructure/Persistence/Configurations/UsuarioConfiguration.cs`
```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("usuarios", "auth");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Nome).HasMaxLength(150).IsRequired();
        builder.Property(u => u.Email).HasMaxLength(254).IsRequired();
        builder.HasIndex(u => u.Email).IsUnique();
        builder.Property(u => u.SenhaHash).IsRequired();
        builder.Property(u => u.Papel)
            .HasConversion(p => p.ToString(), s => Enum.Parse<PapelUsuario>(s))
            .HasMaxLength(50)
            .IsRequired();
        builder.Property(u => u.Ativo).IsRequired();
        builder.Property(u => u.CriadoEm).IsRequired();
        builder.Property(u => u.AtualizadoEm).IsRequired();
    }
}
```

- [ ] **Passo 3: Configuração de UnidadeMedida**

`src/CasaDiAna.Infrastructure/Persistence/Configurations/UnidadeMedidaConfiguration.cs`
```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class UnidadeMedidaConfiguration : IEntityTypeConfiguration<UnidadeMedida>
{
    public void Configure(EntityTypeBuilder<UnidadeMedida> builder)
    {
        builder.ToTable("unidades_medida", "estoque");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).UseIdentityAlwaysColumn();
        builder.Property(u => u.Codigo).HasMaxLength(10).IsRequired();
        builder.HasIndex(u => u.Codigo).IsUnique();
        builder.Property(u => u.Descricao).HasMaxLength(50).IsRequired();

        builder.HasData(
            new { Id = (short)1, Codigo = "KG",  Descricao = "Quilograma" },
            new { Id = (short)2, Codigo = "G",   Descricao = "Grama"      },
            new { Id = (short)3, Codigo = "L",   Descricao = "Litro"      },
            new { Id = (short)4, Codigo = "ML",  Descricao = "Mililitro"  },
            new { Id = (short)5, Codigo = "UN",  Descricao = "Unidade"    },
            new { Id = (short)6, Codigo = "CX",  Descricao = "Caixa"      },
            new { Id = (short)7, Codigo = "PCT", Descricao = "Pacote"     },
            new { Id = (short)8, Codigo = "DZ",  Descricao = "Dúzia"      }
        );
    }
}
```

- [ ] **Passo 4: Configuração de CategoriaIngrediente**

`src/CasaDiAna.Infrastructure/Persistence/Configurations/CategoriaIngredienteConfiguration.cs`
```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class CategoriaIngredienteConfiguration : IEntityTypeConfiguration<CategoriaIngrediente>
{
    public void Configure(EntityTypeBuilder<CategoriaIngrediente> builder)
    {
        builder.ToTable("categorias_ingrediente", "estoque");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nome).HasMaxLength(100).IsRequired();
        builder.HasIndex(c => c.Nome).IsUnique();
        builder.Property(c => c.Ativo).IsRequired();
        builder.Property(c => c.CriadoEm).IsRequired();
        builder.Property(c => c.AtualizadoEm).IsRequired();
        builder.Property(c => c.CriadoPor).IsRequired();
        builder.Property(c => c.AtualizadoPor).IsRequired();
    }
}
```

- [ ] **Passo 5: Configuração de Ingrediente**

`src/CasaDiAna.Infrastructure/Persistence/Configurations/IngredienteConfiguration.cs`
```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class IngredienteConfiguration : IEntityTypeConfiguration<Ingrediente>
{
    public void Configure(EntityTypeBuilder<Ingrediente> builder)
    {
        builder.ToTable("ingredientes", "estoque");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Nome).HasMaxLength(150).IsRequired();
        builder.Property(i => i.CodigoInterno).HasMaxLength(30);
        builder.HasIndex(i => i.CodigoInterno).IsUnique().HasFilter("codigo_interno IS NOT NULL");
        builder.Property(i => i.UnidadeMedidaId).IsRequired();
        builder.Property(i => i.EstoqueAtual).HasPrecision(15, 4).IsRequired();
        builder.Property(i => i.EstoqueMinimo).HasPrecision(15, 4).IsRequired();
        builder.Property(i => i.EstoqueMaximo).HasPrecision(15, 4);
        builder.Property(i => i.Ativo).IsRequired();
        builder.Property(i => i.CriadoEm).IsRequired();
        builder.Property(i => i.AtualizadoEm).IsRequired();
        builder.Property(i => i.CriadoPor).IsRequired();
        builder.Property(i => i.AtualizadoPor).IsRequired();

        builder.HasOne(i => i.UnidadeMedida)
            .WithMany()
            .HasForeignKey(i => i.UnidadeMedidaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Categoria)
            .WithMany()
            .HasForeignKey(i => i.CategoriaId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasCheckConstraint("chk_estoque_atual_nao_negativo", "estoque_atual >= 0");
        builder.HasCheckConstraint("chk_estoque_minimo_nao_negativo", "estoque_minimo >= 0");

        builder.HasIndex(i => new { i.CategoriaId, i.Nome });
        builder.HasIndex(i => new { i.EstoqueAtual, i.EstoqueMinimo })
            .HasFilter("ativo = TRUE");
    }
}
```

- [ ] **Passo 6: Configuração de Fornecedor**

`src/CasaDiAna.Infrastructure/Persistence/Configurations/FornecedorConfiguration.cs`
```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class FornecedorConfiguration : IEntityTypeConfiguration<Fornecedor>
{
    public void Configure(EntityTypeBuilder<Fornecedor> builder)
    {
        builder.ToTable("fornecedores", "estoque");
        builder.HasKey(f => f.Id);
        builder.Property(f => f.RazaoSocial).HasMaxLength(200).IsRequired();
        builder.Property(f => f.NomeFantasia).HasMaxLength(200);
        builder.Property(f => f.Cnpj).HasMaxLength(14).IsFixedLength();
        builder.HasIndex(f => f.Cnpj).IsUnique().HasFilter("cnpj IS NOT NULL");
        builder.HasCheckConstraint("chk_cnpj_formato", "cnpj IS NULL OR cnpj ~ '^[0-9]{14}$'");
        builder.Property(f => f.Telefone).HasMaxLength(20);
        builder.Property(f => f.Email).HasMaxLength(254);
        builder.Property(f => f.ContatoNome).HasMaxLength(150);
        builder.Property(f => f.Ativo).IsRequired();
        builder.Property(f => f.CriadoEm).IsRequired();
        builder.Property(f => f.AtualizadoEm).IsRequired();
        builder.Property(f => f.CriadoPor).IsRequired();
        builder.Property(f => f.AtualizadoPor).IsRequired();

        builder.HasIndex(f => f.RazaoSocial);
        builder.HasIndex(f => f.Ativo);
    }
}
```

- [ ] **Passo 7: Configurações de EntradaMercadoria e Inventário**

`src/CasaDiAna.Infrastructure/Persistence/Configurations/EntradaMercadoriaConfiguration.cs`
```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class EntradaMercadoriaConfiguration : IEntityTypeConfiguration<EntradaMercadoria>
{
    public void Configure(EntityTypeBuilder<EntradaMercadoria> builder)
    {
        builder.ToTable("entradas_mercadoria", "estoque");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.FornecedorId).IsRequired();
        builder.Property(e => e.NumeroNotaFiscal).HasMaxLength(60);
        builder.Property(e => e.DataEntrada).IsRequired();
        builder.Property(e => e.Status)
            .HasConversion(s => s.ToString(), s => Enum.Parse<StatusEntrada>(s))
            .HasMaxLength(20)
            .IsRequired();
        builder.Property(e => e.CriadoEm).IsRequired();
        builder.Property(e => e.AtualizadoEm).IsRequired();
        builder.Property(e => e.CriadoPor).IsRequired();
        builder.Property(e => e.AtualizadoPor).IsRequired();

        builder.HasOne(e => e.Fornecedor)
            .WithMany()
            .HasForeignKey(e => e.FornecedorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Itens)
            .WithOne()
            .HasForeignKey(i => i.EntradaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(e => e.Itens).UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasIndex(e => e.FornecedorId);
        builder.HasIndex(e => e.DataEntrada);
        builder.HasIndex(e => e.NumeroNotaFiscal).HasFilter("numero_nota_fiscal IS NOT NULL");
    }
}
```

`src/CasaDiAna.Infrastructure/Persistence/Configurations/ItemEntradaMercadoriaConfiguration.cs`
```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class ItemEntradaMercadoriaConfiguration : IEntityTypeConfiguration<ItemEntradaMercadoria>
{
    public void Configure(EntityTypeBuilder<ItemEntradaMercadoria> builder)
    {
        builder.ToTable("itens_entrada_mercadoria", "estoque");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.EntradaId).IsRequired();
        builder.Property(i => i.IngredienteId).IsRequired();
        builder.Property(i => i.Quantidade).HasPrecision(15, 4).IsRequired();
        builder.Property(i => i.CustoUnitario).HasPrecision(15, 4).IsRequired();
        builder.Ignore(i => i.CustoTotal); // calculado no C#; no banco é coluna gerada

        builder.HasCheckConstraint("chk_item_quantidade_positiva", "quantidade > 0");
        builder.HasCheckConstraint("chk_item_custo_nao_negativo", "custo_unitario >= 0");
        builder.HasIndex(i => new { i.EntradaId, i.IngredienteId }).IsUnique();
        builder.HasIndex(i => i.IngredienteId);
    }
}
```

`src/CasaDiAna.Infrastructure/Persistence/Configurations/InventarioConfiguration.cs`
```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class InventarioConfiguration : IEntityTypeConfiguration<Inventario>
{
    public void Configure(EntityTypeBuilder<Inventario> builder)
    {
        builder.ToTable("inventarios", "estoque");
        builder.HasKey(inv => inv.Id);
        builder.Property(inv => inv.DataRealizacao).IsRequired();
        builder.Property(inv => inv.Descricao).HasMaxLength(200);
        builder.Property(inv => inv.Status)
            .HasConversion(s => s.ToString(), s => Enum.Parse<StatusInventario>(s))
            .HasMaxLength(20)
            .IsRequired();
        builder.Property(inv => inv.CriadoEm).IsRequired();
        builder.Property(inv => inv.AtualizadoEm).IsRequired();
        builder.Property(inv => inv.CriadoPor).IsRequired();
        builder.Property(inv => inv.AtualizadoPor).IsRequired();

        builder.HasMany(inv => inv.Itens)
            .WithOne()
            .HasForeignKey(i => i.InventarioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(inv => inv.Itens).UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasIndex(inv => inv.DataRealizacao);
        builder.HasIndex(inv => inv.Status);
    }
}
```

`src/CasaDiAna.Infrastructure/Persistence/Configurations/ItemInventarioConfiguration.cs`
```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class ItemInventarioConfiguration : IEntityTypeConfiguration<ItemInventario>
{
    public void Configure(EntityTypeBuilder<ItemInventario> builder)
    {
        builder.ToTable("itens_inventario", "estoque");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.InventarioId).IsRequired();
        builder.Property(i => i.IngredienteId).IsRequired();
        builder.Property(i => i.QuantidadeSistema).HasPrecision(15, 4).IsRequired();
        builder.Property(i => i.QuantidadeContada).HasPrecision(15, 4).IsRequired();
        builder.Ignore(i => i.Diferenca); // calculado no C#

        builder.HasCheckConstraint("chk_qtd_contada_nao_negativa", "quantidade_contada >= 0");
        builder.HasCheckConstraint("chk_qtd_sistema_nao_negativa", "quantidade_sistema >= 0");
        builder.HasIndex(i => new { i.InventarioId, i.IngredienteId }).IsUnique();
        builder.HasIndex(i => i.IngredienteId);
    }
}
```

- [ ] **Passo 8: Configuração de Movimentacao**

`src/CasaDiAna.Infrastructure/Persistence/Configurations/MovimentacaoConfiguration.cs`
```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class MovimentacaoConfiguration : IEntityTypeConfiguration<Movimentacao>
{
    public void Configure(EntityTypeBuilder<Movimentacao> builder)
    {
        builder.ToTable("movimentacoes", "estoque");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.IngredienteId).IsRequired();
        builder.Property(m => m.Tipo)
            .HasConversion(t => t.ToString(), s => Enum.Parse<TipoMovimentacao>(s))
            .HasMaxLength(30)
            .IsRequired();
        builder.Property(m => m.Quantidade).HasPrecision(15, 4).IsRequired();
        builder.Property(m => m.SaldoApos).HasPrecision(15, 4).IsRequired();
        builder.Property(m => m.ReferenciaTipo).HasMaxLength(50);
        builder.Property(m => m.CriadoEm).IsRequired();
        builder.Property(m => m.CriadoPor).IsRequired();

        builder.HasCheckConstraint("chk_mov_quantidade_positiva", "quantidade > 0");
        builder.HasCheckConstraint("chk_mov_saldo_nao_negativo", "saldo_apos >= 0");

        builder.HasIndex(m => m.IngredienteId);
        builder.HasIndex(m => m.CriadoEm);
        builder.HasIndex(m => m.Tipo);
        builder.HasIndex(m => new { m.ReferenciaTipo, m.ReferenciaId })
            .HasFilter("referencia_id IS NOT NULL");
    }
}
```

- [ ] **Passo 9: Verificar compilação**

```bash
dotnet build src/CasaDiAna.Infrastructure
```
Esperado: `Build succeeded. 0 Error(s)`

- [ ] **Passo 10: Commit**

```bash
git add src/CasaDiAna.Infrastructure/Persistence
git commit -m "feat: adicionar AppDbContext e configurações EF Core (Fluent API)"
```

---

## Tarefa 9: Infrastructure — Repositórios e Serviços

**Arquivos:** `src/CasaDiAna.Infrastructure/Repositories/` e `Services/`

- [ ] **Passo 1: Repositório de Usuário**

`src/CasaDiAna.Infrastructure/Repositories/UsuarioRepository.cs`
```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly AppDbContext _db;

    public UsuarioRepository(AppDbContext db) => _db = db;

    public Task<Usuario?> ObterPorEmailAsync(string email, CancellationToken ct = default) =>
        _db.Usuarios.FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant() && u.Ativo, ct);

    public Task<Usuario?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Usuarios.FirstOrDefaultAsync(u => u.Id == id && u.Ativo, ct);

    public async Task AdicionarAsync(Usuario usuario, CancellationToken ct = default) =>
        await _db.Usuarios.AddAsync(usuario, ct);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
```

- [ ] **Passo 2: Repositório de Ingrediente**

`src/CasaDiAna.Infrastructure/Repositories/IngredienteRepository.cs`
```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class IngredienteRepository : IIngredienteRepository
{
    private readonly AppDbContext _db;

    public IngredienteRepository(AppDbContext db) => _db = db;

    public Task<Ingrediente?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Ingredientes
            .Include(i => i.UnidadeMedida)
            .Include(i => i.Categoria)
            .FirstOrDefaultAsync(i => i.Id == id, ct);

    public async Task<IReadOnlyList<Ingrediente>> ListarAsync(bool apenasAtivos = true, CancellationToken ct = default)
    {
        var query = _db.Ingredientes
            .Include(i => i.UnidadeMedida)
            .Include(i => i.Categoria)
            .AsQueryable();

        if (apenasAtivos)
            query = query.Where(i => i.Ativo);

        return await query.OrderBy(i => i.Nome).ToListAsync(ct);
    }

    public Task<bool> CodigoInternoExisteAsync(string codigo, Guid? ignorarId = null, CancellationToken ct = default) =>
        _db.Ingredientes.AnyAsync(i =>
            i.CodigoInterno == codigo && (ignorarId == null || i.Id != ignorarId), ct);

    public async Task AdicionarAsync(Ingrediente ingrediente, CancellationToken ct = default) =>
        await _db.Ingredientes.AddAsync(ingrediente, ct);

    public void Atualizar(Ingrediente ingrediente) =>
        _db.Ingredientes.Update(ingrediente);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
```

- [ ] **Passo 3: Repositório de Fornecedor**

`src/CasaDiAna.Infrastructure/Repositories/FornecedorRepository.cs`
```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class FornecedorRepository : IFornecedorRepository
{
    private readonly AppDbContext _db;

    public FornecedorRepository(AppDbContext db) => _db = db;

    public Task<Fornecedor?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Fornecedores.FirstOrDefaultAsync(f => f.Id == id, ct);

    public async Task<IReadOnlyList<Fornecedor>> ListarAsync(bool apenasAtivos = true, CancellationToken ct = default)
    {
        var query = _db.Fornecedores.AsQueryable();
        if (apenasAtivos) query = query.Where(f => f.Ativo);
        return await query.OrderBy(f => f.RazaoSocial).ToListAsync(ct);
    }

    public Task<bool> CnpjExisteAsync(string cnpj, Guid? ignorarId = null, CancellationToken ct = default) =>
        _db.Fornecedores.AnyAsync(f =>
            f.Cnpj == cnpj && (ignorarId == null || f.Id != ignorarId), ct);

    public async Task AdicionarAsync(Fornecedor fornecedor, CancellationToken ct = default) =>
        await _db.Fornecedores.AddAsync(fornecedor, ct);

    public void Atualizar(Fornecedor fornecedor) =>
        _db.Fornecedores.Update(fornecedor);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
```

- [ ] **Passo 4: JwtService**

`src/CasaDiAna.Infrastructure/Services/JwtService.cs`
```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace CasaDiAna.Infrastructure.Services;

public class JwtService : IJwtService
{
    private readonly string _chave;
    private readonly string _emissor;
    private readonly int _expiracaoMinutos;

    public JwtService(IConfiguration config)
    {
        _chave = config["Jwt:Chave"] ?? throw new InvalidOperationException("Jwt:Chave não configurada.");
        _emissor = config["Jwt:Emissor"] ?? "CasaDiAna";
        _expiracaoMinutos = int.Parse(config["Jwt:ExpiracaoMinutos"] ?? "60");
    }

    public string GerarToken(Usuario usuario)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
            new Claim(ClaimTypes.Role, usuario.Papel.ToString()),
            new Claim(ClaimTypes.Name, usuario.Nome),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var chave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_chave));
        var credenciais = new SigningCredentials(chave, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _emissor,
            audience: _emissor,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_expiracaoMinutos),
            signingCredentials: credenciais);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

- [ ] **Passo 5: CurrentUserService**

`src/CasaDiAna.Infrastructure/Services/CurrentUserService.cs`
```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CasaDiAna.Application.Common;
using Microsoft.AspNetCore.Http;

namespace CasaDiAna.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    public Guid UsuarioId { get; }
    public string Email { get; }
    public string Papel { get; }

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        var user = httpContextAccessor.HttpContext?.User
            ?? throw new InvalidOperationException("Contexto HTTP não disponível.");

        var sub = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? throw new InvalidOperationException("Claim 'sub' ausente no token.");

        UsuarioId = Guid.Parse(sub);
        Email = user.FindFirstValue(JwtRegisteredClaimNames.Email) ?? string.Empty;
        Papel = user.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
    }
}
```

- [ ] **Passo 6: DependencyInjection**

`src/CasaDiAna.Infrastructure/DependencyInjection.cs`
```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using CasaDiAna.Infrastructure.Repositories;
using CasaDiAna.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CasaDiAna.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("Default"),
                npgsql => npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<IIngredienteRepository, IngredienteRepository>();
        services.AddScoped<IFornecedorRepository, FornecedorRepository>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddHttpContextAccessor();

        return services;
    }
}
```

- [ ] **Passo 7: Verificar compilação**

```bash
dotnet build src/CasaDiAna.Infrastructure
```
Esperado: `Build succeeded. 0 Error(s)`

- [ ] **Passo 8: Commit**

```bash
git add src/CasaDiAna.Infrastructure
git commit -m "feat: adicionar repositórios, JwtService, CurrentUserService e DI"
```

---

## Tarefa 10: Migração Inicial

**Pré-requisito:** PostgreSQL rodando em `localhost:5432` com banco `casadiana`.

- [ ] **Passo 1: Instalar ferramenta EF Core CLI (se não instalada)**

```bash
dotnet tool install --global dotnet-ef
```
Verificar: `dotnet ef --version` → deve exibir `8.x.x`

- [ ] **Passo 2: Configurar appsettings antes da migração**

`src/CasaDiAna.API/appsettings.Development.json`
```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=casadiana;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Chave": "chave-secreta-dev-minimo-32-caracteres-aqui",
    "Emissor": "CasaDiAna",
    "ExpiracaoMinutos": "60"
  }
}
```

- [ ] **Passo 3: Gerar migração inicial**

```bash
dotnet ef migrations add CriacaoInicial \
  --project src/CasaDiAna.Infrastructure \
  --startup-project src/CasaDiAna.API \
  --output-dir Persistence/Migrations
```
Esperado: `Done. To undo this action, use 'ef migrations remove'`

- [ ] **Passo 4: Revisar a migração gerada**

Abrir `src/CasaDiAna.Infrastructure/Persistence/Migrations/XXXXXX_CriacaoInicial.cs` e verificar:
- Schema `auth` e `estoque` são criados
- Todas as tabelas estão presentes
- Seed data de `unidades_medida` está incluído

- [ ] **Passo 5: Aplicar migração ao banco**

```bash
dotnet ef database update \
  --project src/CasaDiAna.Infrastructure \
  --startup-project src/CasaDiAna.API
```
Esperado: `Done.`

- [ ] **Passo 6: Verificar no banco**

```bash
psql -h localhost -U postgres -d casadiana -c "\dt estoque.*"
```
Esperado: listar as 9 tabelas do schema `estoque`.

```bash
psql -h localhost -U postgres -d casadiana -c "SELECT * FROM estoque.unidades_medida;"
```
Esperado: 8 linhas com as unidades de medida.

- [ ] **Passo 7: Commit**

```bash
git add src/CasaDiAna.Infrastructure/Persistence/Migrations
git commit -m "feat: adicionar migração inicial — schemas auth e estoque"
```

---

## Tarefa 11: API — Program.cs, Middleware e AuthController

**Arquivos:** `src/CasaDiAna.API/`

- [ ] **Passo 1: appsettings.json de produção**

`src/CasaDiAna.API/appsettings.json`
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "Default": ""
  },
  "Jwt": {
    "Chave": "",
    "Emissor": "CasaDiAna",
    "ExpiracaoMinutos": "60"
  }
}
```

- [ ] **Passo 2: ExceptionHandlingMiddleware**

`src/CasaDiAna.API/Middleware/ExceptionHandlingMiddleware.cs`
```csharp
using System.Text.Json;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using FluentValidation;

namespace CasaDiAna.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";
            var erros = ex.Errors.Select(e => e.ErrorMessage);
            var resposta = ApiResponse<object>.Erro(erros);
            await context.Response.WriteAsync(JsonSerializer.Serialize(resposta));
        }
        catch (DomainException ex)
        {
            context.Response.StatusCode = StatusCodes.Status422UnprocessableEntity;
            context.Response.ContentType = "application/json";
            var resposta = ApiResponse<object>.Erro(ex.Message);
            await context.Response.WriteAsync(JsonSerializer.Serialize(resposta));
        }
        catch (UnauthorizedAccessException)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            var resposta = ApiResponse<object>.Erro("Credenciais inválidas.");
            await context.Response.WriteAsync(JsonSerializer.Serialize(resposta));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro não tratado.");
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            var resposta = ApiResponse<object>.Erro("Erro interno do servidor.");
            await context.Response.WriteAsync(JsonSerializer.Serialize(resposta));
        }
    }
}
```

- [ ] **Passo 3: Program.cs**

`src/CasaDiAna.API/Program.cs`
```csharp
using System.Text;
using CasaDiAna.API.Middleware;
using CasaDiAna.Application.Common;
using CasaDiAna.Infrastructure;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Infraestrutura (EF, repositórios, JWT service)
builder.Services.AddInfrastructure(builder.Configuration);

// MediatR — registra todos os handlers da Application
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(ValidationBehavior<,>).Assembly));

// Pipeline de validação
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

// FluentValidation — registra todos os validators da Application
builder.Services.AddValidatorsFromAssembly(typeof(ValidationBehavior<,>).Assembly);

// JWT
var jwtChave = builder.Configuration["Jwt:Chave"]
    ?? throw new InvalidOperationException("Jwt:Chave não configurada.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Emissor"],
            ValidAudience = builder.Configuration["Jwt:Emissor"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtChave))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();

// Swagger com suporte a JWT
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Casa di Ana – API",
        Version = "v1",
        Description = "Sistema de Gestão Operacional"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Informe o token JWT: Bearer {token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// CORS — ajustar origens conforme necessário
builder.Services.AddCors(opt =>
    opt.AddDefaultPolicy(p =>
        p.WithOrigins("http://localhost:5173") // Vite dev server
         .AllowAnyHeader()
         .AllowAnyMethod()));

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Casa di Ana v1"));
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

- [ ] **Passo 4: AuthController**

`src/CasaDiAna.API/Controllers/AuthController.cs`
```csharp
using CasaDiAna.Application.Auth.Commands.Login;
using CasaDiAna.Application.Auth.Dtos;
using CasaDiAna.Application.Common;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator) => _mediator = mediator;

    /// <summary>Realiza login e retorna o token JWT.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<TokenDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    [ProducesResponseType(typeof(ApiResponse<object>), 401)]
    public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken ct)
    {
        var token = await _mediator.Send(command, ct);
        return Ok(ApiResponse<TokenDto>.Ok(token));
    }
}
```

- [ ] **Passo 5: Compilar a solução completa**

```bash
dotnet build
```
Esperado: `Build succeeded. 0 Error(s)`

- [ ] **Passo 6: Executar todos os testes**

```bash
dotnet test
```
Esperado: `Passed! 6 test(s)` (3 ValidationBehavior + 3 Login)

- [ ] **Passo 7: Iniciar a API e verificar Swagger**

```bash
cd src/CasaDiAna.API
dotnet run
```
Abrir `http://localhost:5000/swagger` no navegador.
Esperado: Swagger UI com endpoint `POST /api/auth/login` visível.

- [ ] **Passo 8: Testar login manualmente via Swagger**

1. Inserir um usuário de teste diretamente no banco:
```sql
INSERT INTO auth.usuarios (id, nome, email, senha_hash, papel, ativo, criado_em, atualizado_em)
VALUES (
    gen_random_uuid(),
    'Administrador',
    'admin@casadiana.com',
    '$2a$11$examplehashAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    'Admin',
    true,
    NOW(),
    NOW()
);
```
> **Nota:** Gere o hash real com BCrypt antes de inserir:
```csharp
BCrypt.Net.BCrypt.HashPassword("Admin@123")
```

2. Chamar `POST /api/auth/login` com `{ "email": "admin@casadiana.com", "senha": "Admin@123" }`

Esperado: `{ "sucesso": true, "dados": { "token": "eyJ...", "nome": "Administrador", "papel": "Admin" } }`

- [ ] **Passo 9: Commit final**

```bash
git add src/CasaDiAna.API
git commit -m "feat: adicionar Program.cs, ExceptionHandlingMiddleware e AuthController"
```

---

## Resultado deste plano

Ao completar todas as tarefas, você terá:

- Solução .NET 8 com 4 projetos compilando sem erros
- Todas as entidades do módulo de estoque definidas no Domain
- Banco PostgreSQL com schemas `auth` e `estoque` criados via migração
- API rodando com Swagger acessível
- Endpoint `POST /api/auth/login` funcional retornando JWT
- 6 testes passando

**Próximo plano:** `2026-03-25-plano-02-ingredientes-fornecedores.md`
