# Despesas (Fixas + Variáveis) + Compras das Notas — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o módulo "Despesas Fixas" em "Despesas" com tipo (Fixa/Variável), trazer as compras das notas (read-only, das Entradas) e atualizar o Fechamento — sem alterar a precificação nem o custo direto.

**Architecture:** Renomeia a entidade `DespesaFixa → Despesa` com um campo `Tipo`; enum `CategoriaDespesaFixa → CategoriaDespesa` (+ categorias de variável). Compras vêm das `EntradaMercadoria` confirmadas do mês (read-only). O Fechamento separa fixas/variáveis e soma compras, mantendo `DespesaFixaPercentual` só com fixas (precificação intacta).

**Tech Stack:** ASP.NET Core 8, EF Core (Npgsql), MediatR, FluentValidation, xUnit+Moq+FluentAssertions; React 18 + TS + Tailwind.

**Spec:** `docs/superpowers/specs/2026-06-11-despesas-variaveis-compras-design.md`

---

## Mapa de renomeações (aplicar em todos os usos)

| De | Para |
|---|---|
| enum `CategoriaDespesaFixa` | `CategoriaDespesa` (mesmos valores 1–11 + 12–15) |
| entidade `DespesaFixa` | `Despesa` (+ `Tipo`) |
| `DespesaFixa.NormalizarCompetencia` | `Despesa.NormalizarCompetencia` |
| `IDespesaFixaRepository` / `DespesaFixaRepository` | `IDespesaRepository` / `DespesaRepository` |
| `DbSet DespesasFixas` | `Despesas` |
| `Application/DespesasFixas/**` | `Application/Despesas/**` |
| `DespesaFixaDto` / `DespesasFixasMesDto` | `DespesaDto` / `DespesasMesDto` |
| `CriarDespesaFixaCommand` etc. | `CriarDespesaCommand` etc. |
| `DespesasFixasController` (`api/despesas-fixas`) | `DespesasController` (`api/despesas`) |
| frontend `features/financeiro/despesas-fixas/**` | `features/financeiro/despesas/**` |

`TotalCategoriaDto` permanece, mas seu namespace passa a `CasaDiAna.Application.Despesas.Dtos`
— atualizar os `using` em `FechamentoMensalDto` e nos testes de fechamento/precificação.

---

## TASK 1 — Enums: `TipoDespesa` + renomear/estender `CategoriaDespesa`

**Files:**
- Create: `src/CasaDiAna.Domain/Enums/TipoDespesa.cs`
- Rename+edit: `src/CasaDiAna.Domain/Enums/CategoriaDespesaFixa.cs` → `CategoriaDespesa.cs`

- [ ] **Step 1: Criar `TipoDespesa`**

```csharp
namespace CasaDiAna.Domain.Enums;

public enum TipoDespesa
{
    Fixa = 1,
    Variavel = 2
}
```

- [ ] **Step 2: Renomear o arquivo e o enum de categoria**

Renomeie o arquivo `CategoriaDespesaFixa.cs` para `CategoriaDespesa.cs` e substitua o conteúdo:

```csharp
namespace CasaDiAna.Domain.Enums;

public enum CategoriaDespesa
{
    Aluguel = 1,
    FolhaPagamento = 2,
    Agua = 3,
    Energia = 4,
    Gas = 5,
    Internet = 6,
    Contabilidade = 7,
    Manutencao = 8,
    Sistema = 9,
    Marketing = 10,
    Outros = 11,
    TaxaCartao = 12,
    ComissaoDelivery = 13,
    Embalagens = 14,
    Frete = 15
}
```

- [ ] **Step 3: Atualizar TODAS as referências `CategoriaDespesaFixa` → `CategoriaDespesa`**

Substitua em todo o backend (entidade, DTOs, configs EF, validators, testes). Pontos conhecidos: `DespesaFixa.cs`, `DespesaFixaConfiguration.cs`, `DespesaFixaDto.cs`, `TotalCategoriaDto.cs`, `CriarDespesaFixaCommand.cs`, `ObterFechamentoMensalQueryHandler.cs`, e os testes em `tests/.../DespesasFixas` e `tests/.../FechamentoMensal`. (As tasks seguintes reescrevem esses arquivos; aqui basta garantir que o nome do enum compila.)

- [ ] **Step 4: Build**

Run: `dotnet build src/CasaDiAna.API`
Expected: Build succeeded (após as substituições). Se ainda houver referências antigas, elas serão corrigidas nas Tasks 2–6 — não comite ainda; siga para a Task 2 e comite junto.

---

## TASK 2 — Entidade `Despesa` + infra + migration (rename preservando dados)

**Files:**
- Rename+edit: `src/CasaDiAna.Domain/Entities/DespesaFixa.cs` → `Despesa.cs`
- Rename+edit: `Domain/Interfaces/IDespesaFixaRepository.cs` → `IDespesaRepository.cs`
- Rename+edit: `Infrastructure/Repositories/DespesaFixaRepository.cs` → `DespesaRepository.cs`
- Rename+edit: `Infrastructure/Persistence/Configurations/DespesaFixaConfiguration.cs` → `DespesaConfiguration.cs`
- Modify: `Infrastructure/Persistence/AppDbContext.cs`, `Infrastructure/DependencyInjection.cs`
- Modify: `Domain/Entities/FaturamentoMensal.cs` (chamada a `NormalizarCompetencia`)

- [ ] **Step 1: Entidade `Despesa` (renomeia `DespesaFixa.cs` → `Despesa.cs`)**

