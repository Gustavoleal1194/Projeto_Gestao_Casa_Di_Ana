# Taxa de Serviço e Entregas na Importação e no Fechamento — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar na importação de vendas os valores de taxa de serviço e entregas e exibi-los no fechamento mensal como receita, com o repasse (equipe e motoboys) lançado como saída.

**Architecture:** O parser de CSV deixa de descartar as linhas de taxa e entrega. Um classificador único na Application marca essas linhas como `Repasse` na prévia. A confirmação grava os totais e um snapshot dos percentuais de repasse na entidade `ImportacaoVendas`. O fechamento mensal soma as importações do mês por `DataVenda` e calcula receita total, repasses e receita líquida. Os percentuais ficam numa entidade singleton `ConfiguracaoRepasse`, editável na tela de Fechamento.

**Tech Stack:** ASP.NET Core 8, MediatR (CQRS), FluentValidation, EF Core + Npgsql, xUnit + Moq + FluentAssertions; React 18 + TypeScript + Tailwind v4.

**Spec:** `CasaDiAna/docs/superpowers/specs/2026-10-10-repasses-taxa-servico-entregas-design.md`

Todos os caminhos abaixo são relativos a `CasaDiAna/`.

## Global Constraints

- Todo texto de UI, mensagem de erro, nome de teste e commit em **português do Brasil**.
- Backend: buildar pelo projeto API (`dotnet build src/CasaDiAna.API`). Testes: `dotnet test tests/CasaDiAna.Application.Tests`.
- Migrations: `~/.dotnet/tools/dotnet-ef.exe migrations add <Nome> --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API` (o `dotnet ef` global não está no PATH).
- EF Core: toda coluna mapeada com `HasColumnName()` em snake_case. Percentuais com `HasPrecision(6, 4)`, valores monetários com `HasPrecision(12, 2)`.
- Enums trafegam na API como **string camelCase** (`JsonStringEnumConverter(JsonNamingPolicy.CamelCase)`): o frontend tipa como union de strings (`'repasse'`, `'taxaServico'`, `'entrega'`).
- Respostas da API via `ApiResponse<T>`. Erros de regra de negócio via `DomainException` (vira 422).
- Frontend: cores só via tokens `var(--ada-*)`, nunca classes Tailwind de cor. Checagem de tipos: `npx tsc -b --noEmit` dentro de `frontend/`.
- Zero duplicação: lógica repetida vira helper/componente antes de ser usada no segundo lugar.
- Percentuais da taxa de serviço são **somados sobre o total**: repasse à equipe = taxa × (1 − retenção − cartão). Padrões: retenção **0,25**, cartão **0,03**.
- Repasse aos motoboys = **100%** das entregas.
- Faturamento manual continua substituindo **só a receita de produtos**.

## Review Focus

1. **"Taxa de entrega" no CSV** → deve contar como **Entrega**, não como taxa de serviço (o prefixo "taxa" sozinho classificaria errado). Teste no Task 3.
2. **CSV só com linhas de taxa/entrega** (nenhum produto) → a prévia não pode lançar "Nenhuma linha" e a confirmação deve aceitar `Itens` vazio com repasse > 0. Testes nos Tasks 3 e 4.
3. **Retenção + cartão ≥ 100%** → rejeitado no domínio e no validator, sem gerar repasse negativo. Testes nos Tasks 1 e 5.
4. **Mês com faturamento manual e importações com taxa** → receita total = manual + taxa + entregas (o manual não "engole" a taxa). Teste no Task 6.
5. **Importação com data de venda no dia 1º do mês seguinte** → não entra no mês corrente (consulta com fim exclusivo). Teste no Task 6 verificando os limites passados ao repositório.

---

### Task 1: Domínio — `ConfiguracaoRepasse` e campos de repasse em `ImportacaoVendas`

**Files:**
- Create: `src/CasaDiAna.Domain/Entities/ConfiguracaoRepasse.cs`
- Modify: `src/CasaDiAna.Domain/Entities/ImportacaoVendas.cs`
- Test: `tests/CasaDiAna.Application.Tests/FechamentoMensal/ConfiguracaoRepasseTests.cs`
- Test: `tests/CasaDiAna.Application.Tests/ImportacaoVendas/ImportacaoVendasTests.cs`

**Interfaces:**
- Produces:
  - `ConfiguracaoRepasse.Padrao(Guid criadoPor)`; `Atualizar(decimal percentualRetencaoCasa, decimal percentualTaxaCartao, Guid atualizadoPor)`; propriedades `Id`, `PercentualRetencaoCasa`, `PercentualTaxaCartao`, `AtualizadoEm`, `AtualizadoPor`; constantes `RetencaoCasaPadrao = 0.25m`, `TaxaCartaoPadrao = 0.03m`.
  - `ImportacaoVendas.Criar(string nomeArquivo, string hashConteudo, string? periodoDe, string? periodoAte, int totalLinhas, int totalImportadas, int totalIgnoradas, int totalNaoEncontradas, DateTime dataVenda, decimal totalTaxaServico, decimal totalEntregas, ConfiguracaoRepasse configuracaoRepasse, Guid criadoPor)`.
  - Novas propriedades em `ImportacaoVendas`: `DateTime? DataVenda`, `decimal TotalTaxaServico`, `decimal TotalEntregas`, `decimal PercentualRetencaoCasa`, `decimal PercentualTaxaCartao`, e calculadas `decimal RepasseEquipe`, `decimal RepasseMotoboys`.

- [ ] **Step 1: Escrever os testes de `ConfiguracaoRepasse` (falhando)**

`tests/CasaDiAna.Application.Tests/FechamentoMensal/ConfiguracaoRepasseTests.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.FechamentoMensal;

public class ConfiguracaoRepasseTests
{
    [Fact]
    public void Padrao_DeveTer25PorCentoDeRetencaoE3PorCentoDeCartao()
    {
        var c = ConfiguracaoRepasse.Padrao(Guid.NewGuid());

        c.PercentualRetencaoCasa.Should().Be(0.25m);
        c.PercentualTaxaCartao.Should().Be(0.03m);
    }

    [Fact]
    public void Atualizar_DeveAlterarPercentuais()
    {
        var c = ConfiguracaoRepasse.Padrao(Guid.NewGuid());
        var usuario = Guid.NewGuid();

        c.Atualizar(0.20m, 0.04m, usuario);

        c.PercentualRetencaoCasa.Should().Be(0.20m);
        c.PercentualTaxaCartao.Should().Be(0.04m);
        c.AtualizadoPor.Should().Be(usuario);
    }

    [Theory]
    [InlineData(-0.01, 0.03)]  // retenção negativa
    [InlineData(1, 0)]         // retenção = 100%
    [InlineData(0.25, -0.01)]  // cartão negativo
    [InlineData(0.25, 1)]      // cartão = 100%
    [InlineData(0.6, 0.4)]     // soma = 100%
    [InlineData(0.7, 0.5)]     // soma > 100%
    public void Atualizar_DeveRejeitarPercentuaisInvalidos(double retencao, double cartao)
    {
        var c = ConfiguracaoRepasse.Padrao(Guid.NewGuid());

        var act = () => c.Atualizar((decimal)retencao, (decimal)cartao, Guid.NewGuid());

        act.Should().Throw<DomainException>();
    }
}
```

- [ ] **Step 2: Escrever os testes de `ImportacaoVendas` (falhando)**

`tests/CasaDiAna.Application.Tests/ImportacaoVendas/ImportacaoVendasTests.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;
using EntidadeImportacao = CasaDiAna.Domain.Entities.ImportacaoVendas;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class ImportacaoVendasTests
{
    private static EntidadeImportacao Criar(decimal taxa, decimal entregas, ConfiguracaoRepasse? config = null) =>
        EntidadeImportacao.Criar(
            "vendas.csv", "hash", null, null,
            totalLinhas: 3, totalImportadas: 1, totalIgnoradas: 0, totalNaoEncontradas: 0,
            dataVenda: new DateTime(2026, 6, 10),
            totalTaxaServico: taxa, totalEntregas: entregas,
            configuracaoRepasse: config ?? ConfiguracaoRepasse.Padrao(Guid.NewGuid()),
            criadoPor: Guid.NewGuid());

    [Fact]
    public void Criar_DeveGravarTotaisDataESnapshotDosPercentuais()
    {
        var imp = Criar(1000m, 500m);

        imp.DataVenda.Should().Be(new DateTime(2026, 6, 10));
        imp.TotalTaxaServico.Should().Be(1000m);
        imp.TotalEntregas.Should().Be(500m);
        imp.PercentualRetencaoCasa.Should().Be(0.25m);
        imp.PercentualTaxaCartao.Should().Be(0.03m);
    }

    [Fact]
    public void RepasseEquipe_DeveSer72PorCentoDaTaxa_ComPercentuaisPadrao()
    {
        Criar(1000m, 0m).RepasseEquipe.Should().Be(720m);
    }

    [Fact]
    public void RepasseEquipe_DeveArredondarEmDuasCasas()
    {
        // 9,99 × 0,72 = 7,1928 → 7,19
        Criar(9.99m, 0m).RepasseEquipe.Should().Be(7.19m);
    }

    [Fact]
    public void RepasseMotoboys_DeveSerOTotalDeEntregas()
    {
        Criar(0m, 500m).RepasseMotoboys.Should().Be(500m);
    }

    [Fact]
    public void Snapshot_NaoMudaQuandoConfiguracaoMudaDepois()
    {
        var config = ConfiguracaoRepasse.Padrao(Guid.NewGuid());
        var imp = Criar(1000m, 0m, config);

        config.Atualizar(0.10m, 0.05m, Guid.NewGuid());

        imp.RepasseEquipe.Should().Be(720m);
    }

    [Theory]
    [InlineData(-1, 0)]
    [InlineData(0, -1)]
    public void Criar_DeveRejeitarTotaisNegativos(double taxa, double entregas)
    {
        var act = () => Criar((decimal)taxa, (decimal)entregas);

        act.Should().Throw<DomainException>();
    }
}
```

- [ ] **Step 3: Rodar os testes e confirmar a falha de compilação**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~ConfiguracaoRepasseTests|FullyQualifiedName~ImportacaoVendasTests"`
Expected: erro de compilação (`ConfiguracaoRepasse` não existe; `Criar` sem os novos parâmetros).

- [ ] **Step 4: Criar `ConfiguracaoRepasse`**

`src/CasaDiAna.Domain/Entities/ConfiguracaoRepasse.cs`:

