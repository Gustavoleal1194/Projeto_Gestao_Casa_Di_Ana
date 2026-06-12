# Categorias de Despesa gerenciáveis (CRUD) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar a categoria de despesa (enum fixo) em cadastro gerenciável (CRUD) com tipo Fixa/Variável e flag de folha, sem perder dados e mantendo fechamento/precificação corretos.

**Architecture:** Nova entidade `CategoriaDespesa` (espelha `CategoriaProduto` + `Tipo` + `EhFolhaPagamento`). `Despesa` troca os enums `Categoria`/`Tipo` por FK `CategoriaDespesaId`; o tipo da despesa vem da categoria. Migration cria a tabela, semeia as 15 categorias atuais com GUIDs fixos e faz backfill antes de dropar as colunas antigas.

**Tech Stack:** ASP.NET Core 8, EF Core (Npgsql), MediatR, FluentValidation, xUnit+Moq+FluentAssertions; React 18 + TS + Tailwind.

**Spec:** `docs/superpowers/specs/2026-06-12-categorias-despesa-design.md`

**Padrão de referência (espelhar):** módulo `CategoriasProduto` (`Application/CategoriasProduto/**`, `CategoriasProdutoController`, `ICategoriaProdutoRepository`, `CategoriaProdutoRepository`, `CategoriaProdutoConfiguration`) e o frontend `features/producao/categorias-produto/**`.

> **Ordem de compilação:** Tasks 1–3 compilam sozinhas. Tasks 4–7 (rework de `Despesa`) só compilam juntas — buildar/testar só ao fim da Task 7. A migration (Task 7) é gerada e **substituída à mão**.

---

## GUIDs fixos das categorias semeadas (usar idênticos no seed e nos testes/backfill)

| enum int antigo | GUID | Nome | Tipo | Folha |
|---|---|---|---|---|
| 1 | `00000000-0000-0000-0000-000000000001` | Aluguel | Fixa | não |
| 2 | `00000000-0000-0000-0000-000000000002` | Folha de pagamento | Fixa | **sim** |
| 3 | `00000000-0000-0000-0000-000000000003` | Água | Fixa | não |
| 4 | `00000000-0000-0000-0000-000000000004` | Energia | Fixa | não |
| 5 | `00000000-0000-0000-0000-000000000005` | Gás | Fixa | não |
| 6 | `00000000-0000-0000-0000-000000000006` | Internet | Fixa | não |
| 7 | `00000000-0000-0000-0000-000000000007` | Contabilidade | Fixa | não |
| 8 | `00000000-0000-0000-0000-000000000008` | Manutenção | Fixa | não |
| 9 | `00000000-0000-0000-0000-000000000009` | Sistema | Fixa | não |
| 10 | `00000000-0000-0000-0000-000000000010` | Marketing | Fixa | não |
| 11 | `00000000-0000-0000-0000-000000000011` | Outros | Fixa | não |
| 12 | `00000000-0000-0000-0000-000000000012` | Taxa de cartão | Variável | não |
| 13 | `00000000-0000-0000-0000-000000000013` | Comissão delivery | Variável | não |
| 14 | `00000000-0000-0000-0000-000000000014` | Embalagens | Variável | não |
| 15 | `00000000-0000-0000-0000-000000000015` | Frete | Variável | não |

(Tipo: Fixa=1, Variavel=2.)

---

## TASK 1 — Entidade `CategoriaDespesa` (TDD)

**Files:**
- Create: `src/CasaDiAna.Domain/Entities/CategoriaDespesa.cs`
- Test: `tests/CasaDiAna.Application.Tests/CategoriasDespesa/CategoriaDespesaTests.cs`

- [ ] **Step 1: Teste que falha**

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.CategoriasDespesa;

public class CategoriaDespesaTests
{
    [Fact]
    public void Criar_DeveDefinirCampos()
    {
        var c = CategoriaDespesa.Criar("Taxa de cartão", TipoDespesa.Variavel, false, Guid.NewGuid());
        c.Nome.Should().Be("Taxa de cartão");
        c.Tipo.Should().Be(TipoDespesa.Variavel);
        c.EhFolhaPagamento.Should().BeFalse();
        c.Ativo.Should().BeTrue();
    }

