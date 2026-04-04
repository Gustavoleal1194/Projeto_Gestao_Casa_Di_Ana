# Sistema de Notificações de Estoque — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um sistema de notificações persistidas que detecta automaticamente ingredientes com estoque baixo (ATENCAO, CRITICO, ZERADO), exibe um sino com contador no header e uma página de gerenciamento de notificações.

**Architecture:** Domain entity `NotificacaoEstoque` + repositório → serviço de aplicação verifica e cria notificações após cada movimentação de estoque → API REST com 4 endpoints → frontend com polling a cada 30s + página dedicada. Sem SignalR (não instalado) — polling REST é suficiente para ERP.

**Tech Stack:** ASP.NET Core 8, Clean Architecture, CQRS/MediatR, EF Core 8 + PostgreSQL, React 18 + TypeScript + Tailwind CSS v4, Axios polling.

---

## Mapa de Arquivos

### Criar (novos)

| Arquivo | Responsabilidade |
|---|---|
| `src/CasaDiAna.Domain/Entities/NotificacaoEstoque.cs` | Entidade de domínio com factory method e `MarcarComoLida()` |
| `src/CasaDiAna.Domain/Enums/TipoNotificacaoEstoque.cs` | Enum: Atencao=1, Critico=2, Zerado=3 |
| `src/CasaDiAna.Domain/Interfaces/INotificacaoEstoqueRepository.cs` | Contrato do repositório |
| `src/CasaDiAna.Application/Notificacoes/Services/INotificacaoEstoqueService.cs` | Interface do serviço (usada pelos handlers) |
| `src/CasaDiAna.Application/Notificacoes/Dtos/NotificacaoEstoqueDto.cs` | DTO de resposta |
| `src/CasaDiAna.Application/Notificacoes/Queries/ListarNotificacoes/ListarNotificacoesQuery.cs` | Query + Handler |
| `src/CasaDiAna.Application/Notificacoes/Queries/ContarNaoLidas/ContarNaoLidasQuery.cs` | Query + Handler |
| `src/CasaDiAna.Application/Notificacoes/Commands/MarcarLida/MarcarLidaCommand.cs` | Command + Handler |
| `src/CasaDiAna.Application/Notificacoes/Commands/MarcarTodasLidas/MarcarTodasLidasCommand.cs` | Command + Handler |
| `src/CasaDiAna.Infrastructure/Persistence/Configurations/NotificacaoEstoqueConfiguration.cs` | EF Core mapping explícito |
| `src/CasaDiAna.Infrastructure/Repositories/NotificacaoEstoqueRepository.cs` | Implementação do repositório |
| `src/CasaDiAna.Infrastructure/Services/NotificacaoEstoqueService.cs` | Implementação do serviço |
| `src/CasaDiAna.API/Controllers/NotificacoesController.cs` | 4 endpoints REST |
| `frontend/src/lib/notificacoesService.ts` | Chamadas HTTP via Axios |
| `frontend/src/hooks/useNotificacoesCount.ts` | Hook de polling (30s) |
| `frontend/src/features/notificacoes/pages/NotificacoesPage.tsx` | Página de lista + gerenciamento |

### Modificar (existentes)

| Arquivo | O que muda |
|---|---|
| `src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs` | Adicionar `DbSet<NotificacaoEstoque>` |
| `src/CasaDiAna.Infrastructure/DependencyInjection.cs` | Registrar repositório e serviço |
| `src/CasaDiAna.Application/Entradas/Commands/RegistrarEntrada/RegistrarEntradaCommandHandler.cs` | Injetar serviço, verificar após save |
| `src/CasaDiAna.Application/Estoque/Commands/CorrigirEstoque/CorrigirEstoqueCommandHandler.cs` | Injetar serviço, verificar após save |
| `src/CasaDiAna.Application/Inventarios/Commands/FinalizarInventario/FinalizarInventarioCommandHandler.cs` | Injetar serviço, verificar após save |
| `src/CasaDiAna.Application/ProducaoDiaria/Commands/RegistrarProducao/RegistrarProducaoCommandHandler.cs` | Injetar serviço, verificar após save |
| `frontend/src/components/layout/TopHeader.tsx` | Adicionar sino + badge contador |
| `frontend/src/routes/AppRoutes.tsx` | Adicionar rota `/notificacoes` |

---

## Task 1: Entidade de domínio, enum e interface do repositório

**Files:**
- Create: `src/CasaDiAna.Domain/Enums/TipoNotificacaoEstoque.cs`
- Create: `src/CasaDiAna.Domain/Entities/NotificacaoEstoque.cs`
- Create: `src/CasaDiAna.Domain/Interfaces/INotificacaoEstoqueRepository.cs`

- [ ] **Step 1.1: Criar enum**

```csharp
// src/CasaDiAna.Domain/Enums/TipoNotificacaoEstoque.cs
namespace CasaDiAna.Domain.Enums;

public enum TipoNotificacaoEstoque
{
    Atencao = 1,  // próximo do mínimo (estoqueAtual <= estoqueMinimo * 1.5)
    Critico = 2,  // abaixo do mínimo (0 < estoqueAtual <= estoqueMinimo)
    Zerado  = 3,  // quantidade = 0
}
```

- [ ] **Step 1.2: Criar entidade**

```csharp
// src/CasaDiAna.Domain/Entities/NotificacaoEstoque.cs
using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Domain.Entities;

public class NotificacaoEstoque
{
    public Guid Id { get; private set; }
    public string Titulo { get; private set; } = string.Empty;
    public string Mensagem { get; private set; } = string.Empty;
    public TipoNotificacaoEstoque Tipo { get; private set; }
    public DateTime DataCriacao { get; private set; }
    public bool Lida { get; private set; }
    public Guid IngredienteId { get; private set; }

    // Navegação — carregada via Include
    public Ingrediente? Ingrediente { get; private set; }

    // EF Core
    private NotificacaoEstoque() { }

    public static NotificacaoEstoque Criar(
        Guid ingredienteId,
        string titulo,
        string mensagem,
        TipoNotificacaoEstoque tipo)
    {
        return new NotificacaoEstoque
        {
            Id           = Guid.NewGuid(),
            IngredienteId = ingredienteId,
            Titulo       = titulo,
            Mensagem     = mensagem,
            Tipo         = tipo,
            DataCriacao  = DateTime.UtcNow,
            Lida         = false,
        };
    }

    public void MarcarComoLida() => Lida = true;
}
```

- [ ] **Step 1.3: Criar interface do repositório**

```csharp
// src/CasaDiAna.Domain/Interfaces/INotificacaoEstoqueRepository.cs
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface INotificacaoEstoqueRepository
{
    Task<IReadOnlyList<NotificacaoEstoque>> ListarAsync(
        bool apenasNaoLidas = false,
        CancellationToken ct = default);

    Task<bool> ExisteNaoLidaParaIngredienteAsync(
        Guid ingredienteId,
        CancellationToken ct = default);

    Task<int> ContarNaoLidasAsync(CancellationToken ct = default);

    Task<NotificacaoEstoque?> ObterPorIdAsync(Guid id, CancellationToken ct = default);

    Task AdicionarAsync(NotificacaoEstoque notificacao, CancellationToken ct = default);

    void Atualizar(NotificacaoEstoque notificacao);

    Task MarcarTodasComoLidasAsync(CancellationToken ct = default);

    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

- [ ] **Step 1.4: Build — verificar sem erros**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build -nologo -v q"
```
Esperado: `Build succeeded. 0 Warning(s). 0 Error(s).`