```csharp
using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

/// <summary>
/// Percentuais usados para calcular o repasse da taxa de serviço à equipe.
/// Ambos incidem sobre o valor total da taxa: equipe = taxa × (1 − retenção − cartão).
/// </summary>
public class ConfiguracaoRepasse
{
    public const decimal RetencaoCasaPadrao = 0.25m;
    public const decimal TaxaCartaoPadrao = 0.03m;

    public Guid Id { get; private set; }
    public decimal PercentualRetencaoCasa { get; private set; }
    public decimal PercentualTaxaCartao { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    private ConfiguracaoRepasse() { }

    public static ConfiguracaoRepasse Padrao(Guid criadoPor) => new()
    {
        Id = Guid.NewGuid(),
        PercentualRetencaoCasa = RetencaoCasaPadrao,
        PercentualTaxaCartao = TaxaCartaoPadrao,
        AtualizadoEm = DateTime.UtcNow,
        AtualizadoPor = criadoPor
    };

    public void Atualizar(decimal percentualRetencaoCasa, decimal percentualTaxaCartao, Guid atualizadoPor)
    {
        ValidarFracao(percentualRetencaoCasa, "Retenção da casa");
        ValidarFracao(percentualTaxaCartao, "Taxa do cartão");
        if (percentualRetencaoCasa + percentualTaxaCartao >= 1)
            throw new DomainException("A soma da retenção da casa com a taxa do cartão deve ser menor que 100%.");

        PercentualRetencaoCasa = percentualRetencaoCasa;
        PercentualTaxaCartao = percentualTaxaCartao;
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

- [ ] **Step 5: Estender `ImportacaoVendas`**

Em `src/CasaDiAna.Domain/Entities/ImportacaoVendas.cs`, adicionar `using CasaDiAna.Domain.Exceptions;` no topo, as propriedades abaixo depois de `TotalNaoEncontradas`, e substituir `Criar`:

```csharp
    public DateTime? DataVenda { get; private set; }
    public decimal TotalTaxaServico { get; private set; }
    public decimal TotalEntregas { get; private set; }
    public decimal PercentualRetencaoCasa { get; private set; }
    public decimal PercentualTaxaCartao { get; private set; }

    /// <summary>Parte da taxa de serviço repassada à equipe (percentuais do snapshot).</summary>
    public decimal RepasseEquipe => Math.Round(
        TotalTaxaServico * (1 - PercentualRetencaoCasa - PercentualTaxaCartao),
        2, MidpointRounding.AwayFromZero);

    /// <summary>Entregas são repassadas integralmente aos motoboys.</summary>
    public decimal RepasseMotoboys => TotalEntregas;
```

```csharp
    public static ImportacaoVendas Criar(
        string nomeArquivo,
        string hashConteudo,
        string? periodoDe,
        string? periodoAte,
        int totalLinhas,
        int totalImportadas,
        int totalIgnoradas,
        int totalNaoEncontradas,
        DateTime dataVenda,
        decimal totalTaxaServico,
        decimal totalEntregas,
        ConfiguracaoRepasse configuracaoRepasse,
        Guid criadoPor)
    {
        if (totalTaxaServico < 0)
            throw new DomainException("Total de taxa de serviço não pode ser negativo.");
        if (totalEntregas < 0)
            throw new DomainException("Total de entregas não pode ser negativo.");

        return new ImportacaoVendas
        {
            Id = Guid.NewGuid(),
            NomeArquivo = nomeArquivo,
            HashConteudo = hashConteudo,
            CriadoEm = DateTime.UtcNow,
            PeriodoDe = periodoDe,
            PeriodoAte = periodoAte,
            TotalLinhasParseadas = totalLinhas,
            TotalImportadas = totalImportadas,
            TotalIgnoradas = totalIgnoradas,
            TotalNaoEncontradas = totalNaoEncontradas,
            DataVenda = dataVenda,
            TotalTaxaServico = totalTaxaServico,
            TotalEntregas = totalEntregas,
            PercentualRetencaoCasa = configuracaoRepasse.PercentualRetencaoCasa,
            PercentualTaxaCartao = configuracaoRepasse.PercentualTaxaCartao,
            CriadoPor = criadoPor
        };
    }
```

- [ ] **Step 6: Ajustar o único chamador para compilar**

Em `src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/ConfirmarImportacaoCommandHandler.cs`, a chamada `EntidadeImportacao.Criar(...)` passa provisoriamente os novos argumentos antes de `_currentUser.UsuarioId` (o Task 4 troca pelos valores reais):

```csharp
            request.TotalNaoEncontradas,
            request.DataVenda,
            totalTaxaServico: 0m,
            totalEntregas: 0m,
            ConfiguracaoRepasse.Padrao(_currentUser.UsuarioId),
            _currentUser.UsuarioId);
```

Adicionar, junto dos aliases já existentes no topo do arquivo (o handler usa aliases porque o namespace `ImportacaoVendas` colide com o nome da entidade): `using ConfiguracaoRepasse = CasaDiAna.Domain.Entities.ConfiguracaoRepasse;`.

- [ ] **Step 7: Rodar todos os testes**

Run: `dotnet test tests/CasaDiAna.Application.Tests`
Expected: PASS (todos, incluindo os novos).

- [ ] **Step 8: Commit**

```bash
git add src/CasaDiAna.Domain src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/ConfirmarImportacaoCommandHandler.cs tests/CasaDiAna.Application.Tests
git commit -m "feat(dominio): configuração de repasse e totais de taxa/entrega na importação"
```

---

### Task 2: Persistência — mapeamento, repositórios e migration

**Files:**
- Modify: `src/CasaDiAna.Infrastructure/Persistence/Configurations/ImportacaoVendasConfiguration.cs`
- Create: `src/CasaDiAna.Infrastructure/Persistence/Configurations/ConfiguracaoRepasseConfiguration.cs`
- Modify: `src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs` (junto dos outros `DbSet`, ~linha 35)
- Create: `src/CasaDiAna.Domain/Interfaces/IConfiguracaoRepasseRepository.cs`
- Create: `src/CasaDiAna.Infrastructure/Repositories/ConfiguracaoRepasseRepository.cs`
- Modify: `src/CasaDiAna.Domain/Interfaces/IImportacaoVendasRepository.cs`
- Modify: `src/CasaDiAna.Infrastructure/Repositories/ImportacaoVendasRepository.cs`
- Modify: `src/CasaDiAna.Infrastructure/DependencyInjection.cs` (~linha 60)
- Create: migration `AddRepassesImportacaoVendas` em `src/CasaDiAna.Infrastructure/Persistence/Migrations/`

**Interfaces:**
- Consumes: entidades do Task 1.
- Produces:
  - `IConfiguracaoRepasseRepository { Task<ConfiguracaoRepasse?> ObterAsync(CancellationToken ct = default); Task AdicionarAsync(ConfiguracaoRepasse config, CancellationToken ct = default); void Atualizar(ConfiguracaoRepasse config); Task<int> SalvarAsync(CancellationToken ct = default); }`
  - `IImportacaoVendasRepository.ListarPorDataVendaAsync(DateTime inicio, DateTime fimExclusivo, CancellationToken ct = default) : Task<IReadOnlyList<ImportacaoVendas>>`

- [ ] **Step 1: Mapear os novos campos de `ImportacaoVendas`**

Em `ImportacaoVendasConfiguration.Configure`, antes de `CriadoPor`:

```csharp
        // Mesmo mapeamento de VendaDiaria.Data (sem HasColumnType), para os dois
        // filtros por data de venda se comportarem igual.
        builder.Property(i => i.DataVenda).HasColumnName("data_venda");
        builder.HasIndex(i => i.DataVenda);
        builder.Property(i => i.TotalTaxaServico).HasColumnName("total_taxa_servico").HasPrecision(12, 2).IsRequired();
        builder.Property(i => i.TotalEntregas).HasColumnName("total_entregas").HasPrecision(12, 2).IsRequired();
        builder.Property(i => i.PercentualRetencaoCasa).HasColumnName("percentual_retencao_casa").HasPrecision(6, 4).IsRequired();
        builder.Property(i => i.PercentualTaxaCartao).HasColumnName("percentual_taxa_cartao").HasPrecision(6, 4).IsRequired();
        builder.Ignore(i => i.RepasseEquipe);
        builder.Ignore(i => i.RepasseMotoboys);