    [Fact]
    public void Atualizar_EDesativar_DeveFuncionar()
    {
        var c = CategoriaDespesa.Criar("Folha", TipoDespesa.Fixa, true, Guid.NewGuid());
        c.Atualizar("Folha de pagamento", TipoDespesa.Fixa, true, Guid.NewGuid());
        c.Nome.Should().Be("Folha de pagamento");
        c.EhFolhaPagamento.Should().BeTrue();
        c.Desativar(Guid.NewGuid());
        c.Ativo.Should().BeFalse();
    }
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter CategoriaDespesaTests`
Expected: FAIL — tipo não existe.

- [ ] **Step 3: Entidade**

```csharp
using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Domain.Entities;

public class CategoriaDespesa
{
    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public TipoDespesa Tipo { get; private set; }
    public bool EhFolhaPagamento { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    private CategoriaDespesa() { }

    public static CategoriaDespesa Criar(string nome, TipoDespesa tipo, bool ehFolhaPagamento, Guid criadoPor) => new()
    {
        Id = Guid.NewGuid(),
        Nome = nome.Trim(),
        Tipo = tipo,
        EhFolhaPagamento = ehFolhaPagamento,
        Ativo = true,
        CriadoEm = DateTime.UtcNow,
        AtualizadoEm = DateTime.UtcNow,
        CriadoPor = criadoPor,
        AtualizadoPor = criadoPor
    };

    public void Atualizar(string nome, TipoDespesa tipo, bool ehFolhaPagamento, Guid atualizadoPor)
    {
        Nome = nome.Trim();
        Tipo = tipo;
        EhFolhaPagamento = ehFolhaPagamento;
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

- [ ] **Step 4: Rodar e ver passar** — `dotnet test ... --filter CategoriaDespesaTests` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/CasaDiAna.Domain/Entities/CategoriaDespesa.cs tests/CasaDiAna.Application.Tests/CategoriasDespesa/CategoriaDespesaTests.cs
git commit -m "feat(financeiro): entidade CategoriaDespesa (categoria gerenciavel)"
```

---

## TASK 2 — Infra de `CategoriaDespesa` (repo, config, DbSet, DI)

**Files:**
- Create: `Domain/Interfaces/ICategoriaDespesaRepository.cs`
- Create: `Infrastructure/Repositories/CategoriaDespesaRepository.cs`
- Create: `Infrastructure/Persistence/Configurations/CategoriaDespesaConfiguration.cs`
- Modify: `Infrastructure/Persistence/AppDbContext.cs`, `Infrastructure/DependencyInjection.cs`

- [ ] **Step 1: Interface** (espelha `ICategoriaProdutoRepository`)

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Domain.Interfaces;

public interface ICategoriaDespesaRepository
{
    Task<CategoriaDespesa?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<CategoriaDespesa>> ListarAsync(TipoDespesa? tipo = null, bool apenasAtivas = true, CancellationToken ct = default);
    Task<bool> NomeExisteAsync(string nome, Guid? ignorarId = null, CancellationToken ct = default);
    Task AdicionarAsync(CategoriaDespesa categoria, CancellationToken ct = default);
    void Atualizar(CategoriaDespesa categoria);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

- [ ] **Step 2: Repositório**

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class CategoriaDespesaRepository : ICategoriaDespesaRepository
{
    private readonly AppDbContext _db;

    public CategoriaDespesaRepository(AppDbContext db) => _db = db;

    public Task<CategoriaDespesa?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.CategoriasDespesa.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<IReadOnlyList<CategoriaDespesa>> ListarAsync(
        TipoDespesa? tipo = null, bool apenasAtivas = true, CancellationToken ct = default)
    {
        var query = _db.CategoriasDespesa.AsQueryable();
        if (apenasAtivas) query = query.Where(c => c.Ativo);
        if (tipo.HasValue) query = query.Where(c => c.Tipo == tipo.Value);
        return await query.OrderBy(c => c.Tipo).ThenBy(c => c.Nome).ToListAsync(ct);
    }

    public Task<bool> NomeExisteAsync(string nome, Guid? ignorarId = null, CancellationToken ct = default) =>
        _db.CategoriasDespesa.AnyAsync(c =>
            c.Ativo && c.Nome == nome && (ignorarId == null || c.Id != ignorarId), ct);

    public async Task AdicionarAsync(CategoriaDespesa categoria, CancellationToken ct = default) =>
        await _db.CategoriasDespesa.AddAsync(categoria, ct);

    public void Atualizar(CategoriaDespesa categoria) => _db.CategoriasDespesa.Update(categoria);

    public Task<int> SalvarAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
```

- [ ] **Step 3: EF Configuration**

```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class CategoriaDespesaConfiguration : IEntityTypeConfiguration<CategoriaDespesa>
{
    public void Configure(EntityTypeBuilder<CategoriaDespesa> builder)
    {
        builder.ToTable("categorias_despesa", "financeiro");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.Nome).HasColumnName("nome").HasMaxLength(100).IsRequired();
        builder.Property(c => c.Tipo).HasColumnName("tipo").HasConversion<int>().IsRequired();
        builder.Property(c => c.EhFolhaPagamento).HasColumnName("eh_folha_pagamento").IsRequired();
        builder.Property(c => c.Ativo).HasColumnName("ativo").IsRequired();
        builder.Property(c => c.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(c => c.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(c => c.CriadoPor).HasColumnName("criado_por").IsRequired();
        builder.Property(c => c.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();

        builder.HasIndex(c => c.Nome).HasDatabaseName("ix_categorias_despesa_nome");
    }
}
```

- [ ] **Step 4: `AppDbContext`** — adicionar DbSet:
```csharp
    public DbSet<CategoriaDespesa> CategoriasDespesa => Set<CategoriaDespesa>();
```

- [ ] **Step 5: `DependencyInjection`** — registrar após `IDespesaRepository`:
```csharp
        services.AddScoped<ICategoriaDespesaRepository, CategoriaDespesaRepository>();
```

- [ ] **Step 6: Build** — `dotnet build src/CasaDiAna.API` → succeeded.

---

## TASK 3 — CRUD de `CategoriaDespesa` (Application + Controller) (TDD)

**Files (`Application/CategoriasDespesa/...`, espelha `CategoriasProduto`):**
- `Dtos/CategoriaDespesaDto.cs`
- `Commands/CriarCategoriaDespesa/*`, `Commands/AtualizarCategoriaDespesa/*`, `Commands/DesativarCategoriaDespesa/*`
- `Queries/ListarCategoriasDespesa/*`
- Create: `src/CasaDiAna.API/Controllers/CategoriasDespesaController.cs`
- Test: `tests/CasaDiAna.Application.Tests/CategoriasDespesa/CategoriaDespesaHandlersTests.cs`

- [ ] **Step 1: DTO**

```csharp
using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Application.CategoriasDespesa.Dtos;

public record CategoriaDespesaDto(Guid Id, string Nome, TipoDespesa Tipo, bool EhFolhaPagamento, bool Ativo);
```

- [ ] **Step 2: `CriarCategoriaDespesa`**

`CriarCategoriaDespesaCommand.cs`:
```csharp
using CasaDiAna.Application.CategoriasDespesa.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.CategoriasDespesa.Commands.CriarCategoriaDespesa;

public record CriarCategoriaDespesaCommand(string Nome, TipoDespesa Tipo, bool EhFolhaPagamento)
    : IRequest<CategoriaDespesaDto>;
```

`CriarCategoriaDespesaCommandValidator.cs`:
```csharp
using FluentValidation;

namespace CasaDiAna.Application.CategoriasDespesa.Commands.CriarCategoriaDespesa;

public class CriarCategoriaDespesaCommandValidator : AbstractValidator<CriarCategoriaDespesaCommand>
{
    public CriarCategoriaDespesaCommandValidator()
    {
        RuleFor(x => x.Nome).NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(100).WithMessage("Nome deve ter no máximo 100 caracteres.");
        RuleFor(x => x.Tipo).IsInEnum().WithMessage("Tipo inválido.");
    }
}
```

`CriarCategoriaDespesaCommandHandler.cs`:
```csharp
using CasaDiAna.Application.CategoriasDespesa.Dtos;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasDespesa.Commands.CriarCategoriaDespesa;

public class CriarCategoriaDespesaCommandHandler : IRequestHandler<CriarCategoriaDespesaCommand, CategoriaDespesaDto>
{
    private readonly ICategoriaDespesaRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public CriarCategoriaDespesaCommandHandler(ICategoriaDespesaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<CategoriaDespesaDto> Handle(CriarCategoriaDespesaCommand request, CancellationToken cancellationToken)
    {
        if (await _repo.NomeExisteAsync(request.Nome.Trim(), ct: cancellationToken))
            throw new DomainException($"Já existe uma categoria com o nome '{request.Nome.Trim()}'.");

        var categoria = CategoriaDespesa.Criar(request.Nome, request.Tipo, request.EhFolhaPagamento, _currentUser.UsuarioId);
        await _repo.AdicionarAsync(categoria, cancellationToken);
        await _repo.SalvarAsync(cancellationToken);
        return ToDto(categoria);
    }

    internal static CategoriaDespesaDto ToDto(CategoriaDespesa c) =>
        new(c.Id, c.Nome, c.Tipo, c.EhFolhaPagamento, c.Ativo);
}
```

- [ ] **Step 3: `AtualizarCategoriaDespesa`**

`AtualizarCategoriaDespesaCommand.cs`:
```csharp
using CasaDiAna.Application.CategoriasDespesa.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.CategoriasDespesa.Commands.AtualizarCategoriaDespesa;

public record AtualizarCategoriaDespesaCommand(Guid Id, string Nome, TipoDespesa Tipo, bool EhFolhaPagamento)
    : IRequest<CategoriaDespesaDto>;
```

`AtualizarCategoriaDespesaCommandValidator.cs`:
```csharp
using FluentValidation;

namespace CasaDiAna.Application.CategoriasDespesa.Commands.AtualizarCategoriaDespesa;

public class AtualizarCategoriaDespesaCommandValidator : AbstractValidator<AtualizarCategoriaDespesaCommand>
{
    public AtualizarCategoriaDespesaCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Nome).NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(100).WithMessage("Nome deve ter no máximo 100 caracteres.");
        RuleFor(x => x.Tipo).IsInEnum().WithMessage("Tipo inválido.");
    }
}
```

`AtualizarCategoriaDespesaCommandHandler.cs`:
```csharp
using CasaDiAna.Application.CategoriasDespesa.Commands.CriarCategoriaDespesa;
using CasaDiAna.Application.CategoriasDespesa.Dtos;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasDespesa.Commands.AtualizarCategoriaDespesa;

public class AtualizarCategoriaDespesaCommandHandler : IRequestHandler<AtualizarCategoriaDespesaCommand, CategoriaDespesaDto>
{
    private readonly ICategoriaDespesaRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public AtualizarCategoriaDespesaCommandHandler(ICategoriaDespesaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<CategoriaDespesaDto> Handle(AtualizarCategoriaDespesaCommand request, CancellationToken cancellationToken)
    {
        var categoria = await _repo.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Categoria não encontrada.");

        if (await _repo.NomeExisteAsync(request.Nome.Trim(), request.Id, cancellationToken))
            throw new DomainException($"Já existe uma categoria com o nome '{request.Nome.Trim()}'.");

        categoria.Atualizar(request.Nome, request.Tipo, request.EhFolhaPagamento, _currentUser.UsuarioId);
        _repo.Atualizar(categoria);
        await _repo.SalvarAsync(cancellationToken);
        return CriarCategoriaDespesaCommandHandler.ToDto(categoria);
    }
}
```

- [ ] **Step 4: `DesativarCategoriaDespesa`**

`DesativarCategoriaDespesaCommand.cs`:
```csharp
using MediatR;

namespace CasaDiAna.Application.CategoriasDespesa.Commands.DesativarCategoriaDespesa;

public record DesativarCategoriaDespesaCommand(Guid Id) : IRequest;
```

`DesativarCategoriaDespesaCommandHandler.cs`:
```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasDespesa.Commands.DesativarCategoriaDespesa;

public class DesativarCategoriaDespesaCommandHandler : IRequestHandler<DesativarCategoriaDespesaCommand>
{
    private readonly ICategoriaDespesaRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public DesativarCategoriaDespesaCommandHandler(ICategoriaDespesaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task Handle(DesativarCategoriaDespesaCommand request, CancellationToken cancellationToken)
    {
        var categoria = await _repo.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Categoria não encontrada.");
        categoria.Desativar(_currentUser.UsuarioId);
        _repo.Atualizar(categoria);
        await _repo.SalvarAsync(cancellationToken);
    }
}
```

- [ ] **Step 5: Query `ListarCategoriasDespesa`**

`ListarCategoriasDespesaQuery.cs`:
```csharp
using CasaDiAna.Application.CategoriasDespesa.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.CategoriasDespesa.Queries.ListarCategoriasDespesa;

public record ListarCategoriasDespesaQuery(TipoDespesa? Tipo, bool ApenasAtivas = true)
    : IRequest<IReadOnlyList<CategoriaDespesaDto>>;
```

`ListarCategoriasDespesaQueryHandler.cs`:
```csharp
using CasaDiAna.Application.CategoriasDespesa.Commands.CriarCategoriaDespesa;
using CasaDiAna.Application.CategoriasDespesa.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasDespesa.Queries.ListarCategoriasDespesa;

public class ListarCategoriasDespesaQueryHandler
    : IRequestHandler<ListarCategoriasDespesaQuery, IReadOnlyList<CategoriaDespesaDto>>
{
    private readonly ICategoriaDespesaRepository _repo;

    public ListarCategoriasDespesaQueryHandler(ICategoriaDespesaRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<CategoriaDespesaDto>> Handle(
        ListarCategoriasDespesaQuery request, CancellationToken cancellationToken)
    {
        var lista = await _repo.ListarAsync(request.Tipo, request.ApenasAtivas, cancellationToken);
        return lista.Select(CriarCategoriaDespesaCommandHandler.ToDto).ToList();
    }
}
```

- [ ] **Step 6: Controller**

```csharp
using CasaDiAna.Application.CategoriasDespesa.Commands.AtualizarCategoriaDespesa;
using CasaDiAna.Application.CategoriasDespesa.Commands.CriarCategoriaDespesa;
using CasaDiAna.Application.CategoriasDespesa.Commands.DesativarCategoriaDespesa;
using CasaDiAna.Application.CategoriasDespesa.Dtos;
using CasaDiAna.Application.CategoriasDespesa.Queries.ListarCategoriasDespesa;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/categorias-despesa")]
[Authorize(Roles = "Admin,Coordenador")]
public class CategoriasDespesaController : ControllerBase
{
    private readonly IMediator _mediator;

    public CategoriasDespesaController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<CategoriaDespesaDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] TipoDespesa? tipo, [FromQuery] bool apenasAtivas = true, CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarCategoriasDespesaQuery(tipo, apenasAtivas), ct);
        return Ok(ApiResponse<IReadOnlyList<CategoriaDespesaDto>>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CategoriaDespesaDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Criar([FromBody] CriarCategoriaDespesaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<CategoriaDespesaDto>.Ok(resultado));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<CategoriaDespesaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] AtualizarCategoriaDespesaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command with { Id = id }, ct);
        return Ok(ApiResponse<CategoriaDespesaDto>.Ok(resultado));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Desativar(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DesativarCategoriaDespesaCommand(id), ct);
        return NoContent();
    }
}
```

- [ ] **Step 7: Teste dos handlers**

```csharp
using CasaDiAna.Application.CategoriasDespesa.Commands.CriarCategoriaDespesa;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Application.Common;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.CategoriasDespesa;

public class CategoriaDespesaHandlersTests
{
    private readonly Mock<ICategoriaDespesaRepository> _repo = new();
    private readonly Mock<ICurrentUserService> _user = new();

    public CategoriaDespesaHandlersTests()
    {
        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _repo.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
    }

    [Fact]
    public async Task Criar_DevePersistir_QuandoNomeNaoExiste()
    {
        _repo.Setup(r => r.NomeExisteAsync("Frete", null, default)).ReturnsAsync(false);
        _repo.Setup(r => r.AdicionarAsync(It.IsAny<CategoriaDespesa>(), default)).Returns(Task.CompletedTask);
        var handler = new CriarCategoriaDespesaCommandHandler(_repo.Object, _user.Object);

        var dto = await handler.Handle(new CriarCategoriaDespesaCommand("Frete", TipoDespesa.Variavel, false), CancellationToken.None);

        dto.Nome.Should().Be("Frete");
        dto.Tipo.Should().Be(TipoDespesa.Variavel);
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<CategoriaDespesa>(), default), Times.Once);
    }

    [Fact]
    public async Task Criar_DeveLancar_QuandoNomeDuplicado()
    {
        _repo.Setup(r => r.NomeExisteAsync("Aluguel", null, default)).ReturnsAsync(true);
        var handler = new CriarCategoriaDespesaCommandHandler(_repo.Object, _user.Object);

        var acao = () => handler.Handle(new CriarCategoriaDespesaCommand("Aluguel", TipoDespesa.Fixa, false), CancellationToken.None);
        await acao.Should().ThrowAsync<DomainException>().WithMessage("*já existe*");
    }
}
```

- [ ] **Step 8: Build + testes** — `dotnet build src/CasaDiAna.API`; `dotnet test tests/CasaDiAna.Application.Tests --filter CategoriasDespesa` → PASS.

- [ ] **Step 9: Commit**

```bash
git add src/CasaDiAna.Domain/Interfaces/ICategoriaDespesaRepository.cs src/CasaDiAna.Infrastructure src/CasaDiAna.Application/CategoriasDespesa src/CasaDiAna.API/Controllers/CategoriasDespesaController.cs tests/CasaDiAna.Application.Tests/CategoriasDespesa
git commit -m "feat(financeiro): CRUD de CategoriaDespesa (entidade gerenciavel + controller)"
```

---

## TASK 4 — `Despesa`: FK em vez de enums (rework)

> A partir daqui o código só compila ao fim da Task 6. Build/test só na Task 7.

**Files:**
- Modify: `src/CasaDiAna.Domain/Entities/Despesa.cs`
- Modify: `Infrastructure/Persistence/Configurations/DespesaConfiguration.cs`
- Modify: `Infrastructure/Repositories/DespesaRepository.cs`
- Delete: `src/CasaDiAna.Domain/Enums/CategoriaDespesa.cs` (substituído pela entidade)

- [ ] **Step 1: Entidade `Despesa`** (substituir conteúdo)

```csharp
using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class Despesa
{
    public Guid Id { get; private set; }
    public DateTime Competencia { get; private set; }
    public Guid CategoriaDespesaId { get; private set; }
    public string? Descricao { get; private set; }
    public decimal Valor { get; private set; }
    public string? Observacao { get; private set; }
    public DateTime DataLancamento { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    public CategoriaDespesa? Categoria { get; private set; }

    private Despesa() { }

    public static DateTime NormalizarCompetencia(DateTime data) =>
        new(data.Year, data.Month, 1, 0, 0, 0, DateTimeKind.Utc);

    public static Despesa Criar(
        DateTime competencia, Guid categoriaDespesaId,
        string? descricao, decimal valor, string? observacao, DateTime dataLancamento, Guid criadoPor)
    {
        if (valor <= 0)
            throw new DomainException("Valor da despesa deve ser maior que zero.");

        return new Despesa
        {
            Id = Guid.NewGuid(),
            Competencia = NormalizarCompetencia(competencia),
            CategoriaDespesaId = categoriaDespesaId,
            Descricao = string.IsNullOrWhiteSpace(descricao) ? null : descricao.Trim(),
            Valor = valor,
            Observacao = string.IsNullOrWhiteSpace(observacao) ? null : observacao.Trim(),
            DataLancamento = dataLancamento,
            Ativo = true,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor,
            AtualizadoPor = criadoPor
        };
    }

    public void Atualizar(
        DateTime competencia, Guid categoriaDespesaId,
        string? descricao, decimal valor, string? observacao, DateTime dataLancamento, Guid atualizadoPor)
    {
        if (valor <= 0)
            throw new DomainException("Valor da despesa deve ser maior que zero.");

        Competencia = NormalizarCompetencia(competencia);
        CategoriaDespesaId = categoriaDespesaId;
        Descricao = string.IsNullOrWhiteSpace(descricao) ? null : descricao.Trim();
        Valor = valor;
        Observacao = string.IsNullOrWhiteSpace(observacao) ? null : observacao.Trim();
        DataLancamento = dataLancamento;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public void Cancelar(Guid atualizadoPor)
    {
        Ativo = false;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }
}
```

- [ ] **Step 2: `DespesaConfiguration`** — trocar as props `Tipo`/`Categoria` por FK:

Remova as linhas de `Tipo` e `Categoria` (enum) e adicione:
```csharp
        builder.Property(d => d.CategoriaDespesaId).HasColumnName("categoria_despesa_id").IsRequired();
        builder.HasOne(d => d.Categoria)
            .WithMany()
            .HasForeignKey(d => d.CategoriaDespesaId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(d => d.CategoriaDespesaId).HasDatabaseName("ix_despesas_categoria_despesa_id");
```
(Mantém todas as outras colunas: competencia, descricao, valor, observacao, data_lancamento, ativo, auditoria, e o índice `ix_despesas_competencia`.)

- [ ] **Step 3: `DespesaRepository.ListarPorCompetenciaAsync`** — incluir a categoria:
```csharp
        return await _db.Despesas
            .Include(d => d.Categoria)
            .Where(d => d.Ativo && d.Competencia == comp)
            .OrderBy(d => d.DataLancamento)
            .ToListAsync(ct);
```
E em `ObterPorIdAsync`, incluir também: `.Include(d => d.Categoria).FirstOrDefaultAsync(...)`.

- [ ] **Step 4: Deletar** `src/CasaDiAna.Domain/Enums/CategoriaDespesa.cs`.

---

## TASK 5 — `Despesas` Application: usar `CategoriaDespesaId`

**Files (`Application/Despesas/...`):**
- Modify: `Dtos/DespesaDto.cs`, `Dtos/TotalCategoriaDto.cs`, `Dtos/DespesasMesDto.cs`
- Modify: `Commands/CriarDespesa/*`, `Commands/AtualizarDespesa/*`
- Modify: `Queries/ListarDespesas/ListarDespesasQueryHandler.cs`

- [ ] **Step 1: DTOs**

`TotalCategoriaDto.cs`:
```csharp
namespace CasaDiAna.Application.Despesas.Dtos;

public record TotalCategoriaDto(Guid CategoriaId, string CategoriaNome, decimal Total);
```

`DespesaDto.cs`:
```csharp
using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Application.Despesas.Dtos;

public record DespesaDto(
    Guid Id, DateTime Competencia, Guid CategoriaDespesaId, string CategoriaNome, TipoDespesa Tipo,
    string? Descricao, decimal Valor, string? Observacao, DateTime DataLancamento, bool Ativo);
```

`DespesasMesDto.cs` — inalterado (já tem TotalFixas/TotalVariaveis/Itens/TotalPorCategoria).

- [ ] **Step 2: `CriarDespesa`**

`CriarDespesaCommand.cs`:
```csharp
using CasaDiAna.Application.Despesas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.CriarDespesa;

public record CriarDespesaCommand(
    DateTime Competencia, Guid CategoriaDespesaId,
    string? Descricao, decimal Valor, string? Observacao, DateTime DataLancamento) : IRequest<DespesaDto>;
```

`CriarDespesaCommandValidator.cs` — trocar as regras de `Tipo`/`Categoria` por:
```csharp
        RuleFor(x => x.CategoriaDespesaId).NotEmpty().WithMessage("Categoria é obrigatória.");
```
(mantém competência/valor/dataLancamento/descricao/observacao.)

`CriarDespesaCommandHandler.cs`:
```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.CriarDespesa;

public class CriarDespesaCommandHandler : IRequestHandler<CriarDespesaCommand, DespesaDto>
{
    private readonly IDespesaRepository _repo;
    private readonly ICategoriaDespesaRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public CriarDespesaCommandHandler(
        IDespesaRepository repo, ICategoriaDespesaRepository categorias, ICurrentUserService currentUser)
    {
        _repo = repo;
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task<DespesaDto> Handle(CriarDespesaCommand request, CancellationToken cancellationToken)
    {
        var categoria = await _categorias.ObterPorIdAsync(request.CategoriaDespesaId, cancellationToken)
            ?? throw new DomainException("Categoria não encontrada.");
        if (!categoria.Ativo)
            throw new DomainException("Categoria está inativa.");

        var despesa = Despesa.Criar(
            request.Competencia, request.CategoriaDespesaId, request.Descricao,
            request.Valor, request.Observacao, request.DataLancamento, _currentUser.UsuarioId);

        await _repo.AdicionarAsync(despesa, cancellationToken);
        await _repo.SalvarAsync(cancellationToken);
        return ToDto(despesa, categoria);
    }

    internal static DespesaDto ToDto(Despesa d, CategoriaDespesa categoria) =>
        new(d.Id, d.Competencia, d.CategoriaDespesaId, categoria.Nome, categoria.Tipo,
            d.Descricao, d.Valor, d.Observacao, d.DataLancamento, d.Ativo);
}
```

- [ ] **Step 3: `AtualizarDespesa`**

`AtualizarDespesaCommand.cs`:
```csharp
using CasaDiAna.Application.Despesas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.AtualizarDespesa;

public record AtualizarDespesaCommand(
    Guid Id, DateTime Competencia, Guid CategoriaDespesaId,
    string? Descricao, decimal Valor, string? Observacao, DateTime DataLancamento) : IRequest<DespesaDto>;
```

`AtualizarDespesaCommandValidator.cs` — trocar `Tipo`/`Categoria` por `RuleFor(x => x.CategoriaDespesaId).NotEmpty()...` (mantém Id/competência/valor/data).

`AtualizarDespesaCommandHandler.cs`:
```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Despesas.Commands.CriarDespesa;
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.AtualizarDespesa;

public class AtualizarDespesaCommandHandler : IRequestHandler<AtualizarDespesaCommand, DespesaDto>
{
    private readonly IDespesaRepository _repo;
    private readonly ICategoriaDespesaRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public AtualizarDespesaCommandHandler(
        IDespesaRepository repo, ICategoriaDespesaRepository categorias, ICurrentUserService currentUser)
    {
        _repo = repo;
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task<DespesaDto> Handle(AtualizarDespesaCommand request, CancellationToken cancellationToken)
    {
        var despesa = await _repo.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Despesa não encontrada.");
        var categoria = await _categorias.ObterPorIdAsync(request.CategoriaDespesaId, cancellationToken)
            ?? throw new DomainException("Categoria não encontrada.");
        if (!categoria.Ativo)
            throw new DomainException("Categoria está inativa.");

        despesa.Atualizar(request.Competencia, request.CategoriaDespesaId, request.Descricao,
            request.Valor, request.Observacao, request.DataLancamento, _currentUser.UsuarioId);
        _repo.Atualizar(despesa);
        await _repo.SalvarAsync(cancellationToken);
        return CriarDespesaCommandHandler.ToDto(despesa, categoria);
    }
}
```

(`CancelarDespesa` — inalterado.)

- [ ] **Step 4: `ListarDespesasQueryHandler`** (agrupa por categoria via navegação)

```csharp
using CasaDiAna.Application.Despesas.Commands.CriarDespesa;
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Despesas.Queries.ListarDespesas;

public class ListarDespesasQueryHandler : IRequestHandler<ListarDespesasQuery, DespesasMesDto>
{
    private readonly IDespesaRepository _repo;

    public ListarDespesasQueryHandler(IDespesaRepository repo) => _repo = repo;

    public async Task<DespesasMesDto> Handle(ListarDespesasQuery request, CancellationToken cancellationToken)
    {
        var competencia = Despesa.NormalizarCompetencia(request.Competencia);
        var todas = await _repo.ListarPorCompetenciaAsync(competencia, cancellationToken);

        var totalFixas = todas.Where(d => d.Categoria!.Tipo == TipoDespesa.Fixa).Sum(d => d.Valor);
        var totalVariaveis = todas.Where(d => d.Categoria!.Tipo == TipoDespesa.Variavel).Sum(d => d.Valor);

        var doTipo = request.Tipo.HasValue
            ? todas.Where(d => d.Categoria!.Tipo == request.Tipo.Value).ToList()
            : todas.ToList();

        var itens = doTipo.Select(d => CriarDespesaCommandHandler.ToDto(d, d.Categoria!)).ToList();
        var porCategoria = doTipo
            .GroupBy(d => new { d.CategoriaDespesaId, d.Categoria!.Nome })
            .Select(g => new TotalCategoriaDto(g.Key.CategoriaDespesaId, g.Key.Nome, g.Sum(d => d.Valor)))
            .OrderBy(c => c.CategoriaNome)
            .ToList();

        return new DespesasMesDto(competencia, totalFixas, totalVariaveis, itens, porCategoria);
    }
}
```

(`ListarDespesasQuery` — inalterado: `(Competencia, Tipo?)`.)

---

## TASK 6 — Fechamento: folha via flag, fixa/variável via categoria

**Files:**
- Modify: `Application/FechamentoMensal/Queries/ObterFechamentoMensal/ObterFechamentoMensalQueryHandler.cs`
- (DTO `FechamentoMensalDto` inalterado — `TotalCategoriaDto` mudou de forma, mas o tipo é o mesmo nome/namespace `Despesas.Dtos`.)

- [ ] **Step 1: Handler** — trocar os blocos de despesas por (mantendo o resto igual):

```csharp
        var despesas = await _despesas.ListarPorCompetenciaAsync(competencia, cancellationToken);
        var totalFixas = despesas.Where(d => d.Categoria!.Tipo == TipoDespesa.Fixa).Sum(d => d.Valor);
        var totalVariaveis = despesas.Where(d => d.Categoria!.Tipo == TipoDespesa.Variavel).Sum(d => d.Valor);
        var folha = despesas.Where(d => d.Categoria!.EhFolhaPagamento).Sum(d => d.Valor);
        var porCategoria = despesas
            .GroupBy(d => new { d.CategoriaDespesaId, d.Categoria!.Nome })
            .Select(g => new TotalCategoriaDto(g.Key.CategoriaDespesaId, g.Key.Nome, g.Sum(d => d.Valor)))
            .OrderBy(c => c.CategoriaNome)
            .ToList();
```
(`ListarPorCompetenciaAsync` já faz `Include(Categoria)`. O `using CasaDiAna.Domain.Enums;` já existe. O restante do handler — vendas, compras, faturamento, `despesaFixaPercentual = totalFixas/faturamento`, `margemOperacional = faturamento − custo − totalFixas − totalVariaveis`, `primeCost = custoDireto + folha`, `totalSaidas` — permanece igual.)

- [ ] **Step 2: Atualizar os testes que usam o enum antigo `CategoriaDespesa` / `Despesa.Criar` com tipo**

Os testes de fechamento, listar despesas e análise de precificação criam `Despesa` via `Despesa.Criar(comp, TipoDespesa.X, CategoriaDespesa.Y, ...)`. Atualize-os para o novo modelo: criar uma `CategoriaDespesa` (com `Tipo` e `EhFolhaPagamento`) e passar `categoria.Id`, **anexando a navegação** para os handlers que leem `d.Categoria`. Como os testes constroem `Despesa` em memória e a navegação `Categoria` é `private set`, use um helper de teste que cria a despesa e seta a categoria via reflection **ou** prefira testar o `ListarDespesasQueryHandler`/fechamento com um `IDespesaRepository` mockado que retorna despesas já com `Categoria` carregada.

Helper sugerido (em `tests/.../Despesas/DespesaTestFactory.cs`):
```csharp
using System.Reflection;
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Application.Tests.Despesas;

public static class DespesaTestFactory
{
    public static Despesa ComCategoria(DateTime competencia, CategoriaDespesa categoria, decimal valor)
    {
        var d = Despesa.Criar(competencia, categoria.Id, null, valor, null, competencia, Guid.NewGuid());
        typeof(Despesa).GetProperty("Categoria")!.SetValue(d, categoria);
        return d;
    }
}
```
Use `DespesaTestFactory.ComCategoria(...)` nos testes de `ListarDespesas`, fechamento e precificação. Ex. fechamento:
```csharp
var catFixaFolha = CategoriaDespesa.Criar("Folha", TipoDespesa.Fixa, true, Guid.NewGuid());
var catFixa = CategoriaDespesa.Criar("Aluguel", TipoDespesa.Fixa, false, Guid.NewGuid());
var catVar = CategoriaDespesa.Criar("Taxa", TipoDespesa.Variavel, false, Guid.NewGuid());
_despesas.Setup(r => r.ListarPorCompetenciaAsync(_comp, default)).ReturnsAsync(new List<Despesa>
{
    DespesaTestFactory.ComCategoria(_comp, catFixa, 200m),
    DespesaTestFactory.ComCategoria(_comp, catFixaFolha, 300m),
    DespesaTestFactory.ComCategoria(_comp, catVar, 100m),
});
```
Asserts iguais aos atuais (fixas 500, variáveis 100, folha 300, primeCost 300, despesaFixaPercentual 0.5, margemOperacional 400). Atualize também `ListarDespesasQueryHandlerTests` e o teste de precificação (que monta o `FechamentoMensalDto`) para usar o novo `TotalCategoriaDto(Guid, string, decimal)` onde aplicável.

---

## TASK 7 — Migration (criar+seed+backfill+drop) + build + commit backend

- [ ] **Step 1: Gerar a migration**

Run: `dotnet ef migrations add AddCategoriasDespesa --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API`
(ou via `& "$env:USERPROFILE\.dotnet\tools\dotnet-ef.exe" ...`).

- [ ] **Step 2: SUBSTITUIR o corpo da migration** (preserva dados; ordem importa)

Abra o `*_AddCategoriasDespesa.cs` e troque `Up`/`Down`:

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.CreateTable(
        name: "categorias_despesa", schema: "financeiro",
        columns: table => new
        {
            id = table.Column<Guid>(type: "uuid", nullable: false),
            nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
            tipo = table.Column<int>(type: "integer", nullable: false),
            eh_folha_pagamento = table.Column<bool>(type: "boolean", nullable: false),
            ativo = table.Column<bool>(type: "boolean", nullable: false),
            criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
            atualizado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
            criado_por = table.Column<Guid>(type: "uuid", nullable: false),
            atualizado_por = table.Column<Guid>(type: "uuid", nullable: false),
        },
        constraints: table => table.PrimaryKey("PK_categorias_despesa", x => x.id));

    migrationBuilder.CreateIndex(
        name: "ix_categorias_despesa_nome", schema: "financeiro",
        table: "categorias_despesa", column: "nome");

    // Seed das 15 categorias (GUIDs fixos = mapa do enum antigo)
    migrationBuilder.Sql(@"
INSERT INTO financeiro.categorias_despesa (id, nome, tipo, eh_folha_pagamento, ativo, criado_em, atualizado_em, criado_por, atualizado_por) VALUES
('00000000-0000-0000-0000-000000000001','Aluguel',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000002','Folha de pagamento',1,true,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000003','Água',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000004','Energia',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000005','Gás',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000006','Internet',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000007','Contabilidade',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000008','Manutenção',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000009','Sistema',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000010','Marketing',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000011','Outros',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000012','Taxa de cartão',2,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000013','Comissão delivery',2,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000014','Embalagens',2,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000015','Frete',2,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000');");

    // coluna FK (nullable durante o backfill)
    migrationBuilder.AddColumn<Guid>(
        name: "categoria_despesa_id", schema: "financeiro", table: "despesas",
        type: "uuid", nullable: true);

    // backfill enum int -> guid semeado
    migrationBuilder.Sql(@"
UPDATE financeiro.despesas SET categoria_despesa_id =
  ('00000000-0000-0000-0000-0000000000' || lpad(categoria::text, 2, '0'))::uuid;");

    // torna NOT NULL, indexa e cria FK
    migrationBuilder.AlterColumn<Guid>(
        name: "categoria_despesa_id", schema: "financeiro", table: "despesas",
        type: "uuid", nullable: false, oldClrType: typeof(Guid), oldType: "uuid", oldNullable: true);

    migrationBuilder.CreateIndex(
        name: "ix_despesas_categoria_despesa_id", schema: "financeiro",
        table: "despesas", column: "categoria_despesa_id");

    migrationBuilder.AddForeignKey(
        name: "FK_despesas_categorias_despesa_categoria_despesa_id",
        schema: "financeiro", table: "despesas", column: "categoria_despesa_id",
        principalSchema: "financeiro", principalTable: "categorias_despesa", principalColumn: "id",
        onDelete: ReferentialAction.Restrict);

    // remove colunas antigas
    migrationBuilder.DropColumn(name: "categoria", schema: "financeiro", table: "despesas");
    migrationBuilder.DropColumn(name: "tipo", schema: "financeiro", table: "despesas");
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddColumn<int>(name: "categoria", schema: "financeiro", table: "despesas", type: "integer", nullable: false, defaultValue: 11);
    migrationBuilder.AddColumn<int>(name: "tipo", schema: "financeiro", table: "despesas", type: "integer", nullable: false, defaultValue: 1);
    migrationBuilder.Sql(@"
UPDATE financeiro.despesas d SET
  categoria = COALESCE(NULLIF(right(c.id::text, 2), '')::int, 11),
  tipo = c.tipo
FROM financeiro.categorias_despesa c WHERE d.categoria_despesa_id = c.id;");
    migrationBuilder.DropForeignKey(name: "FK_despesas_categorias_despesa_categoria_despesa_id", schema: "financeiro", table: "despesas");
    migrationBuilder.DropIndex(name: "ix_despesas_categoria_despesa_id", schema: "financeiro", table: "despesas");
    migrationBuilder.DropColumn(name: "categoria_despesa_id", schema: "financeiro", table: "despesas");
    migrationBuilder.DropTable(name: "categorias_despesa", schema: "financeiro");
}
```

> Confira no arquivo gerado os nomes exatos de tipos de coluna (ex.: `timestamp with time zone`) conforme as outras migrations do projeto; ajuste se necessário. **Não rodar `database update`** (aplica no Render).

- [ ] **Step 3: Build + suíte completa**

Run: `dotnet build src/CasaDiAna.API` → succeeded.
Run: `dotnet test tests/CasaDiAna.Application.Tests` → todos PASS.

- [ ] **Step 4: Commit backend (Tasks 4–7)**

```bash
git add src/CasaDiAna tests/CasaDiAna.Application.Tests
git commit -m "feat(financeiro): despesa referencia CategoriaDespesa (FK) + migration com seed/backfill"
```

---

## TASK 8 — Frontend: service de categorias + limpeza dos labels estáticos

**Files:**
- Create: `frontend/src/features/financeiro/despesas/services/categoriasDespesaService.ts`
- Modify: `frontend/src/features/financeiro/shared/competencia.ts`
- Modify: `frontend/src/features/financeiro/despesas/services/despesasService.ts`
- Modify: `frontend/src/features/financeiro/fechamento-mensal/services/fechamentoService.ts`

- [ ] **Step 1: `categoriasDespesaService.ts`**

```typescript
import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type { TipoDespesa } from '../../shared/competencia'

export interface CategoriaDespesa {
  id: string
  nome: string
  tipo: TipoDespesa
  ehFolhaPagamento: boolean
  ativo: boolean
}

export interface CategoriaDespesaInput {
  nome: string
  tipo: TipoDespesa
  ehFolhaPagamento: boolean
}

export const categoriasDespesaService = {
  listar: async (tipo?: TipoDespesa, apenasAtivas = true): Promise<CategoriaDespesa[]> => {
    const t = tipo ? `&tipo=${tipo}` : ''
    const resp = await api.get<ApiResponse<CategoriaDespesa[]>>(`/categorias-despesa?apenasAtivas=${apenasAtivas}${t}`)
    return resp.data.dados
  },
  criar: async (input: CategoriaDespesaInput): Promise<CategoriaDespesa> => {
    const resp = await api.post<ApiResponse<CategoriaDespesa>>('/categorias-despesa', input)
    return resp.data.dados
  },
  atualizar: async (id: string, input: CategoriaDespesaInput): Promise<CategoriaDespesa> => {
    const resp = await api.put<ApiResponse<CategoriaDespesa>>(`/categorias-despesa/${id}`, input)
    return resp.data.dados
  },
  desativar: async (id: string): Promise<void> => { await api.delete(`/categorias-despesa/${id}`) },
}
```

- [ ] **Step 2: `competencia.ts`** — remover `CategoriaDespesa` (union), `CATEGORIA_DESPESA_LABELS` e `CATEGORIA_DESPESA_OPCOES` (não há mais categoria estática). Manter `TipoDespesa`, `TIPO_DESPESA_LABELS`, `competenciaInicial`, `mesParaCompetencia`, `formatarBRL`, `formatarPercentual`.

- [ ] **Step 3: `despesasService.ts`** — ajustar tipos:
  - `Despesa`: trocar `categoria: CategoriaDespesa` por `categoriaDespesaId: string; categoriaNome: string; tipo: TipoDespesa`.
  - `TotalCategoria`: `{ categoriaId: string; categoriaNome: string; total: number }`.
  - `DespesaInput`: `{ competencia: string; categoriaDespesaId: string; descricao: string | null; valor: number; observacao: string | null; dataLancamento: string }` (sem tipo/categoria).
  - Remover o import de `CategoriaDespesa` de competencia; importar `TipoDespesa`.

- [ ] **Step 4: `fechamentoService.ts`** — `TotalCategoria` import já vem de `despesasService` (forma nova `{categoriaId, categoriaNome, total}`); nenhum outro ajuste.

- [ ] **Step 5: Type-check** — `npx tsc --noEmit` (erros nos consumidores são corrigidos na Task 9).

---

## TASK 9 — Frontend: gerenciar categorias + dropdown dinâmico

**Files:**
- Create: `frontend/src/features/financeiro/despesas/components/ModalGerenciarCategorias.tsx`
- Modify: `frontend/src/features/financeiro/despesas/components/ModalDespesa.tsx`
- Modify: `frontend/src/features/financeiro/despesas/components/TabelaDespesas.tsx`
- Modify: `frontend/src/features/financeiro/despesas/pages/DespesasPage.tsx`

- [ ] **Step 1: `ModalGerenciarCategorias.tsx`** (lista/CRUD das categorias do tipo)

```tsx
import { useEffect, useState } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { categoriasDespesaService, type CategoriaDespesa } from '../services/categoriasDespesaService'
import { TIPO_DESPESA_LABELS, type TipoDespesa } from '../../shared/competencia'

interface Props { tipo: TipoDespesa; onFechar: () => void; onMudou: () => void }

export function ModalGerenciarCategorias({ tipo, onFechar, onMudou }: Props) {
  const [itens, setItens] = useState<CategoriaDespesa[]>([])
  const [nome, setNome] = useState('')
  const [ehFolha, setEhFolha] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = () => categoriasDespesaService.listar(tipo).then(setItens).catch(() => {})
  useEffect(() => { carregar() }, [tipo])

  const adicionar = async () => {
    if (!nome.trim()) return
    setErro(null)
    try {
      await categoriasDespesaService.criar({ nome: nome.trim(), tipo, ehFolhaPagamento: ehFolha })
      setNome(''); setEhFolha(false); await carregar(); onMudou()
    } catch { setErro('Não foi possível criar (nome duplicado?).') }
  }
  const remover = async (id: string) => { await categoriasDespesaService.desativar(id); await carregar(); onMudou() }

  const inputStyle = { background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onFechar}>
      <div className="w-full max-w-md rounded-xl border p-6 space-y-4" style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }} onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--ada-heading)' }}>
          Categorias — {TIPO_DESPESA_LABELS[tipo]}
        </h2>

        <div className="space-y-2">
          {itens.length === 0 && <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Nenhuma categoria deste tipo.</p>}
          {itens.map(c => (
            <div key={c.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'var(--ada-bg)' }}>
              <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{c.nome}{c.ehFolhaPagamento ? ' · folha' : ''}</span>
              <button type="button" onClick={() => remover(c.id)} title="Remover" className="p-1.5 rounded-lg hover:opacity-80" style={{ color: '#F87171' }}>
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--ada-border)' }}>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nova categoria"
            className="w-full rounded-lg px-3 py-2 text-sm border outline-none" style={inputStyle} />
          {tipo === 'fixa' && (
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ada-body)' }}>
              <input type="checkbox" checked={ehFolha} onChange={e => setEhFolha(e.target.checked)} /> É folha de pagamento (prime cost)
            </label>
          )}
          {erro && <p className="text-sm" style={{ color: 'var(--ada-error-text)' }}>{erro}</p>}
          <button type="button" onClick={adicionar} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ background: 'var(--sb-accent)' }}>
            <PlusIcon className="h-4 w-4" /> Adicionar
          </button>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={onFechar} className="rounded-lg px-4 py-2 text-sm font-medium border" style={inputStyle}>Fechar</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `ModalDespesa.tsx`** — dropdown dinâmico de categoria

```tsx
import { useEffect, useState } from 'react'
import type { Despesa, DespesaInput } from '../services/despesasService'
import { categoriasDespesaService, type CategoriaDespesa } from '../services/categoriasDespesaService'
import { mesParaCompetencia, type TipoDespesa } from '../../shared/competencia'

interface Props {
  mes: string
  tipo: TipoDespesa
  despesa: Despesa | null
  onFechar: () => void
  onSalvar: (input: DespesaInput) => Promise<void>
}

export function ModalDespesa({ mes, tipo, despesa, onFechar, onSalvar }: Props) {
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([])
  const [categoriaId, setCategoriaId] = useState(despesa?.categoriaDespesaId ?? '')
  const [descricao, setDescricao] = useState(despesa?.descricao ?? '')
  const [valor, setValor] = useState(despesa ? String(despesa.valor) : '')
  const [observacao, setObservacao] = useState(despesa?.observacao ?? '')
  const [dataLancamento, setDataLancamento] = useState(
    despesa ? despesa.dataLancamento.split('T')[0] : new Date().toISOString().split('T')[0])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    categoriasDespesaService.listar(tipo).then(cs => {
      setCategorias(cs)
      if (!categoriaId && cs.length > 0) setCategoriaId(cs[0].id)
    }).catch(() => {})
  }, [tipo])

  const submeter = async () => {
    const valorNum = Number(valor.replace(',', '.'))
    if (!categoriaId) { setErro('Selecione uma categoria.'); return }
    if (!Number.isFinite(valorNum) || valorNum <= 0) { setErro('Informe um valor maior que zero.'); return }
    setSalvando(true); setErro(null)
    try {
      await onSalvar({
        competencia: despesa?.competencia ?? mesParaCompetencia(mes),
        categoriaDespesaId: categoriaId,
        descricao: descricao.trim() || null, valor: valorNum,
        observacao: observacao.trim() || null, dataLancamento,
      })
      onFechar()
    } catch { setErro('Erro ao salvar a despesa.') } finally { setSalvando(false) }
  }

  const inputStyle = { background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onFechar}>
      <div className="w-full max-w-md rounded-xl border p-6 space-y-4" style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }} onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--ada-heading)' }}>
          {despesa ? 'Editar despesa' : `Nova despesa ${tipo === 'fixa' ? 'fixa' : 'variável'}`}
        </h2>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Categoria</label>
          {categorias.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Nenhuma categoria — crie uma em "Gerenciar categorias".</p>
          ) : (
            <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={inputStyle}>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Descrição</label>
          <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={inputStyle} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Valor (R$)</label>
            <input type="text" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Data lançamento</label>
            <input type="date" value={dataLancamento} onChange={e => setDataLancamento(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ ...inputStyle, colorScheme: 'dark' }} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Observação</label>
          <input type="text" value={observacao} onChange={e => setObservacao(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={inputStyle} />
        </div>
        {erro && <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'var(--ada-error-bg)', color: 'var(--ada-error-text)' }}>{erro}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onFechar} className="rounded-lg px-4 py-2 text-sm font-medium border" style={inputStyle}>Cancelar</button>
          <button type="button" onClick={submeter} disabled={salvando} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" style={{ background: 'var(--sb-accent)' }}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: `TabelaDespesas.tsx`** — usar `categoriaNome` do DTO. Trocar o import de `CATEGORIA_DESPESA_LABELS`/`formatarBRL` por só `formatarBRL`, e a célula de categoria por `{d.categoriaNome}`.

- [ ] **Step 4: `DespesasPage.tsx`** — botão "Gerenciar categorias" + estado do modal; nome para `ModalDesativar` usa `removendo.descricao ?? removendo.categoriaNome` (remover o uso de `CATEGORIA_DESPESA_LABELS`). Adicionar:
  - import `ModalGerenciarCategorias`;
  - `const [gerenciar, setGerenciar] = useState(false)`;
  - um botão (ao lado de "Nova despesa") `onClick={() => setGerenciar(true)}` com label "Gerenciar categorias";
  - `{gerenciar && <ModalGerenciarCategorias tipo={tipo} onFechar={() => setGerenciar(false)} onMudou={recarregar} />}`.

- [ ] **Step 5: Type-check + lint** — `npx tsc --noEmit` e `npx eslint src/features/financeiro` (limpos).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/financeiro
git commit -m "feat(financeiro): gerenciar categorias de despesa + dropdown dinamico no lancamento"
```

---

## TASK 10 — Verificação final + push + E2E

- [ ] **Step 1: Verificação**

Run (frontend): `npx tsc --noEmit`; `npx eslint src/features/financeiro` → limpos.
Run (CasaDiAna): `dotnet build src/CasaDiAna.API`; `dotnet test tests/CasaDiAna.Application.Tests` → build ok, todos PASS.

- [ ] **Step 2: Commit (se restou algo) + push**

```bash
git push origin master
```

- [ ] **Step 3: E2E no staging (após deploy)** — login seed; com bearer token e competência `2099-03-01`:
1. `GET /api/categorias-despesa?tipo=variavel` → lista (deve conter as semeadas: Taxa de cartão, Comissão delivery, Embalagens, Frete).
2. `POST /api/categorias-despesa {"nome":"Estacionamento","tipo":"variavel","ehFolhaPagamento":false}` → 201; guardar id.
3. `POST /api/categorias-despesa {"nome":"Estacionamento",...}` de novo → 400 (nome duplicado).
4. `POST /api/despesas {"competencia":"2099-03-01","categoriaDespesaId":"<id>","valor":80,...}` → 201; o DTO traz `categoriaNome:"Estacionamento"`, `tipo:"variavel"`.
5. `GET /api/despesas?competencia=2099-03-01` → `totalVariaveis:80`, item com a categoria nova.
6. `GET /api/fechamento-mensal?competencia=2099-03-01` → `totalDespesasVariaveis:80`; `despesaFixaPercentual` só fixas (null aqui).
7. Cleanup: `DELETE /api/despesas/<id>`; `DELETE /api/categorias-despesa/<idCategoria>`.

---

## Self-review (preenchido)

**Cobertura do spec:**
- Entidade `CategoriaDespesa` (Nome, Tipo, EhFolhaPagamento, Ativo) + CRUD → Tasks 1–3. ✓
- `Despesa` FK + tipo derivado da categoria → Tasks 4–5. ✓
- Migration cria tabela, semeia 15, backfill por GUID, dropa colunas antigas → Task 7. ✓
- Fechamento: folha via flag, fixa/variável via categoria, % despesa fixa só fixas (precificação intacta) → Task 6. ✓
- Frontend: gerenciar categorias + dropdown dinâmico + categoriaNome na tabela → Tasks 8–9. ✓
- Remoção do enum `CategoriaDespesa` e dos labels estáticos → Tasks 4, 8. ✓
- Admin+Coordenador → Task 3. ✓

**Consistência de tipos:** `CategoriaDespesaDto`/`DespesaDto`(com `CategoriaNome`+`Tipo`)/`TotalCategoriaDto`(Guid,string,decimal) ↔ TS. `Despesa.Criar(competencia, categoriaDespesaId, ...)` usado igual no handler e nos testes (via `DespesaTestFactory`). `TipoDespesa` permanece (enum) e é usado por categoria + filtros. `ToDto(d, categoria)` centralizado em `CriarDespesaCommandHandler`.

**Pontos de atenção para o executor:**
- A migration é **escrita à mão** (seed + backfill + drop em ordem) — o gerado pelo EF perde dados. Confira os tipos de coluna conforme outras migrations.
- O backfill usa `lpad(categoria::text,2,'0')` → casa com os GUIDs `...0000000000NN`. Os enums antigos eram 1..15; confira que os GUIDs semeados batem.
- Testes de fechamento/listar/precificação que criavam `Despesa` com enums precisam do `DespesaTestFactory.ComCategoria` (seta a navegação `Categoria`).
- `TotalCategoriaDto` mudou de forma — atualizar o frontend (tabela usa `categoriaNome`).
- Deletar `Domain/Enums/CategoriaDespesa.cs` e os labels estáticos em `competencia.ts`.
