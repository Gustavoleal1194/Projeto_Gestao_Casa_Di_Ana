# Despesas Fixas + Fechamento Mensal (Fase 1) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a camada de despesas fixas mensais e o fechamento mensal consolidado (faturamento, custo direto, % despesa fixa, margem bruta/operacional, prime cost), sem tocar na ficha técnica.

**Architecture:** Clean Architecture + CQRS no backend (.NET 8). Duas entidades novas (`DespesaFixa`, `FaturamentoMensal`) em schema `financeiro`. O fechamento é uma query calculada que reaproveita `VendaDiaria × PrecoVenda` (faturamento) e `Produto.CalcularCustoFicha()` (custo direto). Frontend React 18 + TS com novo grupo "Financeiro" (2 telas), restrito a Admin/Coordenador.

**Tech Stack:** ASP.NET Core 8, EF Core (Npgsql), MediatR, FluentValidation, xUnit + Moq + FluentAssertions; React 18, TypeScript, Tailwind v4, axios.

**Spec:** `docs/superpowers/specs/2026-06-09-despesas-fixas-fechamento-mensal-design.md`

---

## Estrutura de arquivos

### Backend
```
Domain/Enums/CategoriaDespesaFixa.cs                         (criar)
Domain/Entities/DespesaFixa.cs                               (criar)
Domain/Entities/FaturamentoMensal.cs                         (criar)
Domain/Interfaces/IDespesaFixaRepository.cs                  (criar)
Domain/Interfaces/IFaturamentoMensalRepository.cs            (criar)
Domain/Interfaces/IProdutoRepository.cs                      (modificar — add ListarComFichaAsync)

Application/DespesasFixas/Dtos/DespesaFixaDto.cs             (criar)
Application/DespesasFixas/Dtos/TotalCategoriaDto.cs          (criar)
Application/DespesasFixas/Dtos/DespesasFixasMesDto.cs        (criar)
Application/DespesasFixas/Commands/CriarDespesaFixa/*        (criar — Command, Handler, Validator)
Application/DespesasFixas/Commands/AtualizarDespesaFixa/*    (criar)
Application/DespesasFixas/Commands/CancelarDespesaFixa/*     (criar)
Application/DespesasFixas/Queries/ListarDespesasFixas/*      (criar)
Application/FechamentoMensal/Dtos/FechamentoMensalDto.cs     (criar)
Application/FechamentoMensal/Dtos/FaturamentoMensalDto.cs    (criar)
Application/FechamentoMensal/Commands/DefinirFaturamentoManual/* (criar)
Application/FechamentoMensal/Queries/ObterFechamentoMensal/* (criar)

Infrastructure/Persistence/Configurations/DespesaFixaConfiguration.cs        (criar)
Infrastructure/Persistence/Configurations/FaturamentoMensalConfiguration.cs  (criar)
Infrastructure/Persistence/AppDbContext.cs                  (modificar — 2 DbSets)
Infrastructure/Repositories/DespesaFixaRepository.cs        (criar)
Infrastructure/Repositories/FaturamentoMensalRepository.cs  (criar)
Infrastructure/Repositories/ProdutoRepository.cs            (modificar — ListarComFichaAsync)
Infrastructure/DependencyInjection.cs                       (modificar — 2 repos)
Infrastructure/Persistence/Migrations/*                     (gerado pela migration)

API/Controllers/DespesasFixasController.cs                  (criar)
API/Controllers/FechamentoMensalController.cs               (criar)

tests/CasaDiAna.Application.Tests/DespesasFixas/*           (criar)
tests/CasaDiAna.Application.Tests/FechamentoMensal/*        (criar)
```

### Frontend
```
features/financeiro/despesas-fixas/services/despesasFixasService.ts   (criar)
features/financeiro/despesas-fixas/hooks/useDespesasFixas.ts          (criar)
features/financeiro/despesas-fixas/components/ModalDespesaFixa.tsx     (criar)
features/financeiro/despesas-fixas/components/TabelaDespesasFixas.tsx  (criar)
features/financeiro/despesas-fixas/pages/DespesasFixasPage.tsx         (criar)
features/financeiro/fechamento-mensal/services/fechamentoService.ts   (criar)
features/financeiro/fechamento-mensal/pages/FechamentoMensalPage.tsx  (criar)
features/financeiro/shared/competencia.ts                             (criar — helpers + labels)
components/layout/Sidebar.tsx                                          (modificar — grupo Financeiro)
routes/AppRoutes.tsx                                                   (modificar — 2 rotas)
```

**Convenção de competência:** sempre o 1º dia do mês. Backend normaliza ao salvar/filtrar; frontend envia `YYYY-MM-01`.

---

## TASK 1 — Enum `CategoriaDespesaFixa`

**Files:**
- Create: `src/CasaDiAna.Domain/Enums/CategoriaDespesaFixa.cs`

- [ ] **Step 1: Criar o enum**

```csharp
namespace CasaDiAna.Domain.Enums;

public enum CategoriaDespesaFixa
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
    Outros = 11
}
```

- [ ] **Step 2: Build**

Run: `dotnet build src/CasaDiAna.API`
Expected: Build succeeded.

---

## TASK 2 — Entidade `DespesaFixa` (TDD)

**Files:**
- Create: `src/CasaDiAna.Domain/Entities/DespesaFixa.cs`
- Test: `tests/CasaDiAna.Application.Tests/DespesasFixas/DespesaFixaTests.cs`

- [ ] **Step 1: Escrever o teste que falha**

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.DespesasFixas;