```csharp
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class Despesa
{
    public Guid Id { get; private set; }
    public DateTime Competencia { get; private set; }
    public TipoDespesa Tipo { get; private set; }
    public CategoriaDespesa Categoria { get; private set; }
    public string? Descricao { get; private set; }
    public decimal Valor { get; private set; }
    public string? Observacao { get; private set; }
    public DateTime DataLancamento { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    private Despesa() { }

    public static DateTime NormalizarCompetencia(DateTime data) =>
        new(data.Year, data.Month, 1, 0, 0, 0, DateTimeKind.Utc);

    public static Despesa Criar(
        DateTime competencia, TipoDespesa tipo, CategoriaDespesa categoria,
        string? descricao, decimal valor, string? observacao, DateTime dataLancamento, Guid criadoPor)
    {
        if (valor <= 0)
            throw new DomainException("Valor da despesa deve ser maior que zero.");

        return new Despesa
        {
            Id = Guid.NewGuid(),
            Competencia = NormalizarCompetencia(competencia),
            Tipo = tipo,
            Categoria = categoria,
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
        DateTime competencia, TipoDespesa tipo, CategoriaDespesa categoria,
        string? descricao, decimal valor, string? observacao, DateTime dataLancamento, Guid atualizadoPor)
    {
        if (valor <= 0)
            throw new DomainException("Valor da despesa deve ser maior que zero.");

        Competencia = NormalizarCompetencia(competencia);
        Tipo = tipo;
        Categoria = categoria;
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

- [ ] **Step 2: `FaturamentoMensal.cs`** — trocar `DespesaFixa.NormalizarCompetencia` por `Despesa.NormalizarCompetencia` (1 ocorrência no `Criar`).

- [ ] **Step 3: Interface (renomeia `IDespesaFixaRepository.cs` → `IDespesaRepository.cs`)**

```csharp
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IDespesaRepository
{
    Task<Despesa?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Despesa>> ListarPorCompetenciaAsync(DateTime competencia, CancellationToken ct = default);
    Task AdicionarAsync(Despesa despesa, CancellationToken ct = default);
    void Atualizar(Despesa despesa);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

- [ ] **Step 4: Repositório (renomeia `DespesaFixaRepository.cs` → `DespesaRepository.cs`)**

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class DespesaRepository : IDespesaRepository
{
    private readonly AppDbContext _db;

    public DespesaRepository(AppDbContext db) => _db = db;

    public Task<Despesa?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Despesas.FirstOrDefaultAsync(d => d.Id == id, ct);

    public async Task<IReadOnlyList<Despesa>> ListarPorCompetenciaAsync(
        DateTime competencia, CancellationToken ct = default)
    {
        var comp = Despesa.NormalizarCompetencia(competencia);
        return await _db.Despesas
            .Where(d => d.Ativo && d.Competencia == comp)
            .OrderBy(d => d.Tipo).ThenBy(d => d.Categoria).ThenByDescending(d => d.DataLancamento)
            .ToListAsync(ct);
    }

    public async Task AdicionarAsync(Despesa despesa, CancellationToken ct = default) =>
        await _db.Despesas.AddAsync(despesa, ct);

    public void Atualizar(Despesa despesa) => _db.Despesas.Update(despesa);

    public Task<int> SalvarAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
```

- [ ] **Step 5: EF Configuration (renomeia `DespesaFixaConfiguration.cs` → `DespesaConfiguration.cs`)**

```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class DespesaConfiguration : IEntityTypeConfiguration<Despesa>
{
    public void Configure(EntityTypeBuilder<Despesa> builder)
    {
        builder.ToTable("despesas", "financeiro");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasColumnName("id");
        builder.Property(d => d.Competencia).HasColumnName("competencia").IsRequired();
        builder.Property(d => d.Tipo).HasColumnName("tipo").HasConversion<int>().IsRequired();
        builder.Property(d => d.Categoria).HasColumnName("categoria").HasConversion<int>().IsRequired();
        builder.Property(d => d.Descricao).HasColumnName("descricao").HasMaxLength(200);
        builder.Property(d => d.Valor).HasColumnName("valor").HasPrecision(15, 2).IsRequired();
        builder.Property(d => d.Observacao).HasColumnName("observacao").HasMaxLength(500);
        builder.Property(d => d.DataLancamento).HasColumnName("data_lancamento").IsRequired();
        builder.Property(d => d.Ativo).HasColumnName("ativo").IsRequired();
        builder.Property(d => d.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(d => d.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(d => d.CriadoPor).HasColumnName("criado_por").IsRequired();
        builder.Property(d => d.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();

        builder.HasIndex(d => d.Competencia).HasDatabaseName("ix_despesas_competencia");
    }
}
```

- [ ] **Step 6: `AppDbContext.cs`** — trocar a linha do DbSet:
```csharp
    public DbSet<Despesa> Despesas => Set<Despesa>();
```
(remover a antiga `DbSet<DespesaFixa> DespesasFixas`).

- [ ] **Step 7: `DependencyInjection.cs`** — trocar o registro:
```csharp
        services.AddScoped<IDespesaRepository, DespesaRepository>();
```

> Neste ponto o código ainda NÃO compila (Application/API/testes ainda usam nomes antigos).
> As Tasks 3–6 reescrevem esses arquivos. Faça o build só ao final da Task 6. A migration
> (Step 8) precisa compilar — então gere-a só depois que tudo (Tasks 3–6) estiver pronto.
> **Mova o Step 8–10 abaixo para o FINAL da Task 6** (estão aqui para manter a infra junta).

- [ ] **Step 8: Gerar a migration** (rodar só após Tasks 3–6 compilando)

Run:
```bash
dotnet ef migrations add RenomearDespesaFixaParaDespesaComTipo --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API
```
(Se `dotnet ef` não estiver no PATH, use `& "$env:USERPROFILE\.dotnet\tools\dotnet-ef.exe" ...` no PowerShell.)

- [ ] **Step 9: SUBSTITUIR o corpo da migration para preservar dados**

O EF gera DropTable+CreateTable (perde dados). Abra o arquivo `*_RenomearDespesaFixaParaDespesaComTipo.cs` e substitua os métodos `Up`/`Down` por:

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.RenameTable(
        name: "despesas_fixas", schema: "financeiro",
        newName: "despesas", newSchema: "financeiro");

    migrationBuilder.RenameIndex(
        name: "ix_despesas_fixas_competencia", schema: "financeiro",
        table: "despesas", newName: "ix_despesas_competencia");

    migrationBuilder.AddColumn<int>(
        name: "tipo", schema: "financeiro", table: "despesas",
        type: "integer", nullable: false, defaultValue: 1); // 1 = Fixa (backfill)
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.DropColumn(name: "tipo", schema: "financeiro", table: "despesas");

    migrationBuilder.RenameIndex(
        name: "ix_despesas_competencia", schema: "financeiro",
        table: "despesas", newName: "ix_despesas_fixas_competencia");

    migrationBuilder.RenameTable(
        name: "despesas", schema: "financeiro",
        newName: "despesas_fixas", newSchema: "financeiro");
}
```
(Não rodar `database update` — aplica no deploy do Render.)

- [ ] **Step 10: Commit** (no fim da Task 6, junto com Tasks 1–6)

---

## TASK 3 — Application: módulo `Despesas` (rename + Tipo) + ListarDespesas (TDD)

**Files (renomear pasta `Application/DespesasFixas` → `Application/Despesas`):**
- Edit Dtos: `Dtos/DespesaDto.cs`, `Dtos/TotalCategoriaDto.cs`, `Dtos/DespesasMesDto.cs`
- Edit Commands: `Commands/CriarDespesa/*`, `Commands/AtualizarDespesa/*`, `Commands/CancelarDespesa/*`
- Edit Query: `Queries/ListarDespesas/*`
- Edit Test: `tests/CasaDiAna.Application.Tests/Despesas/*` (renomear pasta de `DespesasFixas`)

- [ ] **Step 1: DTOs**

`DespesaDto.cs`:
```csharp
using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Application.Despesas.Dtos;

public record DespesaDto(
    Guid Id, DateTime Competencia, TipoDespesa Tipo, CategoriaDespesa Categoria,
    string? Descricao, decimal Valor, string? Observacao, DateTime DataLancamento, bool Ativo);
```

`TotalCategoriaDto.cs`:
```csharp
using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Application.Despesas.Dtos;

public record TotalCategoriaDto(CategoriaDespesa Categoria, decimal Total);
```

`DespesasMesDto.cs`:
```csharp
namespace CasaDiAna.Application.Despesas.Dtos;

public record DespesasMesDto(
    DateTime Competencia,
    decimal TotalFixas,
    decimal TotalVariaveis,
    IReadOnlyList<DespesaDto> Itens,
    IReadOnlyList<TotalCategoriaDto> TotalPorCategoria);
```

- [ ] **Step 2: Command `CriarDespesa`**

`CriarDespesaCommand.cs`:
```csharp
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.CriarDespesa;

public record CriarDespesaCommand(
    DateTime Competencia, TipoDespesa Tipo, CategoriaDespesa Categoria,
    string? Descricao, decimal Valor, string? Observacao, DateTime DataLancamento)
    : IRequest<DespesaDto>;
```

`CriarDespesaCommandValidator.cs`:
```csharp
using FluentValidation;

namespace CasaDiAna.Application.Despesas.Commands.CriarDespesa;

public class CriarDespesaCommandValidator : AbstractValidator<CriarDespesaCommand>
{
    public CriarDespesaCommandValidator()
    {
        RuleFor(x => x.Competencia).NotEmpty().WithMessage("Competência é obrigatória.");
        RuleFor(x => x.Tipo).IsInEnum().WithMessage("Tipo de despesa inválido.");
        RuleFor(x => x.Categoria).IsInEnum().WithMessage("Categoria inválida.");
        RuleFor(x => x.Valor).GreaterThan(0).WithMessage("Valor deve ser maior que zero.");
        RuleFor(x => x.DataLancamento).NotEmpty().WithMessage("Data de lançamento é obrigatória.");
        RuleFor(x => x.Descricao).MaximumLength(200).WithMessage("Descrição deve ter no máximo 200 caracteres.");
        RuleFor(x => x.Observacao).MaximumLength(500).WithMessage("Observação deve ter no máximo 500 caracteres.");
    }
}
```

`CriarDespesaCommandHandler.cs`:
```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.CriarDespesa;

public class CriarDespesaCommandHandler : IRequestHandler<CriarDespesaCommand, DespesaDto>
{
    private readonly IDespesaRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public CriarDespesaCommandHandler(IDespesaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<DespesaDto> Handle(CriarDespesaCommand request, CancellationToken cancellationToken)
    {
        var despesa = Despesa.Criar(
            request.Competencia, request.Tipo, request.Categoria, request.Descricao,
            request.Valor, request.Observacao, request.DataLancamento, _currentUser.UsuarioId);

        await _repo.AdicionarAsync(despesa, cancellationToken);
        await _repo.SalvarAsync(cancellationToken);
        return ToDto(despesa);
    }

    internal static DespesaDto ToDto(Despesa d) =>
        new(d.Id, d.Competencia, d.Tipo, d.Categoria, d.Descricao, d.Valor, d.Observacao, d.DataLancamento, d.Ativo);
}
```

- [ ] **Step 3: Command `AtualizarDespesa`**

`AtualizarDespesaCommand.cs`:
```csharp
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.AtualizarDespesa;

public record AtualizarDespesaCommand(
    Guid Id, DateTime Competencia, TipoDespesa Tipo, CategoriaDespesa Categoria,
    string? Descricao, decimal Valor, string? Observacao, DateTime DataLancamento)
    : IRequest<DespesaDto>;
```

`AtualizarDespesaCommandValidator.cs`:
```csharp
using FluentValidation;

namespace CasaDiAna.Application.Despesas.Commands.AtualizarDespesa;

public class AtualizarDespesaCommandValidator : AbstractValidator<AtualizarDespesaCommand>
{
    public AtualizarDespesaCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Id é obrigatório.");
        RuleFor(x => x.Competencia).NotEmpty().WithMessage("Competência é obrigatória.");
        RuleFor(x => x.Tipo).IsInEnum().WithMessage("Tipo de despesa inválido.");
        RuleFor(x => x.Categoria).IsInEnum().WithMessage("Categoria inválida.");
        RuleFor(x => x.Valor).GreaterThan(0).WithMessage("Valor deve ser maior que zero.");
        RuleFor(x => x.DataLancamento).NotEmpty().WithMessage("Data de lançamento é obrigatória.");
        RuleFor(x => x.Descricao).MaximumLength(200).WithMessage("Descrição deve ter no máximo 200 caracteres.");
        RuleFor(x => x.Observacao).MaximumLength(500).WithMessage("Observação deve ter no máximo 500 caracteres.");
    }
}
```

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
    private readonly ICurrentUserService _currentUser;

    public AtualizarDespesaCommandHandler(IDespesaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<DespesaDto> Handle(AtualizarDespesaCommand request, CancellationToken cancellationToken)
    {
        var despesa = await _repo.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Despesa não encontrada.");

        despesa.Atualizar(
            request.Competencia, request.Tipo, request.Categoria, request.Descricao,
            request.Valor, request.Observacao, request.DataLancamento, _currentUser.UsuarioId);

        _repo.Atualizar(despesa);
        await _repo.SalvarAsync(cancellationToken);
        return CriarDespesaCommandHandler.ToDto(despesa);
    }
}
```

- [ ] **Step 4: Command `CancelarDespesa`**

`CancelarDespesaCommand.cs`:
```csharp
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.CancelarDespesa;

public record CancelarDespesaCommand(Guid Id) : IRequest;
```

`CancelarDespesaCommandHandler.cs`:
```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.CancelarDespesa;

public class CancelarDespesaCommandHandler : IRequestHandler<CancelarDespesaCommand>
{
    private readonly IDespesaRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public CancelarDespesaCommandHandler(IDespesaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task Handle(CancelarDespesaCommand request, CancellationToken cancellationToken)
    {
        var despesa = await _repo.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Despesa não encontrada.");
        despesa.Cancelar(_currentUser.UsuarioId);
        _repo.Atualizar(despesa);
        await _repo.SalvarAsync(cancellationToken);
    }
}
```

- [ ] **Step 5: Query `ListarDespesas` + handler**

`ListarDespesasQuery.cs`:
```csharp
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.Despesas.Queries.ListarDespesas;

public record ListarDespesasQuery(DateTime Competencia, TipoDespesa? Tipo) : IRequest<DespesasMesDto>;
```

`ListarDespesasQueryHandler.cs`:
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

        var totalFixas = todas.Where(d => d.Tipo == TipoDespesa.Fixa).Sum(d => d.Valor);
        var totalVariaveis = todas.Where(d => d.Tipo == TipoDespesa.Variavel).Sum(d => d.Valor);

        var doTipo = request.Tipo.HasValue ? todas.Where(d => d.Tipo == request.Tipo.Value).ToList() : todas.ToList();

        var itens = doTipo.Select(CriarDespesaCommandHandler.ToDto).ToList();
        var porCategoria = doTipo
            .GroupBy(d => d.Categoria)
            .Select(g => new TotalCategoriaDto(g.Key, g.Sum(d => d.Valor)))
            .OrderBy(c => c.Categoria)
            .ToList();

        return new DespesasMesDto(competencia, totalFixas, totalVariaveis, itens, porCategoria);
    }
}
```

- [ ] **Step 6: Atualizar os testes (renomeia pasta `DespesasFixas` → `Despesas`)**

Renomeie `tests/CasaDiAna.Application.Tests/DespesasFixas/` → `Despesas/`. Atualize os testes de entidade e handlers para os novos nomes e a assinatura com `Tipo`. Conteúdo dos testes de handler (substitui os antigos):

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Despesas.Commands.AtualizarDespesa;
using CasaDiAna.Application.Despesas.Commands.CancelarDespesa;
using CasaDiAna.Application.Despesas.Commands.CriarDespesa;
using CasaDiAna.Application.Despesas.Queries.ListarDespesas;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Despesas;

public class DespesaTests
{
    [Fact]
    public void Criar_DeveNormalizarCompetencia_ESalvarTipo()
    {
        var d = Despesa.Criar(new DateTime(2026, 6, 17), TipoDespesa.Variavel, CategoriaDespesa.TaxaCartao,
            "Maquininha", 150m, null, new DateTime(2026, 6, 17), Guid.NewGuid());
        d.Competencia.Should().Be(new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc));
        d.Tipo.Should().Be(TipoDespesa.Variavel);
        d.Ativo.Should().BeTrue();
    }

    [Fact]
    public void Criar_DeveLancar_QuandoValorZero()
    {
        var acao = () => Despesa.Criar(new DateTime(2026, 6, 1), TipoDespesa.Fixa, CategoriaDespesa.Energia,
            null, 0m, null, DateTime.Today, Guid.NewGuid());
        acao.Should().Throw<DomainException>().WithMessage("Valor da despesa deve ser maior que zero.");
    }
}

public class DespesaHandlersTests
{
    private readonly Mock<IDespesaRepository> _repo = new();
    private readonly Mock<ICurrentUserService> _user = new();

    public DespesaHandlersTests()
    {
        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _repo.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
    }

    [Fact]
    public async Task Criar_DevePersistirComTipo()
    {
        _repo.Setup(r => r.AdicionarAsync(It.IsAny<Despesa>(), default)).Returns(Task.CompletedTask);
        var handler = new CriarDespesaCommandHandler(_repo.Object, _user.Object);
        var dto = await handler.Handle(new CriarDespesaCommand(
            new DateTime(2026, 6, 1), TipoDespesa.Fixa, CategoriaDespesa.Aluguel, "Loja", 3000m, null, new DateTime(2026, 6, 1)),
            CancellationToken.None);
        dto.Tipo.Should().Be(TipoDespesa.Fixa);
        dto.Valor.Should().Be(3000m);
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<Despesa>(), default), Times.Once);
    }

    [Fact]
    public async Task Atualizar_DeveLancar_QuandoNaoEncontrada()
    {
        _repo.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync((Despesa?)null);
        var handler = new AtualizarDespesaCommandHandler(_repo.Object, _user.Object);
        var acao = () => handler.Handle(new AtualizarDespesaCommand(
            Guid.NewGuid(), new DateTime(2026, 6, 1), TipoDespesa.Fixa, CategoriaDespesa.Agua, null, 1m, null, DateTime.Today),
            CancellationToken.None);
        await acao.Should().ThrowAsync<DomainException>().WithMessage("Despesa não encontrada.");
    }

    [Fact]
    public async Task Cancelar_DeveMarcarInativo()
    {
        var d = Despesa.Criar(new DateTime(2026, 6, 1), TipoDespesa.Fixa, CategoriaDespesa.Gas, null, 200m, null,
            DateTime.Today, Guid.NewGuid());
        _repo.Setup(r => r.ObterPorIdAsync(d.Id, default)).ReturnsAsync(d);
        var handler = new CancelarDespesaCommandHandler(_repo.Object, _user.Object);
        await handler.Handle(new CancelarDespesaCommand(d.Id), CancellationToken.None);
        d.Ativo.Should().BeFalse();
        _repo.Verify(r => r.Atualizar(d), Times.Once);
    }

    [Fact]
    public async Task Listar_DeveSepararTotaisFixasEVariaveis()
    {
        var comp = new DateTime(2026, 6, 1); var u = Guid.NewGuid();
        var lista = new List<Despesa>
        {
            Despesa.Criar(comp, TipoDespesa.Fixa, CategoriaDespesa.Aluguel, null, 3000m, null, comp, u),
            Despesa.Criar(comp, TipoDespesa.Variavel, CategoriaDespesa.TaxaCartao, null, 200m, null, comp, u),
            Despesa.Criar(comp, TipoDespesa.Variavel, CategoriaDespesa.Frete, null, 100m, null, comp, u),
        };
        _repo.Setup(r => r.ListarPorCompetenciaAsync(comp, default)).ReturnsAsync(lista);
        var handler = new ListarDespesasQueryHandler(_repo.Object);

        var todas = await handler.Handle(new ListarDespesasQuery(comp, null), CancellationToken.None);
        todas.TotalFixas.Should().Be(3000m);
        todas.TotalVariaveis.Should().Be(300m);
        todas.Itens.Should().HaveCount(3);

        var soVar = await handler.Handle(new ListarDespesasQuery(comp, TipoDespesa.Variavel), CancellationToken.None);
        soVar.Itens.Should().HaveCount(2);
        soVar.TotalFixas.Should().Be(3000m); // totais consideram o mês todo
    }
}
```

> Delete os arquivos de teste antigos de `DespesasFixas` (`DespesaFixaTests.cs`,
> `CriarDespesaFixaCommandHandlerTests.cs`, `AtualizarECancelarDespesaFixaTests.cs`,
> `ListarDespesasFixasQueryHandlerTests.cs`) — substituídos pelos acima.

---

## TASK 4 — Compras das notas (query read-only, TDD)

**Files:**
- Create: `src/CasaDiAna.Application/Despesas/Dtos/CompraNotaDto.cs`, `Dtos/ComprasMesDto.cs`
- Create: `Queries/ObterComprasMes/ObterComprasMesQuery.cs`, `ObterComprasMesQueryHandler.cs`
- Test: `tests/CasaDiAna.Application.Tests/Despesas/ObterComprasMesQueryHandlerTests.cs`

- [ ] **Step 1: DTOs**

`CompraNotaDto.cs`:
```csharp
namespace CasaDiAna.Application.Despesas.Dtos;

public record CompraNotaDto(
    Guid EntradaId, string Fornecedor, string? NumeroNotaFiscal, DateTime Data, decimal Total);
```

`ComprasMesDto.cs`:
```csharp
namespace CasaDiAna.Application.Despesas.Dtos;

public record ComprasMesDto(
    DateTime Competencia, decimal TotalCompras, IReadOnlyList<CompraNotaDto> Itens);
```

- [ ] **Step 2: Query**

```csharp
using CasaDiAna.Application.Despesas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Despesas.Queries.ObterComprasMes;

public record ObterComprasMesQuery(DateTime Competencia) : IRequest<ComprasMesDto>;
```

- [ ] **Step 3: Teste que falha**

```csharp
using CasaDiAna.Application.Despesas.Queries.ObterComprasMes;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Despesas;

public class ObterComprasMesQueryHandlerTests
{
    [Fact]
    public async Task DeveSomarSomenteConfirmadas()
    {
        var comp = new DateTime(2026, 6, 1);
        var user = Guid.NewGuid();
        var forn = Guid.NewGuid();
        var ingrediente = Guid.NewGuid();

        var confirmada = EntradaMercadoria.Criar(forn, new DateTime(2026, 6, 10), user, numeroNotaFiscal: "NF-1");
        confirmada.AdicionarItem(ingrediente, 10m, 5m);   // 50
        var cancelada = EntradaMercadoria.Criar(forn, new DateTime(2026, 6, 12), user, numeroNotaFiscal: "NF-2");
        cancelada.AdicionarItem(ingrediente, 3m, 5m);     // 15
        cancelada.Cancelar(user);

        var repo = new Mock<IEntradaMercadoriaRepository>();
        repo.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), default))
            .ReturnsAsync(new List<EntradaMercadoria> { confirmada, cancelada });

        var handler = new ObterComprasMesQueryHandler(repo.Object);
        var dto = await handler.Handle(new ObterComprasMesQuery(comp), CancellationToken.None);

        dto.TotalCompras.Should().Be(50m);
        dto.Itens.Should().ContainSingle();
        dto.Itens[0].NumeroNotaFiscal.Should().Be("NF-1");
    }
}
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter ObterComprasMesQueryHandlerTests`
Expected: FAIL — handler não existe.

- [ ] **Step 5: Handler**

```csharp
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Despesas.Queries.ObterComprasMes;

