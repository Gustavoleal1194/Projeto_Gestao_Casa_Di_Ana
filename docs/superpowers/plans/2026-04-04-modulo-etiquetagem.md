# Módulo de Etiquetagem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um módulo completo de geração e impressão de etiquetas térmicas integrado ao sistema de produção, com pré-visualização em tempo real, três tipos de etiqueta (Completa, Simples, Nutricional) e histórico de impressões.

**Architecture:** A validade é calculada como `DataProducao + DiasValidade` (novo campo no Produto). O frontend gera o HTML da etiqueta e usa `window.open` + `window.print()` para envio à impressora; após imprimir, chama o backend para registrar o histórico. O histórico é persistido na tabela `producao.historico_impressao_etiquetas`.

**Tech Stack:** ASP.NET Core 8, EF Core 8, PostgreSQL, React 18 + TypeScript, Tailwind CSS v4, CSS var theming, `window.print()` via popup isolado.

---

## Estrutura de Arquivos

### Criar
- `CasaDiAna/src/CasaDiAna.Domain/Enums/TipoEtiqueta.cs`
- `CasaDiAna/src/CasaDiAna.Domain/Entities/HistoricoImpressaoEtiqueta.cs`
- `CasaDiAna/src/CasaDiAna.Domain/Interfaces/IHistoricoImpressaoRepository.cs`
- `CasaDiAna/src/CasaDiAna.Infrastructure/Persistence/Configurations/HistoricoImpressaoEtiquetaConfiguration.cs`
- `CasaDiAna/src/CasaDiAna.Infrastructure/Repositories/HistoricoImpressaoRepository.cs`
- `CasaDiAna/src/CasaDiAna.Application/Etiquetas/Dtos/HistoricoImpressaoDto.cs`
- `CasaDiAna/src/CasaDiAna.Application/Etiquetas/Commands/RegistrarImpressao/RegistrarImpressaoCommand.cs`
- `CasaDiAna/src/CasaDiAna.Application/Etiquetas/Commands/RegistrarImpressao/RegistrarImpressaoCommandValidator.cs`
- `CasaDiAna/src/CasaDiAna.Application/Etiquetas/Commands/RegistrarImpressao/RegistrarImpressaoCommandHandler.cs`
- `CasaDiAna/src/CasaDiAna.Application/Etiquetas/Queries/ListarHistorico/ListarHistoricoQuery.cs`
- `CasaDiAna/src/CasaDiAna.Application/Etiquetas/Queries/ListarHistorico/ListarHistoricoQueryHandler.cs`
- `CasaDiAna/src/CasaDiAna.API/Controllers/EtiquetasController.cs`
- `CasaDiAna/frontend/src/lib/etiquetasService.ts`
- `CasaDiAna/frontend/src/features/etiquetas/pages/EtiquetasPage.tsx`
- `CasaDiAna/tests/CasaDiAna.Application.Tests/Etiquetas/RegistrarImpressaoCommandHandlerTests.cs`
- `CasaDiAna/tests/CasaDiAna.Application.Tests/Etiquetas/ListarHistoricoQueryHandlerTests.cs`

### Modificar
- `CasaDiAna/src/CasaDiAna.Domain/Entities/Produto.cs` — adicionar `DiasValidade`
- `CasaDiAna/src/CasaDiAna.Infrastructure/Persistence/Configurations/ProdutoConfiguration.cs` — mapear coluna
- `CasaDiAna/src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs` — novo DbSet
- `CasaDiAna/src/CasaDiAna.Infrastructure/DependencyInjection.cs` — registrar repositório
- `CasaDiAna/src/CasaDiAna.Application/Produtos/Dtos/ProdutoDto.cs` — adicionar `DiasValidade`
- `CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/CriarProduto/CriarProdutoCommand.cs`
- `CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/CriarProduto/CriarProdutoCommandValidator.cs`
- `CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/CriarProduto/CriarProdutoCommandHandler.cs`
- `CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/AtualizarProduto/AtualizarProdutoCommand.cs`
- `CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/AtualizarProduto/AtualizarProdutoCommandValidator.cs`
- `CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/AtualizarProduto/AtualizarProdutoCommandHandler.cs`
- `CasaDiAna/frontend/src/types/producao.ts` — adicionar `diasValidade`
- `CasaDiAna/frontend/src/features/producao/produtos/hooks/useProdutoForm.ts`
- `CasaDiAna/frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx`
- `CasaDiAna/frontend/src/routes/AppRoutes.tsx`
- `CasaDiAna/frontend/src/components/layout/Sidebar.tsx`

---

## Task 1: Adicionar DiasValidade à entidade Produto

**Files:**
- Modify: `CasaDiAna/src/CasaDiAna.Domain/Entities/Produto.cs`

- [ ] **Step 1: Adicionar propriedade e atualizar Criar + Atualizar**

```csharp
// CasaDiAna/src/CasaDiAna.Domain/Entities/Produto.cs
using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class Produto
{
    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public Guid? CategoriaProdutoId { get; private set; }
    public string? Descricao { get; private set; }
    public decimal PrecoVenda { get; private set; }
    public int? DiasValidade { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    public CategoriaProduto? Categoria { get; private set; }
    public IReadOnlyCollection<ItemFichaTecnica> ItensFicha => _itensFicha.AsReadOnly();
    private readonly List<ItemFichaTecnica> _itensFicha = new();

    private Produto() { }

    public static Produto Criar(
        string nome,
        decimal precoVenda,
        Guid criadoPor,
        Guid? categoriaProdutoId = null,
        string? descricao = null,
        int? diasValidade = null)
    {
        if (precoVenda <= 0)
            throw new DomainException("Preço de venda deve ser maior que zero.");

        return new Produto
        {
            Id = Guid.NewGuid(),
            Nome = nome,
            CategoriaProdutoId = categoriaProdutoId,
            Descricao = descricao,
            PrecoVenda = precoVenda,
            DiasValidade = diasValidade,
            Ativo = true,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor,
            AtualizadoPor = criadoPor
        };
    }

    public void Atualizar(
        string nome,
        decimal precoVenda,
        Guid atualizadoPor,
        Guid? categoriaProdutoId = null,
        string? descricao = null,
        int? diasValidade = null)
    {
        if (precoVenda <= 0)
            throw new DomainException("Preço de venda deve ser maior que zero.");

        Nome = nome;
        CategoriaProdutoId = categoriaProdutoId;
        Descricao = descricao;
        PrecoVenda = precoVenda;
        DiasValidade = diasValidade;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public void Desativar(Guid atualizadoPor)
    {
        Ativo = false;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public void DefinirFichaTecnica(IEnumerable<(Guid ingredienteId, decimal quantidade)> itens)
    {
        var listaItens = itens.ToList();

        var duplicados = listaItens
            .GroupBy(i => i.ingredienteId)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();

        if (duplicados.Any())
            throw new DomainException("A ficha técnica não pode ter o mesmo ingrediente mais de uma vez.");

        _itensFicha.Clear();
        foreach (var (ingredienteId, quantidade) in listaItens)
            _itensFicha.Add(ItemFichaTecnica.Criar(Id, ingredienteId, quantidade));

        AtualizadoEm = DateTime.UtcNow;
    }

    public decimal CalcularCustoFicha()
    {
        return _itensFicha.Sum(i =>
            i.QuantidadePorUnidade * (i.Ingrediente?.CustoUnitario ?? 0));
    }

    public decimal? CalcularMargemLucro()
    {
        if (PrecoVenda <= 0) return null;
        var custo = CalcularCustoFicha();
        return ((PrecoVenda - custo) / PrecoVenda) * 100;
    }
}
```

- [ ] **Step 2: Commit**

```bash
cd CasaDiAna
git add src/CasaDiAna.Domain/Entities/Produto.cs
git commit -m "feat: adiciona DiasValidade à entidade Produto"
```

---

## Task 2: EF Configuration e Migration para DiasValidade

**Files:**
- Modify: `CasaDiAna/src/CasaDiAna.Infrastructure/Persistence/Configurations/ProdutoConfiguration.cs`

- [ ] **Step 1: Adicionar mapeamento da coluna**

Adicionar após a linha `builder.Property(p => p.PrecoVenda).HasColumnName("preco_venda")...`:

```csharp
// Adicionar dentro do método Configure, após o mapeamento de preco_venda
builder.Property(p => p.DiasValidade).HasColumnName("dias_validade");
```

O arquivo completo fica:

```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class ProdutoConfiguration : IEntityTypeConfiguration<Produto>
{
    public void Configure(EntityTypeBuilder<Produto> builder)
    {
        builder.ToTable("produtos", "producao");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id");
        builder.Property(p => p.Nome).HasColumnName("nome").HasMaxLength(150).IsRequired();
        builder.HasIndex(p => p.Nome).IsUnique();
        builder.Property(p => p.CategoriaProdutoId).HasColumnName("categoria_produto_id");
        builder.Property(p => p.Descricao).HasColumnName("descricao");
        builder.Property(p => p.PrecoVenda).HasColumnName("preco_venda").HasPrecision(15, 2).IsRequired();
        builder.Property(p => p.DiasValidade).HasColumnName("dias_validade");
        builder.Property(p => p.Ativo).HasColumnName("ativo").IsRequired();
        builder.Property(p => p.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(p => p.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(p => p.CriadoPor).HasColumnName("criado_por").IsRequired();
        builder.Property(p => p.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();

        builder.HasOne(p => p.Categoria)
            .WithMany()
            .HasForeignKey(p => p.CategoriaProdutoId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(p => p.ItensFicha)
            .WithOne()
            .HasForeignKey(i => i.ProdutoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(p => p.ItensFicha)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
```

- [ ] **Step 2: Criar migration**

```bash
dotnet ef migrations add AddDiasValidadeToProduto \
  --project src/CasaDiAna.Infrastructure \
  --startup-project src/CasaDiAna.API
```

Esperado: migration criada em `src/CasaDiAna.Infrastructure/Migrations/`.

- [ ] **Step 3: Verificar migration gerada**

Abrir o arquivo de migration gerado e confirmar que contém:
- `migrationBuilder.AddColumn<int>(name: "dias_validade", table: "produtos", schema: "producao", nullable: true)`
- Down com `migrationBuilder.DropColumn`

- [ ] **Step 4: Commit**

```bash
git add src/CasaDiAna.Infrastructure/Persistence/Configurations/ProdutoConfiguration.cs
git add src/CasaDiAna.Infrastructure/Migrations/
git commit -m "feat: adiciona coluna dias_validade à tabela produtos"
```

---

## Task 3: Application Layer – DiasValidade em CriarProduto e AtualizarProduto

**Files:**
- Modify: `CasaDiAna/src/CasaDiAna.Application/Produtos/Dtos/ProdutoDto.cs`
- Modify: `CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/CriarProduto/CriarProdutoCommand.cs`
- Modify: `CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/CriarProduto/CriarProdutoCommandValidator.cs`
- Modify: `CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/CriarProduto/CriarProdutoCommandHandler.cs`
- Modify: `CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/AtualizarProduto/AtualizarProdutoCommand.cs`
- Modify: `CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/AtualizarProduto/AtualizarProdutoCommandValidator.cs`
- Modify: `CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/AtualizarProduto/AtualizarProdutoCommandHandler.cs`

- [ ] **Step 1: Atualizar ProdutoDto**

```csharp
// CasaDiAna/src/CasaDiAna.Application/Produtos/Dtos/ProdutoDto.cs
namespace CasaDiAna.Application.Produtos.Dtos;

public record ProdutoDto(
    Guid Id,
    string Nome,
    Guid? CategoriaProdutoId,
    string? CategoriaNome,
    string? Descricao,
    decimal PrecoVenda,
    int? DiasValidade,
    bool Ativo,
    DateTime AtualizadoEm);
```

- [ ] **Step 2: Atualizar CriarProdutoCommand**

```csharp
// CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/CriarProduto/CriarProdutoCommand.cs
using CasaDiAna.Application.Produtos.Dtos;
using MediatR;

namespace CasaDiAna.Application.Produtos.Commands.CriarProduto;

public record CriarProdutoCommand(
    string Nome,
    decimal PrecoVenda,
    Guid? CategoriaProdutoId = null,
    string? Descricao = null,
    int? DiasValidade = null) : IRequest<ProdutoDto>;
```

- [ ] **Step 3: Atualizar CriarProdutoCommandValidator**

```csharp
// CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/CriarProduto/CriarProdutoCommandValidator.cs
using FluentValidation;

namespace CasaDiAna.Application.Produtos.Commands.CriarProduto;

public class CriarProdutoCommandValidator : AbstractValidator<CriarProdutoCommand>
{
    public CriarProdutoCommandValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(150).WithMessage("Nome deve ter no máximo 150 caracteres.");

        RuleFor(x => x.PrecoVenda)
            .GreaterThan(0).WithMessage("Preço de venda deve ser maior que zero.");

        RuleFor(x => x.Descricao)
            .MaximumLength(500).When(x => x.Descricao != null)
            .WithMessage("Descrição deve ter no máximo 500 caracteres.");

        RuleFor(x => x.DiasValidade)
            .GreaterThan(0).When(x => x.DiasValidade.HasValue)
            .WithMessage("Dias de validade deve ser maior que zero.");
    }
}
```

- [ ] **Step 4: Atualizar CriarProdutoCommandHandler**

```csharp
// CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/CriarProduto/CriarProdutoCommandHandler.cs
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Produtos.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Produtos.Commands.CriarProduto;

public class CriarProdutoCommandHandler : IRequestHandler<CriarProdutoCommand, ProdutoDto>
{
    private readonly IProdutoRepository _produtos;
    private readonly ICategoriaProdutoRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public CriarProdutoCommandHandler(
        IProdutoRepository produtos,
        ICategoriaProdutoRepository categorias,
        ICurrentUserService currentUser)
    {
        _produtos = produtos;
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task<ProdutoDto> Handle(CriarProdutoCommand request, CancellationToken cancellationToken)
    {
        if (await _produtos.NomeExisteAsync(request.Nome, ct: cancellationToken))
            throw new DomainException($"Já existe um produto com o nome '{request.Nome}'.");

        if (request.CategoriaProdutoId.HasValue &&
            await _categorias.ObterPorIdAsync(request.CategoriaProdutoId.Value, cancellationToken) is null)
            throw new DomainException("Categoria de produto não encontrada.");

        var produto = Produto.Criar(
            request.Nome,
            request.PrecoVenda,
            _currentUser.UsuarioId,
            request.CategoriaProdutoId,
            request.Descricao,
            request.DiasValidade);

        await _produtos.AdicionarAsync(produto, cancellationToken);
        await _produtos.SalvarAsync(cancellationToken);

        var salvo = await _produtos.ObterPorIdAsync(produto.Id, cancellationToken);
        return ToDto(salvo!);
    }

    internal static ProdutoDto ToDto(Produto p) => new(
        p.Id,
        p.Nome,
        p.CategoriaProdutoId,
        p.Categoria?.Nome,
        p.Descricao,
        p.PrecoVenda,
        p.DiasValidade,
        p.Ativo,
        p.AtualizadoEm);
}
```

- [ ] **Step 5: Atualizar AtualizarProdutoCommand**

```csharp
// CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/AtualizarProduto/AtualizarProdutoCommand.cs
using CasaDiAna.Application.Produtos.Dtos;
using MediatR;

namespace CasaDiAna.Application.Produtos.Commands.AtualizarProduto;

public record AtualizarProdutoCommand(
    Guid Id,
    string Nome,
    decimal PrecoVenda,
    Guid? CategoriaProdutoId = null,
    string? Descricao = null,
    int? DiasValidade = null) : IRequest<ProdutoDto>;
```

- [ ] **Step 6: Atualizar AtualizarProdutoCommandValidator**

```csharp
// CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/AtualizarProduto/AtualizarProdutoCommandValidator.cs
using FluentValidation;

namespace CasaDiAna.Application.Produtos.Commands.AtualizarProduto;

public class AtualizarProdutoCommandValidator : AbstractValidator<AtualizarProdutoCommand>
{
    public AtualizarProdutoCommandValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(150).WithMessage("Nome deve ter no máximo 150 caracteres.");

        RuleFor(x => x.PrecoVenda)
            .GreaterThan(0).WithMessage("Preço de venda deve ser maior que zero.");

        RuleFor(x => x.Descricao)
            .MaximumLength(500).When(x => x.Descricao != null)
            .WithMessage("Descrição deve ter no máximo 500 caracteres.");

        RuleFor(x => x.DiasValidade)
            .GreaterThan(0).When(x => x.DiasValidade.HasValue)
            .WithMessage("Dias de validade deve ser maior que zero.");
    }
}
```

- [ ] **Step 7: Atualizar AtualizarProdutoCommandHandler**

