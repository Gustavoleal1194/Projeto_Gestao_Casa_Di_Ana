# Cadastro de Utensílios + Entrada Mista na Nota — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o cadastro de Utensílios (produtos de limpeza, embalagens etc.), com categoria própria, e permitir lançá-los na mesma nota de Entrada de Mercadoria junto com ingredientes.

**Architecture:** `Utensilio`, `CategoriaUtensilio`, `MovimentacaoUtensilio` e `ItemEntradaUtensilio` são entidades novas, paralelas a `Ingrediente`/`CategoriaIngrediente`/`Movimentacao`/`ItemEntradaMercadoria` — mesmo padrão (uma entidade por domínio, sem FK polimórfica), sem alterar nenhuma delas. `EntradaMercadoria` ganha uma segunda coleção (`ItensUtensilio`) ao lado da existente (`Itens`), e `RegistrarEntradaCommand` ganha um campo opcional aditivo. Frontend: módulo novo `features/estoque/utensilios/` espelhando `features/estoque/ingredientes/`, mais ajuste no formulário de Entrada para escolher o tipo por linha.

**Tech Stack:** ASP.NET Core 8, EF Core 8 (PostgreSQL), MediatR, FluentValidation, xUnit + Moq + FluentAssertions · React 19, TypeScript, React Hook Form + Zod.

**Spec:** `CasaDiAna/docs/superpowers/specs/2026-10-06-utensilios-design.md`

## Global Constraints

- Idioma: todo texto de UI, mensagem de erro, nome de domínio e commit em português do Brasil.
- Backend: build sempre por `dotnet build src/CasaDiAna.API` (nunca na raiz da solução).
- Frontend: todo formulário usa `resolver: zodResolver(schema) as any` e `handleSubmit(fn as any)` **apenas quando `fn` é função nomeada com tipo explícito** — função inline não precisa do `as any` em `handleSubmit`.
- Campos numéricos de formulário: `z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number()...)`; `defaultValues` numéricos `undefined` (não `''`); payload usa `values.campo!`.
- Enums da API são serializados como string camelCase (`JsonStringEnumConverter` global) — DTOs que expõem enum devem ser tratados como string no frontend.
- Nenhuma mudança em `Ingrediente`, `CategoriaIngrediente`, `Movimentacao`, `ItemEntradaMercadoria` nem nos módulos de Inventário/Correção de Estoque/Notificação de Estoque (fora de escopo — exclusivos de ingrediente nesta entrega).
- Cada task backend termina com `dotnet build src/CasaDiAna.API` e a suíte de testes relevante passando; cada task frontend com `npx tsc --noEmit` limpo.

---

## Task 1 — Domain: entidades de Utensílio

**Files:**
- Create: `src/CasaDiAna.Domain/Entities/CategoriaUtensilio.cs`
- Create: `src/CasaDiAna.Domain/Entities/Utensilio.cs`
- Create: `src/CasaDiAna.Domain/Entities/MovimentacaoUtensilio.cs`
- Create: `src/CasaDiAna.Domain/Entities/ItemEntradaUtensilio.cs`
- Modify: `src/CasaDiAna.Domain/Entities/EntradaMercadoria.cs`
- Test: `tests/CasaDiAna.Application.Tests/Utensilios/CategoriaUtensilioTests.cs`
- Test: `tests/CasaDiAna.Application.Tests/Utensilios/UtensilioTests.cs`
- Test: `tests/CasaDiAna.Application.Tests/Entradas/EntradaMercadoriaItemUtensilioTests.cs`

**Interfaces:**
- Produces: `Utensilio.Criar(nome, unidadeMedidaId, estoqueMinimo, criadoPor, codigoInterno?, categoriaUtensilioId?, estoqueMaximo?)`, `.Atualizar(...)`, `.Desativar(atualizadoPor)`, `.AtualizarEstoque(novoSaldo, atualizadoPor)`, `.AtualizarCusto(custoUnitario, atualizadoPor)`, `.EstaBaixoDoMinimo()`. Propriedades: `Id, Nome, CodigoInterno, CategoriaUtensilioId, UnidadeMedidaId, EstoqueAtual, EstoqueMinimo, EstoqueMaximo, CustoUnitario, Ativo, CriadoEm, AtualizadoEm, CriadoPor, AtualizadoPor, UnidadeMedida, Categoria`.
- Produces: `CategoriaUtensilio.Criar(nome, criadoPor)`, `.Atualizar(nome, atualizadoPor)`, `.Desativar(atualizadoPor)`. Propriedades: `Id, Nome, Ativo, CriadoEm, AtualizadoEm, CriadoPor, AtualizadoPor`.
- Produces: `MovimentacaoUtensilio.Criar(utensilioId, tipo, quantidade, saldoApos, criadoPor, referenciaTipo?, referenciaId?, observacoes?)`. Propriedades: `Id, UtensilioId, Tipo, Quantidade, SaldoApos, ReferenciaTipo, ReferenciaId, Observacoes, CriadoEm, CriadoPor, Utensilio`.
- Produces: `ItemEntradaUtensilio` (criado internamente só por `EntradaMercadoria.AdicionarItemUtensilio`). Propriedades: `Id, EntradaId, UtensilioId, Quantidade, CustoUnitario, CustoTotal, Utensilio`.
- Produces: `EntradaMercadoria.ItensUtensilio` (coleção) e `.AdicionarItemUtensilio(utensilioId, quantidade, custoUnitario)`.
- Consumes: `CasaDiAna.Domain.Exceptions.DomainException`, `CasaDiAna.Domain.Enums.TipoMovimentacao` (já existentes).

- [ ] **Step 1: Escrever os testes que falham**

Criar `tests/CasaDiAna.Application.Tests/Utensilios/CategoriaUtensilioTests.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Utensilios;

public class CategoriaUtensilioTests
{
    [Fact]
    public void Criar_DeveDefinirCampos()
    {
        var c = CategoriaUtensilio.Criar("Limpeza", Guid.NewGuid());

        c.Nome.Should().Be("Limpeza");
        c.Ativo.Should().BeTrue();
    }

    [Fact]
    public void Atualizar_EDesativar_DeveFuncionar()
    {
        var c = CategoriaUtensilio.Criar("Limpeza", Guid.NewGuid());
        c.Atualizar("Embalagens", Guid.NewGuid());

        c.Nome.Should().Be("Embalagens");

        c.Desativar(Guid.NewGuid());
        c.Ativo.Should().BeFalse();
    }
}
```

Criar `tests/CasaDiAna.Application.Tests/Utensilios/UtensilioTests.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Utensilios;

public class UtensilioTests
{
    [Fact]
    public void Criar_DeveDefinirCampos()
    {
        var criadoPor = Guid.NewGuid();
        var u = Utensilio.Criar("Detergente Neutro", unidadeMedidaId: 1, estoqueMinimo: 2m, criadoPor: criadoPor, codigoInterno: "DET-001");

        u.Nome.Should().Be("Detergente Neutro");
        u.CodigoInterno.Should().Be("DET-001");
        u.EstoqueMinimo.Should().Be(2m);
        u.EstoqueAtual.Should().Be(0m);
        u.Ativo.Should().BeTrue();
    }

    [Fact]
    public void Criar_DeveLancarExcecao_QuandoEstoqueMinimoNegativo()
    {
        var acao = () => Utensilio.Criar("Detergente", 1, -1m, Guid.NewGuid());

        acao.Should().Throw<DomainException>().WithMessage("*negativo*");
    }

    [Fact]
    public void Criar_DeveLancarExcecao_QuandoEstoqueMaximoMenorQueMinimo()
    {
        var acao = () => Utensilio.Criar("Detergente", 1, 10m, Guid.NewGuid(), estoqueMaximo: 5m);

        acao.Should().Throw<DomainException>().WithMessage("*mínimo*");
    }

    [Fact]
    public void AtualizarEstoque_DeveClamparEmZero_QuandoSaldoNegativo()
    {
        var u = Utensilio.Criar("Detergente", 1, 0m, Guid.NewGuid());
        u.AtualizarEstoque(-5m, Guid.NewGuid());

        u.EstoqueAtual.Should().Be(0m);
    }

    [Fact]
    public void AtualizarEstoque_DeveSomarQuantidade()
    {
        var u = Utensilio.Criar("Detergente", 1, 0m, Guid.NewGuid());
        u.AtualizarEstoque(10m, Guid.NewGuid());

        u.EstoqueAtual.Should().Be(10m);
    }

    [Fact]
    public void EstaBaixoDoMinimo_DeveRetornarTrue_QuandoEstoqueMenorQueMinimo()
    {
        var u = Utensilio.Criar("Detergente", 1, 10m, Guid.NewGuid());
        u.AtualizarEstoque(5m, Guid.NewGuid());

        u.EstaBaixoDoMinimo().Should().BeTrue();
    }

    [Fact]
    public void AtualizarCusto_DeveLancarExcecao_QuandoNegativo()
    {
        var u = Utensilio.Criar("Detergente", 1, 0m, Guid.NewGuid());
        var acao = () => u.AtualizarCusto(-1m, Guid.NewGuid());

        acao.Should().Throw<DomainException>().WithMessage("*negativo*");
    }

    [Fact]
    public void Desativar_DeveMarcarInativo()
    {
        var u = Utensilio.Criar("Detergente", 1, 0m, Guid.NewGuid());
        u.Desativar(Guid.NewGuid());

        u.Ativo.Should().BeFalse();
    }
}
```

Criar `tests/CasaDiAna.Application.Tests/Entradas/EntradaMercadoriaItemUtensilioTests.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Entradas;

public class EntradaMercadoriaItemUtensilioTests
{
    [Fact]
    public void AdicionarItemUtensilio_DeveAdicionar_QuandoDadosValidos()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        var utensilioId = Guid.NewGuid();

        entrada.AdicionarItemUtensilio(utensilioId, 3m, 12.50m);

        entrada.ItensUtensilio.Should().HaveCount(1);
        entrada.ItensUtensilio.First().UtensilioId.Should().Be(utensilioId);
        entrada.ItensUtensilio.First().CustoTotal.Should().Be(37.50m);
    }

    [Fact]
    public void AdicionarItemUtensilio_DeveLancarExcecao_QuandoQuantidadeZeroOuNegativa()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());

        var acao = () => entrada.AdicionarItemUtensilio(Guid.NewGuid(), 0m, 5m);

        acao.Should().Throw<DomainException>().WithMessage("*Quantidade*");
    }

    [Fact]
    public void AdicionarItemUtensilio_DeveLancarExcecao_QuandoUtensilioDuplicado()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        var utensilioId = Guid.NewGuid();
        entrada.AdicionarItemUtensilio(utensilioId, 1m, 5m);

        var acao = () => entrada.AdicionarItemUtensilio(utensilioId, 2m, 5m);

        acao.Should().Throw<DomainException>().WithMessage("*já adicionado*");
    }

    [Fact]
    public void AdicionarItemUtensilio_DeveLancarExcecao_QuandoEntradaCancelada()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        entrada.Cancelar(Guid.NewGuid());

        var acao = () => entrada.AdicionarItemUtensilio(Guid.NewGuid(), 1m, 5m);

        acao.Should().Throw<DomainException>().WithMessage("*cancelada*");
    }

    [Fact]
    public void Itens_EItensUtensilio_PodemCoexistirNaMesmaEntrada()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        entrada.AdicionarItem(Guid.NewGuid(), 2m, 3m);
        entrada.AdicionarItemUtensilio(Guid.NewGuid(), 1m, 10m);

        entrada.Itens.Should().HaveCount(1);
        entrada.ItensUtensilio.Should().HaveCount(1);
    }
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~Utensilio"`
Expected: FAIL (compilação falha — `Utensilio`, `CategoriaUtensilio`, `MovimentacaoUtensilio`, `AdicionarItemUtensilio` não existem ainda).

- [ ] **Step 3: Criar `CategoriaUtensilio.cs`**