public class ObterComprasMesQueryHandler : IRequestHandler<ObterComprasMesQuery, ComprasMesDto>
{
    private readonly IEntradaMercadoriaRepository _entradas;

    public ObterComprasMesQueryHandler(IEntradaMercadoriaRepository entradas) => _entradas = entradas;

    public async Task<ComprasMesDto> Handle(ObterComprasMesQuery request, CancellationToken cancellationToken)
    {
        var competencia = Despesa.NormalizarCompetencia(request.Competencia);
        var fim = competencia.AddMonths(1).AddDays(-1);

        var entradas = await _entradas.ListarAsync(competencia, fim, cancellationToken);

        var itens = entradas
            .Where(e => e.Status == StatusEntrada.Confirmada)
            .Select(e => new CompraNotaDto(
                e.Id,
                e.Fornecedor?.RazaoSocial ?? string.Empty,
                e.NumeroNotaFiscal,
                e.DataEntrada,
                e.Itens.Sum(i => i.CustoTotal)))
            .OrderByDescending(c => c.Data)
            .ToList();

        return new ComprasMesDto(competencia, itens.Sum(c => c.Total), itens);
    }
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter ObterComprasMesQueryHandlerTests`
Expected: PASS.

---

## TASK 5 — Fechamento Mensal: variáveis + compras + total de saídas (TDD)

**Files:**
- Modify: `src/CasaDiAna.Application/FechamentoMensal/Dtos/FechamentoMensalDto.cs`
- Modify: `Queries/ObterFechamentoMensal/ObterFechamentoMensalQueryHandler.cs`
- Modify: `tests/.../FechamentoMensal/ObterFechamentoMensalQueryHandlerTests.cs`

- [ ] **Step 1: DTO (novos campos)**

```csharp
using CasaDiAna.Application.Despesas.Dtos;

namespace CasaDiAna.Application.FechamentoMensal.Dtos;

public record FechamentoMensalDto(
    DateTime Competencia,
    decimal FaturamentoCalculado,
    decimal? FaturamentoManual,
    decimal FaturamentoUsado,
    decimal CustoDiretoTotal,
    decimal TotalDespesasFixas,
    decimal TotalDespesasVariaveis,
    decimal TotalCompras,
    decimal TotalSaidas,
    decimal FolhaPagamento,
    decimal? DespesaFixaPercentual,
    decimal MargemBruta,
    decimal MargemOperacional,
    decimal PrimeCost,
    IReadOnlyList<TotalCategoriaDto> DespesasPorCategoria);
```

> Atualize o `using` para `CasaDiAna.Application.Despesas.Dtos` (TotalCategoriaDto mudou de namespace).

- [ ] **Step 2: Atualizar o teste do fechamento** (substituir o caso principal — agora separa fixa/variável + compras)

```csharp
using CasaDiAna.Application.Despesas.Queries.ObterComprasMes;
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Application.FechamentoMensal.Queries.ObterFechamentoMensal;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.FechamentoMensal;

public class ObterFechamentoMensalQueryHandlerTests
{
    private readonly Mock<IVendaDiariaRepository> _vendas = new();
    private readonly Mock<IDespesaRepository> _despesas = new();
    private readonly Mock<IFaturamentoMensalRepository> _faturamento = new();
    private readonly Mock<IProdutoRepository> _produtos = new();
    private readonly Mock<IEntradaMercadoriaRepository> _entradas = new();
    private readonly DateTime _comp = new(2026, 6, 1);