```

Não usar `HasDefaultValue`: a migration já gera `defaultValue: 0m` para colunas decimais não nulas adicionadas a uma tabela existente, e `HasDefaultValue` em decimal dispara o aviso de *sentinel value* que o projeto já tem em `Produto.Tipo`.

- [ ] **Step 2: Criar o mapeamento de `ConfiguracaoRepasse`**

`src/CasaDiAna.Infrastructure/Persistence/Configurations/ConfiguracaoRepasseConfiguration.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class ConfiguracaoRepasseConfiguration : IEntityTypeConfiguration<ConfiguracaoRepasse>
{
    public void Configure(EntityTypeBuilder<ConfiguracaoRepasse> builder)
    {
        builder.ToTable("configuracao_repasse", "financeiro");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.PercentualRetencaoCasa).HasColumnName("percentual_retencao_casa").HasPrecision(6, 4).IsRequired();
        builder.Property(c => c.PercentualTaxaCartao).HasColumnName("percentual_taxa_cartao").HasPrecision(6, 4).IsRequired();
        builder.Property(c => c.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(c => c.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();
    }
}
```

Em `AppDbContext.cs`, junto de `ConfiguracoesPrecificacao`:

```csharp
    public DbSet<ConfiguracaoRepasse> ConfiguracoesRepasse => Set<ConfiguracaoRepasse>();
```

(Confirme que o `AppDbContext` aplica as configurações com `ApplyConfigurationsFromAssembly`. Se registrar uma a uma, adicione a nova lá também.)

- [ ] **Step 3: Criar o repositório de `ConfiguracaoRepasse`**

`src/CasaDiAna.Domain/Interfaces/IConfiguracaoRepasseRepository.cs`:

```csharp
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IConfiguracaoRepasseRepository
{
    Task<ConfiguracaoRepasse?> ObterAsync(CancellationToken ct = default);
    Task AdicionarAsync(ConfiguracaoRepasse config, CancellationToken ct = default);
    void Atualizar(ConfiguracaoRepasse config);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

`src/CasaDiAna.Infrastructure/Repositories/ConfiguracaoRepasseRepository.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class ConfiguracaoRepasseRepository : IConfiguracaoRepasseRepository
{
    private readonly AppDbContext _db;

    public ConfiguracaoRepasseRepository(AppDbContext db) => _db = db;

    public Task<ConfiguracaoRepasse?> ObterAsync(CancellationToken ct = default) =>
        _db.ConfiguracoesRepasse.FirstOrDefaultAsync(ct);

    public async Task AdicionarAsync(ConfiguracaoRepasse config, CancellationToken ct = default) =>
        await _db.ConfiguracoesRepasse.AddAsync(config, ct);

    public void Atualizar(ConfiguracaoRepasse config) =>
        _db.ConfiguracoesRepasse.Update(config);

    public Task<int> SalvarAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
```

Em `DependencyInjection.cs`, ao lado de `IConfiguracaoPrecificacaoRepository`:

```csharp
        services.AddScoped<IConfiguracaoRepasseRepository, ConfiguracaoRepasseRepository>();
```

- [ ] **Step 4: Adicionar a consulta por data de venda**

Em `IImportacaoVendasRepository`:

```csharp
    /// <summary>Importações com DataVenda em [inicio, fimExclusivo).</summary>
    Task<IReadOnlyList<ImportacaoVendas>> ListarPorDataVendaAsync(
        DateTime inicio, DateTime fimExclusivo, CancellationToken ct = default);
```

Em `ImportacaoVendasRepository`:

```csharp
    public async Task<IReadOnlyList<ImportacaoVendas>> ListarPorDataVendaAsync(
        DateTime inicio, DateTime fimExclusivo, CancellationToken ct = default) =>
        await _db.ImportacoesVendas
            .Where(i => i.DataVenda >= inicio && i.DataVenda < fimExclusivo)
            .ToListAsync(ct);
```

- [ ] **Step 5: Buildar**

Run: `dotnet build src/CasaDiAna.API`
Expected: Build succeeded.

- [ ] **Step 6: Gerar a migration e revisar**

Run: `~/.dotnet/tools/dotnet-ef.exe migrations add AddRepassesImportacaoVendas --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API`

Abra o `*_AddRepassesImportacaoVendas.cs` gerado e confira que o `Up` contém **apenas**:
- `AddColumn<DateTime>` `data_venda` (nullable) em `producao.importacoes_vendas`;
- `AddColumn<decimal>` `total_taxa_servico`, `total_entregas` (precision 12,2, `defaultValue: 0m`) e `percentual_retencao_casa`, `percentual_taxa_cartao` (precision 6,4, `defaultValue: 0m`);
- `CreateIndex` em `data_venda`;
- `CreateTable` `financeiro.configuracao_repasse`.

E que o `Down` desfaz exatamente isso. Se aparecer qualquer outra operação (alteração não relacionada), pare e investigue antes de seguir.

- [ ] **Step 7: Rodar os testes**

Run: `dotnet test tests/CasaDiAna.Application.Tests`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/CasaDiAna.Domain/Interfaces src/CasaDiAna.Infrastructure
git commit -m "feat(persistencia): colunas de repasse em importacoes_vendas e configuracao_repasse"
```

---

### Task 3: Classificação de linhas — parser devolve tudo, prévia marca `Repasse`

**Files:**
- Create: `src/CasaDiAna.Application/ImportacaoVendas/Dtos/TipoRepasse.cs`
- Create: `src/CasaDiAna.Application/ImportacaoVendas/Services/NormalizadorNome.cs`
- Create: `src/CasaDiAna.Application/ImportacaoVendas/Services/ClassificadorLinhaVenda.cs`
- Modify: `src/CasaDiAna.Application/ImportacaoVendas/Dtos/StatusImportacao.cs`
- Modify: `src/CasaDiAna.Application/ImportacaoVendas/Dtos/ItemPreviewDto.cs`
- Modify: `src/CasaDiAna.Application/ImportacaoVendas/Dtos/PreviewImportacaoDto.cs`
- Modify: `src/CasaDiAna.Application/ImportacaoVendas/Commands/ProcessarPreview/ProcessarPreviewVendasCommandHandler.cs`
- Modify: `src/CasaDiAna.Infrastructure/Services/CsvVendasParser.cs`
- Test: `tests/CasaDiAna.Application.Tests/ImportacaoVendas/ClassificadorLinhaVendaTests.cs`
- Test: `tests/CasaDiAna.Application.Tests/ImportacaoVendas/CsvVendasParserTests.cs`
- Test: `tests/CasaDiAna.Application.Tests/ImportacaoVendas/ProcessarPreviewHandlerTests.cs`

**Interfaces:**
- Produces:
  - `enum TipoRepasse { TaxaServico = 1, Entrega = 2 }` (namespace `CasaDiAna.Application.ImportacaoVendas.Dtos`), JSON: `"taxaServico"`, `"entrega"`.
  - `StatusImportacao.Repasse = 5` (JSON `"repasse"`).
  - `static class NormalizadorNome { public static string Normalizar(string s); }`
  - `static class ClassificadorLinhaVenda { public static TipoRepasse? ClassificarRepasse(string nome); }`
  - `ItemPreviewDto(..., IReadOnlyList<SugestaoMatchDto> Sugestoes, TipoRepasse? TipoRepasse = null)`
  - `PreviewImportacaoDto(..., int TotalIgnored, int TotalRepasses, decimal TotalTaxaServico, decimal TotalEntregas, IReadOnlyList<ItemPreviewDto> Itens)`

- [ ] **Step 1: Testes do classificador (falhando)**

`tests/CasaDiAna.Application.Tests/ImportacaoVendas/ClassificadorLinhaVendaTests.cs`:

```csharp
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Application.ImportacaoVendas.Services;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class ClassificadorLinhaVendaTests
{
    [Theory]
    [InlineData("TAXA DE SERVIÇO")]
    [InlineData("taxa servico")]
    [InlineData("Taxa de Serviço 10%")]
    public void TaxaDeServico_ClassificadaComoTaxaServico(string nome) =>
        ClassificadorLinhaVenda.ClassificarRepasse(nome).Should().Be(TipoRepasse.TaxaServico);

    [Theory]
    [InlineData("Entrega longe")]
    [InlineData("Entrega perto")]
    [InlineData("ENTREGA")]
    [InlineData("Taxa de entrega")]
    [InlineData("Taxa entrega")]
    public void Entrega_ClassificadaComoEntrega(string nome) =>
        ClassificadorLinhaVenda.ClassificarRepasse(nome).Should().Be(TipoRepasse.Entrega);

    [Theory]
    [InlineData("Bacon")]
    [InlineData("Bacon - Acrescimo")]
    [InlineData("Nutella - Acréscimo")]
    [InlineData("Diversos - Valor R$ 25,00")]
    [InlineData("Torta de entrega especial")] // "entrega" no meio não conta
    public void Produto_NaoEhRepasse(string nome) =>
        ClassificadorLinhaVenda.ClassificarRepasse(nome).Should().BeNull();
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~ClassificadorLinhaVendaTests"`
Expected: erro de compilação (`ClassificadorLinhaVenda`/`TipoRepasse` inexistentes).

- [ ] **Step 3: Implementar enum, normalizador e classificador**

`src/CasaDiAna.Application/ImportacaoVendas/Dtos/TipoRepasse.cs`:

```csharp
namespace CasaDiAna.Application.ImportacaoVendas.Dtos;

public enum TipoRepasse
{
    TaxaServico = 1,
    Entrega     = 2,
}
```

Em `StatusImportacao.cs`, adicionar depois de `Ignored`:

```csharp
    Repasse    = 5,
```

`src/CasaDiAna.Application/ImportacaoVendas/Services/NormalizadorNome.cs`: mover para cá, **sem alterar a lógica**, o método `Normalizar` que hoje é `private static` em `ProcessarPreviewVendasCommandHandler`:

```csharp
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace CasaDiAna.Application.ImportacaoVendas.Services;

/// <summary>
/// Normaliza nomes do relatório e de produtos para comparação: sem acento,
/// minúsculo, sem pontuação de separação e com espaços colapsados.
/// </summary>
public static class NormalizadorNome
{
    public static string Normalizar(string s)
    {
        if (string.IsNullOrWhiteSpace(s)) return string.Empty;
        var formD = s.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(formD.Length);
        foreach (var c in formD)
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        return Regex.Replace(
            sb.ToString().Normalize(NormalizationForm.FormC)
              .ToLowerInvariant()
              .Replace("-", " ").Replace("/", " ")
              .Replace("(", "").Replace(")", "").Replace(".", ""),
            @"\s+", " ").Trim();
    }
}
```

`src/CasaDiAna.Application/ImportacaoVendas/Services/ClassificadorLinhaVenda.cs`:

```csharp
using CasaDiAna.Application.ImportacaoVendas.Dtos;

namespace CasaDiAna.Application.ImportacaoVendas.Services;

/// <summary>
/// Única regra que identifica linhas do relatório que não são produto, e sim
/// valores repassados (taxa de serviço à equipe, entregas aos motoboys).
/// </summary>
public static class ClassificadorLinhaVenda
{
    public static TipoRepasse? ClassificarRepasse(string nome)
    {
        var norm = NormalizadorNome.Normalizar(nome);

        // Entrega primeiro: "Taxa de entrega" começa com "taxa" mas é entrega.
        if (norm.StartsWith("entrega") || norm.StartsWith("taxa de entrega") || norm.StartsWith("taxa entrega"))
            return TipoRepasse.Entrega;
        if (norm.StartsWith("taxa"))
            return TipoRepasse.TaxaServico;
        return null;
    }
}
```

- [ ] **Step 4: Rodar os testes do classificador**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~ClassificadorLinhaVendaTests"`
Expected: PASS.

- [ ] **Step 5: Atualizar os testes do parser (falhando)**

Em `CsvVendasParserTests.cs`:

Substituir `Parse_TaxaDeServico_Ignorada` por:

```csharp
    [Fact]
    public void Parse_TaxaDeServico_Devolvida()
    {
        var bytes = MakeBytes(["77;TAXA DE SERVIÇO;Indefinido;9,04;411;3719,4"]);

        var result = _parser.Parse(bytes);

        result.Linhas.Should().HaveCount(1);
        result.Linhas[0].Nome.Should().Be("TAXA DE SERVIÇO");
        result.Linhas[0].ValorTotal.Should().Be(3719.4m);
    }
```

Substituir `Parse_EntregaLonge_Ignorada` por:

```csharp
    [Fact]
    public void Parse_EntregaLonge_Devolvida()
    {
        var bytes = MakeBytes(["50;Entrega longe;Indefinido;10,00;5;50,00"]);

        var result = _parser.Parse(bytes);

        result.Linhas.Should().HaveCount(1);
        result.Linhas[0].ValorTotal.Should().Be(50m);
    }
```

Substituir `Parse_MultiplasLinhas_TaxaFiltrada_RestanteImportado` por:

```csharp
    [Fact]
    public void Parse_MultiplasLinhas_TodasDevolvidas()
    {
        var bytes = MakeBytes([
            "164;Tortinha folhada de Pistache c/framboesa;A Vista;35;5;175",
            "88;Diversos - Valor R$ 25,00;A Vista;36,05;11;396,57",
            "77;TAXA DE SERVIÇO;Indefinido;9,04;411;3719,4",
        ]);

        var result = _parser.Parse(bytes);

        result.Linhas.Should().HaveCount(3);
        result.Linhas[0].Nome.Should().Be("Tortinha folhada de Pistache c/framboesa");
        result.Linhas[2].Nome.Should().Be("TAXA DE SERVIÇO");
    }
```

Remover o teste `IsIgnorado_SoTaxaEEntrega` (a regra agora é coberta por `ClassificadorLinhaVendaTests`).

- [ ] **Step 6: Fazer o parser parar de filtrar**

Em `src/CasaDiAna.Infrastructure/Services/CsvVendasParser.cs`:
- Remover a linha `if (IsIgnorado(nome)) continue;`.
- Remover os métodos `IsIgnorado` e `Normalizar`.
- Remover `using System.Text.RegularExpressions;` e `using System.Globalization;` **somente se** nenhum outro código do arquivo (ex.: `TryParseDecimalBR`) os usar. Confira compilando.

- [ ] **Step 7: Testes da prévia (falhando)**

Em `ProcessarPreviewHandlerTests.cs`, adicionar:

```csharp
    [Fact]
    public async Task Handle_LinhasDeTaxaEEntrega_RetornaRepasseComTotais()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new VendasParseResult(null, null, "hash_rep", new List<LinhaRelatorio>
               {
                   new("001", "Croissant", null, 10m, 100m),
                   new("77", "TAXA DE SERVIÇO", null, 411m, 3719.4m),
                   new("50", "Entrega longe", null, 5m, 50m),
                   new("51", "Entrega perto", null, 3m, 15m),
               }));
        _importacoes.Setup(r => r.HashExisteAsync("hash_rep", default)).ReturnsAsync(false);
        _produtos.Setup(r => r.ListarAsync(false, default))
                 .ReturnsAsync(new List<Produto> { CriarProduto(Guid.NewGuid(), "Croissant") });

        var result = await CreateHandler().Handle(
            new ProcessarPreviewVendasCommand(Array.Empty<byte>(), "rep.csv"), default);

        var taxa = result.Itens.Single(i => i.NomeRelatorio == "TAXA DE SERVIÇO");
        taxa.Status.Should().Be(StatusImportacao.Repasse);
        taxa.TipoRepasse.Should().Be(TipoRepasse.TaxaServico);
        taxa.ProdutoId.Should().BeNull();
        taxa.Sugestoes.Should().BeEmpty();

        result.Itens.Single(i => i.NomeRelatorio == "Entrega longe").TipoRepasse.Should().Be(TipoRepasse.Entrega);
        result.TotalMatched.Should().Be(1);
        result.TotalRepasses.Should().Be(3);
        result.TotalTaxaServico.Should().Be(3719.4m);
        result.TotalEntregas.Should().Be(65m);
        result.TotalIgnored.Should().Be(0);
    }

    [Fact]
    public async Task Handle_CsvSoComRepasses_NaoLancaExcecao()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new VendasParseResult(null, null, "hash_so_rep", new List<LinhaRelatorio>
               {
                   new("77", "TAXA DE SERVIÇO", null, 10m, 90m),
               }));
        _importacoes.Setup(r => r.HashExisteAsync("hash_so_rep", default)).ReturnsAsync(false);
        _produtos.Setup(r => r.ListarAsync(false, default)).ReturnsAsync(new List<Produto>());

        var result = await CreateHandler().Handle(
            new ProcessarPreviewVendasCommand(Array.Empty<byte>(), "so_rep.csv"), default);

        result.Itens.Should().ContainSingle(i => i.Status == StatusImportacao.Repasse);
        result.TotalTaxaServico.Should().Be(90m);
    }
```

- [ ] **Step 8: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~ProcessarPreviewHandlerTests"`
Expected: erro de compilação (`TotalRepasses`, `TipoRepasse` inexistentes no DTO).

- [ ] **Step 9: Estender os DTOs**

`ItemPreviewDto.cs`, último parâmetro novo com default (mantém os construtores atuais compilando):

```csharp
public record ItemPreviewDto(
    string? CodigoExterno,
    string NomeRelatorio,
    string? Grupo,
    decimal Quantidade,
    decimal ValorTotal,
    StatusImportacao Status,
    Guid? ProdutoId,
    string? ProdutoNome,
    IReadOnlyList<SugestaoMatchDto> Sugestoes,
    TipoRepasse? TipoRepasse = null);
```

`PreviewImportacaoDto.cs`:

```csharp
public record PreviewImportacaoDto(
    string Hash,
    string? PeriodoDe,
    string? PeriodoAte,
    int TotalLinhasParseadas,
    int TotalMatched,
    int TotalAmbiguous,
    int TotalUnmatched,
    int TotalIgnored,
    int TotalRepasses,
    decimal TotalTaxaServico,
    decimal TotalEntregas,
    IReadOnlyList<ItemPreviewDto> Itens);
```

- [ ] **Step 10: Atualizar o handler da prévia**

Em `ProcessarPreviewVendasCommandHandler.cs`:

1. Remover os métodos privados `Normalizar` e `IsIgnorado` e os `using` de `System.Globalization`, `System.Text` e `System.Text.RegularExpressions`. Trocar as chamadas `Normalizar(...)` por `NormalizadorNome.Normalizar(...)`.
2. No início de `Match`, trocar o bloco `if (IsIgnorado(linha.Nome)) { ... }` por:

```csharp
        var tipoRepasse = ClassificadorLinhaVenda.ClassificarRepasse(linha.Nome);
        if (tipoRepasse is not null)
            return Repasse(linha, tipoRepasse.Value);
```

3. Adicionar o factory, ao lado de `Matched`/`Ambiguous`:

```csharp
    private static ItemPreviewDto Repasse(LinhaRelatorio linha, TipoRepasse tipo) =>
        new(linha.CodigoExterno, linha.Nome, linha.Grupo,
            linha.Quantidade, linha.ValorTotal,
            StatusImportacao.Repasse,
            null, null, Array.Empty<SugestaoMatchDto>(), tipo);
```

4. Trocar o `return new PreviewImportacaoDto(...)` por:

```csharp
        decimal SomarRepasse(TipoRepasse tipo) =>
            itens.Where(i => i.TipoRepasse == tipo).Sum(i => i.ValorTotal);

        return new PreviewImportacaoDto(
            parseResult.Hash,
            parseResult.PeriodoDe,
            parseResult.PeriodoAte,
            TotalLinhasParseadas: parseResult.Linhas.Count,
            TotalMatched:     itens.Count(i => i.Status == StatusImportacao.Matched),
            TotalAmbiguous:   itens.Count(i => i.Status == StatusImportacao.Ambiguous),
            TotalUnmatched:   itens.Count(i => i.Status == StatusImportacao.Unmatched),
            TotalIgnored:     itens.Count(i => i.Status == StatusImportacao.Ignored),
            TotalRepasses:    itens.Count(i => i.Status == StatusImportacao.Repasse),
            TotalTaxaServico: SomarRepasse(TipoRepasse.TaxaServico),
            TotalEntregas:    SomarRepasse(TipoRepasse.Entrega),
            Itens: itens.AsReadOnly());
```

5. A mensagem de erro de lista vazia passa a ser `"Nenhuma linha foi encontrada no CSV. Verifique se o arquivo é um relatório válido."` (o teste existente usa `*Nenhuma linha*` e continua passando).

- [ ] **Step 11: Rodar todos os testes**

Run: `dotnet test tests/CasaDiAna.Application.Tests`
Expected: PASS.

- [ ] **Step 12: Commit**

```bash
git add src/CasaDiAna.Application/ImportacaoVendas src/CasaDiAna.Infrastructure/Services/CsvVendasParser.cs tests/CasaDiAna.Application.Tests/ImportacaoVendas
git commit -m "feat(importacao): taxa de serviço e entregas aparecem na prévia como repasse"
```

---

### Task 4: Confirmação grava os totais de repasse

**Files:**
- Modify: `src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/ConfirmarImportacaoCommand.cs`
- Modify: `src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/ConfirmarImportacaoCommandValidator.cs`
- Modify: `src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/ConfirmarImportacaoCommandHandler.cs`
- Modify: `src/CasaDiAna.Application/ImportacaoVendas/Dtos/ResultadoImportacaoDto.cs`
- Test: `tests/CasaDiAna.Application.Tests/ImportacaoVendas/ConfirmarImportacaoCommandHandlerTests.cs`
- Test: `tests/CasaDiAna.Application.Tests/ImportacaoVendas/ConfirmarImportacaoCommandValidatorTests.cs`

**Interfaces:**
- Consumes: `ImportacaoVendas.Criar(...)` e `ConfiguracaoRepasse` (Task 1); `IConfiguracaoRepasseRepository` (Task 2).
- Produces:
  - `ConfirmarImportacaoCommand(..., IReadOnlyList<ItemConfirmarDto> Itens, decimal TotalTaxaServico = 0, decimal TotalEntregas = 0)`; JSON `totalTaxaServico`, `totalEntregas`.
  - `ResultadoImportacaoDto(int TotalImportadas, int TotalIgnoradas, int TotalNaoEncontradas, decimal TotalTaxaServico, decimal TotalEntregas)`.

- [ ] **Step 1: Testes do handler (falhando)**

`tests/CasaDiAna.Application.Tests/ImportacaoVendas/ConfirmarImportacaoCommandHandlerTests.cs`:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;
using EntidadeImportacao = CasaDiAna.Domain.Entities.ImportacaoVendas;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class ConfirmarImportacaoCommandHandlerTests
{
    private readonly Mock<IVendaDiariaRepository> _vendas = new();
    private readonly Mock<IProdutoRepository> _produtos = new();
    private readonly Mock<IImportacaoVendasRepository> _importacoes = new();
    private readonly Mock<IConfiguracaoRepasseRepository> _configRepasse = new();
    private readonly Mock<ICurrentUserService> _user = new();
    private EntidadeImportacao? _gravada;

    public ConfirmarImportacaoCommandHandlerTests()
    {
        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _importacoes.Setup(r => r.HashExisteAsync(It.IsAny<string>(), default)).ReturnsAsync(false);
        _importacoes.Setup(r => r.AdicionarAsync(It.IsAny<EntidadeImportacao>(), default))
                    .Callback<EntidadeImportacao, CancellationToken>((i, _) => _gravada = i)
                    .Returns(Task.CompletedTask);
        _vendas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _produtos.Setup(r => r.ListarAsync(false, default)).ReturnsAsync(new List<Produto>());
    }

    private ConfirmarImportacaoCommandHandler Criar() =>
        new(_vendas.Object, _produtos.Object, _importacoes.Object, _configRepasse.Object, _user.Object);

    private static ConfirmarImportacaoCommand Command(
        IReadOnlyList<ItemConfirmarDto> itens, decimal taxa, decimal entregas) =>
        new("hash", "vendas.csv", new DateTime(2026, 6, 10), null, null,
            TotalLinhasParseadas: 3, TotalIgnoradas: 0, TotalNaoEncontradas: 0,
            Itens: itens, TotalTaxaServico: taxa, TotalEntregas: entregas);

    [Fact]
    public async Task DeveGravarTotaisDataESnapshotDaConfiguracaoVigente()
    {
        var config = ConfiguracaoRepasse.Padrao(Guid.NewGuid());
        config.Atualizar(0.20m, 0.05m, Guid.NewGuid());
        _configRepasse.Setup(r => r.ObterAsync(default)).ReturnsAsync(config);

        var resultado = await Criar().Handle(Command([], 1000m, 500m), CancellationToken.None);

        _gravada!.DataVenda.Should().Be(new DateTime(2026, 6, 10));
        _gravada.TotalTaxaServico.Should().Be(1000m);
        _gravada.TotalEntregas.Should().Be(500m);
        _gravada.PercentualRetencaoCasa.Should().Be(0.20m);
        _gravada.PercentualTaxaCartao.Should().Be(0.05m);
        resultado.TotalTaxaServico.Should().Be(1000m);
        resultado.TotalEntregas.Should().Be(500m);
    }

    [Fact]
    public async Task DeveUsarPercentuaisPadrao_QuandoNaoHaConfiguracao()
    {
        _configRepasse.Setup(r => r.ObterAsync(default)).ReturnsAsync((ConfiguracaoRepasse?)null);

        await Criar().Handle(Command([], 1000m, 0m), CancellationToken.None);

        _gravada!.PercentualRetencaoCasa.Should().Be(0.25m);
        _gravada.PercentualTaxaCartao.Should().Be(0.03m);
        _configRepasse.Verify(r => r.AdicionarAsync(It.IsAny<ConfiguracaoRepasse>(), default), Times.Never);
    }

    [Fact]
    public async Task ImportacaoSoDeRepasses_NaoCriaVendas()
    {
        _configRepasse.Setup(r => r.ObterAsync(default)).ReturnsAsync((ConfiguracaoRepasse?)null);

        var resultado = await Criar().Handle(Command([], 90m, 0m), CancellationToken.None);

        resultado.TotalImportadas.Should().Be(0);
        _gravada.Should().NotBeNull();
        _vendas.Verify(r => r.AdicionarRangeAsync(
            It.Is<IEnumerable<VendaDiaria>>(v => !v.Any()), default), Times.Once);
    }
}
```

- [ ] **Step 2: Testes do validator (falhando)**

`tests/CasaDiAna.Application.Tests/ImportacaoVendas/ConfirmarImportacaoCommandValidatorTests.cs`:

```csharp
using CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class ConfirmarImportacaoCommandValidatorTests
{
    private readonly ConfirmarImportacaoCommandValidator _validator = new();

    private static ConfirmarImportacaoCommand Command(
        IReadOnlyList<ItemConfirmarDto> itens, decimal taxa = 0m, decimal entregas = 0m) =>
        new("hash", "vendas.csv", DateTime.Today, null, null, 1, 0, 0, itens, taxa, entregas);

    [Fact]
    public void SemItensESemRepasse_Invalido() =>
        _validator.Validate(Command([])).IsValid.Should().BeFalse();

    [Fact]
    public void SemItensComTaxa_Valido() =>
        _validator.Validate(Command([], taxa: 10m)).IsValid.Should().BeTrue();

    [Fact]
    public void SemItensComEntregas_Valido() =>
        _validator.Validate(Command([], entregas: 10m)).IsValid.Should().BeTrue();

    [Theory]
    [InlineData(-1, 0)]
    [InlineData(0, -1)]
    public void TotaisNegativos_Invalido(double taxa, double entregas) =>
        _validator.Validate(Command([new ItemConfirmarDto(Guid.NewGuid(), 1m)], (decimal)taxa, (decimal)entregas))
            .IsValid.Should().BeFalse();
}
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~ConfirmarImportacao"`
Expected: erro de compilação (parâmetros novos inexistentes).

- [ ] **Step 4: Estender command e resultado**

`ConfirmarImportacaoCommand.cs`:

```csharp
public record ConfirmarImportacaoCommand(
    string Hash,
    string NomeArquivo,
    DateTime DataVenda,
    string? PeriodoDe,
    string? PeriodoAte,
    int TotalLinhasParseadas,
    int TotalIgnoradas,
    int TotalNaoEncontradas,
    IReadOnlyList<ItemConfirmarDto> Itens,
    decimal TotalTaxaServico = 0,
    decimal TotalEntregas = 0
) : IRequest<ResultadoImportacaoDto>;
```

`ResultadoImportacaoDto.cs`:

```csharp
public record ResultadoImportacaoDto(
    int TotalImportadas,
    int TotalIgnoradas,
    int TotalNaoEncontradas,
    decimal TotalTaxaServico,
    decimal TotalEntregas);
```

- [ ] **Step 5: Atualizar o validator**

Em `ConfirmarImportacaoCommandValidator`, trocar a regra `RuleFor(x => x.Itens).NotEmpty()...` por:

```csharp
        RuleFor(x => x)
            .Must(x => x.Itens is { Count: > 0 } || x.TotalTaxaServico > 0 || x.TotalEntregas > 0)
            .WithMessage("Nenhum item ou repasse confirmado para importação.");

        RuleFor(x => x.TotalTaxaServico)
            .GreaterThanOrEqualTo(0).WithMessage("Total de taxa de serviço não pode ser negativo.");

        RuleFor(x => x.TotalEntregas)
            .GreaterThanOrEqualTo(0).WithMessage("Total de entregas não pode ser negativo.");
```

Manter o `RuleForEach(x => x.Itens)` existente. Se `Itens` vier `null`, o `RuleForEach` do FluentValidation ignora a coleção nula. Confirme rodando o teste `SemItensComTaxa_Valido`.

- [ ] **Step 6: Atualizar o handler**

Em `ConfirmarImportacaoCommandHandler`:
- Injetar `IConfiguracaoRepasseRepository configuracaoRepasse` no construtor, entre `importacoes` e `currentUser`, e guardar em `_configuracaoRepasse`.
- Antes de `EntidadeImportacao.Criar`:

```csharp
        // Snapshot dos percentuais vigentes: mudar a configuração depois não
        // recalcula importações antigas. Sem configuração salva, vale o padrão.
        var configuracaoRepasse = await _configuracaoRepasse.ObterAsync(cancellationToken)
            ?? ConfiguracaoRepasse.Padrao(_currentUser.UsuarioId);
```

- Na chamada de `Criar`, trocar os valores provisórios do Task 1:

```csharp
            request.TotalNaoEncontradas,
            request.DataVenda,
            request.TotalTaxaServico,
            request.TotalEntregas,
            configuracaoRepasse,
            _currentUser.UsuarioId);
```

- No retorno:

```csharp
        return new ResultadoImportacaoDto(
            novasVendas.Count,
            request.TotalIgnoradas,
            request.TotalNaoEncontradas,
            request.TotalTaxaServico,
            request.TotalEntregas);
```

- Garantir que `request.Itens` nulo não quebra: usar `var itens = request.Itens ?? Array.Empty<ItemConfirmarDto>();` no início e trocar os usos de `request.Itens` por `itens`.

- [ ] **Step 7: Rodar todos os testes**

Run: `dotnet test tests/CasaDiAna.Application.Tests`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/CasaDiAna.Application/ImportacaoVendas tests/CasaDiAna.Application.Tests/ImportacaoVendas
git commit -m "feat(importacao): confirmação grava totais de taxa de serviço e entregas"
```

---

### Task 5: API de configuração de repasses

**Files:**
- Create: `src/CasaDiAna.Application/FechamentoMensal/Dtos/ConfiguracaoRepasseDto.cs`
- Create: `src/CasaDiAna.Application/FechamentoMensal/Queries/ObterConfiguracaoRepasse/ObterConfiguracaoRepasseQuery.cs`
- Create: `src/CasaDiAna.Application/FechamentoMensal/Queries/ObterConfiguracaoRepasse/ObterConfiguracaoRepasseQueryHandler.cs`
- Create: `src/CasaDiAna.Application/FechamentoMensal/Commands/AtualizarConfiguracaoRepasse/AtualizarConfiguracaoRepasseCommand.cs`
- Create: `src/CasaDiAna.Application/FechamentoMensal/Commands/AtualizarConfiguracaoRepasse/AtualizarConfiguracaoRepasseCommandHandler.cs`
- Create: `src/CasaDiAna.Application/FechamentoMensal/Commands/AtualizarConfiguracaoRepasse/AtualizarConfiguracaoRepasseCommandValidator.cs`
- Modify: `src/CasaDiAna.API/Controllers/FechamentoMensalController.cs`
- Test: `tests/CasaDiAna.Application.Tests/FechamentoMensal/ConfiguracaoRepasseHandlersTests.cs`

**Interfaces:**
- Consumes: `ConfiguracaoRepasse` (Task 1), `IConfiguracaoRepasseRepository` (Task 2).
- Produces:
  - `ConfiguracaoRepasseDto(decimal PercentualRetencaoCasa, decimal PercentualTaxaCartao)` (frações, ex.: 0.25).
  - `GET /api/fechamento-mensal/configuracao-repasse` → `ApiResponse<ConfiguracaoRepasseDto>`.
  - `PUT /api/fechamento-mensal/configuracao-repasse` com body `{ percentualRetencaoCasa, percentualTaxaCartao }` → `ApiResponse<ConfiguracaoRepasseDto>`.

- [ ] **Step 1: Testes (falhando)**

`tests/CasaDiAna.Application.Tests/FechamentoMensal/ConfiguracaoRepasseHandlersTests.cs`:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.FechamentoMensal.Commands.AtualizarConfiguracaoRepasse;
using CasaDiAna.Application.FechamentoMensal.Queries.ObterConfiguracaoRepasse;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.FechamentoMensal;

public class ConfiguracaoRepasseHandlersTests
{
    private readonly Mock<IConfiguracaoRepasseRepository> _repo = new();
    private readonly Mock<ICurrentUserService> _user = new();

    public ConfiguracaoRepasseHandlersTests()
    {
        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _repo.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
    }

    [Fact]
    public async Task Obter_DeveCriarPadrao_QuandoNaoExiste()
    {
        _repo.Setup(r => r.ObterAsync(default)).ReturnsAsync((ConfiguracaoRepasse?)null);
        var handler = new ObterConfiguracaoRepasseQueryHandler(_repo.Object, _user.Object);

        var dto = await handler.Handle(new ObterConfiguracaoRepasseQuery(), CancellationToken.None);

        dto.PercentualRetencaoCasa.Should().Be(0.25m);
        dto.PercentualTaxaCartao.Should().Be(0.03m);
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<ConfiguracaoRepasse>(), default), Times.Once);
    }

    [Fact]
    public async Task Atualizar_DeveAlterar_QuandoJaExiste()
    {
        var existente = ConfiguracaoRepasse.Padrao(Guid.NewGuid());
        _repo.Setup(r => r.ObterAsync(default)).ReturnsAsync(existente);
        var handler = new AtualizarConfiguracaoRepasseCommandHandler(_repo.Object, _user.Object);

        var dto = await handler.Handle(new AtualizarConfiguracaoRepasseCommand(0.20m, 0.04m), CancellationToken.None);

        dto.PercentualRetencaoCasa.Should().Be(0.20m);
        dto.PercentualTaxaCartao.Should().Be(0.04m);
        _repo.Verify(r => r.Atualizar(existente), Times.Once);
    }

    [Fact]
    public async Task Atualizar_DeveCriar_QuandoNaoExiste()
    {
        _repo.Setup(r => r.ObterAsync(default)).ReturnsAsync((ConfiguracaoRepasse?)null);
        var handler = new AtualizarConfiguracaoRepasseCommandHandler(_repo.Object, _user.Object);

        var dto = await handler.Handle(new AtualizarConfiguracaoRepasseCommand(0.30m, 0.02m), CancellationToken.None);

        dto.PercentualRetencaoCasa.Should().Be(0.30m);
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<ConfiguracaoRepasse>(), default), Times.Once);
    }

    [Theory]
    [InlineData(-0.01, 0.03)]
    [InlineData(1, 0)]
    [InlineData(0.25, 1)]
    [InlineData(0.6, 0.4)]
    public void Validator_DeveRejeitarPercentuaisInvalidos(double retencao, double cartao)
    {
        var resultado = new AtualizarConfiguracaoRepasseCommandValidator()
            .Validate(new AtualizarConfiguracaoRepasseCommand((decimal)retencao, (decimal)cartao));

        resultado.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Validator_DeveAceitarPadrao() =>
        new AtualizarConfiguracaoRepasseCommandValidator()
            .Validate(new AtualizarConfiguracaoRepasseCommand(0.25m, 0.03m))
            .IsValid.Should().BeTrue();
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~ConfiguracaoRepasseHandlersTests"`
Expected: erro de compilação.

- [ ] **Step 3: DTO e query**

`Dtos/ConfiguracaoRepasseDto.cs`:

```csharp
namespace CasaDiAna.Application.FechamentoMensal.Dtos;

public record ConfiguracaoRepasseDto(decimal PercentualRetencaoCasa, decimal PercentualTaxaCartao);
```

`Queries/ObterConfiguracaoRepasse/ObterConfiguracaoRepasseQuery.cs`:

```csharp
using CasaDiAna.Application.FechamentoMensal.Dtos;
using MediatR;

namespace CasaDiAna.Application.FechamentoMensal.Queries.ObterConfiguracaoRepasse;

public record ObterConfiguracaoRepasseQuery : IRequest<ConfiguracaoRepasseDto>;
```

`Queries/ObterConfiguracaoRepasse/ObterConfiguracaoRepasseQueryHandler.cs`:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.FechamentoMensal.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.FechamentoMensal.Queries.ObterConfiguracaoRepasse;

public class ObterConfiguracaoRepasseQueryHandler
    : IRequestHandler<ObterConfiguracaoRepasseQuery, ConfiguracaoRepasseDto>
{
    private readonly IConfiguracaoRepasseRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public ObterConfiguracaoRepasseQueryHandler(
        IConfiguracaoRepasseRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<ConfiguracaoRepasseDto> Handle(
        ObterConfiguracaoRepasseQuery request, CancellationToken cancellationToken)
    {
        var config = await _repo.ObterAsync(cancellationToken);
        if (config is null)
        {
            config = ConfiguracaoRepasse.Padrao(_currentUser.UsuarioId);
            await _repo.AdicionarAsync(config, cancellationToken);
            await _repo.SalvarAsync(cancellationToken);
        }
        return ToDto(config);
    }

    internal static ConfiguracaoRepasseDto ToDto(ConfiguracaoRepasse c) =>
        new(c.PercentualRetencaoCasa, c.PercentualTaxaCartao);
}
```

- [ ] **Step 4: Command, handler e validator**

`Commands/AtualizarConfiguracaoRepasse/AtualizarConfiguracaoRepasseCommand.cs`:

```csharp
using CasaDiAna.Application.FechamentoMensal.Dtos;
using MediatR;

namespace CasaDiAna.Application.FechamentoMensal.Commands.AtualizarConfiguracaoRepasse;

public record AtualizarConfiguracaoRepasseCommand(
    decimal PercentualRetencaoCasa, decimal PercentualTaxaCartao) : IRequest<ConfiguracaoRepasseDto>;
```

`Commands/AtualizarConfiguracaoRepasse/AtualizarConfiguracaoRepasseCommandHandler.cs`:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.FechamentoMensal.Dtos;
using CasaDiAna.Application.FechamentoMensal.Queries.ObterConfiguracaoRepasse;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.FechamentoMensal.Commands.AtualizarConfiguracaoRepasse;

public class AtualizarConfiguracaoRepasseCommandHandler
    : IRequestHandler<AtualizarConfiguracaoRepasseCommand, ConfiguracaoRepasseDto>
{
    private readonly IConfiguracaoRepasseRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public AtualizarConfiguracaoRepasseCommandHandler(
        IConfiguracaoRepasseRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<ConfiguracaoRepasseDto> Handle(
        AtualizarConfiguracaoRepasseCommand request, CancellationToken cancellationToken)
    {
        var config = await _repo.ObterAsync(cancellationToken);
        if (config is null)
        {
            config = ConfiguracaoRepasse.Padrao(_currentUser.UsuarioId);
            config.Atualizar(request.PercentualRetencaoCasa, request.PercentualTaxaCartao, _currentUser.UsuarioId);
            await _repo.AdicionarAsync(config, cancellationToken);
        }
        else
        {
            config.Atualizar(request.PercentualRetencaoCasa, request.PercentualTaxaCartao, _currentUser.UsuarioId);
            _repo.Atualizar(config);
        }
        await _repo.SalvarAsync(cancellationToken);
        return ObterConfiguracaoRepasseQueryHandler.ToDto(config);
    }
}
```

`Commands/AtualizarConfiguracaoRepasse/AtualizarConfiguracaoRepasseCommandValidator.cs`:

```csharp
using FluentValidation;

namespace CasaDiAna.Application.FechamentoMensal.Commands.AtualizarConfiguracaoRepasse;

public class AtualizarConfiguracaoRepasseCommandValidator
    : AbstractValidator<AtualizarConfiguracaoRepasseCommand>
{
    public AtualizarConfiguracaoRepasseCommandValidator()
    {
        RuleFor(x => x.PercentualRetencaoCasa)
            .GreaterThanOrEqualTo(0).WithMessage("Retenção da casa não pode ser negativa.")
            .LessThan(1).WithMessage("Retenção da casa deve ser menor que 100%.");
        RuleFor(x => x.PercentualTaxaCartao)
            .GreaterThanOrEqualTo(0).WithMessage("Taxa do cartão não pode ser negativa.")
            .LessThan(1).WithMessage("Taxa do cartão deve ser menor que 100%.");
        RuleFor(x => x)
            .Must(x => x.PercentualRetencaoCasa + x.PercentualTaxaCartao < 1)
            .WithMessage("A soma da retenção da casa com a taxa do cartão deve ser menor que 100%.");
    }
}
```

- [ ] **Step 5: Endpoints no controller**

Em `FechamentoMensalController.cs`, adicionar os `using` de `...FechamentoMensal.Commands.AtualizarConfiguracaoRepasse` e `...FechamentoMensal.Queries.ObterConfiguracaoRepasse`, e as actions:

```csharp
    [HttpGet("configuracao-repasse")]
    [ProducesResponseType(typeof(ApiResponse<ConfiguracaoRepasseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObterConfiguracaoRepasse(CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ObterConfiguracaoRepasseQuery(), ct);
        return Ok(ApiResponse<ConfiguracaoRepasseDto>.Ok(resultado));
    }

    [HttpPut("configuracao-repasse")]
    [ProducesResponseType(typeof(ApiResponse<ConfiguracaoRepasseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AtualizarConfiguracaoRepasse(
        [FromBody] AtualizarConfiguracaoRepasseCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return Ok(ApiResponse<ConfiguracaoRepasseDto>.Ok(resultado));
    }
```

- [ ] **Step 6: Build e testes**

Run: `dotnet build src/CasaDiAna.API` e depois `dotnet test tests/CasaDiAna.Application.Tests`
Expected: Build succeeded; PASS.

- [ ] **Step 7: Commit**

```bash
git add src/CasaDiAna.Application/FechamentoMensal src/CasaDiAna.API/Controllers/FechamentoMensalController.cs tests/CasaDiAna.Application.Tests/FechamentoMensal
git commit -m "feat(fechamento): endpoints de configuração de repasses"
```

---

### Task 6: Fechamento mensal com receitas e repasses

**Files:**
- Modify: `src/CasaDiAna.Application/FechamentoMensal/Dtos/FechamentoMensalDto.cs`
- Modify: `src/CasaDiAna.Application/FechamentoMensal/Queries/ObterFechamentoMensal/ObterFechamentoMensalQueryHandler.cs`
- Test: `tests/CasaDiAna.Application.Tests/FechamentoMensal/ObterFechamentoMensalQueryHandlerTests.cs`

**Interfaces:**
- Consumes: `IImportacaoVendasRepository.ListarPorDataVendaAsync` (Task 2); `ImportacaoVendas.RepasseEquipe/RepasseMotoboys` (Task 1).
- Produces: `FechamentoMensalDto` com os campos novos, **anexados ao final** na ordem `ReceitaTaxaServico, ReceitaEntregas, ReceitaTotal, RepasseEquipe, RepasseMotoboys, TotalRepasses, ReceitaLiquida` (JSON camelCase: `receitaTaxaServico`, `receitaEntregas`, `receitaTotal`, `repasseEquipe`, `repasseMotoboys`, `totalRepasses`, `receitaLiquida`).

- [ ] **Step 1: Adaptar a classe de teste e escrever os testes novos (falhando)**

Em `ObterFechamentoMensalQueryHandlerTests.cs`:

1. Adicionar o mock e o setup padrão (mês sem importações), e passar o mock ao handler:

```csharp
    private readonly Mock<IImportacaoVendasRepository> _importacoes = new();

    public ObterFechamentoMensalQueryHandlerTests()
    {
        _importacoes.Setup(r => r.ListarPorDataVendaAsync(It.IsAny<DateTime>(), It.IsAny<DateTime>(), default))
                    .ReturnsAsync(new List<CasaDiAna.Domain.Entities.ImportacaoVendas>());
    }

    private ObterFechamentoMensalQueryHandler Criar() =>
        new(_vendas.Object, _despesas.Object, _faturamento.Object, _produtos.Object, _entradas.Object, _importacoes.Object);
```

2. Adicionar os helpers e testes:

```csharp
    private static CasaDiAna.Domain.Entities.ImportacaoVendas Importacao(decimal taxa, decimal entregas) =>
        CasaDiAna.Domain.Entities.ImportacaoVendas.Criar(
            $"{Guid.NewGuid()}.csv", Guid.NewGuid().ToString("N"), null, null, 1, 0, 0, 0,
            new DateTime(2026, 6, 15), taxa, entregas,
            ConfiguracaoRepasse.Padrao(Guid.NewGuid()), Guid.NewGuid());

    private void SemVendasDespesasECompras(decimal? faturamentoManual = null)
    {
        _vendas.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), null, default))
               .ReturnsAsync(new List<VendaDiaria>());
        _produtos.Setup(r => r.ListarComFichaAsync(false, default)).ReturnsAsync(new List<Produto>());
        _despesas.Setup(r => r.ListarPorCompetenciaAsync(_comp, default)).ReturnsAsync(new List<Despesa>());
        _faturamento.Setup(r => r.ObterPorCompetenciaAsync(_comp, default))
                    .ReturnsAsync(faturamentoManual is null ? null : FaturamentoMensal.Criar(_comp, faturamentoManual.Value, Guid.NewGuid()));
        _entradas.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), default))
                 .ReturnsAsync(new List<EntradaMercadoria>());
    }

    [Fact]
    public async Task DeveSomarTaxaEEntregasNaReceita_ELancarRepassesComoSaida()
    {
        SemVendasDespesasECompras(faturamentoManual: 50000m);
        _importacoes.Setup(r => r.ListarPorDataVendaAsync(It.IsAny<DateTime>(), It.IsAny<DateTime>(), default))
                    .ReturnsAsync(new List<CasaDiAna.Domain.Entities.ImportacaoVendas>
                    {
                        Importacao(600m, 300m),
                        Importacao(400m, 200m),
                    });

        var dto = await Criar().Handle(new ObterFechamentoMensalQuery(_comp), CancellationToken.None);

        dto.FaturamentoUsado.Should().Be(50000m);      // receita de produtos
        dto.ReceitaTaxaServico.Should().Be(1000m);
        dto.ReceitaEntregas.Should().Be(500m);
        dto.ReceitaTotal.Should().Be(51500m);
        dto.RepasseEquipe.Should().Be(720m);
        dto.RepasseMotoboys.Should().Be(500m);
        dto.TotalRepasses.Should().Be(1220m);
        dto.ReceitaLiquida.Should().Be(50280m);
        dto.TotalSaidas.Should().Be(1220m);            // só repasses neste cenário
        dto.MargemBruta.Should().Be(50280m);           // receita líquida − custo direto 0
        dto.MargemOperacional.Should().Be(50280m);
    }

    [Fact]
    public async Task SemImportacoes_NumerosIguaisAoComportamentoAnterior()
    {
        SemVendasDespesasECompras(faturamentoManual: 8000m);

        var dto = await Criar().Handle(new ObterFechamentoMensalQuery(_comp), CancellationToken.None);

        dto.ReceitaTotal.Should().Be(8000m);
        dto.ReceitaLiquida.Should().Be(8000m);
        dto.TotalRepasses.Should().Be(0m);
        dto.MargemBruta.Should().Be(8000m);
    }

    [Fact]
    public async Task DeveConsultarImportacoesComFimExclusivoNoPrimeiroDiaDoMesSeguinte()
    {
        SemVendasDespesasECompras();

        await Criar().Handle(new ObterFechamentoMensalQuery(new DateTime(2026, 6, 20)), CancellationToken.None);

        _importacoes.Verify(r => r.ListarPorDataVendaAsync(
            new DateTime(2026, 6, 1), new DateTime(2026, 7, 1), default), Times.Once);
    }

    [Fact]
    public async Task DespesaFixaPercentual_DeveUsarReceitaLiquida()
    {
        SemVendasDespesasECompras(faturamentoManual: 1000m);
        var catFixa = CategoriaDespesa.Criar("Aluguel", TipoDespesa.Fixa, false, Guid.NewGuid());
        _despesas.Setup(r => r.ListarPorCompetenciaAsync(_comp, default))
                 .ReturnsAsync(new List<Despesa> { DespesaTestFactory.ComCategoria(_comp, catFixa, 640m) });
        _importacoes.Setup(r => r.ListarPorDataVendaAsync(It.IsAny<DateTime>(), It.IsAny<DateTime>(), default))
                    .ReturnsAsync(new List<CasaDiAna.Domain.Entities.ImportacaoVendas> { Importacao(1000m, 0m) });

        var dto = await Criar().Handle(new ObterFechamentoMensalQuery(_comp), CancellationToken.None);

        dto.ReceitaLiquida.Should().Be(1280m);         // 1000 + 1000 − 720
        dto.DespesaFixaPercentual.Should().Be(0.5m);   // 640 / 1280
    }
```

3. Nos três testes existentes, `DeveSepararFixasVariaveis_ComprasETotalSaidas` deve continuar passando sem mudar as asserções (sem importações, os números não mudam). Não altere esses testes além da troca do `Criar()`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~ObterFechamentoMensalQueryHandlerTests"`
Expected: erro de compilação (construtor e campos novos).

- [ ] **Step 3: Estender o DTO**

`FechamentoMensalDto.cs`: anexar ao final, depois de `DespesasPorCategoria`:

```csharp
    IReadOnlyList<TotalCategoriaDto> DespesasPorCategoria,
    decimal ReceitaTaxaServico,
    decimal ReceitaEntregas,
    decimal ReceitaTotal,
    decimal RepasseEquipe,
    decimal RepasseMotoboys,
    decimal TotalRepasses,
    decimal ReceitaLiquida);
```

- [ ] **Step 4: Atualizar o handler**

Em `ObterFechamentoMensalQueryHandler`:
- Injetar `IImportacaoVendasRepository importacoes` como **último** parâmetro do construtor, guardar em `_importacoes`.
- Depois de calcular `faturamentoUsado`:

```csharp
        // Taxa de serviço e entregas entram no caixa e são repassadas; o faturamento
        // manual substitui só a receita de produtos.
        var importacoes = await _importacoes.ListarPorDataVendaAsync(
            competencia, competencia.AddMonths(1), cancellationToken);
        var receitaTaxaServico = importacoes.Sum(i => i.TotalTaxaServico);
        var receitaEntregas = importacoes.Sum(i => i.TotalEntregas);
        var repasseEquipe = importacoes.Sum(i => i.RepasseEquipe);
        var repasseMotoboys = importacoes.Sum(i => i.RepasseMotoboys);
        var totalRepasses = repasseEquipe + repasseMotoboys;
        var receitaTotal = faturamentoUsado + receitaTaxaServico + receitaEntregas;
        var receitaLiquida = receitaTotal - totalRepasses;
```

- Trocar o bloco de indicadores por:

```csharp
        var totalSaidas = totalFixas + totalVariaveis + totalCompras + totalRepasses;
        decimal? despesaFixaPercentual = receitaLiquida > 0 ? totalFixas / receitaLiquida : null;
        var margemBruta = receitaLiquida - custoDiretoTotal;
        var margemOperacional = receitaLiquida - custoDiretoTotal - totalFixas - totalVariaveis;
        var primeCost = custoDiretoTotal + folha;
```

- Retorno:

```csharp
        return new FechamentoMensalDto(
            competencia, faturamentoCalculado, faturamentoManual, faturamentoUsado, custoDiretoTotal,
            totalFixas, totalVariaveis, totalCompras, totalSaidas, folha,
            despesaFixaPercentual, margemBruta, margemOperacional, primeCost, porCategoria,
            receitaTaxaServico, receitaEntregas, receitaTotal,
            repasseEquipe, repasseMotoboys, totalRepasses, receitaLiquida);
```

- [ ] **Step 5: Rodar todos os testes**

Run: `dotnet test tests/CasaDiAna.Application.Tests`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/CasaDiAna.Application/FechamentoMensal tests/CasaDiAna.Application.Tests/FechamentoMensal
git commit -m "feat(fechamento): receita de taxa de serviço e entregas com repasses"
```

---

### Task 7: Frontend — importação com status "Repasse"

**Files:**
- Modify: `frontend/src/types/importacao.ts`
- Create: `frontend/src/features/producao/importacao-vendas/utils/repasses.ts`
- Modify: `frontend/src/features/producao/importacao-vendas/pages/ImportacaoVendasPage.tsx`
- Modify: `frontend/src/features/producao/importacao-vendas/components/ConfirmacaoImportacaoModal.tsx`

**Interfaces:**
- Consumes: wire format dos Tasks 3 e 4 (`status: 'repasse'`, `tipoRepasse: 'taxaServico' | 'entrega' | null`, `totalTaxaServico`, `totalEntregas`).
- Produces: `somarRepasses(itens: ItemPreview[]): TotaisRepasse`, `TIPO_REPASSE_LABELS`.

- [ ] **Step 1: Tipos**

Em `frontend/src/types/importacao.ts`:

```ts
export type StatusImportacao = 'matched' | 'unmatched' | 'ambiguous' | 'ignored' | 'repasse'

export type TipoRepasse = 'taxaServico' | 'entrega'
```

Em `ItemPreview`, adicionar `tipoRepasse: TipoRepasse | null`.
Em `PreviewImportacao`, depois de `totalIgnored`: `totalRepasses: number`, `totalTaxaServico: number`, `totalEntregas: number`.
Em `ConfirmarImportacaoInput`, depois de `itens`: `totalTaxaServico: number`, `totalEntregas: number`.
Em `ResultadoImportacao`: `totalTaxaServico: number`, `totalEntregas: number`.

- [ ] **Step 2: Helper de totais**

`frontend/src/features/producao/importacao-vendas/utils/repasses.ts`:

```ts
import type { ItemPreview, TipoRepasse } from '@/types/importacao'

export const TIPO_REPASSE_LABELS: Record<TipoRepasse, string> = {
  taxaServico: 'Taxa de serviço',
  entrega: 'Entrega',
}

export interface TotaisRepasse {
  taxaServico: number
  entregas: number
}

// Calculado dos itens atuais (e não dos totais da prévia) para refletir
// linhas removidas pelo usuário antes de confirmar.
export function somarRepasses(itens: ItemPreview[]): TotaisRepasse {
  return itens.reduce<TotaisRepasse>(
    (acc, i) => {
      if (i.tipoRepasse === 'taxaServico') acc.taxaServico += i.valorTotal
      else if (i.tipoRepasse === 'entrega') acc.entregas += i.valorTotal
      return acc
    },
    { taxaServico: 0, entregas: 0 },
  )
}
```

- [ ] **Step 3: Página — status, contagens e envio**

Em `ImportacaoVendasPage.tsx`:

1. Importar `BanknotesIcon` de `@heroicons/react/24/outline` e `somarRepasses`, `TIPO_REPASSE_LABELS` de `../utils/repasses`.
2. Em `STATUS_CFG`, adicionar:

```ts
  repasse:   { label: 'Repasse',        cor: 'var(--sb-accent)', bg: 'var(--ada-surface-2)', border: 'var(--ada-border)', Icon: BanknotesIcon },
```

3. Em `contagens`, incluir `repasse` (valor inicial `0` e `preview.itens.filter(i => i.status === 'repasse').length`).
4. Logo após `contagens`:

```ts
  const totaisRepasse = useMemo(() => somarRepasses(preview?.itens ?? []), [preview])
  const temRepasse = totaisRepasse.taxaServico > 0 || totaisRepasse.entregas > 0
```

5. Em `confirmar`, no objeto enviado a `importacaoVendasService.confirmar`, depois de `itens`:

```ts
        totalTaxaServico: totaisRepasse.taxaServico,
        totalEntregas: totaisRepasse.entregas,
```

e em `setDadosConfirmacao`, adicionar `totalTaxaServico: res.totalTaxaServico` e `totalEntregas: res.totalEntregas`.

6. Grade de contagens: trocar `sm:grid-cols-4` por `sm:grid-cols-5` e adicionar o card:

```ts
              { label: 'Repasses',        value: contagens.repasse,   cor: 'var(--sb-accent)', bg: 'var(--ada-surface-2)', border: 'var(--ada-border)' },
```

7. Botão de confirmar: habilitar também quando só houver repasses.

```tsx
                disabled={etapa === 'confirmando' || (totalConfirmados === 0 && !temRepasse)}
```

com rótulo:

```tsx
                {etapa === 'confirmando'
                  ? 'Importando…'
                  : totalConfirmados === 0
                    ? 'Confirmar repasses'
                    : `Confirmar ${totalConfirmados} venda${totalConfirmados !== 1 ? 's' : ''}`}
```

8. Na linha da tabela (componente de linha, ~linha 631), coluna "Produto no sistema", adicionar:

```tsx
        {item.status === 'repasse' && item.tipoRepasse && (
          <span style={{ color: 'var(--ada-muted)', fontStyle: 'italic' }}>
            {TIPO_REPASSE_LABELS[item.tipoRepasse]} · repassado
          </span>
        )}
```

e esconder o botão "Adicionar" para repasses (não faz sentido criar produto a partir deles): envolver o `<button ... onClick={onAdicionar}>` em `{item.status !== 'repasse' && ( ... )}`. O botão "Remover" continua disponível.

- [ ] **Step 4: Modal de resultado**

Em `ConfirmacaoImportacaoModal.tsx`:

1. Em `DadosConfirmacaoImportacao`, adicionar `totalTaxaServico: number` e `totalEntregas: number`.
2. No bloco "Resumo", logo depois do `.map` das linhas fixas e antes do `<div style={{ borderTop ... }}>`, adicionar as linhas de repasse quando houver valor, reaproveitando o mesmo array/estilo:

```tsx
            {[
              { label: 'Taxa de serviço (repasse)', valor: dados.totalTaxaServico, delay: 1020 },
              { label: 'Entregas (repasse)',        valor: dados.totalEntregas,    delay: 1035 },
            ].filter(r => r.valor > 0).map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 0', animation: `fadeUp 350ms ${row.delay}ms ease both`,
              }}>
                <span style={{ fontSize: 13, color: 'var(--ada-muted)', fontWeight: 400 }}>{row.label}</span>
                <span style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600, color: 'var(--ada-heading)', fontVariantNumeric: 'tabular-nums' }}>R$ {fmt(row.valor)}</span>
              </div>
            ))}