- [ ] **Step 1.5: Commit**

```bash
git add src/CasaDiAna.Domain/
git commit -m "feat(domain): adiciona entidade NotificacaoEstoque, enum e interface do repositório"
```

---

## Task 2: Configuração EF Core + DbSet no AppDbContext

**Files:**
- Create: `src/CasaDiAna.Infrastructure/Persistence/Configurations/NotificacaoEstoqueConfiguration.cs`
- Modify: `src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs`

- [ ] **Step 2.1: Criar configuration**

```csharp
// src/CasaDiAna.Infrastructure/Persistence/Configurations/NotificacaoEstoqueConfiguration.cs
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class NotificacaoEstoqueConfiguration : IEntityTypeConfiguration<NotificacaoEstoque>
{
    public void Configure(EntityTypeBuilder<NotificacaoEstoque> builder)
    {
        builder.ToTable("notificacoes_estoque", "estoque");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.Id)
               .HasColumnName("id");

        builder.Property(n => n.Titulo)
               .HasColumnName("titulo")
               .HasMaxLength(200)
               .IsRequired();

        builder.Property(n => n.Mensagem)
               .HasColumnName("mensagem")
               .HasMaxLength(1000)
               .IsRequired();

        builder.Property(n => n.Tipo)
               .HasColumnName("tipo")
               .IsRequired();

        builder.Property(n => n.DataCriacao)
               .HasColumnName("data_criacao")
               .IsRequired();

        builder.Property(n => n.Lida)
               .HasColumnName("lida")
               .IsRequired();

        builder.Property(n => n.IngredienteId)
               .HasColumnName("ingrediente_id")
               .IsRequired();

        // FK para Ingrediente — cascade delete: se ingrediente for excluído, remove notificações
        builder.HasOne(n => n.Ingrediente)
               .WithMany()
               .HasForeignKey(n => n.IngredienteId)
               .OnDelete(DeleteBehavior.Cascade);

        // Índice composto para queries de "não lidas por ingrediente" (evita full scan)
        builder.HasIndex(n => new { n.IngredienteId, n.Lida })
               .HasDatabaseName("ix_notificacoes_estoque_ingrediente_lida");

        // Índice para ordenação por data (mais recente primeiro)
        builder.HasIndex(n => n.DataCriacao)
               .HasDatabaseName("ix_notificacoes_estoque_data_criacao");
    }
}
```

- [ ] **Step 2.2: Adicionar DbSet no AppDbContext**

Abrir `src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs` e adicionar a propriedade junto com os outros DbSets existentes:

```csharp
public DbSet<NotificacaoEstoque> NotificacoesEstoque => Set<NotificacaoEstoque>();
```

> A `NotificacaoEstoqueConfiguration` será detectada automaticamente pelo `ApplyConfigurationsFromAssembly` já presente no `OnModelCreating`.

- [ ] **Step 2.3: Build**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build -nologo -v q"
```
Esperado: `Build succeeded. 0 Error(s).`

- [ ] **Step 2.4: Commit**

```bash
git add src/CasaDiAna.Infrastructure/Persistence/
git commit -m "feat(infra): configura mapeamento EF Core para NotificacaoEstoque"
```

---

## Task 3: Repositório (Infrastructure)

**Files:**
- Create: `src/CasaDiAna.Infrastructure/Repositories/NotificacaoEstoqueRepository.cs`

- [ ] **Step 3.1: Criar repositório**

```csharp
// src/CasaDiAna.Infrastructure/Repositories/NotificacaoEstoqueRepository.cs
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class NotificacaoEstoqueRepository : INotificacaoEstoqueRepository
{
    private readonly AppDbContext _db;

    public NotificacaoEstoqueRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<NotificacaoEstoque>> ListarAsync(
        bool apenasNaoLidas = false,
        CancellationToken ct = default)
    {
        var query = _db.NotificacoesEstoque
            .Include(n => n.Ingrediente)
            .AsQueryable();

        if (apenasNaoLidas)
            query = query.Where(n => !n.Lida);

        return await query
            .OrderByDescending(n => n.DataCriacao)
            .ToListAsync(ct);
    }

    public async Task<bool> ExisteNaoLidaParaIngredienteAsync(
        Guid ingredienteId,
        CancellationToken ct = default)
    {
        return await _db.NotificacoesEstoque
            .AnyAsync(n => n.IngredienteId == ingredienteId && !n.Lida, ct);
    }

    public async Task<int> ContarNaoLidasAsync(CancellationToken ct = default)
    {
        return await _db.NotificacoesEstoque
            .CountAsync(n => !n.Lida, ct);
    }

    public async Task<NotificacaoEstoque?> ObterPorIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.NotificacoesEstoque
            .Include(n => n.Ingrediente)
            .FirstOrDefaultAsync(n => n.Id == id, ct);
    }

    public async Task AdicionarAsync(NotificacaoEstoque notificacao, CancellationToken ct = default)
    {
        await _db.NotificacoesEstoque.AddAsync(notificacao, ct);
    }

    public void Atualizar(NotificacaoEstoque notificacao)
    {
        _db.NotificacoesEstoque.Update(notificacao);
    }

    public async Task MarcarTodasComoLidasAsync(CancellationToken ct = default)
    {
        await _db.NotificacoesEstoque
            .Where(n => !n.Lida)
            .ExecuteUpdateAsync(
                s => s.SetProperty(n => n.Lida, true),
                ct);
    }

    public async Task<int> SalvarAsync(CancellationToken ct = default)
    {
        return await _db.SaveChangesAsync(ct);
    }
}
```

- [ ] **Step 3.2: Build**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build -nologo -v q"
```
Esperado: `Build succeeded. 0 Error(s).`

- [ ] **Step 3.3: Commit**

```bash
git add src/CasaDiAna.Infrastructure/Repositories/NotificacaoEstoqueRepository.cs
git commit -m "feat(infra): implementa NotificacaoEstoqueRepository"
```

---

## Task 4: Migration do banco de dados

**Files:**
- Create: migration gerada pelo EF Core em `src/CasaDiAna.Infrastructure/Persistence/Migrations/`

- [ ] **Step 4.1: Parar processos dotnet se estiverem rodando**

```bash
powershell.exe -Command "Get-Process -Name 'CasaDiAna.API' -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep 1"
```

- [ ] **Step 4.2: Gerar migration**

```bash
powershell.exe -Command "dotnet ef migrations add AddNotificacoesEstoque --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API"
```

Esperado: arquivo `*_AddNotificacoesEstoque.cs` criado em `Migrations/`.

- [ ] **Step 4.3: Verificar conteúdo da migration gerada**

