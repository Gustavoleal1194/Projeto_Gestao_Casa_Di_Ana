# Precificação + Simulador (Fase 2) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tela de Precificação que usa o custo da ficha técnica + o % de despesa fixa do mês (Fase 1) para mostrar CMV, margem líquida estimada, preço sugerido e status por produto, com um simulador interativo — sem alterar a ficha técnica.

**Architecture:** Backend CQRS devolve insumos crus (config global + % despesa fixa do mês + produtos com custo/preço); toda a matemática vive numa **função pura única no frontend** (`precificacaoMath.ts`), reusada pela listagem e pelo simulador. Config de alvos é uma entidade de linha única (`ConfiguracaoPrecificacao`). O % de despesa fixa é obtido reusando `ObterFechamentoMensalQuery` da Fase 1.

**Tech Stack:** ASP.NET Core 8, EF Core (Npgsql), MediatR, FluentValidation, xUnit+Moq+FluentAssertions; React 18, TypeScript, Tailwind v4, axios.

**Spec:** `docs/superpowers/specs/2026-06-11-precificacao-simulador-design.md`

---

## Estrutura de arquivos

### Backend
```
Domain/Entities/ConfiguracaoPrecificacao.cs                  (criar)
Domain/Interfaces/IConfiguracaoPrecificacaoRepository.cs     (criar)
Application/Precificacao/Dtos/ConfiguracaoPrecificacaoDto.cs (criar)
Application/Precificacao/Dtos/ProdutoPrecificacaoDto.cs      (criar)
Application/Precificacao/Dtos/AnalisePrecificacaoDto.cs      (criar)
Application/Precificacao/Queries/ObterConfiguracao/*         (criar)
Application/Precificacao/Commands/AtualizarConfiguracao/*    (criar)
Application/Precificacao/Queries/ObterAnalise/*              (criar)
Infrastructure/Persistence/Configurations/ConfiguracaoPrecificacaoConfiguration.cs (criar)
Infrastructure/Repositories/ConfiguracaoPrecificacaoRepository.cs (criar)
Infrastructure/Persistence/AppDbContext.cs                  (modificar — 1 DbSet)
Infrastructure/DependencyInjection.cs                       (modificar — 1 repo)
API/Controllers/PrecificacaoController.cs                   (criar)
tests/CasaDiAna.Application.Tests/Precificacao/*            (criar)
```

### Frontend
```
features/financeiro/precificacao/precificacaoMath.ts                 (criar — função pura)
features/financeiro/precificacao/services/precificacaoService.ts     (criar)
features/financeiro/precificacao/hooks/usePrecificacao.ts            (criar)
features/financeiro/precificacao/components/ConfigPrecificacaoEditor.tsx (criar)
features/financeiro/precificacao/components/TabelaPrecificacao.tsx    (criar)
features/financeiro/precificacao/components/ModalSimulador.tsx        (criar)
features/financeiro/precificacao/pages/PrecificacaoPage.tsx          (criar)
features/financeiro/shared/competencia.ts                            (modificar — exportar formatadores se preciso)
components/layout/Sidebar.tsx                                         (modificar — item Precificação)
routes/AppRoutes.tsx                                                  (modificar — 1 rota)
```

**Convenções herdadas da Fase 1:** percentuais trafegam como **frações decimais**
(0.30 = 30%); enums como **string camelCase**; competência = 1º dia do mês; build
backend só via `dotnet build src/CasaDiAna.API`; commits diretos no `master` com
`git add` escopado; cada commit termina com `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## TASK 1 — Entidade `ConfiguracaoPrecificacao` (TDD)

**Files:**
- Create: `src/CasaDiAna.Domain/Entities/ConfiguracaoPrecificacao.cs`
- Test: `tests/CasaDiAna.Application.Tests/Precificacao/ConfiguracaoPrecificacaoTests.cs`

- [ ] **Step 1: Escrever o teste que falha**

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Precificacao;

public class ConfiguracaoPrecificacaoTests
{
    [Fact]
    public void Padrao_DeveUsarDefaults_30_20_0()
    {
        var c = ConfiguracaoPrecificacao.Padrao(Guid.NewGuid());
        c.CmvAlvo.Should().Be(0.30m);
        c.MargemDesejada.Should().Be(0.20m);
        c.Taxas.Should().Be(0m);
    }

    [Fact]
    public void Atualizar_DeveAlterarFracoes()
    {
        var c = ConfiguracaoPrecificacao.Padrao(Guid.NewGuid());
        c.Atualizar(0.35m, 0.25m, 0.05m, Guid.NewGuid());
        c.CmvAlvo.Should().Be(0.35m);
        c.MargemDesejada.Should().Be(0.25m);
        c.Taxas.Should().Be(0.05m);
    }

    [Theory]
    [InlineData(0, 0.2, 0.0)]      // cmvAlvo deve ser > 0
    [InlineData(1, 0.2, 0.0)]      // cmvAlvo deve ser < 1
    [InlineData(0.3, 1, 0.0)]      // margem deve ser < 1
    [InlineData(0.3, -0.1, 0.0)]   // margem deve ser >= 0
    [InlineData(0.3, 0.2, 1)]      // taxas deve ser < 1
    public void Atualizar_DeveLancar_QuandoForaDoIntervalo(double cmv, double margem, double taxas)
    {
        var c = ConfiguracaoPrecificacao.Padrao(Guid.NewGuid());
        var acao = () => c.Atualizar((decimal)cmv, (decimal)margem, (decimal)taxas, Guid.NewGuid());
        acao.Should().Throw<DomainException>();
    }
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter ConfiguracaoPrecificacaoTests`
Expected: FAIL — tipo não existe.

- [ ] **Step 3: Criar a entidade**

```csharp
using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class ConfiguracaoPrecificacao
{
    public Guid Id { get; private set; }
    public decimal CmvAlvo { get; private set; }
    public decimal MargemDesejada { get; private set; }
    public decimal Taxas { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    private ConfiguracaoPrecificacao() { }

    public static ConfiguracaoPrecificacao Padrao(Guid criadoPor) => new()
    {
        Id = Guid.NewGuid(),
        CmvAlvo = 0.30m,
        MargemDesejada = 0.20m,
        Taxas = 0m,
        AtualizadoEm = DateTime.UtcNow,
        AtualizadoPor = criadoPor
    };

    public void Atualizar(decimal cmvAlvo, decimal margemDesejada, decimal taxas, Guid atualizadoPor)
    {
        if (cmvAlvo <= 0 || cmvAlvo >= 1)
            throw new DomainException("CMV alvo deve estar entre 0 e 100% (exclusivo).");
        ValidarFracao(margemDesejada, "Margem desejada");
        ValidarFracao(taxas, "Taxas");

        CmvAlvo = cmvAlvo;
        MargemDesejada = margemDesejada;
        Taxas = taxas;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    private static void ValidarFracao(decimal valor, string campo)
    {
        if (valor < 0 || valor >= 1)
            throw new DomainException($"{campo} deve estar entre 0% e 100% (exclusivo no topo).");
    }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter ConfiguracaoPrecificacaoTests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/CasaDiAna.Domain/Entities/ConfiguracaoPrecificacao.cs tests/CasaDiAna.Application.Tests/Precificacao/ConfiguracaoPrecificacaoTests.cs
git commit -m "feat(precificacao): entidade ConfiguracaoPrecificacao (config global de alvos)"
```

