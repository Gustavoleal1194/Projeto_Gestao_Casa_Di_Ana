# Comparação de Preços de Ingredientes – Plano de Implementação

> **Para agentes:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans para implementar tarefa a tarefa. Steps usam sintaxe de checkbox (`- [ ]`) para tracking.

**Goal:** Adicionar o módulo de Comparação de Preços de Ingredientes ao ERP Casa di Ana, permitindo visualizar histórico de preços de compra, variação entre entradas e comparação entre fornecedores, com base nos dados já existentes de Entradas de Mercadoria.

**Architecture:** Novo endpoint `GET /api/relatorios/comparacao-precos` no `RelatoriosController` existente. Toda a lógica de agregação fica em `ComparacaoPrecoIngredientesQueryHandler` (Application layer), que usa um novo método de repositório com `ThenInclude` completo (Fornecedor + Itens + Ingrediente + UnidadeMedida). O handler computa histórico, variações e ranking por ingrediente em memória via LINQ, sem nova migration. No frontend, nova página sob `features/relatorios/`, integrada à `Sidebar` e ao `AppRoutes` seguindo os padrões existentes.

**Tech Stack:** ASP.NET Core 8 / MediatR / EF Core 8 (sem migration) / React 18 + TypeScript / Tailwind CSS v4 / design tokens `var(--ada-*)` / `<PageHeader>` `<SkeletonTable>` `<EmptyState>`

---

## Mapeamento de Arquivos

### Backend — criar
| Arquivo | Responsabilidade |
|---------|-----------------|
| `CasaDiAna/src/CasaDiAna.Application/Relatorios/Dtos/ComparacaoPrecoDto.cs` | DTOs de retorno (4 records) |
| `CasaDiAna/src/CasaDiAna.Application/Relatorios/Queries/ComparacaoPreco/ComparacaoPrecoIngredientesQuery.cs` | Record de query com parâmetros |
| `CasaDiAna/src/CasaDiAna.Application/Relatorios/Queries/ComparacaoPreco/ComparacaoPrecoIngredientesQueryHandler.cs` | Lógica de agregação |

### Backend — modificar
| Arquivo | O que muda |
|---------|-----------|
| `CasaDiAna/src/CasaDiAna.Domain/Interfaces/IEntradaMercadoriaRepository.cs` | + `ListarParaComparacaoAsync` |
| `CasaDiAna/src/CasaDiAna.Infrastructure/Repositories/EntradaMercadoriaRepository.cs` | Implementação do novo método |
| `CasaDiAna/src/CasaDiAna.API/Controllers/RelatoriosController.cs` | + endpoint `GET comparacao-precos` |

### Frontend — criar
| Arquivo | Responsabilidade |
|---------|-----------------|
| `CasaDiAna/frontend/src/features/relatorios/pages/ComparacaoPrecoPage.tsx` | Página principal com filtros, KPIs, tabela, modal |

### Frontend — modificar
| Arquivo | O que muda |
|---------|-----------|
| `CasaDiAna/frontend/src/types/estoque.ts` | + 4 interfaces de comparação |
| `CasaDiAna/frontend/src/features/relatorios/services/relatoriosService.ts` | + `comparacaoPrecos()` |
| `CasaDiAna/frontend/src/routes/AppRoutes.tsx` | + rota `/relatorios/comparacao-precos` |
| `CasaDiAna/frontend/src/components/layout/Sidebar.tsx` | + item "Comparação de Preços" na seção Relatórios |

---

## Task 1: Novo método no repositório

**Files:**
- Modify: `CasaDiAna/src/CasaDiAna.Domain/Interfaces/IEntradaMercadoriaRepository.cs`
- Modify: `CasaDiAna/src/CasaDiAna.Infrastructure/Repositories/EntradaMercadoriaRepository.cs`

- [ ] **Passo 1: Adicionar assinatura à interface**

Abrir `CasaDiAna/src/CasaDiAna.Domain/Interfaces/IEntradaMercadoriaRepository.cs`. Adicionar o método abaixo logo após `ListarAsync`:

```csharp
Task<IReadOnlyList<EntradaMercadoria>> ListarParaComparacaoAsync(
    DateTime? de = null, DateTime? ate = null, CancellationToken ct = default);
```