    private ObterFechamentoMensalQueryHandler Criar() =>
        new(_vendas.Object, _despesas.Object, _faturamento.Object, _produtos.Object, _entradas.Object);

    [Fact]
    public async Task DeveSepararFixasVariaveis_ComprasETotalSaidas()
    {
        var produto = Produto.Criar("Café", 10m, Guid.NewGuid());
        var venda = VendaDiaria.Criar(produto.Id, new DateTime(2026, 6, 10), 100m, Guid.NewGuid());
        _vendas.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), null, default))
               .ReturnsAsync(new List<VendaDiaria> { venda });
        _produtos.Setup(r => r.ListarComFichaAsync(false, default)).ReturnsAsync(new List<Produto> { produto });

        _despesas.Setup(r => r.ListarPorCompetenciaAsync(_comp, default)).ReturnsAsync(new List<Despesa>
        {
            Despesa.Criar(_comp, TipoDespesa.Fixa, CategoriaDespesa.Aluguel, null, 200m, null, _comp, Guid.NewGuid()),
            Despesa.Criar(_comp, TipoDespesa.Fixa, CategoriaDespesa.FolhaPagamento, null, 300m, null, _comp, Guid.NewGuid()),
            Despesa.Criar(_comp, TipoDespesa.Variavel, CategoriaDespesa.TaxaCartao, null, 100m, null, _comp, Guid.NewGuid()),
        });
        _faturamento.Setup(r => r.ObterPorCompetenciaAsync(_comp, default)).ReturnsAsync((FaturamentoMensal?)null);

        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), new DateTime(2026, 6, 5), Guid.NewGuid());
        entrada.AdicionarItem(Guid.NewGuid(), 4m, 50m); // 200 compras
        _entradas.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), default))
                 .ReturnsAsync(new List<EntradaMercadoria> { entrada });

        var dto = await Criar().Handle(new ObterFechamentoMensalQuery(_comp), CancellationToken.None);

        dto.FaturamentoUsado.Should().Be(1000m);
        dto.TotalDespesasFixas.Should().Be(500m);
        dto.TotalDespesasVariaveis.Should().Be(100m);
        dto.TotalCompras.Should().Be(200m);
        dto.TotalSaidas.Should().Be(800m);           // 500 + 100 + 200
        dto.DespesaFixaPercentual.Should().Be(0.5m); // só fixas / faturamento
        dto.MargemOperacional.Should().Be(400m);     // 1000 - 0 - 500 - 100
        dto.PrimeCost.Should().Be(300m);             // custo direto 0 + folha 300
    }
}
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter ObterFechamentoMensalQueryHandlerTests`
Expected: FAIL (assinatura do handler mudou / campos novos).

- [ ] **Step 4: Handler atualizado**

```csharp
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Application.FechamentoMensal.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.FechamentoMensal.Queries.ObterFechamentoMensal;