---

## TASK 2 — Infra: repositório, EF config, DbSet, DI, migration

**Files:**
- Create: `src/CasaDiAna.Domain/Interfaces/IConfiguracaoPrecificacaoRepository.cs`
- Create: `src/CasaDiAna.Infrastructure/Repositories/ConfiguracaoPrecificacaoRepository.cs`
- Create: `src/CasaDiAna.Infrastructure/Persistence/Configurations/ConfiguracaoPrecificacaoConfiguration.cs`
- Modify: `src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs`
- Modify: `src/CasaDiAna.Infrastructure/DependencyInjection.cs`

- [ ] **Step 1: Interface**

```csharp
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IConfiguracaoPrecificacaoRepository
{
    Task<ConfiguracaoPrecificacao?> ObterAsync(CancellationToken ct = default);
    Task AdicionarAsync(ConfiguracaoPrecificacao config, CancellationToken ct = default);
    void Atualizar(ConfiguracaoPrecificacao config);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

- [ ] **Step 2: Repositório**

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class ConfiguracaoPrecificacaoRepository : IConfiguracaoPrecificacaoRepository
{
    private readonly AppDbContext _db;

    public ConfiguracaoPrecificacaoRepository(AppDbContext db) => _db = db;

    public Task<ConfiguracaoPrecificacao?> ObterAsync(CancellationToken ct = default) =>
        _db.ConfiguracoesPrecificacao.FirstOrDefaultAsync(ct);

    public async Task AdicionarAsync(ConfiguracaoPrecificacao config, CancellationToken ct = default) =>
        await _db.ConfiguracoesPrecificacao.AddAsync(config, ct);

    public void Atualizar(ConfiguracaoPrecificacao config) =>
        _db.ConfiguracoesPrecificacao.Update(config);

    public Task<int> SalvarAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
```

- [ ] **Step 3: EF Configuration**

```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class ConfiguracaoPrecificacaoConfiguration : IEntityTypeConfiguration<ConfiguracaoPrecificacao>
{
    public void Configure(EntityTypeBuilder<ConfiguracaoPrecificacao> builder)
    {
        builder.ToTable("configuracao_precificacao", "financeiro");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.CmvAlvo).HasColumnName("cmv_alvo").HasPrecision(6, 4).IsRequired();
        builder.Property(c => c.MargemDesejada).HasColumnName("margem_desejada").HasPrecision(6, 4).IsRequired();
        builder.Property(c => c.Taxas).HasColumnName("taxas").HasPrecision(6, 4).IsRequired();
        builder.Property(c => c.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(c => c.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();
    }
}
```

- [ ] **Step 4: DbSet no `AppDbContext`**

Inserir após o último `DbSet` (depois de `FaturamentosMensais`):

```csharp
    public DbSet<ConfiguracaoPrecificacao> ConfiguracoesPrecificacao => Set<ConfiguracaoPrecificacao>();
```

- [ ] **Step 5: Registrar na DI**

Em `DependencyInjection.cs`, após `services.AddScoped<IFaturamentoMensalRepository, FaturamentoMensalRepository>();`:

```csharp
        services.AddScoped<IConfiguracaoPrecificacaoRepository, ConfiguracaoPrecificacaoRepository>();
```

- [ ] **Step 6: Build**

Run: `dotnet build src/CasaDiAna.API`
Expected: Build succeeded.

- [ ] **Step 7: Migration**

Run:
```bash
dotnet ef migrations add AddConfiguracaoPrecificacao --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API
```
Expected: cria a migration com a tabela `financeiro.configuracao_precificacao`. (Não rodar `database update` local — aplica no deploy do Render via `Migrate()` no startup.)

- [ ] **Step 8: Commit**

```bash
git add src/CasaDiAna.Domain/Interfaces/IConfiguracaoPrecificacaoRepository.cs src/CasaDiAna.Infrastructure
git commit -m "feat(precificacao): repositório, EF config, DbSet, DI e migration"
```

---

## TASK 3 — Config: DTO + query Obter + command Atualizar (TDD)

**Files:**
- Create: `src/CasaDiAna.Application/Precificacao/Dtos/ConfiguracaoPrecificacaoDto.cs`
- Create: `src/CasaDiAna.Application/Precificacao/Queries/ObterConfiguracao/ObterConfiguracaoPrecificacaoQuery.cs`
- Create: `.../ObterConfiguracaoPrecificacaoQueryHandler.cs`
- Create: `src/CasaDiAna.Application/Precificacao/Commands/AtualizarConfiguracao/AtualizarConfiguracaoPrecificacaoCommand.cs`
- Create: `.../AtualizarConfiguracaoPrecificacaoCommandHandler.cs`
- Create: `.../AtualizarConfiguracaoPrecificacaoCommandValidator.cs`
- Test: `tests/CasaDiAna.Application.Tests/Precificacao/ConfiguracaoPrecificacaoHandlersTests.cs`

- [ ] **Step 1: DTO**

```csharp
namespace CasaDiAna.Application.Precificacao.Dtos;

public record ConfiguracaoPrecificacaoDto(decimal CmvAlvo, decimal MargemDesejada, decimal Taxas);
```

- [ ] **Step 2: Query + handler**

`ObterConfiguracaoPrecificacaoQuery.cs`:
```csharp
using CasaDiAna.Application.Precificacao.Dtos;
using MediatR;

namespace CasaDiAna.Application.Precificacao.Queries.ObterConfiguracao;

public record ObterConfiguracaoPrecificacaoQuery : IRequest<ConfiguracaoPrecificacaoDto>;
```

`ObterConfiguracaoPrecificacaoQueryHandler.cs`:
```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Precificacao.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Precificacao.Queries.ObterConfiguracao;

public class ObterConfiguracaoPrecificacaoQueryHandler
    : IRequestHandler<ObterConfiguracaoPrecificacaoQuery, ConfiguracaoPrecificacaoDto>
{
    private readonly IConfiguracaoPrecificacaoRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public ObterConfiguracaoPrecificacaoQueryHandler(
        IConfiguracaoPrecificacaoRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<ConfiguracaoPrecificacaoDto> Handle(
        ObterConfiguracaoPrecificacaoQuery request, CancellationToken cancellationToken)
    {
        var config = await _repo.ObterAsync(cancellationToken);
        if (config is null)
        {
            config = ConfiguracaoPrecificacao.Padrao(_currentUser.UsuarioId);
            await _repo.AdicionarAsync(config, cancellationToken);
            await _repo.SalvarAsync(cancellationToken);
        }
        return ToDto(config);
    }

    internal static ConfiguracaoPrecificacaoDto ToDto(ConfiguracaoPrecificacao c) =>
        new(c.CmvAlvo, c.MargemDesejada, c.Taxas);
}
```

- [ ] **Step 3: Command + validator + handler**