```

Se o estilo da linha ficar idêntico ao `.map` existente, extraia um componente local `LinhaResumo({ label, valor, delay })` no próprio arquivo e use-o nos dois `.map` (zero duplicação de JSX).

- [ ] **Step 5: Checar tipos**

Run (dentro de `frontend/`): `npx tsc -b --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/importacao.ts frontend/src/features/producao/importacao-vendas
git commit -m "feat(importacao): prévia e resultado mostram taxa de serviço e entregas"
```

---

### Task 8: Frontend — fechamento com receitas, repasses e configuração

**Files:**
- Create: `frontend/src/features/financeiro/shared/percentual.ts`
- Modify: `frontend/src/features/financeiro/precificacao/components/ConfigPrecificacaoEditor.tsx` (passa a usar o helper compartilhado)
- Modify: `frontend/src/features/financeiro/fechamento-mensal/services/fechamentoService.ts`
- Create: `frontend/src/features/financeiro/fechamento-mensal/components/ReceitasRepassesCard.tsx`
- Create: `frontend/src/features/financeiro/fechamento-mensal/components/ConfigRepasseEditor.tsx`
- Modify: `frontend/src/features/financeiro/fechamento-mensal/pages/FechamentoMensalPage.tsx`

**Interfaces:**
- Consumes: `FechamentoMensalDto` (Task 6) e endpoints de configuração (Task 5).
- Produces: `percentualParaTexto(frac)`, `textoParaFracao(s)`, `fracaoValida(v, permiteZero)`; `fechamentoService.obterConfigRepasse()` / `atualizarConfigRepasse(input)`.

Nota de desenho: o spec fala em "botão que abre modal". Como o projeto não tem um modal genérico de formulário e o editor de Precificação já é um card inline, a configuração fica num **card inline recolhível** na própria página. O comportamento combinado (percentuais editáveis na tela de Fechamento) se mantém.

- [ ] **Step 1: Extrair os helpers de percentual**

`frontend/src/features/financeiro/shared/percentual.ts`, movendo os três helpers que hoje são locais em `ConfigPrecificacaoEditor.tsx`:

```ts
// A API trabalha com frações (0.25); a UI, com percentuais digitados ("25").
export const percentualParaTexto = (frac: number) => String(Math.round(frac * 1000) / 10) // 0.3 -> "30"
export const textoParaFracao = (s: string) => Number(s.replace(',', '.')) / 100
export const fracaoValida = (v: number, permiteZero: boolean) =>
  Number.isFinite(v) && v < 1 && (permiteZero ? v >= 0 : v > 0)