Arquivo completo após a mudança:
```csharp
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IEntradaMercadoriaRepository
{
    Task<EntradaMercadoria?> ObterPorIdComItensAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<EntradaMercadoria>> ListarAsync(DateTime? de = null, DateTime? ate = null, CancellationToken ct = default);
    Task<IReadOnlyList<EntradaMercadoria>> ListarParaComparacaoAsync(DateTime? de = null, DateTime? ate = null, CancellationToken ct = default);
    Task AdicionarAsync(EntradaMercadoria entrada, CancellationToken ct = default);
    void Atualizar(EntradaMercadoria entrada);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

- [ ] **Passo 2: Implementar no repositório**

Abrir `CasaDiAna/src/CasaDiAna.Infrastructure/Repositories/EntradaMercadoriaRepository.cs`. Adicionar o método após `ListarAsync`:

```csharp
public async Task<IReadOnlyList<EntradaMercadoria>> ListarParaComparacaoAsync(
    DateTime? de = null, DateTime? ate = null, CancellationToken ct = default)
{
    var query = _db.EntradasMercadoria
        .Include(e => e.Fornecedor)
        .Include(e => e.Itens)
            .ThenInclude(i => i.Ingrediente)
                .ThenInclude(i => i!.UnidadeMedida)
        .AsQueryable();

    if (de.HasValue)
        query = query.Where(e => e.DataEntrada >= de.Value);
    if (ate.HasValue)
        query = query.Where(e => e.DataEntrada < ate.Value.Date.AddDays(1));

    return await query.OrderBy(e => e.DataEntrada).ToListAsync(ct);
}
```

- [ ] **Passo 3: Verificar que o projeto compila**

```bash
cd CasaDiAna
dotnet build src/CasaDiAna.API
```

Saída esperada: `Build succeeded. 0 Warning(s). 0 Error(s).`

- [ ] **Passo 4: Commit**

```bash
cd CasaDiAna
git add src/CasaDiAna.Domain/Interfaces/IEntradaMercadoriaRepository.cs \
        src/CasaDiAna.Infrastructure/Repositories/EntradaMercadoriaRepository.cs
git commit -m "feat(entradas): adicionar ListarParaComparacaoAsync com includes de ingrediente e unidade"
```

---

## Task 2: DTOs de retorno

**Files:**
- Create: `CasaDiAna/src/CasaDiAna.Application/Relatorios/Dtos/ComparacaoPrecoDto.cs`

- [ ] **Passo 1: Criar arquivo de DTOs**

Criar `CasaDiAna/src/CasaDiAna.Application/Relatorios/Dtos/ComparacaoPrecoDto.cs`:

```csharp
namespace CasaDiAna.Application.Relatorios.Dtos;

public record HistoricoPrecoDto(
    Guid EntradaId,
    string? NumeroNotaFiscal,
    DateTime DataEntrada,
    Guid FornecedorId,
    string FornecedorNome,
    decimal CustoUnitario,
    decimal Quantidade
);

public record PrecoFornecedorDto(
    Guid FornecedorId,
    string FornecedorNome,
    decimal PrecoMinimo,
    decimal PrecoMaximo,
    decimal PrecoMedio,
    decimal UltimoPreco,
    DateTime UltimaCompra,
    int TotalCompras
);

public record ComparacaoPrecoIngredienteDto(
    Guid IngredienteId,
    string IngredienteNome,
    string UnidadeMedidaCodigo,
    IReadOnlyList<HistoricoPrecoDto> Historico,
    IReadOnlyList<PrecoFornecedorDto> PorFornecedor,
    decimal? UltimoPreco,
    decimal? PrecoAnterior,
    decimal? VariacaoValor,
    decimal? VariacaoPercentual,
    string TendenciaPreco   // "aumento" | "reducao" | "estavel" | "sem_historico"
);

public record ComparacaoPrecoDto(
    IReadOnlyList<ComparacaoPrecoIngredienteDto> Ingredientes,
    IReadOnlyList<ComparacaoPrecoIngredienteDto> MaioresAumentos,
    IReadOnlyList<ComparacaoPrecoIngredienteDto> MaioresReducoes
);
```

- [ ] **Passo 2: Compilar**

```bash
cd CasaDiAna
dotnet build src/CasaDiAna.API
```

Saída esperada: `Build succeeded.`

- [ ] **Passo 3: Commit**

```bash
cd CasaDiAna
git add src/CasaDiAna.Application/Relatorios/Dtos/ComparacaoPrecoDto.cs
git commit -m "feat(relatorios): adicionar DTOs de comparação de preços de ingredientes"
```

---

## Task 3: Query record e handler

**Files:**
- Create: `CasaDiAna/src/CasaDiAna.Application/Relatorios/Queries/ComparacaoPreco/ComparacaoPrecoIngredientesQuery.cs`
- Create: `CasaDiAna/src/CasaDiAna.Application/Relatorios/Queries/ComparacaoPreco/ComparacaoPrecoIngredientesQueryHandler.cs`

- [ ] **Passo 1: Criar o record de query**

Criar `CasaDiAna/src/CasaDiAna.Application/Relatorios/Queries/ComparacaoPreco/ComparacaoPrecoIngredientesQuery.cs`:

```csharp
using CasaDiAna.Application.Relatorios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Relatorios.Queries.ComparacaoPreco;

public record ComparacaoPrecoIngredientesQuery(
    DateTime? De,
    DateTime? Ate,
    Guid? IngredienteId
) : IRequest<ComparacaoPrecoDto>;
```

- [ ] **Passo 2: Criar o handler**

Criar `CasaDiAna/src/CasaDiAna.Application/Relatorios/Queries/ComparacaoPreco/ComparacaoPrecoIngredientesQueryHandler.cs`:

```csharp
using CasaDiAna.Application.Relatorios.Dtos;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Relatorios.Queries.ComparacaoPreco;