`AtualizarConfiguracaoPrecificacaoCommand.cs`:
```csharp
using CasaDiAna.Application.Precificacao.Dtos;
using MediatR;

namespace CasaDiAna.Application.Precificacao.Commands.AtualizarConfiguracao;

public record AtualizarConfiguracaoPrecificacaoCommand(
    decimal CmvAlvo, decimal MargemDesejada, decimal Taxas) : IRequest<ConfiguracaoPrecificacaoDto>;
```

`AtualizarConfiguracaoPrecificacaoCommandValidator.cs`:
```csharp
using FluentValidation;

namespace CasaDiAna.Application.Precificacao.Commands.AtualizarConfiguracao;

public class AtualizarConfiguracaoPrecificacaoCommandValidator
    : AbstractValidator<AtualizarConfiguracaoPrecificacaoCommand>
{
    public AtualizarConfiguracaoPrecificacaoCommandValidator()
    {
        RuleFor(x => x.CmvAlvo).GreaterThan(0).LessThan(1)
            .WithMessage("CMV alvo deve estar entre 0 e 100%.");
        RuleFor(x => x.MargemDesejada).GreaterThanOrEqualTo(0).LessThan(1)
            .WithMessage("Margem desejada deve estar entre 0 e 100%.");
        RuleFor(x => x.Taxas).GreaterThanOrEqualTo(0).LessThan(1)
            .WithMessage("Taxas devem estar entre 0 e 100%.");
    }
}
```

`AtualizarConfiguracaoPrecificacaoCommandHandler.cs`:
```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Precificacao.Dtos;
using CasaDiAna.Application.Precificacao.Queries.ObterConfiguracao;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Precificacao.Commands.AtualizarConfiguracao;

public class AtualizarConfiguracaoPrecificacaoCommandHandler
    : IRequestHandler<AtualizarConfiguracaoPrecificacaoCommand, ConfiguracaoPrecificacaoDto>
{
    private readonly IConfiguracaoPrecificacaoRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public AtualizarConfiguracaoPrecificacaoCommandHandler(
        IConfiguracaoPrecificacaoRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<ConfiguracaoPrecificacaoDto> Handle(
        AtualizarConfiguracaoPrecificacaoCommand request, CancellationToken cancellationToken)
    {
        var config = await _repo.ObterAsync(cancellationToken);
        if (config is null)
        {
            config = ConfiguracaoPrecificacao.Padrao(_currentUser.UsuarioId);
            config.Atualizar(request.CmvAlvo, request.MargemDesejada, request.Taxas, _currentUser.UsuarioId);
            await _repo.AdicionarAsync(config, cancellationToken);
        }
        else
        {
            config.Atualizar(request.CmvAlvo, request.MargemDesejada, request.Taxas, _currentUser.UsuarioId);
            _repo.Atualizar(config);
        }
        await _repo.SalvarAsync(cancellationToken);
        return ObterConfiguracaoPrecificacaoQueryHandler.ToDto(config);
    }
}
```

- [ ] **Step 4: Escrever o teste que falha**

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Precificacao.Commands.AtualizarConfiguracao;
using CasaDiAna.Application.Precificacao.Queries.ObterConfiguracao;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Precificacao;

public class ConfiguracaoPrecificacaoHandlersTests
{
    private readonly Mock<IConfiguracaoPrecificacaoRepository> _repo = new();
    private readonly Mock<ICurrentUserService> _user = new();

    public ConfiguracaoPrecificacaoHandlersTests()
    {
        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _repo.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
    }

    [Fact]
    public async Task Obter_DeveCriarPadrao_QuandoNaoExiste()
    {
        _repo.Setup(r => r.ObterAsync(default)).ReturnsAsync((ConfiguracaoPrecificacao?)null);
        var handler = new ObterConfiguracaoPrecificacaoQueryHandler(_repo.Object, _user.Object);

        var dto = await handler.Handle(new ObterConfiguracaoPrecificacaoQuery(), CancellationToken.None);

        dto.CmvAlvo.Should().Be(0.30m);
        dto.MargemDesejada.Should().Be(0.20m);
        dto.Taxas.Should().Be(0m);
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<ConfiguracaoPrecificacao>(), default), Times.Once);
    }

    [Fact]
    public async Task Atualizar_DeveAlterar_QuandoJaExiste()
    {
        var existente = ConfiguracaoPrecificacao.Padrao(Guid.NewGuid());
        _repo.Setup(r => r.ObterAsync(default)).ReturnsAsync(existente);
        var handler = new AtualizarConfiguracaoPrecificacaoCommandHandler(_repo.Object, _user.Object);

        var dto = await handler.Handle(
            new AtualizarConfiguracaoPrecificacaoCommand(0.35m, 0.25m, 0.05m), CancellationToken.None);

        dto.CmvAlvo.Should().Be(0.35m);
        dto.MargemDesejada.Should().Be(0.25m);
        dto.Taxas.Should().Be(0.05m);
        _repo.Verify(r => r.Atualizar(existente), Times.Once);
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<ConfiguracaoPrecificacao>(), default), Times.Never);
    }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter ConfiguracaoPrecificacaoHandlersTests`
Expected: PASS (2 testes).

- [ ] **Step 6: Commit**

```bash
git add src/CasaDiAna.Application/Precificacao tests/CasaDiAna.Application.Tests/Precificacao/ConfiguracaoPrecificacaoHandlersTests.cs
git commit -m "feat(precificacao): obter (get-or-create) e atualizar configuração global"
```

---

## TASK 4 — Análise: DTOs + query (TDD)

**Files:**
- Create: `src/CasaDiAna.Application/Precificacao/Dtos/ProdutoPrecificacaoDto.cs`
- Create: `src/CasaDiAna.Application/Precificacao/Dtos/AnalisePrecificacaoDto.cs`
- Create: `src/CasaDiAna.Application/Precificacao/Queries/ObterAnalise/ObterAnalisePrecificacaoQuery.cs`
- Create: `.../ObterAnalisePrecificacaoQueryHandler.cs`
- Test: `tests/CasaDiAna.Application.Tests/Precificacao/ObterAnalisePrecificacaoQueryHandlerTests.cs`

- [ ] **Step 1: DTOs**

`ProdutoPrecificacaoDto.cs`:
```csharp
namespace CasaDiAna.Application.Precificacao.Dtos;

public record ProdutoPrecificacaoDto(
    Guid Id,
    string Nome,
    string? CategoriaNome,
    decimal PrecoVenda,
    decimal CustoDireto,
    bool TemFicha);
```

`AnalisePrecificacaoDto.cs`:
```csharp
namespace CasaDiAna.Application.Precificacao.Dtos;

public record AnalisePrecificacaoDto(
    DateTime Competencia,
    decimal? DespesaFixaPercentual,
    ConfiguracaoPrecificacaoDto Config,
    IReadOnlyList<ProdutoPrecificacaoDto> Produtos);
```

- [ ] **Step 2: Query**

```csharp
using CasaDiAna.Application.Precificacao.Dtos;
using MediatR;

namespace CasaDiAna.Application.Precificacao.Queries.ObterAnalise;