public class DespesaFixaTests
{
    [Fact]
    public void Criar_DeveNormalizarCompetenciaParaPrimeiroDiaDoMes()
    {
        var d = DespesaFixa.Criar(
            competencia: new DateTime(2026, 6, 17),
            categoria: CategoriaDespesaFixa.Aluguel,
            descricao: "Aluguel loja",
            valor: 3500m,
            observacao: null,
            dataLancamento: new DateTime(2026, 6, 17),
            criadoPor: Guid.NewGuid());

        d.Competencia.Should().Be(new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc));
        d.Ativo.Should().BeTrue();
        d.Valor.Should().Be(3500m);
    }

    [Fact]
    public void Criar_DeveLancar_QuandoValorZeroOuNegativo()
    {
        var acao = () => DespesaFixa.Criar(
            new DateTime(2026, 6, 1), CategoriaDespesaFixa.Energia, null, 0m, null,
            DateTime.Today, Guid.NewGuid());

        acao.Should().Throw<DomainException>()
            .WithMessage("Valor da despesa deve ser maior que zero.");
    }

    [Fact]
    public void Cancelar_DeveMarcarInativo()
    {
        var d = DespesaFixa.Criar(new DateTime(2026, 6, 1), CategoriaDespesaFixa.Gas, null, 200m, null,
            DateTime.Today, Guid.NewGuid());

        d.Cancelar(Guid.NewGuid());

        d.Ativo.Should().BeFalse();
    }
}
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter DespesaFixaTests`
Expected: FAIL — `DespesaFixa` não existe.

- [ ] **Step 3: Criar a entidade**

```csharp
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class DespesaFixa
{
    public Guid Id { get; private set; }
    public DateTime Competencia { get; private set; }
    public CategoriaDespesaFixa Categoria { get; private set; }
    public string? Descricao { get; private set; }
    public decimal Valor { get; private set; }
    public string? Observacao { get; private set; }
    public DateTime DataLancamento { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    private DespesaFixa() { }

    public static DateTime NormalizarCompetencia(DateTime data) =>
        new(data.Year, data.Month, 1, 0, 0, 0, DateTimeKind.Utc);

    public static DespesaFixa Criar(
        DateTime competencia,
        CategoriaDespesaFixa categoria,
        string? descricao,
        decimal valor,
        string? observacao,
        DateTime dataLancamento,
        Guid criadoPor)
    {
        if (valor <= 0)
            throw new DomainException("Valor da despesa deve ser maior que zero.");

        return new DespesaFixa
        {
            Id = Guid.NewGuid(),
            Competencia = NormalizarCompetencia(competencia),
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
        DateTime competencia,
        CategoriaDespesaFixa categoria,
        string? descricao,
        decimal valor,
        string? observacao,
        DateTime dataLancamento,
        Guid atualizadoPor)
    {
        if (valor <= 0)
            throw new DomainException("Valor da despesa deve ser maior que zero.");

        Competencia = NormalizarCompetencia(competencia);
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

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter DespesaFixaTests`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/CasaDiAna.Domain/Enums/CategoriaDespesaFixa.cs src/CasaDiAna.Domain/Entities/DespesaFixa.cs tests/CasaDiAna.Application.Tests/DespesasFixas/DespesaFixaTests.cs
git commit -m "feat(financeiro): entidade DespesaFixa e enum de categorias"
```

---

## TASK 3 — Entidade `FaturamentoMensal` (TDD)

**Files:**
- Create: `src/CasaDiAna.Domain/Entities/FaturamentoMensal.cs`
- Test: `tests/CasaDiAna.Application.Tests/FechamentoMensal/FaturamentoMensalTests.cs`

- [ ] **Step 1: Escrever o teste que falha**

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.FechamentoMensal;

public class FaturamentoMensalTests
{
    [Fact]
    public void Criar_DeveNormalizarCompetencia()
    {
        var f = FaturamentoMensal.Criar(new DateTime(2026, 6, 20), 50000m, Guid.NewGuid());
        f.Competencia.Should().Be(new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc));
        f.ValorManual.Should().Be(50000m);
    }

    [Fact]
    public void DefinirValor_DevePermitirLimparComNull()
    {
        var f = FaturamentoMensal.Criar(new DateTime(2026, 6, 1), 50000m, Guid.NewGuid());
        f.DefinirValor(null, Guid.NewGuid());
        f.ValorManual.Should().BeNull();
    }

    [Fact]
    public void DefinirValor_DeveLancar_QuandoZeroOuNegativo()
    {
        var f = FaturamentoMensal.Criar(new DateTime(2026, 6, 1), null, Guid.NewGuid());
        var acao = () => f.DefinirValor(0m, Guid.NewGuid());
        acao.Should().Throw<DomainException>()
            .WithMessage("Faturamento manual deve ser maior que zero.");
    }
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter FaturamentoMensalTests`
Expected: FAIL — tipo não existe.

- [ ] **Step 3: Criar a entidade**

```csharp
using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class FaturamentoMensal
{
    public Guid Id { get; private set; }
    public DateTime Competencia { get; private set; }
    public decimal? ValorManual { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    private FaturamentoMensal() { }

    public static FaturamentoMensal Criar(DateTime competencia, decimal? valorManual, Guid criadoPor)
    {
        if (valorManual is <= 0)
            throw new DomainException("Faturamento manual deve ser maior que zero.");

        return new FaturamentoMensal
        {
            Id = Guid.NewGuid(),
            Competencia = DespesaFixa.NormalizarCompetencia(competencia),
            ValorManual = valorManual,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor,
            AtualizadoPor = criadoPor
        };
    }

    public void DefinirValor(decimal? valorManual, Guid atualizadoPor)
    {
        if (valorManual is <= 0)
            throw new DomainException("Faturamento manual deve ser maior que zero.");

        ValorManual = valorManual;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter FaturamentoMensalTests`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/CasaDiAna.Domain/Entities/FaturamentoMensal.cs tests/CasaDiAna.Application.Tests/FechamentoMensal/FaturamentoMensalTests.cs
git commit -m "feat(financeiro): entidade FaturamentoMensal (override de faturamento)"
```

---

## TASK 4 — Interfaces de repositório

**Files:**
- Create: `src/CasaDiAna.Domain/Interfaces/IDespesaFixaRepository.cs`
- Create: `src/CasaDiAna.Domain/Interfaces/IFaturamentoMensalRepository.cs`
- Modify: `src/CasaDiAna.Domain/Interfaces/IProdutoRepository.cs`

- [ ] **Step 1: `IDespesaFixaRepository`**

```csharp
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IDespesaFixaRepository
{
    Task<DespesaFixa?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<DespesaFixa>> ListarPorCompetenciaAsync(DateTime competencia, CancellationToken ct = default);
    Task AdicionarAsync(DespesaFixa despesa, CancellationToken ct = default);
    void Atualizar(DespesaFixa despesa);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

- [ ] **Step 2: `IFaturamentoMensalRepository`**

```csharp
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IFaturamentoMensalRepository
{
    Task<FaturamentoMensal?> ObterPorCompetenciaAsync(DateTime competencia, CancellationToken ct = default);
    Task AdicionarAsync(FaturamentoMensal faturamento, CancellationToken ct = default);
    void Atualizar(FaturamentoMensal faturamento);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

- [ ] **Step 3: Adicionar método em `IProdutoRepository`**

Adicionar esta assinatura dentro da interface existente (depois de `ListarAsync`):

```csharp
    Task<IReadOnlyList<Produto>> ListarComFichaAsync(bool apenasAtivos = false, CancellationToken ct = default);
```

- [ ] **Step 4: Commit** (compila depois da Task 5; commit junto na Task 5)

---

## TASK 5 — Repositórios + EF + DI + Migration

**Files:**
- Create: `src/CasaDiAna.Infrastructure/Repositories/DespesaFixaRepository.cs`
- Create: `src/CasaDiAna.Infrastructure/Repositories/FaturamentoMensalRepository.cs`
- Modify: `src/CasaDiAna.Infrastructure/Repositories/ProdutoRepository.cs`
- Create: `src/CasaDiAna.Infrastructure/Persistence/Configurations/DespesaFixaConfiguration.cs`
- Create: `src/CasaDiAna.Infrastructure/Persistence/Configurations/FaturamentoMensalConfiguration.cs`
- Modify: `src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs`
- Modify: `src/CasaDiAna.Infrastructure/DependencyInjection.cs`

- [ ] **Step 1: `DespesaFixaRepository`**

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class DespesaFixaRepository : IDespesaFixaRepository
{
    private readonly AppDbContext _db;

    public DespesaFixaRepository(AppDbContext db) => _db = db;

    public Task<DespesaFixa?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.DespesasFixas.FirstOrDefaultAsync(d => d.Id == id, ct);

    public async Task<IReadOnlyList<DespesaFixa>> ListarPorCompetenciaAsync(
        DateTime competencia, CancellationToken ct = default)
    {
        var comp = DespesaFixa.NormalizarCompetencia(competencia);
        return await _db.DespesasFixas
            .Where(d => d.Ativo && d.Competencia == comp)
            .OrderBy(d => d.Categoria)
            .ThenByDescending(d => d.DataLancamento)
            .ToListAsync(ct);
    }

    public async Task AdicionarAsync(DespesaFixa despesa, CancellationToken ct = default) =>
        await _db.DespesasFixas.AddAsync(despesa, ct);

    public void Atualizar(DespesaFixa despesa) => _db.DespesasFixas.Update(despesa);

    public Task<int> SalvarAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
```

- [ ] **Step 2: `FaturamentoMensalRepository`**

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class FaturamentoMensalRepository : IFaturamentoMensalRepository
{
    private readonly AppDbContext _db;

    public FaturamentoMensalRepository(AppDbContext db) => _db = db;

    public Task<FaturamentoMensal?> ObterPorCompetenciaAsync(DateTime competencia, CancellationToken ct = default)
    {
        var comp = DespesaFixa.NormalizarCompetencia(competencia);
        return _db.FaturamentosMensais.FirstOrDefaultAsync(f => f.Competencia == comp, ct);
    }

    public async Task AdicionarAsync(FaturamentoMensal faturamento, CancellationToken ct = default) =>
        await _db.FaturamentosMensais.AddAsync(faturamento, ct);

    public void Atualizar(FaturamentoMensal faturamento) => _db.FaturamentosMensais.Update(faturamento);

    public Task<int> SalvarAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
```

- [ ] **Step 3: Adicionar `ListarComFichaAsync` em `ProdutoRepository`**

Inserir depois de `ListarAsync` (antes de `NomeExisteAsync`):

```csharp
    public async Task<IReadOnlyList<Produto>> ListarComFichaAsync(
        bool apenasAtivos = false, CancellationToken ct = default)
    {
        var query = _db.Produtos
            .Include(p => p.Categoria)
            .Include(p => p.ItensFicha)
                .ThenInclude(i => i.Ingrediente)
            .AsQueryable();
        if (apenasAtivos)
            query = query.Where(p => p.Ativo);
        return await query.OrderBy(p => p.Nome).ToListAsync(ct);
    }
```

- [ ] **Step 4: `DespesaFixaConfiguration`**

```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class DespesaFixaConfiguration : IEntityTypeConfiguration<DespesaFixa>
{
    public void Configure(EntityTypeBuilder<DespesaFixa> builder)
    {
        builder.ToTable("despesas_fixas", "financeiro");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasColumnName("id");
        builder.Property(d => d.Competencia).HasColumnName("competencia").IsRequired();
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

        builder.HasIndex(d => d.Competencia).HasDatabaseName("ix_despesas_fixas_competencia");
    }
}
```

- [ ] **Step 5: `FaturamentoMensalConfiguration`**

```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class FaturamentoMensalConfiguration : IEntityTypeConfiguration<FaturamentoMensal>
{
    public void Configure(EntityTypeBuilder<FaturamentoMensal> builder)
    {
        builder.ToTable("faturamentos_mensais", "financeiro");
        builder.HasKey(f => f.Id);
        builder.Property(f => f.Id).HasColumnName("id");
        builder.Property(f => f.Competencia).HasColumnName("competencia").IsRequired();
        builder.Property(f => f.ValorManual).HasColumnName("valor_manual").HasPrecision(15, 2);
        builder.Property(f => f.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(f => f.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(f => f.CriadoPor).HasColumnName("criado_por").IsRequired();
        builder.Property(f => f.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();

        builder.HasIndex(f => f.Competencia).IsUnique().HasDatabaseName("ix_faturamentos_mensais_competencia");
    }
}
```

- [ ] **Step 6: Adicionar DbSets no `AppDbContext`**

Inserir após a linha `public DbSet<ModeloEtiquetaNutricional> ...`:

```csharp
    public DbSet<DespesaFixa> DespesasFixas => Set<DespesaFixa>();
    public DbSet<FaturamentoMensal> FaturamentosMensais => Set<FaturamentoMensal>();
```

- [ ] **Step 7: Registrar repositórios na DI**

Em `DependencyInjection.cs`, após `services.AddScoped<IModeloEtiquetaNutricionalRepository, ModeloEtiquetaNutricionalRepository>();`:

```csharp
        services.AddScoped<IDespesaFixaRepository, DespesaFixaRepository>();
        services.AddScoped<IFaturamentoMensalRepository, FaturamentoMensalRepository>();
```

- [ ] **Step 8: Build**

Run: `dotnet build src/CasaDiAna.API`
Expected: Build succeeded.

- [ ] **Step 9: Gerar a migration**

Run:
```bash
dotnet ef migrations add AddDespesasFixasEFechamentoMensal --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API
```
Expected: cria arquivos em `Infrastructure/Persistence/Migrations/`. Abrir o `*_AddDespesasFixasEFechamentoMensal.cs` e confirmar que cria o schema `financeiro`, as tabelas `despesas_fixas` e `faturamentos_mensais` e o índice único em `faturamentos_mensais.competencia`.

- [ ] **Step 10: Aplicar a migration**

Run:
```bash
dotnet ef database update --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API
```
Expected: aplica sem erro.

- [ ] **Step 11: Commit**

```bash
git add src/CasaDiAna.Domain/Interfaces src/CasaDiAna.Infrastructure
git commit -m "feat(financeiro): repositórios, EF config, DbSets, DI e migration"
```

---

## TASK 6 — DTOs de despesas fixas

**Files:**
- Create: `src/CasaDiAna.Application/DespesasFixas/Dtos/DespesaFixaDto.cs`
- Create: `src/CasaDiAna.Application/DespesasFixas/Dtos/TotalCategoriaDto.cs`
- Create: `src/CasaDiAna.Application/DespesasFixas/Dtos/DespesasFixasMesDto.cs`

- [ ] **Step 1: DTOs**

`DespesaFixaDto.cs`:
```csharp
using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Application.DespesasFixas.Dtos;

public record DespesaFixaDto(
    Guid Id,
    DateTime Competencia,
    CategoriaDespesaFixa Categoria,
    string? Descricao,
    decimal Valor,
    string? Observacao,
    DateTime DataLancamento,
    bool Ativo);
```

`TotalCategoriaDto.cs`:
```csharp
using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Application.DespesasFixas.Dtos;

public record TotalCategoriaDto(CategoriaDespesaFixa Categoria, decimal Total);
```

`DespesasFixasMesDto.cs`:
```csharp
namespace CasaDiAna.Application.DespesasFixas.Dtos;

public record DespesasFixasMesDto(
    DateTime Competencia,
    decimal Total,
    IReadOnlyList<DespesaFixaDto> Itens,
    IReadOnlyList<TotalCategoriaDto> TotalPorCategoria);
```

- [ ] **Step 2: Build**

Run: `dotnet build src/CasaDiAna.API`
Expected: Build succeeded.

---

## TASK 7 — Command `CriarDespesaFixa` (TDD)

**Files:**
- Create: `src/CasaDiAna.Application/DespesasFixas/Commands/CriarDespesaFixa/CriarDespesaFixaCommand.cs`
- Create: `.../CriarDespesaFixaCommandHandler.cs`
- Create: `.../CriarDespesaFixaCommandValidator.cs`
- Test: `tests/CasaDiAna.Application.Tests/DespesasFixas/CriarDespesaFixaCommandHandlerTests.cs`

- [ ] **Step 1: Command**

```csharp
using CasaDiAna.Application.DespesasFixas.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.DespesasFixas.Commands.CriarDespesaFixa;

public record CriarDespesaFixaCommand(
    DateTime Competencia,
    CategoriaDespesaFixa Categoria,
    string? Descricao,
    decimal Valor,
    string? Observacao,
    DateTime DataLancamento) : IRequest<DespesaFixaDto>;
```

- [ ] **Step 2: Validator**

```csharp
using FluentValidation;

namespace CasaDiAna.Application.DespesasFixas.Commands.CriarDespesaFixa;

public class CriarDespesaFixaCommandValidator : AbstractValidator<CriarDespesaFixaCommand>
{
    public CriarDespesaFixaCommandValidator()
    {
        RuleFor(x => x.Competencia).NotEmpty().WithMessage("Competência é obrigatória.");
        RuleFor(x => x.Categoria).IsInEnum().WithMessage("Categoria inválida.");
        RuleFor(x => x.Valor).GreaterThan(0).WithMessage("Valor deve ser maior que zero.");
        RuleFor(x => x.DataLancamento).NotEmpty().WithMessage("Data de lançamento é obrigatória.");
        RuleFor(x => x.Descricao).MaximumLength(200).WithMessage("Descrição deve ter no máximo 200 caracteres.");
        RuleFor(x => x.Observacao).MaximumLength(500).WithMessage("Observação deve ter no máximo 500 caracteres.");
    }
}
```

- [ ] **Step 3: Escrever o teste que falha**

```csharp
using CasaDiAna.Application.DespesasFixas.Commands.CriarDespesaFixa;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Application.Common;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.DespesasFixas;

public class CriarDespesaFixaCommandHandlerTests
{
    private readonly Mock<IDespesaFixaRepository> _repo = new();
    private readonly Mock<ICurrentUserService> _user = new();
    private readonly CriarDespesaFixaCommandHandler _handler;

    public CriarDespesaFixaCommandHandlerTests()
    {
        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _repo.Setup(r => r.AdicionarAsync(It.IsAny<DespesaFixa>(), default)).Returns(Task.CompletedTask);
        _repo.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _handler = new CriarDespesaFixaCommandHandler(_repo.Object, _user.Object);
    }

    [Fact]
    public async Task DeveCriarDespesa_NormalizandoCompetencia()
    {
        var cmd = new CriarDespesaFixaCommand(
            new DateTime(2026, 6, 17), CategoriaDespesaFixa.Aluguel, "Loja", 3500m, null, new DateTime(2026, 6, 17));

        var dto = await _handler.Handle(cmd, CancellationToken.None);

        dto.Categoria.Should().Be(CategoriaDespesaFixa.Aluguel);
        dto.Valor.Should().Be(3500m);
        dto.Competencia.Should().Be(new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc));
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<DespesaFixa>(), default), Times.Once);
        _repo.Verify(r => r.SalvarAsync(default), Times.Once);
    }
}
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter CriarDespesaFixaCommandHandlerTests`
Expected: FAIL — handler não existe.

- [ ] **Step 5: Handler**

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.DespesasFixas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.DespesasFixas.Commands.CriarDespesaFixa;

public class CriarDespesaFixaCommandHandler : IRequestHandler<CriarDespesaFixaCommand, DespesaFixaDto>
{
    private readonly IDespesaFixaRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public CriarDespesaFixaCommandHandler(IDespesaFixaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<DespesaFixaDto> Handle(CriarDespesaFixaCommand request, CancellationToken cancellationToken)
    {
        var despesa = DespesaFixa.Criar(
            request.Competencia,
            request.Categoria,
            request.Descricao,
            request.Valor,
            request.Observacao,
            request.DataLancamento,
            _currentUser.UsuarioId);

        await _repo.AdicionarAsync(despesa, cancellationToken);
        await _repo.SalvarAsync(cancellationToken);

        return ToDto(despesa);
    }

    internal static DespesaFixaDto ToDto(DespesaFixa d) =>
        new(d.Id, d.Competencia, d.Categoria, d.Descricao, d.Valor, d.Observacao, d.DataLancamento, d.Ativo);
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter CriarDespesaFixaCommandHandlerTests`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/CasaDiAna.Application/DespesasFixas tests/CasaDiAna.Application.Tests/DespesasFixas/CriarDespesaFixaCommandHandlerTests.cs
git commit -m "feat(financeiro): command CriarDespesaFixa"
```

---

## TASK 8 — Commands `AtualizarDespesaFixa` e `CancelarDespesaFixa`

**Files:**
- Create: `.../Commands/AtualizarDespesaFixa/AtualizarDespesaFixaCommand.cs`
- Create: `.../AtualizarDespesaFixaCommandHandler.cs`
- Create: `.../AtualizarDespesaFixaCommandValidator.cs`
- Create: `.../Commands/CancelarDespesaFixa/CancelarDespesaFixaCommand.cs`
- Create: `.../CancelarDespesaFixaCommandHandler.cs`
- Test: `tests/CasaDiAna.Application.Tests/DespesasFixas/AtualizarECancelarDespesaFixaTests.cs`

- [ ] **Step 1: `AtualizarDespesaFixaCommand`**

```csharp
using CasaDiAna.Application.DespesasFixas.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.DespesasFixas.Commands.AtualizarDespesaFixa;

public record AtualizarDespesaFixaCommand(
    Guid Id,
    DateTime Competencia,
    CategoriaDespesaFixa Categoria,
    string? Descricao,
    decimal Valor,
    string? Observacao,
    DateTime DataLancamento) : IRequest<DespesaFixaDto>;
```

- [ ] **Step 2: `AtualizarDespesaFixaCommandValidator`**

```csharp
using FluentValidation;

namespace CasaDiAna.Application.DespesasFixas.Commands.AtualizarDespesaFixa;

public class AtualizarDespesaFixaCommandValidator : AbstractValidator<AtualizarDespesaFixaCommand>
{
    public AtualizarDespesaFixaCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Id é obrigatório.");
        RuleFor(x => x.Competencia).NotEmpty().WithMessage("Competência é obrigatória.");
        RuleFor(x => x.Categoria).IsInEnum().WithMessage("Categoria inválida.");
        RuleFor(x => x.Valor).GreaterThan(0).WithMessage("Valor deve ser maior que zero.");
        RuleFor(x => x.DataLancamento).NotEmpty().WithMessage("Data de lançamento é obrigatória.");
        RuleFor(x => x.Descricao).MaximumLength(200).WithMessage("Descrição deve ter no máximo 200 caracteres.");
        RuleFor(x => x.Observacao).MaximumLength(500).WithMessage("Observação deve ter no máximo 500 caracteres.");
    }
}
```

- [ ] **Step 3: `AtualizarDespesaFixaCommandHandler`**

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.DespesasFixas.Commands.CriarDespesaFixa;
using CasaDiAna.Application.DespesasFixas.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.DespesasFixas.Commands.AtualizarDespesaFixa;

public class AtualizarDespesaFixaCommandHandler : IRequestHandler<AtualizarDespesaFixaCommand, DespesaFixaDto>
{
    private readonly IDespesaFixaRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public AtualizarDespesaFixaCommandHandler(IDespesaFixaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<DespesaFixaDto> Handle(AtualizarDespesaFixaCommand request, CancellationToken cancellationToken)
    {
        var despesa = await _repo.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Despesa não encontrada.");

        despesa.Atualizar(
            request.Competencia,
            request.Categoria,
            request.Descricao,
            request.Valor,
            request.Observacao,
            request.DataLancamento,
            _currentUser.UsuarioId);

        _repo.Atualizar(despesa);
        await _repo.SalvarAsync(cancellationToken);

        return CriarDespesaFixaCommandHandler.ToDto(despesa);
    }
}
```

- [ ] **Step 4: `CancelarDespesaFixaCommand`**

```csharp
using MediatR;

namespace CasaDiAna.Application.DespesasFixas.Commands.CancelarDespesaFixa;

public record CancelarDespesaFixaCommand(Guid Id) : IRequest;
```

- [ ] **Step 5: `CancelarDespesaFixaCommandHandler`**

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.DespesasFixas.Commands.CancelarDespesaFixa;

public class CancelarDespesaFixaCommandHandler : IRequestHandler<CancelarDespesaFixaCommand>
{
    private readonly IDespesaFixaRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public CancelarDespesaFixaCommandHandler(IDespesaFixaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task Handle(CancelarDespesaFixaCommand request, CancellationToken cancellationToken)
    {
        var despesa = await _repo.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Despesa não encontrada.");

        despesa.Cancelar(_currentUser.UsuarioId);
        _repo.Atualizar(despesa);
        await _repo.SalvarAsync(cancellationToken);
    }
}
```

- [ ] **Step 6: Teste (atualizar + cancelar)**

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.DespesasFixas.Commands.AtualizarDespesaFixa;
using CasaDiAna.Application.DespesasFixas.Commands.CancelarDespesaFixa;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.DespesasFixas;

public class AtualizarECancelarDespesaFixaTests
{
    private readonly Mock<IDespesaFixaRepository> _repo = new();
    private readonly Mock<ICurrentUserService> _user = new();

    public AtualizarECancelarDespesaFixaTests()
    {
        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _repo.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
    }

    private static DespesaFixa Existente() => DespesaFixa.Criar(
        new DateTime(2026, 6, 1), CategoriaDespesaFixa.Energia, "Luz", 800m, null,
        new DateTime(2026, 6, 5), Guid.NewGuid());

    [Fact]
    public async Task Atualizar_DeveAlterarValorECategoria()
    {
        var despesa = Existente();
        _repo.Setup(r => r.ObterPorIdAsync(despesa.Id, default)).ReturnsAsync(despesa);
        var handler = new AtualizarDespesaFixaCommandHandler(_repo.Object, _user.Object);

        var dto = await handler.Handle(new AtualizarDespesaFixaCommand(
            despesa.Id, new DateTime(2026, 6, 1), CategoriaDespesaFixa.Agua, "Água", 950m, "reajuste",
            new DateTime(2026, 6, 5)), CancellationToken.None);

        dto.Categoria.Should().Be(CategoriaDespesaFixa.Agua);
        dto.Valor.Should().Be(950m);
    }

    [Fact]
    public async Task Atualizar_DeveLancar_QuandoNaoEncontrada()
    {
        _repo.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync((DespesaFixa?)null);
        var handler = new AtualizarDespesaFixaCommandHandler(_repo.Object, _user.Object);

        var acao = () => handler.Handle(new AtualizarDespesaFixaCommand(
            Guid.NewGuid(), new DateTime(2026, 6, 1), CategoriaDespesaFixa.Agua, null, 1m, null, DateTime.Today),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>().WithMessage("Despesa não encontrada.");
    }

    [Fact]
    public async Task Cancelar_DeveMarcarInativo()
    {
        var despesa = Existente();
        _repo.Setup(r => r.ObterPorIdAsync(despesa.Id, default)).ReturnsAsync(despesa);
        var handler = new CancelarDespesaFixaCommandHandler(_repo.Object, _user.Object);

        await handler.Handle(new CancelarDespesaFixaCommand(despesa.Id), CancellationToken.None);

        despesa.Ativo.Should().BeFalse();
        _repo.Verify(r => r.SalvarAsync(default), Times.Once);
    }
}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter AtualizarECancelarDespesaFixaTests`
Expected: PASS (3 testes).

- [ ] **Step 8: Commit**

```bash
git add src/CasaDiAna.Application/DespesasFixas tests/CasaDiAna.Application.Tests/DespesasFixas/AtualizarECancelarDespesaFixaTests.cs
git commit -m "feat(financeiro): commands AtualizarDespesaFixa e CancelarDespesaFixa"
```

---

## TASK 9 — Query `ListarDespesasFixas` (TDD)

**Files:**
- Create: `.../Queries/ListarDespesasFixas/ListarDespesasFixasQuery.cs`
- Create: `.../ListarDespesasFixasQueryHandler.cs`
- Test: `tests/CasaDiAna.Application.Tests/DespesasFixas/ListarDespesasFixasQueryHandlerTests.cs`

- [ ] **Step 1: Query**

```csharp
using CasaDiAna.Application.DespesasFixas.Dtos;
using MediatR;

namespace CasaDiAna.Application.DespesasFixas.Queries.ListarDespesasFixas;

public record ListarDespesasFixasQuery(DateTime Competencia) : IRequest<DespesasFixasMesDto>;
```

- [ ] **Step 2: Escrever o teste que falha**

```csharp
using CasaDiAna.Application.DespesasFixas.Queries.ListarDespesasFixas;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.DespesasFixas;

public class ListarDespesasFixasQueryHandlerTests
{
    [Fact]
    public async Task DeveSomarTotalETotalPorCategoria()
    {
        var comp = new DateTime(2026, 6, 1);
        var criadoPor = Guid.NewGuid();
        var lista = new List<DespesaFixa>
        {
            DespesaFixa.Criar(comp, CategoriaDespesaFixa.Aluguel, null, 3000m, null, comp, criadoPor),
            DespesaFixa.Criar(comp, CategoriaDespesaFixa.Energia, null, 800m, null, comp, criadoPor),
            DespesaFixa.Criar(comp, CategoriaDespesaFixa.Energia, null, 200m, null, comp, criadoPor),
        };
        var repo = new Mock<IDespesaFixaRepository>();
        repo.Setup(r => r.ListarPorCompetenciaAsync(comp, default)).ReturnsAsync(lista);
        var handler = new ListarDespesasFixasQueryHandler(repo.Object);

        var dto = await handler.Handle(new ListarDespesasFixasQuery(comp), CancellationToken.None);

        dto.Total.Should().Be(4000m);
        dto.Itens.Should().HaveCount(3);
        dto.TotalPorCategoria.Should().ContainSingle(c => c.Categoria == CategoriaDespesaFixa.Energia && c.Total == 1000m);
    }
}
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter ListarDespesasFixasQueryHandlerTests`
Expected: FAIL — handler não existe.

- [ ] **Step 4: Handler**

```csharp
using CasaDiAna.Application.DespesasFixas.Commands.CriarDespesaFixa;
using CasaDiAna.Application.DespesasFixas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.DespesasFixas.Queries.ListarDespesasFixas;

public class ListarDespesasFixasQueryHandler
    : IRequestHandler<ListarDespesasFixasQuery, DespesasFixasMesDto>
{
    private readonly IDespesaFixaRepository _repo;

    public ListarDespesasFixasQueryHandler(IDespesaFixaRepository repo) => _repo = repo;

    public async Task<DespesasFixasMesDto> Handle(
        ListarDespesasFixasQuery request, CancellationToken cancellationToken)
    {
        var competencia = DespesaFixa.NormalizarCompetencia(request.Competencia);
        var despesas = await _repo.ListarPorCompetenciaAsync(competencia, cancellationToken);

        var itens = despesas.Select(CriarDespesaFixaCommandHandler.ToDto).ToList();
        var total = despesas.Sum(d => d.Valor);
        var porCategoria = despesas
            .GroupBy(d => d.Categoria)
            .Select(g => new TotalCategoriaDto(g.Key, g.Sum(d => d.Valor)))
            .OrderBy(c => c.Categoria)
            .ToList();

        return new DespesasFixasMesDto(competencia, total, itens, porCategoria);
    }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter ListarDespesasFixasQueryHandlerTests`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/CasaDiAna.Application/DespesasFixas tests/CasaDiAna.Application.Tests/DespesasFixas/ListarDespesasFixasQueryHandlerTests.cs
git commit -m "feat(financeiro): query ListarDespesasFixas com totais"
```

---

## TASK 10 — DTOs + command de faturamento manual do Fechamento

**Files:**
- Create: `src/CasaDiAna.Application/FechamentoMensal/Dtos/FaturamentoMensalDto.cs`
- Create: `src/CasaDiAna.Application/FechamentoMensal/Dtos/FechamentoMensalDto.cs`
- Create: `.../Commands/DefinirFaturamentoManual/DefinirFaturamentoManualCommand.cs`
- Create: `.../DefinirFaturamentoManualCommandHandler.cs`
- Create: `.../DefinirFaturamentoManualCommandValidator.cs`
- Test: `tests/CasaDiAna.Application.Tests/FechamentoMensal/DefinirFaturamentoManualCommandHandlerTests.cs`

- [ ] **Step 1: `FaturamentoMensalDto`**

```csharp
namespace CasaDiAna.Application.FechamentoMensal.Dtos;

public record FaturamentoMensalDto(DateTime Competencia, decimal? ValorManual);
```

- [ ] **Step 2: `FechamentoMensalDto`**

```csharp
using CasaDiAna.Application.DespesasFixas.Dtos;

namespace CasaDiAna.Application.FechamentoMensal.Dtos;

public record FechamentoMensalDto(
    DateTime Competencia,
    decimal FaturamentoCalculado,
    decimal? FaturamentoManual,
    decimal FaturamentoUsado,
    decimal CustoDiretoTotal,
    decimal TotalDespesasFixas,
    decimal FolhaPagamento,
    decimal? DespesaFixaPercentual,
    decimal MargemBruta,
    decimal MargemOperacional,
    decimal PrimeCost,
    IReadOnlyList<TotalCategoriaDto> DespesasPorCategoria);
```

- [ ] **Step 3: Command**

```csharp
using CasaDiAna.Application.FechamentoMensal.Dtos;
using MediatR;

namespace CasaDiAna.Application.FechamentoMensal.Commands.DefinirFaturamentoManual;

public record DefinirFaturamentoManualCommand(DateTime Competencia, decimal? ValorManual)
    : IRequest<FaturamentoMensalDto>;
```

- [ ] **Step 4: Validator**

```csharp
using FluentValidation;

namespace CasaDiAna.Application.FechamentoMensal.Commands.DefinirFaturamentoManual;

public class DefinirFaturamentoManualCommandValidator : AbstractValidator<DefinirFaturamentoManualCommand>
{
    public DefinirFaturamentoManualCommandValidator()
    {
        RuleFor(x => x.Competencia).NotEmpty().WithMessage("Competência é obrigatória.");
        RuleFor(x => x.ValorManual)
            .GreaterThan(0).When(x => x.ValorManual.HasValue)
            .WithMessage("Faturamento manual deve ser maior que zero.");
    }
}
```

- [ ] **Step 5: Escrever o teste que falha**

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.FechamentoMensal.Commands.DefinirFaturamentoManual;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.FechamentoMensal;

public class DefinirFaturamentoManualCommandHandlerTests
{
    private readonly Mock<IFaturamentoMensalRepository> _repo = new();
    private readonly Mock<ICurrentUserService> _user = new();
    private readonly DefinirFaturamentoManualCommandHandler _handler;

    public DefinirFaturamentoManualCommandHandlerTests()
    {
        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _repo.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _handler = new DefinirFaturamentoManualCommandHandler(_repo.Object, _user.Object);
    }

    [Fact]
    public async Task DeveCriar_QuandoNaoExiste()
    {
        _repo.Setup(r => r.ObterPorCompetenciaAsync(It.IsAny<DateTime>(), default))
             .ReturnsAsync((FaturamentoMensal?)null);
        _repo.Setup(r => r.AdicionarAsync(It.IsAny<FaturamentoMensal>(), default)).Returns(Task.CompletedTask);

        var dto = await _handler.Handle(
            new DefinirFaturamentoManualCommand(new DateTime(2026, 6, 1), 50000m), CancellationToken.None);

        dto.ValorManual.Should().Be(50000m);
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<FaturamentoMensal>(), default), Times.Once);
    }

    [Fact]
    public async Task DeveAtualizar_QuandoJaExiste()
    {
        var existente = FaturamentoMensal.Criar(new DateTime(2026, 6, 1), 40000m, Guid.NewGuid());
        _repo.Setup(r => r.ObterPorCompetenciaAsync(It.IsAny<DateTime>(), default)).ReturnsAsync(existente);

        var dto = await _handler.Handle(
            new DefinirFaturamentoManualCommand(new DateTime(2026, 6, 1), 60000m), CancellationToken.None);

        dto.ValorManual.Should().Be(60000m);
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<FaturamentoMensal>(), default), Times.Never);
    }
}
```

- [ ] **Step 6: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter DefinirFaturamentoManualCommandHandlerTests`
Expected: FAIL — handler não existe.

- [ ] **Step 7: Handler**

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.FechamentoMensal.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.FechamentoMensal.Commands.DefinirFaturamentoManual;

public class DefinirFaturamentoManualCommandHandler
    : IRequestHandler<DefinirFaturamentoManualCommand, FaturamentoMensalDto>
{
    private readonly IFaturamentoMensalRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public DefinirFaturamentoManualCommandHandler(
        IFaturamentoMensalRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<FaturamentoMensalDto> Handle(
        DefinirFaturamentoManualCommand request, CancellationToken cancellationToken)
    {
        var competencia = DespesaFixa.NormalizarCompetencia(request.Competencia);
        var existente = await _repo.ObterPorCompetenciaAsync(competencia, cancellationToken);

        if (existente is null)
        {
            existente = FaturamentoMensal.Criar(competencia, request.ValorManual, _currentUser.UsuarioId);
            await _repo.AdicionarAsync(existente, cancellationToken);
        }
        else
        {
            existente.DefinirValor(request.ValorManual, _currentUser.UsuarioId);
            _repo.Atualizar(existente);
        }

        await _repo.SalvarAsync(cancellationToken);
        return new FaturamentoMensalDto(existente.Competencia, existente.ValorManual);
    }
}
```

- [ ] **Step 8: Rodar e ver passar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter DefinirFaturamentoManualCommandHandlerTests`
Expected: PASS (2 testes).

- [ ] **Step 9: Commit**

```bash
git add src/CasaDiAna.Application/FechamentoMensal tests/CasaDiAna.Application.Tests/FechamentoMensal/DefinirFaturamentoManualCommandHandlerTests.cs
git commit -m "feat(financeiro): DTOs e command DefinirFaturamentoManual"
```

---

## TASK 11 — Query `ObterFechamentoMensal` (TDD — coração dos cálculos)

**Files:**
- Create: `.../Queries/ObterFechamentoMensal/ObterFechamentoMensalQuery.cs`
- Create: `.../ObterFechamentoMensalQueryHandler.cs`
- Test: `tests/CasaDiAna.Application.Tests/FechamentoMensal/ObterFechamentoMensalQueryHandlerTests.cs`

**Fórmulas (todas com guarda de divisão por zero):**
- `FaturamentoCalculado = Σ(venda.Qtd × produto.PrecoVenda)`
- `FaturamentoUsado = ValorManual ?? FaturamentoCalculado`
- `CustoDiretoTotal = Σ(venda.Qtd × produto.CalcularCustoFicha())`
- `DespesaFixaPercentual = FaturamentoUsado > 0 ? TotalDespesas / FaturamentoUsado : null`
- `MargemBruta = FaturamentoUsado − CustoDiretoTotal`
- `MargemOperacional = FaturamentoUsado − CustoDiretoTotal − TotalDespesas`
- `PrimeCost = CustoDiretoTotal + FolhaPagamento`

- [ ] **Step 1: Query**

```csharp
using CasaDiAna.Application.FechamentoMensal.Dtos;
using MediatR;

namespace CasaDiAna.Application.FechamentoMensal.Queries.ObterFechamentoMensal;

public record ObterFechamentoMensalQuery(DateTime Competencia) : IRequest<FechamentoMensalDto>;
```

- [ ] **Step 2: Escrever o teste que falha**

```csharp
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
    private readonly Mock<IDespesaFixaRepository> _despesas = new();
    private readonly Mock<IFaturamentoMensalRepository> _faturamento = new();
    private readonly Mock<IProdutoRepository> _produtos = new();
    private readonly DateTime _comp = new(2026, 6, 1);

    private ObterFechamentoMensalQueryHandler Criar() =>
        new(_vendas.Object, _despesas.Object, _faturamento.Object, _produtos.Object);

    // Produto com preço 10 e sem ficha técnica → custo direto 0.
    private static Produto ProdutoSimples(decimal preco)
        => Produto.Criar("Café", preco, Guid.NewGuid());

    [Fact]
    public async Task DeveCalcularFaturamentoMargensEPercentual()
    {
        var produto = ProdutoSimples(10m);
        var venda = VendaDiaria.Criar(produto.Id, new DateTime(2026, 6, 10), 100m, Guid.NewGuid());

        _vendas.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), null, default))
               .ReturnsAsync(new List<VendaDiaria> { venda });
        _produtos.Setup(r => r.ListarComFichaAsync(false, default))
                 .ReturnsAsync(new List<Produto> { produto });
        _despesas.Setup(r => r.ListarPorCompetenciaAsync(_comp, default))
                 .ReturnsAsync(new List<DespesaFixa>
                 {
                     DespesaFixa.Criar(_comp, CategoriaDespesaFixa.Aluguel, null, 200m, null, _comp, Guid.NewGuid()),
                     DespesaFixa.Criar(_comp, CategoriaDespesaFixa.FolhaPagamento, null, 300m, null, _comp, Guid.NewGuid()),
                 });
        _faturamento.Setup(r => r.ObterPorCompetenciaAsync(_comp, default))
                    .ReturnsAsync((FaturamentoMensal?)null);

        var dto = await Criar().Handle(new ObterFechamentoMensalQuery(_comp), CancellationToken.None);

        dto.FaturamentoCalculado.Should().Be(1000m);   // 100 × 10
        dto.FaturamentoUsado.Should().Be(1000m);
        dto.CustoDiretoTotal.Should().Be(0m);           // sem ficha
        dto.TotalDespesasFixas.Should().Be(500m);
        dto.FolhaPagamento.Should().Be(300m);
        dto.DespesaFixaPercentual.Should().Be(0.5m);    // 500 / 1000
        dto.MargemBruta.Should().Be(1000m);
        dto.MargemOperacional.Should().Be(500m);        // 1000 − 0 − 500
        dto.PrimeCost.Should().Be(300m);                // 0 + 300
    }

    [Fact]
    public async Task DeveUsarFaturamentoManual_QuandoDefinido()
    {
        _vendas.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), null, default))
               .ReturnsAsync(new List<VendaDiaria>());
        _produtos.Setup(r => r.ListarComFichaAsync(false, default)).ReturnsAsync(new List<Produto>());
        _despesas.Setup(r => r.ListarPorCompetenciaAsync(_comp, default)).ReturnsAsync(new List<DespesaFixa>());
        _faturamento.Setup(r => r.ObterPorCompetenciaAsync(_comp, default))
                    .ReturnsAsync(FaturamentoMensal.Criar(_comp, 8000m, Guid.NewGuid()));

        var dto = await Criar().Handle(new ObterFechamentoMensalQuery(_comp), CancellationToken.None);

        dto.FaturamentoCalculado.Should().Be(0m);
        dto.FaturamentoManual.Should().Be(8000m);
        dto.FaturamentoUsado.Should().Be(8000m);
    }

    [Fact]
    public async Task DespesaFixaPercentual_DeveSerNull_QuandoFaturamentoZero()
    {
        _vendas.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), null, default))
               .ReturnsAsync(new List<VendaDiaria>());
        _produtos.Setup(r => r.ListarComFichaAsync(false, default)).ReturnsAsync(new List<Produto>());
        _despesas.Setup(r => r.ListarPorCompetenciaAsync(_comp, default))
                 .ReturnsAsync(new List<DespesaFixa>
                 {
                     DespesaFixa.Criar(_comp, CategoriaDespesaFixa.Energia, null, 800m, null, _comp, Guid.NewGuid()),
                 });
        _faturamento.Setup(r => r.ObterPorCompetenciaAsync(_comp, default)).ReturnsAsync((FaturamentoMensal?)null);

        var dto = await Criar().Handle(new ObterFechamentoMensalQuery(_comp), CancellationToken.None);

        dto.FaturamentoUsado.Should().Be(0m);
        dto.DespesaFixaPercentual.Should().BeNull();
    }
}
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter ObterFechamentoMensalQueryHandlerTests`
Expected: FAIL — handler não existe.

- [ ] **Step 4: Handler**

```csharp
using CasaDiAna.Application.DespesasFixas.Dtos;
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
    private readonly IDespesaFixaRepository _despesas;
    private readonly IFaturamentoMensalRepository _faturamento;
    private readonly IProdutoRepository _produtos;

    public ObterFechamentoMensalQueryHandler(
        IVendaDiariaRepository vendas,
        IDespesaFixaRepository despesas,
        IFaturamentoMensalRepository faturamento,
        IProdutoRepository produtos)
    {
        _vendas = vendas;
        _despesas = despesas;
        _faturamento = faturamento;
        _produtos = produtos;
    }

    public async Task<FechamentoMensalDto> Handle(
        ObterFechamentoMensalQuery request, CancellationToken cancellationToken)
    {
        var competencia = DespesaFixa.NormalizarCompetencia(request.Competencia);
        var inicio = competencia;
        var fim = competencia.AddMonths(1);

        var vendas = await _vendas.ListarAsync(inicio, fim, null, cancellationToken);
        var produtos = (await _produtos.ListarComFichaAsync(false, cancellationToken))
            .ToDictionary(p => p.Id);

        decimal faturamentoCalculado = 0m;
        decimal custoDiretoTotal = 0m;
        foreach (var venda in vendas)
        {
            if (!produtos.TryGetValue(venda.ProdutoId, out var produto))
                continue;
            faturamentoCalculado += venda.QuantidadeVendida * produto.PrecoVenda;
            custoDiretoTotal += venda.QuantidadeVendida * produto.CalcularCustoFicha();
        }

        var faturamentoManual = (await _faturamento.ObterPorCompetenciaAsync(competencia, cancellationToken))?.ValorManual;
        var faturamentoUsado = faturamentoManual ?? faturamentoCalculado;

        var despesas = await _despesas.ListarPorCompetenciaAsync(competencia, cancellationToken);
        var totalDespesas = despesas.Sum(d => d.Valor);
        var folha = despesas.Where(d => d.Categoria == CategoriaDespesaFixa.FolhaPagamento).Sum(d => d.Valor);
        var porCategoria = despesas
            .GroupBy(d => d.Categoria)
            .Select(g => new TotalCategoriaDto(g.Key, g.Sum(d => d.Valor)))
            .OrderBy(c => c.Categoria)
            .ToList();

        decimal? despesaFixaPercentual = faturamentoUsado > 0 ? totalDespesas / faturamentoUsado : null;
        var margemBruta = faturamentoUsado - custoDiretoTotal;
        var margemOperacional = faturamentoUsado - custoDiretoTotal - totalDespesas;
        var primeCost = custoDiretoTotal + folha;

        return new FechamentoMensalDto(
            competencia,
            faturamentoCalculado,
            faturamentoManual,
            faturamentoUsado,
            custoDiretoTotal,
            totalDespesas,
            folha,
            despesaFixaPercentual,
            margemBruta,
            margemOperacional,
            primeCost,
            porCategoria);
    }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter ObterFechamentoMensalQueryHandlerTests`
Expected: PASS (3 testes).

- [ ] **Step 6: Rodar a suíte inteira**

Run: `dotnet test tests/CasaDiAna.Application.Tests`
Expected: PASS (todos, incluindo os pré-existentes).

- [ ] **Step 7: Commit**

```bash
git add src/CasaDiAna.Application/FechamentoMensal tests/CasaDiAna.Application.Tests/FechamentoMensal/ObterFechamentoMensalQueryHandlerTests.cs
git commit -m "feat(financeiro): query ObterFechamentoMensal com margens e prime cost"
```

---

## TASK 12 — Controllers

**Files:**
- Create: `src/CasaDiAna.API/Controllers/DespesasFixasController.cs`
- Create: `src/CasaDiAna.API/Controllers/FechamentoMensalController.cs`

- [ ] **Step 1: `DespesasFixasController`**

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.DespesasFixas.Commands.AtualizarDespesaFixa;
using CasaDiAna.Application.DespesasFixas.Commands.CancelarDespesaFixa;
using CasaDiAna.Application.DespesasFixas.Commands.CriarDespesaFixa;
using CasaDiAna.Application.DespesasFixas.Dtos;
using CasaDiAna.Application.DespesasFixas.Queries.ListarDespesasFixas;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/despesas-fixas")]
[Authorize(Roles = "Admin,Coordenador")]
public class DespesasFixasController : ControllerBase
{
    private readonly IMediator _mediator;

    public DespesasFixasController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<DespesasFixasMesDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar([FromQuery] DateTime competencia, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ListarDespesasFixasQuery(competencia), ct);
        return Ok(ApiResponse<DespesasFixasMesDto>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<DespesaFixaDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Criar([FromBody] CriarDespesaFixaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<DespesaFixaDto>.Ok(resultado));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<DespesaFixaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Atualizar(
        Guid id, [FromBody] AtualizarDespesaFixaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command with { Id = id }, ct);
        return Ok(ApiResponse<DespesaFixaDto>.Ok(resultado));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Cancelar(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new CancelarDespesaFixaCommand(id), ct);
        return NoContent();
    }
}
```

- [ ] **Step 2: `FechamentoMensalController`**

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.FechamentoMensal.Commands.DefinirFaturamentoManual;
using CasaDiAna.Application.FechamentoMensal.Dtos;
using CasaDiAna.Application.FechamentoMensal.Queries.ObterFechamentoMensal;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/fechamento-mensal")]
[Authorize(Roles = "Admin,Coordenador")]
public class FechamentoMensalController : ControllerBase
{
    private readonly IMediator _mediator;

    public FechamentoMensalController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<FechamentoMensalDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Obter([FromQuery] DateTime competencia, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ObterFechamentoMensalQuery(competencia), ct);
        return Ok(ApiResponse<FechamentoMensalDto>.Ok(resultado));
    }

    [HttpPut("faturamento-manual")]
    [ProducesResponseType(typeof(ApiResponse<FaturamentoMensalDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DefinirFaturamentoManual(
        [FromBody] DefinirFaturamentoManualCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return Ok(ApiResponse<FaturamentoMensalDto>.Ok(resultado));
    }
}
```

- [ ] **Step 3: Build**

Run: `dotnet build src/CasaDiAna.API`
Expected: Build succeeded.

- [ ] **Step 4: Commit**

```bash
git add src/CasaDiAna.API/Controllers/DespesasFixasController.cs src/CasaDiAna.API/Controllers/FechamentoMensalController.cs
git commit -m "feat(financeiro): controllers de despesas fixas e fechamento mensal"
```

---

## TASK 13 — Frontend: helpers de competência + labels

**Files:**
- Create: `frontend/src/features/financeiro/shared/competencia.ts`

- [ ] **Step 1: Helpers e labels**

```typescript
// Categorias (espelha o enum CategoriaDespesaFixa do backend; enums trafegam como int)
export type CategoriaDespesaFixa =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

export const CATEGORIA_DESPESA_LABELS: Record<CategoriaDespesaFixa, string> = {
  1: 'Aluguel',
  2: 'Folha de pagamento',
  3: 'Água',
  4: 'Energia',
  5: 'Gás',
  6: 'Internet',
  7: 'Contabilidade',
  8: 'Manutenção',
  9: 'Sistema',
  10: 'Marketing',
  11: 'Outros',
}

export const CATEGORIA_DESPESA_OPCOES = (
  Object.keys(CATEGORIA_DESPESA_LABELS) as unknown as CategoriaDespesaFixa[]
).map(Number).map(valor => ({
  valor: valor as CategoriaDespesaFixa,
  label: CATEGORIA_DESPESA_LABELS[valor as CategoriaDespesaFixa],
}))

// <input type="month"> usa "YYYY-MM". API usa o 1º dia do mês "YYYY-MM-01".
export function competenciaInicial(): string {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
}

export function mesParaCompetencia(mes: string): string {
  return `${mes}-01`
}

export function formatarBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatarPercentual(fracao: number | null): string {
  if (fracao === null || fracao === undefined) return '—'
  return `${(fracao * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}
```

- [ ] **Step 2: Type-check**

Run (em `frontend/`): `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/financeiro/shared/competencia.ts
git commit -m "feat(financeiro): helpers de competência e labels de categoria"
```

---

## TASK 14 — Frontend: services

**Files:**
- Create: `frontend/src/features/financeiro/despesas-fixas/services/despesasFixasService.ts`
- Create: `frontend/src/features/financeiro/fechamento-mensal/services/fechamentoService.ts`

- [ ] **Step 1: `despesasFixasService.ts`**

```typescript
import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type { CategoriaDespesaFixa } from '../../shared/competencia'

export interface DespesaFixa {
  id: string
  competencia: string
  categoria: CategoriaDespesaFixa
  descricao: string | null
  valor: number
  observacao: string | null
  dataLancamento: string
  ativo: boolean
}

export interface TotalCategoria {
  categoria: CategoriaDespesaFixa
  total: number
}

export interface DespesasFixasMes {
  competencia: string
  total: number
  itens: DespesaFixa[]
  totalPorCategoria: TotalCategoria[]
}

export interface DespesaFixaInput {
  competencia: string
  categoria: CategoriaDespesaFixa
  descricao: string | null
  valor: number
  observacao: string | null
  dataLancamento: string
}

export const despesasFixasService = {
  listar: async (competencia: string): Promise<DespesasFixasMes> => {
    const resp = await api.get<ApiResponse<DespesasFixasMes>>(
      `/despesas-fixas?competencia=${competencia}`,
    )
    return resp.data.dados
  },

  criar: async (input: DespesaFixaInput): Promise<DespesaFixa> => {
    const resp = await api.post<ApiResponse<DespesaFixa>>('/despesas-fixas', input)
    return resp.data.dados
  },

  atualizar: async (id: string, input: DespesaFixaInput): Promise<DespesaFixa> => {
    const resp = await api.put<ApiResponse<DespesaFixa>>(`/despesas-fixas/${id}`, input)
    return resp.data.dados
  },

  cancelar: async (id: string): Promise<void> => {
    await api.delete(`/despesas-fixas/${id}`)
  },
}
```

- [ ] **Step 2: `fechamentoService.ts`**

```typescript
import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type { TotalCategoria } from '../../despesas-fixas/services/despesasFixasService'

export interface FechamentoMensal {
  competencia: string
  faturamentoCalculado: number
  faturamentoManual: number | null
  faturamentoUsado: number
  custoDiretoTotal: number
  totalDespesasFixas: number
  folhaPagamento: number
  despesaFixaPercentual: number | null
  margemBruta: number
  margemOperacional: number
  primeCost: number
  despesasPorCategoria: TotalCategoria[]
}

export const fechamentoService = {
  obter: async (competencia: string): Promise<FechamentoMensal> => {
    const resp = await api.get<ApiResponse<FechamentoMensal>>(
      `/fechamento-mensal?competencia=${competencia}`,
    )
    return resp.data.dados
  },

  definirFaturamentoManual: async (
    competencia: string,
    valorManual: number | null,
  ): Promise<void> => {
    await api.put('/fechamento-mensal/faturamento-manual', { competencia, valorManual })
  },
}
```

- [ ] **Step 3: Type-check**

Run (em `frontend/`): `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/financeiro
git commit -m "feat(financeiro): services de despesas fixas e fechamento"
```

---

## TASK 15 — Frontend: hook + tabela + modal de despesas

**Files:**
- Create: `frontend/src/features/financeiro/despesas-fixas/hooks/useDespesasFixas.ts`
- Create: `frontend/src/features/financeiro/despesas-fixas/components/TabelaDespesasFixas.tsx`
- Create: `frontend/src/features/financeiro/despesas-fixas/components/ModalDespesaFixa.tsx`

- [ ] **Step 1: `useDespesasFixas.ts`**

```typescript
import { useCallback, useEffect, useState } from 'react'
import { despesasFixasService, type DespesasFixasMes } from '../services/despesasFixasService'
import { mesParaCompetencia } from '../../shared/competencia'

export function useDespesasFixas(mes: string) {
  const [dados, setDados] = useState<DespesasFixasMes | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await despesasFixasService.listar(mesParaCompetencia(mes))
      setDados(data)
    } catch {
      setErro('Erro ao carregar despesas fixas.')
    } finally {
      setLoading(false)
    }
  }, [mes])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { dados, loading, erro, recarregar }
}
```

- [ ] **Step 2: `TabelaDespesasFixas.tsx`**

```tsx
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { DespesaFixa } from '../services/despesasFixasService'
import { CATEGORIA_DESPESA_LABELS, formatarBRL } from '../../shared/competencia'

interface Props {
  itens: DespesaFixa[]
  onEditar: (despesa: DespesaFixa) => void
  onRemover: (despesa: DespesaFixa) => void
}

export function TabelaDespesasFixas({ itens, onEditar, onRemover }: Props) {
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
              <td className="py-2.5 pr-4" style={{ color: 'var(--ada-body)' }}>
                {CATEGORIA_DESPESA_LABELS[d.categoria]}
              </td>
              <td className="py-2.5 pr-4" style={{ color: 'var(--ada-muted)' }}>{d.descricao ?? '—'}</td>
              <td className="py-2.5 pr-4" style={{ color: 'var(--ada-muted)' }}>
                {new Date(d.dataLancamento).toLocaleDateString('pt-BR')}
              </td>
              <td className="py-2.5 pr-4 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>
                {formatarBRL(d.valor)}
              </td>
              <td className="py-2.5 pl-4">
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => onEditar(d)} title="Editar"
                    className="p-1.5 rounded-lg hover:opacity-80" style={{ color: 'var(--ada-muted)' }}>
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => onRemover(d)} title="Remover"
                    className="p-1.5 rounded-lg hover:opacity-80" style={{ color: '#F87171' }}>
                    <TrashIcon className="h-4 w-4" />
                  </button>
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

- [ ] **Step 3: `ModalDespesaFixa.tsx`**

```tsx
import { useState } from 'react'
import type { DespesaFixa, DespesaFixaInput } from '../services/despesasFixasService'
import {
  CATEGORIA_DESPESA_OPCOES,
  mesParaCompetencia,
  type CategoriaDespesaFixa,
} from '../../shared/competencia'

interface Props {
  mes: string
  despesa: DespesaFixa | null
  onFechar: () => void
  onSalvar: (input: DespesaFixaInput) => Promise<void>
}

export function ModalDespesaFixa({ mes, despesa, onFechar, onSalvar }: Props) {
  const [categoria, setCategoria] = useState<CategoriaDespesaFixa>(despesa?.categoria ?? 1)
  const [descricao, setDescricao] = useState(despesa?.descricao ?? '')
  const [valor, setValor] = useState(despesa ? String(despesa.valor) : '')
  const [observacao, setObservacao] = useState(despesa?.observacao ?? '')
  const [dataLancamento, setDataLancamento] = useState(
    despesa ? despesa.dataLancamento.split('T')[0] : new Date().toISOString().split('T')[0],
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const submeter = async () => {
    const valorNum = Number(valor.replace(',', '.'))
    if (!Number.isFinite(valorNum) || valorNum <= 0) {
      setErro('Informe um valor maior que zero.')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      await onSalvar({
        competencia: despesa?.competencia ?? mesParaCompetencia(mes),
        categoria,
        descricao: descricao.trim() || null,
        valor: valorNum,
        observacao: observacao.trim() || null,
        dataLancamento,
      })
      onFechar()
    } catch {
      setErro('Erro ao salvar a despesa.')
    } finally {
      setSalvando(false)
    }
  }

  const inputStyle = {
    background: 'var(--ada-bg)',
    borderColor: 'var(--ada-border)',
    color: 'var(--ada-body)',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onFechar}>
      <div className="w-full max-w-md rounded-xl border p-6 space-y-4"
        style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}
        onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--ada-heading)' }}>
          {despesa ? 'Editar despesa' : 'Nova despesa'}
        </h2>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Categoria</label>
          <select value={categoria} onChange={e => setCategoria(Number(e.target.value) as CategoriaDespesaFixa)}
            className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={inputStyle}>
            {CATEGORIA_DESPESA_OPCOES.map(op => (
              <option key={op.valor} value={op.valor}>{op.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Descrição</label>
          <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={inputStyle} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Valor (R$)</label>
            <input type="text" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)}
              placeholder="0,00" className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Data lançamento</label>
            <input type="date" value={dataLancamento} onChange={e => setDataLancamento(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ ...inputStyle, colorScheme: 'dark' }} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Observação</label>
          <input type="text" value={observacao} onChange={e => setObservacao(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={inputStyle} />
        </div>

        {erro && (
          <p className="text-sm rounded-lg px-3 py-2"
            style={{ background: 'var(--ada-error-bg)', color: 'var(--ada-error-text)' }}>{erro}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onFechar}
            className="rounded-lg px-4 py-2 text-sm font-medium border" style={inputStyle}>Cancelar</button>
          <button type="button" onClick={submeter} disabled={salvando}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: 'var(--sb-accent)' }}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Type-check**

Run (em `frontend/`): `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/financeiro/despesas-fixas
git commit -m "feat(financeiro): hook, tabela e modal de despesas fixas"
```

---

## TASK 16 — Frontend: página Despesas Fixas

**Files:**
- Create: `frontend/src/features/financeiro/despesas-fixas/pages/DespesasFixasPage.tsx`

- [ ] **Step 1: Página**

```tsx
import { useState } from 'react'
import { PlusIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { ModalDesativar } from '@/components/ui/ModalDesativar'
import { useDespesasFixas } from '../hooks/useDespesasFixas'
import { TabelaDespesasFixas } from '../components/TabelaDespesasFixas'
import { ModalDespesaFixa } from '../components/ModalDespesaFixa'
import { despesasFixasService, type DespesaFixa, type DespesaFixaInput } from '../services/despesasFixasService'
import { competenciaInicial, formatarBRL, CATEGORIA_DESPESA_LABELS } from '../../shared/competencia'

export function DespesasFixasPage() {
  const [mes, setMes] = useState(competenciaInicial())
  const { dados, loading, erro, recarregar } = useDespesasFixas(mes)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<DespesaFixa | null>(null)
  const [removendo, setRemovendo] = useState<DespesaFixa | null>(null)
  const [removendoLoading, setRemovendoLoading] = useState(false)

  const abrirNova = () => { setEditando(null); setModalAberto(true) }
  const abrirEdicao = (d: DespesaFixa) => { setEditando(d); setModalAberto(true) }

  const salvar = async (input: DespesaFixaInput) => {
    if (editando) await despesasFixasService.atualizar(editando.id, input)
    else await despesasFixasService.criar(input)
    await recarregar()
  }

  const confirmarRemocao = async () => {
    if (!removendo) return
    setRemovendoLoading(true)
    try {
      await despesasFixasService.cancelar(removendo.id)
      setRemovendo(null)
      await recarregar()
    } finally {
      setRemovendoLoading(false)
    }
  }

  return (
    <div className="ada-page space-y-6">
      <PageHeader titulo="Despesas Fixas Mensais"
        subtitulo="Cadastre as despesas operacionais da empresa por competência" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Competência</label>
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            className="rounded-lg px-3 py-2.5 text-sm border outline-none"
            style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)', colorScheme: 'dark' }} />
        </div>
        <button type="button" onClick={abrirNova}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: 'var(--sb-accent)' }}>
          <PlusIcon className="h-4 w-4" /> Nova despesa
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total do mês" valor={formatarBRL(dados?.total ?? 0)} variante="amber" />
      </div>

      <div className="rounded-xl border p-6"
        style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
        {loading ? (
          <SkeletonTable colunas={5} />
        ) : erro ? (
          <p className="text-sm" style={{ color: 'var(--ada-error-text)' }}>{erro}</p>
        ) : !dados || dados.itens.length === 0 ? (
          <EmptyState icon={<BanknotesIcon />} titulo="Nenhuma despesa nesta competência"
            descricao="Adicione a primeira despesa fixa deste mês." />
        ) : (
          <TabelaDespesasFixas itens={dados.itens} onEditar={abrirEdicao} onRemover={setRemovendo} />
        )}
      </div>

      {modalAberto && (
        <ModalDespesaFixa mes={mes} despesa={editando}
          onFechar={() => setModalAberto(false)} onSalvar={salvar} />
      )}

      {removendo && (
        <ModalDesativar
          nome={removendo.descricao ?? CATEGORIA_DESPESA_LABELS[removendo.categoria]}
          entidade="despesa"
          loading={removendoLoading}
          onConfirmar={confirmarRemocao}
          onCancelar={() => setRemovendo(null)}
        />
      )}
    </div>
  )
}
```

> **Props verificadas** (já corretas no código acima): `PageHeader({ titulo, subtitulo })`,
> `SkeletonTable({ colunas, linhas })`, `EmptyState({ icon, titulo, descricao })` — `icon`
> é obrigatório, `ModalDesativar({ nome, entidade?, loading, onConfirmar, onCancelar })`.

- [ ] **Step 2: Type-check**

Run (em `frontend/`): `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/financeiro/despesas-fixas/pages/DespesasFixasPage.tsx
git commit -m "feat(financeiro): página de despesas fixas"
```

---

## TASK 17 — Frontend: página Fechamento Mensal

**Files:**
- Create: `frontend/src/features/financeiro/fechamento-mensal/pages/FechamentoMensalPage.tsx`

- [ ] **Step 1: Página**

```tsx
import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { fechamentoService, type FechamentoMensal } from '../services/fechamentoService'
import {
  competenciaInicial,
  mesParaCompetencia,
  formatarBRL,
  formatarPercentual,
  CATEGORIA_DESPESA_LABELS,
} from '../../shared/competencia'

export function FechamentoMensalPage() {
  const [mes, setMes] = useState(competenciaInicial())
  const [dados, setDados] = useState<FechamentoMensal | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [faturamentoManual, setFaturamentoManual] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await fechamentoService.obter(mesParaCompetencia(mes))
      setDados(data)
      setFaturamentoManual(data.faturamentoManual != null ? String(data.faturamentoManual) : '')
    } catch {
      setErro('Erro ao carregar o fechamento mensal.')
    } finally {
      setLoading(false)
    }
  }, [mes])

  useEffect(() => { carregar() }, [carregar])

  const salvarFaturamento = async () => {
    setSalvando(true)
    try {
      const txt = faturamentoManual.trim().replace(',', '.')
      const valor = txt === '' ? null : Number(txt)
      if (valor !== null && (!Number.isFinite(valor) || valor <= 0)) return
      await fechamentoService.definirFaturamentoManual(mesParaCompetencia(mes), valor)
      await carregar()
    } finally {
      setSalvando(false)
    }
  }

  const semFaturamento = !!dados && dados.faturamentoUsado <= 0
  const usandoManual = !!dados && dados.faturamentoManual != null

  return (
    <div className="ada-page space-y-6">
      <PageHeader titulo="Fechamento Mensal"
        subtitulo="Consolidação de faturamento, custo direto e despesas fixas da competência" />

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Competência</label>
        <input type="month" value={mes} onChange={e => setMes(e.target.value)}
          className="rounded-lg px-3 py-2.5 text-sm border outline-none"
          style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)', colorScheme: 'dark' }} />
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Carregando...</p>
      ) : erro ? (
        <p className="text-sm" style={{ color: 'var(--ada-error-text)' }}>{erro}</p>
      ) : dados && (
        <>
          {semFaturamento && (
            <p className="text-sm rounded-lg px-3 py-2"
              style={{ background: 'var(--ada-error-bg)', color: 'var(--ada-error-text)' }}>
              Informe o faturamento para calcular os percentuais.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard label="Faturamento usado" valor={formatarBRL(dados.faturamentoUsado)} variante="green" />
            <KpiCard label="Custo direto total" valor={formatarBRL(dados.custoDiretoTotal)} variante="amber" />
            <KpiCard label="Total despesas fixas" valor={formatarBRL(dados.totalDespesasFixas)} variante="red" />
            <KpiCard label="Despesa fixa %" valor={formatarPercentual(dados.despesaFixaPercentual)} variante="yellow" />
            <KpiCard label="Margem bruta" valor={formatarBRL(dados.margemBruta)} variante="blue" />
            <KpiCard label="Margem operacional" valor={formatarBRL(dados.margemOperacional)} variante="green" />
            <KpiCard label="Prime cost" valor={formatarBRL(dados.primeCost)} variante="amber" />
            <KpiCard label="Folha de pagamento" valor={formatarBRL(dados.folhaPagamento)} variante="red" />
          </div>

          <div className="rounded-xl border p-6 space-y-3"
            style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)' }}>
              Faturamento
            </p>
            <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>
              Calculado das vendas: <strong style={{ color: 'var(--ada-body)' }}>{formatarBRL(dados.faturamentoCalculado)}</strong>
              {' · '}
              <span style={{ color: usandoManual ? 'var(--sb-accent)' : 'var(--ada-muted)' }}>
                {usandoManual ? 'usando valor manual' : 'usando automático'}
              </span>
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-body)' }}>
                  Faturamento manual (deixe vazio p/ usar automático)
                </label>
                <input type="text" inputMode="decimal" value={faturamentoManual}
                  onChange={e => setFaturamentoManual(e.target.value)} placeholder="0,00"
                  className="rounded-lg px-3 py-2.5 text-sm border outline-none"
                  style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }} />
              </div>
              <button type="button" onClick={salvarFaturamento} disabled={salvando}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: 'var(--sb-accent)' }}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>

          {dados.despesasPorCategoria.length > 0 && (
            <div className="rounded-xl border p-6"
              style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--ada-muted)' }}>
                Despesas por categoria
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {dados.despesasPorCategoria.map(c => (
                      <tr key={c.categoria} style={{ borderTop: '1px solid var(--ada-border)' }}>
                        <td className="py-2.5 pr-4" style={{ color: 'var(--ada-body)' }}>
                          {CATEGORIA_DESPESA_LABELS[c.categoria]}
                        </td>
                        <td className="py-2.5 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>
                          {formatarBRL(c.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run (em `frontend/`): `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/financeiro/fechamento-mensal/pages/FechamentoMensalPage.tsx
git commit -m "feat(financeiro): página de fechamento mensal"
```

---

## TASK 18 — Frontend: rotas + sidebar (grupo Financeiro)

**Files:**
- Modify: `frontend/src/routes/AppRoutes.tsx`
- Modify: `frontend/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Importar as páginas em `AppRoutes.tsx`**

Adicionar após a linha de import de `MinhaContaPage`:

```tsx
import { DespesasFixasPage } from '@/features/financeiro/despesas-fixas/pages/DespesasFixasPage'
import { FechamentoMensalPage } from '@/features/financeiro/fechamento-mensal/pages/FechamentoMensalPage'
```

- [ ] **Step 2: Adicionar as rotas**

Inserir antes do bloco `{/* Minha Conta */}`:

```tsx
          {/* Financeiro */}
          <Route path="/financeiro/despesas" element={<DespesasFixasPage />} />
          <Route path="/financeiro/fechamento" element={<FechamentoMensalPage />} />
```

- [ ] **Step 3: Adicionar grupo "Financeiro" na Sidebar (visível p/ Admin ou Coordenador)**

Em `Sidebar.tsx`:

(a) Adicionar ao import de ícones `@heroicons/react/24/outline` os ícones `CurrencyDollarIcon` e `CalculatorIcon`.

(b) No componente, após `const isAdmin = temPapel('Admin')`, adicionar:

```tsx
  const isGestao = isAdmin || temPapel('Coordenador')
```

(c) Renderizar o grupo Financeiro logo após o `{grupos.map(...)}` (antes do bloco `{isAdmin && (`):

```tsx
        {isGestao && (
          <div>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--sb-group)', fontFamily: 'Sora, system-ui, sans-serif' }}>
              Financeiro
            </p>
            <ul className="space-y-0.5" role="list">
              {[
                { label: 'Despesas Fixas', href: '/financeiro/despesas', icon: CurrencyDollarIcon },
                { label: 'Fechamento Mensal', href: '/financeiro/fechamento', icon: CalculatorIcon },
              ].map(item => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <NavLink to={item.href} onClick={onFechar}
                      className={({ isActive }) => [
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium',
                        'transition-colors duration-150',
                        isActive ? 'text-white' : 'hover:text-white',
                      ].join(' ')}
                      style={({ isActive }) => isActive
                        ? { color: 'var(--sb-text-active)', background: 'var(--sb-active-bg)', borderLeft: '2px solid var(--sb-active-bd)', paddingLeft: '10px' }
                        : { color: 'var(--sb-text)', borderLeft: '2px solid transparent' }}>
                      {({ isActive }) => (
                        <>
                          <Icon className="h-4 w-4 shrink-0" aria-hidden="true"
                            style={{ color: isActive ? 'var(--sb-accent)' : '#34D399', opacity: isActive ? 1 : 0.75 }} />
                          <span className="flex-1 leading-none">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
```

- [ ] **Step 4: Type-check + lint do arquivo alterado**

Run (em `frontend/`):
```bash
npx tsc --noEmit
npx eslint src/components/layout/Sidebar.tsx src/routes/AppRoutes.tsx
```
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/routes/AppRoutes.tsx frontend/src/components/layout/Sidebar.tsx
git commit -m "feat(financeiro): rotas e grupo Financeiro na sidebar (Admin/Coordenador)"
```

---

## TASK 19 — Verificação final ponta a ponta

- [ ] **Step 1: Backend — build + testes completos**

Run:
```bash
dotnet build src/CasaDiAna.API
dotnet test tests/CasaDiAna.Application.Tests
```
Expected: Build succeeded; todos os testes PASS.

- [ ] **Step 2: Frontend — type-check + lint**

Run (em `frontend/`):
```bash
npx tsc --noEmit
npm run lint
```
Expected: sem novos erros nos arquivos de `features/financeiro`, `Sidebar.tsx` e `AppRoutes.tsx`.

- [ ] **Step 3: Teste manual (com `dotnet run` + `npm run dev`)**

Logado como Admin ou Coordenador:
1. **Despesas:** abrir `/financeiro/despesas`; criar despesas em ≥2 categorias (incluir uma de Folha de pagamento); conferir KPI "Total do mês" e a tabela; editar um valor; remover uma despesa (sai da soma); trocar a competência para um mês vazio → `EmptyState`.
2. **Fechamento:** abrir `/financeiro/fechamento` na mesma competência; com vendas registradas no mês, conferir "Faturamento usado" = automático e os KPIs (margem bruta/operacional, prime cost, despesa fixa %); preencher "Faturamento manual" → selo muda para "usando valor manual" e percentuais recalculam; limpar o manual → volta ao automático; competência sem vendas e sem manual → "Despesa fixa %" = "—" e aviso visível.
3. **Permissão:** logar como operador comum → grupo "Financeiro" não aparece na sidebar; acessar `/financeiro/despesas` direto → API responde 403.

- [ ] **Step 4: Commit final (se houver ajustes do teste manual)**

```bash
git add -A
git commit -m "fix(financeiro): ajustes do teste manual da Fase 1"
```

---

## Self-review (preenchido)

**Cobertura do spec:**
- Cadastro de despesas (criar/editar/remover/listar/filtrar/total) → Tasks 7-9, 15-16. ✓
- Soft delete → Task 2/8. ✓
- Faturamento automático + override manual → Tasks 10-11, 17. ✓
- Fechamento (faturamento, custo direto, % despesa, margem bruta/operacional, prime cost) → Task 11. ✓
- Custo direto reaproveitando ficha técnica (`CalcularCustoFicha`) → Task 11. ✓
- Permissões Admin+Coordenador → Tasks 12, 18. ✓
- Guardas de divisão por zero / valores inválidos → Tasks 2, 7, 11 (testes incluídos). ✓
- Telas consistentes com primitivos existentes → Tasks 15-17. ✓

**Consistência de tipos:** `DespesaFixaDto`/`TotalCategoriaDto`/`DespesasFixasMesDto`/`FechamentoMensalDto`/`FaturamentoMensalDto` usados de forma idêntica no backend e refletidos nos types do frontend. `ToDto` definido em `CriarDespesaFixaCommandHandler` e reutilizado em Atualizar/Listar. `NormalizarCompetencia` (em `DespesaFixa`) reutilizada por `FaturamentoMensal` e pelos handlers.

**Pontos de atenção para o executor:**
- Props dos primitivos `PageHeader`, `SkeletonTable`, `EmptyState`, `ModalDesativar` já verificadas contra `components/ui/` (Tasks 16-17 usam as assinaturas reais).
- Schema novo `financeiro`: garantir que a migration o cria.
- `ApiResponse<T>` é importado de `@/types/estoque` (campo `dados`), conforme os services existentes.