Abrir o arquivo `*_AddNotificacoesEstoque.cs` e confirmar que ele cria:
- Tabela `estoque.notificacoes_estoque` com colunas `id`, `titulo`, `mensagem`, `tipo`, `data_criacao`, `lida`, `ingrediente_id`
- FK para `estoque.ingredientes`
- Índices `ix_notificacoes_estoque_ingrediente_lida` e `ix_notificacoes_estoque_data_criacao`

- [ ] **Step 4.4: Aplicar migration**

```bash
powershell.exe -Command "dotnet ef database update --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API"
```

Esperado: `Done.`

- [ ] **Step 4.5: Commit**

```bash
git add src/CasaDiAna.Infrastructure/Persistence/Migrations/
git commit -m "feat(db): migration AddNotificacoesEstoque — cria tabela estoque.notificacoes_estoque"
```

---

## Task 5: Camada Application — DTO, interface do serviço, queries e commands

**Files:**
- Create: `src/CasaDiAna.Application/Notificacoes/Dtos/NotificacaoEstoqueDto.cs`
- Create: `src/CasaDiAna.Application/Notificacoes/Services/INotificacaoEstoqueService.cs`
- Create: `src/CasaDiAna.Application/Notificacoes/Queries/ListarNotificacoes/ListarNotificacoesQuery.cs`
- Create: `src/CasaDiAna.Application/Notificacoes/Queries/ContarNaoLidas/ContarNaoLidasQuery.cs`
- Create: `src/CasaDiAna.Application/Notificacoes/Commands/MarcarLida/MarcarLidaCommand.cs`
- Create: `src/CasaDiAna.Application/Notificacoes/Commands/MarcarTodasLidas/MarcarTodasLidasCommand.cs`

- [ ] **Step 5.1: Criar DTO**

```csharp
// src/CasaDiAna.Application/Notificacoes/Dtos/NotificacaoEstoqueDto.cs
namespace CasaDiAna.Application.Notificacoes.Dtos;

public record NotificacaoEstoqueDto(
    Guid Id,
    string Titulo,
    string Mensagem,
    string Tipo,           // "Atencao" | "Critico" | "Zerado"
    DateTime DataCriacao,
    bool Lida,
    Guid IngredienteId,
    string? IngredienteNome
);
```

- [ ] **Step 5.2: Criar interface do serviço**

```csharp
// src/CasaDiAna.Application/Notificacoes/Services/INotificacaoEstoqueService.cs
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Application.Notificacoes.Services;

/// <summary>
/// Serviço chamado após cada movimentação de estoque para verificar
/// se deve criar uma notificação de alerta para o ingrediente.
/// </summary>
public interface INotificacaoEstoqueService
{
    /// <summary>
    /// Verifica o nível de estoque do ingrediente e cria uma notificação
    /// se necessário e não houver duplicata ativa.
    /// </summary>
    Task VerificarECriarAsync(Ingrediente ingrediente, CancellationToken ct = default);

    Task MarcarComoLidaAsync(Guid id, CancellationToken ct = default);

    Task MarcarTodasComoLidasAsync(CancellationToken ct = default);
}
```

- [ ] **Step 5.3: Criar ListarNotificacoesQuery**

```csharp
// src/CasaDiAna.Application/Notificacoes/Queries/ListarNotificacoes/ListarNotificacoesQuery.cs
using CasaDiAna.Application.Notificacoes.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Notificacoes.Queries.ListarNotificacoes;

public record ListarNotificacoesQuery(bool ApenasNaoLidas = false)
    : IRequest<IReadOnlyList<NotificacaoEstoqueDto>>;

public class ListarNotificacoesQueryHandler
    : IRequestHandler<ListarNotificacoesQuery, IReadOnlyList<NotificacaoEstoqueDto>>
{
    private readonly INotificacaoEstoqueRepository _notificacoes;

    public ListarNotificacoesQueryHandler(INotificacaoEstoqueRepository notificacoes)
        => _notificacoes = notificacoes;

    public async Task<IReadOnlyList<NotificacaoEstoqueDto>> Handle(
        ListarNotificacoesQuery request, CancellationToken cancellationToken)
    {
        var lista = await _notificacoes.ListarAsync(request.ApenasNaoLidas, cancellationToken);
        return lista.Select(ToDto).ToList();
    }

    internal static NotificacaoEstoqueDto ToDto(NotificacaoEstoque n) => new(
        n.Id,
        n.Titulo,
        n.Mensagem,
        n.Tipo.ToString(),
        n.DataCriacao,
        n.Lida,
        n.IngredienteId,
        n.Ingrediente?.Nome
    );
}
```

- [ ] **Step 5.4: Criar ContarNaoLidasQuery**

```csharp
// src/CasaDiAna.Application/Notificacoes/Queries/ContarNaoLidas/ContarNaoLidasQuery.cs
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Notificacoes.Queries.ContarNaoLidas;

public record ContarNaoLidasQuery : IRequest<int>;

public class ContarNaoLidasQueryHandler : IRequestHandler<ContarNaoLidasQuery, int>
{
    private readonly INotificacaoEstoqueRepository _notificacoes;

    public ContarNaoLidasQueryHandler(INotificacaoEstoqueRepository notificacoes)
        => _notificacoes = notificacoes;

    public async Task<int> Handle(ContarNaoLidasQuery request, CancellationToken cancellationToken)
        => await _notificacoes.ContarNaoLidasAsync(cancellationToken);
}
```

- [ ] **Step 5.5: Criar MarcarLidaCommand**

```csharp
// src/CasaDiAna.Application/Notificacoes/Commands/MarcarLida/MarcarLidaCommand.cs
using CasaDiAna.Application.Notificacoes.Services;
using MediatR;

namespace CasaDiAna.Application.Notificacoes.Commands.MarcarLida;

public record MarcarLidaCommand(Guid Id) : IRequest;

public class MarcarLidaCommandHandler : IRequestHandler<MarcarLidaCommand>
{
    private readonly INotificacaoEstoqueService _service;

    public MarcarLidaCommandHandler(INotificacaoEstoqueService service) => _service = service;

    public async Task Handle(MarcarLidaCommand request, CancellationToken cancellationToken)
        => await _service.MarcarComoLidaAsync(request.Id, cancellationToken);
}
```

- [ ] **Step 5.6: Criar MarcarTodasLidasCommand**

```csharp
// src/CasaDiAna.Application/Notificacoes/Commands/MarcarTodasLidas/MarcarTodasLidasCommand.cs
using CasaDiAna.Application.Notificacoes.Services;
using MediatR;

namespace CasaDiAna.Application.Notificacoes.Commands.MarcarTodasLidas;

public record MarcarTodasLidasCommand : IRequest;

public class MarcarTodasLidasCommandHandler : IRequestHandler<MarcarTodasLidasCommand>
{
    private readonly INotificacaoEstoqueService _service;

    public MarcarTodasLidasCommandHandler(INotificacaoEstoqueService service) => _service = service;

    public async Task Handle(MarcarTodasLidasCommand request, CancellationToken cancellationToken)
        => await _service.MarcarTodasComoLidasAsync(cancellationToken);
}
```