public class ObterFechamentoMensalQueryHandler
    : IRequestHandler<ObterFechamentoMensalQuery, FechamentoMensalDto>
{
    private readonly IVendaDiariaRepository _vendas;
    private readonly IDespesaRepository _despesas;
    private readonly IFaturamentoMensalRepository _faturamento;
    private readonly IProdutoRepository _produtos;
    private readonly IEntradaMercadoriaRepository _entradas;

    public ObterFechamentoMensalQueryHandler(
        IVendaDiariaRepository vendas, IDespesaRepository despesas,
        IFaturamentoMensalRepository faturamento, IProdutoRepository produtos,
        IEntradaMercadoriaRepository entradas)
    {
        _vendas = vendas;
        _despesas = despesas;
        _faturamento = faturamento;
        _produtos = produtos;
        _entradas = entradas;
    }

    public async Task<FechamentoMensalDto> Handle(
        ObterFechamentoMensalQuery request, CancellationToken cancellationToken)
    {
        var competencia = Despesa.NormalizarCompetencia(request.Competencia);
        var inicio = competencia;
        var fim = competencia.AddMonths(1).AddDays(-1);

        var vendas = await _vendas.ListarAsync(inicio, fim, null, cancellationToken);
        var produtos = (await _produtos.ListarComFichaAsync(false, cancellationToken)).ToDictionary(p => p.Id);

        decimal faturamentoCalculado = 0m, custoDiretoTotal = 0m;
        foreach (var venda in vendas)
        {
            if (!produtos.TryGetValue(venda.ProdutoId, out var produto)) continue;
            faturamentoCalculado += venda.QuantidadeVendida * produto.PrecoVenda;
            custoDiretoTotal += venda.QuantidadeVendida * produto.CalcularCustoFicha();
        }

        var faturamentoManual = (await _faturamento.ObterPorCompetenciaAsync(competencia, cancellationToken))?.ValorManual;
        var faturamentoUsado = faturamentoManual ?? faturamentoCalculado;

        var despesas = await _despesas.ListarPorCompetenciaAsync(competencia, cancellationToken);
        var totalFixas = despesas.Where(d => d.Tipo == TipoDespesa.Fixa).Sum(d => d.Valor);
        var totalVariaveis = despesas.Where(d => d.Tipo == TipoDespesa.Variavel).Sum(d => d.Valor);
        var folha = despesas.Where(d => d.Categoria == CategoriaDespesa.FolhaPagamento).Sum(d => d.Valor);
        var porCategoria = despesas
            .GroupBy(d => d.Categoria)
            .Select(g => new TotalCategoriaDto(g.Key, g.Sum(d => d.Valor)))
            .OrderBy(c => c.Categoria)
            .ToList();

        var entradas = await _entradas.ListarAsync(inicio, fim, cancellationToken);
        var totalCompras = entradas
            .Where(e => e.Status == StatusEntrada.Confirmada)
            .Sum(e => e.Itens.Sum(i => i.CustoTotal));

        var totalSaidas = totalFixas + totalVariaveis + totalCompras;
        decimal? despesaFixaPercentual = faturamentoUsado > 0 ? totalFixas / faturamentoUsado : null;
        var margemBruta = faturamentoUsado - custoDiretoTotal;
        var margemOperacional = faturamentoUsado - custoDiretoTotal - totalFixas - totalVariaveis;
        var primeCost = custoDiretoTotal + folha;

        return new FechamentoMensalDto(
            competencia, faturamentoCalculado, faturamentoManual, faturamentoUsado, custoDiretoTotal,
            totalFixas, totalVariaveis, totalCompras, totalSaidas, folha,
            despesaFixaPercentual, margemBruta, margemOperacional, primeCost, porCategoria);
    }
}
```

> A precificação (`ObterAnalisePrecificacaoQueryHandler`) já lê `DespesaFixaPercentual` —
> que agora é só fixas. O teste de precificação `ObterAnalisePrecificacaoQueryHandlerTests`
> constrói um `FechamentoMensalDto` por posição: **atualize o construtor** no mock para os
> novos 15 campos (adicione `TotalDespesasVariaveis=0`, `TotalCompras=0`, `TotalSaidas=0`
> nas posições corretas, mantendo `DespesaFixaPercentual` em 0.5m). Ordem: `(Competencia,
> FaturamentoCalculado, FaturamentoManual, FaturamentoUsado, CustoDiretoTotal, TotalDespesasFixas,
> TotalDespesasVariaveis, TotalCompras, TotalSaidas, FolhaPagamento, DespesaFixaPercentual,
> MargemBruta, MargemOperacional, PrimeCost, DespesasPorCategoria)`.

- [ ] **Step 5: Build + suíte completa**

Run: `dotnet build src/CasaDiAna.API` → succeeded.
Run: `dotnet test tests/CasaDiAna.Application.Tests` → todos PASS.

---

## TASK 6 — Controller `Despesas` (rename + compras) + migration + commit backend

**Files:**
- Rename+edit: `src/CasaDiAna.API/Controllers/DespesasFixasController.cs` → `DespesasController.cs`

- [ ] **Step 1: Controller**

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Despesas.Commands.AtualizarDespesa;
using CasaDiAna.Application.Despesas.Commands.CancelarDespesa;
using CasaDiAna.Application.Despesas.Commands.CriarDespesa;
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Application.Despesas.Queries.ListarDespesas;
using CasaDiAna.Application.Despesas.Queries.ObterComprasMes;
using CasaDiAna.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/despesas")]
[Authorize(Roles = "Admin,Coordenador")]
public class DespesasController : ControllerBase
{
    private readonly IMediator _mediator;

    public DespesasController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<DespesasMesDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] DateTime competencia, [FromQuery] TipoDespesa? tipo, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ListarDespesasQuery(competencia, tipo), ct);
        return Ok(ApiResponse<DespesasMesDto>.Ok(resultado));
    }

    [HttpGet("compras")]
    [ProducesResponseType(typeof(ApiResponse<ComprasMesDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Compras([FromQuery] DateTime competencia, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ObterComprasMesQuery(competencia), ct);
        return Ok(ApiResponse<ComprasMesDto>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<DespesaDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Criar([FromBody] CriarDespesaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<DespesaDto>.Ok(resultado));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<DespesaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Atualizar(
        Guid id, [FromBody] AtualizarDespesaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command with { Id = id }, ct);
        return Ok(ApiResponse<DespesaDto>.Ok(resultado));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Cancelar(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new CancelarDespesaCommand(id), ct);
        return NoContent();
    }
}
```