public record ObterAnalisePrecificacaoQuery(DateTime Competencia) : IRequest<AnalisePrecificacaoDto>;
```

- [ ] **Step 3: Escrever o teste que falha**

```csharp
using CasaDiAna.Application.DespesasFixas.Dtos;
using CasaDiAna.Application.FechamentoMensal.Dtos;
using CasaDiAna.Application.FechamentoMensal.Queries.ObterFechamentoMensal;
using CasaDiAna.Application.Precificacao.Dtos;
using CasaDiAna.Application.Precificacao.Queries.ObterAnalise;
using CasaDiAna.Application.Precificacao.Queries.ObterConfiguracao;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using MediatR;
using Moq;

namespace CasaDiAna.Application.Tests.Precificacao;

public class ObterAnalisePrecificacaoQueryHandlerTests
{
    [Fact]
    public async Task DeveMontarInsumos_ComCustoEPercentualDoFechamento()
    {
        var comp = new DateTime(2026, 6, 1);

        // Produto de revenda: custo unitário direto = 4, preço 10, sem categoria
        var produto = Produto.Criar("Refrigerante", 10m, Guid.NewGuid(), tipo: TipoProduto.Revenda);
        produto.DefinirCustoUnitario(4m);

        var produtos = new Mock<IProdutoRepository>();
        produtos.Setup(r => r.ListarComFichaAsync(true, default))
                .ReturnsAsync(new List<Produto> { produto });

        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(It.IsAny<ObterFechamentoMensalQuery>(), default))
                .ReturnsAsync(new FechamentoMensalDto(
                    comp, 0m, null, 0m, 0m, 0m, 0m, 0.5m, 0m, 0m, 0m,
                    new List<TotalCategoriaDto>()));
        mediator.Setup(m => m.Send(It.IsAny<ObterConfiguracaoPrecificacaoQuery>(), default))
                .ReturnsAsync(new ConfiguracaoPrecificacaoDto(0.30m, 0.20m, 0m));

        var handler = new ObterAnalisePrecificacaoQueryHandler(produtos.Object, mediator.Object);

        var dto = await handler.Handle(new ObterAnalisePrecificacaoQuery(comp), CancellationToken.None);

        dto.DespesaFixaPercentual.Should().Be(0.5m);
        dto.Config.CmvAlvo.Should().Be(0.30m);
        dto.Produtos.Should().ContainSingle();
        var p = dto.Produtos[0];
        p.PrecoVenda.Should().Be(10m);
        p.CustoDireto.Should().Be(4m);
        p.TemFicha.Should().BeTrue();
        p.CategoriaNome.Should().BeNull();
    }
}
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter ObterAnalisePrecificacaoQueryHandlerTests`
Expected: FAIL — handler não existe.

- [ ] **Step 5: Handler**

```csharp
using CasaDiAna.Application.FechamentoMensal.Queries.ObterFechamentoMensal;
using CasaDiAna.Application.Precificacao.Dtos;
using CasaDiAna.Application.Precificacao.Queries.ObterConfiguracao;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Precificacao.Queries.ObterAnalise;

public class ObterAnalisePrecificacaoQueryHandler
    : IRequestHandler<ObterAnalisePrecificacaoQuery, AnalisePrecificacaoDto>
{
    private readonly IProdutoRepository _produtos;
    private readonly IMediator _mediator;

    public ObterAnalisePrecificacaoQueryHandler(IProdutoRepository produtos, IMediator mediator)
    {
        _produtos = produtos;
        _mediator = mediator;
    }

    public async Task<AnalisePrecificacaoDto> Handle(
        ObterAnalisePrecificacaoQuery request, CancellationToken cancellationToken)
    {
        var competencia = DespesaFixa.NormalizarCompetencia(request.Competencia);

        var config = await _mediator.Send(new ObterConfiguracaoPrecificacaoQuery(), cancellationToken);
        var fechamento = await _mediator.Send(new ObterFechamentoMensalQuery(competencia), cancellationToken);

        var produtos = await _produtos.ListarComFichaAsync(apenasAtivos: true, cancellationToken);

        var itens = produtos.Select(p => new ProdutoPrecificacaoDto(
            p.Id,
            p.Nome,
            p.Categoria?.Nome,
            p.PrecoVenda,
            p.CalcularCustoFicha(),
            TemFicha: p.Tipo == TipoProduto.Revenda ? p.CustoUnitario != null : p.ItensFicha.Any()
        )).ToList();

        return new AnalisePrecificacaoDto(
            competencia,
            fechamento.DespesaFixaPercentual,
            config,
            itens);
    }
}
```

- [ ] **Step 6: Rodar e ver passar; depois a suíte inteira**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter ObterAnalisePrecificacaoQueryHandlerTests`
Expected: PASS.
Run: `dotnet test tests/CasaDiAna.Application.Tests`
Expected: PASS (todos).

- [ ] **Step 7: Commit**

```bash
git add src/CasaDiAna.Application/Precificacao tests/CasaDiAna.Application.Tests/Precificacao/ObterAnalisePrecificacaoQueryHandlerTests.cs
git commit -m "feat(precificacao): query de análise reusando ficha técnica e % de despesa fixa"
```

---

## TASK 5 — Controller + verificação backend

**Files:**
- Create: `src/CasaDiAna.API/Controllers/PrecificacaoController.cs`

- [ ] **Step 1: Controller**

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Precificacao.Commands.AtualizarConfiguracao;
using CasaDiAna.Application.Precificacao.Dtos;
using CasaDiAna.Application.Precificacao.Queries.ObterAnalise;
using CasaDiAna.Application.Precificacao.Queries.ObterConfiguracao;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/precificacao")]
[Authorize(Roles = "Admin,Coordenador")]
public class PrecificacaoController : ControllerBase
{
    private readonly IMediator _mediator;

    public PrecificacaoController(IMediator mediator) => _mediator = mediator;