- [ ] **Step 5.7: Build**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build -nologo -v q"
```
Esperado: `Build succeeded. 0 Error(s).`

- [ ] **Step 5.8: Commit**

```bash
git add src/CasaDiAna.Application/Notificacoes/
git commit -m "feat(app): DTO, interface do serviço, queries e commands de notificações"
```

---

## Task 6: Serviço de notificação (Infrastructure) + registro de DI

**Files:**
- Create: `src/CasaDiAna.Infrastructure/Services/NotificacaoEstoqueService.cs`
- Modify: `src/CasaDiAna.Infrastructure/DependencyInjection.cs`

- [ ] **Step 6.1: Criar implementação do serviço**

```csharp
// src/CasaDiAna.Infrastructure/Services/NotificacaoEstoqueService.cs
using CasaDiAna.Application.Notificacoes.Services;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;

namespace CasaDiAna.Infrastructure.Services;

public class NotificacaoEstoqueService : INotificacaoEstoqueService
{
    private readonly INotificacaoEstoqueRepository _notificacoes;

    public NotificacaoEstoqueService(INotificacaoEstoqueRepository notificacoes)
        => _notificacoes = notificacoes;

    public async Task VerificarECriarAsync(Ingrediente ingrediente, CancellationToken ct = default)
    {
        var nivel = DeterminarNivel(ingrediente);

        // Estoque está normal — não precisa notificar
        if (nivel is null) return;

        // Já existe notificação não lida para este ingrediente — sem duplicata
        var jaExiste = await _notificacoes.ExisteNaoLidaParaIngredienteAsync(ingrediente.Id, ct);
        if (jaExiste) return;

        var (titulo, mensagem) = GerarTexto(ingrediente, nivel.Value);
        var notificacao = NotificacaoEstoque.Criar(ingrediente.Id, titulo, mensagem, nivel.Value);

        await _notificacoes.AdicionarAsync(notificacao, ct);
        await _notificacoes.SalvarAsync(ct);
    }

    public async Task MarcarComoLidaAsync(Guid id, CancellationToken ct = default)
    {
        var notificacao = await _notificacoes.ObterPorIdAsync(id, ct)
            ?? throw new DomainException("Notificação não encontrada.");

        notificacao.MarcarComoLida();
        _notificacoes.Atualizar(notificacao);
        await _notificacoes.SalvarAsync(ct);
    }

    public async Task MarcarTodasComoLidasAsync(CancellationToken ct = default)
    {
        await _notificacoes.MarcarTodasComoLidasAsync(ct);
    }

    // ─── Lógica de nível ─────────────────────────────────────────────────────

    private static TipoNotificacaoEstoque? DeterminarNivel(Ingrediente ingrediente)
    {
        if (ingrediente.EstoqueAtual == 0)
            return TipoNotificacaoEstoque.Zerado;

        if (ingrediente.EstoqueAtual <= ingrediente.EstoqueMinimo)
            return TipoNotificacaoEstoque.Critico;

        // ATENCAO: estoque dentro de 50% acima do mínimo (e mínimo > 0)
        if (ingrediente.EstoqueMinimo > 0 &&
            ingrediente.EstoqueAtual <= ingrediente.EstoqueMinimo * 1.5m)
            return TipoNotificacaoEstoque.Atencao;

        return null; // estoque OK
    }

    private static (string titulo, string mensagem) GerarTexto(
        Ingrediente ingrediente,
        TipoNotificacaoEstoque nivel) => nivel switch
    {
        TipoNotificacaoEstoque.Zerado => (
            $"Estoque zerado: {ingrediente.Nome}",
            $"O ingrediente '{ingrediente.Nome}' está com estoque ZERO. " +
            "Realize uma entrada imediatamente para retomar a produção."
        ),
        TipoNotificacaoEstoque.Critico => (
            $"Estoque crítico: {ingrediente.Nome}",
            $"O ingrediente '{ingrediente.Nome}' está ABAIXO do mínimo — " +
            $"atual: {ingrediente.EstoqueAtual:G}, mínimo: {ingrediente.EstoqueMinimo:G}. " +
            "Providencie reposição urgente."
        ),
        TipoNotificacaoEstoque.Atencao => (
            $"Atenção ao estoque: {ingrediente.Nome}",
            $"O ingrediente '{ingrediente.Nome}' está próximo do nível mínimo — " +
            $"atual: {ingrediente.EstoqueAtual:G}, mínimo: {ingrediente.EstoqueMinimo:G}. " +
            "Verifique a necessidade de reposição."
        ),
        _ => throw new ArgumentOutOfRangeException(nameof(nivel))
    };
}
```

- [ ] **Step 6.2: Registrar no DI**

Em `src/CasaDiAna.Infrastructure/DependencyInjection.cs`, adicionar após a linha do `ICurrentUserService`:

```csharp
services.AddScoped<INotificacaoEstoqueRepository, NotificacaoEstoqueRepository>();
services.AddScoped<INotificacaoEstoqueService, NotificacaoEstoqueService>();
```

O bloco de registros ficará:
```csharp
// (linhas existentes...)
services.AddScoped<IJwtService, JwtService>();
services.AddScoped<ICurrentUserService, CurrentUserService>();
// ↓ adicionar aqui:
services.AddScoped<INotificacaoEstoqueRepository, NotificacaoEstoqueRepository>();
services.AddScoped<INotificacaoEstoqueService, NotificacaoEstoqueService>();
services.AddHttpContextAccessor();
```

- [ ] **Step 6.3: Adicionar using necessário no DependencyInjection.cs**

No topo do arquivo `DependencyInjection.cs`, adicionar:

```csharp
using CasaDiAna.Application.Notificacoes.Services;
```

- [ ] **Step 6.4: Build**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build -nologo -v q"
```
Esperado: `Build succeeded. 0 Error(s).`

- [ ] **Step 6.5: Commit**

```bash
git add src/CasaDiAna.Infrastructure/
git commit -m "feat(infra): implementa NotificacaoEstoqueService e registra DI"
```

---

## Task 7: Controller da API

**Files:**
- Create: `src/CasaDiAna.API/Controllers/NotificacoesController.cs`

- [ ] **Step 7.1: Criar controller**