- [ ] **Step 2: Build + suíte; depois gerar e editar a migration (Task 2 steps 8–9)**

Run: `dotnet build src/CasaDiAna.API` → succeeded.
Run: `dotnet test tests/CasaDiAna.Application.Tests` → todos PASS.
Agora execute a Task 2 **Step 8** (gerar migration) e **Step 9** (editar o corpo para `RenameTable`+`AddColumn tipo`). Rebuild para confirmar que a migration compila.

- [ ] **Step 3: Commit backend (Tasks 1–6 juntas)**

```bash
git add src/CasaDiAna.Domain src/CasaDiAna.Infrastructure src/CasaDiAna.Application src/CasaDiAna.API tests/CasaDiAna.Application.Tests
git commit -m "refactor(financeiro): despesas com tipo (fixa/variavel) + compras das notas; fechamento atualizado"
```

---

## TASK 7 — Frontend: labels (tipo + categorias) + service

**Files:**
- Modify: `frontend/src/features/financeiro/shared/competencia.ts`
- Rename+edit: `features/financeiro/despesas-fixas/services/despesasFixasService.ts` → `features/financeiro/despesas/services/despesasService.ts`

- [ ] **Step 1: `competencia.ts` — adicionar tipo e categorias novas**

Substitua a união `CategoriaDespesaFixa` e o record de labels, e adicione o tipo:

```typescript
export type CategoriaDespesa =
  | 'aluguel' | 'folhaPagamento' | 'agua' | 'energia' | 'gas' | 'internet'
  | 'contabilidade' | 'manutencao' | 'sistema' | 'marketing' | 'outros'
  | 'taxaCartao' | 'comissaoDelivery' | 'embalagens' | 'frete'

export const CATEGORIA_DESPESA_LABELS: Record<CategoriaDespesa, string> = {
  aluguel: 'Aluguel', folhaPagamento: 'Folha de pagamento', agua: 'Água',
  energia: 'Energia', gas: 'Gás', internet: 'Internet', contabilidade: 'Contabilidade',
  manutencao: 'Manutenção', sistema: 'Sistema', marketing: 'Marketing', outros: 'Outros',
  taxaCartao: 'Taxa de cartão', comissaoDelivery: 'Comissão delivery',
  embalagens: 'Embalagens', frete: 'Frete',
}

export const CATEGORIA_DESPESA_OPCOES = (
  Object.keys(CATEGORIA_DESPESA_LABELS) as CategoriaDespesa[]
).map(valor => ({ valor, label: CATEGORIA_DESPESA_LABELS[valor] }))

export type TipoDespesa = 'fixa' | 'variavel'
export const TIPO_DESPESA_LABELS: Record<TipoDespesa, string> = { fixa: 'Fixa', variavel: 'Variável' }
```
> Mantenha `competenciaInicial`, `mesParaCompetencia`, `formatarBRL`, `formatarPercentual`.
> Renomeie o tipo antigo `CategoriaDespesaFixa` → `CategoriaDespesa` em todos os imports.

- [ ] **Step 2: Service (renomeia pasta `despesas-fixas` → `despesas`)**

`features/financeiro/despesas/services/despesasService.ts`:
```typescript
import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type { CategoriaDespesa, TipoDespesa } from '../../shared/competencia'

export interface Despesa {
  id: string
  competencia: string
  tipo: TipoDespesa
  categoria: CategoriaDespesa
  descricao: string | null
  valor: number
  observacao: string | null
  dataLancamento: string
  ativo: boolean
}

export interface TotalCategoria { categoria: CategoriaDespesa; total: number }

export interface DespesasMes {
  competencia: string
  totalFixas: number
  totalVariaveis: number
  itens: Despesa[]
  totalPorCategoria: TotalCategoria[]
}

export interface DespesaInput {
  competencia: string
  tipo: TipoDespesa
  categoria: CategoriaDespesa
  descricao: string | null
  valor: number
  observacao: string | null
  dataLancamento: string
}

export interface CompraNota {
  entradaId: string
  fornecedor: string
  numeroNotaFiscal: string | null
  data: string
  total: number
}

export interface ComprasMes { competencia: string; totalCompras: number; itens: CompraNota[] }

export const despesasService = {
  listar: async (competencia: string, tipo?: TipoDespesa): Promise<DespesasMes> => {
    const q = tipo ? `&tipo=${tipo}` : ''
    const resp = await api.get<ApiResponse<DespesasMes>>(`/despesas?competencia=${competencia}${q}`)
    return resp.data.dados
  },
  criar: async (input: DespesaInput): Promise<Despesa> => {
    const resp = await api.post<ApiResponse<Despesa>>('/despesas', input)
    return resp.data.dados
  },
  atualizar: async (id: string, input: DespesaInput): Promise<Despesa> => {
    const resp = await api.put<ApiResponse<Despesa>>(`/despesas/${id}`, input)
    return resp.data.dados
  },
  cancelar: async (id: string): Promise<void> => { await api.delete(`/despesas/${id}`) },
  compras: async (competencia: string): Promise<ComprasMes> => {
    const resp = await api.get<ApiResponse<ComprasMes>>(`/despesas/compras?competencia=${competencia}`)
    return resp.data.dados
  },
}
```

- [ ] **Step 3: Type-check** — `npx tsc --noEmit` (haverá erros nos consumidores antigos; corrigidos na Task 8).

---

## TASK 8 — Frontend: tela Despesas (toggle tipo + KPIs + card compras)

**Files (renomeia `despesas-fixas` → `despesas`):**
- `hooks/useDespesas.ts`, `components/TabelaDespesas.tsx`, `components/ModalDespesa.tsx`, `pages/DespesasPage.tsx`

- [ ] **Step 1: Hook**