```

Em `ConfigPrecificacaoEditor.tsx`, remover as constantes locais `pct`, `toFrac`, `fracaoValida` e importar de `../../shared/percentual`, renomeando os usos (`pct` → `percentualParaTexto`, `toFrac` → `textoParaFracao`). Nenhuma outra mudança de comportamento.

- [ ] **Step 2: Service**

Em `fechamentoService.ts`:

1. Anexar ao `interface FechamentoMensal`:

```ts
  receitaTaxaServico: number
  receitaEntregas: number
  receitaTotal: number
  repasseEquipe: number
  repasseMotoboys: number
  totalRepasses: number
  receitaLiquida: number
```

2. Adicionar:

```ts
export interface ConfiguracaoRepasse {
  percentualRetencaoCasa: number
  percentualTaxaCartao: number
}
```

e, em `fechamentoService`:

```ts
  obterConfigRepasse: async (): Promise<ConfiguracaoRepasse> => {
    const resp = await api.get<ApiResponse<ConfiguracaoRepasse>>('/fechamento-mensal/configuracao-repasse')
    return resp.data.dados
  },

  atualizarConfigRepasse: async (input: ConfiguracaoRepasse): Promise<ConfiguracaoRepasse> => {
    const resp = await api.put<ApiResponse<ConfiguracaoRepasse>>('/fechamento-mensal/configuracao-repasse', input)
    return resp.data.dados
  },