```csharp
// src/CasaDiAna.API/Controllers/NotificacoesController.cs
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Notificacoes.Commands.MarcarLida;
using CasaDiAna.Application.Notificacoes.Commands.MarcarTodasLidas;
using CasaDiAna.Application.Notificacoes.Dtos;
using CasaDiAna.Application.Notificacoes.Queries.ContarNaoLidas;
using CasaDiAna.Application.Notificacoes.Queries.ListarNotificacoes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/notificacoes")]
[Authorize]
public class NotificacoesController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotificacoesController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// Lista todas as notificações. Passar ?apenasNaoLidas=true para filtrar.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] bool apenasNaoLidas = false,
        CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarNotificacoesQuery(apenasNaoLidas), ct);
        return Ok(ApiResponse<IReadOnlyList<NotificacaoEstoqueDto>>.Sucesso(resultado));
    }

    /// <summary>
    /// Retorna a contagem de notificações não lidas (usado pelo badge do sino).
    /// </summary>
    [HttpGet("contagem")]
    public async Task<IActionResult> Contar(CancellationToken ct = default)
    {
        var total = await _mediator.Send(new ContarNaoLidasQuery(), ct);
        return Ok(ApiResponse<int>.Sucesso(total));
    }

    /// <summary>
    /// Marca uma notificação específica como lida.
    /// </summary>
    [HttpPatch("{id:guid}/lida")]
    public async Task<IActionResult> MarcarLida(Guid id, CancellationToken ct = default)
    {
        await _mediator.Send(new MarcarLidaCommand(id), ct);
        return NoContent();
    }

    /// <summary>
    /// Marca todas as notificações pendentes como lidas.
    /// </summary>
    [HttpPatch("marcar-todas-lidas")]
    public async Task<IActionResult> MarcarTodasLidas(CancellationToken ct = default)
    {
        await _mediator.Send(new MarcarTodasLidasCommand(), ct);
        return NoContent();
    }
}
```

- [ ] **Step 7.2: Build**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build -nologo -v q"
```
Esperado: `Build succeeded. 0 Error(s).`

- [ ] **Step 7.3: Verificar ApiResponse — confirmar método estático**

Abrir `src/CasaDiAna.Application/Common/ApiResponse.cs` e confirmar que existe `ApiResponse<T>.Sucesso(T dados)`. Se a assinatura for diferente, ajustar o controller para usar a assinatura real.

- [ ] **Step 7.4: Subir a API e testar endpoints manualmente**

```bash
# Terminal 1 — subir API
powershell.exe -Command "dotnet run --project src/CasaDiAna.API"