```typescript
import { useCallback, useEffect, useState } from 'react'
import { despesasService, type DespesasMes, type ComprasMes } from '../services/despesasService'
import { mesParaCompetencia, type TipoDespesa } from '../../shared/competencia'

export function useDespesas(mes: string, tipo: TipoDespesa) {
  const [dados, setDados] = useState<DespesasMes | null>(null)
  const [compras, setCompras] = useState<ComprasMes | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true); setErro(null)
    try {
      const comp = mesParaCompetencia(mes)
      const [d, c] = await Promise.all([despesasService.listar(comp, tipo), despesasService.compras(comp)])
      setDados(d); setCompras(c)
    } catch { setErro('Erro ao carregar despesas.') } finally { setLoading(false) }
  }, [mes, tipo])

  useEffect(() => { recarregar() }, [recarregar])
  return { dados, compras, loading, erro, recarregar }
}
```

- [ ] **Step 2: `TabelaDespesas.tsx`** (igual à de despesas fixas, com `CategoriaDespesa`/labels)

```tsx
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { Despesa } from '../services/despesasService'
import { CATEGORIA_DESPESA_LABELS, formatarBRL } from '../../shared/competencia'

interface Props { itens: Despesa[]; onEditar: (d: Despesa) => void; onRemover: (d: Despesa) => void }

export function TabelaDespesas({ itens, onEditar, onRemover }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left" style={{ color: 'var(--ada-muted)' }}>
            <th className="py-2 pr-4 font-medium">Categoria</th>
            <th className="py-2 pr-4 font-medium">Descrição</th>
            <th className="py-2 pr-4 font-medium">Data</th>
            <th className="py-2 pr-4 font-medium text-right">Valor</th>
            <th className="py-2 pl-4 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {itens.map(d => (
            <tr key={d.id} style={{ borderTop: '1px solid var(--ada-border)' }}>
              <td className="py-2.5 pr-4" style={{ color: 'var(--ada-body)' }}>{CATEGORIA_DESPESA_LABELS[d.categoria]}</td>
              <td className="py-2.5 pr-4" style={{ color: 'var(--ada-muted)' }}>{d.descricao ?? '—'}</td>
              <td className="py-2.5 pr-4" style={{ color: 'var(--ada-muted)' }}>{new Date(d.dataLancamento).toLocaleDateString('pt-BR')}</td>
              <td className="py-2.5 pr-4 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>{formatarBRL(d.valor)}</td>
              <td className="py-2.5 pl-4">
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => onEditar(d)} title="Editar" className="p-1.5 rounded-lg hover:opacity-80" style={{ color: 'var(--ada-muted)' }}><PencilSquareIcon className="h-4 w-4" /></button>
                  <button type="button" onClick={() => onRemover(d)} title="Remover" className="p-1.5 rounded-lg hover:opacity-80" style={{ color: '#F87171' }}><TrashIcon className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: `ModalDespesa.tsx`** (cadastro/edição — recebe o `tipo` do toggle)

```tsx
import { useState } from 'react'
import type { Despesa, DespesaInput } from '../services/despesasService'
import { CATEGORIA_DESPESA_OPCOES, mesParaCompetencia, type CategoriaDespesa, type TipoDespesa } from '../../shared/competencia'

interface Props {
  mes: string
  tipo: TipoDespesa
  despesa: Despesa | null
  onFechar: () => void
  onSalvar: (input: DespesaInput) => Promise<void>
}