```

- [ ] **Step 3: Card de receitas e repasses**

`frontend/src/features/financeiro/fechamento-mensal/components/ReceitasRepassesCard.tsx`:

```tsx
import type { FechamentoMensal } from '../services/fechamentoService'
import { formatarBRL } from '../../shared/competencia'

interface LinhaProps {
  label: string
  valor: number
  sinal?: '−'
  destaque?: boolean
}

function Linha({ label, valor, sinal, destaque }: LinhaProps) {
  const cor = destaque ? 'var(--ada-heading)' : 'var(--ada-body)'
  return (
    <tr style={{ borderTop: '1px solid var(--ada-border)' }}>
      <td className="py-2.5 pr-4" style={{ color: cor, fontWeight: destaque ? 600 : 400 }}>{label}</td>
      <td className="py-2.5 text-right tabular-nums" style={{ color: cor, fontWeight: destaque ? 600 : 400 }}>
        {sinal ? `${sinal} ` : ''}{formatarBRL(valor)}
      </td>
    </tr>
  )
}

export function ReceitasRepassesCard({ dados }: { dados: FechamentoMensal }) {
  return (
    <div className="rounded-xl border p-6"
      style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--ada-muted)' }}>
        Receitas e repasses
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            <Linha label="Receita de produtos" valor={dados.faturamentoUsado} />
            <Linha label="Taxa de serviço recebida" valor={dados.receitaTaxaServico} />
            <Linha label="Entregas recebidas" valor={dados.receitaEntregas} />
            <Linha label="Receita total" valor={dados.receitaTotal} destaque />
            <Linha label="Repasse à equipe" valor={dados.repasseEquipe} sinal="−" />
            <Linha label="Repasse aos motoboys" valor={dados.repasseMotoboys} sinal="−" />
            <Linha label="Receita líquida da casa" valor={dados.receitaLiquida} destaque />
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Editor de configuração**

`frontend/src/features/financeiro/fechamento-mensal/components/ConfigRepasseEditor.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { fechamentoService } from '../services/fechamentoService'
import { fracaoValida, percentualParaTexto, textoParaFracao } from '../../shared/percentual'

interface Props {
  /** Chamado após salvar, para o fechamento recalcular com os novos percentuais. */
  onSalvo: () => void
}

export function ConfigRepasseEditor({ onSalvo }: Props) {
  const [aberto, setAberto] = useState(false)
  const [retencao, setRetencao] = useState('')
  const [cartao, setCartao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto) return
    fechamentoService.obterConfigRepasse()
      .then(c => {
        setRetencao(percentualParaTexto(c.percentualRetencaoCasa))
        setCartao(percentualParaTexto(c.percentualTaxaCartao))
      })
      .catch(() => setErro('Erro ao carregar a configuração de repasses.'))
  }, [aberto])

  const salvar = async () => {
    const body = { percentualRetencaoCasa: textoParaFracao(retencao), percentualTaxaCartao: textoParaFracao(cartao) }
    if (!fracaoValida(body.percentualRetencaoCasa, true) || !fracaoValida(body.percentualTaxaCartao, true)
      || body.percentualRetencaoCasa + body.percentualTaxaCartao >= 1) {
      setErro('Cada percentual deve estar entre 0 e 100%, e a soma deve ser menor que 100%.')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      await fechamentoService.atualizarConfigRepasse(body)
      setAberto(false)
      onSalvo()
    } catch {
      setErro('Erro ao salvar a configuração de repasses.')
    } finally {
      setSalvando(false)
    }
  }

  const campo = (label: string, value: string, onChange: (v: string) => void) => (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-body)' }}>{label} (%)</label>
      <input type="text" inputMode="decimal" value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
        style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }} />
    </div>
  )

  return (
    <div className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)' }}>
            Configuração de repasses
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--ada-muted)' }}>
            Vale para as próximas importações; meses já importados mantêm os percentuais da época.
          </p>
        </div>
        <button type="button" onClick={() => setAberto(a => !a)}
          className="rounded-lg px-3 py-2 text-xs font-medium border"
          style={{ borderColor: 'var(--ada-border)', color: 'var(--ada-body)', background: 'var(--ada-bg)' }}>
          {aberto ? 'Fechar' : 'Configurar'}
        </button>
      </div>
      {aberto && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {campo('Retenção da casa sobre a taxa de serviço', retencao, setRetencao)}
            {campo('Taxa do cartão sobre a taxa de serviço', cartao, setCartao)}
          </div>
          {erro && <p className="text-sm" style={{ color: 'var(--ada-error-text)' }}>{erro}</p>}
          <button type="button" onClick={salvar} disabled={salvando}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: 'var(--sb-accent)' }}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </>
      )}
    </div>
  )
}
```

Se a função `campo` ficar idêntica à de `ConfigPrecificacaoEditor`, extraia um componente `CampoPercentual({ label, value, onChange })` para `frontend/src/features/financeiro/shared/CampoPercentual.tsx` e use-o nos dois editores.

Observação: salvar a configuração não muda o fechamento já exibido (snapshot por importação). O `onSalvo` recarrega a página só por consistência.

- [ ] **Step 5: Página**

Em `FechamentoMensalPage.tsx`:
1. Importar `ReceitasRepassesCard` e `ConfigRepasseEditor`.
2. No grid de KPIs, trocar o primeiro card e os rótulos de margem:

```tsx
            <KpiCard label="Receita líquida da casa" valor={formatarBRL(dados.receitaLiquida)} variante="green" />
```

(mantendo os demais) e renomear os rótulos `"Margem bruta"` → `"Margem bruta (s/ receita líquida)"` e `"Margem operacional (s/ vendas)"` → `"Margem operacional (s/ receita líquida)"`.
3. Logo depois do grid de KPIs, antes do card "Faturamento":

```tsx
          <ReceitasRepassesCard dados={dados} />
```

4. Renomear o título do card "Faturamento" para **"Faturamento de produtos"** (deixa claro que o manual substitui só produtos).
5. No fim do fragmento `<>...</>` (depois do card "Despesas por categoria"):

```tsx
          <ConfigRepasseEditor onSalvo={carregar} />
```

6. Atualizar o subtítulo do `PageHeader` para: `"Consolidação de receitas, repasses, custo direto e despesas da competência"`.

- [ ] **Step 6: Checar tipos**

Run (dentro de `frontend/`): `npx tsc -b --noEmit`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/financeiro
git commit -m "feat(fechamento): receitas e repasses na tela e configuração dos percentuais"
```

---

### Task 9: Verificação final, documentação e entrega

**Files:**
- Modify: `../docs/brain/04_MODULOS/MOD_IMPORTACAO_VENDAS.md`
- Modify: módulo de fechamento em `../docs/brain/04_MODULOS/` (se existir um `MOD_*` de fechamento/financeiro; senão, registrar em `MOD_IMPORTACAO_VENDAS.md`)

- [ ] **Step 1: Suite completa e builds**

Run: `dotnet build src/CasaDiAna.API && dotnet test tests/CasaDiAna.Application.Tests`
Expected: Build succeeded; todos os testes PASS.

Run (dentro de `frontend/`): `npx tsc -b --noEmit`
Expected: sem erros.

- [ ] **Step 2: Documentar no brain**

Em `MOD_IMPORTACAO_VENDAS.md`, registrar:
- Linhas de taxa de serviço e entrega viram status `Repasse` (regra em `ClassificadorLinhaVenda`; "taxa de entrega" conta como entrega).
- A importação grava `DataVenda`, totais de taxa e entrega e snapshot de `ConfiguracaoRepasse`.
- Fechamento: receita total = produtos + taxa + entregas; repasse equipe = taxa × (1 − retenção − cartão); motoboys = 100% das entregas; margens sobre receita líquida.
- Importações anteriores a esta mudança têm taxa/entrega zeradas.

Seguir o checklist de `../docs/brain/10_IA_PROMPTS/ROTINA_POS_TASK.md`.

- [ ] **Step 3: Commit e push**

```bash
git add ../docs/brain
git commit -m "docs(brain): taxa de serviço e entregas na importação e no fechamento"
git push origin master
```

- [ ] **Step 4: Verificação manual após o deploy (Render, 10–18 min)**

1. Importação: subir um CSV com produtos + `TAXA DE SERVIÇO` + `Entrega longe`. Conferir na prévia o status "Repasse", o card "Repasses" e a coluna de valor. Remover uma linha de entrega e confirmar que o total enviado reflete a remoção (modal de resultado).
2. Fechamento do mês da data de venda: conferir o bloco "Receitas e repasses" (receita total, repasse equipe 72% da taxa, motoboys 100%, receita líquida).
3. Configuração: alterar para 20% / 4%, salvar e confirmar que o fechamento do mês **não** muda (snapshot).