# Terminal 2 — obter token
$TOKEN=$(curl -s http://localhost:5130/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@casadiana.com","senha":"Admin@123"}' | jq -r '.dados.token')

# Testar contagem (deve retornar 0 inicialmente)
curl -s http://localhost:5130/api/notificacoes/contagem \
  -H "Authorization: Bearer $TOKEN" | jq

# Testar listagem
curl -s http://localhost:5130/api/notificacoes \
  -H "Authorization: Bearer $TOKEN" | jq
```

Esperado: `{ "sucesso": true, "dados": 0, "erros": [] }` e `{ "sucesso": true, "dados": [], "erros": [] }`.

- [ ] **Step 7.5: Commit**

```bash
git add src/CasaDiAna.API/Controllers/NotificacoesController.cs
git commit -m "feat(api): adiciona NotificacoesController com 4 endpoints REST"
```

---

## Task 8: Integração nos handlers de movimentação de estoque

> Cada handler abaixo recebe `INotificacaoEstoqueService` via constructor injection e chama `VerificarECriarAsync` após persistir as mudanças de estoque.

**Files:**
- Modify: `src/CasaDiAna.Application/Entradas/Commands/RegistrarEntrada/RegistrarEntradaCommandHandler.cs`
- Modify: `src/CasaDiAna.Application/Estoque/Commands/CorrigirEstoque/CorrigirEstoqueCommandHandler.cs`
- Modify: `src/CasaDiAna.Application/Inventarios/Commands/FinalizarInventario/FinalizarInventarioCommandHandler.cs`
- Modify: `src/CasaDiAna.Application/ProducaoDiaria/Commands/RegistrarProducao/RegistrarProducaoCommandHandler.cs`

### 8a — RegistrarEntradaCommandHandler

- [ ] **Step 8a.1: Adicionar using + campo + parâmetro no constructor**

No topo do arquivo, adicionar:
```csharp
using CasaDiAna.Application.Notificacoes.Services;
```

Adicionar campo privado (junto aos existentes):
```csharp
private readonly INotificacaoEstoqueService _notificacaoService;
```

Adicionar parâmetro no constructor e atribuição:
```csharp
public RegistrarEntradaCommandHandler(
    IEntradaMercadoriaRepository entradas,
    IIngredienteRepository ingredientes,
    IMovimentacaoRepository movimentacoes,
    IFornecedorRepository fornecedores,
    ICurrentUserService currentUser,
    INotificacaoEstoqueService notificacaoService)  // ← adicionar
{
    _entradas = entradas;
    _ingredientes = ingredientes;
    _movimentacoes = movimentacoes;
    _fornecedores = fornecedores;
    _currentUser = currentUser;
    _notificacaoService = notificacaoService;          // ← adicionar
}
```

- [ ] **Step 8a.2: Chamar serviço após o save (linha 85 do arquivo original)**

Após `await _entradas.SalvarAsync(cancellationToken);`, adicionar:

```csharp
// Verifica notificações para cada ingrediente movimentado
foreach (var ing in ingredientesMap.Values)
    await _notificacaoService.VerificarECriarAsync(ing, cancellationToken);
```

O trecho final do método `Handle` ficará:
```csharp
        await _entradas.AdicionarAsync(entrada, cancellationToken);
        await _entradas.SalvarAsync(cancellationToken);

        // Verifica notificações para cada ingrediente movimentado
        foreach (var ing in ingredientesMap.Values)
            await _notificacaoService.VerificarECriarAsync(ing, cancellationToken);

        var salva = await _entradas.ObterPorIdComItensAsync(entrada.Id, cancellationToken);
        return ToDto(salva!);
```

> **Nota:** Em entradas de mercadoria o estoque *aumenta*, então raramente uma notificação será criada. O serviço retorna sem criar se o estoque estiver OK.

### 8b — CorrigirEstoqueCommandHandler

- [ ] **Step 8b.1: Adicionar using + campo + parâmetro no constructor**

```csharp
using CasaDiAna.Application.Notificacoes.Services;
```

```csharp
private readonly INotificacaoEstoqueService _notificacaoService;
```

```csharp
public CorrigirEstoqueCommandHandler(
    IIngredienteRepository ingredientes,
    IMovimentacaoRepository movimentacoes,
    ICurrentUserService currentUser,
    INotificacaoEstoqueService notificacaoService)  // ← adicionar
{
    _ingredientes = ingredientes;
    _movimentacoes = movimentacoes;
    _currentUser = currentUser;
    _notificacaoService = notificacaoService;          // ← adicionar
}
```

- [ ] **Step 8b.2: Coletar ingredientes afetados e verificar após o save**

O handler atual tem `if (diferenca == 0) continue;` — ingredientes sem diferença não são salvos. Precisamos coletar apenas os que foram alterados.

Substituir o método `Handle` completo:

```csharp
public async Task Handle(CorrigirEstoqueCommand request, CancellationToken ct)
{
    var ingredientesAfetados = new List<Ingrediente>();

    foreach (var itemInput in request.Itens)
    {
        var ingrediente = await _ingredientes.ObterPorIdAsync(itemInput.IngredienteId, ct)
            ?? throw new DomainException($"Ingrediente '{itemInput.IngredienteId}' não encontrado.");

        var saldoAnterior = ingrediente.EstoqueAtual;
        var diferenca = itemInput.NovaQuantidade - saldoAnterior;

        if (diferenca == 0) continue;

        var tipo = diferenca > 0 ? TipoMovimentacao.AjustePositivo : TipoMovimentacao.AjusteNegativo;

        ingrediente.AtualizarEstoque(itemInput.NovaQuantidade, _currentUser.UsuarioId);
        _ingredientes.Atualizar(ingrediente);

        var obs = string.IsNullOrWhiteSpace(itemInput.Observacao)
            ? "Correção manual de estoque"
            : itemInput.Observacao;
        var movimentacao = Movimentacao.Criar(
            itemInput.IngredienteId,
            tipo,
            Math.Abs(diferenca),
            itemInput.NovaQuantidade,
            _currentUser.UsuarioId,
            referenciaTipo: "CorrecaoEstoque",
            referenciaId: null,
            observacoes: obs);

        await _movimentacoes.AdicionarAsync(movimentacao, ct);
        ingredientesAfetados.Add(ingrediente);
    }

    await _ingredientes.SalvarAsync(ct);

    // Verifica notificações somente para ingredientes com estoque alterado
    foreach (var ing in ingredientesAfetados)
        await _notificacaoService.VerificarECriarAsync(ing, ct);
}
```

### 8c — FinalizarInventarioCommandHandler

- [ ] **Step 8c.1: Adicionar using + campo + parâmetro no constructor**

```csharp
using CasaDiAna.Application.Notificacoes.Services;
```

```csharp
private readonly INotificacaoEstoqueService _notificacaoService;
```

```csharp
public FinalizarInventarioCommandHandler(
    IInventarioRepository inventarios,
    IIngredienteRepository ingredientes,
    IMovimentacaoRepository movimentacoes,
    ICurrentUserService currentUser,
    INotificacaoEstoqueService notificacaoService)  // ← adicionar
{
    _inventarios = inventarios;
    _ingredientes = ingredientes;
    _movimentacoes = movimentacoes;
    _currentUser = currentUser;
    _notificacaoService = notificacaoService;          // ← adicionar
}
```

- [ ] **Step 8c.2: Coletar ingredientes e verificar após save**

Substituir o método `Handle` completo:

```csharp
public async Task<InventarioDto> Handle(
    FinalizarInventarioCommand request, CancellationToken cancellationToken)
{
    var inventario = await _inventarios.ObterPorIdComItensAsync(request.InventarioId, cancellationToken)
        ?? throw new DomainException("Inventário não encontrado.");

    var ingredientesAfetados = new List<Ingrediente>();

    foreach (var item in inventario.Itens.Where(i => i.Diferenca != 0))
    {
        var ingrediente = await _ingredientes.ObterPorIdAsync(item.IngredienteId, cancellationToken)
            ?? throw new DomainException($"Ingrediente '{item.IngredienteId}' não encontrado.");

        var novoSaldo = ingrediente.EstoqueAtual + item.Diferenca;
        ingrediente.AtualizarEstoque(novoSaldo, _currentUser.UsuarioId);
        _ingredientes.Atualizar(ingrediente);

        var tipo = item.Diferenca > 0 ? TipoMovimentacao.AjustePositivo : TipoMovimentacao.AjusteNegativo;
        var movimentacao = Movimentacao.Criar(
            item.IngredienteId,
            tipo,
            Math.Abs(item.Diferenca),
            novoSaldo,
            _currentUser.UsuarioId,
            referenciaTipo: "Inventario",
            referenciaId: inventario.Id);

        await _movimentacoes.AdicionarAsync(movimentacao, cancellationToken);
        ingredientesAfetados.Add(ingrediente);
    }

    inventario.Finalizar(_currentUser.UsuarioId);
    _inventarios.Atualizar(inventario);
    await _inventarios.SalvarAsync(cancellationToken);

    foreach (var ing in ingredientesAfetados)
        await _notificacaoService.VerificarECriarAsync(ing, cancellationToken);

    var finalizado = await _inventarios.ObterPorIdComItensAsync(inventario.Id, cancellationToken);
    return IniciarInventarioCommandHandler.ToDto(finalizado!);
}
```

### 8d — RegistrarProducaoCommandHandler

- [ ] **Step 8d.1: Adicionar using + campo + parâmetro no constructor**

```csharp
using CasaDiAna.Application.Notificacoes.Services;
```

```csharp
private readonly INotificacaoEstoqueService _notificacaoService;
```

```csharp
public RegistrarProducaoCommandHandler(
    IProducaoDiariaRepository producoes,
    IProdutoRepository produtos,
    IIngredienteRepository ingredientes,
    IMovimentacaoRepository movimentacoes,
    ICurrentUserService currentUser,
    INotificacaoEstoqueService notificacaoService)  // ← adicionar
{
    _producoes = producoes;
    _produtos = produtos;
    _ingredientes = ingredientes;
    _movimentacoes = movimentacoes;
    _currentUser = currentUser;
    _notificacaoService = notificacaoService;          // ← adicionar
}
```

- [ ] **Step 8d.2: Verificar notificações após o save (passo 5 do handler original)**

Após `await _producoes.SalvarAsync(cancellationToken);`, adicionar:

```csharp
        // Passo 5 — persiste
        await _producoes.AdicionarAsync(producao, cancellationToken);
        await _producoes.SalvarAsync(cancellationToken);

        // Passo 6 — verifica estoque após baixa dos ingredientes
        foreach (var ing in ingredientesMap.Values)
            await _notificacaoService.VerificarECriarAsync(ing, cancellationToken);

        return ToDto(producao, produto.Nome);
```

- [ ] **Step 8e: Build geral**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build -nologo -v q"
```
Esperado: `Build succeeded. 0 Error(s).`

- [ ] **Step 8f: Teste de integração manual**

```bash
# 1. Login
TOKEN=$(curl -s http://localhost:5130/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@casadiana.com","senha":"Admin@123"}' | jq -r '.dados.token')

# 2. Registrar uma correção de estoque que leve um ingrediente abaixo do mínimo
#    (ajuste o ingredienteId para um que exista no banco)
curl -s -X POST http://localhost:5130/api/estoque/correcoes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"itens":[{"ingredienteId":"<UUID_DO_INGREDIENTE>","novaQuantidade":0,"observacao":"Teste notificacao"}]}'

# 3. Verificar se a notificação foi criada
curl -s http://localhost:5130/api/notificacoes \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Verificar contagem
curl -s http://localhost:5130/api/notificacoes/contagem \
  -H "Authorization: Bearer $TOKEN" | jq
```

Esperado: 1 notificação criada com `tipo: "Zerado"` (ou "Critico" dependendo da quantidade).

- [ ] **Step 8g: Commit**

```bash
git add src/CasaDiAna.Application/
git commit -m "feat(app): integra verificação de notificações nos 4 handlers de movimentação de estoque"
```

---

## Task 9: Frontend — serviço HTTP e hook de polling

**Files:**
- Create: `frontend/src/lib/notificacoesService.ts`
- Create: `frontend/src/hooks/useNotificacoesCount.ts`

- [ ] **Step 9.1: Criar serviço**

```typescript
// frontend/src/lib/notificacoesService.ts
import api from './api'

export interface NotificacaoEstoqueDto {
  id: string
  titulo: string
  mensagem: string
  tipo: 'Atencao' | 'Critico' | 'Zerado'
  dataCriacao: string
  lida: boolean
  ingredienteId: string
  ingredienteNome?: string
}

interface ApiResponse<T> {
  sucesso: boolean
  dados: T
  erros: string[]
}

export const notificacoesService = {
  async listar(apenasNaoLidas = false): Promise<NotificacaoEstoqueDto[]> {
    const { data } = await api.get<ApiResponse<NotificacaoEstoqueDto[]>>(
      `/notificacoes?apenasNaoLidas=${apenasNaoLidas}`
    )
    return data.dados ?? []
  },

  async contarNaoLidas(): Promise<number> {
    const { data } = await api.get<ApiResponse<number>>('/notificacoes/contagem')
    return data.dados ?? 0
  },

  async marcarLida(id: string): Promise<void> {
    await api.patch(`/notificacoes/${id}/lida`)
  },

  async marcarTodasLidas(): Promise<void> {
    await api.patch('/notificacoes/marcar-todas-lidas')
  },
}
```

- [ ] **Step 9.2: Criar hook de polling**

```typescript
// frontend/src/hooks/useNotificacoesCount.ts
import { useState, useEffect, useCallback } from 'react'
import { notificacoesService } from '@/lib/notificacoesService'

const POLL_INTERVAL_MS = 30_000 // 30 segundos — adequado para ERP

export function useNotificacoesCount() {
  const [count, setCount] = useState(0)

  const atualizar = useCallback(async () => {
    try {
      const total = await notificacoesService.contarNaoLidas()
      setCount(total)
    } catch {
      // Falha silenciosa — polling resiliente a erros de rede
    }
  }, [])

  useEffect(() => {
    atualizar()
    const timer = setInterval(atualizar, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [atualizar])

  // Expõe `atualizar` para forçar refresh imediato após ações do usuário
  return { count, atualizar }
}
```

- [ ] **Step 9.3: Commit**

```bash
git add frontend/src/lib/notificacoesService.ts frontend/src/hooks/useNotificacoesCount.ts
git commit -m "feat(frontend): serviço HTTP de notificações + hook de polling 30s"
```

---

## Task 10: Frontend — sino com badge no TopHeader

**Files:**
- Modify: `frontend/src/components/layout/TopHeader.tsx`

- [ ] **Step 10.1: Adicionar imports**

No topo de `TopHeader.tsx`, adicionar junto aos imports existentes:

```typescript
import { BellIcon } from '@heroicons/react/24/outline'
import { useNotificacoesCount } from '@/hooks/useNotificacoesCount'
```

- [ ] **Step 10.2: Usar hook e navigate dentro do componente**

Dentro da função `TopHeader`, após `const navigate = useNavigate()`, adicionar:

```typescript
const { count } = useNotificacoesCount()
```

- [ ] **Step 10.3: Adicionar botão do sino no JSX**

Na seção `{/* ── Direita: controles globais ─────────────────────────────── */}`, adicionar o sino **antes** do toggle de tema. O bloco atual começa com:

```tsx
<div className="flex items-center gap-0.5">

  {/* Toggle tema */}
  <IconBtn ...>
```

Adicionar antes do Toggle tema:

```tsx
          {/* Sino de notificações */}
          <IconBtn
            onClick={() => navigate('/notificacoes')}
            ariaLabel={`Notificações${count > 0 ? ` (${count} não lidas)` : ''}`}
            title="Notificações"
          >
            <div className="relative">
              <BellIcon className="h-[18px] w-[18px]" aria-hidden="true" />
              {count > 0 && (
                <span
                  className="absolute -top-2 -right-2 min-w-[16px] h-4 rounded-full
                             text-[9px] font-bold text-white flex items-center
                             justify-center px-1 leading-none"
                  style={{ background: 'var(--ada-error-text)' }}
                  aria-hidden="true"
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </div>
          </IconBtn>

          <Divider />

          {/* Toggle tema */}
```

- [ ] **Step 10.4: Verificar TypeScript**

```bash
cd frontend && npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 10.5: Commit**

```bash
git add frontend/src/components/layout/TopHeader.tsx
git commit -m "feat(frontend): adiciona sino de notificações com badge contador no header"
```

---

## Task 11: Frontend — página de notificações

**Files:**
- Create: `frontend/src/features/notificacoes/pages/NotificacoesPage.tsx`

- [ ] **Step 11.1: Criar página**

```tsx
// frontend/src/features/notificacoes/pages/NotificacoesPage.tsx
import { useEffect, useState, useCallback } from 'react'
import { BellIcon, BellSlashIcon, CheckIcon } from '@heroicons/react/24/outline'
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  FireIcon,
} from '@heroicons/react/24/solid'
import { notificacoesService, type NotificacaoEstoqueDto } from '@/lib/notificacoesService'
import { useNotificacoesCount } from '@/hooks/useNotificacoesCount'