export function ModalDespesa({ mes, tipo, despesa, onFechar, onSalvar }: Props) {
  const [categoria, setCategoria] = useState<CategoriaDespesa>(despesa?.categoria ?? 'aluguel')
  const [descricao, setDescricao] = useState(despesa?.descricao ?? '')
  const [valor, setValor] = useState(despesa ? String(despesa.valor) : '')
  const [observacao, setObservacao] = useState(despesa?.observacao ?? '')
  const [dataLancamento, setDataLancamento] = useState(
    despesa ? despesa.dataLancamento.split('T')[0] : new Date().toISOString().split('T')[0])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const submeter = async () => {
    const valorNum = Number(valor.replace(',', '.'))
    if (!Number.isFinite(valorNum) || valorNum <= 0) { setErro('Informe um valor maior que zero.'); return }
    setSalvando(true); setErro(null)
    try {
      await onSalvar({
        competencia: despesa?.competencia ?? mesParaCompetencia(mes),
        tipo: despesa?.tipo ?? tipo,
        categoria, descricao: descricao.trim() || null, valor: valorNum,
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
          <select value={categoria} onChange={e => setCategoria(e.target.value as CategoriaDespesa)} className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={inputStyle}>
            {CATEGORIA_DESPESA_OPCOES.map(op => <option key={op.valor} value={op.valor}>{op.label}</option>)}
          </select>
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

- [ ] **Step 4: `DespesasPage.tsx`**

```tsx
import { useState } from 'react'
import { PlusIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { ModalDesativar } from '@/components/ui/ModalDesativar'
import { useDespesas } from '../hooks/useDespesas'
import { TabelaDespesas } from '../components/TabelaDespesas'
import { ModalDespesa } from '../components/ModalDespesa'
import { despesasService, type Despesa, type DespesaInput } from '../services/despesasService'
import { competenciaInicial, formatarBRL, CATEGORIA_DESPESA_LABELS, TIPO_DESPESA_LABELS, type TipoDespesa } from '../../shared/competencia'

export function DespesasPage() {
  const [mes, setMes] = useState(competenciaInicial())
  const [tipo, setTipo] = useState<TipoDespesa>('fixa')
  const { dados, compras, loading, erro, recarregar } = useDespesas(mes, tipo)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Despesa | null>(null)
  const [removendo, setRemovendo] = useState<Despesa | null>(null)
  const [removendoLoading, setRemovendoLoading] = useState(false)

  const salvar = async (input: DespesaInput) => {
    if (editando) await despesasService.atualizar(editando.id, input)
    else await despesasService.criar(input)
    await recarregar()
  }
  const confirmarRemocao = async () => {
    if (!removendo) return
    setRemovendoLoading(true)
    try { await despesasService.cancelar(removendo.id); setRemovendo(null); await recarregar() }
    finally { setRemovendoLoading(false) }
  }

  return (
    <div className="ada-page space-y-6">
      <PageHeader titulo="Despesas" subtitulo="Despesas fixas e variáveis da empresa, e compras das notas" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Competência</label>
            <input type="month" value={mes} onChange={e => setMes(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)', colorScheme: 'dark' }} />
          </div>
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--ada-border)' }}>
            {(['fixa', 'variavel'] as const).map(t => (
              <button key={t} type="button" onClick={() => setTipo(t)} className="px-4 py-2.5 text-sm font-medium"
                style={{ background: tipo === t ? 'var(--sb-accent)' : 'var(--ada-bg)', color: tipo === t ? '#fff' : 'var(--ada-body)' }}>
                {TIPO_DESPESA_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={() => { setEditando(null); setModalAberto(true) }} className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ background: 'var(--sb-accent)' }}>
          <PlusIcon className="h-4 w-4" /> Nova despesa {TIPO_DESPESA_LABELS[tipo].toLowerCase()}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Total fixas" valor={formatarBRL(dados?.totalFixas ?? 0)} variante="amber" />
        <KpiCard label="Total variáveis" valor={formatarBRL(dados?.totalVariaveis ?? 0)} variante="yellow" />
        <KpiCard label="Compras (notas)" valor={formatarBRL(compras?.totalCompras ?? 0)} variante="blue" />
      </div>

      <div className="rounded-xl border p-6" style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
        {loading ? <SkeletonTable colunas={5} />
          : erro ? <p className="text-sm" style={{ color: 'var(--ada-error-text)' }}>{erro}</p>
          : !dados || dados.itens.length === 0
            ? <EmptyState icon={<BanknotesIcon />} titulo={`Nenhuma despesa ${TIPO_DESPESA_LABELS[tipo].toLowerCase()} nesta competência`} descricao="Adicione a primeira despesa deste tipo e mês." />
            : <TabelaDespesas itens={dados.itens} onEditar={d => { setEditando(d); setModalAberto(true) }} onRemover={setRemovendo} />}
      </div>

      <div className="rounded-xl border p-6 space-y-3" style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)' }}>Compras do mês (notas)</p>
          <Link to="/entradas" className="text-xs" style={{ color: 'var(--sb-accent)', textDecoration: 'underline' }}>Ver entradas</Link>
        </div>
        {!compras || compras.itens.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Nenhuma compra registrada neste mês.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {compras.itens.map(c => (
                  <tr key={c.entradaId} style={{ borderTop: '1px solid var(--ada-border)' }}>
                    <td className="py-2 pr-4" style={{ color: 'var(--ada-body)' }}>{c.fornecedor}</td>
                    <td className="py-2 pr-4" style={{ color: 'var(--ada-muted)' }}>{c.numeroNotaFiscal ?? '—'}</td>
                    <td className="py-2 pr-4" style={{ color: 'var(--ada-muted)' }}>{new Date(c.data).toLocaleDateString('pt-BR')}</td>
                    <td className="py-2 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>{formatarBRL(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && <ModalDespesa mes={mes} tipo={tipo} despesa={editando} onFechar={() => setModalAberto(false)} onSalvar={salvar} />}
      {removendo && <ModalDesativar nome={removendo.descricao ?? CATEGORIA_DESPESA_LABELS[removendo.categoria]} entidade="despesa" loading={removendoLoading} onConfirmar={confirmarRemocao} onCancelar={() => setRemovendo(null)} />}
    </div>
  )
}
```

- [ ] **Step 5: Type-check + lint** — `npx tsc --noEmit` e `npx eslint src/features/financeiro/despesas` (limpos). Excluir a pasta antiga `despesas-fixas`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/financeiro/despesas frontend/src/features/financeiro/shared/competencia.ts
git rm -r frontend/src/features/financeiro/despesas-fixas
git commit -m "feat(financeiro): tela Despesas com tipo fixa/variavel e card de compras das notas"
```

---

## TASK 9 — Frontend: Fechamento com variáveis + compras + total de saídas

**Files:**
- Modify: `frontend/src/features/financeiro/fechamento-mensal/services/fechamentoService.ts`
- Modify: `frontend/src/features/financeiro/fechamento-mensal/pages/FechamentoMensalPage.tsx`

- [ ] **Step 1: Service — novos campos**

No `fechamentoService.ts`, adicionar à interface `FechamentoMensal`:
```typescript
  totalDespesasVariaveis: number
  totalCompras: number
  totalSaidas: number
```
(O `import type { TotalCategoria }` agora vem de `../../despesas/services/despesasService` — atualizar o caminho do import.)

- [ ] **Step 2: Página — novos KPIs**

Em `FechamentoMensalPage.tsx`, no grid de KPIs, adicionar após "Total despesas fixas":
```tsx
            <KpiCard label="Despesas variáveis" valor={formatarBRL(dados.totalDespesasVariaveis)} variante="yellow" />
            <KpiCard label="Compras (notas)" valor={formatarBRL(dados.totalCompras)} variante="blue" />
            <KpiCard label="Total de saídas (mês)" valor={formatarBRL(dados.totalSaidas)} variante="red" />
```
E ajustar o label de margem operacional para deixar claro: `label="Margem operacional (s/ vendas)"`.
> O import de `CATEGORIA_DESPESA_LABELS` continua de `../../shared/competencia` (inalterado).

- [ ] **Step 3: Type-check + lint** — `npx tsc --noEmit` e `npx eslint src/features/financeiro/fechamento-mensal` (limpos).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/financeiro/fechamento-mensal
git commit -m "feat(financeiro): fechamento mostra despesas variaveis, compras e total de saidas"
```

---

## TASK 10 — Sidebar + verificação final + push + E2E

**Files:**
- Modify: `frontend/src/routes/AppRoutes.tsx`, `frontend/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Rota** — em `AppRoutes.tsx`, trocar o import e a rota:
```tsx
import { DespesasPage } from '@/features/financeiro/despesas/pages/DespesasPage'
```
```tsx
          <Route path="/financeiro/despesas" element={<DespesasPage />} />
```
(remover o import/rota antigos de `DespesasFixasPage`).

- [ ] **Step 2: Sidebar** — no grupo Financeiro, trocar o label do primeiro item:
```tsx
                { label: 'Despesas', href: '/financeiro/despesas', icon: CurrencyDollarIcon },
```
(rota inalterada `/financeiro/despesas`; só o label muda de "Despesas Fixas" → "Despesas").

- [ ] **Step 3: Verificação completa**

Run (frontend): `npx tsc --noEmit` e `npx eslint src/features/financeiro src/components/layout/Sidebar.tsx src/routes/AppRoutes.tsx` → limpos.
Run (CasaDiAna): `dotnet build src/CasaDiAna.API` e `dotnet test tests/CasaDiAna.Application.Tests` → build ok, todos PASS.

- [ ] **Step 4: Commit + push**

```bash
git add frontend/src/routes/AppRoutes.tsx frontend/src/components/layout/Sidebar.tsx
git commit -m "feat(financeiro): rota/label Despesas na sidebar"
git push origin master
```

- [ ] **Step 5: E2E no staging (após deploy)**

Login seed; com bearer token e competência `2099-02-01`:
1. `POST /api/despesas {competencia,tipo:"fixa",categoria:"aluguel",valor:1000,...}` → 201.
2. `POST /api/despesas {tipo:"variavel",categoria:"taxaCartao",valor:150,...}` → 201.
3. `GET /api/despesas?competencia=2099-02-01` → `totalFixas:1000`, `totalVariaveis:150`.
4. `GET /api/despesas?competencia=2099-02-01&tipo=variavel` → 1 item.
5. `GET /api/despesas/compras?competencia=2099-02-01` → `totalCompras` (0 se sem notas no mês).
6. `GET /api/fechamento-mensal?competencia=2099-02-01` → `totalDespesasVariaveis:150`, `totalCompras`, `totalSaidas`, `despesaFixaPercentual` só com fixas.
7. `DELETE` as 2 despesas (cleanup) → 204.

---

## Self-review (preenchido)

**Cobertura do spec:**
- Despesa com tipo fixa/variável (CRUD) → Tasks 2–3, 6, 8. ✓
- Categorias variáveis (taxa cartão, comissão delivery, embalagens, frete) → Tasks 1, 7. ✓
- Compras read-only das notas → Tasks 4, 6, 8. ✓
- Fechamento: variáveis + compras + total de saídas + margem operacional recalculada; % despesa fixa só fixas → Task 5, 9. ✓
- Precificação inalterada (lê `DespesaFixaPercentual` = só fixas) → confirmado na Task 5. ✓
- Migration preserva dados (RenameTable + backfill tipo=Fixa) → Task 2 steps 8–9. ✓
- Sidebar/rota "Despesas"; Admin+Coordenador → Tasks 6, 10. ✓

**Consistência de tipos:** `Despesa`/`DespesaDto`/`DespesasMesDto`/`ComprasMesDto`/`CompraNotaDto`
(backend) ↔ TS equivalentes; `FechamentoMensalDto` com 15 campos posicionais (atualizar o mock
do teste de precificação — alertado na Task 5). `Despesa.NormalizarCompetencia` reusado por
`FaturamentoMensal`, fechamento, listar, compras e precificação. `TotalCategoriaDto` movido p/
namespace `Despesas.Dtos` — `using` atualizado em FechamentoMensalDto e testes.

**Pontos de atenção para o executor:**
- A migration **deve** ser editada à mão (Task 2 Step 9) — o EF geraria DropTable+CreateTable e perderia dados.
- O construtor posicional de `FechamentoMensalDto` mudou (15 campos) — atualizar TODOS os locais que o constroem (handler + 2 testes: fechamento e precificação).
- Deletar a pasta antiga `despesas-fixas` (frontend) e os testes antigos `DespesasFixas` (backend).
- Enums seguem string camelCase na wire; novas categorias `taxaCartao/comissaoDelivery/embalagens/frete`.
