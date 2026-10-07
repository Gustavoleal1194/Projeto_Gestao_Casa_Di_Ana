# Múltiplos Boletos por Entrada de Mercadoria — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o boleto único por nota (`TemBoleto`/`DataVencimentoBoleto`) por uma lista de boletos (`Boletos: BoletoEntrada[]`), permitindo registrar mais de um vencimento por nota.

**Architecture:** `BoletoEntrada` é uma entidade filha nova de `EntradaMercadoria`, no mesmo padrão de `ItemEntradaMercadoria`/`ItemEntradaUtensilio` (coleção + método `AdicionarBoleto`). Os campos escalares `TemBoleto`/`DataVencimentoBoleto` são removidos e passam a ser propriedades computadas a partir da coleção (`TemBoleto => Boletos.Any()`, `ProximoVencimentoBoleto => Boletos.Min(...)`). Migration com backfill preserva o boleto único já cadastrado como o primeiro boleto de cada entrada.

**Tech Stack:** ASP.NET Core 8, EF Core 8 (PostgreSQL), MediatR, FluentValidation, xUnit + Moq + FluentAssertions · React 19, TypeScript, React Hook Form + Zod.

**Spec:** `CasaDiAna/docs/superpowers/specs/2026-10-07-multiplos-boletos-entrada-design.md`

## Global Constraints

- Idioma: todo texto de UI, mensagem de erro, nome de domínio e commit em português do Brasil.
- Backend: build sempre por `dotnet build src/CasaDiAna.API` (dentro de `CasaDiAna/`, nunca na raiz da solução).
- Frontend: `resolver: zodResolver(schema) as any`; `handleSubmit(fn as any)` quando `fn` é função nomeada com tipo explícito (não é o caso aqui — `onSubmit` já é inline/async no arquivo existente, mantém `as any` por ser passado via `handleSubmit(onSubmit as any)` já presente no arquivo atual).
- Nenhuma mudança em `Ingrediente`, `Utensilio`, `ItemEntradaMercadoria`, `ItemEntradaUtensilio`, `Movimentacao`/`MovimentacaoUtensilio` — fora de escopo.
- Sem valor/parcela por boleto — só data de vencimento (confirmado com o usuário).
- Sem edição de entrada já registrada — boletos só são definidos no registro (mesmo comportamento de hoje).
- Cada task backend termina com `dotnet build src/CasaDiAna.API` e a suíte de testes passando; cada task frontend com `npx tsc --noEmit` limpo.

---

## Task 1 — Domain: entidade `BoletoEntrada` + ajustes em `EntradaMercadoria`

**Files:**
- Create: `src/CasaDiAna.Domain/Entities/BoletoEntrada.cs`
- Modify: `src/CasaDiAna.Domain/Entities/EntradaMercadoria.cs`
- Test: `tests/CasaDiAna.Application.Tests/Entradas/EntradaMercadoriaBoletoTests.cs`

**Interfaces:**
- Produces: `BoletoEntrada` (Id, EntradaId, DataVencimento — criado só por `EntradaMercadoria.AdicionarBoleto`). `EntradaMercadoria.Boletos` (coleção), `EntradaMercadoria.AdicionarBoleto(DateTime dataVencimento)`, `EntradaMercadoria.TemBoleto` (agora computada), `EntradaMercadoria.ProximoVencimentoBoleto` (nova, `DateTime?`). `EntradaMercadoria.Criar(...)` perde os parâmetros `temBoleto`/`dataVencimentoBoleto`.
- Consumes: `CasaDiAna.Domain.Exceptions.DomainException`, `CasaDiAna.Domain.Enums.StatusEntrada` (já existentes).

- [ ] **Step 1: Escrever os testes que falham**

Criar `tests/CasaDiAna.Application.Tests/Entradas/EntradaMercadoriaBoletoTests.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Entradas;

public class EntradaMercadoriaBoletoTests
{
    [Fact]
    public void TemBoleto_DeveSerFalso_QuandoNenhumBoletoAdicionado()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());

        entrada.TemBoleto.Should().BeFalse();
        entrada.ProximoVencimentoBoleto.Should().BeNull();
        entrada.Boletos.Should().BeEmpty();
    }

    [Fact]
    public void AdicionarBoleto_DeveAdicionarUmBoleto()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        var vencimento = DateTime.UtcNow.Date.AddDays(10);

        entrada.AdicionarBoleto(vencimento);

        entrada.TemBoleto.Should().BeTrue();
        entrada.Boletos.Should().HaveCount(1);
        entrada.Boletos.First().DataVencimento.Should().Be(vencimento);
        entrada.ProximoVencimentoBoleto.Should().Be(vencimento);
    }

    [Fact]
    public void AdicionarBoleto_DeveAceitarMultiplosBoletos()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        var vencimento1 = DateTime.UtcNow.Date.AddDays(10);
        var vencimento2 = DateTime.UtcNow.Date.AddDays(40);

        entrada.AdicionarBoleto(vencimento1);
        entrada.AdicionarBoleto(vencimento2);

        entrada.Boletos.Should().HaveCount(2);
    }

    [Fact]
    public void ProximoVencimentoBoleto_DeveRetornarOMenorEntreMultiplosBoletos()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        var vencimentoDistante = DateTime.UtcNow.Date.AddDays(40);
        var vencimentoProximo = DateTime.UtcNow.Date.AddDays(10);

        entrada.AdicionarBoleto(vencimentoDistante);
        entrada.AdicionarBoleto(vencimentoProximo);

        entrada.ProximoVencimentoBoleto.Should().Be(vencimentoProximo);
    }

    [Fact]
    public void AdicionarBoleto_DeveLancarExcecao_QuandoEntradaCancelada()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        entrada.Cancelar(Guid.NewGuid());

        var acao = () => entrada.AdicionarBoleto(DateTime.UtcNow.Date.AddDays(5));

        acao.Should().Throw<DomainException>().WithMessage("*cancelada*");
    }
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~EntradaMercadoriaBoletoTests"` (dentro de `CasaDiAna/`)
Expected: FAIL (compilação — `BoletoEntrada`, `AdicionarBoleto`, `ProximoVencimentoBoleto` ainda não existem).

- [ ] **Step 3: Criar `BoletoEntrada.cs`**

```csharp
namespace CasaDiAna.Domain.Entities;

public class BoletoEntrada
{
    public Guid Id { get; private set; }
    public Guid EntradaId { get; private set; }
    public DateTime DataVencimento { get; private set; }

    private BoletoEntrada() { }

    internal static BoletoEntrada Criar(Guid entradaId, DateTime dataVencimento)
    {
        return new BoletoEntrada
        {
            Id = Guid.NewGuid(),
            EntradaId = entradaId,
            DataVencimento = dataVencimento
        };
    }
}
```

- [ ] **Step 4: Modificar `EntradaMercadoria.cs`**