    [HttpGet("configuracao")]
    [ProducesResponseType(typeof(ApiResponse<ConfiguracaoPrecificacaoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObterConfiguracao(CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ObterConfiguracaoPrecificacaoQuery(), ct);
        return Ok(ApiResponse<ConfiguracaoPrecificacaoDto>.Ok(resultado));
    }

    [HttpPut("configuracao")]
    [ProducesResponseType(typeof(ApiResponse<ConfiguracaoPrecificacaoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AtualizarConfiguracao(
        [FromBody] AtualizarConfiguracaoPrecificacaoCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return Ok(ApiResponse<ConfiguracaoPrecificacaoDto>.Ok(resultado));
    }

    [HttpGet("analise")]
    [ProducesResponseType(typeof(ApiResponse<AnalisePrecificacaoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObterAnalise([FromQuery] DateTime competencia, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ObterAnalisePrecificacaoQuery(competencia), ct);
        return Ok(ApiResponse<AnalisePrecificacaoDto>.Ok(resultado));
    }
}
```

- [ ] **Step 2: Build + suíte completa**

Run: `dotnet build src/CasaDiAna.API` → Build succeeded.
Run: `dotnet test tests/CasaDiAna.Application.Tests` → todos PASS.

- [ ] **Step 3: Commit**

```bash
git add src/CasaDiAna.API/Controllers/PrecificacaoController.cs
git commit -m "feat(precificacao): controller de configuração e análise"
```

---

## TASK 6 — Frontend: função pura `precificacaoMath.ts`

**Files:**
- Create: `frontend/src/features/financeiro/precificacao/precificacaoMath.ts`

- [ ] **Step 1: Implementar a função pura (núcleo das fórmulas)**

```typescript
// Núcleo único das fórmulas de precificação — usado pela listagem E pelo simulador.
// Percentuais são frações (0.30 = 30%).

export type StatusPrecificacao =
  | 'saudavel' | 'atencao' | 'abaixoDoIdeal' | 'prejuizo' | 'custoAlto' | 'indefinido'

export interface PrecificacaoInput {
  precoVenda: number
  custoDireto: number
  temFicha: boolean
}

export interface PrecificacaoContexto {
  cmvAlvo: number
  margemDesejada: number
  taxas: number
  despesaFixaPct: number | null
}

export interface PrecificacaoResultado {
  cmvAtual: number | null
  margemContribuicao: number
  rateioFixo: number
  lucroEstimado: number
  margemLiquidaEst: number | null
  custoMaximoPermitido: number
  precoSugeridoPorCmv: number | null
  precoSugeridoPorMargem: number | null
  precoSugerido: number | null
  diferenca: number | null
  status: StatusPrecificacao
  semCusto: boolean
  somaInvalida: boolean
}

// Banda (em pontos de fração) acima da margem desejada que ainda conta como "Atenção".
export const BANDA_ATENCAO = 0.05

export function calcularPrecificacao(
  input: PrecificacaoInput,
  ctx: PrecificacaoContexto,
): PrecificacaoResultado {
  const preco = input.precoVenda
  const custo = input.custoDireto
  const dfp = ctx.despesaFixaPct ?? 0
  const semCusto = !input.temFicha || custo <= 0

  const cmvAtual = preco > 0 ? custo / preco : null
  const margemContribuicao = preco - custo
  const rateioFixo = preco * dfp
  const lucroEstimado = preco - custo - rateioFixo
  const margemLiquidaEst = preco > 0 ? lucroEstimado / preco : null
  const custoMaximoPermitido = preco * ctx.cmvAlvo

  const precoSugeridoPorCmv = ctx.cmvAlvo > 0 ? custo / ctx.cmvAlvo : null
  const denom = 1 - dfp - ctx.taxas - ctx.margemDesejada
  const somaInvalida = denom <= 0
  const precoSugeridoPorMargem = somaInvalida ? null : custo / denom
  const precoSugerido = precoSugeridoPorMargem ?? precoSugeridoPorCmv
  const diferenca = precoSugerido !== null ? precoSugerido - preco : null

  const status = calcularStatus(
    preco, semCusto, lucroEstimado, cmvAtual, ctx.cmvAlvo, margemLiquidaEst, ctx.margemDesejada,
  )

  return {
    cmvAtual, margemContribuicao, rateioFixo, lucroEstimado, margemLiquidaEst,
    custoMaximoPermitido, precoSugeridoPorCmv, precoSugeridoPorMargem, precoSugerido,
    diferenca, status, semCusto, somaInvalida,
  }
}

function calcularStatus(
  preco: number, semCusto: boolean, lucroEstimado: number,
  cmvAtual: number | null, cmvAlvo: number,
  margemLiquidaEst: number | null, margemDesejada: number,
): StatusPrecificacao {
  if (preco <= 0 || semCusto) return 'indefinido'
  if (lucroEstimado < 0) return 'prejuizo'
  if (cmvAtual !== null && cmvAtual > cmvAlvo) return 'custoAlto'
  if (margemLiquidaEst === null) return 'indefinido'
  if (margemLiquidaEst < margemDesejada) return 'abaixoDoIdeal'
  if (margemLiquidaEst < margemDesejada + BANDA_ATENCAO) return 'atencao'
  return 'saudavel'
}

// Mapeamento status -> StatusBadge (paleta existente) + rótulo pt-BR.
import type { BadgeVariante } from '@/components/ui/StatusBadge'

export const STATUS_BADGE: Record<StatusPrecificacao, { variante: BadgeVariante; label: string }> = {
  saudavel:     { variante: 'ativo',   label: 'Saudável' },
  atencao:      { variante: 'baixo',   label: 'Atenção' },
  abaixoDoIdeal:{ variante: 'info',    label: 'Abaixo do ideal' },
  custoAlto:    { variante: 'critico', label: 'Custo alto' },
  prejuizo:     { variante: 'critico', label: 'Prejuízo estimado' },
  indefinido:   { variante: 'inativo', label: 'Indefinido' },
}
```

- [ ] **Step 2: Type-check**

Run (em `frontend/`): `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/financeiro/precificacao/precificacaoMath.ts
git commit -m "feat(precificacao): função pura de cálculo (listagem + simulador) e status"
```

---

## TASK 7 — Frontend: service + tipos

**Files:**
- Create: `frontend/src/features/financeiro/precificacao/services/precificacaoService.ts`

- [ ] **Step 1: Service**

```typescript
import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'

export interface ConfiguracaoPrecificacao {
  cmvAlvo: number
  margemDesejada: number
  taxas: number
}

export interface ProdutoPrecificacao {
  id: string
  nome: string
  categoriaNome: string | null
  precoVenda: number
  custoDireto: number
  temFicha: boolean
}

export interface AnalisePrecificacao {
  competencia: string
  despesaFixaPercentual: number | null
  config: ConfiguracaoPrecificacao
  produtos: ProdutoPrecificacao[]
}

export const precificacaoService = {
  obterConfig: async (): Promise<ConfiguracaoPrecificacao> => {
    const resp = await api.get<ApiResponse<ConfiguracaoPrecificacao>>('/precificacao/configuracao')
    return resp.data.dados
  },

  atualizarConfig: async (input: ConfiguracaoPrecificacao): Promise<ConfiguracaoPrecificacao> => {
    const resp = await api.put<ApiResponse<ConfiguracaoPrecificacao>>('/precificacao/configuracao', input)
    return resp.data.dados
  },

  obterAnalise: async (competencia: string): Promise<AnalisePrecificacao> => {
    const resp = await api.get<ApiResponse<AnalisePrecificacao>>(
      `/precificacao/analise?competencia=${competencia}`,
    )
    return resp.data.dados
  },
}
```

- [ ] **Step 2: Type-check**

Run (em `frontend/`): `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/financeiro/precificacao/services/precificacaoService.ts
git commit -m "feat(precificacao): service e tipos de configuração e análise"
```

---

## TASK 8 — Frontend: hook + editor de config + tabela + página

**Files:**
- Create: `frontend/src/features/financeiro/precificacao/hooks/usePrecificacao.ts`
- Create: `frontend/src/features/financeiro/precificacao/components/ConfigPrecificacaoEditor.tsx`
- Create: `frontend/src/features/financeiro/precificacao/components/TabelaPrecificacao.tsx`
- Create: `frontend/src/features/financeiro/precificacao/pages/PrecificacaoPage.tsx`

- [ ] **Step 1: Hook**

```typescript
import { useCallback, useEffect, useState } from 'react'
import { precificacaoService, type AnalisePrecificacao } from '../services/precificacaoService'
import { mesParaCompetencia } from '../../shared/competencia'

export function usePrecificacao(mes: string) {
  const [analise, setAnalise] = useState<AnalisePrecificacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      setAnalise(await precificacaoService.obterAnalise(mesParaCompetencia(mes)))
    } catch {
      setErro('Erro ao carregar a análise de precificação.')
    } finally {
      setLoading(false)
    }
  }, [mes])

  useEffect(() => { recarregar() }, [recarregar])

  return { analise, loading, erro, recarregar, setAnalise }
}
```

- [ ] **Step 2: `ConfigPrecificacaoEditor.tsx`** (edita frações como %)

```tsx
import { useState } from 'react'
import { precificacaoService, type ConfiguracaoPrecificacao } from '../services/precificacaoService'

interface Props {
  config: ConfiguracaoPrecificacao
  onSalvo: (c: ConfiguracaoPrecificacao) => void
}

const pct = (frac: number) => String(Math.round(frac * 1000) / 10) // 0.3 -> "30"

export function ConfigPrecificacaoEditor({ config, onSalvo }: Props) {
  const [cmv, setCmv] = useState(pct(config.cmvAlvo))
  const [margem, setMargem] = useState(pct(config.margemDesejada))
  const [taxas, setTaxas] = useState(pct(config.taxas))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const salvar = async () => {
    const toFrac = (s: string) => Number(s.replace(',', '.')) / 100
    const body = { cmvAlvo: toFrac(cmv), margemDesejada: toFrac(margem), taxas: toFrac(taxas) }
    if (body.cmvAlvo <= 0 || body.cmvAlvo >= 1 || body.margemDesejada < 0 || body.margemDesejada >= 1 || body.taxas < 0 || body.taxas >= 1) {
      setErro('Cada percentual deve estar entre 0 e 100% (CMV alvo acima de 0).')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      onSalvo(await precificacaoService.atualizarConfig(body))
    } catch {
      setErro('Erro ao salvar a configuração.')
    } finally {
      setSalvando(false)
    }
  }

  const campo = (label: string, value: string, set: (v: string) => void) => (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-body)' }}>{label} (%)</label>
      <input type="text" inputMode="decimal" value={value} onChange={e => set(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
        style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }} />
    </div>
  )

  return (
    <div className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)' }}>Alvos de precificação</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {campo('CMV alvo', cmv, setCmv)}
        {campo('Margem desejada', margem, setMargem)}
        {campo('Taxas/impostos', taxas, setTaxas)}
      </div>
      {erro && <p className="text-sm" style={{ color: 'var(--ada-error-text)' }}>{erro}</p>}
      <button type="button" onClick={salvar} disabled={salvando}
        className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        style={{ background: 'var(--sb-accent)' }}>
        {salvando ? 'Salvando...' : 'Salvar alvos'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: `TabelaPrecificacao.tsx`** (computa via função pura, filtros/ordenações client-side)

```tsx
import { useMemo, useState } from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatarBRL, formatarPercentual } from '../../shared/competencia'
import {
  calcularPrecificacao, STATUS_BADGE,
  type StatusPrecificacao, type PrecificacaoResultado,
} from '../precificacaoMath'
import type { AnalisePrecificacao, ProdutoPrecificacao } from '../services/precificacaoService'

type Ordenacao = 'menorMargemLiquida' | 'maiorDiferenca' | 'maiorCmv' | 'maiorCusto' | 'maiorLucro'

interface Props {
  analise: AnalisePrecificacao
  onSimular: (produto: ProdutoPrecificacao) => void
}

interface Linha { produto: ProdutoPrecificacao; r: PrecificacaoResultado }

export function TabelaPrecificacao({ analise, onSimular }: Props) {
  const [statusFiltro, setStatusFiltro] = useState<StatusPrecificacao | ''>('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('menorMargemLiquida')

  const linhas: Linha[] = useMemo(() => analise.produtos.map(produto => ({
    produto,
    r: calcularPrecificacao(
      { precoVenda: produto.precoVenda, custoDireto: produto.custoDireto, temFicha: produto.temFicha },
      { cmvAlvo: analise.config.cmvAlvo, margemDesejada: analise.config.margemDesejada, taxas: analise.config.taxas, despesaFixaPct: analise.despesaFixaPercentual },
    ),
  })), [analise])

  const categorias = useMemo(
    () => Array.from(new Set(analise.produtos.map(p => p.categoriaNome).filter(Boolean))) as string[],
    [analise],
  )

  const filtradas = useMemo(() => {
    let arr = linhas
    if (statusFiltro) arr = arr.filter(l => l.r.status === statusFiltro)
    if (categoriaFiltro) arr = arr.filter(l => l.produto.categoriaNome === categoriaFiltro)
    const num = (v: number | null) => (v ?? Number.POSITIVE_INFINITY)
    const cmp: Record<Ordenacao, (a: Linha, b: Linha) => number> = {
      menorMargemLiquida: (a, b) => num(a.r.margemLiquidaEst) - num(b.r.margemLiquidaEst),
      maiorDiferenca: (a, b) => (b.r.diferenca ?? -Infinity) - (a.r.diferenca ?? -Infinity),
      maiorCmv: (a, b) => (b.r.cmvAtual ?? -Infinity) - (a.r.cmvAtual ?? -Infinity),
      maiorCusto: (a, b) => b.produto.custoDireto - a.produto.custoDireto,
      maiorLucro: (a, b) => b.r.lucroEstimado - a.r.lucroEstimado,
    }
    return [...arr].sort(cmp[ordenacao])
  }, [linhas, statusFiltro, categoriaFiltro, ordenacao])

  const selStyle = { background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm border outline-none" style={selStyle}>
          <option value="">Todas as categorias</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFiltro} onChange={e => setStatusFiltro(e.target.value as StatusPrecificacao | '')}
          className="rounded-lg px-3 py-2 text-sm border outline-none" style={selStyle}>
          <option value="">Todos os status</option>
          <option value="prejuizo">Prejuízo estimado</option>
          <option value="custoAlto">Custo alto</option>
          <option value="abaixoDoIdeal">Abaixo do ideal</option>
          <option value="atencao">Atenção</option>
          <option value="saudavel">Saudável</option>
        </select>
        <select value={ordenacao} onChange={e => setOrdenacao(e.target.value as Ordenacao)}
          className="rounded-lg px-3 py-2 text-sm border outline-none" style={selStyle}>
          <option value="menorMargemLiquida">Menor margem líquida</option>
          <option value="maiorDiferenca">Maior diferença p/ sugerido</option>
          <option value="maiorCmv">Maior CMV</option>
          <option value="maiorCusto">Maior custo direto</option>
          <option value="maiorLucro">Maior lucro estimado</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--ada-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--ada-muted)' }}>
              <th className="py-2 px-3 font-medium">Produto</th>
              <th className="py-2 px-3 font-medium">Categoria</th>
              <th className="py-2 px-3 font-medium text-right">Preço atual</th>
              <th className="py-2 px-3 font-medium text-right">Custo ficha</th>
              <th className="py-2 px-3 font-medium text-right">CMV%</th>
              <th className="py-2 px-3 font-medium text-right">Margem líq.</th>
              <th className="py-2 px-3 font-medium text-right">Preço sugerido</th>
              <th className="py-2 px-3 font-medium text-right">Diferença</th>
              <th className="py-2 px-3 font-medium">Status</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map(({ produto, r }) => (
              <tr key={produto.id} style={{ borderTop: '1px solid var(--ada-border)' }}>
                <td className="py-2.5 px-3" style={{ color: 'var(--ada-body)' }}>{produto.nome}</td>
                <td className="py-2.5 px-3" style={{ color: 'var(--ada-muted)' }}>{produto.categoriaNome ?? '—'}</td>
                <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>{formatarBRL(produto.precoVenda)}</td>
                <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>{r.semCusto ? '—' : formatarBRL(produto.custoDireto)}</td>
                <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>{formatarPercentual(r.cmvAtual)}</td>
                <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>{formatarPercentual(r.margemLiquidaEst)}</td>
                <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>{r.semCusto || r.precoSugerido === null ? '—' : formatarBRL(r.precoSugerido)}</td>
                <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: r.diferenca != null && r.diferenca > 0 ? '#F87171' : 'var(--ada-muted)' }}>{r.diferenca != null && !r.semCusto ? formatarBRL(r.diferenca) : '—'}</td>
                <td className="py-2.5 px-3"><StatusBadge variante={STATUS_BADGE[r.status].variante} label={STATUS_BADGE[r.status].label} /></td>
                <td className="py-2.5 px-3 text-right">
                  <button type="button" onClick={() => onSimular(produto)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'var(--ada-hover)', color: 'var(--ada-body)' }}>
                    Simular
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: `PrecificacaoPage.tsx`**

```tsx
import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { usePrecificacao } from '../hooks/usePrecificacao'
import { ConfigPrecificacaoEditor } from '../components/ConfigPrecificacaoEditor'
import { TabelaPrecificacao } from '../components/TabelaPrecificacao'
import { ModalSimulador } from '../components/ModalSimulador'
import type { ProdutoPrecificacao } from '../services/precificacaoService'
import { competenciaInicial } from '../../shared/competencia'

export function PrecificacaoPage() {
  const [mes, setMes] = useState(competenciaInicial())
  const { analise, loading, erro, setAnalise } = usePrecificacao(mes)
  const [simular, setSimular] = useState<ProdutoPrecificacao | null>(null)

  return (
    <div className="ada-page space-y-6">
      <PageHeader titulo="Precificação"
        subtitulo="Custo da ficha + despesas fixas do mês → preço sugerido, margem líquida e status por produto" />

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Mês de referência</label>
        <input type="month" value={mes} onChange={e => setMes(e.target.value)}
          className="rounded-lg px-3 py-2.5 text-sm border outline-none"
          style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)', colorScheme: 'dark' }} />
      </div>

      {loading ? (
        <SkeletonTable colunas={9} />
      ) : erro ? (
        <p className="text-sm" style={{ color: 'var(--ada-error-text)' }}>{erro}</p>
      ) : analise && (
        <>
          {analise.despesaFixaPercentual === null && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'var(--ada-warning-badge)', color: 'var(--ada-warning-text)' }}>
              Sem faturamento neste mês — o rateio de despesas fixas está em 0.{' '}
              <Link to="/financeiro/fechamento" style={{ textDecoration: 'underline' }}>Definir no Fechamento</Link>.
            </p>
          )}
          <ConfigPrecificacaoEditor config={analise.config}
            onSalvo={c => setAnalise({ ...analise, config: c })} />
          {analise.produtos.length === 0 ? (
            <EmptyState icon={<CurrencyDollarIcon />} titulo="Nenhum produto ativo para analisar"
              descricao="Cadastre produtos com preço e ficha técnica." />
          ) : (
            <TabelaPrecificacao analise={analise} onSimular={setSimular} />
          )}
        </>
      )}

      {simular && analise && (
        <ModalSimulador produto={simular} config={analise.config}
          despesaFixaPct={analise.despesaFixaPercentual} onFechar={() => setSimular(null)} />
      )}
    </div>
  )
}
```

- [ ] **Step 5: Type-check + lint**

Run (em `frontend/`): `npx tsc --noEmit` e `npx eslint src/features/financeiro/precificacao`
Expected: sem erros. (Confirme que `--ada-warning-badge`/`--ada-warning-text` existem em `index.css`; se não, use `--ada-error-bg`/`--ada-error-text`.)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/financeiro/precificacao/hooks frontend/src/features/financeiro/precificacao/components/ConfigPrecificacaoEditor.tsx frontend/src/features/financeiro/precificacao/components/TabelaPrecificacao.tsx frontend/src/features/financeiro/precificacao/pages/PrecificacaoPage.tsx
git commit -m "feat(precificacao): hook, editor de alvos, tabela e página"
```

> **Nota:** a página importa `ModalSimulador` (Task 9). Faça a Task 9 antes do `tsc` final, ou crie o arquivo do modal primeiro.

---

## TASK 9 — Frontend: `ModalSimulador.tsx`

**Files:**
- Create: `frontend/src/features/financeiro/precificacao/components/ModalSimulador.tsx`

- [ ] **Step 1: Modal do simulador (reusa a mesma função pura)**

```tsx
import { useState } from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatarBRL, formatarPercentual } from '../../shared/competencia'
import { calcularPrecificacao, STATUS_BADGE } from '../precificacaoMath'
import type { ConfiguracaoPrecificacao, ProdutoPrecificacao } from '../services/precificacaoService'

interface Props {
  produto: ProdutoPrecificacao
  config: ConfiguracaoPrecificacao
  despesaFixaPct: number | null
  onFechar: () => void
}

const pct = (f: number) => String(Math.round(f * 1000) / 10)
const toFrac = (s: string) => Number(s.replace(',', '.')) / 100

export function ModalSimulador({ produto, config, despesaFixaPct, onFechar }: Props) {
  const [preco, setPreco] = useState(String(produto.precoVenda))
  const [cmv, setCmv] = useState(pct(config.cmvAlvo))
  const [margem, setMargem] = useState(pct(config.margemDesejada))
  const [taxas, setTaxas] = useState(pct(config.taxas))

  const r = calcularPrecificacao(
    { precoVenda: Number(preco.replace(',', '.')) || 0, custoDireto: produto.custoDireto, temFicha: produto.temFicha },
    { cmvAlvo: toFrac(cmv) || 0, margemDesejada: toFrac(margem) || 0, taxas: toFrac(taxas) || 0, despesaFixaPct },
  )

  const inputStyle = { background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }
  const campo = (label: string, value: string, set: (v: string) => void) => (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-body)' }}>{label}</label>
      <input type="text" inputMode="decimal" value={value} onChange={e => set(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm border outline-none" style={inputStyle} />
    </div>
  )
  const linha = (label: string, valor: string) => (
    <div className="flex justify-between text-sm py-1">
      <span style={{ color: 'var(--ada-muted)' }}>{label}</span>
      <span className="tabular-nums font-medium" style={{ color: 'var(--ada-body)' }}>{valor}</span>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onFechar}>
      <div className="w-full max-w-lg rounded-xl border p-6 space-y-4" style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }} onClick={e => e.stopPropagation()}>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--ada-heading)' }}>Simular preço — {produto.nome}</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ada-muted)' }}>Custo da ficha: {produto.temFicha ? formatarBRL(produto.custoDireto) : 'ficha incompleta'}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {campo('Preço simulado (R$)', preco, setPreco)}
          {campo('CMV alvo (%)', cmv, setCmv)}
          {campo('Margem desejada (%)', margem, setMargem)}
          {campo('Taxas (%)', taxas, setTaxas)}
        </div>

        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--ada-border)', background: 'var(--ada-bg)' }}>
          {linha('CMV resultante', formatarPercentual(r.cmvAtual))}
          {linha('Rateio fixo estimado', formatarBRL(r.rateioFixo))}
          {linha('Lucro estimado/unid.', formatarBRL(r.lucroEstimado))}
          {linha('Margem líquida estimada', formatarPercentual(r.margemLiquidaEst))}
          {linha('Preço sugerido (margem)', r.somaInvalida ? 'soma ≥ 100%' : (r.precoSugeridoPorMargem != null ? formatarBRL(r.precoSugeridoPorMargem) : '—'))}
          {linha('Preço sugerido (CMV alvo)', r.precoSugeridoPorCmv != null ? formatarBRL(r.precoSugeridoPorCmv) : '—')}
          <div className="flex justify-between items-center pt-2 mt-1" style={{ borderTop: '1px solid var(--ada-border)' }}>
            <span className="text-sm" style={{ color: 'var(--ada-muted)' }}>Status</span>
            <StatusBadge variante={STATUS_BADGE[r.status].variante} label={STATUS_BADGE[r.status].label} />
          </div>
        </div>

        {r.somaInvalida && (
          <p className="text-sm" style={{ color: 'var(--ada-error-text)' }}>
            Despesa fixa % + taxas % + margem desejada % ≥ 100% — ajuste os percentuais.
          </p>
        )}

        <div className="flex justify-end">
          <button type="button" onClick={onFechar}
            className="rounded-lg px-4 py-2 text-sm font-medium border" style={inputStyle}>Fechar</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check + lint**

Run (em `frontend/`): `npx tsc --noEmit` e `npx eslint src/features/financeiro/precificacao`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/financeiro/precificacao/components/ModalSimulador.tsx
git commit -m "feat(precificacao): modal simulador de preço (recalcula na hora)"
```

---

## TASK 10 — Rota + Sidebar + verificação final

**Files:**
- Modify: `frontend/src/routes/AppRoutes.tsx`
- Modify: `frontend/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Importar e rotear a página**

Em `AppRoutes.tsx`, junto aos imports do Financeiro:
```tsx
import { PrecificacaoPage } from '@/features/financeiro/precificacao/pages/PrecificacaoPage'
```
E na seção `{/* Financeiro */}`, após a rota de fechamento:
```tsx
          <Route path="/financeiro/precificacao" element={<PrecificacaoPage />} />
```

- [ ] **Step 2: Item na Sidebar**

Em `Sidebar.tsx`, no array do grupo Financeiro (que já tem Despesas Fixas e Fechamento Mensal), adicionar um terceiro item usando o ícone `CalculatorIcon` já importado (ou `ChartBarIcon`):
```tsx
                { label: 'Precificação', href: '/financeiro/precificacao', icon: CalculatorIcon },
```
> Se `CalculatorIcon` já estiver em uso pelo "Fechamento Mensal", importe e use `ChartBarIcon` (ou `CurrencyDollarIcon`) para a Precificação, evitando ícone duplicado.

- [ ] **Step 3: Verificação completa**

Run (em `frontend/`):
```bash
npx tsc --noEmit
npx eslint src/features/financeiro src/components/layout/Sidebar.tsx src/routes/AppRoutes.tsx
```
Expected: sem erros.
Run (na raiz `CasaDiAna/`):
```bash
dotnet build src/CasaDiAna.API
dotnet test tests/CasaDiAna.Application.Tests
```
Expected: Build succeeded; todos os testes PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/routes/AppRoutes.tsx frontend/src/components/layout/Sidebar.tsx
git commit -m "feat(precificacao): rota e item Precificação na sidebar"
```

- [ ] **Step 5: Push (deploy Render aplica a migration no startup)**

```bash
git push origin master
```

- [ ] **Step 6: Teste E2E autenticado no staging (Render)** — após o deploy concluir

Logar via `POST /api/auth/login` (admin seed) e, com o bearer token:
1. `GET /api/precificacao/configuracao` → 200, defaults 0.30/0.20/0.
2. `PUT /api/precificacao/configuracao` `{ "cmvAlvo":0.35,"margemDesejada":0.25,"taxas":0.05 }` → 200.
3. `GET /api/precificacao/analise?competencia=2099-01-01` → 200; conferir **à mão** um produto: `cmvAtual = custo/preço`, `precoSugeridoPorCmv = custo/0.35`, `precoSugeridoPorMargem = custo/(1 − dfp − 0.05 − 0.25)`, e o status conforme as regras.
4. `PUT` config de volta para `{ "cmvAlvo":0.30,"margemDesejada":0.20,"taxas":0 }` (restaura defaults).

---

## Self-review (preenchido)

**Cobertura do spec:**
- Config global (CMV alvo/margem/taxas) get-or-create + update → Tasks 1-3, 5. ✓
- Análise reusando custo da ficha + `DespesaFixaPercentual` do fechamento → Task 4. ✓
- Função pura única (listagem + simulador), zero duplicação de fórmula → Tasks 6, 8, 9. ✓
- Fórmulas (CMV%, contribuição, rateio, lucro, margem líquida, preço por CMV e por margem, custo máximo, diferença) com bloqueio `denom ≤ 0` → Task 6. ✓
- Status 5 níveis com limiares e banda de 5pp → Task 6. ✓
- Listagem com colunas, filtros e ordenações client-side → Task 8. ✓
- Simulador modal recalculando na hora → Task 9. ✓
- Casos-limite: `semCusto`, mês sem faturamento (banner + rateio 0), `denom ≤ 0`, só ativos → Tasks 4, 6, 8. ✓
- Rota/sidebar/permissões Admin+Coordenador → Tasks 5, 10. ✓

**Consistência de tipos:** `ConfiguracaoPrecificacaoDto`/`ProdutoPrecificacaoDto`/`AnalisePrecificacaoDto` (backend) espelhados em `ConfiguracaoPrecificacao`/`ProdutoPrecificacao`/`AnalisePrecificacao` (TS). `calcularPrecificacao(input, ctx)` e `STATUS_BADGE` usados igualmente na tabela e no modal. `ToDto` de config reutilizado pelo handler de atualizar. `DespesaFixa.NormalizarCompetencia` reusado no handler de análise.

**Pontos de atenção para o executor:**
- `FechamentoMensalDto` tem 12 campos posicionais — confira a ordem real (Fase 1) ao construir o mock no teste da Task 4: `(Competencia, FaturamentoCalculado, FaturamentoManual, FaturamentoUsado, CustoDiretoTotal, TotalDespesasFixas, FolhaPagamento, DespesaFixaPercentual, MargemBruta, MargemOperacional, PrimeCost, DespesasPorCategoria)`.
- Tokens `--ada-warning-*`: se não existirem em `index.css`, usar `--ada-error-*` no banner (Task 8).
- Ícone da Precificação na sidebar: não duplicar o do Fechamento.
- Enums/percentuais como **fração** ponta a ponta; a UI converte ×/÷100 só na exibição/edição.