// ─── Mapa de tipo para estilo visual ────────────────────────────────────────
const CONFIG_TIPO = {
  Zerado: {
    label: 'Zerado',
    Icon: FireIcon,
    rowBg: 'var(--ada-error-bg)',
    badgeBg: 'var(--ada-error-badge)',
    badgeBorder: 'var(--ada-error-border)',
    badgeColor: 'var(--ada-error-text)',
    iconColor: 'var(--ada-error-text)',
  },
  Critico: {
    label: 'Crítico',
    Icon: ExclamationCircleIcon,
    rowBg: 'rgba(220,38,38,0.06)',
    badgeBg: 'var(--ada-error-badge)',
    badgeBorder: 'var(--ada-error-border)',
    badgeColor: 'var(--ada-error-text)',
    iconColor: 'var(--ada-error-text)',
  },
  Atencao: {
    label: 'Atenção',
    Icon: ExclamationTriangleIcon,
    rowBg: 'var(--ada-warning-bg)',
    badgeBg: 'var(--ada-warning-badge)',
    badgeBorder: 'var(--ada-warning-border)',
    badgeColor: 'var(--ada-warning-text)',
    iconColor: 'var(--ada-warning-text)',
  },
} as const

export function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<NotificacaoEstoqueDto[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [apenasNaoLidas, setApenasNaoLidas] = useState(false)
  const { atualizar: atualizarContador } = useNotificacoesCount()

  const carregar = useCallback(async (filtro: boolean) => {
    setLoading(true)
    setErro(null)
    try {
      const data = await notificacoesService.listar(filtro)
      setNotificacoes(data)
    } catch {
      setErro('Erro ao carregar notificações.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar(false) }, [carregar])

  const handleToggle = () => {
    const novo = !apenasNaoLidas
    setApenasNaoLidas(novo)
    carregar(novo)
  }

  const handleMarcarLida = async (id: string) => {
    await notificacoesService.marcarLida(id)
    setNotificacoes(prev =>
      prev.map(n => n.id === id ? { ...n, lida: true } : n)
    )
    atualizarContador()
  }

  const handleMarcarTodasLidas = async () => {
    await notificacoesService.marcarTodasLidas()
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
    atualizarContador()
  }

  const naoLidasCount = notificacoes.filter(n => !n.lida).length

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Notificações de Estoque
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ada-muted)' }}>
            {loading ? 'Carregando…' : `${naoLidasCount} não lida${naoLidasCount !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={apenasNaoLidas}
              onChange={handleToggle}
              className="h-4 w-4 accent-amber-700"
            />
            <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
              Apenas não lidas
            </span>
          </label>

          {/* Marcar todas */}
          {naoLidasCount > 0 && (
            <button
              onClick={handleMarcarTodasLidas}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                border: '1px solid var(--ada-border)',
                color: 'var(--ada-body)',
                background: 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--ada-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <CheckIcon className="h-4 w-4" />
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {loading && (
        <div
          className="rounded-xl py-16 text-center"
          style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full mb-3"
            style={{ border: '3px solid var(--ada-border)', borderTopColor: '#C4870A' }}
          />
          <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Carregando…</p>
        </div>
      )}

      {/* ── Erro ───────────────────────────────────────────────────────── */}
      {!loading && erro && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: 'var(--ada-error-bg)',
            border: '1px solid var(--ada-error-border)',
            color: 'var(--ada-error-text)',
          }}
        >
          {erro}
        </div>
      )}

      {/* ── Lista ──────────────────────────────────────────────────────── */}
      {!loading && !erro && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-border)', boxShadow: 'var(--shadow-sm)' }}
        >
          {notificacoes.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--ada-bg)', border: '1px solid var(--ada-border)' }}
              >
                <BellSlashIcon className="h-6 w-6" style={{ color: 'var(--ada-placeholder)' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Nenhuma notificação
              </p>
              <p className="text-xs" style={{ color: 'var(--ada-muted)' }}>
                {apenasNaoLidas ? 'Todas as notificações foram lidas.' : 'Nenhum alerta de estoque no momento.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
              {notificacoes.map(n => {
                const cfg = CONFIG_TIPO[n.tipo]
                const { Icon } = cfg
                return (
                  <li
                    key={n.id}
                    className="flex items-start gap-3 px-5 py-4 transition-colors"
                    style={{
                      background: !n.lida ? cfg.rowBg : undefined,
                      borderBottom: '1px solid var(--ada-border-sub)',
                      opacity: n.lida ? 0.6 : 1,
                    }}
                  >
                    {/* Ícone de tipo */}
                    <div
                      className="mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: cfg.badgeBg, border: `1px solid ${cfg.badgeBorder}` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: cfg.iconColor }} aria-hidden="true" />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-sm font-semibold leading-snug"
                          style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
                        >
                          {n.titulo}
                        </span>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                          style={{
                            background: cfg.badgeBg,
                            border: `1px solid ${cfg.badgeBorder}`,
                            color: cfg.badgeColor,
                          }}
                        >
                          {cfg.label}
                        </span>
                        {!n.lida && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: 'var(--sb-accent)' }}
                            aria-label="Não lida"
                          />
                        )}
                      </div>
                      <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: 'var(--ada-body)' }}>
                        {n.mensagem}
                      </p>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--ada-muted)' }}>
                        {new Date(n.dataCriacao).toLocaleString('pt-BR')}
                        {n.ingredienteNome && (
                          <> · <span style={{ color: 'var(--ada-muted-dim)' }}>{n.ingredienteNome}</span></>
                        )}
                      </p>
                    </div>

                    {/* Botão marcar lida */}
                    {!n.lida && (
                      <button
                        onClick={() => handleMarcarLida(n.id)}
                        aria-label="Marcar como lida"
                        title="Marcar como lida"
                        className="shrink-0 p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--ada-muted)' }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.color = 'var(--ada-heading)'
                          ;(e.currentTarget as HTMLElement).style.background = 'var(--ada-hover)'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'
                          ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                        }}
                      >
                        <BellIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 11.2: Verificar TypeScript**

```bash
cd frontend && npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 11.3: Commit**

```bash
git add frontend/src/features/notificacoes/
git commit -m "feat(frontend): página de gerenciamento de notificações de estoque"
```

---

## Task 12: Registrar rota no AppRoutes

**Files:**
- Modify: `frontend/src/routes/AppRoutes.tsx`

- [ ] **Step 12.1: Adicionar import da página**

No topo de `AppRoutes.tsx`, adicionar junto aos outros imports:

```typescript
import { NotificacoesPage } from '@/features/notificacoes/pages/NotificacoesPage'
```

- [ ] **Step 12.2: Adicionar rota**

Dentro do `<Route element={<MainLayout />}>`, adicionar antes do wildcard `*`:

```tsx
          {/* Notificações */}
          <Route path="/notificacoes" element={<NotificacoesPage />} />
```

O bloco de rotas ficará:
```tsx
          {/* Configurações */}
          <Route path="/usuarios" element={<UsuariosPage />} />

          {/* Notificações */}
          <Route path="/notificacoes" element={<NotificacoesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
```

- [ ] **Step 12.3: Build final do frontend**

```bash
cd frontend && npm run build
```
Esperado: sem erros de TypeScript/Vite.

- [ ] **Step 12.4: Teste visual completo**

```bash
cd frontend && npm run dev
```

Verificar:
1. Sino aparece no header (à esquerda dos controles de perfil)
2. Badge vermelho aparece quando há notificações não lidas
3. Clicar no sino navega para `/notificacoes`
4. A página lista as notificações com cores corretas por tipo
5. Botão "Marcar como lida" funciona e atualiza o contador no header
6. Botão "Marcar todas como lidas" funciona
7. Filtro "Apenas não lidas" funciona
8. Estado vazio exibido corretamente

- [ ] **Step 12.5: Commit final**

```bash
git add frontend/src/routes/AppRoutes.tsx
git commit -m "feat(frontend): registra rota /notificacoes no AppRoutes"
git push origin master
```

---

## Resumo de mudanças por camada

| Camada | Arquivos criados | Arquivos modificados |
|---|---|---|
| Domain | 3 | 0 |
| Application | 7 | 4 handlers |
| Infrastructure | 3 | 2 (AppDbContext, DI) |
| API | 1 | 0 |
| Frontend | 3 | 2 (TopHeader, AppRoutes) |
| **Total** | **17** | **8** |

## Comportamento esperado após implementação

- Toda vez que uma produção, correção ou inventário reduzir um ingrediente abaixo do mínimo, uma notificação é criada automaticamente
- Não haverá duplicatas enquanto a notificação estiver ativa (não lida)
- O sino no header mostra o contador em vermelho, atualizado a cada 30s por polling REST
- A página `/notificacoes` permite visualizar, filtrar e marcar como lidas
- ZERADO → ícone de chama + vermelho intenso | CRITICO → exclamation circle + vermelho | ATENCAO → triangle + âmbar
- Tema escuro/claro totalmente suportado via CSS variables