Substituir o arquivo inteiro por:

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
    public string? RecebidoPor { get; private set; }
    public string? Observacoes { get; private set; }
    public StatusEntrada Status { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    public Fornecedor? Fornecedor { get; private set; }
    public IReadOnlyCollection<ItemEntradaMercadoria> Itens => _itens.AsReadOnly();
    private readonly List<ItemEntradaMercadoria> _itens = new();
    public IReadOnlyCollection<ItemEntradaUtensilio> ItensUtensilio => _itensUtensilio.AsReadOnly();
    private readonly List<ItemEntradaUtensilio> _itensUtensilio = new();
    public IReadOnlyCollection<BoletoEntrada> Boletos => _boletos.AsReadOnly();
    private readonly List<BoletoEntrada> _boletos = new();

    public decimal CustoTotal => _itens.Sum(i => i.CustoTotal) + _itensUtensilio.Sum(i => i.CustoTotal);
    public int TotalItens => _itens.Count + _itensUtensilio.Count;
    public bool TemBoleto => _boletos.Count > 0;
    public DateTime? ProximoVencimentoBoleto => _boletos.Count > 0 ? _boletos.Min(b => b.DataVencimento) : null;

    private EntradaMercadoria() { }

    public static EntradaMercadoria Criar(
        Guid fornecedorId,
        DateTime dataEntrada,
        Guid criadoPor,
        string? numeroNotaFiscal = null,
        string? recebidoPor = null,
        string? observacoes = null)
    {
        return new EntradaMercadoria
        {
            Id = Guid.NewGuid(),
            FornecedorId = fornecedorId,
            NumeroNotaFiscal = numeroNotaFiscal,
            DataEntrada = dataEntrada,
            RecebidoPor = recebidoPor,
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

    public void AdicionarItemUtensilio(Guid utensilioId, decimal quantidade, decimal custoUnitario)
    {
        if (Status != StatusEntrada.Confirmada)
            throw new DomainException("Não é possível adicionar itens a uma entrada cancelada.");
        if (quantidade <= 0)
            throw new DomainException("Quantidade deve ser maior que zero.");
        if (custoUnitario < 0)
            throw new DomainException("Custo unitário não pode ser negativo.");
        if (_itensUtensilio.Any(i => i.UtensilioId == utensilioId))
            throw new DomainException("Utensílio já adicionado nesta entrada.");

        _itensUtensilio.Add(ItemEntradaUtensilio.Criar(Id, utensilioId, quantidade, custoUnitario));
    }

    public void AdicionarBoleto(DateTime dataVencimento)
    {
        if (Status != StatusEntrada.Confirmada)
            throw new DomainException("Não é possível adicionar boleto a uma entrada cancelada.");

        _boletos.Add(BoletoEntrada.Criar(Id, dataVencimento));
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

- [ ] **Step 5: Rodar e ver passar**

Run: `dotnet build src/CasaDiAna.API` (dentro de `CasaDiAna/`)
Expected: **FALHA esperada aqui** — `RegistrarEntradaCommandHandler.cs`, `EntradaMercadoriaConfiguration.cs` e outros arquivos ainda chamam `EntradaMercadoria.Criar(...)` com os parâmetros antigos `temBoleto`/`dataVencimentoBoleto` e referenciam as propriedades removidas. **Isso é esperado nesta task** — esses arquivos só são corrigidos nas Tasks 2 e 3. Confirme que o único erro de build é relacionado a esses 2 arquivos (não a nada mais), e siga para o Step 6 rodando só os testes de domínio isolados.

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~EntradaMercadoriaBoletoTests" --no-build` — se o `--no-build` falhar porque o build do projeto todo está quebrado (esperado neste ponto), ao invés disso **confirme por leitura** que o código de `BoletoEntrada.cs` e `EntradaMercadoria.cs` está exatamente como especificado nos Steps 3 e 4, e prossiga para o commit. Os testes serão executados de fato ao final da Task 2 (quando o build voltar a compilar).

- [ ] **Step 6: Commit**

```bash
git add src/CasaDiAna.Domain/Entities/BoletoEntrada.cs src/CasaDiAna.Domain/Entities/EntradaMercadoria.cs tests/CasaDiAna.Application.Tests/Entradas/EntradaMercadoriaBoletoTests.cs
git commit -m "feat(entradas): entidade BoletoEntrada e EntradaMercadoria com lista de boletos

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2 — Infraestrutura: EF config, DbSet, repositório

**Files:**
- Create: `src/CasaDiAna.Infrastructure/Persistence/Configurations/BoletoEntradaConfiguration.cs`
- Modify: `src/CasaDiAna.Infrastructure/Persistence/Configurations/EntradaMercadoriaConfiguration.cs`
- Modify: `src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs`
- Modify: `src/CasaDiAna.Infrastructure/Repositories/EntradaMercadoriaRepository.cs`

**Interfaces:**
- Consumes: `BoletoEntrada`, `EntradaMercadoria.Boletos` (Task 1).
- Produces: mapeamento EF completo de `BoletoEntrada`; `EntradaMercadoriaRepository.ObterPorIdComItensAsync`/`ListarAsync` carregando `Boletos`. Nenhuma interface nova para a Application (boletos são sempre acessados via a `EntradaMercadoria` pai).

- [ ] **Step 1: Criar `BoletoEntradaConfiguration.cs`**

```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class BoletoEntradaConfiguration : IEntityTypeConfiguration<BoletoEntrada>
{
    public void Configure(EntityTypeBuilder<BoletoEntrada> builder)
    {
        builder.HasKey(b => b.Id);
        builder.ToTable("boletos_entrada", "estoque");

        builder.Property(b => b.Id).HasColumnName("id");
        builder.Property(b => b.EntradaId).HasColumnName("entrada_id").IsRequired();
        builder.Property(b => b.DataVencimento).HasColumnName("data_vencimento").IsRequired();

        builder.HasIndex(b => b.EntradaId);
        builder.HasIndex(b => b.DataVencimento);
    }
}
```

- [ ] **Step 2: Modificar `EntradaMercadoriaConfiguration.cs`**

Remover estas 2 linhas (propriedades `TemBoleto`/`DataVencimentoBoleto`):

```csharp
        builder.Property(e => e.TemBoleto)
            .HasColumnName("tem_boleto")
            .HasDefaultValue(false)
            .IsRequired();
        builder.Property(e => e.DataVencimentoBoleto)
            .HasColumnName("data_vencimento_boleto");
```

Remover este índice:

```csharp
        builder.HasIndex(e => e.DataVencimentoBoleto)
            .HasFilter("data_vencimento_boleto IS NOT NULL");
```

Depois do bloco `builder.Navigation(e => e.ItensUtensilio).UsePropertyAccessMode(PropertyAccessMode.Field);` existente, adicionar:

```csharp
        builder.HasMany(e => e.Boletos)
            .WithOne()
            .HasForeignKey(b => b.EntradaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(e => e.Boletos)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
```

- [ ] **Step 3: Modificar `AppDbContext.cs`**

Depois da linha `public DbSet<ItemEntradaMercadoria> ItensEntradaMercadoria => Set<ItemEntradaMercadoria>();`, adicionar:

```csharp
    public DbSet<BoletoEntrada> BoletosEntrada => Set<BoletoEntrada>();
```

- [ ] **Step 4: Modificar `EntradaMercadoriaRepository.cs`**

No método `ObterPorIdComItensAsync`, adicionar `.Include(e => e.Boletos)` (em qualquer posição entre os outros `.Include`, antes do `.FirstOrDefaultAsync`):

```csharp
    public Task<EntradaMercadoria?> ObterPorIdComItensAsync(Guid id, CancellationToken ct = default) =>
        _db.EntradasMercadoria
            .Include(e => e.Fornecedor)
            .Include(e => e.Itens)
                .ThenInclude(i => i.Ingrediente)
            .Include(e => e.ItensUtensilio)
                .ThenInclude(i => i.Utensilio)
                    .ThenInclude(u => u!.UnidadeMedida)
            .Include(e => e.Boletos)
            .FirstOrDefaultAsync(e => e.Id == id, ct);
```

No método `ListarAsync`, adicionar `.Include(e => e.Boletos)` ao lado dos outros `.Include`:

```csharp
    public async Task<IReadOnlyList<EntradaMercadoria>> ListarAsync(
        DateTime? de = null, DateTime? ate = null, CancellationToken ct = default)
    {
        var query = _db.EntradasMercadoria
            .Include(e => e.Fornecedor)
            .Include(e => e.Itens)
            .Include(e => e.ItensUtensilio)
            .Include(e => e.Boletos)
            .AsQueryable();

        if (de.HasValue)
            query = query.Where(e => e.DataEntrada >= de.Value);
        if (ate.HasValue)
            query = query.Where(e => e.DataEntrada < ate.Value.Date.AddDays(1));

        return await query.OrderByDescending(e => e.DataEntrada).ToListAsync(ct);
    }
```

(`ListarParaComparacaoAsync` não precisa de `Boletos` — é usado só pelo relatório de Comparação de Preço, que não exibe boleto.)

- [ ] **Step 5: Build**

Run: `dotnet build src/CasaDiAna.API` (dentro de `CasaDiAna/`)
Expected: **ainda falha** — `RegistrarEntradaCommandHandler.cs`/`RegistrarEntradaCommandValidator.cs`/`RegistrarEntradaCommand.cs`/`EntradaMercadoriaDto.cs`/`EntradaMercadoriaResumoDto.cs`/`ListarEntradasQueryHandler.cs` ainda usam os campos antigos. Confirme que os erros de build agora vêm só desses arquivos (nenhum erro vindo de `EntradaMercadoriaConfiguration.cs`, `BoletoEntradaConfiguration.cs`, `AppDbContext.cs` ou `EntradaMercadoriaRepository.cs`) — esses são corrigidos na Task 3.

- [ ] **Step 6: Commit**

```bash
git add src/CasaDiAna.Infrastructure/Persistence/Configurations/BoletoEntradaConfiguration.cs src/CasaDiAna.Infrastructure/Persistence/Configurations/EntradaMercadoriaConfiguration.cs src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs src/CasaDiAna.Infrastructure/Repositories/EntradaMercadoriaRepository.cs
git commit -m "feat(entradas): EF config, DbSet e Include de BoletoEntrada

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3 — Application: `RegistrarEntrada`, DTOs e listagem com lista de boletos

**Files:**
- Create: `src/CasaDiAna.Application/Entradas/Dtos/BoletoDto.cs`
- Modify: `src/CasaDiAna.Application/Entradas/Commands/RegistrarEntrada/RegistrarEntradaCommand.cs`
- Modify: `src/CasaDiAna.Application/Entradas/Commands/RegistrarEntrada/RegistrarEntradaCommandValidator.cs`
- Modify: `src/CasaDiAna.Application/Entradas/Commands/RegistrarEntrada/RegistrarEntradaCommandHandler.cs`
- Modify: `src/CasaDiAna.Application/Entradas/Dtos/EntradaMercadoriaDto.cs`
- Modify: `src/CasaDiAna.Application/Entradas/Dtos/EntradaMercadoriaResumoDto.cs`
- Modify: `src/CasaDiAna.Application/Entradas/Queries/ListarEntradas/ListarEntradasQueryHandler.cs`
- Modify: `tests/CasaDiAna.Application.Tests/Entradas/RegistrarEntradaCommandHandlerTests.cs`
- Modify: `tests/CasaDiAna.Application.Tests/Entradas/RegistrarEntradaValidatorBoletoTests.cs`

**Interfaces:**
- Consumes: `EntradaMercadoria.AdicionarBoleto`, `.Boletos`, `.TemBoleto`, `.ProximoVencimentoBoleto` (Task 1).
- Produces: `RegistrarEntradaCommand.DatasVencimentoBoleto: IReadOnlyList<DateTime>?`; `BoletoDto(Guid Id, DateTime DataVencimento)`; `EntradaMercadoriaDto.Boletos: IReadOnlyList<BoletoDto>`; `EntradaMercadoriaResumoDto.ProximoVencimentoBoleto`/`.TotalBoletos` — consumidos pelo frontend (Task 5) e por `CancelarEntradaCommandHandler`/`ObterEntradaQueryHandler` (que já reaproveitam `RegistrarEntradaCommandHandler.ToDto`, sem precisar de alteração própria).

- [ ] **Step 1: Criar `BoletoDto.cs`**

```csharp
namespace CasaDiAna.Application.Entradas.Dtos;

public record BoletoDto(Guid Id, DateTime DataVencimento);
```

- [ ] **Step 2: Modificar `RegistrarEntradaCommand.cs`**

Substituir o arquivo por:

```csharp
using CasaDiAna.Application.Entradas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;

public record RegistrarEntradaCommand(
    Guid FornecedorId,
    DateTime DataEntrada,
    IReadOnlyList<ItemEntradaInputDto> Itens,
    string RecebidoPor,
    string? NumeroNotaFiscal = null,
    string? Observacoes = null,
    IReadOnlyList<DateTime>? DatasVencimentoBoleto = null,
    IReadOnlyList<ItemEntradaUtensilioInputDto>? ItensUtensilio = null) : IRequest<EntradaMercadoriaDto>;
```

- [ ] **Step 3: Modificar `RegistrarEntradaCommandValidator.cs`**

Substituir o arquivo por:

```csharp
using FluentValidation;

namespace CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;

public class RegistrarEntradaCommandValidator : AbstractValidator<RegistrarEntradaCommand>
{
    public RegistrarEntradaCommandValidator()
    {
        RuleFor(x => x.FornecedorId)
            .NotEmpty().WithMessage("Fornecedor é obrigatório.");

        RuleFor(x => x.DataEntrada)
            .NotEmpty().WithMessage("Data de entrada é obrigatória.");

        RuleFor(x => x)
            .Must(x => (x.Itens?.Count ?? 0) > 0 || (x.ItensUtensilio?.Count ?? 0) > 0)
            .WithMessage("A entrada deve ter pelo menos um item.");

        RuleForEach(x => x.Itens).ChildRules(item =>
        {
            item.RuleFor(i => i.IngredienteId)
                .NotEmpty().WithMessage("Ingrediente é obrigatório.");
            item.RuleFor(i => i.Quantidade)
                .GreaterThan(0).WithMessage("Quantidade deve ser maior que zero.");
            item.RuleFor(i => i.CustoUnitario)
                .GreaterThanOrEqualTo(0).WithMessage("Custo unitário não pode ser negativo.");
        });

        RuleForEach(x => x.ItensUtensilio).ChildRules(item =>
        {
            item.RuleFor(i => i.UtensilioId)
                .NotEmpty().WithMessage("Utensílio é obrigatório.");
            item.RuleFor(i => i.Quantidade)
                .GreaterThan(0).WithMessage("Quantidade deve ser maior que zero.");
            item.RuleFor(i => i.CustoUnitario)
                .GreaterThanOrEqualTo(0).WithMessage("Custo unitário não pode ser negativo.");
        });

        RuleFor(x => x.NumeroNotaFiscal)
            .MaximumLength(60).When(x => x.NumeroNotaFiscal != null)
            .WithMessage("Número da nota fiscal deve ter no máximo 60 caracteres.");

        RuleFor(x => x.RecebidoPor)
            .NotEmpty().WithMessage("Informe quem recebeu os produtos.")
            .MaximumLength(100).WithMessage("Nome de quem recebeu deve ter no máximo 100 caracteres.");

        RuleForEach(x => x.DatasVencimentoBoleto).ChildRules(data =>
        {
            data.RuleFor(d => d)
                .GreaterThanOrEqualTo(_ => DateTime.UtcNow.Date)
                .WithMessage("A data de vencimento do boleto deve ser hoje ou no futuro.");
        });
    }
}
```

- [ ] **Step 4: Modificar `RegistrarEntradaCommandHandler.cs`**

Substituir o arquivo por:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Entradas.Dtos;
using CasaDiAna.Application.Notificacoes.Services;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;

public class RegistrarEntradaCommandHandler : IRequestHandler<RegistrarEntradaCommand, EntradaMercadoriaDto>
{
    private readonly IEntradaMercadoriaRepository _entradas;
    private readonly IIngredienteRepository _ingredientes;
    private readonly IUtensilioRepository _utensilios;
    private readonly IMovimentacaoRepository _movimentacoes;
    private readonly IMovimentacaoUtensilioRepository _movimentacoesUtensilio;
    private readonly IFornecedorRepository _fornecedores;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificacaoEstoqueService _notificacaoService;

    public RegistrarEntradaCommandHandler(
        IEntradaMercadoriaRepository entradas,
        IIngredienteRepository ingredientes,
        IUtensilioRepository utensilios,
        IMovimentacaoRepository movimentacoes,
        IMovimentacaoUtensilioRepository movimentacoesUtensilio,
        IFornecedorRepository fornecedores,
        ICurrentUserService currentUser,
        INotificacaoEstoqueService notificacaoService)
    {
        _entradas = entradas;
        _ingredientes = ingredientes;
        _utensilios = utensilios;
        _movimentacoes = movimentacoes;
        _movimentacoesUtensilio = movimentacoesUtensilio;
        _fornecedores = fornecedores;
        _currentUser = currentUser;
        _notificacaoService = notificacaoService;
    }

    public async Task<EntradaMercadoriaDto> Handle(
        RegistrarEntradaCommand request, CancellationToken cancellationToken)
    {
        var fornecedor = await _fornecedores.ObterPorIdAsync(request.FornecedorId, cancellationToken)
            ?? throw new DomainException("Fornecedor não encontrado.");

        if (!fornecedor.Ativo)
            throw new DomainException("Fornecedor está inativo.");

        var entrada = EntradaMercadoria.Criar(
            request.FornecedorId,
            request.DataEntrada,
            _currentUser.UsuarioId,
            request.NumeroNotaFiscal,
            request.RecebidoPor,
            request.Observacoes);

        foreach (var dataVencimento in request.DatasVencimentoBoleto ?? Array.Empty<DateTime>())
            entrada.AdicionarBoleto(dataVencimento);

        var itensIngrediente = request.Itens ?? Array.Empty<ItemEntradaInputDto>();

        // Carrega todos os ingredientes de uma vez
        var ingredienteIds = itensIngrediente.Select(i => i.IngredienteId).Distinct().ToList();
        var ingredientesMap = new Dictionary<Guid, Ingrediente>();
        foreach (var id in ingredienteIds)
        {
            var ing = await _ingredientes.ObterPorIdAsync(id, cancellationToken)
                ?? throw new DomainException($"Ingrediente '{id}' não encontrado.");
            if (!ing.Ativo)
                throw new DomainException($"Ingrediente '{ing.Nome}' está inativo.");
            ingredientesMap[id] = ing;
        }

        // Adiciona itens de ingrediente na entrada e atualiza estoque
        foreach (var item in itensIngrediente)
        {
            entrada.AdicionarItem(item.IngredienteId, item.Quantidade, item.CustoUnitario);

            var ingrediente = ingredientesMap[item.IngredienteId];
            var novoSaldo = ingrediente.EstoqueAtual + item.Quantidade;
            ingrediente.AtualizarEstoque(novoSaldo, _currentUser.UsuarioId);
            ingrediente.AtualizarCusto(item.CustoUnitario, _currentUser.UsuarioId);
            _ingredientes.Atualizar(ingrediente);

            var movimentacao = Movimentacao.Criar(
                item.IngredienteId,
                TipoMovimentacao.Entrada,
                item.Quantidade,
                novoSaldo,
                _currentUser.UsuarioId,
                referenciaTipo: "EntradaMercadoria",
                referenciaId: entrada.Id);

            await _movimentacoes.AdicionarAsync(movimentacao, cancellationToken);
        }

        // Carrega todos os utensílios de uma vez
        var itensUtensilio = request.ItensUtensilio ?? Array.Empty<ItemEntradaUtensilioInputDto>();
        var utensilioIds = itensUtensilio.Select(i => i.UtensilioId).Distinct().ToList();
        var utensiliosMap = new Dictionary<Guid, Utensilio>();
        foreach (var id in utensilioIds)
        {
            var ute = await _utensilios.ObterPorIdAsync(id, cancellationToken)
                ?? throw new DomainException($"Utensílio '{id}' não encontrado.");
            if (!ute.Ativo)
                throw new DomainException($"Utensílio '{ute.Nome}' está inativo.");
            utensiliosMap[id] = ute;
        }

        // Adiciona itens de utensílio na entrada e atualiza estoque
        foreach (var item in itensUtensilio)
        {
            entrada.AdicionarItemUtensilio(item.UtensilioId, item.Quantidade, item.CustoUnitario);

            var utensilio = utensiliosMap[item.UtensilioId];
            var novoSaldo = utensilio.EstoqueAtual + item.Quantidade;
            utensilio.AtualizarEstoque(novoSaldo, _currentUser.UsuarioId);
            utensilio.AtualizarCusto(item.CustoUnitario, _currentUser.UsuarioId);
            _utensilios.Atualizar(utensilio);

            var movimentacaoUtensilio = MovimentacaoUtensilio.Criar(
                item.UtensilioId,
                TipoMovimentacao.Entrada,
                item.Quantidade,
                novoSaldo,
                _currentUser.UsuarioId,
                referenciaTipo: "EntradaMercadoria",
                referenciaId: entrada.Id);

            await _movimentacoesUtensilio.AdicionarAsync(movimentacaoUtensilio, cancellationToken);
        }

        await _entradas.AdicionarAsync(entrada, cancellationToken);
        await _entradas.SalvarAsync(cancellationToken);

        foreach (var ing in ingredientesMap.Values)
            await _notificacaoService.VerificarECriarAsync(ing, cancellationToken);

        var salva = await _entradas.ObterPorIdComItensAsync(entrada.Id, cancellationToken);
        return ToDto(salva!);
    }

    internal static EntradaMercadoriaDto ToDto(EntradaMercadoria e)
    {
        var itens = e.Itens.Select(i => new ItemEntradaDto(
            i.Id,
            i.IngredienteId,
            i.Ingrediente?.Nome ?? string.Empty,
            i.Ingrediente?.UnidadeMedida?.Codigo ?? string.Empty,
            i.Quantidade,
            i.CustoUnitario,
            i.CustoTotal)).ToList().AsReadOnly();

        var itensUtensilio = e.ItensUtensilio.Select(i => new ItemEntradaUtensilioDto(
            i.Id,
            i.UtensilioId,
            i.Utensilio?.Nome ?? string.Empty,
            i.Utensilio?.UnidadeMedida?.Codigo ?? string.Empty,
            i.Quantidade,
            i.CustoUnitario,
            i.CustoTotal)).ToList().AsReadOnly();

        var boletos = e.Boletos
            .OrderBy(b => b.DataVencimento)
            .Select(b => new BoletoDto(b.Id, b.DataVencimento))
            .ToList()
            .AsReadOnly();

        return new EntradaMercadoriaDto(
            e.Id,
            e.FornecedorId,
            e.Fornecedor?.RazaoSocial ?? string.Empty,
            e.NumeroNotaFiscal,
            e.DataEntrada,
            e.Status.ToString(),
            e.RecebidoPor,
            e.Observacoes,
            itens,
            itens.Sum(i => i.CustoTotal) + itensUtensilio.Sum(i => i.CustoTotal),
            e.CriadoEm,
            itensUtensilio,
            boletos);
    }
}
```

- [ ] **Step 5: Modificar `EntradaMercadoriaDto.cs`**

Substituir o arquivo por:

```csharp
namespace CasaDiAna.Application.Entradas.Dtos;

public record EntradaMercadoriaDto(
    Guid Id,
    Guid FornecedorId,
    string FornecedorNome,
    string? NumeroNotaFiscal,
    DateTime DataEntrada,
    string Status,
    string? RecebidoPor,
    string? Observacoes,
    IReadOnlyList<ItemEntradaDto> Itens,
    decimal CustoTotal,
    DateTime CriadoEm,
    IReadOnlyList<ItemEntradaUtensilioDto> ItensUtensilio,
    IReadOnlyList<BoletoDto> Boletos);
```

- [ ] **Step 6: Modificar `EntradaMercadoriaResumoDto.cs`**

Substituir o arquivo por:

```csharp
namespace CasaDiAna.Application.Entradas.Dtos;

public record EntradaMercadoriaResumoDto(
    Guid Id,
    string FornecedorNome,
    string? NumeroNotaFiscal,
    DateTime DataEntrada,
    string Status,
    string? RecebidoPor,
    int TotalItens,
    decimal CustoTotal,
    DateTime CriadoEm,
    DateTime? ProximoVencimentoBoleto,
    int TotalBoletos);
```

- [ ] **Step 7: Modificar `ListarEntradasQueryHandler.cs`**

Substituir o arquivo por:

```csharp
using CasaDiAna.Application.Entradas.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Entradas.Queries.ListarEntradas;

public class ListarEntradasQueryHandler : IRequestHandler<ListarEntradasQuery, IReadOnlyList<EntradaMercadoriaResumoDto>>
{
    private readonly IEntradaMercadoriaRepository _entradas;

    public ListarEntradasQueryHandler(IEntradaMercadoriaRepository entradas)
    {
        _entradas = entradas;
    }

    public async Task<IReadOnlyList<EntradaMercadoriaResumoDto>> Handle(
        ListarEntradasQuery request, CancellationToken cancellationToken)
    {
        var lista = await _entradas.ListarAsync(request.De, request.Ate, cancellationToken);

        return lista.Select(e => new EntradaMercadoriaResumoDto(
            e.Id,
            e.Fornecedor?.RazaoSocial ?? string.Empty,
            e.NumeroNotaFiscal,
            e.DataEntrada,
            e.Status.ToString(),
            e.RecebidoPor,
            e.Itens.Count + e.ItensUtensilio.Count,
            e.Itens.Sum(i => i.CustoTotal) + e.ItensUtensilio.Sum(i => i.CustoTotal),
            e.CriadoEm,
            e.ProximoVencimentoBoleto,
            e.Boletos.Count)).ToList().AsReadOnly();
    }
}
```

- [ ] **Step 8: Adicionar os 2 testes novos em `RegistrarEntradaCommandHandlerTests.cs`**

Abrir o arquivo, e depois do método `DeveRegistrarEntrada_QuandoMistaIngredienteEUtensilio()` (antes do método `DeveLancarExcecao_QuandoFornecedorNaoEncontrado()`), inserir:

```csharp
    [Fact]
    public async Task DeveRegistrarEntrada_ComMultiplosBoletos()
    {
        var fornecedorId = Guid.NewGuid();
        var ingredienteId = Guid.NewGuid();
        var fornecedor = Fornecedor.Criar("Distribuidora XYZ", _usuarioId);
        var ingrediente = CriarIngrediente();

        var vencimento1 = DateTime.UtcNow.Date.AddDays(10);
        var vencimento2 = DateTime.UtcNow.Date.AddDays(40);

        var entradaRetornada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entradaRetornada.AdicionarItem(ingredienteId, 10, 5.50m);
        entradaRetornada.AdicionarBoleto(vencimento1);
        entradaRetornada.AdicionarBoleto(vencimento2);

        _fornecedores.Setup(r => r.ObterPorIdAsync(fornecedorId, default)).ReturnsAsync(fornecedor);
        _ingredientes.Setup(r => r.ObterPorIdAsync(ingredienteId, default)).ReturnsAsync(ingrediente);
        _ingredientes.Setup(r => r.Atualizar(It.IsAny<Ingrediente>()));
        _movimentacoes.Setup(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.AdicionarAsync(It.IsAny<EntradaMercadoria>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _entradas.Setup(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(entradaRetornada);

        var resultado = await _handler.Handle(
            new RegistrarEntradaCommand(
                fornecedorId,
                DateTime.UtcNow,
                new List<ItemEntradaInputDto> { new(ingredienteId, 10, 5.50m) },
                "Operador Teste",
                DatasVencimentoBoleto: new List<DateTime> { vencimento1, vencimento2 }),
            CancellationToken.None);

        resultado.Boletos.Should().HaveCount(2);
        resultado.Boletos.Should().Contain(b => b.DataVencimento == vencimento1);
        resultado.Boletos.Should().Contain(b => b.DataVencimento == vencimento2);
    }

    [Fact]
    public async Task DeveRegistrarEntrada_SemBoleto_QuandoDatasVencimentoBoletoNaoInformado()
    {
        var fornecedorId = Guid.NewGuid();
        var ingredienteId = Guid.NewGuid();
        var fornecedor = Fornecedor.Criar("Distribuidora XYZ", _usuarioId);
        var ingrediente = CriarIngrediente();

        var entradaRetornada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entradaRetornada.AdicionarItem(ingredienteId, 10, 5.50m);

        _fornecedores.Setup(r => r.ObterPorIdAsync(fornecedorId, default)).ReturnsAsync(fornecedor);
        _ingredientes.Setup(r => r.ObterPorIdAsync(ingredienteId, default)).ReturnsAsync(ingrediente);
        _ingredientes.Setup(r => r.Atualizar(It.IsAny<Ingrediente>()));
        _movimentacoes.Setup(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.AdicionarAsync(It.IsAny<EntradaMercadoria>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _entradas.Setup(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(entradaRetornada);

        var resultado = await _handler.Handle(
            new RegistrarEntradaCommand(
                fornecedorId,
                DateTime.UtcNow,
                new List<ItemEntradaInputDto> { new(ingredienteId, 10, 5.50m) },
                "Operador Teste"),
            CancellationToken.None);

        resultado.Boletos.Should().BeEmpty();
    }
```

- [ ] **Step 9: Reescrever `RegistrarEntradaValidatorBoletoTests.cs`**

Substituir o arquivo inteiro por:

```csharp
using CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;
using CasaDiAna.Application.Entradas.Dtos;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Entradas;

public class RegistrarEntradaValidatorBoletoTests
{
    private readonly RegistrarEntradaCommandValidator _sut = new();

    private static RegistrarEntradaCommand ComandoValido(
        IReadOnlyList<DateTime>? datasVencimentoBoleto = null) =>
        new(
            FornecedorId: Guid.NewGuid(),
            DataEntrada: DateTime.UtcNow,
            Itens: new List<ItemEntradaInputDto>
            {
                new(Guid.NewGuid(), 1m, 10m)
            }.AsReadOnly(),
            RecebidoPor: "João",
            DatasVencimentoBoleto: datasVencimentoBoleto);

    [Fact]
    public void Deve_passar_quando_SemBoleto()
    {
        var result = _sut.Validate(ComandoValido());
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_falhar_quando_DataDeBoletoNoPassado()
    {
        var result = _sut.Validate(ComandoValido(
            datasVencimentoBoleto: new List<DateTime> { DateTime.UtcNow.AddDays(-1) }));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("hoje ou no futuro"));
    }

    [Fact]
    public void Deve_passar_quando_UmaDataFutura()
    {
        var result = _sut.Validate(ComandoValido(
            datasVencimentoBoleto: new List<DateTime> { DateTime.UtcNow.AddDays(10) }));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_passar_quando_DataDeHoje()
    {
        var result = _sut.Validate(ComandoValido(
            datasVencimentoBoleto: new List<DateTime> { DateTime.UtcNow.Date }));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_passar_quando_MultiplasDatasFuturas()
    {
        var result = _sut.Validate(ComandoValido(
            datasVencimentoBoleto: new List<DateTime>
            {
                DateTime.UtcNow.AddDays(10),
                DateTime.UtcNow.AddDays(40),
            }));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_falhar_quando_UmaDeVariasDatasNoPassado()
    {
        var result = _sut.Validate(ComandoValido(
            datasVencimentoBoleto: new List<DateTime>
            {
                DateTime.UtcNow.AddDays(10),
                DateTime.UtcNow.AddDays(-2),
            }));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("hoje ou no futuro"));
    }

    [Fact]
    public void Deve_passar_quando_SoUtensilio_eItensEhNull()
    {
        var comando = new RegistrarEntradaCommand(
            FornecedorId: Guid.NewGuid(),
            DataEntrada: DateTime.UtcNow,
            Itens: null!,
            RecebidoPor: "João",
            ItensUtensilio: new List<ItemEntradaUtensilioInputDto> { new(Guid.NewGuid(), 1m, 10m) }.AsReadOnly());

        var result = _sut.Validate(comando);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_falhar_quando_ItensNuloEItensUtensilioVazio()
    {
        var comando = new RegistrarEntradaCommand(
            FornecedorId: Guid.NewGuid(),
            DataEntrada: DateTime.UtcNow,
            Itens: null!,
            RecebidoPor: "João");

        var result = _sut.Validate(comando);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("pelo menos um item"));
    }
}
```

- [ ] **Step 10: Build + testes**

Run: `dotnet build src/CasaDiAna.API` (dentro de `CasaDiAna/`)
Expected: Build succeeded, 0 erros.

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~Entradas"` (dentro de `CasaDiAna/`)
Expected: PASS — inclui os 5 testes de `EntradaMercadoriaBoletoTests` (Task 1), os 8 testes de `RegistrarEntradaCommandHandlerTests` (6 existentes + 2 novos), os 9 de `RegistrarEntradaValidatorBoletoTests`, e os testes já existentes de `CancelarEntradaCommandHandlerTests`/`ObterEntradaQueryHandlerTests` sem alteração.

- [ ] **Step 11: Commit**

```bash
git add src/CasaDiAna.Application/Entradas/ tests/CasaDiAna.Application.Tests/Entradas/RegistrarEntradaCommandHandlerTests.cs tests/CasaDiAna.Application.Tests/Entradas/RegistrarEntradaValidatorBoletoTests.cs
git commit -m "feat(entradas): RegistrarEntrada e listagem suportam multiplos boletos

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4 — Migration: tabela `boletos_entrada` com backfill e remoção das colunas antigas

**Files:**
- Create (via `dotnet ef migrations add`): `src/CasaDiAna.Infrastructure/Persistence/Migrations/<timestamp>_AddBoletosEntrada.cs` e `.Designer.cs`
- Modify: `src/CasaDiAna.Infrastructure/Persistence/Migrations/<timestamp>_AddBoletosEntrada.cs` (inserir SQL de backfill manualmente)
- Modify: `src/CasaDiAna.Infrastructure/Persistence/Migrations/AppDbContextModelSnapshot.cs` (gerado automaticamente pelo `dotnet ef`)

**Interfaces:**
- Consumes: `BoletoEntradaConfiguration` e `EntradaMercadoriaConfiguration` (Task 2) — a migration é gerada a partir deles.
- Produces: tabela `estoque.boletos_entrada` populada a partir dos dados existentes em `tem_boleto`/`data_vencimento_boleto`; essas 2 colunas e o índice `IX_entradas_mercadoria_data_vencimento_boleto` deixam de existir em `estoque.entradas_mercadoria`.

- [ ] **Step 1: Gerar a migration**

Run (dentro de `CasaDiAna/`):
```bash
dotnet ef migrations add AddBoletosEntrada --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API
```
Expected: cria `Migrations/<timestamp>_AddBoletosEntrada.cs` com um `Up()` que faz `migrationBuilder.CreateTable(name: "boletos_entrada", ...)` + `CreateIndex` nos dois índices, e `migrationBuilder.DropColumn(name: "tem_boleto", ...)` + `DropColumn(name: "data_vencimento_boleto", ...)` + `DropIndex` do índice antigo. A ordem gerada por padrão é: cria tabela nova primeiro, derruba colunas antigas depois — **essa ordem deve ser preservada**, só inserindo o backfill entre as duas.

- [ ] **Step 2: Inserir o SQL de backfill**

Abrir o arquivo gerado. Localizar o ponto exato entre o último `CreateIndex` relativo a `boletos_entrada` e o primeiro `DropIndex`/`DropColumn` relativo a `entradas_mercadoria`. Inserir:

```csharp
            migrationBuilder.Sql(@"
                INSERT INTO estoque.boletos_entrada (id, entrada_id, data_vencimento)
                SELECT gen_random_uuid(), id, data_vencimento_boleto
                FROM estoque.entradas_mercadoria
                WHERE tem_boleto = true AND data_vencimento_boleto IS NOT NULL;
            ");
```

Esse `INSERT` deve ficar **depois** do `CreateTable`/`CreateIndex` de `boletos_entrada` (a tabela precisa existir) e **antes** dos `DropColumn` de `tem_boleto`/`data_vencimento_boleto` (os dados precisam ainda estar lá para serem lidos).

No método `Down()` gerado automaticamente (que recria as colunas antigas e derruba a tabela nova), inserir o SQL inverso **antes** do `DropTable(name: "boletos_entrada")`:

```csharp
            migrationBuilder.Sql(@"
                UPDATE estoque.entradas_mercadoria e
                SET tem_boleto = true,
                    data_vencimento_boleto = (
                        SELECT MIN(b.data_vencimento)
                        FROM estoque.boletos_entrada b
                        WHERE b.entrada_id = e.id
                    )
                WHERE EXISTS (
                    SELECT 1 FROM estoque.boletos_entrada b WHERE b.entrada_id = e.id
                );
            ");
```

(No `Down()`, as colunas `tem_boleto`/`data_vencimento_boleto` são recriadas pelo `AddColumn` gerado automaticamente antes desse ponto — confirmar que o `UPDATE` vem depois dos `AddColumn` e antes do `DropTable`.)

- [ ] **Step 3: Aplicar a migration localmente**

Run:
```bash
dotnet ef database update --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API
```
Expected: aplica sem erro; `estoque.boletos_entrada` existe e está populada para entradas que já tinham boleto.

- [ ] **Step 4: Build + testes completos**

Run: `dotnet build` (dentro de `CasaDiAna/`)
Expected: Build succeeded, 0 erros.

Run: `dotnet test` (dentro de `CasaDiAna/`)
Expected: PASS — toda a suíte, incluindo os testes de integração de migrations/EF se existirem.

- [ ] **Step 5: Commit**

```bash
git add src/CasaDiAna.Infrastructure/Persistence/Migrations/
git commit -m "feat(entradas): migration AddBoletosEntrada com backfill de boleto unico

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5 — Frontend: tipos de `estoque.ts` para lista de boletos

**Files:**
- Modify: `frontend/src/types/estoque.ts`

**Interfaces:**
- Consumes: `BoletoDto`, `EntradaMercadoriaDto`, `EntradaMercadoriaResumoDto` (Task 3) — os novos tipos TS espelham exatamente esses DTOs (camelCase, igual ao `JsonStringEnumConverter` já configurado globalmente).
- Produces: `Boleto`, `EntradaMercadoriaResumo.proximoVencimentoBoleto`/`.totalBoletos`, `EntradaMercadoria.boletos`, `RegistrarEntradaInput.datasVencimentoBoleto`, `EntradaFormValues.boletos` — consumidos pelas Tasks 6 e 7.

- [ ] **Step 1: Editar as interfaces de Entradas em `estoque.ts`**

Localizar o bloco de interfaces de Entradas (seção com `EntradaMercadoriaResumo`, `ItemEntrada`, `ItemEntradaUtensilio`, `EntradaMercadoria`, `ItemEntradaInput`, `ItemEntradaUtensilioInput`, `RegistrarEntradaInput`, `EntradaFormValues`).

Em `EntradaMercadoriaResumo`, substituir:
```ts
  temBoleto: boolean
  dataVencimentoBoleto: string | null
```
por:
```ts
  proximoVencimentoBoleto: string | null
  totalBoletos: number
```

Adicionar a nova interface `Boleto` (antes de `EntradaMercadoria`):
```ts
export interface Boleto {
  id: string
  dataVencimento: string
}
```

Em `EntradaMercadoria`, substituir:
```ts
  temBoleto: boolean
  dataVencimentoBoleto: string | null
```
por:
```ts
  boletos: Boleto[]
```

Em `RegistrarEntradaInput`, substituir:
```ts
  temBoleto: boolean
  dataVencimentoBoleto?: string | null
```
por:
```ts
  datasVencimentoBoleto?: string[]
```

Em `EntradaFormValues`, substituir:
```ts
  temBoleto: boolean
  dataVencimentoBoleto: string
```
por:
```ts
  temBoleto: boolean
  boletos: { dataVencimento: string }[]
```

- [ ] **Step 2: Checagem de tipos**

Run (dentro de `frontend/`): `npx tsc --noEmit`
Expected: erros apontando os consumidores que ainda usam os campos antigos (`EntradaFormPage.tsx`, `EntradasPage.tsx`, `EntradaDetalhePage.tsx`) — esperado, serão corrigidos nas Tasks 6 e 7. Confirmar que os erros são exatamente nesses 3 arquivos, sem erros em outros módulos (ex: nenhum erro em `utensilios/`, `ingredientes/`).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/estoque.ts
git commit -m "feat(entradas): tipos de boleto no frontend suportam lista

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6 — Frontend: `EntradaFormPage.tsx` com lista dinâmica de boletos

**Files:**
- Modify: `frontend/src/features/entradas/pages/EntradaFormPage.tsx`

**Interfaces:**
- Consumes: `EntradaFormValues.boletos: { dataVencimento: string }[]` (Task 5), `RegistrarEntradaInput.datasVencimentoBoleto?: string[]` (Task 5).
- Produces: formulário envia `datasVencimentoBoleto: string[]` para `entradasService.registrar`.

- [ ] **Step 1: Reescrever `EntradaFormPage.tsx`**

Substituir o arquivo inteiro por:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { entradasService } from '../services/entradasService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { utensiliosService } from '@/features/estoque/utensilios/services/utensiliosService'
import { fornecedoresService } from '@/features/fornecedores/services/fornecedoresService'
import { CampoTexto } from '@/components/ui/CampoTexto'
import { SelectCampo } from '@/components/ui/SelectCampo'
import { Toast } from '@/components/ui/Toast'
import { LoadingState } from '@/components/ui/LoadingState'
import { useEffect } from 'react'
import type { Ingrediente } from '@/types/estoque'
import type { Utensilio } from '@/types/estoque'
import type { Fornecedor } from '@/types/fornecedor'

const itemSchema = z.object({
  tipo: z.enum(['ingrediente', 'utensilio']),
  itemId: z.string().min(1, 'Selecione um item.'),
  quantidade: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ message: 'Quantidade é obrigatória.' }).positive('Quantidade deve ser maior que zero.')
  ),
  custoUnitario: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ message: 'Custo unitário é obrigatório.' }).nonnegative('Custo não pode ser negativo.')
  ),
})

const boletoSchema = z.object({
  dataVencimento: z.string().min(1, 'Informe a data de vencimento.'),
})

const schema = z.object({
  fornecedorId: z.string().min(1, 'Selecione um fornecedor.'),
  dataEntrada: z.string().min(1, 'Informe a data de entrada.'),
  numeroNotaFiscal: z.string().optional(),
  recebidoPor: z.string().min(1, 'Informe quem recebeu os produtos.'),
  observacoes: z.string().optional(),
  temBoleto: z.boolean().default(false),
  boletos: z.array(boletoSchema).default([]),
  itens: z.array(itemSchema).min(1, 'Adicione pelo menos um item.'),
}).refine(
  (data) => !data.temBoleto || data.boletos.length > 0,
  { message: 'Adicione pelo menos um boleto.', path: ['boletos'] }
)

type FormValues = z.infer<typeof schema>

export function EntradaFormPage() {
  const navigate = useNavigate()
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
  const [utensilios, setUtensilios] = useState<Utensilio[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      fornecedorId: '',
      dataEntrada: new Date().toISOString().slice(0, 10),
      numeroNotaFiscal: '',
      recebidoPor: '',
      observacoes: '',
      temBoleto: false,
      boletos: [],
      itens: [{ tipo: 'ingrediente', itemId: '', quantidade: 0, custoUnitario: 0 }],
    },
  })

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: 'itens',
  })

  const { fields: boletoFields, append: appendBoleto, remove: removeBoleto } = useFieldArray({
    control,
    name: 'boletos',
  })

  const temBoleto = watch('temBoleto')
  const itensValues = watch('itens')

  useEffect(() => {
    Promise.all([
      ingredientesService.listar(),
      utensiliosService.listar(),
      fornecedoresService.listar(),
    ])
      .then(([ings, utes, forns]) => {
        setIngredientes(ings)
        setUtensilios(utes)
        setFornecedores(forns.filter(f => f.ativo))
      })
      .catch(() => setToast({ tipo: 'erro', mensagem: 'Erro ao carregar dados do formulário.' }))
      .finally(() => setCarregando(false))
  }, [])

  const handleToggleBoleto = (checked: boolean) => {
    setValue('temBoleto', checked)
    if (checked && boletoFields.length === 0) {
      appendBoleto({ dataVencimento: '' })
    }
    if (!checked) {
      for (let i = boletoFields.length - 1; i >= 0; i--) removeBoleto(i)
    }
  }

  const handleTipoChange = (index: number, tipo: 'ingrediente' | 'utensilio') => {
    setValue(`itens.${index}.tipo`, tipo)
    setValue(`itens.${index}.itemId`, '')
  }

  const onSubmit = async (data: FormValues) => {
    setSalvando(true)
    try {
      const itensIngrediente = data.itens
        .filter(i => i.tipo === 'ingrediente')
        .map(i => ({ ingredienteId: i.itemId, quantidade: i.quantidade, custoUnitario: i.custoUnitario }))
      const itensUtensilio = data.itens
        .filter(i => i.tipo === 'utensilio')
        .map(i => ({ utensilioId: i.itemId, quantidade: i.quantidade, custoUnitario: i.custoUnitario }))

      await entradasService.registrar({
        fornecedorId: data.fornecedorId,
        dataEntrada: data.dataEntrada,
        numeroNotaFiscal: data.numeroNotaFiscal || undefined,
        recebidoPor: data.recebidoPor,
        observacoes: data.observacoes || undefined,
        datasVencimentoBoleto: data.temBoleto ? data.boletos.map(b => b.dataVencimento) : undefined,
        itens: itensIngrediente,
        itensUtensilio,
      })

      setToast({ tipo: 'sucesso', mensagem: 'Entrada registrada com sucesso.' })
      navigate('/entradas')
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao registrar entrada.' })
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="ada-page">
        <LoadingState mensagem="Carregando formulário…" />
      </div>
    )
  }

  return (
    <div className="ada-page max-w-3xl">
      <button onClick={() => navigate('/entradas')} className="back-link">
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        Entradas
      </button>

      <h1
        className="text-xl font-bold tracking-tight mb-6"
        style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        Nova Entrada de Mercadoria
      </h1>

      <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-5">
        <div className="ada-surface-card p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectCampo
              label="Fornecedor"
              {...register('fornecedorId')}
              erro={errors.fornecedorId?.message}
            >
              <option value="">Selecione…</option>
              {fornecedores.map(f => (
                <option key={f.id} value={f.id}>{f.razaoSocial}</option>
              ))}
            </SelectCampo>

            <CampoTexto
              label="Data de Entrada"
              type="date"
              {...register('dataEntrada')}
              erro={errors.dataEntrada?.message}
            />

            <CampoTexto
              label="Número da Nota Fiscal"
              {...register('numeroNotaFiscal')}
              erro={errors.numeroNotaFiscal?.message}
            />

            <CampoTexto
              label="Recebido Por"
              {...register('recebidoPor')}
              erro={errors.recebidoPor?.message}
            />
          </div>

          <CampoTexto
            label="Observações"
            {...register('observacoes')}
            erro={errors.observacoes?.message}
          />
        </div>

        <div className="ada-surface-card p-5 flex flex-col gap-4">
          <label className="flex items-center gap-2.5 text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
            <input
              type="checkbox"
              checked={temBoleto}
              onChange={e => handleToggleBoleto(e.target.checked)}
              className="h-4 w-4"
            />
            Pagamento via boleto
          </label>

          {temBoleto && (
            <div className="flex flex-col gap-3">
              {boletoFields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-3">
                  <div className="flex-1">
                    <CampoTexto
                      label={`Vencimento do boleto ${index + 1}`}
                      type="date"
                      {...register(`boletos.${index}.dataVencimento`)}
                      erro={errors.boletos?.[index]?.dataVencimento?.message}
                    />
                  </div>
                  {boletoFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBoleto(index)}
                      className="p-2.5 rounded-lg transition-colors duration-150"
                      style={{ color: 'var(--ada-error-text)' }}
                      aria-label="Remover boleto"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}

              {errors.boletos?.message && (
                <p className="text-xs" style={{ color: 'var(--ada-error-text)' }}>{errors.boletos.message}</p>
              )}

              <button
                type="button"
                onClick={() => appendBoleto({ dataVencimento: '' })}
                className="flex items-center gap-1.5 text-sm font-semibold self-start"
                style={{ color: 'var(--ada-accent)' }}
              >
                <PlusIcon className="h-4 w-4" />
                Adicionar outro boleto
              </button>
            </div>
          )}
        </div>

        <div className="ada-surface-card p-5 flex flex-col gap-4">
          <h2 className="text-sm font-bold" style={{ color: 'var(--ada-heading)' }}>Itens</h2>

          {itemFields.map((field, index) => {
            const tipo = itensValues[index]?.tipo ?? 'ingrediente'
            const opcoes = tipo === 'ingrediente' ? ingredientes : utensilios

            return (
              <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_1fr_1fr_auto] gap-3 items-end">
                <SelectCampo
                  label="Tipo"
                  value={tipo}
                  onChange={e => handleTipoChange(index, e.target.value as 'ingrediente' | 'utensilio')}
                >
                  <option value="ingrediente">Ingrediente</option>
                  <option value="utensilio">Utensílio</option>
                </SelectCampo>

                <SelectCampo
                  label="Item"
                  {...register(`itens.${index}.itemId`)}
                  erro={errors.itens?.[index]?.itemId?.message}
                >
                  <option value="">Selecione…</option>
                  {opcoes.map(o => (
                    <option key={o.id} value={o.id}>{o.nome}</option>
                  ))}
                </SelectCampo>

                <CampoTexto
                  label="Quantidade"
                  type="number"
                  step="0.001"
                  {...register(`itens.${index}.quantidade`)}
                  erro={errors.itens?.[index]?.quantidade?.message}
                />

                <CampoTexto
                  label="Custo Unitário"
                  type="number"
                  step="0.01"
                  {...register(`itens.${index}.custoUnitario`)}
                  erro={errors.itens?.[index]?.custoUnitario?.message}
                />

                {itemFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2.5 rounded-lg transition-colors duration-150"
                    style={{ color: 'var(--ada-error-text)' }}
                    aria-label="Remover item"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })}

          {errors.itens?.message && (
            <p className="text-xs" style={{ color: 'var(--ada-error-text)' }}>{errors.itens.message}</p>
          )}

          <button
            type="button"
            onClick={() => appendItem({ tipo: 'ingrediente', itemId: '', quantidade: 0, custoUnitario: 0 })}
            className="flex items-center gap-1.5 text-sm font-semibold self-start"
            style={{ color: 'var(--ada-accent)' }}
          >
            <PlusIcon className="h-4 w-4" />
            Adicionar item
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/entradas')} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? 'Salvando…' : 'Registrar Entrada'}
          </button>
        </div>
      </form>

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
```

**Nota ao implementador:** confira os imports exatos de `ingredientesService`/`utensiliosService`/`fornecedoresService` e dos tipos `Ingrediente`/`Utensilio`/`Fornecedor` contra o arquivo atual antes de substituir — eles devem ser preservados idênticos ao que já existe hoje (este plano reescreve apenas a lógica de boleto; os demais imports/campos do formulário de itens são os já existentes no arquivo, reproduzidos aqui). Se o arquivo atual usar nomes de import diferentes dos mostrados acima, mantenha os nomes reais do arquivo atual.

- [ ] **Step 2: Checagem de tipos**

Run (dentro de `frontend/`): `npx tsc --noEmit`
Expected: 0 erros em `EntradaFormPage.tsx`. Pode restar erros em `EntradasPage.tsx`/`EntradaDetalhePage.tsx` (Task 7).

- [ ] **Step 3: Testar manualmente no navegador**

Run: `npm run dev` (dentro de `frontend/`), abrir `/entradas/nova`.
- Marcar "Pagamento via boleto" → deve aparecer 1 campo de data com botão "Adicionar outro boleto".
- Clicar "Adicionar outro boleto" 2x → deve haver 3 campos de data, cada um com botão de remover (exceto quando só resta 1).
- Desmarcar o checkbox → todos os campos de boleto devem desaparecer.
- Preencher um fornecedor, 1 item, 2 boletos com datas futuras diferentes, e enviar → deve registrar com sucesso e redirecionar para `/entradas`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/entradas/pages/EntradaFormPage.tsx
git commit -m "feat(entradas): formulario de entrada permite multiplos boletos

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7 — Frontend: badge com contador na listagem e lista de boletos no detalhe

**Files:**
- Modify: `frontend/src/features/entradas/pages/EntradasPage.tsx`
- Modify: `frontend/src/features/entradas/pages/EntradaDetalhePage.tsx`

**Interfaces:**
- Consumes: `EntradaMercadoriaResumo.proximoVencimentoBoleto`/`.totalBoletos` e `EntradaMercadoria.boletos: Boleto[]` (Task 5).

- [ ] **Step 1: Editar `EntradasPage.tsx` — `BadgeBoleto`**

Localizar a função `BadgeBoleto({ dataVencimento }: { dataVencimento: string | null })` (ou assinatura equivalente no arquivo atual) e substituí-la por:

```tsx
function BadgeBoleto({ proximoVencimento, totalBoletos }: { proximoVencimento: string | null; totalBoletos: number }) {
  if (!proximoVencimento || totalBoletos === 0) return null

  const dias = diasParaVencer(proximoVencimento)
  const dataFormatada = new Date(proximoVencimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const contador = totalBoletos > 1 ? ` · +${totalBoletos - 1}` : ''

  let variante: 'critico' | 'alerta' | 'atencao' | 'neutro' = 'neutro'
  if (dias < 0) variante = 'critico'
  else if (dias <= 3) variante = 'critico'
  else if (dias <= 7) variante = 'alerta'

  return <StatusBadge variante={variante} label={`${dataFormatada}${contador}`} />
}
```

**Nota ao implementador:** preserve a lógica de cores/variantes (`critico`/`alerta`/`atencao`/`neutro`) e a função `diasParaVencer()` exatamente como já existem no arquivo — só o parâmetro de entrada e o texto do label mudam. Confira os nomes de variante reais usados pelo `StatusBadge` no arquivo atual antes de aplicar, caso difiram do mostrado aqui.

- [ ] **Step 2: Editar `EntradasPage.tsx` — `boletosVencendo`**

Localizar o `useMemo` que filtra `boletosVencendo` (algo como `e.temBoleto && e.dataVencimentoBoleto && e.status === 'Confirmada' && diasParaVencer(e.dataVencimentoBoleto) <= 3`) e substituir a condição por:

```tsx
e.proximoVencimentoBoleto && e.status === 'Confirmada' && diasParaVencer(e.proximoVencimentoBoleto) <= 3
```

- [ ] **Step 3: Editar `EntradasPage.tsx` — célula da tabela**

Localizar a célula que renderiza `<BadgeBoleto dataVencimento={e.temBoleto ? e.dataVencimentoBoleto : null} />` (ou equivalente) e substituir por:

```tsx
<BadgeBoleto proximoVencimento={e.proximoVencimentoBoleto} totalBoletos={e.totalBoletos} />
```

- [ ] **Step 4: Checagem de tipos**

Run (dentro de `frontend/`): `npx tsc --noEmit`
Expected: 0 erros em `EntradasPage.tsx`. Pode restar erros em `EntradaDetalhePage.tsx` (próximo passo).

- [ ] **Step 5: Editar `EntradaDetalhePage.tsx` — bloco de boleto**

Localizar o bloco (linhas ~140-154 no arquivo atual):
```tsx
      {entrada.temBoleto && (
        <div
          className="rounded-xl px-4 py-3 text-sm mb-4"
          style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-border)' }}
        >
          <p>
            <span className="font-semibold" style={{ color: 'var(--ada-muted)' }}>Boleto: </span>
            <span style={{ color: 'var(--ada-body)' }}>
              {entrada.dataVencimentoBoleto
                ? `Vencimento: ${new Date(entrada.dataVencimentoBoleto).toLocaleDateString('pt-BR')}`
                : 'Sim (sem data de vencimento)'}
            </span>
          </p>
        </div>
      )}
```

Substituir por:
```tsx
      {entrada.boletos.length > 0 && (
        <div
          className="rounded-xl px-4 py-3 text-sm mb-4"
          style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-border)' }}
        >
          <p className="font-semibold mb-1.5" style={{ color: 'var(--ada-muted)' }}>
            {entrada.boletos.length > 1 ? `Boletos (${entrada.boletos.length})` : 'Boleto'}
          </p>
          <ul className="flex flex-col gap-1">
            {entrada.boletos.map(boleto => (
              <li key={boleto.id} style={{ color: 'var(--ada-body)' }}>
                Vencimento: {new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}
              </li>
            ))}
          </ul>
        </div>
      )}
```

- [ ] **Step 6: Checagem de tipos completa**

Run (dentro de `frontend/`): `npx tsc --noEmit`
Expected: 0 erros em todo o projeto.

- [ ] **Step 7: Testar manualmente no navegador**

Run: `npm run dev` (dentro de `frontend/`).
- Em `/entradas`, confirmar que uma entrada com 1 boleto mostra o badge sem contador (ex: "15/06"), e uma com múltiplos mostra "15/06 · +2".
- Confirmar que o banner de "boletos vencendo" continua aparecendo para entradas cujo próximo vencimento está a ≤3 dias.
- Abrir o detalhe de uma entrada com múltiplos boletos → confirmar que a lista completa aparece, uma data por linha.
- Abrir o detalhe de uma entrada sem boleto → confirmar que o bloco de boleto não aparece.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/features/entradas/pages/EntradasPage.tsx frontend/src/features/entradas/pages/EntradaDetalhePage.tsx
git commit -m "feat(entradas): listagem e detalhe exibem multiplos boletos

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8 — Verificação final e handoff

**Files:** nenhum arquivo novo — apenas verificação de ponta a ponta.

**Interfaces:** nenhuma — valida a integração de todas as tasks anteriores.

- [ ] **Step 1: Build completo do backend**

Run (dentro de `CasaDiAna/`): `dotnet build src/CasaDiAna.API`
Expected: Build succeeded, 0 erros, 0 warnings novos.

- [ ] **Step 2: Suíte de testes completa do backend**

Run (dentro de `CasaDiAna/`): `dotnet test`
Expected: PASS — 100% dos testes, incluindo os novos de `EntradaMercadoriaBoletoTests`, `RegistrarEntradaCommandHandlerTests`, `RegistrarEntradaValidatorBoletoTests`, e nenhuma regressão em `CancelarEntradaCommandHandlerTests`, `ObterEntradaQueryHandlerTests`, `ListarEntradasQueryHandlerTests`.

- [ ] **Step 3: Checagem de tipos do frontend**

Run (dentro de `CasaDiAna/frontend`): `npx tsc --noEmit`
Expected: 0 erros em todo o projeto.

- [ ] **Step 4: Build do frontend**

Run (dentro de `CasaDiAna/frontend`): `npm run build`
Expected: build succeeded, sem erros.

- [ ] **Step 5: Teste manual de ponta a ponta**

Run: `dotnet run --project src/CasaDiAna.API` (backend) e `npm run dev` (frontend), dentro de `CasaDiAna/`.

- Criar uma nova entrada com boleto marcado e 3 datas de vencimento diferentes → confirmar sucesso.
- Verificar na listagem (`/entradas`) que o badge mostra a data mais próxima + "· +2".
- Abrir o detalhe dessa entrada → confirmar que as 3 datas aparecem, cada uma em sua linha, ordenadas da mais próxima para a mais distante.
- Criar uma entrada sem boleto → confirmar que nenhum badge aparece na listagem e nenhum bloco de boleto aparece no detalhe.
- Cancelar uma entrada com boleto → confirmar que o cancelamento funciona normalmente (sem relação com boletos) e que o status muda para "Cancelada".

- [ ] **Step 6: Handoff**

Reportar ao usuário: build e testes passando (backend + frontend), fluxo manual validado, pronto para a decisão de integração via `superpowers:finishing-a-development-branch` (merge local para `master` / PR / manter como está) — sem push automático, conforme preferência já estabelecida de que o push final para `master` é feito depois da confirmação do usuário na etapa de finalização do branch.