```csharp
// CasaDiAna/src/CasaDiAna.Application/Produtos/Commands/AtualizarProduto/AtualizarProdutoCommandHandler.cs
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Produtos.Commands.CriarProduto;
using CasaDiAna.Application.Produtos.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Produtos.Commands.AtualizarProduto;

public class AtualizarProdutoCommandHandler : IRequestHandler<AtualizarProdutoCommand, ProdutoDto>
{
    private readonly IProdutoRepository _produtos;
    private readonly ICategoriaProdutoRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public AtualizarProdutoCommandHandler(
        IProdutoRepository produtos,
        ICategoriaProdutoRepository categorias,
        ICurrentUserService currentUser)
    {
        _produtos = produtos;
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task<ProdutoDto> Handle(AtualizarProdutoCommand request, CancellationToken cancellationToken)
    {
        var produto = await _produtos.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Produto não encontrado.");

        if (await _produtos.NomeExisteAsync(request.Nome, request.Id, cancellationToken))
            throw new DomainException($"Já existe um produto com o nome '{request.Nome}'.");

        if (request.CategoriaProdutoId.HasValue &&
            await _categorias.ObterPorIdAsync(request.CategoriaProdutoId.Value, cancellationToken) is null)
            throw new DomainException("Categoria de produto não encontrada.");

        produto.Atualizar(
            request.Nome,
            request.PrecoVenda,
            _currentUser.UsuarioId,
            request.CategoriaProdutoId,
            request.Descricao,
            request.DiasValidade);

        _produtos.Atualizar(produto);
        await _produtos.SalvarAsync(cancellationToken);

        var atualizado = await _produtos.ObterPorIdAsync(produto.Id, cancellationToken);
        return CriarProdutoCommandHandler.ToDto(atualizado!);
    }
}
```

- [ ] **Step 8: Rodar os testes existentes para garantir nenhuma regressão**

```bash
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test"
```

Esperado: todos os testes passam.

- [ ] **Step 9: Commit**

```bash
git add src/CasaDiAna.Application/Produtos/
git commit -m "feat: adiciona DiasValidade aos commands e DTO de Produto"
```

---

## Task 4: Frontend – Tipos e Formulário de Produto com DiasValidade

**Files:**
- Modify: `CasaDiAna/frontend/src/types/producao.ts`
- Modify: `CasaDiAna/frontend/src/features/producao/produtos/hooks/useProdutoForm.ts`
- Modify: `CasaDiAna/frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx`

- [ ] **Step 1: Atualizar types/producao.ts**

Alterar as interfaces de `Produto`, `CriarProdutoInput` e `ProdutoFormValues`:

```typescript
// Produto — adicionar diasValidade após descricao
export interface Produto {
  id: string
  nome: string
  categoriaProdutoId: string | null
  categoriaNome: string | null
  descricao: string | null
  precoVenda: number
  diasValidade: number | null   // NOVO
  ativo: boolean
  atualizadoEm: string
}

// CriarProdutoInput — adicionar diasValidade
export interface CriarProdutoInput {
  nome: string
  precoVenda: number
  categoriaProdutoId?: string | null
  descricao?: string | null
  diasValidade?: number | null   // NOVO
}

// ProdutoFormValues — adicionar diasValidade
export interface ProdutoFormValues {
  nome: string
  precoVenda: string
  categoriaProdutoId: string
  descricao: string
  diasValidade: string   // NOVO — string pois os inputs são string no form
}
```

- [ ] **Step 2: Atualizar useProdutoForm.ts**

```typescript
// CasaDiAna/frontend/src/features/producao/produtos/hooks/useProdutoForm.ts
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Produto, ProdutoFormValues, CriarProdutoInput } from '@/types/producao'

export const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.').max(150, 'Máximo de 150 caracteres.'),
  precoVenda: z
    .string()
    .min(1, 'Preço de venda é obrigatório.')
    .refine(v => Number(v) >= 0, 'Preço deve ser ≥ 0.'),
  categoriaProdutoId: z.string(),
  descricao: z.string(),
  diasValidade: z
    .string()
    .refine(
      v => v === '' || (Number.isInteger(Number(v)) && Number(v) >= 1),
      'Dias de validade deve ser um inteiro positivo.'
    ),
})

export function produtoParaForm(p: Produto): ProdutoFormValues {
  return {
    nome: p.nome,
    precoVenda: String(p.precoVenda),
    categoriaProdutoId: p.categoriaProdutoId ?? '',
    descricao: p.descricao ?? '',
    diasValidade: p.diasValidade != null ? String(p.diasValidade) : '',
  }
}

export function formParaInput(values: ProdutoFormValues): CriarProdutoInput {
  return {
    nome: values.nome,
    precoVenda: Number(values.precoVenda),
    categoriaProdutoId: values.categoriaProdutoId || null,
    descricao: values.descricao || null,
    diasValidade: values.diasValidade ? parseInt(values.diasValidade, 10) : null,
  }
}

export function useProdutoForm() {
  return useForm<ProdutoFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(produtoSchema) as any,
    defaultValues: {
      nome: '',
      precoVenda: '',
      categoriaProdutoId: '',
      descricao: '',
      diasValidade: '',
    },
  })
}
```

- [ ] **Step 3: Atualizar ProdutoFormPage.tsx — adicionar campo Dias de Validade**

Adicionar um novo campo após o campo de Categoria, dentro do grid 2 colunas:

```tsx
// CasaDiAna/frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { useProdutoForm, produtoParaForm, formParaInput } from '../hooks/useProdutoForm'
import { produtosService } from '../services/produtosService'
import { categoriasProdutoService } from '@/features/producao/categorias-produto/services/categoriasProdutoService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { CategoriaProduto, ProdutoFormValues } from '@/types/producao'

const selectClass =
  'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

export function ProdutoFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdicao = Boolean(id)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useProdutoForm()
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [carregando, setCarregando] = useState(isEdicao)

  useEffect(() => {
    categoriasProdutoService.listar().then(setCategorias).catch(() => {})
    if (!id) return
    produtosService
      .obterPorId(id)
      .then(p => reset(produtoParaForm(p)))
      .catch(() => setToast({ tipo: 'erro', mensagem: 'Erro ao carregar produto.' }))
      .finally(() => setCarregando(false))
  }, [id, reset])

  const onSubmit = async (values: ProdutoFormValues) => {
    try {
      const input = formParaInput(values)
      if (id) {
        await produtosService.atualizar({ id, ...input })
        setToast({ tipo: 'sucesso', mensagem: 'Produto atualizado com sucesso.' })
      } else {
        await produtosService.criar(input)
        setToast({ tipo: 'sucesso', mensagem: 'Produto criado com sucesso.' })
      }
      setTimeout(() => navigate('/producao/produtos'), 1200)
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar produto.' })
    }
  }

  if (carregando) {
    return (
      <div className="p-6 flex justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <button
        onClick={() => navigate('/producao/produtos')}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Produtos
      </button>

      <h1 className="text-2xl font-semibold text-stone-800 mb-6">
        {isEdicao ? 'Editar Produto' : 'Novo Produto'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-6">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">Identificação</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <CampoTexto
                  label="Nome"
                  obrigatorio
                  placeholder="Nome do produto"
                  erro={errors.nome?.message}
                  {...register('nome')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Preço de Venda (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  {...register('precoVenda')}
                />
                {errors.precoVenda && (
                  <p className="mt-1 text-xs text-red-600">{errors.precoVenda.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Categoria</label>
                <select className={selectClass} {...register('categoriaProdutoId')}>
                  <option value="">Sem categoria</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Validade (dias)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ex: 7"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  {...register('diasValidade')}
                />
                {errors.diasValidade && (
                  <p className="mt-1 text-xs text-red-600">{errors.diasValidade.message}</p>
                )}
                <p className="mt-1 text-xs text-stone-400">
                  Usado para calcular validade nas etiquetas
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Descrição</label>
            <textarea
              rows={3}
              placeholder="Descrição do produto (opcional)"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              {...register('descricao')}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/producao/produtos')}
            className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
          </button>
        </div>
      </form>

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
```

- [ ] **Step 4: Verificar tipos no frontend**

```bash
cd CasaDiAna/frontend
npx tsc --noEmit
```