public class ComparacaoPrecoIngredientesQueryHandler
    : IRequestHandler<ComparacaoPrecoIngredientesQuery, ComparacaoPrecoDto>
{
    private readonly IEntradaMercadoriaRepository _entradas;

    public ComparacaoPrecoIngredientesQueryHandler(IEntradaMercadoriaRepository entradas)
    {
        _entradas = entradas;
    }

    public async Task<ComparacaoPrecoDto> Handle(
        ComparacaoPrecoIngredientesQuery request, CancellationToken cancellationToken)
    {
        var entradas = await _entradas.ListarParaComparacaoAsync(
            request.De, request.Ate, cancellationToken);

        // Apenas entradas confirmadas geram histórico de preço real
        var registros = entradas
            .Where(e => e.Status == StatusEntrada.Confirmada)
            .SelectMany(e => e.Itens.Select(i => new { Entrada = e, Item = i }));

        if (request.IngredienteId.HasValue)
            registros = registros.Where(x => x.Item.IngredienteId == request.IngredienteId.Value);

        var porIngrediente = registros
            .GroupBy(x => x.Item.IngredienteId)
            .ToList();

        var ingredientes = porIngrediente.Select(grupo =>
        {
            // Ordenados cronologicamente para calcular variação correta
            var cronologico = grupo
                .OrderBy(x => x.Entrada.DataEntrada)
                .ThenBy(x => x.Entrada.CriadoEm)
                .ToList();

            var historico = cronologico
                .Select(x => new HistoricoPrecoDto(
                    x.Entrada.Id,
                    x.Entrada.NumeroNotaFiscal,
                    x.Entrada.DataEntrada,
                    x.Entrada.FornecedorId,
                    x.Entrada.Fornecedor?.RazaoSocial ?? string.Empty,
                    x.Item.CustoUnitario,
                    x.Item.Quantidade))
                .ToList()
                .AsReadOnly();

            var porFornecedor = cronologico
                .GroupBy(x => x.Entrada.FornecedorId)
                .Select(fg =>
                {
                    var ultimo = fg.OrderByDescending(x => x.Entrada.DataEntrada).First();
                    return new PrecoFornecedorDto(
                        fg.Key,
                        fg.First().Entrada.Fornecedor?.RazaoSocial ?? string.Empty,
                        fg.Min(x => x.Item.CustoUnitario),
                        fg.Max(x => x.Item.CustoUnitario),
                        Math.Round(fg.Average(x => x.Item.CustoUnitario), 4),
                        ultimo.Item.CustoUnitario,
                        ultimo.Entrada.DataEntrada,
                        fg.Count());
                })
                .OrderByDescending(f => f.UltimaCompra)
                .ToList()
                .AsReadOnly();

            decimal? ultimoPreco = cronologico.Count > 0
                ? cronologico[^1].Item.CustoUnitario : null;
            decimal? precoAnterior = cronologico.Count > 1
                ? cronologico[^2].Item.CustoUnitario : null;
            decimal? variacaoValor = ultimoPreco.HasValue && precoAnterior.HasValue
                ? Math.Round(ultimoPreco.Value - precoAnterior.Value, 4) : null;
            decimal? variacaoPercentual = variacaoValor.HasValue && precoAnterior.Value != 0
                ? Math.Round(variacaoValor.Value / precoAnterior.Value * 100, 2) : null;

            string tendencia = variacaoValor.HasValue
                ? variacaoValor.Value > 0 ? "aumento"
                : variacaoValor.Value < 0 ? "reducao"
                : "estavel"
                : "sem_historico";

            var ingredienteInfo = cronologico.First().Item.Ingrediente!;
            return new ComparacaoPrecoIngredienteDto(
                grupo.Key,
                ingredienteInfo.Nome,
                ingredienteInfo.UnidadeMedida?.Codigo ?? string.Empty,
                historico,
                porFornecedor,
                ultimoPreco,
                precoAnterior,
                variacaoValor,
                variacaoPercentual,
                tendencia);
        })
        .OrderBy(i => i.IngredienteNome)
        .ToList()
        .AsReadOnly();

        var comVariacao = ingredientes
            .Where(i => i.VariacaoPercentual.HasValue)
            .ToList();

        var maioresAumentos = comVariacao
            .OrderByDescending(i => i.VariacaoPercentual)
            .Where(i => i.VariacaoPercentual > 0)
            .Take(5)
            .ToList()
            .AsReadOnly();

        var maioresReducoes = comVariacao
            .OrderBy(i => i.VariacaoPercentual)
            .Where(i => i.VariacaoPercentual < 0)
            .Take(5)
            .ToList()
            .AsReadOnly();

        return new ComparacaoPrecoDto(ingredientes, maioresAumentos, maioresReducoes);
    }
}
```

- [ ] **Passo 3: Compilar**

```bash
cd CasaDiAna
dotnet build src/CasaDiAna.API
```

Saída esperada: `Build succeeded.`

- [ ] **Passo 4: Commit**

```bash
cd CasaDiAna
git add src/CasaDiAna.Application/Relatorios/Queries/ComparacaoPreco/
git commit -m "feat(relatorios): adicionar query e handler de comparação de preços"
```

---

## Task 4: Endpoint no RelatoriosController

**Files:**
- Modify: `CasaDiAna/src/CasaDiAna.API/Controllers/RelatoriosController.cs`

- [ ] **Passo 1: Adicionar usings e endpoint**

Abrir `CasaDiAna/src/CasaDiAna.API/Controllers/RelatoriosController.cs`.

Adicionar o using no topo (junto com os demais):
```csharp
using CasaDiAna.Application.Relatorios.Queries.ComparacaoPreco;
```

Adicionar o método ao final da classe, antes do `}` de fechamento:
```csharp
[HttpGet("comparacao-precos")]
[ProducesResponseType(typeof(ApiResponse<ComparacaoPrecoDto>), StatusCodes.Status200OK)]
public async Task<IActionResult> ComparacaoPrecos(
    [FromQuery] DateTime? de = null,
    [FromQuery] DateTime? ate = null,
    [FromQuery] Guid? ingredienteId = null,
    CancellationToken ct = default)
{
    var resultado = await _mediator.Send(
        new ComparacaoPrecoIngredientesQuery(de, ate, ingredienteId), ct);
    return Ok(ApiResponse<ComparacaoPrecoDto>.Ok(resultado));
}
```

- [ ] **Passo 2: Compilar e checar se o endpoint aparece no Swagger**

```bash
cd CasaDiAna
dotnet build src/CasaDiAna.API
```

Saída esperada: `Build succeeded.`

Opcional — testar manualmente com o servidor rodando:
```bash
dotnet run --project src/CasaDiAna.API
# Em outro terminal:
# curl -H "Authorization: Bearer <token>" http://localhost:5130/api/relatorios/comparacao-precos
```

- [ ] **Passo 3: Commit**

```bash
cd CasaDiAna
git add src/CasaDiAna.API/Controllers/RelatoriosController.cs
git commit -m "feat(relatorios): expor endpoint GET /api/relatorios/comparacao-precos"
```

---

## Task 5: Tipos TypeScript

**Files:**
- Modify: `CasaDiAna/frontend/src/types/estoque.ts`

- [ ] **Passo 1: Adicionar interfaces ao fim do arquivo**

Abrir `CasaDiAna/frontend/src/types/estoque.ts`. Adicionar ao final:

```typescript
// ─── Comparação de Preços de Ingredientes ─────────────────────────────────────
export interface HistoricoPrecoItem {
  entradaId: string
  numeroNotaFiscal: string | null
  dataEntrada: string
  fornecedorId: string
  fornecedorNome: string
  custoUnitario: number
  quantidade: number
}