```csharp
namespace CasaDiAna.Domain.Entities;

public class CategoriaUtensilio
{
    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    private CategoriaUtensilio() { }

    public static CategoriaUtensilio Criar(string nome, Guid criadoPor)
    {
        return new CategoriaUtensilio
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

    public void Atualizar(string nome, Guid atualizadoPor)
    {
        Nome = nome;
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

- [ ] **Step 4: Criar `Utensilio.cs`**

```csharp
using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class Utensilio
{
    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string? CodigoInterno { get; private set; }
    public Guid? CategoriaUtensilioId { get; private set; }
    public short UnidadeMedidaId { get; private set; }
    public decimal EstoqueAtual { get; private set; }
    public decimal EstoqueMinimo { get; private set; }
    public decimal? EstoqueMaximo { get; private set; }
    public decimal? CustoUnitario { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    public UnidadeMedida? UnidadeMedida { get; private set; }
    public CategoriaUtensilio? Categoria { get; private set; }

    private Utensilio() { }

    public static Utensilio Criar(
        string nome,
        short unidadeMedidaId,
        decimal estoqueMinimo,
        Guid criadoPor,
        string? codigoInterno = null,
        Guid? categoriaUtensilioId = null,
        decimal? estoqueMaximo = null)
    {
        if (estoqueMinimo < 0)
            throw new DomainException("Estoque mínimo não pode ser negativo.");
        if (estoqueMaximo.HasValue && estoqueMaximo < estoqueMinimo)
            throw new DomainException("Estoque máximo não pode ser menor que o mínimo.");

        return new Utensilio
        {
            Id = Guid.NewGuid(),
            Nome = nome,
            CodigoInterno = codigoInterno,
            CategoriaUtensilioId = categoriaUtensilioId,
            UnidadeMedidaId = unidadeMedidaId,
            EstoqueAtual = 0,
            EstoqueMinimo = estoqueMinimo,
            EstoqueMaximo = estoqueMaximo,
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
        Guid? categoriaUtensilioId = null,
        decimal? estoqueMaximo = null)
    {
        if (estoqueMinimo < 0)
            throw new DomainException("Estoque mínimo não pode ser negativo.");
        if (estoqueMaximo.HasValue && estoqueMaximo < estoqueMinimo)
            throw new DomainException("Estoque máximo não pode ser menor que o mínimo.");

        Nome = nome;
        CodigoInterno = codigoInterno;
        CategoriaUtensilioId = categoriaUtensilioId;
        UnidadeMedidaId = unidadeMedidaId;
        EstoqueMinimo = estoqueMinimo;
        EstoqueMaximo = estoqueMaximo;
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
        EstoqueAtual = Math.Max(0, novoSaldo);
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public void AtualizarCusto(decimal? custoUnitario, Guid atualizadoPor)
    {
        if (custoUnitario.HasValue && custoUnitario < 0)
            throw new DomainException("Custo unitário não pode ser negativo.");
        CustoUnitario = custoUnitario;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public bool EstaBaixoDoMinimo() => EstoqueAtual < EstoqueMinimo;
}
```

- [ ] **Step 5: Criar `MovimentacaoUtensilio.cs`**

```csharp
using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Domain.Entities;

public class MovimentacaoUtensilio
{
    public Guid Id { get; private set; }
    public Guid UtensilioId { get; private set; }
    public TipoMovimentacao Tipo { get; private set; }
    public decimal Quantidade { get; private set; }
    public decimal SaldoApos { get; private set; }
    public string? ReferenciaTipo { get; private set; }
    public Guid? ReferenciaId { get; private set; }
    public string? Observacoes { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }

    public Utensilio? Utensilio { get; private set; }

    private MovimentacaoUtensilio() { }

    public static MovimentacaoUtensilio Criar(
        Guid utensilioId,
        TipoMovimentacao tipo,
        decimal quantidade,
        decimal saldoApos,
        Guid criadoPor,
        string? referenciaTipo = null,
        Guid? referenciaId = null,
        string? observacoes = null)
    {
        return new MovimentacaoUtensilio
        {
            Id = Guid.NewGuid(),
            UtensilioId = utensilioId,
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

- [ ] **Step 6: Criar `ItemEntradaUtensilio.cs`**

```csharp
namespace CasaDiAna.Domain.Entities;

public class ItemEntradaUtensilio
{
    public Guid Id { get; private set; }
    public Guid EntradaId { get; private set; }
    public Guid UtensilioId { get; private set; }
    public decimal Quantidade { get; private set; }
    public decimal CustoUnitario { get; private set; }
    public decimal CustoTotal => Quantidade * CustoUnitario;

    public Utensilio? Utensilio { get; private set; }

    private ItemEntradaUtensilio() { }

    internal static ItemEntradaUtensilio Criar(
        Guid entradaId,
        Guid utensilioId,
        decimal quantidade,
        decimal custoUnitario)
    {
        return new ItemEntradaUtensilio
        {
            Id = Guid.NewGuid(),
            EntradaId = entradaId,
            UtensilioId = utensilioId,
            Quantidade = quantidade,
            CustoUnitario = custoUnitario
        };
    }
}
```

- [ ] **Step 7: Modificar `EntradaMercadoria.cs`**

Abaixo da linha `private readonly List<ItemEntradaMercadoria> _itens = new();`, adicionar:

```csharp
    public IReadOnlyCollection<ItemEntradaUtensilio> ItensUtensilio => _itensUtensilio.AsReadOnly();
    private readonly List<ItemEntradaUtensilio> _itensUtensilio = new();
```

Depois do método `AdicionarItem(...)` existente, adicionar:

```csharp
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
```

- [ ] **Step 8: Rodar e ver passar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~Utensilio"`
Expected: PASS (todos os testes dos Steps 1 e 7).

- [ ] **Step 9: Commit**

```bash
git add src/CasaDiAna.Domain/Entities/CategoriaUtensilio.cs src/CasaDiAna.Domain/Entities/Utensilio.cs src/CasaDiAna.Domain/Entities/MovimentacaoUtensilio.cs src/CasaDiAna.Domain/Entities/ItemEntradaUtensilio.cs src/CasaDiAna.Domain/Entities/EntradaMercadoria.cs tests/CasaDiAna.Application.Tests/Utensilios/ tests/CasaDiAna.Application.Tests/Entradas/EntradaMercadoriaItemUtensilioTests.cs
git commit -m "feat(utensilios): entidades de dominio (Utensilio, CategoriaUtensilio, MovimentacaoUtensilio, ItemEntradaUtensilio)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2 — Infraestrutura: repositórios, EF configs, DbSets, DI

**Files:**
- Create: `src/CasaDiAna.Domain/Interfaces/ICategoriaUtensilioRepository.cs`
- Create: `src/CasaDiAna.Domain/Interfaces/IUtensilioRepository.cs`
- Create: `src/CasaDiAna.Domain/Interfaces/IMovimentacaoUtensilioRepository.cs`
- Create: `src/CasaDiAna.Infrastructure/Repositories/CategoriaUtensilioRepository.cs`
- Create: `src/CasaDiAna.Infrastructure/Repositories/UtensilioRepository.cs`
- Create: `src/CasaDiAna.Infrastructure/Repositories/MovimentacaoUtensilioRepository.cs`
- Create: `src/CasaDiAna.Infrastructure/Persistence/Configurations/CategoriaUtensilioConfiguration.cs`
- Create: `src/CasaDiAna.Infrastructure/Persistence/Configurations/UtensilioConfiguration.cs`
- Create: `src/CasaDiAna.Infrastructure/Persistence/Configurations/MovimentacaoUtensilioConfiguration.cs`
- Create: `src/CasaDiAna.Infrastructure/Persistence/Configurations/ItemEntradaUtensilioConfiguration.cs`
- Modify: `src/CasaDiAna.Infrastructure/Persistence/Configurations/EntradaMercadoriaConfiguration.cs`
- Modify: `src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs`
- Modify: `src/CasaDiAna.Infrastructure/DependencyInjection.cs`
- Modify: `src/CasaDiAna.Infrastructure/Repositories/EntradaMercadoriaRepository.cs`

**Interfaces:**
- Consumes: entidades do Task 1.
- Produces: `ICategoriaUtensilioRepository`, `IUtensilioRepository`, `IMovimentacaoUtensilioRepository` (consumidos pela Application no Task 3–6). `EntradaMercadoriaRepository.ObterPorIdComItensAsync`/`ListarAsync` passam a carregar `ItensUtensilio`.

- [ ] **Step 1: Interfaces de repositório (Domain)**

Criar `src/CasaDiAna.Domain/Interfaces/ICategoriaUtensilioRepository.cs`:

```csharp
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface ICategoriaUtensilioRepository
{
    Task<CategoriaUtensilio?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<CategoriaUtensilio>> ListarAsync(bool apenasAtivos = true, CancellationToken ct = default);
    Task<bool> NomeExisteAsync(string nome, Guid? ignorarId = null, CancellationToken ct = default);
    Task AdicionarAsync(CategoriaUtensilio categoria, CancellationToken ct = default);
    void Atualizar(CategoriaUtensilio categoria);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

Criar `src/CasaDiAna.Domain/Interfaces/IUtensilioRepository.cs`:

```csharp
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IUtensilioRepository
{
    Task<Utensilio?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Utensilio>> ListarAsync(bool apenasAtivos = true, CancellationToken ct = default);
    Task<bool> CodigoInternoExisteAsync(string codigo, Guid? ignorarId = null, CancellationToken ct = default);
    Task AdicionarAsync(Utensilio utensilio, CancellationToken ct = default);
    void Atualizar(Utensilio utensilio);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

Criar `src/CasaDiAna.Domain/Interfaces/IMovimentacaoUtensilioRepository.cs`:

```csharp
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IMovimentacaoUtensilioRepository
{
    Task AdicionarAsync(MovimentacaoUtensilio movimentacao, CancellationToken ct = default);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

- [ ] **Step 2: Repositórios (Infrastructure)**

Criar `src/CasaDiAna.Infrastructure/Repositories/CategoriaUtensilioRepository.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class CategoriaUtensilioRepository : ICategoriaUtensilioRepository
{
    private readonly AppDbContext _db;

    public CategoriaUtensilioRepository(AppDbContext db) => _db = db;

    public Task<CategoriaUtensilio?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.CategoriasUtensilio.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<IReadOnlyList<CategoriaUtensilio>> ListarAsync(
        bool apenasAtivos = true, CancellationToken ct = default)
    {
        var query = _db.CategoriasUtensilio.AsQueryable();
        if (apenasAtivos)
            query = query.Where(c => c.Ativo);
        return await query.OrderBy(c => c.Nome).ToListAsync(ct);
    }

    public Task<bool> NomeExisteAsync(string nome, Guid? ignorarId = null, CancellationToken ct = default) =>
        _db.CategoriasUtensilio.AnyAsync(c =>
            c.Ativo && c.Nome == nome && (ignorarId == null || c.Id != ignorarId), ct);

    public async Task AdicionarAsync(CategoriaUtensilio categoria, CancellationToken ct = default) =>
        await _db.CategoriasUtensilio.AddAsync(categoria, ct);

    public void Atualizar(CategoriaUtensilio categoria) =>
        _db.CategoriasUtensilio.Update(categoria);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
```

Criar `src/CasaDiAna.Infrastructure/Repositories/UtensilioRepository.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class UtensilioRepository : IUtensilioRepository
{
    private readonly AppDbContext _db;

    public UtensilioRepository(AppDbContext db) => _db = db;

    public Task<Utensilio?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Utensilios
            .Include(u => u.UnidadeMedida)
            .Include(u => u.Categoria)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

    public async Task<IReadOnlyList<Utensilio>> ListarAsync(
        bool apenasAtivos = true, CancellationToken ct = default)
    {
        var query = _db.Utensilios
            .Include(u => u.UnidadeMedida)
            .Include(u => u.Categoria)
            .AsQueryable();

        if (apenasAtivos)
            query = query.Where(u => u.Ativo);

        return await query.OrderBy(u => u.Nome).ToListAsync(ct);
    }

    public Task<bool> CodigoInternoExisteAsync(
        string codigo, Guid? ignorarId = null, CancellationToken ct = default) =>
        _db.Utensilios.AnyAsync(u =>
            u.CodigoInterno == codigo &&
            (ignorarId == null || u.Id != ignorarId), ct);

    public async Task AdicionarAsync(Utensilio utensilio, CancellationToken ct = default) =>
        await _db.Utensilios.AddAsync(utensilio, ct);

    public void Atualizar(Utensilio utensilio) =>
        _db.Utensilios.Update(utensilio);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
```

Criar `src/CasaDiAna.Infrastructure/Repositories/MovimentacaoUtensilioRepository.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;

namespace CasaDiAna.Infrastructure.Repositories;

public class MovimentacaoUtensilioRepository : IMovimentacaoUtensilioRepository
{
    private readonly AppDbContext _db;

    public MovimentacaoUtensilioRepository(AppDbContext db) => _db = db;

    public async Task AdicionarAsync(MovimentacaoUtensilio movimentacao, CancellationToken ct = default) =>
        await _db.MovimentacoesUtensilio.AddAsync(movimentacao, ct);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
```

- [ ] **Step 3: EF Configurations**

Criar `src/CasaDiAna.Infrastructure/Persistence/Configurations/CategoriaUtensilioConfiguration.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class CategoriaUtensilioConfiguration : IEntityTypeConfiguration<CategoriaUtensilio>
{
    public void Configure(EntityTypeBuilder<CategoriaUtensilio> builder)
    {
        builder.ToTable("categorias_utensilio", "estoque");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.Nome).HasColumnName("nome").HasMaxLength(100).IsRequired();
        builder.HasIndex(c => c.Nome).IsUnique();
        builder.Property(c => c.Ativo).HasColumnName("ativo").IsRequired();
        builder.Property(c => c.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(c => c.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(c => c.CriadoPor).HasColumnName("criado_por").IsRequired();
        builder.Property(c => c.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();
    }
}
```

Criar `src/CasaDiAna.Infrastructure/Persistence/Configurations/UtensilioConfiguration.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class UtensilioConfiguration : IEntityTypeConfiguration<Utensilio>
{
    public void Configure(EntityTypeBuilder<Utensilio> builder)
    {
        builder.HasKey(u => u.Id);
        builder.ToTable("utensilios", "estoque", t =>
        {
            t.HasCheckConstraint("chk_utensilio_estoque_atual_nao_negativo", "estoque_atual >= 0");
            t.HasCheckConstraint("chk_utensilio_estoque_minimo_nao_negativo", "estoque_minimo >= 0");
        });

        builder.Property(u => u.Id).HasColumnName("id");
        builder.Property(u => u.Nome).HasColumnName("nome").HasMaxLength(150).IsRequired();
        builder.Property(u => u.CodigoInterno).HasColumnName("codigo_interno").HasMaxLength(30);
        builder.HasIndex(u => u.CodigoInterno).IsUnique()
            .HasFilter("codigo_interno IS NOT NULL");
        builder.Property(u => u.CategoriaUtensilioId).HasColumnName("categoria_utensilio_id");
        builder.Property(u => u.UnidadeMedidaId).HasColumnName("unidade_medida_id").IsRequired();
        builder.Property(u => u.EstoqueAtual).HasColumnName("estoque_atual").HasPrecision(15, 4).IsRequired();
        builder.Property(u => u.EstoqueMinimo).HasColumnName("estoque_minimo").HasPrecision(15, 4).IsRequired();
        builder.Property(u => u.EstoqueMaximo).HasColumnName("estoque_maximo").HasPrecision(15, 4);
        builder.Property(u => u.CustoUnitario).HasColumnName("custo_unitario").HasPrecision(15, 4);
        builder.Property(u => u.Ativo).HasColumnName("ativo").IsRequired();
        builder.Property(u => u.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(u => u.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(u => u.CriadoPor).HasColumnName("criado_por").IsRequired();
        builder.Property(u => u.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();

        builder.HasOne(u => u.UnidadeMedida)
            .WithMany()
            .HasForeignKey(u => u.UnidadeMedidaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(u => u.Categoria)
            .WithMany()
            .HasForeignKey(u => u.CategoriaUtensilioId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(u => new { u.CategoriaUtensilioId, u.Nome });
        builder.HasIndex(u => new { u.EstoqueAtual, u.EstoqueMinimo })
            .HasFilter("ativo = TRUE");
    }
}
```

Criar `src/CasaDiAna.Infrastructure/Persistence/Configurations/MovimentacaoUtensilioConfiguration.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class MovimentacaoUtensilioConfiguration : IEntityTypeConfiguration<MovimentacaoUtensilio>
{
    public void Configure(EntityTypeBuilder<MovimentacaoUtensilio> builder)
    {
        builder.HasKey(m => m.Id);
        builder.ToTable("movimentacoes_utensilio", "estoque", t =>
        {
            t.HasCheckConstraint("chk_mov_utensilio_quantidade_positiva", "quantidade > 0");
            t.HasCheckConstraint("chk_mov_utensilio_saldo_nao_negativo", "saldo_apos >= 0");
        });

        builder.Property(m => m.Id).HasColumnName("id");
        builder.Property(m => m.UtensilioId).HasColumnName("utensilio_id").IsRequired();
        builder.Property(m => m.Tipo)
            .HasColumnName("tipo")
            .HasConversion(t => t.ToString(), s => Enum.Parse<TipoMovimentacao>(s))
            .HasMaxLength(30)
            .IsRequired();
        builder.Property(m => m.Quantidade).HasColumnName("quantidade").HasPrecision(15, 4).IsRequired();
        builder.Property(m => m.SaldoApos).HasColumnName("saldo_apos").HasPrecision(15, 4).IsRequired();
        builder.Property(m => m.ReferenciaTipo).HasColumnName("referencia_tipo").HasMaxLength(50);
        builder.Property(m => m.ReferenciaId).HasColumnName("referencia_id");
        builder.Property(m => m.Observacoes).HasColumnName("observacoes");
        builder.Property(m => m.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(m => m.CriadoPor).HasColumnName("criado_por").IsRequired();

        builder.HasOne(m => m.Utensilio)
            .WithMany()
            .HasForeignKey(m => m.UtensilioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(m => m.UtensilioId);
        builder.HasIndex(m => m.CriadoEm);
        builder.HasIndex(m => new { m.ReferenciaTipo, m.ReferenciaId })
            .HasFilter("referencia_id IS NOT NULL");
    }
}
```

Criar `src/CasaDiAna.Infrastructure/Persistence/Configurations/ItemEntradaUtensilioConfiguration.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class ItemEntradaUtensilioConfiguration : IEntityTypeConfiguration<ItemEntradaUtensilio>
{
    public void Configure(EntityTypeBuilder<ItemEntradaUtensilio> builder)
    {
        builder.HasKey(i => i.Id);
        builder.ToTable("itens_entrada_utensilio", "estoque", t =>
        {
            t.HasCheckConstraint("chk_item_utensilio_quantidade_positiva", "quantidade > 0");
            t.HasCheckConstraint("chk_item_utensilio_custo_nao_negativo", "custo_unitario >= 0");
        });

        builder.Property(i => i.Id).HasColumnName("id");
        builder.Property(i => i.EntradaId).HasColumnName("entrada_id").IsRequired();
        builder.Property(i => i.UtensilioId).HasColumnName("utensilio_id").IsRequired();
        builder.Property(i => i.Quantidade).HasColumnName("quantidade").HasPrecision(15, 4).IsRequired();
        builder.Property(i => i.CustoUnitario).HasColumnName("custo_unitario").HasPrecision(15, 4).IsRequired();
        builder.Ignore(i => i.CustoTotal);

        builder.HasIndex(i => new { i.EntradaId, i.UtensilioId }).IsUnique();
        builder.HasIndex(i => i.UtensilioId);

        builder.HasOne(i => i.Utensilio)
            .WithMany()
            .HasForeignKey(i => i.UtensilioId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
```

- [ ] **Step 4: Modificar `EntradaMercadoriaConfiguration.cs`**

Depois do bloco `builder.Navigation(e => e.Itens).UsePropertyAccessMode(PropertyAccessMode.Field);` existente, adicionar:

```csharp
        builder.HasMany(e => e.ItensUtensilio)
            .WithOne()
            .HasForeignKey(i => i.EntradaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(e => e.ItensUtensilio)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
```

- [ ] **Step 5: Modificar `AppDbContext.cs`**

Depois da linha `public DbSet<ConfiguracaoPrecificacao> ConfiguracoesPrecificacao => Set<ConfiguracaoPrecificacao>();`, adicionar:

```csharp
    public DbSet<CategoriaUtensilio> CategoriasUtensilio => Set<CategoriaUtensilio>();
    public DbSet<Utensilio> Utensilios => Set<Utensilio>();
    public DbSet<MovimentacaoUtensilio> MovimentacoesUtensilio => Set<MovimentacaoUtensilio>();
    public DbSet<ItemEntradaUtensilio> ItensEntradaUtensilio => Set<ItemEntradaUtensilio>();
```

- [ ] **Step 6: Modificar `DependencyInjection.cs` (Infrastructure)**

Depois da linha `services.AddScoped<IMovimentacaoRepository, MovimentacaoRepository>();`, adicionar:

```csharp
        services.AddScoped<ICategoriaUtensilioRepository, CategoriaUtensilioRepository>();
        services.AddScoped<IUtensilioRepository, UtensilioRepository>();
        services.AddScoped<IMovimentacaoUtensilioRepository, MovimentacaoUtensilioRepository>();
```

- [ ] **Step 7: Modificar `EntradaMercadoriaRepository.cs`**

Substituir o método `ObterPorIdComItensAsync` por:

```csharp
    public Task<EntradaMercadoria?> ObterPorIdComItensAsync(Guid id, CancellationToken ct = default) =>
        _db.EntradasMercadoria
            .Include(e => e.Fornecedor)
            .Include(e => e.Itens)
                .ThenInclude(i => i.Ingrediente)
            .Include(e => e.ItensUtensilio)
                .ThenInclude(i => i.Utensilio)
                    .ThenInclude(u => u!.UnidadeMedida)
            .FirstOrDefaultAsync(e => e.Id == id, ct);
```

E no método `ListarAsync`, adicionar `.Include(e => e.ItensUtensilio)` ao lado do `.Include(e => e.Itens)` existente:

```csharp
    public async Task<IReadOnlyList<EntradaMercadoria>> ListarAsync(
        DateTime? de = null, DateTime? ate = null, CancellationToken ct = default)
    {
        var query = _db.EntradasMercadoria
            .Include(e => e.Fornecedor)
            .Include(e => e.Itens)
            .Include(e => e.ItensUtensilio)
            .AsQueryable();

        if (de.HasValue)
            query = query.Where(e => e.DataEntrada >= de.Value);
        if (ate.HasValue)
            query = query.Where(e => e.DataEntrada < ate.Value.Date.AddDays(1));

        return await query.OrderByDescending(e => e.DataEntrada).ToListAsync(ct);
    }
```

- [ ] **Step 8: Build**

Run: `dotnet build src/CasaDiAna.API`
Expected: Build succeeded, 0 erros.

- [ ] **Step 9: Commit**

```bash
git add src/CasaDiAna.Domain/Interfaces/ICategoriaUtensilioRepository.cs src/CasaDiAna.Domain/Interfaces/IUtensilioRepository.cs src/CasaDiAna.Domain/Interfaces/IMovimentacaoUtensilioRepository.cs src/CasaDiAna.Infrastructure/
git commit -m "feat(utensilios): repositorios, EF configs, DbSets e DI

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3 — Application: CRUD de `CategoriaUtensilio` + controller

**Files:**
- Create: `src/CasaDiAna.Application/CategoriasUtensilio/Dtos/CategoriaUtensilioDto.cs`
- Create: `src/CasaDiAna.Application/CategoriasUtensilio/Commands/CriarCategoriaUtensilio/CriarCategoriaUtensilioCommand.cs`
- Create: `src/CasaDiAna.Application/CategoriasUtensilio/Commands/CriarCategoriaUtensilio/CriarCategoriaUtensilioCommandHandler.cs`
- Create: `src/CasaDiAna.Application/CategoriasUtensilio/Commands/CriarCategoriaUtensilio/CriarCategoriaUtensilioCommandValidator.cs`
- Create: `src/CasaDiAna.Application/CategoriasUtensilio/Commands/AtualizarCategoriaUtensilio/AtualizarCategoriaUtensilioCommand.cs`
- Create: `src/CasaDiAna.Application/CategoriasUtensilio/Commands/AtualizarCategoriaUtensilio/AtualizarCategoriaUtensilioCommandHandler.cs`
- Create: `src/CasaDiAna.Application/CategoriasUtensilio/Commands/AtualizarCategoriaUtensilio/AtualizarCategoriaUtensilioCommandValidator.cs`
- Create: `src/CasaDiAna.Application/CategoriasUtensilio/Commands/DesativarCategoriaUtensilio/DesativarCategoriaUtensilioCommand.cs`
- Create: `src/CasaDiAna.Application/CategoriasUtensilio/Commands/DesativarCategoriaUtensilio/DesativarCategoriaUtensilioCommandHandler.cs`
- Create: `src/CasaDiAna.Application/CategoriasUtensilio/Queries/ListarCategoriasUtensilio/ListarCategoriasUtensilioQuery.cs`
- Create: `src/CasaDiAna.Application/CategoriasUtensilio/Queries/ListarCategoriasUtensilio/ListarCategoriasUtensilioQueryHandler.cs`
- Create: `src/CasaDiAna.API/Controllers/CategoriasUtensilioController.cs`
- Test: `tests/CasaDiAna.Application.Tests/CategoriasUtensilio/CriarCategoriaUtensilioCommandHandlerTests.cs`
- Test: `tests/CasaDiAna.Application.Tests/CategoriasUtensilio/AtualizarCategoriaUtensilioCommandHandlerTests.cs`

**Interfaces:**
- Consumes: `ICategoriaUtensilioRepository`, `ICurrentUserService` (Task 2 / já existente).
- Produces: `CategoriaUtensilioDto(Id, Nome, Ativo, CriadoEm, AtualizadoEm)`. Rota `api/categorias-utensilio` (GET, POST, PUT `{id}`, DELETE `{id}`).

- [ ] **Step 1: Escrever os testes que falham**

Criar `tests/CasaDiAna.Application.Tests/CategoriasUtensilio/CriarCategoriaUtensilioCommandHandlerTests.cs`:

```csharp
using CasaDiAna.Application.CategoriasUtensilio.Commands.CriarCategoriaUtensilio;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.CategoriasUtensilio;

public class CriarCategoriaUtensilioCommandHandlerTests
{
    private readonly Mock<ICategoriaUtensilioRepository> _repositorio = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly CriarCategoriaUtensilioCommandHandler _handler;

    public CriarCategoriaUtensilioCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _handler = new CriarCategoriaUtensilioCommandHandler(_repositorio.Object, _currentUser.Object);
    }

    [Fact]
    public async Task DeveCriarCategoria_QuandoNomeUnico()
    {
        _repositorio.Setup(r => r.NomeExisteAsync("Limpeza", null, default)).ReturnsAsync(false);
        _repositorio.Setup(r => r.AdicionarAsync(It.IsAny<Domain.Entities.CategoriaUtensilio>(), default)).Returns(Task.CompletedTask);
        _repositorio.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(new CriarCategoriaUtensilioCommand("Limpeza"), CancellationToken.None);

        resultado.Nome.Should().Be("Limpeza");
        resultado.Ativo.Should().BeTrue();
        _repositorio.Verify(r => r.AdicionarAsync(It.IsAny<Domain.Entities.CategoriaUtensilio>(), default), Times.Once);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoNomeJaExiste()
    {
        _repositorio.Setup(r => r.NomeExisteAsync("Limpeza", null, default)).ReturnsAsync(true);

        var acao = () => _handler.Handle(new CriarCategoriaUtensilioCommand("Limpeza"), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>().WithMessage("*Limpeza*");
    }
}
```

Criar `tests/CasaDiAna.Application.Tests/CategoriasUtensilio/AtualizarCategoriaUtensilioCommandHandlerTests.cs`:

```csharp
using CasaDiAna.Application.CategoriasUtensilio.Commands.AtualizarCategoriaUtensilio;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.CategoriasUtensilio;

public class AtualizarCategoriaUtensilioCommandHandlerTests
{
    private readonly Mock<ICategoriaUtensilioRepository> _repositorio = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly AtualizarCategoriaUtensilioCommandHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public AtualizarCategoriaUtensilioCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _handler = new AtualizarCategoriaUtensilioCommandHandler(_repositorio.Object, _currentUser.Object);
    }

    [Fact]
    public async Task DeveAtualizar_QuandoCategoriaExisteENomeUnico()
    {
        var id = Guid.NewGuid();
        var categoria = CategoriaUtensilio.Criar("Limpeza", _usuarioId);
        _repositorio.Setup(r => r.ObterPorIdAsync(id, default)).ReturnsAsync(categoria);
        _repositorio.Setup(r => r.NomeExisteAsync("Embalagens", id, default)).ReturnsAsync(false);
        _repositorio.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(
            new AtualizarCategoriaUtensilioCommand(id, "Embalagens"), CancellationToken.None);

        resultado.Nome.Should().Be("Embalagens");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoCategoriaNaoEncontrada()
    {
        var id = Guid.NewGuid();
        _repositorio.Setup(r => r.ObterPorIdAsync(id, default)).ReturnsAsync((CategoriaUtensilio?)null);

        var acao = () => _handler.Handle(
            new AtualizarCategoriaUtensilioCommand(id, "Embalagens"), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>().WithMessage("Categoria não encontrada.");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoNomeJaUsadoPorOutra()
    {
        var id = Guid.NewGuid();
        var categoria = CategoriaUtensilio.Criar("Limpeza", _usuarioId);
        _repositorio.Setup(r => r.ObterPorIdAsync(id, default)).ReturnsAsync(categoria);
        _repositorio.Setup(r => r.NomeExisteAsync("Embalagens", id, default)).ReturnsAsync(true);

        var acao = () => _handler.Handle(
            new AtualizarCategoriaUtensilioCommand(id, "Embalagens"), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>().WithMessage("*Embalagens*");
    }
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~CategoriasUtensilio"`
Expected: FAIL (compilação — namespace/classes ainda não existem).

- [ ] **Step 3: DTO**

Criar `src/CasaDiAna.Application/CategoriasUtensilio/Dtos/CategoriaUtensilioDto.cs`:

```csharp
namespace CasaDiAna.Application.CategoriasUtensilio.Dtos;

public record CategoriaUtensilioDto(Guid Id, string Nome, bool Ativo, DateTime CriadoEm, DateTime AtualizadoEm);
```

- [ ] **Step 4: `CriarCategoriaUtensilio`**

Criar `src/CasaDiAna.Application/CategoriasUtensilio/Commands/CriarCategoriaUtensilio/CriarCategoriaUtensilioCommand.cs`:

```csharp
using CasaDiAna.Application.CategoriasUtensilio.Dtos;
using MediatR;

namespace CasaDiAna.Application.CategoriasUtensilio.Commands.CriarCategoriaUtensilio;

public record CriarCategoriaUtensilioCommand(string Nome) : IRequest<CategoriaUtensilioDto>;
```

Criar `src/CasaDiAna.Application/CategoriasUtensilio/Commands/CriarCategoriaUtensilio/CriarCategoriaUtensilioCommandHandler.cs`:

```csharp
using CasaDiAna.Application.CategoriasUtensilio.Dtos;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasUtensilio.Commands.CriarCategoriaUtensilio;

public class CriarCategoriaUtensilioCommandHandler : IRequestHandler<CriarCategoriaUtensilioCommand, CategoriaUtensilioDto>
{
    private readonly ICategoriaUtensilioRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public CriarCategoriaUtensilioCommandHandler(
        ICategoriaUtensilioRepository categorias,
        ICurrentUserService currentUser)
    {
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task<CategoriaUtensilioDto> Handle(CriarCategoriaUtensilioCommand request, CancellationToken cancellationToken)
    {
        if (await _categorias.NomeExisteAsync(request.Nome, ct: cancellationToken))
            throw new DomainException($"Já existe uma categoria com o nome '{request.Nome}'.");

        var categoria = CategoriaUtensilio.Criar(request.Nome, _currentUser.UsuarioId);
        await _categorias.AdicionarAsync(categoria, cancellationToken);
        await _categorias.SalvarAsync(cancellationToken);

        return ToDto(categoria);
    }

    internal static CategoriaUtensilioDto ToDto(CategoriaUtensilio c) =>
        new(c.Id, c.Nome, c.Ativo, c.CriadoEm, c.AtualizadoEm);
}
```

Criar `src/CasaDiAna.Application/CategoriasUtensilio/Commands/CriarCategoriaUtensilio/CriarCategoriaUtensilioCommandValidator.cs`:

```csharp
using FluentValidation;

namespace CasaDiAna.Application.CategoriasUtensilio.Commands.CriarCategoriaUtensilio;

public class CriarCategoriaUtensilioCommandValidator : AbstractValidator<CriarCategoriaUtensilioCommand>
{
    public CriarCategoriaUtensilioCommandValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(100).WithMessage("Nome deve ter no máximo 100 caracteres.");
    }
}
```

- [ ] **Step 5: `AtualizarCategoriaUtensilio`**

Criar `src/CasaDiAna.Application/CategoriasUtensilio/Commands/AtualizarCategoriaUtensilio/AtualizarCategoriaUtensilioCommand.cs`:

```csharp
using CasaDiAna.Application.CategoriasUtensilio.Dtos;
using MediatR;

namespace CasaDiAna.Application.CategoriasUtensilio.Commands.AtualizarCategoriaUtensilio;

public record AtualizarCategoriaUtensilioCommand(Guid Id, string Nome) : IRequest<CategoriaUtensilioDto>;
```

Criar `src/CasaDiAna.Application/CategoriasUtensilio/Commands/AtualizarCategoriaUtensilio/AtualizarCategoriaUtensilioCommandHandler.cs`:

```csharp
using CasaDiAna.Application.CategoriasUtensilio.Commands.CriarCategoriaUtensilio;
using CasaDiAna.Application.CategoriasUtensilio.Dtos;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasUtensilio.Commands.AtualizarCategoriaUtensilio;

public class AtualizarCategoriaUtensilioCommandHandler : IRequestHandler<AtualizarCategoriaUtensilioCommand, CategoriaUtensilioDto>
{
    private readonly ICategoriaUtensilioRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public AtualizarCategoriaUtensilioCommandHandler(
        ICategoriaUtensilioRepository categorias,
        ICurrentUserService currentUser)
    {
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task<CategoriaUtensilioDto> Handle(AtualizarCategoriaUtensilioCommand request, CancellationToken cancellationToken)
    {
        var categoria = await _categorias.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Categoria não encontrada.");

        if (await _categorias.NomeExisteAsync(request.Nome, ignorarId: request.Id, ct: cancellationToken))
            throw new DomainException($"Já existe uma categoria com o nome '{request.Nome}'.");

        categoria.Atualizar(request.Nome, _currentUser.UsuarioId);
        _categorias.Atualizar(categoria);
        await _categorias.SalvarAsync(cancellationToken);

        return CriarCategoriaUtensilioCommandHandler.ToDto(categoria);
    }
}
```

Criar `src/CasaDiAna.Application/CategoriasUtensilio/Commands/AtualizarCategoriaUtensilio/AtualizarCategoriaUtensilioCommandValidator.cs`:

```csharp
using FluentValidation;

namespace CasaDiAna.Application.CategoriasUtensilio.Commands.AtualizarCategoriaUtensilio;

public class AtualizarCategoriaUtensilioCommandValidator : AbstractValidator<AtualizarCategoriaUtensilioCommand>
{
    public AtualizarCategoriaUtensilioCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Id é obrigatório.");

        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(100).WithMessage("Nome deve ter no máximo 100 caracteres.");
    }
}
```

- [ ] **Step 6: `DesativarCategoriaUtensilio`**

Criar `src/CasaDiAna.Application/CategoriasUtensilio/Commands/DesativarCategoriaUtensilio/DesativarCategoriaUtensilioCommand.cs`:

```csharp
using MediatR;

namespace CasaDiAna.Application.CategoriasUtensilio.Commands.DesativarCategoriaUtensilio;

public record DesativarCategoriaUtensilioCommand(Guid Id) : IRequest;
```

Criar `src/CasaDiAna.Application/CategoriasUtensilio/Commands/DesativarCategoriaUtensilio/DesativarCategoriaUtensilioCommandHandler.cs`:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasUtensilio.Commands.DesativarCategoriaUtensilio;

public class DesativarCategoriaUtensilioCommandHandler : IRequestHandler<DesativarCategoriaUtensilioCommand>
{
    private readonly ICategoriaUtensilioRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public DesativarCategoriaUtensilioCommandHandler(
        ICategoriaUtensilioRepository categorias,
        ICurrentUserService currentUser)
    {
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task Handle(DesativarCategoriaUtensilioCommand request, CancellationToken cancellationToken)
    {
        var categoria = await _categorias.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Categoria não encontrada.");

        categoria.Desativar(_currentUser.UsuarioId);
        _categorias.Atualizar(categoria);
        await _categorias.SalvarAsync(cancellationToken);
    }
}
```

- [ ] **Step 7: Query `ListarCategoriasUtensilio`**

Criar `src/CasaDiAna.Application/CategoriasUtensilio/Queries/ListarCategoriasUtensilio/ListarCategoriasUtensilioQuery.cs`:

```csharp
using CasaDiAna.Application.CategoriasUtensilio.Dtos;
using MediatR;

namespace CasaDiAna.Application.CategoriasUtensilio.Queries.ListarCategoriasUtensilio;

public record ListarCategoriasUtensilioQuery(bool ApenasAtivos = true) : IRequest<IReadOnlyList<CategoriaUtensilioDto>>;
```

Criar `src/CasaDiAna.Application/CategoriasUtensilio/Queries/ListarCategoriasUtensilio/ListarCategoriasUtensilioQueryHandler.cs`:

```csharp
using CasaDiAna.Application.CategoriasUtensilio.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasUtensilio.Queries.ListarCategoriasUtensilio;

public class ListarCategoriasUtensilioQueryHandler : IRequestHandler<ListarCategoriasUtensilioQuery, IReadOnlyList<CategoriaUtensilioDto>>
{
    private readonly ICategoriaUtensilioRepository _categorias;

    public ListarCategoriasUtensilioQueryHandler(ICategoriaUtensilioRepository categorias) =>
        _categorias = categorias;

    public async Task<IReadOnlyList<CategoriaUtensilioDto>> Handle(
        ListarCategoriasUtensilioQuery request, CancellationToken cancellationToken)
    {
        var lista = await _categorias.ListarAsync(request.ApenasAtivos, cancellationToken);
        return lista
            .Select(c => new CategoriaUtensilioDto(c.Id, c.Nome, c.Ativo, c.CriadoEm, c.AtualizadoEm))
            .ToList()
            .AsReadOnly();
    }
}
```

- [ ] **Step 8: Controller**

Criar `src/CasaDiAna.API/Controllers/CategoriasUtensilioController.cs`:

```csharp
using CasaDiAna.Application.CategoriasUtensilio.Commands.AtualizarCategoriaUtensilio;
using CasaDiAna.Application.CategoriasUtensilio.Commands.CriarCategoriaUtensilio;
using CasaDiAna.Application.CategoriasUtensilio.Commands.DesativarCategoriaUtensilio;
using CasaDiAna.Application.CategoriasUtensilio.Dtos;
using CasaDiAna.Application.CategoriasUtensilio.Queries.ListarCategoriasUtensilio;
using CasaDiAna.Application.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/categorias-utensilio")]
[Authorize]
public class CategoriasUtensilioController : ControllerBase
{
    private readonly IMediator _mediator;

    public CategoriasUtensilioController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<CategoriaUtensilioDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] bool apenasAtivos = true, CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarCategoriasUtensilioQuery(apenasAtivos), ct);
        return Ok(ApiResponse<IReadOnlyList<CategoriaUtensilioDto>>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CategoriaUtensilioDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Criar([FromBody] CriarCategoriaUtensilioCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(Listar), ApiResponse<CategoriaUtensilioDto>.Ok(resultado));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<CategoriaUtensilioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Atualizar(
        Guid id, [FromBody] AtualizarCategoriaUtensilioCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command with { Id = id }, ct);
        return Ok(ApiResponse<CategoriaUtensilioDto>.Ok(resultado));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Desativar(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DesativarCategoriaUtensilioCommand(id), ct);
        return NoContent();
    }
}
```

- [ ] **Step 9: Build + testes**

Run: `dotnet build src/CasaDiAna.API`
Expected: Build succeeded.

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~CategoriasUtensilio"`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/CasaDiAna.Application/CategoriasUtensilio/ src/CasaDiAna.API/Controllers/CategoriasUtensilioController.cs tests/CasaDiAna.Application.Tests/CategoriasUtensilio/
git commit -m "feat(utensilios): CRUD de CategoriaUtensilio (Application + controller)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4 — Application: CRUD de `Utensilio` + controller

**Files:**
- Create: `src/CasaDiAna.Application/Utensilios/Dtos/UtensilioDto.cs`
- Create: `src/CasaDiAna.Application/Utensilios/Dtos/UtensilioResumoDto.cs`
- Create: `src/CasaDiAna.Application/Utensilios/Commands/CriarUtensilio/CriarUtensilioCommand.cs`
- Create: `src/CasaDiAna.Application/Utensilios/Commands/CriarUtensilio/CriarUtensilioCommandHandler.cs`
- Create: `src/CasaDiAna.Application/Utensilios/Commands/CriarUtensilio/CriarUtensilioCommandValidator.cs`
- Create: `src/CasaDiAna.Application/Utensilios/Commands/AtualizarUtensilio/AtualizarUtensilioCommand.cs`
- Create: `src/CasaDiAna.Application/Utensilios/Commands/AtualizarUtensilio/AtualizarUtensilioCommandHandler.cs`
- Create: `src/CasaDiAna.Application/Utensilios/Commands/AtualizarUtensilio/AtualizarUtensilioCommandValidator.cs`
- Create: `src/CasaDiAna.Application/Utensilios/Commands/DesativarUtensilio/DesativarUtensilioCommand.cs`
- Create: `src/CasaDiAna.Application/Utensilios/Commands/DesativarUtensilio/DesativarUtensilioCommandHandler.cs`
- Create: `src/CasaDiAna.Application/Utensilios/Queries/ListarUtensilios/ListarUtensiliosQuery.cs`
- Create: `src/CasaDiAna.Application/Utensilios/Queries/ListarUtensilios/ListarUtensiliosQueryHandler.cs`
- Create: `src/CasaDiAna.Application/Utensilios/Queries/ObterUtensilio/ObterUtensilioQuery.cs`
- Create: `src/CasaDiAna.Application/Utensilios/Queries/ObterUtensilio/ObterUtensilioQueryHandler.cs`
- Create: `src/CasaDiAna.API/Controllers/UtensiliosController.cs`
- Test: `tests/CasaDiAna.Application.Tests/Utensilios/CriarUtensilioCommandHandlerTests.cs`

**Interfaces:**
- Consumes: `IUtensilioRepository`, `IUnidadeMedidaRepository`, `ICurrentUserService` (já existentes/Task 2).
- Produces: `UtensilioDto(Id, Nome, CodigoInterno, CategoriaUtensilioId, CategoriaNome, UnidadeMedidaId, UnidadeMedidaCodigo, EstoqueAtual, EstoqueMinimo, EstoqueMaximo, EstaBaixoDoMinimo, CustoUnitario, Ativo, AtualizadoEm)`, `UtensilioResumoDto(Id, Nome, CodigoInterno, CategoriaNome, UnidadeMedidaCodigo, EstoqueAtual, EstoqueMinimo, EstaBaixoDoMinimo, Ativo)`. Rota `api/utensilios` (GET, GET `{id}`, POST, PUT `{id}`, DELETE `{id}`). `CriarUtensilioCommandHandler.ToDto(Utensilio)` reaproveitado pelos demais handlers do módulo.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/CasaDiAna.Application.Tests/Utensilios/CriarUtensilioCommandHandlerTests.cs`:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Utensilios.Commands.CriarUtensilio;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Utensilios;

public class CriarUtensilioCommandHandlerTests
{
    private readonly Mock<IUtensilioRepository> _repositorio = new();
    private readonly Mock<IUnidadeMedidaRepository> _unidades = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly CriarUtensilioCommandHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public CriarUtensilioCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _handler = new CriarUtensilioCommandHandler(_repositorio.Object, _unidades.Object, _currentUser.Object);
    }

    [Fact]
    public async Task DeveCriar_QuandoDadosValidos()
    {
        var command = new CriarUtensilioCommand("Detergente Neutro", 1, 2m);
        _unidades.Setup(u => u.ExisteAsync(1, default)).ReturnsAsync(true);
        _repositorio.Setup(r => r.CodigoInternoExisteAsync(It.IsAny<string>(), null, default)).ReturnsAsync(false);
        _repositorio.Setup(r => r.AdicionarAsync(It.IsAny<Utensilio>(), default)).Returns(Task.CompletedTask);
        _repositorio.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var salvo = Utensilio.Criar("Detergente Neutro", 1, 2m, _usuarioId);
        _repositorio.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(salvo);

        var resultado = await _handler.Handle(command, CancellationToken.None);

        resultado.Nome.Should().Be("Detergente Neutro");
        resultado.EstoqueMinimo.Should().Be(2m);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUnidadeNaoExiste()
    {
        _unidades.Setup(u => u.ExisteAsync(99, default)).ReturnsAsync(false);

        var acao = () => _handler.Handle(
            new CriarUtensilioCommand("Detergente", 99, 0m), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Unidade de medida não encontrada.");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoCodigoInternoJaExiste()
    {
        _unidades.Setup(u => u.ExisteAsync(1, default)).ReturnsAsync(true);
        _repositorio.Setup(r => r.CodigoInternoExisteAsync("DET-001", null, default)).ReturnsAsync(true);

        var acao = () => _handler.Handle(
            new CriarUtensilioCommand("Detergente", 1, 0m, CodigoInterno: "DET-001"), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*DET-001*");
    }
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~CriarUtensilioCommandHandlerTests"`
Expected: FAIL (compilação).

- [ ] **Step 3: DTOs**

Criar `src/CasaDiAna.Application/Utensilios/Dtos/UtensilioDto.cs`:

```csharp
namespace CasaDiAna.Application.Utensilios.Dtos;

public record UtensilioDto(
    Guid Id,
    string Nome,
    string? CodigoInterno,
    Guid? CategoriaUtensilioId,
    string? CategoriaNome,
    short UnidadeMedidaId,
    string UnidadeMedidaCodigo,
    decimal EstoqueAtual,
    decimal EstoqueMinimo,
    decimal? EstoqueMaximo,
    bool EstaBaixoDoMinimo,
    decimal? CustoUnitario,
    bool Ativo,
    DateTime AtualizadoEm);
```

Criar `src/CasaDiAna.Application/Utensilios/Dtos/UtensilioResumoDto.cs`:

```csharp
namespace CasaDiAna.Application.Utensilios.Dtos;

public record UtensilioResumoDto(
    Guid Id,
    string Nome,
    string? CodigoInterno,
    string? CategoriaNome,
    string UnidadeMedidaCodigo,
    decimal EstoqueAtual,
    decimal EstoqueMinimo,
    bool EstaBaixoDoMinimo,
    bool Ativo);
```

- [ ] **Step 4: `CriarUtensilio`**

Criar `src/CasaDiAna.Application/Utensilios/Commands/CriarUtensilio/CriarUtensilioCommand.cs`:

```csharp
using CasaDiAna.Application.Utensilios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Commands.CriarUtensilio;

public record CriarUtensilioCommand(
    string Nome,
    short UnidadeMedidaId,
    decimal EstoqueMinimo,
    string? CodigoInterno = null,
    Guid? CategoriaUtensilioId = null,
    decimal? EstoqueMaximo = null) : IRequest<UtensilioDto>;
```

Criar `src/CasaDiAna.Application/Utensilios/Commands/CriarUtensilio/CriarUtensilioCommandHandler.cs`:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Utensilios.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Commands.CriarUtensilio;

public class CriarUtensilioCommandHandler : IRequestHandler<CriarUtensilioCommand, UtensilioDto>
{
    private readonly IUtensilioRepository _utensilios;
    private readonly IUnidadeMedidaRepository _unidades;
    private readonly ICurrentUserService _currentUser;

    public CriarUtensilioCommandHandler(
        IUtensilioRepository utensilios,
        IUnidadeMedidaRepository unidades,
        ICurrentUserService currentUser)
    {
        _utensilios = utensilios;
        _unidades = unidades;
        _currentUser = currentUser;
    }

    public async Task<UtensilioDto> Handle(CriarUtensilioCommand request, CancellationToken cancellationToken)
    {
        if (!await _unidades.ExisteAsync(request.UnidadeMedidaId, cancellationToken))
            throw new DomainException("Unidade de medida não encontrada.");

        if (request.CodigoInterno != null &&
            await _utensilios.CodigoInternoExisteAsync(request.CodigoInterno, ct: cancellationToken))
            throw new DomainException($"Já existe um utensílio com o código '{request.CodigoInterno}'.");

        var utensilio = Utensilio.Criar(
            request.Nome,
            request.UnidadeMedidaId,
            request.EstoqueMinimo,
            _currentUser.UsuarioId,
            request.CodigoInterno,
            request.CategoriaUtensilioId,
            request.EstoqueMaximo);

        await _utensilios.AdicionarAsync(utensilio, cancellationToken);
        await _utensilios.SalvarAsync(cancellationToken);

        var salvo = await _utensilios.ObterPorIdAsync(utensilio.Id, cancellationToken);
        return ToDto(salvo!);
    }

    internal static UtensilioDto ToDto(Utensilio u) => new(
        u.Id, u.Nome, u.CodigoInterno,
        u.CategoriaUtensilioId, u.Categoria?.Nome,
        u.UnidadeMedidaId, u.UnidadeMedida?.Codigo ?? string.Empty,
        u.EstoqueAtual, u.EstoqueMinimo, u.EstoqueMaximo,
        u.EstaBaixoDoMinimo(), u.CustoUnitario,
        u.Ativo, u.AtualizadoEm);
}
```

Criar `src/CasaDiAna.Application/Utensilios/Commands/CriarUtensilio/CriarUtensilioCommandValidator.cs`:

```csharp
using FluentValidation;

namespace CasaDiAna.Application.Utensilios.Commands.CriarUtensilio;

public class CriarUtensilioCommandValidator : AbstractValidator<CriarUtensilioCommand>
{
    public CriarUtensilioCommandValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(150).WithMessage("Nome deve ter no máximo 150 caracteres.");

        RuleFor(x => x.UnidadeMedidaId)
            .GreaterThan((short)0).WithMessage("Unidade de medida é obrigatória.");

        RuleFor(x => x.EstoqueMinimo)
            .GreaterThanOrEqualTo(0).WithMessage("Estoque mínimo não pode ser negativo.");

        RuleFor(x => x.EstoqueMaximo)
            .GreaterThanOrEqualTo(x => x.EstoqueMinimo)
            .When(x => x.EstoqueMaximo.HasValue)
            .WithMessage("Estoque máximo não pode ser menor que o mínimo.");

        RuleFor(x => x.CodigoInterno)
            .MaximumLength(30).When(x => x.CodigoInterno != null)
            .WithMessage("Código interno deve ter no máximo 30 caracteres.");
    }
}
```

- [ ] **Step 5: `AtualizarUtensilio`**

Criar `src/CasaDiAna.Application/Utensilios/Commands/AtualizarUtensilio/AtualizarUtensilioCommand.cs`:

```csharp
using CasaDiAna.Application.Utensilios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Commands.AtualizarUtensilio;

public record AtualizarUtensilioCommand(
    Guid Id,
    string Nome,
    short UnidadeMedidaId,
    decimal EstoqueMinimo,
    string? CodigoInterno = null,
    Guid? CategoriaUtensilioId = null,
    decimal? EstoqueMaximo = null) : IRequest<UtensilioDto>;
```

Criar `src/CasaDiAna.Application/Utensilios/Commands/AtualizarUtensilio/AtualizarUtensilioCommandHandler.cs`:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Utensilios.Commands.CriarUtensilio;
using CasaDiAna.Application.Utensilios.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Commands.AtualizarUtensilio;

public class AtualizarUtensilioCommandHandler : IRequestHandler<AtualizarUtensilioCommand, UtensilioDto>
{
    private readonly IUtensilioRepository _utensilios;
    private readonly IUnidadeMedidaRepository _unidades;
    private readonly ICurrentUserService _currentUser;

    public AtualizarUtensilioCommandHandler(
        IUtensilioRepository utensilios,
        IUnidadeMedidaRepository unidades,
        ICurrentUserService currentUser)
    {
        _utensilios = utensilios;
        _unidades = unidades;
        _currentUser = currentUser;
    }

    public async Task<UtensilioDto> Handle(AtualizarUtensilioCommand request, CancellationToken cancellationToken)
    {
        var utensilio = await _utensilios.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Utensílio não encontrado.");

        if (!await _unidades.ExisteAsync(request.UnidadeMedidaId, cancellationToken))
            throw new DomainException("Unidade de medida não encontrada.");

        if (request.CodigoInterno != null &&
            await _utensilios.CodigoInternoExisteAsync(request.CodigoInterno, ignorarId: request.Id, ct: cancellationToken))
            throw new DomainException($"Já existe um utensílio com o código '{request.CodigoInterno}'.");

        utensilio.Atualizar(
            request.Nome,
            request.UnidadeMedidaId,
            request.EstoqueMinimo,
            _currentUser.UsuarioId,
            request.CodigoInterno,
            request.CategoriaUtensilioId,
            request.EstoqueMaximo);

        _utensilios.Atualizar(utensilio);
        await _utensilios.SalvarAsync(cancellationToken);

        var salvo = await _utensilios.ObterPorIdAsync(utensilio.Id, cancellationToken);
        return CriarUtensilioCommandHandler.ToDto(salvo!);
    }
}
```

Criar `src/CasaDiAna.Application/Utensilios/Commands/AtualizarUtensilio/AtualizarUtensilioCommandValidator.cs`:

```csharp
using FluentValidation;

namespace CasaDiAna.Application.Utensilios.Commands.AtualizarUtensilio;

public class AtualizarUtensilioCommandValidator : AbstractValidator<AtualizarUtensilioCommand>
{
    public AtualizarUtensilioCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Id é obrigatório.");

        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(150).WithMessage("Nome deve ter no máximo 150 caracteres.");

        RuleFor(x => x.UnidadeMedidaId)
            .GreaterThan((short)0).WithMessage("Unidade de medida é obrigatória.");

        RuleFor(x => x.EstoqueMinimo)
            .GreaterThanOrEqualTo(0).WithMessage("Estoque mínimo não pode ser negativo.");

        RuleFor(x => x.EstoqueMaximo)
            .GreaterThanOrEqualTo(x => x.EstoqueMinimo)
            .When(x => x.EstoqueMaximo.HasValue)
            .WithMessage("Estoque máximo não pode ser menor que o mínimo.");

        RuleFor(x => x.CodigoInterno)
            .MaximumLength(30).When(x => x.CodigoInterno != null)
            .WithMessage("Código interno deve ter no máximo 30 caracteres.");
    }
}
```

- [ ] **Step 6: `DesativarUtensilio`**

Criar `src/CasaDiAna.Application/Utensilios/Commands/DesativarUtensilio/DesativarUtensilioCommand.cs`:

```csharp
using MediatR;

namespace CasaDiAna.Application.Utensilios.Commands.DesativarUtensilio;

public record DesativarUtensilioCommand(Guid Id) : IRequest;
```

Criar `src/CasaDiAna.Application/Utensilios/Commands/DesativarUtensilio/DesativarUtensilioCommandHandler.cs`:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Commands.DesativarUtensilio;

public class DesativarUtensilioCommandHandler : IRequestHandler<DesativarUtensilioCommand>
{
    private readonly IUtensilioRepository _utensilios;
    private readonly ICurrentUserService _currentUser;

    public DesativarUtensilioCommandHandler(
        IUtensilioRepository utensilios,
        ICurrentUserService currentUser)
    {
        _utensilios = utensilios;
        _currentUser = currentUser;
    }

    public async Task Handle(DesativarUtensilioCommand request, CancellationToken cancellationToken)
    {
        var utensilio = await _utensilios.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Utensílio não encontrado.");

        utensilio.Desativar(_currentUser.UsuarioId);
        _utensilios.Atualizar(utensilio);
        await _utensilios.SalvarAsync(cancellationToken);
    }
}
```

- [ ] **Step 7: Queries `ListarUtensilios` e `ObterUtensilio`**

Criar `src/CasaDiAna.Application/Utensilios/Queries/ListarUtensilios/ListarUtensiliosQuery.cs`:

```csharp
using CasaDiAna.Application.Utensilios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Queries.ListarUtensilios;

public record ListarUtensiliosQuery(bool ApenasAtivos = true) : IRequest<IReadOnlyList<UtensilioResumoDto>>;
```

Criar `src/CasaDiAna.Application/Utensilios/Queries/ListarUtensilios/ListarUtensiliosQueryHandler.cs`:

```csharp
using CasaDiAna.Application.Utensilios.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Queries.ListarUtensilios;

public class ListarUtensiliosQueryHandler
    : IRequestHandler<ListarUtensiliosQuery, IReadOnlyList<UtensilioResumoDto>>
{
    private readonly IUtensilioRepository _utensilios;

    public ListarUtensiliosQueryHandler(IUtensilioRepository utensilios) =>
        _utensilios = utensilios;

    public async Task<IReadOnlyList<UtensilioResumoDto>> Handle(
        ListarUtensiliosQuery request, CancellationToken cancellationToken)
    {
        var lista = await _utensilios.ListarAsync(request.ApenasAtivos, cancellationToken);
        return lista
            .Select(u => new UtensilioResumoDto(
                u.Id, u.Nome, u.CodigoInterno,
                u.Categoria?.Nome,
                u.UnidadeMedida?.Codigo ?? string.Empty,
                u.EstoqueAtual, u.EstoqueMinimo,
                u.EstaBaixoDoMinimo(), u.Ativo))
            .ToList()
            .AsReadOnly();
    }
}
```

Criar `src/CasaDiAna.Application/Utensilios/Queries/ObterUtensilio/ObterUtensilioQuery.cs`:

```csharp
using CasaDiAna.Application.Utensilios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Queries.ObterUtensilio;

public record ObterUtensilioQuery(Guid Id) : IRequest<UtensilioDto>;
```

Criar `src/CasaDiAna.Application/Utensilios/Queries/ObterUtensilio/ObterUtensilioQueryHandler.cs`:

```csharp
using CasaDiAna.Application.Utensilios.Commands.CriarUtensilio;
using CasaDiAna.Application.Utensilios.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Queries.ObterUtensilio;

public class ObterUtensilioQueryHandler : IRequestHandler<ObterUtensilioQuery, UtensilioDto>
{
    private readonly IUtensilioRepository _utensilios;

    public ObterUtensilioQueryHandler(IUtensilioRepository utensilios) =>
        _utensilios = utensilios;

    public async Task<UtensilioDto> Handle(ObterUtensilioQuery request, CancellationToken cancellationToken)
    {
        var utensilio = await _utensilios.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Utensílio não encontrado.");

        return CriarUtensilioCommandHandler.ToDto(utensilio);
    }
}
```

- [ ] **Step 8: Controller**

Criar `src/CasaDiAna.API/Controllers/UtensiliosController.cs`:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Utensilios.Commands.AtualizarUtensilio;
using CasaDiAna.Application.Utensilios.Commands.CriarUtensilio;
using CasaDiAna.Application.Utensilios.Commands.DesativarUtensilio;
using CasaDiAna.Application.Utensilios.Dtos;
using CasaDiAna.Application.Utensilios.Queries.ListarUtensilios;
using CasaDiAna.Application.Utensilios.Queries.ObterUtensilio;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/utensilios")]
[Authorize]
public class UtensiliosController : ControllerBase
{
    private readonly IMediator _mediator;

    public UtensiliosController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<UtensilioResumoDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] bool apenasAtivos = true, CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarUtensiliosQuery(apenasAtivos), ct);
        return Ok(ApiResponse<IReadOnlyList<UtensilioResumoDto>>.Ok(resultado));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<UtensilioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ObterPorId(Guid id, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ObterUtensilioQuery(id), ct);
        return Ok(ApiResponse<UtensilioDto>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<UtensilioDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Criar([FromBody] CriarUtensilioCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(ObterPorId), new { id = resultado.Id },
            ApiResponse<UtensilioDto>.Ok(resultado));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<UtensilioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Atualizar(
        Guid id, [FromBody] AtualizarUtensilioCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command with { Id = id }, ct);
        return Ok(ApiResponse<UtensilioDto>.Ok(resultado));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Desativar(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DesativarUtensilioCommand(id), ct);
        return NoContent();
    }
}
```

- [ ] **Step 9: Build + testes**

Run: `dotnet build src/CasaDiAna.API`
Expected: Build succeeded.

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~Utensilios"`
Expected: PASS (inclui os testes de domínio do Task 1 + este).

- [ ] **Step 10: Commit**

```bash
git add src/CasaDiAna.Application/Utensilios/ src/CasaDiAna.API/Controllers/UtensiliosController.cs tests/CasaDiAna.Application.Tests/Utensilios/
git commit -m "feat(utensilios): CRUD de Utensilio (Application + controller)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5 — `RegistrarEntrada`: aceitar itens de utensílio (aditivo)

**Files:**
- Create: `src/CasaDiAna.Application/Entradas/Commands/RegistrarEntrada/ItemEntradaUtensilioInputDto.cs`
- Create: `src/CasaDiAna.Application/Entradas/Dtos/ItemEntradaUtensilioDto.cs`
- Modify: `src/CasaDiAna.Application/Entradas/Commands/RegistrarEntrada/RegistrarEntradaCommand.cs`
- Modify: `src/CasaDiAna.Application/Entradas/Commands/RegistrarEntrada/RegistrarEntradaCommandValidator.cs`
- Modify: `src/CasaDiAna.Application/Entradas/Commands/RegistrarEntrada/RegistrarEntradaCommandHandler.cs`
- Modify: `src/CasaDiAna.Application/Entradas/Dtos/EntradaMercadoriaDto.cs`
- Modify: `src/CasaDiAna.Application/Entradas/Queries/ListarEntradas/ListarEntradasQueryHandler.cs`
- Modify: `tests/CasaDiAna.Application.Tests/Entradas/RegistrarEntradaCommandHandlerTests.cs`

**Interfaces:**
- Consumes: `IUtensilioRepository`, `IMovimentacaoUtensilioRepository` (Task 2), `Utensilio`, `MovimentacaoUtensilio`, `EntradaMercadoria.AdicionarItemUtensilio` (Task 1).
- Produces: `RegistrarEntradaCommand` com novo campo opcional `ItensUtensilio`; `EntradaMercadoriaDto.ItensUtensilio`; `RegistrarEntradaCommandHandler.ToDto` atualizado (consumido pelo Task 6 e por `ObterEntradaQueryHandler`, que já chama `RegistrarEntradaCommandHandler.ToDto` e não precisa de alteração própria).

- [ ] **Step 1: Criar os DTOs novos**

Criar `src/CasaDiAna.Application/Entradas/Commands/RegistrarEntrada/ItemEntradaUtensilioInputDto.cs`:

```csharp
namespace CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;

public record ItemEntradaUtensilioInputDto(
    Guid UtensilioId,
    decimal Quantidade,
    decimal CustoUnitario);
```

Criar `src/CasaDiAna.Application/Entradas/Dtos/ItemEntradaUtensilioDto.cs`:

```csharp
namespace CasaDiAna.Application.Entradas.Dtos;

public record ItemEntradaUtensilioDto(
    Guid Id,
    Guid UtensilioId,
    string UtensilioNome,
    string UnidadeMedidaCodigo,
    decimal Quantidade,
    decimal CustoUnitario,
    decimal CustoTotal);
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
    bool TemBoleto = false,
    DateTime? DataVencimentoBoleto = null,
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
            .Must(x => x.Itens.Count > 0 || (x.ItensUtensilio?.Count ?? 0) > 0)
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

        RuleFor(x => x.DataVencimentoBoleto)
            .NotNull()
            .WithMessage("Informe a data de vencimento do boleto.")
            .GreaterThanOrEqualTo(_ => DateTime.UtcNow.Date)
            .WithMessage("A data de vencimento do boleto deve ser hoje ou no futuro.")
            .When(x => x.TemBoleto);
    }
}
```

- [ ] **Step 4: Modificar `EntradaMercadoriaDto.cs`**

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
    bool TemBoleto,
    DateTime? DataVencimentoBoleto,
    IReadOnlyList<ItemEntradaUtensilioDto> ItensUtensilio);
```

- [ ] **Step 5: Modificar `RegistrarEntradaCommandHandler.cs`**

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
            request.Observacoes,
            request.TemBoleto,
            request.DataVencimentoBoleto);

        // Carrega todos os ingredientes de uma vez
        var ingredienteIds = request.Itens.Select(i => i.IngredienteId).Distinct().ToList();
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
        foreach (var item in request.Itens)
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
            e.TemBoleto,
            e.DataVencimentoBoleto,
            itensUtensilio);
    }
}
```

- [ ] **Step 6: Modificar `ListarEntradasQueryHandler.cs`**

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
            e.TemBoleto,
            e.DataVencimentoBoleto)).ToList().AsReadOnly();
    }
}
```

- [ ] **Step 7: Atualizar `RegistrarEntradaCommandHandlerTests.cs`**

Substituir o arquivo inteiro por:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;
using CasaDiAna.Application.Notificacoes.Services;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Entradas;

public class RegistrarEntradaCommandHandlerTests
{
    private readonly Mock<IEntradaMercadoriaRepository> _entradas = new();
    private readonly Mock<IIngredienteRepository> _ingredientes = new();
    private readonly Mock<IUtensilioRepository> _utensilios = new();
    private readonly Mock<IMovimentacaoRepository> _movimentacoes = new();
    private readonly Mock<IMovimentacaoUtensilioRepository> _movimentacoesUtensilio = new();
    private readonly Mock<IFornecedorRepository> _fornecedores = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<INotificacaoEstoqueService> _notificacoes = new();
    private readonly RegistrarEntradaCommandHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public RegistrarEntradaCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _handler = new RegistrarEntradaCommandHandler(
            _entradas.Object,
            _ingredientes.Object,
            _utensilios.Object,
            _movimentacoes.Object,
            _movimentacoesUtensilio.Object,
            _fornecedores.Object,
            _currentUser.Object,
            _notificacoes.Object);
    }

    private static Ingrediente CriarIngrediente()
        => Ingrediente.Criar("Farinha", unidadeMedidaId: 1, estoqueMinimo: 0, criadoPor: Guid.NewGuid());

    private static Utensilio CriarUtensilio()
        => Utensilio.Criar("Detergente", unidadeMedidaId: 1, estoqueMinimo: 0, criadoPor: Guid.NewGuid());

    [Fact]
    public async Task DeveRegistrarEntrada_QuandoDadosValidos()
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

        resultado.Should().NotBeNull();
        resultado.Itens.Should().HaveCount(1);
        _ingredientes.Verify(r => r.Atualizar(It.IsAny<Ingrediente>()), Times.Once);
        _movimentacoes.Verify(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default), Times.Once);
    }

    [Fact]
    public async Task DeveRegistrarEntrada_QuandoSoUtensilio()
    {
        var fornecedorId = Guid.NewGuid();
        var utensilioId = Guid.NewGuid();
        var fornecedor = Fornecedor.Criar("Distribuidora XYZ", _usuarioId);
        var utensilio = CriarUtensilio();

        var entradaRetornada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entradaRetornada.AdicionarItemUtensilio(utensilioId, 3, 12.50m);

        _fornecedores.Setup(r => r.ObterPorIdAsync(fornecedorId, default)).ReturnsAsync(fornecedor);
        _utensilios.Setup(r => r.ObterPorIdAsync(utensilioId, default)).ReturnsAsync(utensilio);
        _utensilios.Setup(r => r.Atualizar(It.IsAny<Utensilio>()));
        _movimentacoesUtensilio.Setup(r => r.AdicionarAsync(It.IsAny<MovimentacaoUtensilio>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.AdicionarAsync(It.IsAny<EntradaMercadoria>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _entradas.Setup(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(entradaRetornada);

        var resultado = await _handler.Handle(
            new RegistrarEntradaCommand(
                fornecedorId,
                DateTime.UtcNow,
                new List<ItemEntradaInputDto>(),
                "Operador Teste",
                ItensUtensilio: new List<ItemEntradaUtensilioInputDto> { new(utensilioId, 3, 12.50m) }),
            CancellationToken.None);

        resultado.Should().NotBeNull();
        resultado.ItensUtensilio.Should().HaveCount(1);
        _utensilios.Verify(r => r.Atualizar(It.IsAny<Utensilio>()), Times.Once);
        _movimentacoesUtensilio.Verify(r => r.AdicionarAsync(It.IsAny<MovimentacaoUtensilio>(), default), Times.Once);
    }

    [Fact]
    public async Task DeveRegistrarEntrada_QuandoMistaIngredienteEUtensilio()
    {
        var fornecedorId = Guid.NewGuid();
        var ingredienteId = Guid.NewGuid();
        var utensilioId = Guid.NewGuid();
        var fornecedor = Fornecedor.Criar("Distribuidora XYZ", _usuarioId);
        var ingrediente = CriarIngrediente();
        var utensilio = CriarUtensilio();

        var entradaRetornada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entradaRetornada.AdicionarItem(ingredienteId, 10, 5m);
        entradaRetornada.AdicionarItemUtensilio(utensilioId, 2, 8m);

        _fornecedores.Setup(r => r.ObterPorIdAsync(fornecedorId, default)).ReturnsAsync(fornecedor);
        _ingredientes.Setup(r => r.ObterPorIdAsync(ingredienteId, default)).ReturnsAsync(ingrediente);
        _utensilios.Setup(r => r.ObterPorIdAsync(utensilioId, default)).ReturnsAsync(utensilio);
        _movimentacoes.Setup(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default)).Returns(Task.CompletedTask);
        _movimentacoesUtensilio.Setup(r => r.AdicionarAsync(It.IsAny<MovimentacaoUtensilio>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.AdicionarAsync(It.IsAny<EntradaMercadoria>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _entradas.Setup(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(entradaRetornada);

        var resultado = await _handler.Handle(
            new RegistrarEntradaCommand(
                fornecedorId,
                DateTime.UtcNow,
                new List<ItemEntradaInputDto> { new(ingredienteId, 10, 5m) },
                "Operador Teste",
                ItensUtensilio: new List<ItemEntradaUtensilioInputDto> { new(utensilioId, 2, 8m) }),
            CancellationToken.None);

        resultado.Itens.Should().HaveCount(1);
        resultado.ItensUtensilio.Should().HaveCount(1);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoFornecedorNaoEncontrado()
    {
        var fornecedorId = Guid.NewGuid();
        _fornecedores.Setup(r => r.ObterPorIdAsync(fornecedorId, default)).ReturnsAsync((Fornecedor?)null);

        var acao = () => _handler.Handle(
            new RegistrarEntradaCommand(
                fornecedorId,
                DateTime.UtcNow,
                new List<ItemEntradaInputDto> { new(Guid.NewGuid(), 1, 1) },
                "Operador Teste"),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*Fornecedor*");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoIngredienteInativo()
    {
        var fornecedorId = Guid.NewGuid();
        var ingredienteId = Guid.NewGuid();
        var fornecedor = Fornecedor.Criar("Distribuidora XYZ", _usuarioId);
        var ingrediente = CriarIngrediente();
        ingrediente.Desativar(_usuarioId);

        _fornecedores.Setup(r => r.ObterPorIdAsync(fornecedorId, default)).ReturnsAsync(fornecedor);
        _ingredientes.Setup(r => r.ObterPorIdAsync(ingredienteId, default)).ReturnsAsync(ingrediente);

        var acao = () => _handler.Handle(
            new RegistrarEntradaCommand(
                fornecedorId,
                DateTime.UtcNow,
                new List<ItemEntradaInputDto> { new(ingredienteId, 5, 2) },
                "Operador Teste"),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*inativo*");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUtensilioInativo()
    {
        var fornecedorId = Guid.NewGuid();
        var utensilioId = Guid.NewGuid();
        var fornecedor = Fornecedor.Criar("Distribuidora XYZ", _usuarioId);
        var utensilio = CriarUtensilio();
        utensilio.Desativar(_usuarioId);

        _fornecedores.Setup(r => r.ObterPorIdAsync(fornecedorId, default)).ReturnsAsync(fornecedor);
        _utensilios.Setup(r => r.ObterPorIdAsync(utensilioId, default)).ReturnsAsync(utensilio);

        var acao = () => _handler.Handle(
            new RegistrarEntradaCommand(
                fornecedorId,
                DateTime.UtcNow,
                new List<ItemEntradaInputDto>(),
                "Operador Teste",
                ItensUtensilio: new List<ItemEntradaUtensilioInputDto> { new(utensilioId, 1, 2) }),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*inativo*");
    }
}
```

- [ ] **Step 8: Rodar e ver passar**

Run: `dotnet build src/CasaDiAna.API`
Expected: Build succeeded.

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~Entradas"`
Expected: PASS — inclui os testes já existentes de `CancelarEntrada` (ainda não tocados neste task) e `RegistrarEntrada` (reescritos).

- [ ] **Step 9: Commit**

```bash
git add src/CasaDiAna.Application/Entradas/ tests/CasaDiAna.Application.Tests/Entradas/RegistrarEntradaCommandHandlerTests.cs
git commit -m "feat(entradas): aceita itens de utensilio na mesma nota (aditivo)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6 — `CancelarEntrada`: reverter estoque de utensílio também

**Files:**
- Modify: `src/CasaDiAna.Application/Entradas/Commands/CancelarEntrada/CancelarEntradaCommandHandler.cs`
- Modify: `tests/CasaDiAna.Application.Tests/Entradas/CancelarEntradaCommandHandlerTests.cs`

**Interfaces:**
- Consumes: `IUtensilioRepository`, `IMovimentacaoUtensilioRepository` (Task 2), `entrada.ItensUtensilio` (Task 1), `RegistrarEntradaCommandHandler.ToDto` (Task 5, já atualizado).

- [ ] **Step 1: Escrever o teste que falha**

Em `tests/CasaDiAna.Application.Tests/Entradas/CancelarEntradaCommandHandlerTests.cs`, substituir o arquivo inteiro por:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Entradas.Commands.CancelarEntrada;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Entradas;

public class CancelarEntradaCommandHandlerTests
{
    private readonly Mock<IEntradaMercadoriaRepository> _entradas = new();
    private readonly Mock<IIngredienteRepository> _ingredientes = new();
    private readonly Mock<IUtensilioRepository> _utensilios = new();
    private readonly Mock<IMovimentacaoRepository> _movimentacoes = new();
    private readonly Mock<IMovimentacaoUtensilioRepository> _movimentacoesUtensilio = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly CancelarEntradaCommandHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public CancelarEntradaCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _currentUser.Setup(u => u.Papel).Returns("Operador");
        _handler = new CancelarEntradaCommandHandler(
            _entradas.Object,
            _ingredientes.Object,
            _utensilios.Object,
            _movimentacoes.Object,
            _movimentacoesUtensilio.Object,
            _currentUser.Object);
    }

    [Fact]
    public async Task DeveCancelarEntrada_ERevertEstoque()
    {
        var fornecedorId = Guid.NewGuid();
        var ingredienteId = Guid.NewGuid();
        var entrada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entrada.AdicionarItem(ingredienteId, 10, 5m);

        var ingrediente = Ingrediente.Criar("Farinha", 1, 0, _usuarioId);
        ingrediente.AtualizarEstoque(10, _usuarioId);

        var entradaCancelada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entradaCancelada.AdicionarItem(ingredienteId, 10, 5m);
        entradaCancelada.Cancelar(_usuarioId);

        _entradas.SetupSequence(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(entrada)
            .ReturnsAsync(entradaCancelada);
        _ingredientes.Setup(r => r.ObterPorIdAsync(ingredienteId, default)).ReturnsAsync(ingrediente);
        _ingredientes.Setup(r => r.Atualizar(It.IsAny<Ingrediente>()));
        _movimentacoes.Setup(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.Atualizar(It.IsAny<EntradaMercadoria>()));
        _entradas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(
            new CancelarEntradaCommand(entrada.Id),
            CancellationToken.None);

        resultado.Status.Should().Be("Cancelada");
        _ingredientes.Verify(r => r.Atualizar(It.IsAny<Ingrediente>()), Times.Once);
        _movimentacoes.Verify(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default), Times.Once);
    }

    [Fact]
    public async Task DeveCancelarEntradaMista_ERevertEstoqueDosDois()
    {
        var fornecedorId = Guid.NewGuid();
        var ingredienteId = Guid.NewGuid();
        var utensilioId = Guid.NewGuid();
        var entrada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entrada.AdicionarItem(ingredienteId, 10, 5m);
        entrada.AdicionarItemUtensilio(utensilioId, 4, 3m);

        var ingrediente = Ingrediente.Criar("Farinha", 1, 0, _usuarioId);
        ingrediente.AtualizarEstoque(10, _usuarioId);
        var utensilio = Utensilio.Criar("Detergente", 1, 0, _usuarioId);
        utensilio.AtualizarEstoque(4, _usuarioId);

        var entradaCancelada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entradaCancelada.AdicionarItem(ingredienteId, 10, 5m);
        entradaCancelada.AdicionarItemUtensilio(utensilioId, 4, 3m);
        entradaCancelada.Cancelar(_usuarioId);

        _entradas.SetupSequence(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(entrada)
            .ReturnsAsync(entradaCancelada);
        _ingredientes.Setup(r => r.ObterPorIdAsync(ingredienteId, default)).ReturnsAsync(ingrediente);
        _utensilios.Setup(r => r.ObterPorIdAsync(utensilioId, default)).ReturnsAsync(utensilio);
        _ingredientes.Setup(r => r.Atualizar(It.IsAny<Ingrediente>()));
        _utensilios.Setup(r => r.Atualizar(It.IsAny<Utensilio>()));
        _movimentacoes.Setup(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default)).Returns(Task.CompletedTask);
        _movimentacoesUtensilio.Setup(r => r.AdicionarAsync(It.IsAny<MovimentacaoUtensilio>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.Atualizar(It.IsAny<EntradaMercadoria>()));
        _entradas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(
            new CancelarEntradaCommand(entrada.Id),
            CancellationToken.None);

        resultado.Status.Should().Be("Cancelada");
        ingrediente.EstoqueAtual.Should().Be(0m);
        utensilio.EstoqueAtual.Should().Be(0m);
        _utensilios.Verify(r => r.Atualizar(It.IsAny<Utensilio>()), Times.Once);
        _movimentacoesUtensilio.Verify(r => r.AdicionarAsync(It.IsAny<MovimentacaoUtensilio>(), default), Times.Once);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoEntradaNaoEncontrada()
    {
        var entradaId = Guid.NewGuid();
        _entradas.Setup(r => r.ObterPorIdComItensAsync(entradaId, default))
            .ReturnsAsync((EntradaMercadoria?)null);

        var acao = () => _handler.Handle(
            new CancelarEntradaCommand(entradaId),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*Entrada*");
    }

    [Fact]
    public async Task DeveLancarUnauthorized_QuandoOutroUsuarioTentaCancelar()
    {
        var donoDaEntrada = Guid.NewGuid();
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, donoDaEntrada);
        _currentUser.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _currentUser.Setup(u => u.Papel).Returns("Operador");
        _entradas.Setup(r => r.ObterPorIdComItensAsync(entrada.Id, default)).ReturnsAsync(entrada);

        var acao = () => _handler.Handle(new CancelarEntradaCommand(entrada.Id), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Acesso negado*");
    }

    [Fact]
    public async Task DeveCancelarEntrada_QuandoUsuarioEhAdmin()
    {
        var donoDaEntrada = Guid.NewGuid();
        var ingredienteId = Guid.NewGuid();
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, donoDaEntrada);
        entrada.AdicionarItem(ingredienteId, 5, 3m);

        var ingrediente = Ingrediente.Criar("Farinha", 1, 0, donoDaEntrada);
        ingrediente.AtualizarEstoque(5, donoDaEntrada);

        var entradaCancelada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, donoDaEntrada);
        entradaCancelada.AdicionarItem(ingredienteId, 5, 3m);
        entradaCancelada.Cancelar(_usuarioId);

        _currentUser.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _currentUser.Setup(u => u.Papel).Returns("Admin");
        _entradas.SetupSequence(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(entrada)
            .ReturnsAsync(entradaCancelada);
        _ingredientes.Setup(r => r.ObterPorIdAsync(ingredienteId, default)).ReturnsAsync(ingrediente);
        _ingredientes.Setup(r => r.Atualizar(It.IsAny<Ingrediente>()));
        _movimentacoes.Setup(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.Atualizar(It.IsAny<EntradaMercadoria>()));
        _entradas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(new CancelarEntradaCommand(entrada.Id), CancellationToken.None);

        resultado.Status.Should().Be("Cancelada");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoEntradaJaCancelada()
    {
        var fornecedorId = Guid.NewGuid();
        var ingredienteId = Guid.NewGuid();
        var entrada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entrada.AdicionarItem(ingredienteId, 5, 3m);
        entrada.Cancelar(_usuarioId);

        _entradas.Setup(r => r.ObterPorIdComItensAsync(entrada.Id, default)).ReturnsAsync(entrada);

        var acao = () => _handler.Handle(
            new CancelarEntradaCommand(entrada.Id),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*cancelada*");
    }
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `dotnet build src/CasaDiAna.API`
Expected: FAIL (o construtor de `CancelarEntradaCommandHandler` ainda tem 4 parâmetros; o teste já passa 6).

- [ ] **Step 3: Modificar `CancelarEntradaCommandHandler.cs`**

Substituir o arquivo por:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;
using CasaDiAna.Application.Entradas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Entradas.Commands.CancelarEntrada;

public class CancelarEntradaCommandHandler : IRequestHandler<CancelarEntradaCommand, EntradaMercadoriaDto>
{
    private readonly IEntradaMercadoriaRepository _entradas;
    private readonly IIngredienteRepository _ingredientes;
    private readonly IUtensilioRepository _utensilios;
    private readonly IMovimentacaoRepository _movimentacoes;
    private readonly IMovimentacaoUtensilioRepository _movimentacoesUtensilio;
    private readonly ICurrentUserService _currentUser;

    public CancelarEntradaCommandHandler(
        IEntradaMercadoriaRepository entradas,
        IIngredienteRepository ingredientes,
        IUtensilioRepository utensilios,
        IMovimentacaoRepository movimentacoes,
        IMovimentacaoUtensilioRepository movimentacoesUtensilio,
        ICurrentUserService currentUser)
    {
        _entradas = entradas;
        _ingredientes = ingredientes;
        _utensilios = utensilios;
        _movimentacoes = movimentacoes;
        _movimentacoesUtensilio = movimentacoesUtensilio;
        _currentUser = currentUser;
    }

    public async Task<EntradaMercadoriaDto> Handle(
        CancelarEntradaCommand request, CancellationToken cancellationToken)
    {
        var entrada = await _entradas.ObterPorIdComItensAsync(request.EntradaId, cancellationToken)
            ?? throw new DomainException("Entrada não encontrada.");

        if (entrada.CriadoPor != _currentUser.UsuarioId && _currentUser.Papel != "Admin")
            throw new UnauthorizedAccessException("Acesso negado.");

        entrada.Cancelar(_currentUser.UsuarioId);

        foreach (var item in entrada.Itens)
        {
            var ingrediente = await _ingredientes.ObterPorIdAsync(item.IngredienteId, cancellationToken)
                ?? throw new DomainException($"Ingrediente '{item.IngredienteId}' não encontrado.");

            var novoSaldo = ingrediente.EstoqueAtual - item.Quantidade;
            ingrediente.AtualizarEstoque(novoSaldo, _currentUser.UsuarioId);
            _ingredientes.Atualizar(ingrediente);

            var movimentacao = Movimentacao.Criar(
                item.IngredienteId,
                TipoMovimentacao.AjusteNegativo,
                item.Quantidade,
                ingrediente.EstoqueAtual,
                _currentUser.UsuarioId,
                referenciaTipo: "CancelamentoEntrada",
                referenciaId: entrada.Id);

            await _movimentacoes.AdicionarAsync(movimentacao, cancellationToken);
        }

        foreach (var item in entrada.ItensUtensilio)
        {
            var utensilio = await _utensilios.ObterPorIdAsync(item.UtensilioId, cancellationToken)
                ?? throw new DomainException($"Utensílio '{item.UtensilioId}' não encontrado.");

            var novoSaldo = utensilio.EstoqueAtual - item.Quantidade;
            utensilio.AtualizarEstoque(novoSaldo, _currentUser.UsuarioId);
            _utensilios.Atualizar(utensilio);

            var movimentacaoUtensilio = MovimentacaoUtensilio.Criar(
                item.UtensilioId,
                TipoMovimentacao.AjusteNegativo,
                item.Quantidade,
                utensilio.EstoqueAtual,
                _currentUser.UsuarioId,
                referenciaTipo: "CancelamentoEntrada",
                referenciaId: entrada.Id);

            await _movimentacoesUtensilio.AdicionarAsync(movimentacaoUtensilio, cancellationToken);
        }

        _entradas.Atualizar(entrada);
        await _entradas.SalvarAsync(cancellationToken);

        var salva = await _entradas.ObterPorIdComItensAsync(entrada.Id, cancellationToken);
        return RegistrarEntradaCommandHandler.ToDto(salva!);
    }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `dotnet build src/CasaDiAna.API`
Expected: Build succeeded.

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~Entradas"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/CasaDiAna.Application/Entradas/Commands/CancelarEntrada/CancelarEntradaCommandHandler.cs tests/CasaDiAna.Application.Tests/Entradas/CancelarEntradaCommandHandlerTests.cs
git commit -m "feat(entradas): cancelamento reverte estoque de utensilio tambem

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7 — Migration + verificação final do backend

**Files:**
- Create: `src/CasaDiAna.Infrastructure/Persistence/Migrations/<timestamp>_AddUtensilios.cs` (gerado pelo EF Core)
- Create: `src/CasaDiAna.Infrastructure/Persistence/Migrations/<timestamp>_AddUtensilios.Designer.cs` (gerado)
- Modify: `src/CasaDiAna.Infrastructure/Persistence/Migrations/AppDbContextModelSnapshot.cs` (gerado)

**Interfaces:**
- Consumes: todo o modelo definido nos Tasks 1–6. Nenhuma interface nova é produzida — esta task só materializa o schema.

- [ ] **Step 1: Gerar a migration**

Run: `dotnet ef migrations add AddUtensilios --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API`
Expected: `Done.` e os 3 arquivos listados acima criados/atualizados.

- [ ] **Step 2: Revisar a migration gerada**

Abrir o arquivo `<timestamp>_AddUtensilios.cs` e confirmar que `Up()` cria, nesta ordem (dependências primeiro): `categorias_utensilio`, `utensilios` (FK para `categorias_utensilio` e `unidades_medida`), `movimentacoes_utensilio` (FK para `utensilios`), `itens_entrada_utensilio` (FK para `entradas_mercadoria` e `utensilios`). Não deve haver `DropColumn`/`DropTable` em nenhuma tabela existente — é uma migration puramente aditiva. Se o EF gerar algo fora disso, revisar os Steps do Task 2 antes de continuar.

- [ ] **Step 3: Build + suíte completa**

Run: `dotnet build src/CasaDiAna.API`
Expected: Build succeeded, 0 erros, 0 warnings novos.

Run: `dotnet test tests/CasaDiAna.Application.Tests`
Expected: todos os testes passam (os ~132 pré-existentes + os novos de Utensílio/CategoriaUtensilio/Entradas mistas).

- [ ] **Step 4: Commit**

```bash
git add src/CasaDiAna.Infrastructure/Persistence/Migrations/
git commit -m "feat(utensilios): migration AddUtensilios

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8 — Frontend: tipos (`types/estoque.ts`)

**Files:**
- Modify: `frontend/src/types/estoque.ts`

**Interfaces:**
- Produces: `CategoriaUtensilio`, `CriarCategoriaUtensilioInput`, `AtualizarCategoriaUtensilioInput`, `UtensilioResumo`, `Utensilio`, `CriarUtensilioInput`, `AtualizarUtensilioInput`, `UtensilioFormValues`, `ItemEntradaUtensilio`, `ItemEntradaUtensilioInput`. Modifica `EntradaMercadoria` (campo `itensUtensilio`), `RegistrarEntradaInput` (campo opcional `itensUtensilio`), `EntradaFormValues` (linha de item ganha `tipo`/`itemId`).

- [ ] **Step 1: Adicionar os tipos de Categoria de Utensílio e Utensílio**

Depois do bloco `// ─── Ingrediente (detalhe / edição) ──` e seus tipos relacionados (depois de `IngredienteFormValues`), adicionar:

```typescript
// ─── Categoria de Utensílio ────────────────────────────────────────────────────
export interface CategoriaUtensilio {
  id: string
  nome: string
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface CriarCategoriaUtensilioInput {
  nome: string
}

export interface AtualizarCategoriaUtensilioInput {
  id: string
  nome: string
}

// ─── Utensílio (listagem) ──────────────────────────────────────────────────────
export interface UtensilioResumo {
  id: string
  nome: string
  codigoInterno: string | null
  categoriaNome: string | null
  unidadeMedidaCodigo: string
  estoqueAtual: number
  estoqueMinimo: number
  estaBaixoDoMinimo: boolean
  ativo: boolean
}

// ─── Utensílio (detalhe / edição) ──────────────────────────────────────────────
export interface Utensilio {
  id: string
  nome: string
  codigoInterno: string | null
  categoriaUtensilioId: string | null
  categoriaNome: string | null
  unidadeMedidaId: number
  unidadeMedidaCodigo: string
  estoqueAtual: number
  estoqueMinimo: number
  estoqueMaximo: number | null
  estaBaixoDoMinimo: boolean
  custoUnitario: number | null
  ativo: boolean
  atualizadoEm: string
}

export interface CriarUtensilioInput {
  nome: string
  unidadeMedidaId: number
  estoqueMinimo: number
  codigoInterno?: string | null
  categoriaUtensilioId?: string | null
  estoqueMaximo?: number | null
}

export interface AtualizarUtensilioInput extends CriarUtensilioInput {
  id: string
}

export interface UtensilioFormValues {
  nome: string
  codigoInterno: string
  categoriaUtensilioId: string
  unidadeMedidaId: string
  estoqueMinimo: number | undefined
  estoqueMaximo: number | undefined
}
```

- [ ] **Step 2: Modificar os tipos de Entrada de Mercadoria para suportar utensílio**

Depois da interface `ItemEntrada` existente, adicionar:

```typescript
export interface ItemEntradaUtensilio {
  id: string
  utensilioId: string
  utensilioNome: string
  unidadeMedidaCodigo: string
  quantidade: number
  custoUnitario: number
  custoTotal: number
}
```

Na interface `EntradaMercadoria` existente, adicionar o campo `itensUtensilio` ao final (depois de `itens: ItemEntrada[]`):

```typescript
  itens: ItemEntrada[]
  itensUtensilio: ItemEntradaUtensilio[]
```

Depois da interface `ItemEntradaInput` existente, adicionar:

```typescript
export interface ItemEntradaUtensilioInput {
  utensilioId: string
  quantidade: number
  custoUnitario: number
}
```

Na interface `RegistrarEntradaInput` existente, adicionar o campo opcional (depois de `itens: ItemEntradaInput[]`):

```typescript
  itens: ItemEntradaInput[]
  itensUtensilio?: ItemEntradaUtensilioInput[]
```

- [ ] **Step 3: Modificar `EntradaFormValues` para suportar tipo por linha**

Substituir a interface `EntradaFormValues` existente por:

```typescript
export interface EntradaFormValues {
  fornecedorId: string
  dataEntrada: string
  numeroNotaFiscal: string
  recebidoPor: string
  observacoes: string
  itens: {
    tipo: 'ingrediente' | 'utensilio'
    itemId: string
    quantidade: number | undefined
    custoUnitario: number | undefined
  }[]
  temBoleto: boolean
  dataVencimentoBoleto: string
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit` (dentro de `frontend/`)
Expected: erros apontando os consumidores de `EntradaFormValues`/`EntradaMercadoria`/`ItemEntradaInput` que ainda usam a forma antiga (`EntradaFormPage.tsx`, `entradasService.ts` indiretamente) — esperado, corrigido no Task 11. Nenhum erro deve vir de `types/estoque.ts` em si.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/estoque.ts
git commit -m "feat(utensilios): tipos de Utensilio, CategoriaUtensilio e entrada mista

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9 — Frontend: módulo Categorias de Utensílio

**Files:**
- Create: `frontend/src/features/estoque/categorias-utensilio/services/categoriasUtensilioService.ts`
- Create: `frontend/src/features/estoque/categorias-utensilio/hooks/useCategoriasUtensilio.ts`
- Create: `frontend/src/features/estoque/categorias-utensilio/components/ModalCategoriaUtensilio.tsx` (copiado de `ModalCategoria.tsx`)
- Create: `frontend/src/features/estoque/categorias-utensilio/components/TabelaCategoriasUtensilio.tsx` (copiado de `TabelaCategorias.tsx`)
- Create: `frontend/src/features/estoque/categorias-utensilio/components/FiltrosCategoriasUtensilio.tsx` (copiado de `FiltrosCategorias.tsx`)
- Create: `frontend/src/features/estoque/categorias-utensilio/pages/CategoriasUtensilioPage.tsx`
- Modify: `frontend/src/routes/AppRoutes.tsx`
- Modify: `frontend/src/components/layout/Sidebar.tsx`

**Interfaces:**
- Consumes: `CategoriaUtensilio`, `CriarCategoriaUtensilioInput`, `AtualizarCategoriaUtensilioInput` (Task 8).
- Produces: rota `/estoque/categorias-utensilio`; `useCategoriasUtensilio()` retornando `{ categorias, loading, erro, recarregar, desativar }` (consumido pelo Task 10).

- [ ] **Step 1: Copiar e adaptar os componentes decorativos (shell)**

Todos os três componentes abaixo são cópias quase idênticas dos equivalentes de `features/estoque/categorias/` — apenas o tipo e alguns textos mudam. Rodar (dentro de `frontend/`):

```bash
mkdir -p src/features/estoque/categorias-utensilio/components src/features/estoque/categorias-utensilio/hooks src/features/estoque/categorias-utensilio/pages src/features/estoque/categorias-utensilio/services

cp src/features/estoque/categorias/components/ModalCategoria.tsx src/features/estoque/categorias-utensilio/components/ModalCategoriaUtensilio.tsx
sed -i \
  -e "s/CategoriaIngrediente/CategoriaUtensilio/g" \
  -e "s/ModalCategoria/ModalCategoriaUtensilio/g" \
  -e "s/modal-categoria-titulo/modal-categoria-utensilio-titulo/g" \
  -e "s/Ex: Laticínios/Ex: Limpeza/g" \
  src/features/estoque/categorias-utensilio/components/ModalCategoriaUtensilio.tsx

cp src/features/estoque/categorias/components/TabelaCategorias.tsx src/features/estoque/categorias-utensilio/components/TabelaCategoriasUtensilio.tsx
sed -i \
  -e "s/CategoriaIngrediente/CategoriaUtensilio/g" \
  -e "s/TabelaCategorias/TabelaCategoriasUtensilio/g" \
  -e "s/organizar os ingredientes/organizar os utensílios/g" \
  src/features/estoque/categorias-utensilio/components/TabelaCategoriasUtensilio.tsx

cp src/features/estoque/categorias/components/FiltrosCategorias.tsx src/features/estoque/categorias-utensilio/components/FiltrosCategoriasUtensilio.tsx
sed -i \
  -e "s/FiltrosCategorias/FiltrosCategoriasUtensilio/g" \
  -e "s/busca-categoria/busca-categoria-utensilio/g" \
  src/features/estoque/categorias-utensilio/components/FiltrosCategoriasUtensilio.tsx
```

Depois de rodar, abrir os 3 arquivos gerados e confirmar visualmente que não restou nenhuma ocorrência de `CategoriaIngrediente`/`ModalCategoria`/`TabelaCategorias` (sem o sufixo `Utensilio`) nem de `ingrediente(s)` no texto visível — `grep -n "Ingrediente\|ingrediente" src/features/estoque/categorias-utensilio/components/*.tsx` deve não retornar nada.

- [ ] **Step 2: `categoriasUtensilioService.ts`**

Criar `frontend/src/features/estoque/categorias-utensilio/services/categoriasUtensilioService.ts`:

```typescript
import api from '@/lib/api'
import type {
  ApiResponse,
  CategoriaUtensilio,
  CriarCategoriaUtensilioInput,
  AtualizarCategoriaUtensilioInput,
} from '@/types/estoque'

export const categoriasUtensilioService = {
  listar: async (apenasAtivos = true): Promise<CategoriaUtensilio[]> => {
    const resp = await api.get<ApiResponse<CategoriaUtensilio[]>>(
      `/categorias-utensilio?apenasAtivos=${apenasAtivos}`
    )
    return resp.data.dados
  },

  criar: async (input: CriarCategoriaUtensilioInput): Promise<CategoriaUtensilio> => {
    const resp = await api.post<ApiResponse<CategoriaUtensilio>>('/categorias-utensilio', input)
    return resp.data.dados
  },

  atualizar: async (input: AtualizarCategoriaUtensilioInput): Promise<CategoriaUtensilio> => {
    const { id, ...body } = input
    const resp = await api.put<ApiResponse<CategoriaUtensilio>>(`/categorias-utensilio/${id}`, body)
    return resp.data.dados
  },

  desativar: async (id: string): Promise<void> => {
    await api.delete(`/categorias-utensilio/${id}`)
  },
}
```

- [ ] **Step 3: `useCategoriasUtensilio.ts`**

Criar `frontend/src/features/estoque/categorias-utensilio/hooks/useCategoriasUtensilio.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { categoriasUtensilioService } from '../services/categoriasUtensilioService'
import type { CategoriaUtensilio } from '@/types/estoque'

export function useCategoriasUtensilio() {
  const [categorias, setCategorias] = useState<CategoriaUtensilio[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await categoriasUtensilioService.listar()
      setCategorias(data)
    } catch {
      setErro('Erro ao carregar categorias.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const desativar = useCallback(async (id: string) => {
    await categoriasUtensilioService.desativar(id)
    setCategorias(prev => prev.filter(c => c.id !== id))
  }, [])

  return { categorias, loading, erro, recarregar, desativar }
}
```

- [ ] **Step 4: `CategoriasUtensilioPage.tsx`**

Criar `frontend/src/features/estoque/categorias-utensilio/pages/CategoriasUtensilioPage.tsx`:

```tsx
import { useState, useMemo } from 'react'
import { PlusIcon } from '@heroicons/react/20/solid'
import { useCategoriasUtensilio } from '../hooks/useCategoriasUtensilio'
import { categoriasUtensilioService } from '../services/categoriasUtensilioService'
import { useAuthStore } from '@/store/authStore'
import { TabelaCategoriasUtensilio } from '../components/TabelaCategoriasUtensilio'
import { FiltrosCategoriasUtensilio } from '../components/FiltrosCategoriasUtensilio'
import { ModalCategoriaUtensilio } from '../components/ModalCategoriaUtensilio'
import { ModalDesativar } from '@/components/ui/ModalDesativar'
import { Toast } from '@/components/ui/Toast'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import type { CategoriaUtensilio } from '@/types/estoque'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function CategoriasUtensilioPage() {
  const { temPapel } = useAuthStore()
  const { categorias, loading, erro, recarregar, desativar } = useCategoriasUtensilio()
  const podeEditar = temPapel(...PAPEIS_EDICAO)

  const [busca, setBusca] = useState('')

  const filtradas = useMemo(() => {
    const termo = busca.toLowerCase().trim()
    if (!termo) return categorias
    return categorias.filter(c => c.nome.toLowerCase().includes(termo))
  }, [categorias, busca])

  const [modalAberto, setModalAberto] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaUtensilio | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [paraDesativar, setParaDesativar] = useState<CategoriaUtensilio | null>(null)
  const [desativando, setDesativando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const abrirCriar = () => { setCategoriaEditando(null); setModalAberto(true) }
  const abrirEditar = (cat: CategoriaUtensilio) => { setCategoriaEditando(cat); setModalAberto(true) }
  const fecharModal = () => { setModalAberto(false); setCategoriaEditando(null) }

  const handleSalvar = async (nome: string) => {
    setSalvando(true)
    try {
      if (categoriaEditando) {
        await categoriasUtensilioService.atualizar({ id: categoriaEditando.id, nome })
        setToast({ tipo: 'sucesso', mensagem: 'Categoria atualizada com sucesso.' })
      } else {
        await categoriasUtensilioService.criar({ nome })
        setToast({ tipo: 'sucesso', mensagem: 'Categoria criada com sucesso.' })
      }
      fecharModal()
      recarregar()
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar categoria.' })
    } finally {
      setSalvando(false)
    }
  }

  const handleDesativar = async () => {
    if (!paraDesativar) return
    setDesativando(true)
    try {
      await desativar(paraDesativar.id)
      setParaDesativar(null)
      setToast({ tipo: 'sucesso', mensagem: 'Categoria desativada.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao desativar categoria.' })
    } finally {
      setDesativando(false)
    }
  }

  return (
    <div className="ada-page">

      <PageHeader
        titulo="Categorias de Utensílio"
        breadcrumb={['Cadastros', 'Categorias de Utensílio']}
        subtitulo={loading ? 'Carregando…' : `${categorias.length} categoria${categorias.length !== 1 ? 's' : ''} cadastrada${categorias.length !== 1 ? 's' : ''}`}
        actions={podeEditar ? (
          <button type="button" onClick={abrirCriar} className="btn-primary">
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Nova Categoria
          </button>
        ) : undefined}
      />

      <FiltrosCategoriasUtensilio
        busca={busca}
        onBuscaChange={setBusca}
      />

      {loading && <SkeletonTable colunas={3} linhas={4} />}
      {!loading && erro && (
        <div className="state-error" role="alert">{erro}</div>
      )}
      {!loading && !erro && (
        <TabelaCategoriasUtensilio
          categorias={filtradas}
          podeEditar={podeEditar}
          onEditar={abrirEditar}
          onDesativar={setParaDesativar}
          busca={busca}
        />
      )}

      {modalAberto && (
        <ModalCategoriaUtensilio
          categoria={categoriaEditando}
          salvando={salvando}
          onSalvar={handleSalvar}
          onFechar={fecharModal}
        />
      )}
      {paraDesativar && (
        <ModalDesativar
          nome={paraDesativar.nome}
          entidade="categoria"
          loading={desativando}
          onConfirmar={handleDesativar}
          onCancelar={() => setParaDesativar(null)}
        />
      )}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
```

- [ ] **Step 5: Rota**

Em `frontend/src/routes/AppRoutes.tsx`, depois do import `import { CategoriasPage } from '@/features/estoque/categorias/pages/CategoriasPage'`, adicionar:

```typescript
import { CategoriasUtensilioPage } from '@/features/estoque/categorias-utensilio/pages/CategoriasUtensilioPage'
```

Depois da linha `<Route path="/estoque/categorias" element={<CategoriasPage />} />`, adicionar:

```tsx
          <Route path="/estoque/categorias-utensilio" element={<CategoriasUtensilioPage />} />
```

- [ ] **Step 6: Item na Sidebar**

Em `frontend/src/components/layout/Sidebar.tsx`, adicionar `WrenchScrewdriverIcon` à lista de imports de `@heroicons/react/24/outline` (junto dos demais ícones já importados).

Depois da linha `{ label: 'Categorias', href: '/estoque/categorias', icon: TagIcon, iconColor: '#60A5FA' },` no grupo `'Cadastros'`, adicionar:

```tsx
      { label: 'Utensílios',          href: '/estoque/utensilios',          icon: WrenchScrewdriverIcon, iconColor: '#60A5FA' },
      { label: 'Categorias de Utensílio', href: '/estoque/categorias-utensilio', icon: TagIcon,          iconColor: '#60A5FA' },
```

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit` (dentro de `frontend/`)
Expected: 0 erros relacionados a este módulo (o item "Utensílios" referencia uma rota que só é criada no Task 10 — a entrada na Sidebar não quebra o build, pois `href` é só uma string).

- [ ] **Step 8: Commit**

```bash
git add frontend/src/features/estoque/categorias-utensilio/ frontend/src/routes/AppRoutes.tsx frontend/src/components/layout/Sidebar.tsx
git commit -m "feat(utensilios): modulo Categorias de Utensilio (frontend)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 10 — Frontend: módulo Utensílios (cadastro)

**Files:**
- Create: `frontend/src/features/estoque/utensilios/services/utensiliosService.ts`
- Create: `frontend/src/features/estoque/utensilios/hooks/useUtensilios.ts`
- Create: `frontend/src/features/estoque/utensilios/hooks/useUtensilioForm.ts`
- Create: `frontend/src/features/estoque/utensilios/components/TabelaUtensilios.tsx` (copiado de `TabelaIngredientes.tsx`)
- Create: `frontend/src/features/estoque/utensilios/components/FiltrosUtensilios.tsx` (copiado de `FiltrosIngredientes.tsx`)
- Create: `frontend/src/features/estoque/utensilios/components/ConfirmacaoUtensilioModal.tsx` (copiado de `ConfirmacaoIngredienteModal.tsx`)
- Create: `frontend/src/features/estoque/utensilios/pages/UtensiliosPage.tsx`
- Create: `frontend/src/features/estoque/utensilios/pages/UtensilioFormPage.tsx`
- Modify: `frontend/src/routes/AppRoutes.tsx`

**Interfaces:**
- Consumes: `Utensilio`, `UtensilioResumo`, `CriarUtensilioInput`, `AtualizarUtensilioInput`, `UtensilioFormValues` (Task 8); `useCategoriasUtensilio()` (Task 9).
- Produces: `utensiliosService` (consumido pelo Task 11, no formulário de Entrada); rotas `/estoque/utensilios`, `/estoque/utensilios/novo`, `/estoque/utensilios/:id/editar`.

- [ ] **Step 1: Copiar e adaptar os componentes decorativos (shell)**

Rodar (dentro de `frontend/`):

```bash
mkdir -p src/features/estoque/utensilios/components src/features/estoque/utensilios/hooks src/features/estoque/utensilios/pages src/features/estoque/utensilios/services

cp src/features/estoque/ingredientes/components/TabelaIngredientes.tsx src/features/estoque/utensilios/components/TabelaUtensilios.tsx
sed -i \
  -e "s/IngredienteResumo/UtensilioResumo/g" \
  -e "s/TabelaIngredientes/TabelaUtensilios/g" \
  -e "s/ingredientes/utensilios/g" \
  -e "s/\bing\b/ute/g" \
  -e "s/Nenhum ingrediente encontrado/Nenhum utensílio encontrado/g" \
  -e "s/cadastre um novo ingrediente/cadastre um novo utensílio/g" \
  src/features/estoque/utensilios/components/TabelaUtensilios.tsx

cp src/features/estoque/ingredientes/components/FiltrosIngredientes.tsx src/features/estoque/utensilios/components/FiltrosUtensilios.tsx
sed -i \
  -e "s/CategoriaIngrediente/CategoriaUtensilio/g" \
  -e "s/FiltrosIngredientes/FiltrosUtensilios/g" \
  -e "s/busca-ingrediente/busca-utensilio/g" \
  -e "s/Buscar ingrediente/Buscar utensílio/g" \
  src/features/estoque/utensilios/components/FiltrosUtensilios.tsx

cp src/features/estoque/ingredientes/components/ConfirmacaoIngredienteModal.tsx src/features/estoque/utensilios/components/ConfirmacaoUtensilioModal.tsx
sed -i \
  -e "s/DadosConfirmacaoIngrediente/DadosConfirmacaoUtensilio/g" \
  -e "s/ConfirmacaoIngredienteModal/ConfirmacaoUtensilioModal/g" \
  -e "s/ingredienteNome/utensilioNome/g" \
  -e "s/onVerIngredientes/onVerUtensilios/g" \
  -e "s/Ingrediente {dados.modo}/Utensílio {dados.modo}/g" \
  -e "s/Ver Ingredientes/Ver Utensílios/g" \
  src/features/estoque/utensilios/components/ConfirmacaoUtensilioModal.tsx
```

Depois de rodar, confirmar que não restou nenhuma ocorrência de `Ingrediente`/`ingrediente` nos 3 arquivos: `grep -n "Ingrediente\|ingrediente" src/features/estoque/utensilios/components/*.tsx` deve não retornar nada.

- [ ] **Step 2: `utensiliosService.ts`**

Criar `frontend/src/features/estoque/utensilios/services/utensiliosService.ts`:

```typescript
import api from '@/lib/api'
import type {
  ApiResponse,
  CriarUtensilioInput,
  AtualizarUtensilioInput,
  Utensilio,
  UtensilioResumo,
} from '@/types/estoque'

const BASE = '/utensilios'

export const utensiliosService = {
  listar: async (apenasAtivos = true): Promise<UtensilioResumo[]> => {
    const resp = await api.get<ApiResponse<UtensilioResumo[]>>(
      `${BASE}?apenasAtivos=${apenasAtivos}`
    )
    return resp.data.dados
  },

  obterPorId: async (id: string): Promise<Utensilio> => {
    const resp = await api.get<ApiResponse<Utensilio>>(`${BASE}/${id}`)
    return resp.data.dados
  },

  criar: async (input: CriarUtensilioInput): Promise<Utensilio> => {
    const resp = await api.post<ApiResponse<Utensilio>>(BASE, input)
    return resp.data.dados
  },

  atualizar: async ({ id, ...body }: AtualizarUtensilioInput): Promise<Utensilio> => {
    const resp = await api.put<ApiResponse<Utensilio>>(`${BASE}/${id}`, body)
    return resp.data.dados
  },

  desativar: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },
}
```

- [ ] **Step 3: `useUtensilios.ts`**

Criar `frontend/src/features/estoque/utensilios/hooks/useUtensilios.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { utensiliosService } from '../services/utensiliosService'
import type { UtensilioResumo } from '@/types/estoque'

interface UseUtensiliosOptions {
  apenasAtivos?: boolean
}

export function useUtensilios({ apenasAtivos = true }: UseUtensiliosOptions = {}) {
  const [utensilios, setUtensilios] = useState<UtensilioResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const dados = await utensiliosService.listar(apenasAtivos)
      setUtensilios(dados)
    } catch {
      setErro('Não foi possível carregar os utensílios.')
    } finally {
      setLoading(false)
    }
  }, [apenasAtivos])

  useEffect(() => {
    carregar()
  }, [carregar])

  const desativar = useCallback(async (id: string) => {
    await utensiliosService.desativar(id)
    await carregar()
  }, [carregar])

  return { utensilios, loading, erro, recarregar: carregar, desativar }
}
```

- [ ] **Step 4: `useUtensilioForm.ts`**

Criar `frontend/src/features/estoque/utensilios/hooks/useUtensilioForm.ts`:

```typescript
import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { utensiliosService } from '../services/utensiliosService'
import type { Utensilio, UtensilioFormValues } from '@/types/estoque'

const numeroObrigatorio = () =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().nonnegative('Deve ser ≥ 0')
  )

const numeroOpcionalPositivo = z.preprocess(
  (v) => (v === '' || v == null ? undefined : Number(v)),
  z.number().positive('Deve ser maior que zero').optional()
)

export const utensilioSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(150, 'Nome deve ter no máximo 150 caracteres'),
  codigoInterno: z.string().max(30, 'Máximo 30 caracteres').optional().or(z.literal('')),
  categoriaUtensilioId: z.string().uuid('Categoria inválida').optional().or(z.literal('')),
  unidadeMedidaId: z
    .string()
    .min(1, 'Unidade de medida é obrigatória')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Selecione uma unidade'),
  estoqueMinimo: numeroObrigatorio(),
  estoqueMaximo: numeroOpcionalPositivo,
})

type UtensilioSchema = z.infer<typeof utensilioSchema>

const defaultValues: UtensilioFormValues = {
  nome: '',
  codigoInterno: '',
  categoriaUtensilioId: '',
  unidadeMedidaId: '',
  estoqueMinimo: 0,
  estoqueMaximo: undefined,
}

export function utensilioParaForm(u: Utensilio): UtensilioFormValues {
  return {
    nome: u.nome,
    codigoInterno: u.codigoInterno ?? '',
    categoriaUtensilioId: u.categoriaUtensilioId ?? '',
    unidadeMedidaId: String(u.unidadeMedidaId),
    estoqueMinimo: u.estoqueMinimo,
    estoqueMaximo: u.estoqueMaximo ?? undefined,
  }
}

function formParaInput(values: UtensilioSchema) {
  return {
    nome: values.nome,
    unidadeMedidaId: Number(values.unidadeMedidaId),
    estoqueMinimo: values.estoqueMinimo as number,
    codigoInterno: values.codigoInterno || null,
    categoriaUtensilioId: values.categoriaUtensilioId || null,
    estoqueMaximo: values.estoqueMaximo ?? null,
  }
}

interface UseUtensilioFormOptions {
  utensilioExistente?: Utensilio | null
}

export function useUtensilioForm({ utensilioExistente }: UseUtensilioFormOptions = {}) {
  const form = useForm<UtensilioFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(utensilioSchema) as any,
    defaultValues: utensilioExistente
      ? utensilioParaForm(utensilioExistente)
      : defaultValues,
  })

  const salvar = useCallback(
    async (values: UtensilioFormValues): Promise<Utensilio> => {
      const input = formParaInput(values as UtensilioSchema)

      if (utensilioExistente) {
        return utensiliosService.atualizar({ id: utensilioExistente.id, ...input })
      }
      return utensiliosService.criar(input)
    },
    [utensilioExistente]
  )

  return { form, salvar }
}
```

- [ ] **Step 5: `UtensiliosPage.tsx`**

Criar `frontend/src/features/estoque/utensilios/pages/UtensiliosPage.tsx`:

```tsx
import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { useUtensilios } from '../hooks/useUtensilios'
import { useCategoriasUtensilio } from '@/features/estoque/categorias-utensilio/hooks/useCategoriasUtensilio'
import { useAuthStore } from '@/store/authStore'
import { TabelaUtensilios } from '../components/TabelaUtensilios'
import { FiltrosUtensilios } from '../components/FiltrosUtensilios'
import { ModalDesativar } from '@/components/ui/ModalDesativar'
import { Paginacao } from '@/components/ui/Paginacao'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import type { UtensilioResumo } from '@/types/estoque'

const ITENS_POR_PAGINA = 10
const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function UtensiliosPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { utensilios, loading, erro, desativar } = useUtensilios()
  const { categorias } = useCategoriasUtensilio()

  const [busca, setBusca] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [apenasAbaixoMinimo, setApenasAbaixoMinimo] = useState(false)
  const [paginaAtual, setPaginaAtual] = useState(1)

  const [paraDesativar, setParaDesativar] = useState<UtensilioResumo | null>(null)
  const [desativando, setDesativando] = useState(false)

  const podeEditar = temPapel(...PAPEIS_EDICAO)
  const podeDesativar = temPapel(...PAPEIS_EDICAO)

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim()
    return utensilios.filter(ute => {
      if (termo && !ute.nome.toLowerCase().includes(termo)) return false
      if (categoriaId) {
        const cat = categorias.find(c => c.id === categoriaId)
        if (cat && ute.categoriaNome !== cat.nome) return false
      }
      if (apenasAbaixoMinimo && !ute.estaBaixoDoMinimo) return false
      return true
    })
  }, [utensilios, busca, categoriaId, apenasAbaixoMinimo, categorias])

  const handleBusca = (v: string) => { setBusca(v); setPaginaAtual(1) }
  const handleCategoria = (v: string) => { setCategoriaId(v); setPaginaAtual(1) }
  const handleAbaixoMinimo = (v: boolean) => { setApenasAbaixoMinimo(v); setPaginaAtual(1) }

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA))
  const paginados = filtrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  )

  const confirmarDesativacao = useCallback(async () => {
    if (!paraDesativar) return
    setDesativando(true)
    try {
      await desativar(paraDesativar.id)
      setParaDesativar(null)
    } finally {
      setDesativando(false)
    }
  }, [paraDesativar, desativar])

  return (
    <div className="ada-page max-w-[1280px] mx-auto">

      <PageHeader
        titulo="Utensílios"
        breadcrumb={['Cadastros', 'Utensílios']}
        subtitulo={loading ? 'Carregando…' : `${utensilios.length} utensílio${utensilios.length !== 1 ? 's' : ''} cadastrado${utensilios.length !== 1 ? 's' : ''}`}
        actions={podeEditar ? (
          <button onClick={() => navigate('/estoque/utensilios/novo')} className="btn-primary">
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Novo Utensílio
          </button>
        ) : undefined}
      />

      <FiltrosUtensilios
        busca={busca}
        onBuscaChange={handleBusca}
        categoriaId={categoriaId}
        onCategoriaChange={handleCategoria}
        apenasAbaixoMinimo={apenasAbaixoMinimo}
        onApenasAbaixoMinimoChange={handleAbaixoMinimo}
        categorias={categorias}
      />

      {loading && <SkeletonTable colunas={6} linhas={5} />}

      {!loading && erro && (
        <div
          className="rounded-xl px-5 py-4 text-sm"
          style={{ background: 'var(--ada-error-bg)', border: '1px solid var(--ada-error-border)', color: '#DC2626' }}
          role="alert"
        >
          {erro}
        </div>
      )}

      {!loading && !erro && (
        <div>
          <TabelaUtensilios
            utensilios={paginados}
            podeEditar={podeEditar}
            podeDesativar={podeDesativar}
            onEditar={id => navigate(`/estoque/utensilios/${id}/editar`)}
            onDesativar={setParaDesativar}
          />
          <Paginacao
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            totalItens={filtrados.length}
            itensPorPagina={ITENS_POR_PAGINA}
            onPaginaChange={setPaginaAtual}
          />
        </div>
      )}

      {paraDesativar && (
        <ModalDesativar
          nome={paraDesativar.nome}
          entidade="utensílio"
          loading={desativando}
          onConfirmar={confirmarDesativacao}
          onCancelar={() => setParaDesativar(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 6: `UtensilioFormPage.tsx`**

Criar `frontend/src/features/estoque/utensilios/pages/UtensilioFormPage.tsx`:

```tsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/20/solid'
import { PageHeader } from '@/components/ui/PageHeader'
import { useUtensilioForm, utensilioParaForm } from '../hooks/useUtensilioForm'
import { utensiliosService } from '../services/utensiliosService'
import { useCategoriasUtensilio } from '@/features/estoque/categorias-utensilio/hooks/useCategoriasUtensilio'
import { useUnidadesMedida } from '@/features/estoque/unidades/hooks/useUnidadesMedida'
import { CampoTexto } from '@/components/form/CampoTexto'
import { SelectCampo } from '@/components/form/SelectCampo'
import { Toast } from '@/components/ui/Toast'
import { ConfirmacaoUtensilioModal, type DadosConfirmacaoUtensilio } from '../components/ConfirmacaoUtensilioModal'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { LoadingState } from '@/components/ui/LoadingState'
import type { Utensilio } from '@/types/estoque'

export function UtensilioFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const modoEdicao = !!id

  const [utensilio, setUtensilio] = useState<Utensilio | null>(null)
  const [carregando, setCarregando] = useState(modoEdicao)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    utensiliosService
      .obterPorId(id)
      .then(setUtensilio)
      .catch(() => setErroCarregamento('Utensílio não encontrado.'))
      .finally(() => setCarregando(false))
  }, [id])

  const { categorias } = useCategoriasUtensilio()
  const { unidades } = useUnidadesMedida()

  const [unidadeAtual, setUnidadeAtual] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [confirma, setConfirma] = useState<DadosConfirmacaoUtensilio | null>(null)

  const fecharToast = useCallback(() => setToast(null), [])

  const { form, salvar } = useUtensilioForm({ utensilioExistente: utensilio })
  const { register, handleSubmit, watch, reset, formState: { errors } } = form

  useEffect(() => {
    if (utensilio) {
      reset(utensilioParaForm(utensilio))
    }
  }, [utensilio, reset])

  const unidadeSelecionadaId = watch('unidadeMedidaId')
  useEffect(() => {
    const unidade = unidades.find(u => String(u.id) === unidadeSelecionadaId)
    setUnidadeAtual(unidade?.codigo ?? '')
  }, [unidadeSelecionadaId, unidades])

  const onSubmit = handleSubmit(async (values) => {
    setSalvando(true)
    try {
      await salvar(values)
      setConfirma({
        utensilioNome: values.nome,
        unidade: unidadeAtual,
        modo: modoEdicao ? 'atualizado' : 'criado',
      })
    } catch (e: unknown) {
      const erros = (e as { response?: { data?: { erros?: string[] } } })?.response?.data?.erros
      setToast({
        tipo: 'erro',
        mensagem: erros?.length ? erros.join(' ') : 'Erro ao salvar utensílio.',
      })
    } finally {
      setSalvando(false)
    }
  })

  if (carregando) {
    return (
      <div className="ada-page">
        <LoadingState mensagem="Carregando utensílio…" />
      </div>
    )
  }

  if (erroCarregamento) {
    return (
      <div className="ada-page">
        <div className="state-error" role="alert">
          {erroCarregamento}
        </div>
        <Link to="/estoque/utensilios" className="mt-4 inline-flex items-center gap-1 text-sm" style={{ color: 'var(--ada-muted)' }}>
          <ChevronLeftIcon className="h-4 w-4" />
          Voltar para Utensílios
        </Link>
      </div>
    )
  }

  return (
    <div className="ada-page max-w-3xl">
      {confirma && (
        <ConfirmacaoUtensilioModal
          aberto
          dados={confirma}
          onFechar={() => { setConfirma(null); navigate('/estoque/utensilios') }}
          onVerUtensilios={() => { setConfirma(null); navigate('/estoque/utensilios') }}
        />
      )}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={fecharToast} />}

      <PageHeader
        titulo={modoEdicao ? `Editar: ${utensilio?.nome ?? ''}` : 'Novo Utensílio'}
        breadcrumb={['Cadastros', 'Utensílios']}
      />

      <form onSubmit={onSubmit}>
        <FormCard>
          <FormSection titulo="Identificação" primeiro />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <CampoTexto
                label="Nome"
                obrigatorio
                placeholder="Ex: Detergente Neutro"
                {...register('nome')}
                erro={errors.nome?.message}
              />
            </div>
            <div className="col-span-1">
              <CampoTexto
                label="Código Interno"
                placeholder="Ex: DET-001"
                {...register('codigoInterno')}
                erro={errors.codigoInterno?.message}
              />
            </div>
          </div>

          <FormSection titulo="Classificação" />
          <div className="grid grid-cols-2 gap-4">
            <SelectCampo
              label="Categoria"
              placeholderOpcao="Sem categoria"
              opcoes={categorias.map(c => ({ valor: c.id, rotulo: c.nome }))}
              {...register('categoriaUtensilioId')}
              erro={errors.categoriaUtensilioId?.message}
            />
            <SelectCampo
              label="Unidade de Medida"
              obrigatorio
              placeholderOpcao="Selecione…"
              opcoes={unidades.map(u => ({ valor: u.id, rotulo: `${u.codigo} — ${u.descricao}` }))}
              {...register('unidadeMedidaId')}
              erro={errors.unidadeMedidaId?.message}
            />
          </div>

          <FormSection titulo="Controle de Estoque" />
          <div className="grid grid-cols-2 gap-4">
            <CampoTexto
              label="Estoque Mínimo"
              obrigatorio
              type="number"
              step="0.001"
              min="0"
              placeholder="0"
              sufixo={unidadeAtual}
              {...register('estoqueMinimo')}
              erro={errors.estoqueMinimo?.message}
            />
            <CampoTexto
              label="Estoque Máximo"
              type="number"
              step="0.001"
              min="0"
              placeholder="Opcional"
              sufixo={unidadeAtual}
              {...register('estoqueMaximo')}
              erro={errors.estoqueMaximo?.message}
            />
          </div>

          <FormActions
            salvando={salvando}
            labelSalvar="Salvar Utensílio"
            onCancelar={() => navigate('/estoque/utensilios')}
          />
        </FormCard>
      </form>
    </div>
  )
}
```

- [ ] **Step 7: Rotas**

Em `frontend/src/routes/AppRoutes.tsx`, depois do import `import { IngredienteFormPage } from '@/features/estoque/ingredientes/pages/IngredienteFormPage'`, adicionar:

```typescript
import { UtensiliosPage } from '@/features/estoque/utensilios/pages/UtensiliosPage'
import { UtensilioFormPage } from '@/features/estoque/utensilios/pages/UtensilioFormPage'
```

Depois da linha `<Route path="/estoque/categorias" element={<CategoriasPage />} />` (já modificada no Task 9 com a rota de categorias de utensílio), adicionar:

```tsx
          <Route path="/estoque/utensilios" element={<UtensiliosPage />} />
          <Route path="/estoque/utensilios/novo" element={<UtensilioFormPage />} />
          <Route path="/estoque/utensilios/:id/editar" element={<UtensilioFormPage />} />
```

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit` (dentro de `frontend/`)
Expected: 0 erros neste módulo. Erros remanescentes (se houver) devem ser só em `EntradaFormPage.tsx`/`EntradaDetalhePage.tsx`/`ConfirmacaoEntradaModal.tsx` — corrigidos no Task 11.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/features/estoque/utensilios/ frontend/src/routes/AppRoutes.tsx
git commit -m "feat(utensilios): modulo Utensilios - cadastro (frontend)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 11 — Frontend: Entrada mista (formulário, detalhe, confirmação)

**Files:**
- Modify: `frontend/src/features/entradas/pages/EntradaFormPage.tsx`
- Modify: `frontend/src/features/entradas/components/ConfirmacaoEntradaModal.tsx`
- Modify: `frontend/src/features/entradas/pages/EntradaDetalhePage.tsx`

**Interfaces:**
- Consumes: `utensiliosService` (Task 10), tipos atualizados de `EntradaFormValues`/`EntradaMercadoria`/`RegistrarEntradaInput` (Task 8).

- [ ] **Step 1: Reescrever `EntradaFormPage.tsx`**

Substituir o arquivo inteiro por:

```tsx
// frontend/src/features/entradas/pages/EntradaFormPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { entradasService } from '../services/entradasService'
import { fornecedoresService } from '@/features/fornecedores/services/fornecedoresService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { utensiliosService } from '@/features/estoque/utensilios/services/utensiliosService'
import { CampoTexto } from '@/components/form/CampoTexto'
import { SelectCampo } from '@/components/form/SelectCampo'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Toast } from '@/components/ui/Toast'
import { ConfirmacaoEntradaModal, type DadosConfirmacaoEntrada } from '../components/ConfirmacaoEntradaModal'
import type { Fornecedor, IngredienteResumo, UtensilioResumo, EntradaFormValues, EntradaMercadoria } from '@/types/estoque'

const entradaSchema = z.object({
  fornecedorId: z.string().min(1, 'Selecione um fornecedor.'),
  dataEntrada: z.string().min(1, 'Informe a data da entrada.'),
  numeroNotaFiscal: z.string().max(60),
  recebidoPor: z.string().min(1, 'Informe quem recebeu os produtos.').max(100),
  observacoes: z.string(),
  temBoleto: z.boolean().default(false),
  dataVencimentoBoleto: z.string().optional(),
  itens: z
    .array(
      z.object({
        tipo: z.enum(['ingrediente', 'utensilio']),
        itemId: z.string().min(1, 'Selecione um item.'),
        quantidade: z.preprocess(
          (v) => (v === '' || v == null ? undefined : Number(v)),
          z.number().positive('Quantidade deve ser maior que 0.')
        ),
        custoUnitario: z.preprocess(
          (v) => (v === '' || v == null ? undefined : Number(v)),
          z.number().min(0, 'Custo deve ser ≥ 0.')
        ),
      })
    )
    .min(1, 'Adicione pelo menos um item.'),
}).refine(
  (data) => !data.temBoleto || (!!data.dataVencimentoBoleto && data.dataVencimentoBoleto.length > 0),
  { message: 'Informe a data de vencimento do boleto.', path: ['dataVencimentoBoleto'] }
)

export function EntradaFormPage() {
  const navigate = useNavigate()
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [utensilios, setUtensilios] = useState<UtensilioResumo[]>([])
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [confirma, setConfirma] = useState<DadosConfirmacaoEntrada | null>(null)

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<EntradaFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(entradaSchema) as any,
      defaultValues: {
        fornecedorId: '',
        dataEntrada: new Date().toISOString().split('T')[0],
        numeroNotaFiscal: '',
        recebidoPor: '',
        observacoes: '',
        temBoleto: false,
        dataVencimentoBoleto: '',
        itens: [{ tipo: 'ingrediente', itemId: '', quantidade: undefined, custoUnitario: undefined }],
      },
    })

  const temBoleto = watch('temBoleto')
  const itensAtuais = watch('itens')

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })

  useEffect(() => {
    fornecedoresService.listar().then(setFornecedores).catch(() => {})
    ingredientesService.listar().then(setIngredientes).catch(() => {})
    utensiliosService.listar().then(setUtensilios).catch(() => {})
  }, [])

  const onSubmit = async (values: EntradaFormValues) => {
    try {
      const itensIngrediente = values.itens.filter(i => i.tipo === 'ingrediente')
      const itensUtensilio = values.itens.filter(i => i.tipo === 'utensilio')

      const resultado: EntradaMercadoria = await entradasService.registrar({
        fornecedorId: values.fornecedorId,
        dataEntrada: values.dataEntrada,
        recebidoPor: values.recebidoPor,
        numeroNotaFiscal: values.numeroNotaFiscal || null,
        observacoes: values.observacoes || null,
        temBoleto: values.temBoleto,
        dataVencimentoBoleto: values.temBoleto && values.dataVencimentoBoleto
          ? values.dataVencimentoBoleto
          : null,
        itens: itensIngrediente.map(item => ({
          ingredienteId: item.itemId,
          quantidade: item.quantidade!,
          custoUnitario: item.custoUnitario!,
        })),
        itensUtensilio: itensUtensilio.map(item => ({
          utensilioId: item.itemId,
          quantidade: item.quantidade!,
          custoUnitario: item.custoUnitario!,
        })),
      })
      setConfirma({
        fornecedorNome: resultado.fornecedorNome,
        numeroNotaFiscal: resultado.numeroNotaFiscal,
        custoTotal: resultado.custoTotal,
        horario: new Date(resultado.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        itens: [
          ...resultado.itens.map(item => ({
            nome: item.ingredienteNome,
            unidadeMedidaCodigo: item.unidadeMedidaCodigo,
            quantidade: item.quantidade,
            custoTotal: item.custoTotal,
          })),
          ...resultado.itensUtensilio.map(item => ({
            nome: item.utensilioNome,
            unidadeMedidaCodigo: item.unidadeMedidaCodigo,
            quantidade: item.quantidade,
            custoTotal: item.custoTotal,
          })),
        ],
      })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao registrar entrada.' })
    }
  }

  return (
    <div className="ada-page max-w-3xl">
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <Link to="/entradas" className="back-link">
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        Entradas
      </Link>

      <h1
        className="text-xl font-bold tracking-tight mb-6"
        style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        Nova Entrada de Mercadoria
      </h1>

      <form onSubmit={handleSubmit(onSubmit as any)}>
        <FormCard>
          <FormSection titulo="Dados da Entrada" />
          <div className="grid grid-cols-2 gap-4">
            <SelectCampo
              label="Fornecedor"
              obrigatorio
              opcoes={fornecedores.map(f => ({ valor: f.id, rotulo: f.razaoSocial }))}
              {...register('fornecedorId')}
              erro={errors.fornecedorId?.message}
            />
            <CampoTexto
              label="Data da Entrada"
              obrigatorio
              type="date"
              {...register('dataEntrada')}
              erro={errors.dataEntrada?.message}
            />
            <CampoTexto
              label="Nota Fiscal"
              placeholder="Número da NF (opcional)"
              {...register('numeroNotaFiscal')}
            />
            <CampoTexto
              label="Recebido por"
              obrigatorio
              placeholder="Nome do funcionário que recebeu"
              {...register('recebidoPor')}
              erro={errors.recebidoPor?.message}
            />
            <CampoTexto
              label="Observações"
              placeholder="Observações (opcional)"
              {...register('observacoes')}
            />

            <div className="col-span-2">
              <label
                className="flex items-center gap-3 cursor-pointer select-none"
                htmlFor="temBoleto"
              >
                <input
                  id="temBoleto"
                  type="checkbox"
                  {...register('temBoleto')}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: '#C4870A' }}
                />
                <span className="text-sm font-medium" style={{ color: 'var(--ada-body)' }}>
                  Pagamento via boleto
                </span>
              </label>
            </div>

            {temBoleto && (
              <CampoTexto
                label="Data de Vencimento do Boleto"
                obrigatorio
                type="date"
                {...register('dataVencimentoBoleto')}
                erro={errors.dataVencimentoBoleto?.message}
              />
            )}
          </div>

          <FormSection titulo="Itens da Entrada" />

          {errors.itens && !Array.isArray(errors.itens) && (
            <p className="mb-3 text-xs text-red-600 flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {(errors.itens as { message?: string }).message}
            </p>
          )}

          <div
            className="grid grid-cols-[110px_1fr_110px_130px_36px] gap-2 px-1 mb-1.5"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Tipo</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Item</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Quantidade</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Custo Unit. (R$)</span>
            <span />
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => {
              const tipoLinha = itensAtuais?.[index]?.tipo ?? 'ingrediente'
              const opcoesItem = tipoLinha === 'ingrediente'
                ? ingredientes.map(ing => ({ valor: ing.id, rotulo: `${ing.nome} (${ing.unidadeMedidaCodigo})` }))
                : utensilios.map(ute => ({ valor: ute.id, rotulo: `${ute.nome} (${ute.unidadeMedidaCodigo})` }))

              return (
                <div key={field.id} className="grid grid-cols-[110px_1fr_110px_130px_36px] gap-2 items-start">
                  <SelectCampo
                    label=" "
                    opcoes={[
                      { valor: 'ingrediente', rotulo: 'Ingrediente' },
                      { valor: 'utensilio', rotulo: 'Utensílio' },
                    ]}
                    value={tipoLinha}
                    onChange={(e) => {
                      setValue(`itens.${index}.tipo`, e.target.value as 'ingrediente' | 'utensilio')
                      setValue(`itens.${index}.itemId`, '')
                    }}
                  />
                  <SelectCampo
                    label=" "
                    opcoes={opcoesItem}
                    {...register(`itens.${index}.itemId`)}
                    erro={errors.itens?.[index]?.itemId?.message}
                  />
                  <CampoTexto
                    label=" "
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="0.000"
                    {...register(`itens.${index}.quantidade`)}
                    erro={errors.itens?.[index]?.quantidade?.message}
                  />
                  <CampoTexto
                    label=" "
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register(`itens.${index}.custoUnitario`)}
                    erro={errors.itens?.[index]?.custoUnitario?.message}
                  />
                  <button
                    type="button"
                    onClick={() => fields.length > 1 && remove(index)}
                    disabled={fields.length === 1}
                    className="mt-0.5 p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ color: 'var(--ada-muted)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#DC2626'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
                    title="Remover item"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => append({ tipo: 'ingrediente', itemId: '', quantidade: undefined, custoUnitario: undefined })}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: '#C4870A' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#B87D0A'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Adicionar item
          </button>

          <FormActions
            salvando={isSubmitting}
            labelSalvar="Registrar Entrada"
            onCancelar={() => navigate('/entradas')}
          />
        </FormCard>
      </form>

      {confirma && (
        <ConfirmacaoEntradaModal
          aberto
          dados={confirma}
          onFechar={() => { setConfirma(null); reset() }}
          onVerEntradas={() => { setConfirma(null); navigate('/entradas') }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Ajustar `ConfirmacaoEntradaModal.tsx`**

Trocar a interface `ItemConfirmacaoEntrada` existente:

```typescript
export interface ItemConfirmacaoEntrada {
  ingredienteNome: string
  unidadeMedidaCodigo: string
  quantidade: number
  custoTotal: number
}
```

por:

```typescript
export interface ItemConfirmacaoEntrada {
  nome: string
  unidadeMedidaCodigo: string
  quantidade: number
  custoTotal: number
}
```

No cabeçalho da tabela de itens, trocar:

```tsx
              <span style={{ flex: 1 }}>Ingrediente</span>
```

por:

```tsx
              <span style={{ flex: 1 }}>Item</span>
```

Na linha de cada item, trocar:

```tsx
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--ada-heading)' }}>
                  {item.ingredienteNome}
                </span>
```

por:

```tsx
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--ada-heading)' }}>
                  {item.nome}
                </span>
```

- [ ] **Step 3: Ajustar `EntradaDetalhePage.tsx`**

Antes do `return (` do componente, adicionar a montagem da lista combinada (depois da verificação `if (erro || !entrada) { ... }`):

```tsx
  const itensCombinados = entrada
    ? [
        ...entrada.itens.map(i => ({ id: i.id, nome: i.ingredienteNome, unidadeMedidaCodigo: i.unidadeMedidaCodigo, quantidade: i.quantidade, custoUnitario: i.custoUnitario, custoTotal: i.custoTotal })),
        ...entrada.itensUtensilio.map(i => ({ id: i.id, nome: i.utensilioNome, unidadeMedidaCodigo: i.unidadeMedidaCodigo, quantidade: i.quantidade, custoUnitario: i.custoUnitario, custoTotal: i.custoTotal })),
      ]
    : []
```

Trocar o cabeçalho da tabela de itens:

```tsx
                <th className="table-th" scope="col">Ingrediente</th>
```

por:

```tsx
                <th className="table-th" scope="col">Item</th>
```

Trocar o corpo da tabela (o `{entrada.itens.map(item => (...))}`) por:

```tsx
              {itensCombinados.map(item => (
                <tr key={item.id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-2.5">
                      <span className="accent-bar shrink-0" aria-hidden="true" />
                      <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>{item.nome}</span>
                      <span className="text-xs" style={{ color: 'var(--ada-placeholder)' }}>({item.unidadeMedidaCodigo})</span>
                    </div>
                  </td>
                  <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                    <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{item.quantidade}</span>
                  </td>
                  <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                    <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{formatarMoeda(item.custoUnitario)}</span>
                  </td>
                  <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                    <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>{formatarMoeda(item.custoTotal)}</span>
                  </td>
                </tr>
              ))}
```

Por fim, no modal de confirmação de cancelamento, trocar o texto:

```tsx
                O estoque dos ingredientes será revertido. Esta ação não pode ser desfeita.
```

por:

```tsx
                O estoque dos itens será revertido. Esta ação não pode ser desfeita.
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit` (dentro de `frontend/`)
Expected: 0 erros em todo o projeto.

- [ ] **Step 5: Teste manual**

Rodar o backend (`dotnet run --project src/CasaDiAna.API`) e o frontend (`npm run dev` dentro de `frontend/`). Login com `admin@casadiana.com`/`Admin@123`. Fluxo:
1. Criar uma categoria de utensílio em `/estoque/categorias-utensilio`.
2. Cadastrar 2 utensílios em `/estoque/utensilios/novo`.
3. Em `/entradas/nova`, adicionar uma linha "Ingrediente" e uma linha "Utensílio" na mesma nota, registrar.
4. Conferir que o modal de confirmação mostra os dois itens.
5. Abrir o detalhe da entrada (`/entradas/:id`) e conferir que os dois itens aparecem na tabela.
6. Conferir em `/estoque/utensilios` que o estoque do utensílio subiu.
7. Cancelar a entrada e conferir que o estoque do utensílio volta a 0.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/entradas/
git commit -m "feat(entradas): formulario, detalhe e confirmacao suportam itens mistos (ingrediente + utensilio)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 12 — Verificação final + push

**Files:** nenhum arquivo novo — só verificação e integração.

- [ ] **Step 1: Verificação completa**

Run (raiz do repo): `dotnet build src/CasaDiAna.API`
Expected: Build succeeded.

Run: `dotnet test tests/CasaDiAna.Application.Tests`
Expected: todos os testes passam (pré-existentes + novos de Utensílio).

Run (dentro de `frontend/`): `npx tsc --noEmit`
Expected: 0 erros.

- [ ] **Step 2: Atualizar o BrainOS (pós-task)**

Seguindo `docs/brain/10_IA_PROMPTS/ROTINA_POS_TASK.md`:
- Criar `docs/brain/04_MODULOS/MOD_UTENSILIOS.md` e `docs/brain/04_MODULOS/MOD_CATEGORIAS_UTENSILIO.md` (status `existente`, evidências de arquivo/commit).
- Adicionar entrada no topo de `docs/brain/08_TASK_LOG/TASK_LOG.md` (data de hoje, áreas, resultado, commits).
- Atualizar `docs/brain/07_STATUS/STATUS_SNAPSHOT.md` com a nova linha de módulo.
- Adicionar linha "Utensílios/Produtos de limpeza e embalagem" na tabela de áreas de `docs/brain/10_IA_PROMPTS/ROTINA_PRE_TASK.md` e em `CasaDiAna/CLAUDE.md` (lista de módulos disponíveis em `04_MODULOS/`).

```bash
git add docs/brain/ CasaDiAna/CLAUDE.md
git commit -m "docs(brain): registra modulo de utensilios no BrainOS

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 3: Push para master**

```bash
git push origin master
```

---

## Self-Review

**Spec coverage:**
- §3 Modelo de dados → Task 1 (entidades) + Task 2 (EF/infra) + Task 7 (migration). ✅
- §4 Casos de uso (CategoriasUtensilio, Utensilios, RegistrarEntrada, CancelarEntrada) → Tasks 3, 4, 5, 6. ✅
- §5 API → controllers nos Tasks 3 e 4; `EntradasController` inalterado de rota (confirmado — Task 5 só muda o body). ✅
- §6 Frontend (categorias, cadastro, sidebar, EntradaFormPage, ConfirmacaoEntradaModal) → Tasks 8–11. O gap de `EntradaDetalhePage` encontrado durante o planejamento (spec §6.3 corrigida) está coberto no Task 11, Step 3. ✅
- §7 Infraestrutura → Task 2. ✅
- §8 Validações e casos-limite → cobertas nos testes dos Tasks 1, 5 e 6 (entrada sem item, utensílio inativo/duplicado, cancelamento misto). ✅
- §10 Testes → testes de domínio (Task 1), handlers (Tasks 3–6), manual E2E (Task 11, Step 5). ✅
- §12/§13 Fora de escopo → nenhum task deste plano toca Inventário Físico, Correção de Estoque, Notificação de Estoque ou Relatórios — confirmado por grep mental das Interfaces de cada task (nenhuma referencia esses módulos).

**Placeholder scan:** nenhum "TBD"/"implementar depois"/"similar ao Task N sem código" encontrado — todo Step de código tem o arquivo completo ou o trecho exato a inserir/substituir.

**Type consistency:** `UtensilioResumoDto`/`UtensilioDto` (Task 4) têm exatamente os mesmos nomes de campo que `IngredienteResumoDto`/`IngredienteDto` (propositalmente, para o copy+sed do Task 10 funcionar sem ajuste de campo); `ItemEntradaUtensilioDto`/`ItemEntradaUtensilioInputDto` (Task 5) usados de forma consistente entre handler, DTO e testes; `EntradaFormValues.itens[].tipo`/`itemId` (Task 8) usados de forma consistente em `EntradaFormPage.tsx` (Task 11); construtor de `RegistrarEntradaCommandHandler`/`CancelarEntradaCommandHandler` (8 e 6 parâmetros, respectivamente) consistente entre o handler (Tasks 5/6) e os testes (mesmos Tasks).

---

Plano completo e salvo em `docs/superpowers/plans/2026-10-06-utensilios.md`. Duas opções de execução:

1. **Subagent-Driven (recomendado)** — um subagente novo por task, com revisão em duas etapas entre cada um.
2. **Execução Inline** — executar as 12 tasks nesta sessão, em lote, com checkpoints de revisão.

Qual você prefere?