Esperado: sem erros de tipo.

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/src/types/producao.ts
git add frontend/src/features/producao/produtos/hooks/useProdutoForm.ts
git add frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx
git commit -m "feat: adiciona campo DiasValidade no formulário de Produto"
```

---

## Task 5: Domínio – HistoricoImpressaoEtiqueta

**Files:**
- Create: `CasaDiAna/src/CasaDiAna.Domain/Enums/TipoEtiqueta.cs`
- Create: `CasaDiAna/src/CasaDiAna.Domain/Entities/HistoricoImpressaoEtiqueta.cs`
- Create: `CasaDiAna/src/CasaDiAna.Domain/Interfaces/IHistoricoImpressaoRepository.cs`

- [ ] **Step 1: Criar enum TipoEtiqueta**

```csharp
// CasaDiAna/src/CasaDiAna.Domain/Enums/TipoEtiqueta.cs
namespace CasaDiAna.Domain.Enums;

public enum TipoEtiqueta
{
    Completa   = 1,
    Simples    = 2,
    Nutricional = 3,
}
```

- [ ] **Step 2: Criar entidade HistoricoImpressaoEtiqueta**

```csharp
// CasaDiAna/src/CasaDiAna.Domain/Entities/HistoricoImpressaoEtiqueta.cs
using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Domain.Entities;

public class HistoricoImpressaoEtiqueta
{
    public Guid Id { get; private set; }
    public Guid ProdutoId { get; private set; }
    public Produto? Produto { get; private set; }
    public TipoEtiqueta TipoEtiqueta { get; private set; }
    public int Quantidade { get; private set; }
    public DateTime DataProducao { get; private set; }
    public Guid ImpressoPor { get; private set; }
    public DateTime ImpressoEm { get; private set; }

    private HistoricoImpressaoEtiqueta() { }