export interface PrecoFornecedor {
  fornecedorId: string
  fornecedorNome: string
  precoMinimo: number
  precoMaximo: number
  precoMedio: number
  ultimoPreco: number
  ultimaCompra: string
  totalCompras: number
}

export interface ComparacaoPrecoIngrediente {
  ingredienteId: string
  ingredienteNome: string
  unidadeMedidaCodigo: string
  historico: HistoricoPrecoItem[]
  porFornecedor: PrecoFornecedor[]
  ultimoPreco: number | null
  precoAnterior: number | null
  variacaoValor: number | null
  variacaoPercentual: number | null
  tendenciaPreco: 'aumento' | 'reducao' | 'estavel' | 'sem_historico'
}

export interface ComparacaoPreco {
  ingredientes: ComparacaoPrecoIngrediente[]
  maioresAumentos: ComparacaoPrecoIngrediente[]
  maioresReducoes: ComparacaoPrecoIngrediente[]
}
```

- [ ] **Passo 2: Checar tipos**

```bash
cd CasaDiAna/frontend
npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Passo 3: Commit**

```bash
cd CasaDiAna
git add frontend/src/types/estoque.ts
git commit -m "feat(types): adicionar tipos de comparação de preços de ingredientes"
```

---

## Task 6: Service method

**Files:**
- Modify: `CasaDiAna/frontend/src/features/relatorios/services/relatoriosService.ts`

- [ ] **Passo 1: Adicionar import e método**

Abrir `CasaDiAna/frontend/src/features/relatorios/services/relatoriosService.ts`.

1. Adicionar `ComparacaoPreco` ao import de `@/types/estoque`:
```typescript
import type {
  ApiResponse,
  EstoqueAtualItem,
  MovimentacaoRelatorio,
  EntradaRelatorioResumo,
  InsumoProducaoDia,
  ComparacaoPreco,
} from '@/types/estoque'
```

2. Adicionar ao objeto `relatoriosService` (após `insumosProducao`):
```typescript
comparacaoPrecos: async (
  de?: string,
  ate?: string,
  ingredienteId?: string
): Promise<ComparacaoPreco> => {
  const params = new URLSearchParams()
  if (de) params.set('de', de)
  if (ate) params.set('ate', ate)
  if (ingredienteId) params.set('ingredienteId', ingredienteId)
  const qs = params.toString()
  const resp = await api.get<ApiResponse<ComparacaoPreco>>(
    `/relatorios/comparacao-precos${qs ? `?${qs}` : ''}`
  )
  return resp.data.dados
},
```

- [ ] **Passo 2: Checar tipos**

```bash
cd CasaDiAna/frontend
npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Passo 3: Commit**

```bash
cd CasaDiAna
git add frontend/src/features/relatorios/services/relatoriosService.ts
git commit -m "feat(relatorios): adicionar comparacaoPrecos ao relatoriosService"
```

---

## Task 7: Página frontend

**Files:**
- Create: `CasaDiAna/frontend/src/features/relatorios/pages/ComparacaoPrecoPage.tsx`

- [ ] **Passo 1: Criar a página**

Criar `CasaDiAna/frontend/src/features/relatorios/pages/ComparacaoPrecoPage.tsx`:

```tsx
import { useState } from 'react'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline'
import { relatoriosService } from '../services/relatoriosService'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import { EmptyState } from '@/components/ui/EmptyState'
import type { ComparacaoPreco, ComparacaoPrecoIngrediente } from '@/types/estoque'

// ─── Helpers ────────────────────────────────────────────────────────────────
function hoje(): string { return new Date().toISOString().split('T')[0] }
function primeiroDiaMes(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}
function fmtMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}
function fmtPct(v: number | null) {
  if (v === null) return '—'
  const sinal = v > 0 ? '+' : ''
  return `${sinal}${v.toFixed(2).replace('.', ',')}%`
}

// ─── Badge de tendência ───────────────────────────────────────────────────────
function TendenciaBadge({ tendencia }: { tendencia: ComparacaoPrecoIngrediente['tendenciaPreco'] }) {
  if (tendencia === 'aumento') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: 'var(--ada-error-bg)', color: 'var(--ada-error-text)', border: '1px solid var(--ada-error-border)' }}>
      <ArrowTrendingUpIcon className="h-3 w-3" />
      Aumento
    </span>
  )
  if (tendencia === 'reducao') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: 'var(--ada-success-bg)', color: 'var(--ada-success-text)', border: '1px solid var(--ada-success-border)' }}>
      <ArrowTrendingDownIcon className="h-3 w-3" />
      Redução
    </span>
  )
  if (tendencia === 'estavel') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: 'var(--ada-surface)', color: 'var(--ada-muted)', border: '1px solid var(--ada-border)' }}>
      <MinusIcon className="h-3 w-3" />
      Estável
    </span>
  )
  return (
    <span className="text-xs" style={{ color: 'var(--ada-placeholder)' }}>Sem histórico</span>
  )
}