    public static HistoricoImpressaoEtiqueta Criar(
        Guid produtoId,
        TipoEtiqueta tipoEtiqueta,
        int quantidade,
        DateTime dataProducao,
        Guid impressoPor)
    {
        return new HistoricoImpressaoEtiqueta
        {
            Id = Guid.NewGuid(),
            ProdutoId = produtoId,
            TipoEtiqueta = tipoEtiqueta,
            Quantidade = quantidade,
            DataProducao = dataProducao.Date,
            ImpressoPor = impressoPor,
            ImpressoEm = DateTime.UtcNow,
        };
    }
}
```

- [ ] **Step 3: Criar interface IHistoricoImpressaoRepository**

```csharp
// CasaDiAna/src/CasaDiAna.Domain/Interfaces/IHistoricoImpressaoRepository.cs
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IHistoricoImpressaoRepository
{
    Task<IReadOnlyList<HistoricoImpressaoEtiqueta>> ListarAsync(
        Guid? produtoId = null,
        CancellationToken ct = default);

    Task AdicionarAsync(HistoricoImpressaoEtiqueta historico, CancellationToken ct = default);

    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/CasaDiAna.Domain/Enums/TipoEtiqueta.cs
git add src/CasaDiAna.Domain/Entities/HistoricoImpressaoEtiqueta.cs
git add src/CasaDiAna.Domain/Interfaces/IHistoricoImpressaoRepository.cs
git commit -m "feat: domínio HistoricoImpressaoEtiqueta e TipoEtiqueta"
```

---

## Task 6: Infrastructure – HistoricoImpressaoEtiqueta

**Files:**
- Create: `CasaDiAna/src/CasaDiAna.Infrastructure/Persistence/Configurations/HistoricoImpressaoEtiquetaConfiguration.cs`
- Create: `CasaDiAna/src/CasaDiAna.Infrastructure/Repositories/HistoricoImpressaoRepository.cs`
- Modify: `CasaDiAna/src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs`
- Modify: `CasaDiAna/src/CasaDiAna.Infrastructure/DependencyInjection.cs`

- [ ] **Step 1: Criar HistoricoImpressaoEtiquetaConfiguration**

```csharp
// CasaDiAna/src/CasaDiAna.Infrastructure/Persistence/Configurations/HistoricoImpressaoEtiquetaConfiguration.cs
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class HistoricoImpressaoEtiquetaConfiguration
    : IEntityTypeConfiguration<HistoricoImpressaoEtiqueta>
{
    public void Configure(EntityTypeBuilder<HistoricoImpressaoEtiqueta> builder)
    {
        builder.ToTable("historico_impressao_etiquetas", "producao");

        builder.HasKey(h => h.Id);

        builder.Property(h => h.Id)
               .HasColumnName("id");

        builder.Property(h => h.ProdutoId)
               .HasColumnName("produto_id")
               .IsRequired();

        builder.Property(h => h.TipoEtiqueta)
               .HasColumnName("tipo_etiqueta")
               .IsRequired();

        builder.Property(h => h.Quantidade)
               .HasColumnName("quantidade")
               .IsRequired();

        builder.Property(h => h.DataProducao)
               .HasColumnName("data_producao")
               .IsRequired();

        builder.Property(h => h.ImpressoPor)
               .HasColumnName("impresso_por")
               .IsRequired();

        builder.Property(h => h.ImpressoEm)
               .HasColumnName("impresso_em")
               .IsRequired();

        builder.HasOne(h => h.Produto)
               .WithMany()
               .HasForeignKey(h => h.ProdutoId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(h => h.ProdutoId)
               .HasDatabaseName("ix_historico_impressao_etiquetas_produto_id");

        builder.HasIndex(h => h.ImpressoEm)
               .HasDatabaseName("ix_historico_impressao_etiquetas_impresso_em");
    }
}
```

- [ ] **Step 2: Criar HistoricoImpressaoRepository**

```csharp
// CasaDiAna/src/CasaDiAna.Infrastructure/Repositories/HistoricoImpressaoRepository.cs
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class HistoricoImpressaoRepository : IHistoricoImpressaoRepository
{
    private readonly AppDbContext _db;

    public HistoricoImpressaoRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<HistoricoImpressaoEtiqueta>> ListarAsync(
        Guid? produtoId = null,
        CancellationToken ct = default)
    {
        var query = _db.HistoricoImpressaoEtiquetas
            .Include(h => h.Produto)
            .AsQueryable();

        if (produtoId.HasValue)
            query = query.Where(h => h.ProdutoId == produtoId.Value);

        return await query
            .OrderByDescending(h => h.ImpressoEm)
            .Take(100)
            .ToListAsync(ct);
    }

    public async Task AdicionarAsync(HistoricoImpressaoEtiqueta historico, CancellationToken ct = default) =>
        await _db.HistoricoImpressaoEtiquetas.AddAsync(historico, ct);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
```

- [ ] **Step 3: Adicionar DbSet ao AppDbContext**

Adicionar após `public DbSet<NotificacaoEstoque> NotificacoesEstoque => Set<NotificacaoEstoque>();`:

```csharp
public DbSet<HistoricoImpressaoEtiqueta> HistoricoImpressaoEtiquetas => Set<HistoricoImpressaoEtiqueta>();
```

O AppDbContext completo:

```csharp
// CasaDiAna/src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs
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
    public DbSet<CategoriaProduto> CategoriasProduto => Set<CategoriaProduto>();
    public DbSet<Produto> Produtos => Set<Produto>();
    public DbSet<ItemFichaTecnica> ItensFichaTecnica => Set<ItemFichaTecnica>();
    public DbSet<ProducaoDiaria> ProducoesDiarias => Set<ProducaoDiaria>();
    public DbSet<VendaDiaria> VendasDiarias => Set<VendaDiaria>();
    public DbSet<PerdaProduto> PerdasProduto => Set<PerdaProduto>();
    public DbSet<NotificacaoEstoque> NotificacoesEstoque => Set<NotificacaoEstoque>();
    public DbSet<HistoricoImpressaoEtiqueta> HistoricoImpressaoEtiquetas => Set<HistoricoImpressaoEtiqueta>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
```

- [ ] **Step 4: Registrar repositório no DependencyInjection**

Adicionar após `services.AddScoped<INotificacaoEstoqueService, NotificacaoEstoqueService>();`:

```csharp
services.AddScoped<IHistoricoImpressaoRepository, HistoricoImpressaoRepository>();
```

Lembrando de adicionar o using `using CasaDiAna.Domain.Interfaces;` (já existente).

- [ ] **Step 5: Criar migration**

```bash
dotnet ef migrations add AddHistoricoImpressaoEtiquetas \
  --project src/CasaDiAna.Infrastructure \
  --startup-project src/CasaDiAna.API
```

- [ ] **Step 6: Verificar migration gerada**

Confirmar que a migration contém:
- `CreateTable("producao.historico_impressao_etiquetas", ...)`
- FK para `producao.produtos`
- Índices em `produto_id` e `impresso_em`

- [ ] **Step 7: Build para verificar compilação**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build"
```

Esperado: Build succeeded.

- [ ] **Step 8: Commit**

```bash
git add src/CasaDiAna.Infrastructure/
git commit -m "feat: infra HistoricoImpressaoEtiqueta – configuração, repositório e migration"
```

---

## Task 7: Tests + Application Layer – Etiquetas Commands e Queries

**Files:**
- Create: `CasaDiAna/tests/CasaDiAna.Application.Tests/Etiquetas/RegistrarImpressaoCommandHandlerTests.cs`
- Create: `CasaDiAna/src/CasaDiAna.Application/Etiquetas/Dtos/HistoricoImpressaoDto.cs`
- Create: `CasaDiAna/src/CasaDiAna.Application/Etiquetas/Commands/RegistrarImpressao/RegistrarImpressaoCommand.cs`
- Create: `CasaDiAna/src/CasaDiAna.Application/Etiquetas/Commands/RegistrarImpressao/RegistrarImpressaoCommandValidator.cs`
- Create: `CasaDiAna/src/CasaDiAna.Application/Etiquetas/Commands/RegistrarImpressao/RegistrarImpressaoCommandHandler.cs`
- Create: `CasaDiAna/src/CasaDiAna.Application/Etiquetas/Queries/ListarHistorico/ListarHistoricoQuery.cs`
- Create: `CasaDiAna/src/CasaDiAna.Application/Etiquetas/Queries/ListarHistorico/ListarHistoricoQueryHandler.cs`

- [ ] **Step 1: Criar o teste (falha esperada)**

```csharp
// CasaDiAna/tests/CasaDiAna.Application.Tests/Etiquetas/RegistrarImpressaoCommandHandlerTests.cs
using CasaDiAna.Application.Etiquetas.Commands.RegistrarImpressao;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Etiquetas;

public class RegistrarImpressaoCommandHandlerTests
{
    private readonly Mock<IHistoricoImpressaoRepository> _historico = new();
    private readonly Mock<IProdutoRepository> _produtos = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly RegistrarImpressaoCommandHandler _handler;

    public RegistrarImpressaoCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _handler = new RegistrarImpressaoCommandHandler(
            _historico.Object,
            _produtos.Object,
            _currentUser.Object);
    }

    [Fact]
    public async Task DeveRegistrarImpressao_QuandoProdutoExiste()
    {
        var produtoId = Guid.NewGuid();
        var produto = Produto.Criar("Bolo", 10m, Guid.NewGuid(), null, null, 7);
        _produtos.Setup(r => r.ObterPorIdAsync(produtoId, default)).ReturnsAsync(produto);
        _historico.Setup(r => r.AdicionarAsync(It.IsAny<HistoricoImpressaoEtiqueta>(), default))
                  .Returns(Task.CompletedTask);
        _historico.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var command = new RegistrarImpressaoCommand(
            ProdutoId: produtoId,
            TipoEtiqueta: TipoEtiqueta.Completa,
            Quantidade: 5,
            DataProducao: DateTime.Today);

        var resultado = await _handler.Handle(command, CancellationToken.None);

        resultado.ProdutoId.Should().Be(produtoId);
        resultado.Quantidade.Should().Be(5);
        resultado.TipoEtiqueta.Should().Be(TipoEtiqueta.Completa);
        _historico.Verify(r => r.AdicionarAsync(It.IsAny<HistoricoImpressaoEtiqueta>(), default), Times.Once);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoProdutoNaoEncontrado()
    {
        _produtos.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default))
                 .ReturnsAsync((Produto?)null);

        var command = new RegistrarImpressaoCommand(
            ProdutoId: Guid.NewGuid(),
            TipoEtiqueta: TipoEtiqueta.Simples,
            Quantidade: 1,
            DataProducao: DateTime.Today);

        var acao = () => _handler.Handle(command, CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Produto não encontrado.");
    }
}
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```bash
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test --filter 'RegistrarImpressaoCommandHandlerTests'"
```

Esperado: FAIL com "type or namespace not found".

- [ ] **Step 3: Criar HistoricoImpressaoDto**

```csharp
// CasaDiAna/src/CasaDiAna.Application/Etiquetas/Dtos/HistoricoImpressaoDto.cs
using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Application.Etiquetas.Dtos;

public record HistoricoImpressaoDto(
    Guid Id,
    Guid ProdutoId,
    string ProdutoNome,
    TipoEtiqueta TipoEtiqueta,
    int Quantidade,
    DateTime DataProducao,
    DateTime ImpressoEm);
```

- [ ] **Step 4: Criar RegistrarImpressaoCommand**

```csharp
// CasaDiAna/src/CasaDiAna.Application/Etiquetas/Commands/RegistrarImpressao/RegistrarImpressaoCommand.cs
using CasaDiAna.Application.Etiquetas.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.Etiquetas.Commands.RegistrarImpressao;

public record RegistrarImpressaoCommand(
    Guid ProdutoId,
    TipoEtiqueta TipoEtiqueta,
    int Quantidade,
    DateTime DataProducao) : IRequest<HistoricoImpressaoDto>;
```

- [ ] **Step 5: Criar RegistrarImpressaoCommandValidator**

```csharp
// CasaDiAna/src/CasaDiAna.Application/Etiquetas/Commands/RegistrarImpressao/RegistrarImpressaoCommandValidator.cs
using FluentValidation;

namespace CasaDiAna.Application.Etiquetas.Commands.RegistrarImpressao;

public class RegistrarImpressaoCommandValidator : AbstractValidator<RegistrarImpressaoCommand>
{
    public RegistrarImpressaoCommandValidator()
    {
        RuleFor(x => x.ProdutoId)
            .NotEmpty().WithMessage("Produto é obrigatório.");

        RuleFor(x => x.Quantidade)
            .GreaterThan(0).WithMessage("Quantidade deve ser maior que zero.")
            .LessThanOrEqualTo(500).WithMessage("Quantidade máxima por impressão é 500.");

        RuleFor(x => x.DataProducao)
            .NotEmpty().WithMessage("Data de produção é obrigatória.");
    }
}
```

- [ ] **Step 6: Criar RegistrarImpressaoCommandHandler**

```csharp
// CasaDiAna/src/CasaDiAna.Application/Etiquetas/Commands/RegistrarImpressao/RegistrarImpressaoCommandHandler.cs
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Etiquetas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Etiquetas.Commands.RegistrarImpressao;

public class RegistrarImpressaoCommandHandler
    : IRequestHandler<RegistrarImpressaoCommand, HistoricoImpressaoDto>
{
    private readonly IHistoricoImpressaoRepository _historico;
    private readonly IProdutoRepository _produtos;
    private readonly ICurrentUserService _currentUser;

    public RegistrarImpressaoCommandHandler(
        IHistoricoImpressaoRepository historico,
        IProdutoRepository produtos,
        ICurrentUserService currentUser)
    {
        _historico = historico;
        _produtos = produtos;
        _currentUser = currentUser;
    }

    public async Task<HistoricoImpressaoDto> Handle(
        RegistrarImpressaoCommand request,
        CancellationToken cancellationToken)
    {
        var produto = await _produtos.ObterPorIdAsync(request.ProdutoId, cancellationToken)
            ?? throw new DomainException("Produto não encontrado.");

        var registro = HistoricoImpressaoEtiqueta.Criar(
            produto.Id,
            request.TipoEtiqueta,
            request.Quantidade,
            request.DataProducao,
            _currentUser.UsuarioId);

        await _historico.AdicionarAsync(registro, cancellationToken);
        await _historico.SalvarAsync(cancellationToken);

        return ToDto(registro, produto.Nome);
    }

    internal static HistoricoImpressaoDto ToDto(
        HistoricoImpressaoEtiqueta h,
        string produtoNome) => new(
            h.Id,
            h.ProdutoId,
            produtoNome,
            h.TipoEtiqueta,
            h.Quantidade,
            h.DataProducao,
            h.ImpressoEm);
}
```

- [ ] **Step 7: Criar ListarHistoricoQuery**

```csharp
// CasaDiAna/src/CasaDiAna.Application/Etiquetas/Queries/ListarHistorico/ListarHistoricoQuery.cs
using CasaDiAna.Application.Etiquetas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Etiquetas.Queries.ListarHistorico;

public record ListarHistoricoQuery(Guid? ProdutoId = null)
    : IRequest<IReadOnlyList<HistoricoImpressaoDto>>;
```

- [ ] **Step 8: Criar ListarHistoricoQueryHandler**

```csharp
// CasaDiAna/src/CasaDiAna.Application/Etiquetas/Queries/ListarHistorico/ListarHistoricoQueryHandler.cs
using CasaDiAna.Application.Etiquetas.Commands.RegistrarImpressao;
using CasaDiAna.Application.Etiquetas.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Etiquetas.Queries.ListarHistorico;

public class ListarHistoricoQueryHandler
    : IRequestHandler<ListarHistoricoQuery, IReadOnlyList<HistoricoImpressaoDto>>
{
    private readonly IHistoricoImpressaoRepository _historico;

    public ListarHistoricoQueryHandler(IHistoricoImpressaoRepository historico)
        => _historico = historico;

    public async Task<IReadOnlyList<HistoricoImpressaoDto>> Handle(
        ListarHistoricoQuery request,
        CancellationToken cancellationToken)
    {
        var registros = await _historico.ListarAsync(request.ProdutoId, cancellationToken);
        return registros
            .Select(h => RegistrarImpressaoCommandHandler.ToDto(h, h.Produto?.Nome ?? ""))
            .ToList();
    }
}
```

- [ ] **Step 9: Rodar o teste para confirmar que passa**

```bash
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test --filter 'RegistrarImpressaoCommandHandlerTests'"
```

Esperado: PASS (2 testes).

- [ ] **Step 10: Rodar todos os testes**

```bash
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test"
```

Esperado: todos passam.

- [ ] **Step 11: Commit**

```bash
git add src/CasaDiAna.Application/Etiquetas/
git add tests/CasaDiAna.Application.Tests/Etiquetas/
git commit -m "feat: application layer e testes do módulo de etiquetas"
```

---

## Task 8: API – EtiquetasController

**Files:**
- Create: `CasaDiAna/src/CasaDiAna.API/Controllers/EtiquetasController.cs`

- [ ] **Step 1: Criar o controller**

```csharp
// CasaDiAna/src/CasaDiAna.API/Controllers/EtiquetasController.cs
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Etiquetas.Commands.RegistrarImpressao;
using CasaDiAna.Application.Etiquetas.Dtos;
using CasaDiAna.Application.Etiquetas.Queries.ListarHistorico;
using CasaDiAna.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/etiquetas")]
[Authorize]
public class EtiquetasController : ControllerBase
{
    private readonly IMediator _mediator;

    public EtiquetasController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// Registra uma impressão de etiqueta no histórico.
    /// Chamado após o frontend executar o window.print().
    /// </summary>
    [HttpPost("historico")]
    public async Task<IActionResult> RegistrarImpressao(
        [FromBody] RegistrarImpressaoRequest body,
        CancellationToken ct = default)
    {
        var comando = new RegistrarImpressaoCommand(
            body.ProdutoId,
            body.TipoEtiqueta,
            body.Quantidade,
            body.DataProducao);

        var resultado = await _mediator.Send(comando, ct);
        return Ok(ApiResponse<HistoricoImpressaoDto>.Ok(resultado));
    }

    /// <summary>
    /// Lista o histórico de impressões, opcionalmente filtrado por produto.
    /// </summary>
    [HttpGet("historico")]
    public async Task<IActionResult> ListarHistorico(
        [FromQuery] Guid? produtoId = null,
        CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarHistoricoQuery(produtoId), ct);
        return Ok(ApiResponse<IReadOnlyList<HistoricoImpressaoDto>>.Ok(resultado));
    }
}

public record RegistrarImpressaoRequest(
    Guid ProdutoId,
    TipoEtiqueta TipoEtiqueta,
    int Quantidade,
    DateTime DataProducao);
```

- [ ] **Step 2: Build completo**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build"
```

Esperado: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add src/CasaDiAna.API/Controllers/EtiquetasController.cs
git commit -m "feat: EtiquetasController com registro e listagem de histórico"
```

---

## Task 9: Frontend – etiquetasService e EtiquetasPage

**Files:**
- Create: `CasaDiAna/frontend/src/lib/etiquetasService.ts`
- Create: `CasaDiAna/frontend/src/features/etiquetas/pages/EtiquetasPage.tsx`

- [ ] **Step 1: Criar etiquetasService.ts**

```typescript
// CasaDiAna/frontend/src/lib/etiquetasService.ts
import { api } from './api'

export type TipoEtiqueta = 1 | 2 | 3

export interface HistoricoImpressao {
  id: string
  produtoId: string
  produtoNome: string
  tipoEtiqueta: TipoEtiqueta
  quantidade: number
  dataProducao: string
  impressoEm: string
}

export interface RegistrarImpressaoInput {
  produtoId: string
  tipoEtiqueta: TipoEtiqueta
  quantidade: number
  dataProducao: string
}

interface ApiResponse<T> {
  sucesso: boolean
  dados: T
  erros: string[]
}

export const etiquetasService = {
  async listarHistorico(produtoId?: string): Promise<HistoricoImpressao[]> {
    const params = produtoId ? `?produtoId=${produtoId}` : ''
    const res = await api.get<ApiResponse<HistoricoImpressao[]>>(`/etiquetas/historico${params}`)
    return res.data.dados
  },

  async registrarImpressao(input: RegistrarImpressaoInput): Promise<HistoricoImpressao> {
    const res = await api.post<ApiResponse<HistoricoImpressao>>('/etiquetas/historico', input)
    return res.data.dados
  },
}
```

- [ ] **Step 2: Criar EtiquetasPage.tsx**

```tsx
// CasaDiAna/frontend/src/features/etiquetas/pages/EtiquetasPage.tsx
import { useEffect, useRef, useState } from 'react'
import { PrinterIcon, ClockIcon } from '@heroicons/react/24/outline'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { etiquetasService, type TipoEtiqueta, type HistoricoImpressao } from '@/lib/etiquetasService'
import type { Produto } from '@/types/producao'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatarData(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('pt-BR')
}

function calcularValidade(dataProducao: string, diasValidade: number | null): string {
  if (!diasValidade) return '—'
  const d = new Date(dataProducao)
  d.setDate(d.getDate() + diasValidade)
  return d.toLocaleDateString('pt-BR')
}

const TIPO_LABELS: Record<TipoEtiqueta, string> = {
  1: 'Completa',
  2: 'Simples',
  3: 'Nutricional',
}

// ─── Geradores de HTML das etiquetas ────────────────────────────────────────

function htmlEtiquetaCompleta(
  produtoNome: string,
  dataProducao: string,
  validade: string,
  quantidade: number,
): string {
  const etiqueta = `
    <div class="etiqueta">
      <div class="marca">CASA DI ANA</div>
      <div class="sep"></div>
      <div class="nome">${produtoNome}</div>
      <div class="footer">
        <div class="linha"><span class="lbl">FABRICAÇÃO:</span> ${dataProducao}</div>
        <div class="linha validade"><span class="lbl">VÁLIDO ATÉ:</span> ${validade}</div>
      </div>
    </div>`
  const etiquetas = Array(quantidade).fill(etiqueta).join('')
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    @page { size: 100mm 50mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; }
    .etiqueta {
      width: 100mm; height: 50mm;
      border: 0.5mm solid #333;
      padding: 3mm 4mm;
      display: flex; flex-direction: column;
      page-break-after: always;
    }
    .marca { font-size: 7pt; font-weight: bold; letter-spacing: 2px; color: #555; text-transform: uppercase; }
    .sep { height: 0.3mm; background: #333; margin: 2mm 0; }
    .nome { font-size: 16pt; font-weight: bold; color: #1a1a1a; flex: 1; display: flex; align-items: center; word-break: break-word; }
    .footer { margin-top: auto; }
    .linha { font-size: 8pt; color: #333; margin-top: 1mm; }
    .validade { font-weight: bold; font-size: 9pt; color: #000; }
    .lbl { color: #666; }
  </style></head><body>${etiquetas}</body></html>`
}

function htmlEtiquetaSimples(
  produtoNome: string,
  validade: string,
  quantidade: number,
): string {
  const etiqueta = `
    <div class="etiqueta">
      <div class="nome">${produtoNome}</div>
      <div class="validade">Val.: ${validade}</div>
    </div>`
  const etiquetas = Array(quantidade).fill(etiqueta).join('')
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    @page { size: 70mm 30mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; }
    .etiqueta {
      width: 70mm; height: 30mm;
      border: 0.5mm solid #333;
      padding: 3mm;
      display: flex; flex-direction: column; justify-content: center;
      page-break-after: always;
    }
    .nome { font-size: 11pt; font-weight: bold; color: #1a1a1a; word-break: break-word; }
    .validade { font-size: 9pt; color: #333; margin-top: 2mm; }
  </style></head><body>${etiquetas}</body></html>`
}

function htmlEtiquetaNutricional(
  produtoNome: string,
  dataProducao: string,
  validade: string,
  quantidade: number,
): string {
  const etiqueta = `
    <div class="etiqueta">
      <div class="titulo">INFORMAÇÃO NUTRICIONAL</div>
      <div class="sep-thick"></div>
      <div class="produto">${produtoNome}</div>
      <div class="sep"></div>
      <table>
        <tr><td class="desc">Valor Energético</td><td class="val">___kcal / ___kJ</td></tr>
        <tr><td class="desc">Carboidratos</td><td class="val">___g</td></tr>
        <tr><td class="desc">Açúcares totais</td><td class="val">___g</td></tr>
        <tr><td class="desc">Proteínas</td><td class="val">___g</td></tr>
        <tr><td class="desc">Gorduras totais</td><td class="val">___g</td></tr>
        <tr><td class="desc">Gorduras saturadas</td><td class="val">___g</td></tr>
        <tr><td class="desc">Fibra alimentar</td><td class="val">___g</td></tr>
        <tr><td class="desc">Sódio</td><td class="val">___mg</td></tr>
      </table>
      <div class="sep-thick"></div>
      <div class="footer">
        <span>Fab: ${dataProducao}</span>
        <span>Val: ${validade}</span>
        <span>Casa di Ana</span>
      </div>
    </div>`
  const etiquetas = Array(quantidade).fill(etiqueta).join('')
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    @page { size: 80mm 120mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; }
    .etiqueta {
      width: 80mm; height: 120mm;
      border: 0.8mm solid #000;
      padding: 3mm;
      display: flex; flex-direction: column;
      page-break-after: always;
    }
    .titulo { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
    .sep-thick { height: 0.8mm; background: #000; margin: 1.5mm 0; }
    .sep { height: 0.3mm; background: #666; margin: 1.5mm 0; }
    .produto { font-size: 10pt; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; flex: 1; }
    td { font-size: 7.5pt; padding: 0.8mm 0; border-bottom: 0.2mm solid #ccc; }
    .desc { color: #222; }
    .val { text-align: right; color: #444; }
    .footer { display: flex; justify-content: space-between; font-size: 7pt; color: #444; margin-top: auto; }
  </style></head><body>${etiquetas}</body></html>`
}

// ─── Preview das etiquetas (escalonado) ─────────────────────────────────────

interface PreviewProps {
  produto: Produto | null
  tipo: TipoEtiqueta
  dataProducao: string
}

function LabelPreview({ produto, tipo, dataProducao }: PreviewProps) {
  if (!produto) {
    return (
      <div
        className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed"
        style={{ borderColor: 'var(--ada-border)', minHeight: 200 }}
      >
        <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>
          Selecione um produto para ver a prévia
        </p>
      </div>
    )
  }

  const validade = calcularValidade(dataProducao, produto.diasValidade)
  const dataPtBr = new Date(dataProducao).toLocaleDateString('pt-BR')

  if (tipo === 1) {
    return (
      <div
        style={{
          width: 300,
          height: 150,
          border: '1.5px solid var(--ada-border)',
          borderRadius: 4,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          color: '#000',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#555' }}>
          CASA DI ANA
        </div>
        <div style={{ height: 1, background: '#333', margin: '6px 0' }} />
        <div style={{ fontSize: 18, fontWeight: 700, flex: 1, display: 'flex', alignItems: 'center' }}>
          {produto.nome}
        </div>
        <div style={{ fontSize: 10, color: '#444' }}>
          FABRICAÇÃO: {dataPtBr}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#000', marginTop: 2 }}>
          VÁLIDO ATÉ: {validade}
        </div>
      </div>
    )
  }

  if (tipo === 2) {
    return (
      <div
        style={{
          width: 210,
          height: 90,
          border: '1.5px solid var(--ada-border)',
          borderRadius: 4,
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#fff',
          color: '#000',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700 }}>{produto.nome}</div>
        <div style={{ fontSize: 11, marginTop: 6, color: '#333' }}>Val.: {validade}</div>
      </div>
    )
  }

  // Nutricional
  return (
    <div
      style={{
        width: 240,
        height: 360,
        border: '2px solid #000',
        borderRadius: 4,
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        color: '#000',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Informação Nutricional
      </div>
      <div style={{ height: 2, background: '#000', margin: '4px 0' }} />
      <div style={{ fontSize: 11, fontWeight: 700 }}>{produto.nome}</div>
      <div style={{ height: 1, background: '#666', margin: '4px 0' }} />
      {[
        ['Valor Energético', '___kcal'],
        ['Carboidratos', '___g'],
        ['Açúcares', '___g'],
        ['Proteínas', '___g'],
        ['Gorduras totais', '___g'],
        ['Gord. saturadas', '___g'],
        ['Fibra alimentar', '___g'],
        ['Sódio', '___mg'],
      ].map(([desc, val]) => (
        <div key={desc} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, borderBottom: '0.5px solid #ccc', padding: '2px 0' }}>
          <span>{desc}</span><span style={{ color: '#555' }}>{val}</span>
        </div>
      ))}
      <div style={{ height: 2, background: '#000', margin: '4px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#444', marginTop: 'auto' }}>
        <span>Fab: {dataPtBr}</span>
        <span>Val: {validade}</span>
        <span>Casa di Ana</span>
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export function EtiquetasPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtoId, setProdutoId] = useState('')
  const [tipo, setTipo] = useState<TipoEtiqueta>(1)
  const [dataProducao, setDataProducao] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [quantidade, setQuantidade] = useState(1)
  const [historico, setHistorico] = useState<HistoricoImpressao[]>([])
  const [imprimindo, setImprimindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const produto = produtos.find(p => p.id === produtoId) ?? null

  useEffect(() => {
    produtosService.listar().then(setProdutos).catch(() => {})
    etiquetasService.listarHistorico().then(setHistorico).catch(() => {})
  }, [])

  const handleImprimir = async () => {
    if (!produto) return
    setImprimindo(true)
    setErro(null)

    try {
      const validade = calcularValidade(dataProducao, produto.diasValidade)
      const dataPtBr = new Date(dataProducao).toLocaleDateString('pt-BR')

      let html = ''
      if (tipo === 1) html = htmlEtiquetaCompleta(produto.nome, dataPtBr, validade, quantidade)
      else if (tipo === 2) html = htmlEtiquetaSimples(produto.nome, validade, quantidade)
      else html = htmlEtiquetaNutricional(produto.nome, dataPtBr, validade, quantidade)

      const win = window.open('', '_blank', 'width=600,height=400')
      if (win) {
        win.document.write(html)
        win.document.close()
        win.focus()
        win.print()
        setTimeout(() => win.close(), 1000)
      }

      // Registrar no histórico após imprimir
      const novo = await etiquetasService.registrarImpressao({
        produtoId: produto.id,
        tipoEtiqueta: tipo,
        quantidade,
        dataProducao,
      })
      setHistorico(prev => [novo, ...prev])
    } catch {
      setErro('Erro ao registrar impressão. A etiqueta pode ter sido impressa mesmo assim.')
    } finally {
      setImprimindo(false)
    }
  }

  const tiposOpcoes: { valor: TipoEtiqueta; label: string; desc: string; dim: string }[] = [
    { valor: 1, label: 'Completa', desc: 'Logo + Nome + Validade', dim: '100×50mm' },
    { valor: 2, label: 'Simples', desc: 'Nome + Validade', dim: '70×30mm' },
    { valor: 3, label: 'Nutricional', desc: 'Tabela Nutricional', dim: '80×120mm' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}>
          Etiquetas
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--ada-muted)' }}>
          Gere e imprima etiquetas térmicas para os produtos
        </p>
      </div>

      {/* Painel principal: configuração + prévia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Configuração ── */}
        <div
          className="rounded-xl border p-6 space-y-5"
          style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Configurar Impressão
          </p>

          {/* Produto */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-text)' }}>
              Produto <span className="text-red-500">*</span>
            </label>
            <select
              value={produtoId}
              onChange={e => setProdutoId(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
              style={{
                background: 'var(--ada-bg)',
                borderColor: 'var(--ada-border)',
                color: 'var(--ada-text)',
              }}
            >
              <option value="">Selecione um produto...</option>
              {produtos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                  {p.diasValidade ? ` (${p.diasValidade} dias)` : ' (sem validade)'}
                </option>
              ))}
            </select>
            {produto && !produto.diasValidade && (
              <p className="text-xs mt-1" style={{ color: 'var(--ada-warning, #d97706)' }}>
                Este produto não tem dias de validade cadastrado. A data de validade aparecerá como —.
              </p>
            )}
          </div>

          {/* Tipo de etiqueta */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-text)' }}>
              Tipo de Etiqueta
            </label>
            <div className="grid grid-cols-3 gap-2">
              {tiposOpcoes.map(op => (
                <button
                  key={op.valor}
                  type="button"
                  onClick={() => setTipo(op.valor)}
                  className="rounded-lg border p-2.5 text-left transition-colors"
                  style={{
                    background: tipo === op.valor ? 'var(--sb-accent)' : 'var(--ada-bg)',
                    borderColor: tipo === op.valor ? 'var(--sb-accent)' : 'var(--ada-border)',
                    color: tipo === op.valor ? '#fff' : 'var(--ada-text)',
                  }}
                >
                  <div className="text-xs font-semibold">{op.label}</div>
                  <div className="text-[10px] mt-0.5 opacity-75">{op.dim}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Data de produção */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-text)' }}>
              Data de Produção
            </label>
            <input
              type="date"
              value={dataProducao}
              onChange={e => setDataProducao(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
              style={{
                background: 'var(--ada-bg)',
                borderColor: 'var(--ada-border)',
                color: 'var(--ada-text)',
              }}
            />
          </div>

          {/* Quantidade */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-text)' }}>
              Quantidade de Etiquetas
            </label>
            <input
              type="number"
              min={1}
              max={500}
              value={quantidade}
              onChange={e => setQuantidade(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
              style={{
                background: 'var(--ada-bg)',
                borderColor: 'var(--ada-border)',
                color: 'var(--ada-text)',
              }}
            />
          </div>

          {erro && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'var(--ada-error-bg)', color: 'var(--ada-error-text)' }}>
              {erro}
            </p>
          )}

          <button
            onClick={handleImprimir}
            disabled={!produto || imprimindo}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: 'var(--sb-accent)' }}
          >
            <PrinterIcon className="h-4 w-4" />
            {imprimindo ? 'Processando...' : `Imprimir ${quantidade} ${quantidade === 1 ? 'etiqueta' : 'etiquetas'}`}
          </button>
        </div>

        {/* ── Prévia ── */}
        <div
          className="rounded-xl border p-6 flex flex-col"
          style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Prévia da Etiqueta
          </p>
          <div className="flex-1 flex items-center justify-center">
            <LabelPreview produto={produto} tipo={tipo} dataProducao={dataProducao} />
          </div>
          <p className="text-xs text-center mt-4" style={{ color: 'var(--ada-muted)' }}>
            {TIPO_LABELS[tipo]} · {tiposOpcoes.find(o => o.valor === tipo)?.dim}
            {produto?.diasValidade
              ? ` · Validade: ${calcularValidade(dataProducao, produto.diasValidade)}`
              : ''}
          </p>
        </div>
      </div>

      {/* Histórico de impressões */}
      <div
        className="rounded-xl border"
        style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}
      >
        <div
          className="px-5 py-4 border-b flex items-center gap-2"
          style={{ borderColor: 'var(--ada-border)' }}
        >
          <ClockIcon className="h-4 w-4" style={{ color: 'var(--ada-muted)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
            Histórico de Impressões
          </h2>
          <span
            className="ml-auto text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--ada-hover)', color: 'var(--ada-muted)' }}
          >
            Últimas 100
          </span>
        </div>

        {historico.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>
              Nenhuma impressão registrada ainda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ada-border)' }}>
                  {['Produto', 'Tipo', 'Qtd', 'Data de Produção', 'Validade', 'Impresso em'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--ada-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historico.map((h, i) => {
                  const prod = produtos.find(p => p.id === h.produtoId)
                  const validade = calcularValidade(h.dataProducao, prod?.diasValidade ?? null)
                  return (
                    <tr
                      key={h.id}
                      style={{
                        borderBottom: '1px solid var(--ada-border)',
                        background: i % 2 === 0 ? 'transparent' : 'var(--ada-hover)',
                      }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--ada-heading)' }}>
                        {h.produtoNome}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ background: 'var(--ada-hover)', color: 'var(--ada-text)' }}
                        >
                          {TIPO_LABELS[h.tipoEtiqueta]}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--ada-text)' }}>
                        {h.quantidade}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--ada-text)' }}>
                        {formatarData(h.dataProducao)}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--ada-text)' }}>
                        {validade}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--ada-muted)' }}>
                        {new Date(h.impressoEm).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar tipos TypeScript**

```bash
cd CasaDiAna/frontend
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
cd ..
git add frontend/src/lib/etiquetasService.ts
git add frontend/src/features/etiquetas/
git commit -m "feat: etiquetasService e EtiquetasPage com prévia e histórico"
```

---

## Task 10: Rotas, Sidebar e Build Final

**Files:**
- Modify: `CasaDiAna/frontend/src/routes/AppRoutes.tsx`
- Modify: `CasaDiAna/frontend/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Adicionar rota em AppRoutes.tsx**

Adicionar o import no topo do arquivo (após o import de `NotificacoesPage`):

```typescript
import { EtiquetasPage } from '@/features/etiquetas/pages/EtiquetasPage'
```

Adicionar a rota dentro do `<Route element={<MainLayout />}>`, após a rota de notificações:

```tsx
{/* Etiquetas */}
<Route path="/etiquetas" element={<EtiquetasPage />} />
```

- [ ] **Step 2: Adicionar item na Sidebar**

No array `grupos` em `Sidebar.tsx`, adicionar um novo item dentro do grupo `'Produção'`. Importar o ícone no topo:

```typescript
import {
  // ... ícones existentes ...
  QrCodeIcon,
} from '@heroicons/react/24/outline'
```

Adicionar o item após `{ label: 'Perdas', ... }`:

```typescript
{ label: 'Etiquetas', href: '/etiquetas', icon: QrCodeIcon },
```

O grupo Produção completo fica:

```typescript
{
  titulo: 'Produção',
  itens: [
    { label: 'Categorias de Produto', href: '/producao/categorias-produto', icon: SquaresPlusIcon       },
    { label: 'Produtos',              href: '/producao/produtos',            icon: CubeIcon              },
    { label: 'Produção Diária',       href: '/producao/diaria',              icon: FireIcon              },
    { label: 'Vendas Diárias',        href: '/producao/vendas',              icon: BanknotesIcon         },
    { label: 'Perdas',                href: '/producao/perdas',              icon: ExclamationCircleIcon },
    { label: 'Etiquetas',             href: '/etiquetas',                    icon: QrCodeIcon            },
  ],
},
```

- [ ] **Step 3: Verificar tipos**

```bash
cd CasaDiAna/frontend
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Build de produção**

```bash
npm run build
```

Esperado: `dist/` gerado sem erros.

- [ ] **Step 5: Rodar todos os testes do backend**

```bash
cd ..
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test"
```

Esperado: todos passam.

- [ ] **Step 6: Commit e push**

```bash
git add frontend/src/routes/AppRoutes.tsx
git add frontend/src/components/layout/Sidebar.tsx
git commit -m "feat: rotas e sidebar para módulo de etiquetas"
git push
```

---

## Self-Review

**Spec coverage:**
- ✅ 3 tipos de etiqueta (Completa 100×50mm, Simples 70×30mm, Nutricional 80×120mm)
- ✅ Validade calculada automaticamente via DiasValidade + DataProducao
- ✅ Prévia em tempo real (LabelPreview component)
- ✅ Impressão térmica via window.open + window.print()
- ✅ Histórico de impressões persistido no backend
- ✅ Campo DiasValidade adicionado ao Produto (entity + form + API)
- ✅ Anti-regressão: testes existentes não quebram
- ✅ Sidebar + rota integrados
- ✅ CSS variables usadas na UI principal (sem hardcode de cores exceto dentro dos labels impressos)

**Consistência de tipos:**
- `HistoricoImpressaoDto` usa `TipoEtiqueta` enum — mesmo tipo em Command, Handler e Controller
- `TipoEtiqueta` frontend: `1 | 2 | 3` mapeia para `TipoEtiqueta.Completa = 1` etc. no backend
- `produtosService.listar()` já existe em `@/features/producao/produtos/services/produtosService` — confirmado no `ProdutoFormPage.tsx`

**Aviso:** A coluna `dias_validade` já não existirá no banco. As migrations `AddDiasValidadeToProduto` e `AddHistoricoImpressaoEtiquetas` rodam automaticamente na inicialização via `db.Database.Migrate()` (já configurado em `Program.cs`).