// ─── Linha expandível ─────────────────────────────────────────────────────────
function LinhaIngrediente({ item }: { item: ComparacaoPrecoIngrediente }) {
  const [aberto, setAberto] = useState(false)
  const variacaoColor = item.variacaoValor === null
    ? 'var(--ada-muted)'
    : item.variacaoValor > 0
      ? 'var(--ada-error-text)'
      : item.variacaoValor < 0
        ? 'var(--ada-success-text)'
        : 'var(--ada-muted)'

  return (
    <>
      <tr
        className="table-row cursor-pointer select-none"
        onClick={() => setAberto(a => !a)}
        aria-expanded={aberto}
      >
        <td className="table-td">
          <div className="flex items-center gap-2">
            {aberto
              ? <ChevronUpIcon className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ada-muted)' }} />
              : <ChevronDownIcon className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ada-muted)' }} />
            }
            <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
              {item.ingredienteNome}
            </span>
            <span className="text-xs" style={{ color: 'var(--ada-placeholder)' }}>
              ({item.unidadeMedidaCodigo})
            </span>
          </div>
        </td>
        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
          <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
            {item.precoAnterior !== null ? fmtMoeda(item.precoAnterior) : '—'}
          </span>
        </td>
        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
            {item.ultimoPreco !== null ? fmtMoeda(item.ultimoPreco) : '—'}
          </span>
        </td>
        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
          <span className="text-sm font-semibold" style={{ color: variacaoColor }}>
            {item.variacaoValor !== null ? fmtMoeda(item.variacaoValor) : '—'}
          </span>
          {item.variacaoPercentual !== null && (
            <span className="text-xs ml-1" style={{ color: variacaoColor }}>
              ({fmtPct(item.variacaoPercentual)})
            </span>
          )}
        </td>
        <td className="table-td">
          <TendenciaBadge tendencia={item.tendenciaPreco} />
        </td>
        <td className="table-td">
          <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
            {item.historico.length > 0
              ? item.historico[item.historico.length - 1].fornecedorNome
              : '—'}
          </span>
        </td>
        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
          <span className="text-sm" style={{ color: 'var(--ada-muted)' }}>
            {item.historico.length}
          </span>
        </td>
      </tr>

      {aberto && (
        <tr>
          <td colSpan={7} className="p-0">
            <div
              className="px-6 py-4 space-y-5"
              style={{ background: 'var(--ada-surface)', borderBottom: '1px solid var(--ada-border)' }}
            >
              {/* Histórico de preços */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                  Histórico de compras
                </p>
                <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--ada-border)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="table-head-row">
                        <th className="table-th" scope="col">Data</th>
                        <th className="table-th" scope="col">Fornecedor</th>
                        <th className="table-th" scope="col">NF</th>
                        <th className="table-th table-th-right" scope="col">Qtd.</th>
                        <th className="table-th table-th-right" scope="col">Custo Unit.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...item.historico].reverse().map((h, idx) => (
                        <tr key={`${h.entradaId}-${idx}`} className="table-row">
                          <td className="table-td tabular-nums">
                            <span style={{ color: 'var(--ada-body)' }}>{fmtData(h.dataEntrada)}</span>
                          </td>
                          <td className="table-td">
                            <span style={{ color: 'var(--ada-body)' }}>{h.fornecedorNome}</span>
                          </td>
                          <td className="table-td font-mono">
                            <span style={{ color: 'var(--ada-muted)' }}>{h.numeroNotaFiscal ?? '—'}</span>
                          </td>
                          <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                            <span style={{ color: 'var(--ada-body)' }}>{h.quantidade}</span>
                          </td>
                          <td className="table-td tabular-nums font-semibold" style={{ textAlign: 'right' }}>
                            <span style={{ color: 'var(--ada-heading)' }}>{fmtMoeda(h.custoUnitario)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Comparação por fornecedor */}
              {item.porFornecedor.length > 1 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                    style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                    Comparação por fornecedor
                  </p>
                  <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--ada-border)' }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="table-head-row">
                          <th className="table-th" scope="col">Fornecedor</th>
                          <th className="table-th table-th-right" scope="col">Menor preço</th>
                          <th className="table-th table-th-right" scope="col">Maior preço</th>
                          <th className="table-th table-th-right" scope="col">Preço médio</th>
                          <th className="table-th table-th-right" scope="col">Último preço</th>
                          <th className="table-th" scope="col">Última compra</th>
                          <th className="table-th table-th-right" scope="col">Compras</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.porFornecedor.map(f => {
                          const menorGlobal = Math.min(...item.porFornecedor.map(x => x.precoMinimo))
                          const isMelhor = f.precoMinimo === menorGlobal
                          return (
                            <tr key={f.fornecedorId} className="table-row">
                              <td className="table-td">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold" style={{ color: 'var(--ada-heading)' }}>
                                    {f.fornecedorNome}
                                  </span>
                                  {isMelhor && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                                      style={{ background: 'var(--ada-success-bg)', color: 'var(--ada-success-text)' }}>
                                      melhor preço
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="table-td tabular-nums" style={{ textAlign: 'right', color: 'var(--ada-success-text)' }}>
                                {fmtMoeda(f.precoMinimo)}
                              </td>
                              <td className="table-td tabular-nums" style={{ textAlign: 'right', color: 'var(--ada-error-text)' }}>
                                {fmtMoeda(f.precoMaximo)}
                              </td>
                              <td className="table-td tabular-nums" style={{ textAlign: 'right', color: 'var(--ada-body)' }}>
                                {fmtMoeda(f.precoMedio)}
                              </td>
                              <td className="table-td tabular-nums font-semibold" style={{ textAlign: 'right', color: 'var(--ada-heading)' }}>
                                {fmtMoeda(f.ultimoPreco)}
                              </td>
                              <td className="table-td" style={{ color: 'var(--ada-body)' }}>
                                {fmtData(f.ultimaCompra)}
                              </td>
                              <td className="table-td tabular-nums" style={{ textAlign: 'right', color: 'var(--ada-muted)' }}>
                                {f.totalCompras}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Mini-tabela de destaques (top aumentos / top reduções) ───────────────────
function TabelaDestaque({
  titulo,
  itens,
  tipo,
}: {
  titulo: string
  itens: ComparacaoPrecoIngrediente[]
  tipo: 'aumento' | 'reducao'
}) {
  if (itens.length === 0) return null
  const cor = tipo === 'aumento' ? 'var(--ada-error-text)' : 'var(--ada-success-text)'
  return (
    <div className="ada-surface-card p-4">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] mb-3"
        style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
        {titulo}
      </p>
      <div className="space-y-2">
        {itens.map(item => (
          <div key={item.ingredienteId} className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate" style={{ color: 'var(--ada-body)' }}>
              {item.ingredienteNome}
              <span className="text-xs ml-1" style={{ color: 'var(--ada-placeholder)' }}>
                ({item.unidadeMedidaCodigo})
              </span>
            </span>
            <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: cor }}>
              {fmtPct(item.variacaoPercentual)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function ComparacaoPrecoPage() {
  const [dados, setDados] = useState<ComparacaoPreco | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(primeiroDiaMes)
  const [ate, setAte] = useState(hoje)

  const carregar = async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await relatoriosService.comparacaoPrecos(de || undefined, ate || undefined)
      setDados(data)
    } catch {
      setErro('Erro ao carregar comparação de preços.')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrar = (e: React.FormEvent) => { e.preventDefault(); carregar() }

  const temDestaques = dados &&
    (dados.maioresAumentos.length > 0 || dados.maioresReducoes.length > 0)

  return (
    <div className="ada-page">
      <PageHeader
        titulo="Comparação de Preços"
        breadcrumb={['Relatórios', 'Comparação de Preços']}
        subtitulo="Variação de preços de ingredientes entre entradas e fornecedores"
      />

      <form onSubmit={handleFiltrar} className="filter-bar" role="search" aria-label="Filtrar comparação">
        <div>
          <label className="filter-label">De</label>
          <input
            type="date"
            value={de}
            onChange={e => setDe(e.target.value)}
            className="filter-input"
          />
        </div>
        <div>
          <label className="filter-label">Até</label>
          <input
            type="date"
            value={ate}
            onChange={e => setAte(e.target.value)}
            className="filter-input"
          />
        </div>
        <button type="submit" className="btn-secondary" disabled={loading}>
          {loading ? 'Carregando…' : 'Gerar Comparação'}
        </button>
        {(de || ate) && (
          <button
            type="button"
            className="btn-ghost text-sm"
            style={{ color: 'var(--ada-muted)' }}
            onClick={() => { setDe(''); setAte(''); }}
          >
            Ver todo o histórico
          </button>
        )}
      </form>

      {loading && <SkeletonTable colunas={7} linhas={6} />}
      {!loading && erro && <div className="state-error" role="alert">{erro}</div>}

      {!loading && dados && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="ada-surface-card p-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] mb-1"
                style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Ingredientes comparados
              </p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ada-heading)' }}>
                {dados.ingredientes.length}
              </p>
            </div>
            <div className="ada-surface-card p-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] mb-1"
                style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Com aumento de preço
              </p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ada-error-text)' }}>
                {dados.ingredientes.filter(i => i.tendenciaPreco === 'aumento').length}
              </p>
            </div>
            <div className="ada-surface-card p-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] mb-1"
                style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Com redução de preço
              </p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ada-success-text)' }}>
                {dados.ingredientes.filter(i => i.tendenciaPreco === 'reducao').length}
              </p>
            </div>
          </div>

          {/* Destaques: maiores aumentos / reduções */}
          {temDestaques && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <TabelaDestaque
                titulo="Maiores aumentos"
                itens={dados.maioresAumentos}
                tipo="aumento"
              />
              <TabelaDestaque
                titulo="Maiores reduções"
                itens={dados.maioresReducoes}
                tipo="reducao"
              />
            </div>
          )}

          {/* Tabela principal */}
          {dados.ingredientes.length === 0 ? (
            <EmptyState
              icon={<ScaleIcon className="w-7 h-7" />}
              titulo="Nenhum ingrediente encontrado"
              descricao="Não há entradas de mercadoria confirmadas no período selecionado."
            />
          ) : (
            <div className="ada-surface-card">
              <div className="overflow-x-auto">
                <table className="w-full" role="table">
                  <thead>
                    <tr className="table-head-row">
                      <th className="table-th" scope="col">Ingrediente</th>
                      <th className="table-th table-th-right" scope="col">Preço anterior</th>
                      <th className="table-th table-th-right" scope="col">Último preço</th>
                      <th className="table-th table-th-right" scope="col">Variação</th>
                      <th className="table-th" scope="col">Tendência</th>
                      <th className="table-th" scope="col">Último fornecedor</th>
                      <th className="table-th table-th-right" scope="col">Compras</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.ingredientes.map(item => (
                      <LinhaIngrediente key={item.ingredienteId} item={item} />
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="px-4 py-2 text-xs" style={{ color: 'var(--ada-placeholder)' }}>
                Clique em um ingrediente para ver o histórico completo e comparação por fornecedor.
              </p>
            </div>
          )}
        </>
      )}

      {!loading && !dados && !erro && (
        <EmptyState
          icon={<ScaleIcon className="w-7 h-7" />}
          titulo="Selecione um período"
          descricao='Defina o intervalo de datas e clique em "Gerar Comparação" para visualizar.'
        />
      )}
    </div>
  )
}
```

- [ ] **Passo 2: Verificar tipagem**

```bash
cd CasaDiAna/frontend
npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Passo 3: Commit**

```bash
cd CasaDiAna
git add frontend/src/features/relatorios/pages/ComparacaoPrecoPage.tsx
git commit -m "feat(relatorios): criar ComparacaoPrecoPage com histórico e comparação por fornecedor"
```

---

## Task 8: Rota e navegação

**Files:**
- Modify: `CasaDiAna/frontend/src/routes/AppRoutes.tsx`
- Modify: `CasaDiAna/frontend/src/components/layout/Sidebar.tsx`

- [ ] **Passo 1: Adicionar rota em AppRoutes.tsx**

Abrir `CasaDiAna/frontend/src/routes/AppRoutes.tsx`.

1. Adicionar import após os demais imports de relatórios:
```typescript
import { ComparacaoPrecoPage } from '@/features/relatorios/pages/ComparacaoPrecoPage'
```

2. Adicionar rota dentro do bloco `{/* Relatórios */}`, após a rota de insumos:
```tsx
<Route path="/relatorios/comparacao-precos" element={<ComparacaoPrecoPage />} />
```

- [ ] **Passo 2: Adicionar item na Sidebar**

Abrir `CasaDiAna/frontend/src/components/layout/Sidebar.tsx`.

Adicionar import do ícone (já existe `ArrowsRightLeftIcon` se disponível, senão usar `ScaleIcon` ou `ChartBarSquareIcon`). Verificar quais ícones estão importados. Se `ScaleIcon` não estiver listado, adicionar ao import do `@heroicons/react/24/outline`:
```typescript
import {
  // ... ícones já existentes ...
  ScaleIcon,
} from '@heroicons/react/24/outline'
```

Adicionar item ao array `grupos`, dentro do grupo `'Relatórios'`, após o item `'Insumos por Produção'`:
```typescript
{ label: 'Comparação de Preços', href: '/relatorios/comparacao-precos', icon: ScaleIcon, iconColor: '#A78BFA' },
```

- [ ] **Passo 3: Verificar tipagem**

```bash
cd CasaDiAna/frontend
npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Passo 4: Commit final**

```bash
cd CasaDiAna
git add frontend/src/routes/AppRoutes.tsx \
        frontend/src/components/layout/Sidebar.tsx
git commit -m "feat(nav): adicionar rota e item de menu para Comparação de Preços"
```

---

## Self-Review

### Cobertura do spec

| Requisito | Tarefa que implementa |
|-----------|----------------------|
| Histórico de preço por ingrediente | Task 3 handler + Task 7 `LinhaIngrediente` expand |
| Comparação entre entradas (anterior vs. atual) | Task 3 `ultimoPreco` / `precoAnterior` + Task 7 tabela principal |
| Variação em valor e percentual | Task 3 `variacaoValor` / `variacaoPercentual` + Task 7 coluna Variação |
| Indicação aumento / redução / estável | Task 3 `tendenciaPreco` + Task 7 `TendenciaBadge` |
| Fornecedor vinculado a cada compra | Task 3 `HistoricoPrecoDto.FornecedorNome` + Task 7 histórico expandido |
| Nota fiscal relacionada | Task 3 `HistoricoPrecoDto.NumeroNotaFiscal` + Task 7 coluna NF |
| Comparação entre fornecedores | Task 3 `PorFornecedor` + Task 7 tabela de fornecedores no expand |
| Fornecedor com menor preço | Task 7 badge "melhor preço" na tabela por fornecedor |
| Fornecedor com maior preço | Task 7 coluna `Maior preço` em vermelho |
| Preço médio por fornecedor | Task 3 `PrecoMedio` + Task 7 coluna Preço médio |
| Ingredientes com maior aumento | Task 3 `MaioresAumentos` + Task 7 `TabelaDestaque` |
| Ingredientes com maior redução | Task 3 `MaioresReducoes` + Task 7 `TabelaDestaque` |
| Evolução ao longo do tempo | Task 7 histórico em ordem cronológica reversa |
| Oportunidades de economia | Task 7 badge "melhor preço" + ranking MaioresAumentos |
| Filtro por período | Task 3 query params `De`/`Ate` + Task 7 filtros de data + botão "Ver todo o histórico" |
| Sem nova migration | ✅ Apenas leitura de dados existentes |
| Integrado ao sistema (nav, rota, auth) | Task 8 — rota dentro de `MainLayout` (proteção via `[Authorize]` no backend) |

### Pontos de atenção na implementação

1. **`ScaleIcon`** — verificar se está disponível no pacote `@heroicons/react` instalado. Se não, usar `ArrowsRightLeftIcon` (já importado na `Sidebar`) tanto na página quanto na `Sidebar`.
2. **`var(--ada-success-bg)` / `var(--ada-success-border)` / `var(--ada-success-text)`** — confirmar que esses tokens existem em `index.css`. Se algum não existir, usar equivalente disponível (ex.: `var(--ada-badge-success)`).
3. **`EmptyState` props** — confirmar que o componente aceita `titulo` e `descricao`. Verificar em `frontend/src/components/ui/EmptyState.tsx` e ajustar nomes de props se necessário.
4. **Entradas sem `Ingrediente` carregado** — O método `ListarAsync` existente não faz `ThenInclude(Ingrediente)`. O novo `ListarParaComparacaoAsync` sim. Se o handler for chamado via `ListarAsync` por engano, `ingredienteInfo.Nome` vai lançar `NullReferenceException`. Usar apenas o novo método.
