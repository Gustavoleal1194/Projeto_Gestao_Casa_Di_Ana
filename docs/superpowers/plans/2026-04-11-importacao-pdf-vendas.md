# Importação de Vendas via PDF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir upload de um PDF de "Movimentação de Produtos - Sintético" de PDV para importar vendas diárias em lote, com preview + confirmação antes de gravar.

**Architecture:** Dois endpoints REST (`/preview` e `/confirmar`). O preview extrai texto do PDF via PdfPig, parseia linhas de produto, normaliza nomes e casa com o catálogo existente retornando status por linha. A confirmação recebe a lista de itens aprovados pelo usuário e grava `VendaDiaria` em batch + registro de auditoria. A prevenção de duplicatas é feita por hash SHA-256 do conteúdo do PDF.

**Tech Stack:** UglyToad.PdfPig (extração), MediatR + CQRS (backend), EF Core 8 + Npgsql (persistência), React 18 + TypeScript + Tailwind v4 (frontend).

---

## Estrutura de Arquivos

### Novos — Backend
```
src/CasaDiAna.Domain/Entities/ImportacaoVendas.cs
src/CasaDiAna.Domain/Interfaces/IImportacaoVendasRepository.cs

src/CasaDiAna.Application/ImportacaoVendas/Services/IPdfVendasParser.cs   ← interface + LinhaRelatorio + PdfParseResult
src/CasaDiAna.Application/ImportacaoVendas/Dtos/StatusImportacao.cs
src/CasaDiAna.Application/ImportacaoVendas/Dtos/ItemPreviewDto.cs
src/CasaDiAna.Application/ImportacaoVendas/Dtos/PreviewImportacaoDto.cs
src/CasaDiAna.Application/ImportacaoVendas/Dtos/ItemConfirmarDto.cs
src/CasaDiAna.Application/ImportacaoVendas/Dtos/ResultadoImportacaoDto.cs
src/CasaDiAna.Application/ImportacaoVendas/Commands/ProcessarPreview/ProcessarPreviewPdfVendasCommand.cs
src/CasaDiAna.Application/ImportacaoVendas/Commands/ProcessarPreview/ProcessarPreviewPdfVendasCommandHandler.cs
src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/ConfirmarImportacaoCommand.cs
src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/ConfirmarImportacaoCommandValidator.cs
src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/ConfirmarImportacaoCommandHandler.cs

src/CasaDiAna.Infrastructure/Services/PdfVendasParser.cs
src/CasaDiAna.Infrastructure/Repositories/ImportacaoVendasRepository.cs
src/CasaDiAna.Infrastructure/Persistence/Configurations/ImportacaoVendasConfiguration.cs
src/CasaDiAna.API/Controllers/ImportacaoVendasController.cs
```

### Modificados — Backend
```
src/CasaDiAna.Domain/Interfaces/IVendaDiariaRepository.cs          ← + AdicionarRangeAsync
src/CasaDiAna.Infrastructure/Repositories/VendaDiariaRepository.cs ← implementa AdicionarRangeAsync
src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs           ← + DbSet<ImportacaoVendas>
src/CasaDiAna.Infrastructure/DependencyInjection.cs                ← registra PdfVendasParser + ImportacaoVendasRepository
src/CasaDiAna.Infrastructure/CasaDiAna.Infrastructure.csproj       ← + UglyToad.PdfPig
```

### Novos — Frontend
```
frontend/src/types/importacao.ts
frontend/src/features/producao/importacao-vendas/services/importacaoVendasService.ts
frontend/src/features/producao/importacao-vendas/pages/ImportacaoVendasPage.tsx
```

### Modificados — Frontend
```
frontend/src/routes/AppRoutes.tsx           ← + rota /producao/importacao-vendas
frontend/src/components/layout/Sidebar.tsx ← + item nav em Produção
```

### Novos — Testes
```
tests/CasaDiAna.Application.Tests/ImportacaoVendas/PdfVendasParserTests.cs
tests/CasaDiAna.Application.Tests/ImportacaoVendas/ProcessarPreviewHandlerTests.cs
```

---

## Task 1: PdfPig NuGet + Entidade de Domínio + Interfaces

**Files:**
- Modify: `src/CasaDiAna.Infrastructure/CasaDiAna.Infrastructure.csproj`
- Create: `src/CasaDiAna.Domain/Entities/ImportacaoVendas.cs`
- Create: `src/CasaDiAna.Domain/Interfaces/IImportacaoVendasRepository.cs`
- Modify: `src/CasaDiAna.Domain/Interfaces/IVendaDiariaRepository.cs`

- [x] **Step 1: Adicionar PdfPig ao projeto Infrastructure**

Abrir `src/CasaDiAna.Infrastructure/CasaDiAna.Infrastructure.csproj` e adicionar dentro do `<ItemGroup>` existente:

```xml
<PackageReference Include="UglyToad.PdfPig" Version="0.1.9" />
```

- [x] **Step 2: Criar a entidade ImportacaoVendas**

Criar `src/CasaDiAna.Domain/Entities/ImportacaoVendas.cs`:

```csharp
namespace CasaDiAna.Domain.Entities;

public class ImportacaoVendas
{
    public Guid Id { get; private set; }
    public string NomeArquivo { get; private set; } = string.Empty;
    public string HashConteudo { get; private set; } = string.Empty;
    public DateTime CriadoEm { get; private set; }
    public string? PeriodoDe { get; private set; }
    public string? PeriodoAte { get; private set; }
    public int TotalLinhasParseadas { get; private set; }
    public int TotalImportadas { get; private set; }
    public int TotalIgnoradas { get; private set; }
    public int TotalNaoEncontradas { get; private set; }
    public Guid CriadoPor { get; private set; }

    private ImportacaoVendas() { }

    public static ImportacaoVendas Criar(
        string nomeArquivo,
        string hashConteudo,
        string? periodoDe,
        string? periodoAte,
        int totalLinhas,
        int totalImportadas,
        int totalIgnoradas,
        int totalNaoEncontradas,
        Guid criadoPor)
    {
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
            CriadoPor = criadoPor
        };
    }
}
```

- [x] **Step 3: Criar IImportacaoVendasRepository**

Criar `src/CasaDiAna.Domain/Interfaces/IImportacaoVendasRepository.cs`:

```csharp
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IImportacaoVendasRepository
{
    Task<bool> HashExisteAsync(string hash, CancellationToken ct = default);
    Task AdicionarAsync(ImportacaoVendas importacao, CancellationToken ct = default);
    Task<IReadOnlyList<ImportacaoVendas>> ListarAsync(CancellationToken ct = default);
}
```

- [x] **Step 4: Adicionar AdicionarRangeAsync ao IVendaDiariaRepository**

Abrir `src/CasaDiAna.Domain/Interfaces/IVendaDiariaRepository.cs` e adicionar um método:

```csharp
Task AdicionarRangeAsync(IEnumerable<VendaDiaria> vendas, CancellationToken ct = default);
```

O arquivo completo fica:

```csharp
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IVendaDiariaRepository
{
    Task<VendaDiaria?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<VendaDiaria>> ListarAsync(
        DateTime? de = null,
        DateTime? ate = null,
        Guid? produtoId = null,
        CancellationToken ct = default);
    Task AdicionarAsync(VendaDiaria venda, CancellationToken ct = default);
    Task AdicionarRangeAsync(IEnumerable<VendaDiaria> vendas, CancellationToken ct = default);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
```

- [x] **Step 5: Restaurar pacotes e compilar**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.Infrastructure'; dotnet restore"
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build"
```

Esperado: build bem-sucedido (pode haver erro de interface não implementada em VendaDiariaRepository — será corrigido no Task 6).

- [x] **Step 6: Commit**

```bash
git add src/CasaDiAna.Infrastructure/CasaDiAna.Infrastructure.csproj \
        src/CasaDiAna.Domain/Entities/ImportacaoVendas.cs \
        src/CasaDiAna.Domain/Interfaces/IImportacaoVendasRepository.cs \
        src/CasaDiAna.Domain/Interfaces/IVendaDiariaRepository.cs
git commit -m "feat: domain entity ImportacaoVendas + interfaces + PdfPig dependency"
```

---

## Task 2: Application — DTOs, Interface do Parser, Modelos

**Files:**
- Create: `src/CasaDiAna.Application/ImportacaoVendas/Services/IPdfVendasParser.cs`
- Create: `src/CasaDiAna.Application/ImportacaoVendas/Dtos/StatusImportacao.cs`
- Create: `src/CasaDiAna.Application/ImportacaoVendas/Dtos/ItemPreviewDto.cs`
- Create: `src/CasaDiAna.Application/ImportacaoVendas/Dtos/PreviewImportacaoDto.cs`
- Create: `src/CasaDiAna.Application/ImportacaoVendas/Dtos/ItemConfirmarDto.cs`
- Create: `src/CasaDiAna.Application/ImportacaoVendas/Dtos/ResultadoImportacaoDto.cs`

- [x] **Step 1: Criar IPdfVendasParser com tipos de suporte**

Criar `src/CasaDiAna.Application/ImportacaoVendas/Services/IPdfVendasParser.cs`:

```csharp
namespace CasaDiAna.Application.ImportacaoVendas.Services;

public interface IPdfVendasParser
{
    PdfParseResult Parse(byte[] pdfBytes);
}

public record PdfParseResult(
    string? PeriodoDe,
    string? PeriodoAte,
    string Hash,
    IReadOnlyList<LinhaRelatorio> Linhas);

public record LinhaRelatorio(
    string? CodigoExterno,
    string Nome,
    string? Grupo,
    decimal Quantidade,
    decimal ValorTotal);
```

- [x] **Step 2: Criar StatusImportacao enum**

Criar `src/CasaDiAna.Application/ImportacaoVendas/Dtos/StatusImportacao.cs`:

```csharp
namespace CasaDiAna.Application.ImportacaoVendas.Dtos;

public enum StatusImportacao
{
    Matched    = 1,
    Ambiguous  = 2,
    Unmatched  = 3,
    Ignored    = 4,
}
```

- [x] **Step 3: Criar ItemPreviewDto**

Criar `src/CasaDiAna.Application/ImportacaoVendas/Dtos/ItemPreviewDto.cs`:

```csharp
namespace CasaDiAna.Application.ImportacaoVendas.Dtos;

public record ItemPreviewDto(
    string? CodigoExterno,
    string NomeRelatorio,
    string? Grupo,
    decimal Quantidade,
    decimal ValorTotal,
    StatusImportacao Status,
    Guid? ProdutoId,
    string? ProdutoNome,
    IReadOnlyList<SugestaoMatchDto> Sugestoes);

public record SugestaoMatchDto(Guid ProdutoId, string ProdutoNome);
```

- [x] **Step 4: Criar PreviewImportacaoDto**

Criar `src/CasaDiAna.Application/ImportacaoVendas/Dtos/PreviewImportacaoDto.cs`:

```csharp
namespace CasaDiAna.Application.ImportacaoVendas.Dtos;

public record PreviewImportacaoDto(
    string Hash,
    string? PeriodoDe,
    string? PeriodoAte,
    int TotalLinhasParseadas,
    int TotalMatched,
    int TotalAmbiguous,
    int TotalUnmatched,
    int TotalIgnored,
    IReadOnlyList<ItemPreviewDto> Itens);
```

- [x] **Step 5: Criar ItemConfirmarDto e ResultadoImportacaoDto**

Criar `src/CasaDiAna.Application/ImportacaoVendas/Dtos/ItemConfirmarDto.cs`:

```csharp
namespace CasaDiAna.Application.ImportacaoVendas.Dtos;

public record ItemConfirmarDto(
    Guid ProdutoId,
    decimal Quantidade);
```

Criar `src/CasaDiAna.Application/ImportacaoVendas/Dtos/ResultadoImportacaoDto.cs`:

```csharp
namespace CasaDiAna.Application.ImportacaoVendas.Dtos;

public record ResultadoImportacaoDto(
    int TotalImportadas,
    int TotalIgnoradas,
    int TotalNaoEncontradas);
```

- [x] **Step 6: Build para validar**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build"
```

Esperado: build bem-sucedido.

- [x] **Step 7: Commit**

```bash
git add src/CasaDiAna.Application/ImportacaoVendas/
git commit -m "feat: application DTOs and IPdfVendasParser interface"
```

---

## Task 3: Implementar PdfVendasParser

**Files:**
- Create: `src/CasaDiAna.Infrastructure/Services/PdfVendasParser.cs`
- Create: `tests/CasaDiAna.Application.Tests/ImportacaoVendas/PdfVendasParserTests.cs`

O parser tem duas partes separáveis: extração de linhas do PDF (depende de PdfPig) e a lógica de parse das linhas (pura, testável). O método `ParseLines` é `internal static` para permitir teste direto.

- [x] **Step 1: Criar PdfVendasParser**

Criar `src/CasaDiAna.Infrastructure/Services/PdfVendasParser.cs`:

```csharp
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using CasaDiAna.Application.ImportacaoVendas.Services;
using UglyToad.PdfPig;

namespace CasaDiAna.Infrastructure.Services;

public class PdfVendasParser : IPdfVendasParser
{
    // Itens que devem ser ignorados — não são produtos normais
    private static readonly HashSet<string> _ignorados = new(StringComparer.OrdinalIgnoreCase)
    {
        "taxa de servico",
        "taxa servico",
        "entrega",
        "diversos valor",
        "diversos",
        "acrescimo",
        "gorjeta",
        "desconto",
        "couvert",
    };

    public PdfParseResult Parse(byte[] pdfBytes)
    {
        var todasLinhas = new List<string>();

        using var document = PdfDocument.Open(pdfBytes);
        foreach (var page in document.GetPages())
        {
            var linhasPagina = ReconstruirLinhas(page);
            todasLinhas.AddRange(linhasPagina);
        }

        var hash = Convert.ToHexString(SHA256.HashData(pdfBytes)).ToLowerInvariant();
        var linhas = ParseLines(todasLinhas, out var periodoDe, out var periodoAte);

        return new PdfParseResult(periodoDe, periodoAte, hash, linhas);
    }

    private static IReadOnlyList<string> ReconstruirLinhas(UglyToad.PdfPig.Content.Page page)
    {
        var words = page.GetWords().ToList();
        if (words.Count == 0) return Array.Empty<string>();

        // Agrupa palavras pela coordenada Y central (tolerância de 2pt)
        return words
            .GroupBy(w => Math.Round(w.BoundingBox.Centroid.Y / 2.0) * 2)
            .OrderByDescending(g => g.Key) // PDF: Y=0 é base, cresce para cima
            .Select(g => string.Join("  ", g.OrderBy(w => w.BoundingBox.Left).Select(w => w.Text)))
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .ToList();
    }

    // internal para permitir testes sem PDF real
    internal static IReadOnlyList<LinhaRelatorio> ParseLines(
        IReadOnlyList<string> linhas,
        out string? periodoDe,
        out string? periodoAte)
    {
        periodoDe = null;
        periodoAte = null;
        var resultado = new List<LinhaRelatorio>();
        var grupoAtual = string.Empty;

        foreach (var raw in linhas)
        {
            var linha = raw.Trim();
            if (string.IsNullOrWhiteSpace(linha)) continue;

            // Extrai período: "Período: 01/04/2026 à 30/04/2026"
            if (periodoDe == null)
            {
                var pm = PeriodoRegex.Match(linha);
                if (pm.Success)
                {
                    periodoDe = ParseDataBR(pm.Groups["de"].Value);
                    periodoAte = ParseDataBR(pm.Groups["ate"].Value);
                    continue;
                }
            }

            // Ignora cabeçalho de página e rodapé
            if (IsPageHeader(linha)) continue;

            // Ignora linhas de total/subtotal
            if (IsTotalLine(linha)) continue;

            // Detecta seção (PADARIA, BAR, COZINHA etc.)
            if (IsSecaoHeader(linha))
            {
                grupoAtual = linha.Trim();
                continue;
            }

            // Tenta parsear linha de produto
            var parsed = TryParseProdutoLine(linha);
            if (parsed == null) continue;

            resultado.Add(new LinhaRelatorio(
                parsed.Value.Codigo,
                parsed.Value.Nome,
                string.IsNullOrEmpty(grupoAtual) ? null : grupoAtual,
                parsed.Value.Quantidade,
                parsed.Value.Valor));
        }

        return resultado.AsReadOnly();
    }

    private static readonly Regex PeriodoRegex = new(
        @"[Pp]er[ií]odo[:\s]+(?<de>\d{2}/\d{2}/\d{4})\s+[aà]\s+(?<ate>\d{2}/\d{2}/\d{4})",
        RegexOptions.Compiled);

    private static bool IsPageHeader(string linha)
    {
        return linha.Contains("MOVIMENTAÇÃO DE PRODUTOS", StringComparison.OrdinalIgnoreCase)
            || linha.Contains("SINTÉTICO", StringComparison.OrdinalIgnoreCase)
            || (linha.Contains("Cód", StringComparison.OrdinalIgnoreCase)
                && linha.Contains("Qtd", StringComparison.OrdinalIgnoreCase))
            || linha.StartsWith("Página", StringComparison.OrdinalIgnoreCase)
            || linha.StartsWith("Pág.", StringComparison.OrdinalIgnoreCase)
            || linha.StartsWith("Emitido", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsTotalLine(string linha)
    {
        var up = linha.ToUpperInvariant();
        return up.StartsWith("TOTAL")
            || up.StartsWith("SUB-TOTAL")
            || up.StartsWith("SUBTOTAL");
    }

    // Seção = linha toda em maiúsculas, sem dígitos, entre 2 e 50 chars
    private static readonly Regex SecaoRegex = new(
        @"^[A-ZÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ\s\-]+$",
        RegexOptions.Compiled);

    private static bool IsSecaoHeader(string linha)
    {
        var t = linha.Trim();
        return t.Length >= 2
            && t.Length <= 50
            && SecaoRegex.IsMatch(t)
            && !t.Any(char.IsDigit);
    }

    // Parseia linha: "001  Croissant de Presunto  12,000  150,00"
    private static (string? Codigo, string Nome, decimal Quantidade, decimal Valor)?
        TryParseProdutoLine(string linha)
    {
        // Remove prefixo "R$"
        linha = Regex.Replace(linha, @"\bR\$\s*", "").Trim();

        // Divide por 2+ espaços (colunas de relatório fixed-width)
        var tokens = Regex.Split(linha, @"\s{2,}")
            .Select(t => t.Trim())
            .Where(t => !string.IsNullOrEmpty(t))
            .ToList();

        if (tokens.Count < 2) return null;

        // Dois últimos tokens devem ser números (qty e valor)
        if (!TryParseDecimalBR(tokens[^1], out var valor) || valor <= 0) return null;
        if (!TryParseDecimalBR(tokens[^2], out var qty) || qty <= 0) return null;

        var nameTokens = tokens[..^2];
        if (nameTokens.Count == 0) return null;

        string? codigo = null;
        string nome;

        // Primeiro token pode ser código numérico (ex: "001")
        if (Regex.IsMatch(nameTokens[0], @"^\d{1,6}$"))
        {
            codigo = nameTokens[0];
            nome = string.Join(" ", nameTokens.Skip(1)).Trim();
        }
        else
        {
            nome = string.Join(" ", nameTokens).Trim();
            // Tenta extrair código embutido no início do nome
            var m = Regex.Match(nome, @"^(\d{1,6})\s+(.+)$");
            if (m.Success)
            {
                codigo = m.Groups[1].Value;
                nome = m.Groups[2].Value.Trim();
            }
        }

        if (string.IsNullOrWhiteSpace(nome) || nome.Length < 2) return null;

        return (codigo, nome, qty, valor);
    }

    private static bool TryParseDecimalBR(string s, out decimal value)
    {
        // Formato BR: 1.234,56 → remove "." e troca "," por "."
        var n = s.Replace(".", "").Replace(",", ".");
        return decimal.TryParse(n, NumberStyles.Any, CultureInfo.InvariantCulture, out value);
    }

    private static string? ParseDataBR(string ddmmyyyy)
    {
        if (DateTime.TryParseExact(ddmmyyyy, "dd/MM/yyyy",
            CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
            return dt.ToString("yyyy-MM-dd");
        return null;
    }

    internal static bool IsIgnorado(string nome)
    {
        var norm = Normalizar(nome);
        return _ignorados.Contains(norm);
    }

    internal static string Normalizar(string s)
    {
        if (string.IsNullOrWhiteSpace(s)) return string.Empty;

        // Remove diacríticos
        var formD = s.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(formD.Length);
        foreach (var c in formD)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }

        return Regex.Replace(
            sb.ToString()
              .Normalize(NormalizationForm.FormC)
              .ToLowerInvariant()
              .Replace("-", " ")
              .Replace("/", " ")
              .Replace("(", "")
              .Replace(")", "")
              .Replace(".", ""),
            @"\s+", " ").Trim();
    }
}
```

- [x] **Step 2: Escrever testes do parser**

Criar `tests/CasaDiAna.Application.Tests/ImportacaoVendas/PdfVendasParserTests.cs`:

```csharp
using CasaDiAna.Infrastructure.Services;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class PdfVendasParserTests
{
    [Fact]
    public void ParseLines_LinhaSimples_RetornaLinha()
    {
        var linhas = new List<string>
        {
            "PADARIA",
            "001  Croissant de Presunto  12,000  150,00",
        };

        var resultado = PdfVendasParser.ParseLines(linhas, out _, out _);

        resultado.Should().HaveCount(1);
        resultado[0].Nome.Should().Be("Croissant de Presunto");
        resultado[0].CodigoExterno.Should().Be("001");
        resultado[0].Quantidade.Should().Be(12m);
        resultado[0].ValorTotal.Should().Be(150m);
        resultado[0].Grupo.Should().Be("PADARIA");
    }

    [Fact]
    public void ParseLines_LinhaSemCodigo_RetornaLinha()
    {
        var linhas = new List<string>
        {
            "BAR",
            "Café Expresso  45,000  225,00",
        };

        var resultado = PdfVendasParser.ParseLines(linhas, out _, out _);

        resultado.Should().HaveCount(1);
        resultado[0].CodigoExterno.Should().BeNull();
        resultado[0].Nome.Should().Be("Café Expresso");
        resultado[0].Grupo.Should().Be("BAR");
    }

    [Fact]
    public void ParseLines_LinhaTotalIgnorada()
    {
        var linhas = new List<string>
        {
            "001  Pão de Mel  5,000  50,00",
            "TOTAL PADARIA  5,000  50,00",
        };

        var resultado = PdfVendasParser.ParseLines(linhas, out _, out _);

        resultado.Should().HaveCount(1);
        resultado[0].Nome.Should().Be("Pão de Mel");
    }

    [Fact]
    public void ParseLines_CabecalhoPaginaIgnorado()
    {
        var linhas = new List<string>
        {
            "MOVIMENTAÇÃO DE PRODUTOS - SINTÉTICO",
            "Cód.  Descrição  Qtd.  Valor",
            "001  Brigadeiro  10,000  80,00",
        };

        var resultado = PdfVendasParser.ParseLines(linhas, out _, out _);

        resultado.Should().HaveCount(1);
    }

    [Fact]
    public void ParseLines_ExtraiPeriodo()
    {
        var linhas = new List<string>
        {
            "Período: 01/04/2026 à 30/04/2026",
            "001  Produto X  5,000  50,00",
        };

        PdfVendasParser.ParseLines(linhas, out var de, out var ate);

        de.Should().Be("2026-04-01");
        ate.Should().Be("2026-04-30");
    }

    [Fact]
    public void ParseLines_SecaoAlteraGrupoDeLinhaSeguinte()
    {
        var linhas = new List<string>
        {
            "COZINHA",
            "001  Frango Grelhado  8,000  120,00",
            "BAR",
            "002  Suco de Laranja  20,000  100,00",
        };

        var resultado = PdfVendasParser.ParseLines(linhas, out _, out _);

        resultado.Should().HaveCount(2);
        resultado[0].Grupo.Should().Be("COZINHA");
        resultado[1].Grupo.Should().Be("BAR");
    }

    [Fact]
    public void Normalizar_RemoveDiacriticos()
    {
        PdfVendasParser.Normalizar("Pão de Mel").Should().Be("pao de mel");
        PdfVendasParser.Normalizar("CAFÉ EXPRESSO").Should().Be("cafe expresso");
        PdfVendasParser.Normalizar("Frango-Grelhado").Should().Be("frango grelhado");
    }

    [Fact]
    public void IsIgnorado_DetectaItensIgnorados()
    {
        PdfVendasParser.IsIgnorado("TAXA DE SERVIÇO").Should().BeTrue();
        PdfVendasParser.IsIgnorado("Entrega").Should().BeTrue();
        PdfVendasParser.IsIgnorado("Brigadeiro").Should().BeFalse();
    }
}
```

- [x] **Step 3: Rodar testes (devem passar)**

```bash
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test --filter 'PdfVendasParserTests' -v normal"
```

Esperado: 7 testes passando.

- [x] **Step 4: Commit**

```bash
git add src/CasaDiAna.Infrastructure/Services/PdfVendasParser.cs \
        tests/CasaDiAna.Application.Tests/ImportacaoVendas/PdfVendasParserTests.cs
git commit -m "feat: PdfVendasParser implementation with unit tests"
```

---

## Task 4: ProcessarPreviewPdfVendas Command + Handler

**Files:**
- Create: `src/CasaDiAna.Application/ImportacaoVendas/Commands/ProcessarPreview/ProcessarPreviewPdfVendasCommand.cs`
- Create: `src/CasaDiAna.Application/ImportacaoVendas/Commands/ProcessarPreview/ProcessarPreviewPdfVendasCommandHandler.cs`
- Create: `tests/CasaDiAna.Application.Tests/ImportacaoVendas/ProcessarPreviewHandlerTests.cs`

- [x] **Step 1: Criar ProcessarPreviewPdfVendasCommand**

Criar `src/CasaDiAna.Application/ImportacaoVendas/Commands/ProcessarPreview/ProcessarPreviewPdfVendasCommand.cs`:

```csharp
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using MediatR;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ProcessarPreview;

public record ProcessarPreviewPdfVendasCommand(
    byte[] PdfBytes,
    string NomeArquivo
) : IRequest<PreviewImportacaoDto>;
```

- [x] **Step 2: Criar ProcessarPreviewPdfVendasCommandHandler**

Criar `src/CasaDiAna.Application/ImportacaoVendas/Commands/ProcessarPreview/ProcessarPreviewPdfVendasCommandHandler.cs`:

```csharp
using System.Text;
using System.Text.RegularExpressions;
using System.Globalization;
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Application.ImportacaoVendas.Services;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ProcessarPreview;

public class ProcessarPreviewPdfVendasCommandHandler
    : IRequestHandler<ProcessarPreviewPdfVendasCommand, PreviewImportacaoDto>
{
    private readonly IPdfVendasParser _parser;
    private readonly IProdutoRepository _produtos;
    private readonly IImportacaoVendasRepository _importacoes;

    public ProcessarPreviewPdfVendasCommandHandler(
        IPdfVendasParser parser,
        IProdutoRepository produtos,
        IImportacaoVendasRepository importacoes)
    {
        _parser = parser;
        _produtos = produtos;
        _importacoes = importacoes;
    }

    public async Task<PreviewImportacaoDto> Handle(
        ProcessarPreviewPdfVendasCommand request,
        CancellationToken cancellationToken)
    {
        // Parse do PDF
        PdfParseResult parseResult;
        try
        {
            parseResult = _parser.Parse(request.PdfBytes);
        }
        catch (Exception ex)
        {
            throw new DomainException($"Falha ao processar o PDF: {ex.Message}");
        }

        if (parseResult.Linhas.Count == 0)
            throw new DomainException("Nenhuma linha de produto foi encontrada no PDF. Verifique se o arquivo é um relatório válido.");

        // Verifica duplicata
        if (await _importacoes.HashExisteAsync(parseResult.Hash, cancellationToken))
            throw new DomainException("Este arquivo já foi importado anteriormente.");

        // Carrega catálogo de produtos (todos, incluindo inativos — para alertar)
        var todosProdutos = await _produtos.ListarAsync(apenasAtivos: false, cancellationToken);
        var produtosAtivos = todosProdutos.Where(p => p.Ativo).ToList();

        // Casa cada linha do relatório com o catálogo
        var itens = parseResult.Linhas
            .Select(linha => Match(linha, produtosAtivos))
            .ToList();

        return new PreviewImportacaoDto(
            parseResult.Hash,
            parseResult.PeriodoDe,
            parseResult.PeriodoAte,
            TotalLinhasParseadas: parseResult.Linhas.Count,
            TotalMatched:   itens.Count(i => i.Status == StatusImportacao.Matched),
            TotalAmbiguous: itens.Count(i => i.Status == StatusImportacao.Ambiguous),
            TotalUnmatched: itens.Count(i => i.Status == StatusImportacao.Unmatched),
            TotalIgnored:   itens.Count(i => i.Status == StatusImportacao.Ignored),
            Itens: itens.AsReadOnly());
    }

    private static ItemPreviewDto Match(
        LinhaRelatorio linha,
        IReadOnlyList<CasaDiAna.Domain.Entities.Produto> produtos)
    {
        // Itens configurados para ignorar
        if (IsIgnorado(linha.Nome))
        {
            return new ItemPreviewDto(
                linha.CodigoExterno, linha.Nome, linha.Grupo,
                linha.Quantidade, linha.ValorTotal,
                StatusImportacao.Ignored,
                null, null, Array.Empty<SugestaoMatchDto>());
        }

        var nomeNorm = Normalizar(linha.Nome);

        // 1. Match exato normalizado
        var exatos = produtos
            .Where(p => Normalizar(p.Nome) == nomeNorm)
            .ToList();

        if (exatos.Count == 1)
            return Matched(linha, exatos[0]);
        if (exatos.Count > 1)
            return Ambiguous(linha, exatos);

        // 2. Match parcial: um nome contém o outro
        var parciais = produtos
            .Where(p =>
            {
                var pNorm = Normalizar(p.Nome);
                return pNorm.Contains(nomeNorm) || nomeNorm.Contains(pNorm);
            })
            .ToList();

        if (parciais.Count == 1)
            return Matched(linha, parciais[0]);
        if (parciais.Count > 1)
            return Ambiguous(linha, parciais);

        // 3. Sem match
        return new ItemPreviewDto(
            linha.CodigoExterno, linha.Nome, linha.Grupo,
            linha.Quantidade, linha.ValorTotal,
            StatusImportacao.Unmatched,
            null, null, Array.Empty<SugestaoMatchDto>());
    }

    private static ItemPreviewDto Matched(
        LinhaRelatorio linha,
        CasaDiAna.Domain.Entities.Produto produto) =>
        new(linha.CodigoExterno, linha.Nome, linha.Grupo,
            linha.Quantidade, linha.ValorTotal,
            StatusImportacao.Matched,
            produto.Id, produto.Nome, Array.Empty<SugestaoMatchDto>());

    private static ItemPreviewDto Ambiguous(
        LinhaRelatorio linha,
        IReadOnlyList<CasaDiAna.Domain.Entities.Produto> candidatos) =>
        new(linha.CodigoExterno, linha.Nome, linha.Grupo,
            linha.Quantidade, linha.ValorTotal,
            StatusImportacao.Ambiguous,
            null, null,
            candidatos.Select(p => new SugestaoMatchDto(p.Id, p.Nome)).ToList().AsReadOnly());

    // Reutiliza a mesma normalização do parser (copiada para evitar acoplamento à infra)
    private static string Normalizar(string s)
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

    private static readonly HashSet<string> _ignorados = new(StringComparer.OrdinalIgnoreCase)
    {
        "taxa de servico", "taxa servico", "entrega", "diversos valor",
        "diversos", "acrescimo", "gorjeta", "desconto", "couvert",
    };

    private static bool IsIgnorado(string nome) => _ignorados.Contains(Normalizar(nome));
}
```

- [x] **Step 3: Escrever testes do handler**

Criar `tests/CasaDiAna.Application.Tests/ImportacaoVendas/ProcessarPreviewHandlerTests.cs`:

```csharp
using CasaDiAna.Application.ImportacaoVendas.Commands.ProcessarPreview;
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Application.ImportacaoVendas.Services;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class ProcessarPreviewHandlerTests
{
    private readonly Mock<IPdfVendasParser> _parser = new();
    private readonly Mock<IProdutoRepository> _produtos = new();
    private readonly Mock<IImportacaoVendasRepository> _importacoes = new();

    private ProcessarPreviewPdfVendasCommandHandler CreateHandler() =>
        new(_parser.Object, _produtos.Object, _importacoes.Object);

    [Fact]
    public async Task Handle_ProdutoNomeExato_RetornaMatched()
    {
        // Arrange
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new PdfParseResult(null, null, "hash123", new List<LinhaRelatorio>
               {
                   new("001", "Croissant", "PADARIA", 10m, 100m)
               }));

        _importacoes.Setup(r => r.HashExisteAsync("hash123", default)).ReturnsAsync(false);

        // Cria produto real via reflection (construtor privado)
        var produto = CriarProduto(Guid.NewGuid(), "Croissant");
        _produtos.Setup(r => r.ListarAsync(false, default))
                 .ReturnsAsync(new List<Produto> { produto });

        // Act
        var result = await CreateHandler().Handle(
            new ProcessarPreviewPdfVendasCommand(Array.Empty<byte>(), "test.pdf"), default);

        // Assert
        result.Itens.Should().HaveCount(1);
        result.Itens[0].Status.Should().Be(StatusImportacao.Matched);
        result.Itens[0].ProdutoId.Should().Be(produto.Id);
        result.TotalMatched.Should().Be(1);
    }

    [Fact]
    public async Task Handle_HashDuplicado_ThrowsDomainException()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new PdfParseResult(null, null, "hash_dup", new List<LinhaRelatorio>
               {
                   new(null, "Produto X", null, 1m, 10m)
               }));

        _importacoes.Setup(r => r.HashExisteAsync("hash_dup", default)).ReturnsAsync(true);
        _produtos.Setup(r => r.ListarAsync(false, default))
                 .ReturnsAsync(new List<Produto>());

        var act = async () => await CreateHandler().Handle(
            new ProcessarPreviewPdfVendasCommand(Array.Empty<byte>(), "dup.pdf"), default);

        await act.Should().ThrowAsync<CasaDiAna.Domain.Exceptions.DomainException>()
            .WithMessage("*já foi importado*");
    }

    [Fact]
    public async Task Handle_NenhumaLinhaNoRelatorio_ThrowsDomainException()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new PdfParseResult(null, null, "hash_empty",
                   new List<LinhaRelatorio>()));

        _importacoes.Setup(r => r.HashExisteAsync(It.IsAny<string>(), default)).ReturnsAsync(false);
        _produtos.Setup(r => r.ListarAsync(false, default)).ReturnsAsync(new List<Produto>());

        var act = async () => await CreateHandler().Handle(
            new ProcessarPreviewPdfVendasCommand(Array.Empty<byte>(), "empty.pdf"), default);

        await act.Should().ThrowAsync<CasaDiAna.Domain.Exceptions.DomainException>()
            .WithMessage("*Nenhuma linha*");
    }

    [Fact]
    public async Task Handle_ProdutoSemMatch_RetornaUnmatched()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new PdfParseResult(null, null, "hash_x", new List<LinhaRelatorio>
               {
                   new(null, "Produto Inexistente", null, 5m, 50m)
               }));

        _importacoes.Setup(r => r.HashExisteAsync("hash_x", default)).ReturnsAsync(false);
        _produtos.Setup(r => r.ListarAsync(false, default))
                 .ReturnsAsync(new List<Produto> { CriarProduto(Guid.NewGuid(), "Outro Produto") });

        var result = await CreateHandler().Handle(
            new ProcessarPreviewPdfVendasCommand(Array.Empty<byte>(), "t.pdf"), default);

        result.Itens[0].Status.Should().Be(StatusImportacao.Unmatched);
        result.TotalUnmatched.Should().Be(1);
    }

    // Helper: cria Produto contornando construtor privado
    private static Produto CriarProduto(Guid id, string nome)
    {
        var produto = (Produto)System.Runtime.CompilerServices.RuntimeHelpers
            .GetUninitializedObject(typeof(Produto));

        typeof(Produto).GetProperty(nameof(Produto.Id))!
            .SetValue(produto, id);
        typeof(Produto).GetProperty(nameof(Produto.Nome))!
            .SetValue(produto, nome);
        typeof(Produto).GetProperty(nameof(Produto.Ativo))!
            .SetValue(produto, true);
        typeof(Produto).GetProperty(nameof(Produto.PrecoVenda))!
            .SetValue(produto, 10m);

        return produto;
    }
}
```

- [x] **Step 4: Rodar testes**

```bash
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test --filter 'ProcessarPreviewHandlerTests' -v normal"
```

Esperado: 4 testes passando.

- [x] **Step 5: Commit**

```bash
git add src/CasaDiAna.Application/ImportacaoVendas/Commands/ProcessarPreview/ \
        tests/CasaDiAna.Application.Tests/ImportacaoVendas/ProcessarPreviewHandlerTests.cs
git commit -m "feat: ProcessarPreviewPdfVendas command handler with tests"
```

---

## Task 5: ConfirmarImportacao Command + Handler

**Files:**
- Create: `src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/ConfirmarImportacaoCommand.cs`
- Create: `src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/ConfirmarImportacaoCommandValidator.cs`
- Create: `src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/ConfirmarImportacaoCommandHandler.cs`

- [x] **Step 1: Criar ConfirmarImportacaoCommand**

Criar `src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/ConfirmarImportacaoCommand.cs`:

```csharp
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using MediatR;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;

public record ConfirmarImportacaoCommand(
    string Hash,
    string NomeArquivo,
    DateTime DataVenda,
    string? PeriodoDe,
    string? PeriodoAte,
    int TotalLinhasParseadas,
    int TotalIgnoradas,
    int TotalNaoEncontradas,
    IReadOnlyList<ItemConfirmarDto> Itens
) : IRequest<ResultadoImportacaoDto>;
```

- [x] **Step 2: Criar ConfirmarImportacaoCommandValidator**

Criar `src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/ConfirmarImportacaoCommandValidator.cs`:

```csharp
using FluentValidation;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;

public class ConfirmarImportacaoCommandValidator
    : AbstractValidator<ConfirmarImportacaoCommand>
{
    public ConfirmarImportacaoCommandValidator()
    {
        RuleFor(x => x.Hash)
            .NotEmpty().WithMessage("Hash do arquivo é obrigatório.");

        RuleFor(x => x.NomeArquivo)
            .NotEmpty().WithMessage("Nome do arquivo é obrigatório.");

        RuleFor(x => x.DataVenda)
            .NotEmpty().WithMessage("Data de venda é obrigatória.")
            .LessThanOrEqualTo(DateTime.Today.AddDays(1))
            .WithMessage("Data de venda não pode ser no futuro.");

        RuleFor(x => x.Itens)
            .NotEmpty().WithMessage("Nenhum item confirmado para importação.");

        RuleForEach(x => x.Itens).ChildRules(item =>
        {
            item.RuleFor(i => i.ProdutoId)
                .NotEmpty().WithMessage("ProdutoId é obrigatório em cada item.");
            item.RuleFor(i => i.Quantidade)
                .GreaterThan(0).WithMessage("Quantidade deve ser maior que zero.");
        });
    }
}
```

- [x] **Step 3: Criar ConfirmarImportacaoCommandHandler**

Criar `src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/ConfirmarImportacaoCommandHandler.cs`:

```csharp
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;

public class ConfirmarImportacaoCommandHandler
    : IRequestHandler<ConfirmarImportacaoCommand, ResultadoImportacaoDto>
{
    private readonly IVendaDiariaRepository _vendas;
    private readonly IProdutoRepository _produtos;
    private readonly IImportacaoVendasRepository _importacoes;
    private readonly ICurrentUserService _currentUser;

    public ConfirmarImportacaoCommandHandler(
        IVendaDiariaRepository vendas,
        IProdutoRepository produtos,
        IImportacaoVendasRepository importacoes,
        ICurrentUserService currentUser)
    {
        _vendas = vendas;
        _produtos = produtos;
        _importacoes = importacoes;
        _currentUser = currentUser;
    }

    public async Task<ResultadoImportacaoDto> Handle(
        ConfirmarImportacaoCommand request,
        CancellationToken cancellationToken)
    {
        // Dupla verificação de hash (o preview já verificou, mas a confirmação pode vir depois de um tempo)
        if (await _importacoes.HashExisteAsync(request.Hash, cancellationToken))
            throw new DomainException("Este arquivo já foi importado anteriormente.");

        // Valida que todos os produtos existem e estão ativos
        var produtoIds = request.Itens.Select(i => i.ProdutoId).Distinct().ToList();
        var produtosEncontrados = await _produtos.ListarAsync(apenasAtivos: false, cancellationToken);
        var produtosDict = produtosEncontrados
            .Where(p => produtoIds.Contains(p.Id))
            .ToDictionary(p => p.Id);

        var erros = new List<string>();
        foreach (var id in produtoIds)
        {
            if (!produtosDict.TryGetValue(id, out var produto))
                erros.Add($"Produto {id} não encontrado.");
            else if (!produto.Ativo)
                erros.Add($"Produto '{produto.Nome}' está inativo.");
        }

        if (erros.Count > 0)
            throw new DomainException(string.Join(" | ", erros));

        // Cria VendaDiaria para cada item
        var novasVendas = request.Itens
            .Select(item => VendaDiaria.Criar(
                item.ProdutoId,
                request.DataVenda,
                item.Quantidade,
                _currentUser.UsuarioId))
            .ToList();

        await _vendas.AdicionarRangeAsync(novasVendas, cancellationToken);

        // Registra auditoria
        var importacao = ImportacaoVendas.Criar(
            request.NomeArquivo,
            request.Hash,
            request.PeriodoDe,
            request.PeriodoAte,
            request.TotalLinhasParseadas,
            totalImportadas: novasVendas.Count,
            request.TotalIgnoradas,
            request.TotalNaoEncontradas,
            _currentUser.UsuarioId);

        await _importacoes.AdicionarAsync(importacao, cancellationToken);

        // Um único SaveChanges — ambos os repositórios compartilham o mesmo DbContext
        await _vendas.SalvarAsync(cancellationToken);

        return new ResultadoImportacaoDto(
            novasVendas.Count,
            request.TotalIgnoradas,
            request.TotalNaoEncontradas);
    }
}
```

- [x] **Step 4: Build**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build"
```

Esperado: build bem-sucedido.

- [x] **Step 5: Commit**

```bash
git add src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/
git commit -m "feat: ConfirmarImportacao command validator and handler"
```

---

## Task 6: Infrastructure — Repositórios, EF Config, DI, AppDbContext

**Files:**
- Create: `src/CasaDiAna.Infrastructure/Repositories/ImportacaoVendasRepository.cs`
- Create: `src/CasaDiAna.Infrastructure/Persistence/Configurations/ImportacaoVendasConfiguration.cs`
- Modify: `src/CasaDiAna.Infrastructure/Repositories/VendaDiariaRepository.cs`
- Modify: `src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs`
- Modify: `src/CasaDiAna.Infrastructure/DependencyInjection.cs`

- [x] **Step 1: Criar ImportacaoVendasRepository**

Criar `src/CasaDiAna.Infrastructure/Repositories/ImportacaoVendasRepository.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class ImportacaoVendasRepository : IImportacaoVendasRepository
{
    private readonly AppDbContext _db;

    public ImportacaoVendasRepository(AppDbContext db) => _db = db;

    public Task<bool> HashExisteAsync(string hash, CancellationToken ct = default) =>
        _db.ImportacoesVendas.AnyAsync(i => i.HashConteudo == hash, ct);

    public async Task AdicionarAsync(ImportacaoVendas importacao, CancellationToken ct = default) =>
        await _db.ImportacoesVendas.AddAsync(importacao, ct);

    public async Task<IReadOnlyList<ImportacaoVendas>> ListarAsync(CancellationToken ct = default) =>
        await _db.ImportacoesVendas
            .OrderByDescending(i => i.CriadoEm)
            .ToListAsync(ct);
}
```

- [x] **Step 2: Criar ImportacaoVendasConfiguration**

Criar `src/CasaDiAna.Infrastructure/Persistence/Configurations/ImportacaoVendasConfiguration.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class ImportacaoVendasConfiguration : IEntityTypeConfiguration<ImportacaoVendas>
{
    public void Configure(EntityTypeBuilder<ImportacaoVendas> builder)
    {
        builder.ToTable("importacoes_vendas", "producao");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("id");
        builder.Property(i => i.NomeArquivo).HasColumnName("nome_arquivo").HasMaxLength(255).IsRequired();
        builder.Property(i => i.HashConteudo).HasColumnName("hash_conteudo").HasMaxLength(64).IsRequired();
        builder.HasIndex(i => i.HashConteudo).IsUnique();
        builder.Property(i => i.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(i => i.PeriodoDe).HasColumnName("periodo_de").HasMaxLength(10);
        builder.Property(i => i.PeriodoAte).HasColumnName("periodo_ate").HasMaxLength(10);
        builder.Property(i => i.TotalLinhasParseadas).HasColumnName("total_linhas_parseadas").IsRequired();
        builder.Property(i => i.TotalImportadas).HasColumnName("total_importadas").IsRequired();
        builder.Property(i => i.TotalIgnoradas).HasColumnName("total_ignoradas").IsRequired();
        builder.Property(i => i.TotalNaoEncontradas).HasColumnName("total_nao_encontradas").IsRequired();
        builder.Property(i => i.CriadoPor).HasColumnName("criado_por").IsRequired();
    }
}
```

- [x] **Step 3: Implementar AdicionarRangeAsync no VendaDiariaRepository**

Abrir `src/CasaDiAna.Infrastructure/Repositories/VendaDiariaRepository.cs` e adicionar o método:

```csharp
public async Task AdicionarRangeAsync(IEnumerable<VendaDiaria> vendas, CancellationToken ct = default) =>
    await _db.VendasDiarias.AddRangeAsync(vendas, ct);
```

O arquivo completo fica:

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class VendaDiariaRepository : IVendaDiariaRepository
{
    private readonly AppDbContext _db;

    public VendaDiariaRepository(AppDbContext db) => _db = db;

    public Task<VendaDiaria?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.VendasDiarias
            .Include(v => v.Produto)
            .FirstOrDefaultAsync(v => v.Id == id, ct);

    public async Task<IReadOnlyList<VendaDiaria>> ListarAsync(
        DateTime? de = null,
        DateTime? ate = null,
        Guid? produtoId = null,
        CancellationToken ct = default)
    {
        var query = _db.VendasDiarias
            .Include(v => v.Produto)
            .AsQueryable();

        if (de.HasValue)
            query = query.Where(v => v.Data >= de.Value);
        if (ate.HasValue)
            query = query.Where(v => v.Data <= ate.Value);
        if (produtoId.HasValue)
            query = query.Where(v => v.ProdutoId == produtoId.Value);

        return await query.OrderByDescending(v => v.Data).ThenBy(v => v.Produto!.Nome).ToListAsync(ct);
    }

    public async Task AdicionarAsync(VendaDiaria venda, CancellationToken ct = default) =>
        await _db.VendasDiarias.AddAsync(venda, ct);

    public async Task AdicionarRangeAsync(IEnumerable<VendaDiaria> vendas, CancellationToken ct = default) =>
        await _db.VendasDiarias.AddRangeAsync(vendas, ct);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
```

- [x] **Step 4: Adicionar DbSet<ImportacaoVendas> ao AppDbContext**

Abrir `src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs` e adicionar a propriedade após `VendasDiarias`:

```csharp
public DbSet<ImportacaoVendas> ImportacoesVendas => Set<ImportacaoVendas>();
```

- [x] **Step 5: Registrar no DependencyInjection.cs**

Abrir `src/CasaDiAna.Infrastructure/DependencyInjection.cs` e adicionar os registros após `IVendaDiariaRepository`:

```csharp
services.AddScoped<IImportacaoVendasRepository, ImportacaoVendasRepository>();
services.AddScoped<CasaDiAna.Application.ImportacaoVendas.Services.IPdfVendasParser, PdfVendasParser>();
```

O `using` para `Services` já está incluído no arquivo. Adicionar também:

```csharp
using CasaDiAna.Application.ImportacaoVendas.Services;
```

- [x] **Step 6: Build completo**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build"
```

Esperado: sem erros.

- [x] **Step 7: Commit**

```bash
git add src/CasaDiAna.Infrastructure/Repositories/ImportacaoVendasRepository.cs \
        src/CasaDiAna.Infrastructure/Repositories/VendaDiariaRepository.cs \
        src/CasaDiAna.Infrastructure/Persistence/Configurations/ImportacaoVendasConfiguration.cs \
        src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs \
        src/CasaDiAna.Infrastructure/DependencyInjection.cs
git commit -m "feat: infrastructure repositories, EF config, DI for importacao-vendas"
```

---

## Task 7: EF Core Migration

**Files:**
- Migration gerada automaticamente em `src/CasaDiAna.Infrastructure/Migrations/`

- [x] **Step 1: Parar a API se estiver rodando**

```bash
powershell.exe -Command "Stop-Process -Name 'CasaDiAna.API' -Force -ErrorAction SilentlyContinue; Start-Sleep 1"
```

- [x] **Step 2: Gerar a migration**

```bash
dotnet ef migrations add AdicionarImportacaoVendas \
  --project src/CasaDiAna.Infrastructure \
  --startup-project src/CasaDiAna.API
```

Esperado: dois arquivos criados em `Migrations/` (`.cs` + `.Designer.cs`) + `ModelSnapshot.cs` atualizado.

Verificar que o Up() gerado criou a tabela `importacoes_vendas` no schema `producao`:
```
migrationBuilder.CreateTable(name: "importacoes_vendas", schema: "producao", ...)
```

Se o EF gerou `CREATE TABLE importacoes_vendas` sem o schema `producao`, verificar `ImportacaoVendasConfiguration.cs`.

- [x] **Step 3: Aplicar a migration**

```bash
dotnet ef database update \
  --project src/CasaDiAna.Infrastructure \
  --startup-project src/CasaDiAna.API
```

Esperado: `Done.`

- [x] **Step 4: Commit**

```bash
git add src/CasaDiAna.Infrastructure/Migrations/
git commit -m "feat: migration AdicionarImportacaoVendas"
```

---

## Task 8: API Controller

**Files:**
- Create: `src/CasaDiAna.API/Controllers/ImportacaoVendasController.cs`

- [x] **Step 1: Criar ImportacaoVendasController**

Criar `src/CasaDiAna.API/Controllers/ImportacaoVendasController.cs`:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;
using CasaDiAna.Application.ImportacaoVendas.Commands.ProcessarPreview;
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Domain.Exceptions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/importacao-vendas")]
[Authorize]
public class ImportacaoVendasController : ControllerBase
{
    private readonly IMediator _mediator;

    public ImportacaoVendasController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// Faz upload do PDF, extrai linhas, casa com o catálogo e retorna preview para revisão.
    /// Não grava nenhum dado. Retorna 409 se o arquivo já foi importado.
    /// </summary>
    [HttpPost("preview")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<PreviewImportacaoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Preview(
        IFormFile arquivo,
        CancellationToken ct)
    {
        if (arquivo == null || arquivo.Length == 0)
            return BadRequest(ApiResponse<object>.Erro("Nenhum arquivo enviado."));

        if (!arquivo.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest(ApiResponse<object>.Erro("Somente arquivos PDF são aceitos."));

        if (arquivo.Length > 10 * 1024 * 1024) // 10 MB
            return BadRequest(ApiResponse<object>.Erro("Arquivo muito grande. Máximo: 10 MB."));

        await using var ms = new MemoryStream();
        await arquivo.CopyToAsync(ms, ct);

        var command = new ProcessarPreviewPdfVendasCommand(ms.ToArray(), arquivo.FileName);
        var resultado = await _mediator.Send(command, ct);
        return Ok(ApiResponse<PreviewImportacaoDto>.Ok(resultado));
    }

    /// <summary>
    /// Confirma a importação. Grava VendaDiaria para cada item aprovado + registro de auditoria.
    /// Retorna 409 se o hash já foi importado.
    /// </summary>
    [HttpPost("confirmar")]
    [ProducesResponseType(typeof(ApiResponse<ResultadoImportacaoDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Confirmar(
        [FromBody] ConfirmarImportacaoCommand command,
        CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ResultadoImportacaoDto>.Ok(resultado));
    }
}
```

> **Nota:** O `ExceptionHandlingMiddleware` existente já mapeia `DomainException` para HTTP 422. Para o erro de hash duplicado, o frontend deve verificar a mensagem de erro. Se quiser HTTP 409 específico para duplicatas, o middleware pode ser ajustado ou o controller pode fazer o try/catch explicitamente. Por simplicidade, o 422 da DomainException é aceitável.

- [x] **Step 2: Build + Rodar API**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build"
```

Esperado: sem erros.

- [x] **Step 3: Testar preview via curl**

Com a API rodando (`dotnet run --project src/CasaDiAna.API`), fazer login e testar:

```bash
# Login
TOKEN=$(curl -s http://localhost:5130/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@casadiana.com","senha":"Admin@123"}' | jq -r '.dados.token')

# Preview com PDF real
curl -s http://localhost:5130/api/importacao-vendas/preview \
  -H "Authorization: Bearer $TOKEN" \
  -F "arquivo=@caminho/para/relatorio.pdf"
```

Esperado: JSON com `sucesso: true` e objeto `dados` com `itens` e contagens.

- [x] **Step 4: Commit**

```bash
git add src/CasaDiAna.API/Controllers/ImportacaoVendasController.cs
git commit -m "feat: ImportacaoVendasController with preview and confirmar endpoints"
```

---

## Task 9: Frontend — Types, Service e Page

**Files:**
- Create: `frontend/src/types/importacao.ts`
- Create: `frontend/src/features/producao/importacao-vendas/services/importacaoVendasService.ts`
- Create: `frontend/src/features/producao/importacao-vendas/pages/ImportacaoVendasPage.tsx`

- [x] **Step 1: Criar tipos**

Criar `frontend/src/types/importacao.ts`:

```typescript
export type StatusImportacao = 'matched' | 'unmatched' | 'ambiguous' | 'ignored'

export interface SugestaoMatch {
  produtoId: string
  produtoNome: string
}

export interface ItemPreview {
  codigoExterno: string | null
  nomeRelatorio: string
  grupo: string | null
  quantidade: number
  valorTotal: number
  status: StatusImportacao
  produtoId: string | null
  produtoNome: string | null
  sugestoes: SugestaoMatch[]
}

export interface PreviewImportacao {
  hash: string
  periodoDe: string | null
  periodoAte: string | null
  totalLinhasParseadas: number
  totalMatched: number
  totalAmbiguous: number
  totalUnmatched: number
  totalIgnored: number
  itens: ItemPreview[]
}

export interface ItemConfirmar {
  produtoId: string
  quantidade: number
}

export interface ConfirmarImportacaoInput {
  hash: string
  nomeArquivo: string
  dataVenda: string
  periodoDe: string | null
  periodoAte: string | null
  totalLinhasParseadas: number
  totalIgnoradas: number
  totalNaoEncontradas: number
  itens: ItemConfirmar[]
}

export interface ResultadoImportacao {
  totalImportadas: number
  totalIgnoradas: number
  totalNaoEncontradas: number
}
```

- [x] **Step 2: Criar service**

Criar `frontend/src/features/producao/importacao-vendas/services/importacaoVendasService.ts`:

```typescript
import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type {
  PreviewImportacao,
  ConfirmarImportacaoInput,
  ResultadoImportacao,
} from '@/types/importacao'

export const importacaoVendasService = {
  preview: async (arquivo: File): Promise<PreviewImportacao> => {
    const form = new FormData()
    form.append('arquivo', arquivo)
    const resp = await api.post<ApiResponse<PreviewImportacao>>(
      '/importacao-vendas/preview',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return resp.data.dados!
  },

  confirmar: async (input: ConfirmarImportacaoInput): Promise<ResultadoImportacao> => {
    const resp = await api.post<ApiResponse<ResultadoImportacao>>(
      '/importacao-vendas/confirmar',
      input
    )
    return resp.data.dados!
  },
}
```

- [x] **Step 3: Criar ImportacaoVendasPage**

Criar `frontend/src/features/producao/importacao-vendas/pages/ImportacaoVendasPage.tsx`:

```tsx
import { useRef, useState } from 'react'
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'
import { importacaoVendasService } from '../services/importacaoVendasService'
import type {
  PreviewImportacao,
  ItemPreview,
  ResultadoImportacao,
  StatusImportacao,
} from '@/types/importacao'

type Etapa = 'upload' | 'processando' | 'preview' | 'confirmando' | 'resultado'

const STATUS_CFG: Record<StatusImportacao, {
  label: string
  cor: string
  bg: string
  border: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}> = {
  matched:   { label: 'Encontrado',    cor: '#15803D', bg: 'var(--ada-success-bg)',  border: 'var(--ada-success-border)', Icon: CheckCircleIcon },
  ambiguous: { label: 'Ambíguo',       cor: '#B45309', bg: 'var(--ada-warning-bg)',  border: 'var(--ada-warning-border)', Icon: QuestionMarkCircleIcon },
  unmatched: { label: 'Não encontrado',cor: '#DC2626', bg: 'var(--ada-error-bg)',    border: 'var(--ada-error-border)',   Icon: XCircleIcon },
  ignored:   { label: 'Ignorado',      cor: 'var(--ada-muted)', bg: 'var(--ada-surface-2)', border: 'var(--ada-border)', Icon: EyeSlashIcon },
}

export function ImportacaoVendasPage() {
  const [etapa, setEtapa] = useState<Etapa>('upload')
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewImportacao | null>(null)
  const [dataVenda, setDataVenda] = useState(new Date().toISOString().split('T')[0])
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null)
  // Map: nomeRelatorio → produtoId selecionado (resolve ambíguos)
  const [resolucoes, setResolucoes] = useState<Record<string, string>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  const handleArquivo = (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      setErro('Somente arquivos PDF são aceitos.')
      return
    }
    setArquivoSelecionado(file)
    setErro(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleArquivo(file)
  }

  const processarPdf = async () => {
    if (!arquivoSelecionado) return
    setEtapa('processando')
    setErro(null)
    try {
      const data = await importacaoVendasService.preview(arquivoSelecionado)
      setPreview(data)
      setEtapa('preview')
    } catch (e: any) {
      const msg = e?.response?.data?.erros?.[0] ?? 'Erro ao processar o PDF.'
      setErro(msg)
      setEtapa('upload')
    }
  }

  const confirmar = async () => {
    if (!preview || !arquivoSelecionado) return
    setEtapa('confirmando')
    setErro(null)

    // Monta itens: matched diretos + ambíguos resolvidos pelo usuário
    const itens = preview.itens
      .filter(i => {
        if (i.status === 'matched') return true
        if (i.status === 'ambiguous') return !!resolucoes[i.nomeRelatorio]
        return false
      })
      .map(i => ({
        produtoId: i.status === 'ambiguous'
          ? resolucoes[i.nomeRelatorio]
          : i.produtoId!,
        quantidade: i.quantidade,
      }))

    try {
      const res = await importacaoVendasService.confirmar({
        hash: preview.hash,
        nomeArquivo: arquivoSelecionado.name,
        dataVenda,
        periodoDe: preview.periodoDe,
        periodoAte: preview.periodoAte,
        totalLinhasParseadas: preview.totalLinhasParseadas,
        totalIgnoradas: preview.totalIgnored,
        totalNaoEncontradas: preview.totalUnmatched,
        itens,
      })
      setResultado(res)
      setEtapa('resultado')
    } catch (e: any) {
      const msg = e?.response?.data?.erros?.[0] ?? 'Erro ao confirmar importação.'
      setErro(msg)
      setEtapa('preview')
    }
  }

  const reiniciar = () => {
    setEtapa('upload')
    setArquivoSelecionado(null)
    setPreview(null)
    setResultado(null)
    setResolucoes({})
    setErro(null)
  }

  return (
    <div className="ada-page space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          Importar Vendas via PDF
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--ada-muted)' }}>
          Importe o relatório "Movimentação de Produtos - Sintético" do PDV para lançar vendas em lote.
        </p>
      </div>

      {/* Erro global */}
      {erro && (
        <div
          className="rounded-lg px-4 py-3 text-sm flex items-start gap-2"
          style={{ background: 'var(--ada-error-bg)', border: '1px solid var(--ada-error-border)', color: '#DC2626' }}
        >
          <XCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      {/* ── Etapa: Upload ── */}
      {etapa === 'upload' && (
        <div
          className="rounded-xl border p-6 space-y-4"
          style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}
        >
          {/* Drop zone */}
          <div
            className="rounded-xl border-2 border-dashed p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors"
            style={{ borderColor: 'var(--ada-border)', background: 'var(--ada-bg)' }}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
          >
            <ArrowUpTrayIcon className="h-10 w-10" style={{ color: 'var(--ada-placeholder)' }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--ada-heading)' }}>
                {arquivoSelecionado ? arquivoSelecionado.name : 'Clique ou arraste o PDF aqui'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>
                Apenas arquivos PDF · Máximo 10 MB
              </p>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleArquivo(e.target.files[0]) }}
          />

          <button
            onClick={processarPdf}
            disabled={!arquivoSelecionado}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: 'var(--sb-accent)' }}
          >
            Processar PDF
          </button>
        </div>
      )}

      {/* ── Etapa: Processando ── */}
      {etapa === 'processando' && (
        <div
          className="rounded-xl border p-12 flex flex-col items-center gap-3"
          style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}
        >
          <div
            className="h-8 w-8 animate-spin rounded-full"
            style={{ border: '3px solid var(--ada-border-sub)', borderTopColor: '#C4870A' }}
          />
          <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Extraindo e casando produtos…</p>
        </div>
      )}

      {/* ── Etapa: Preview ── */}
      {(etapa === 'preview' || etapa === 'confirmando') && preview && (
        <div className="space-y-6">
          {/* Sumário */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Encontrados',     value: preview.totalMatched,   cor: '#15803D', bg: 'var(--ada-success-bg)' },
              { label: 'Ambíguos',        value: preview.totalAmbiguous, cor: '#B45309', bg: 'var(--ada-warning-bg)' },
              { label: 'Não encontrados', value: preview.totalUnmatched, cor: '#DC2626', bg: 'var(--ada-error-bg)' },
              { label: 'Ignorados',       value: preview.totalIgnored,   cor: 'var(--ada-muted)', bg: 'var(--ada-surface-2)' },
            ].map(c => (
              <div
                key={c.label}
                className="rounded-xl p-4 flex flex-col gap-1"
                style={{ background: c.bg, border: `1px solid var(--ada-border)` }}
              >
                <span className="text-2xl font-bold" style={{ color: c.cor }}>{c.value}</span>
                <span className="text-xs" style={{ color: 'var(--ada-muted)' }}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Tabela de itens */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}
          >
            <div
              className="px-4 py-3 border-b"
              style={{ borderColor: 'var(--ada-border)', background: 'var(--ada-surface-2)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                {preview.totalLinhasParseadas} linhas parseadas
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--ada-border)', background: 'var(--ada-surface-2)' }}>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--ada-muted)' }}>Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--ada-muted)' }}>Grupo</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--ada-muted)' }}>Nome no Relatório</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--ada-muted)' }}>Produto no Sistema</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: 'var(--ada-muted)' }}>Qtd.</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.itens.map((item, idx) => (
                    <PreviewRow
                      key={idx}
                      item={item}
                      resolucao={resolucoes[item.nomeRelatorio] ?? ''}
                      onResolucao={pid =>
                        setResolucoes(prev => ({ ...prev, [item.nomeRelatorio]: pid }))
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data de venda + botões */}
          <div
            className="rounded-xl border p-5 flex flex-col sm:flex-row sm:items-end gap-4"
            style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}
          >
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-text)' }}>
                Data dos lançamentos
              </label>
              <input
                type="date"
                value={dataVenda}
                onChange={e => setDataVenda(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm border outline-none"
                style={{
                  background: 'var(--ada-bg)',
                  borderColor: 'var(--ada-border)',
                  color: 'var(--ada-text)',
                }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>
                Todos os itens importados usarão esta data.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={reiniciar}
                className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                style={{
                  borderColor: 'var(--ada-border)',
                  color: 'var(--ada-text)',
                  background: 'var(--ada-bg)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                disabled={etapa === 'confirmando' || preview.totalMatched === 0}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: 'var(--sb-accent)' }}
              >
                {etapa === 'confirmando' ? 'Importando…' : `Confirmar ${preview.totalMatched + Object.keys(resolucoes).length} vendas`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Etapa: Resultado ── */}
      {etapa === 'resultado' && resultado && (
        <div
          className="rounded-xl border p-8 flex flex-col items-center gap-4 text-center"
          style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'var(--ada-success-bg)' }}
          >
            <CheckCircleIcon className="h-8 w-8" style={{ color: '#15803D' }} />
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}>
              Importação concluída!
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--ada-muted)' }}>
              <strong style={{ color: 'var(--ada-body)' }}>{resultado.totalImportadas}</strong> vendas importadas ·{' '}
              <strong style={{ color: 'var(--ada-body)' }}>{resultado.totalIgnoradas}</strong> ignoradas ·{' '}
              <strong style={{ color: 'var(--ada-body)' }}>{resultado.totalNaoEncontradas}</strong> não encontradas
            </p>
          </div>
          <button
            onClick={reiniciar}
            className="mt-2 px-5 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'var(--sb-accent)' }}
          >
            Nova Importação
          </button>
        </div>
      )}
    </div>
  )
}

// ── Linha individual do preview ──────────────────────────────────────────────
function PreviewRow({
  item,
  resolucao,
  onResolucao,
}: {
  item: ItemPreview
  resolucao: string
  onResolucao: (pid: string) => void
}) {
  const cfg = STATUS_CFG[item.status]
  const { Icon } = cfg

  return (
    <tr style={{ borderBottom: '1px solid var(--ada-border-sub)' }}>
      <td className="px-4 py-2.5">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.cor }}
        >
          <Icon className="h-3 w-3" />
          {cfg.label}
        </span>
      </td>
      <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--ada-muted)' }}>
        {item.grupo ?? '—'}
      </td>
      <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--ada-body)' }}>
        {item.codigoExterno && (
          <span className="mr-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--ada-surface-2)', color: 'var(--ada-muted)' }}>
            {item.codigoExterno}
          </span>
        )}
        {item.nomeRelatorio}
      </td>
      <td className="px-4 py-2.5 text-xs">
        {item.status === 'matched' && (
          <span style={{ color: '#15803D' }}>{item.produtoNome}</span>
        )}
        {item.status === 'ambiguous' && (
          <select
            value={resolucao}
            onChange={e => onResolucao(e.target.value)}
            className="rounded-lg px-2 py-1 text-xs border outline-none"
            style={{
              background: 'var(--ada-bg)',
              borderColor: 'var(--ada-warning-border)',
              color: 'var(--ada-text)',
            }}
          >
            <option value="">Selecione o produto…</option>
            {item.sugestoes.map(s => (
              <option key={s.produtoId} value={s.produtoId}>{s.produtoNome}</option>
            ))}
          </select>
        )}
        {item.status === 'unmatched' && (
          <span style={{ color: 'var(--ada-muted)' }}>—</span>
        )}
        {item.status === 'ignored' && (
          <span style={{ color: 'var(--ada-muted)', fontStyle: 'italic' }}>item ignorado</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-right text-xs font-mono" style={{ color: 'var(--ada-body)' }}>
        {item.quantidade.toLocaleString('pt-BR')}
      </td>
    </tr>
  )
}
```

- [x] **Step 4: TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```

Esperado: sem erros.

- [x] **Step 5: Commit**

```bash
git add frontend/src/types/importacao.ts \
        frontend/src/features/producao/importacao-vendas/
git commit -m "feat: frontend types, service and ImportacaoVendasPage"
```

---

## Task 10: Wiring — Rota + Sidebar

**Files:**
- Modify: `frontend/src/routes/AppRoutes.tsx`
- Modify: `frontend/src/components/layout/Sidebar.tsx`

- [x] **Step 1: Adicionar rota em AppRoutes.tsx**

Adicionar o import no bloco de imports:

```tsx
import { ImportacaoVendasPage } from '@/features/producao/importacao-vendas/pages/ImportacaoVendasPage'
```

Adicionar a rota dentro do `<Route element={<MainLayout />}>`, perto das outras rotas de produção:

```tsx
<Route path="/producao/importacao-vendas" element={<ImportacaoVendasPage />} />
```

- [x] **Step 2: Adicionar item na Sidebar**

Abrir `frontend/src/components/layout/Sidebar.tsx`.

No array `grupos`, dentro do grupo `'Produção'`, adicionar após o item `'Etiquetas'`:

```typescript
{ label: 'Importar Vendas', href: '/producao/importacao-vendas', icon: ArrowUpTrayIcon, iconColor: '#D4960C' },
```

Adicionar `ArrowUpTrayIcon` no import do heroicons (já deve existir ou adicionar):

```typescript
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'
```

- [x] **Step 3: TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```

Esperado: sem erros.

- [x] **Step 4: Build final**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build"
cd frontend && npm run build
```

Esperado: ambos sem erros.

- [x] **Step 5: Commit final**

```bash
git add frontend/src/routes/AppRoutes.tsx \
        frontend/src/components/layout/Sidebar.tsx
git commit -m "feat: wire importacao-vendas route and sidebar nav item"
```

---

## Fluxo Completo de Importação

```
Usuário                      Frontend                    Backend
  │                             │                            │
  ├─ seleciona PDF ────────────>│                            │
  ├─ clica "Processar" ────────>│ POST /preview (multipart) >│
  │                             │                            ├─ PdfPig extrai texto
  │                             │                            ├─ ParseLines (regex)
  │                             │                            ├─ Verifica hash duplicado
  │                             │                            ├─ Match com catálogo
  │                             │<─── PreviewImportacaoDto ──┤
  ├─ review tabela ────────────>│                            │
  ├─ resolve ambíguos ─────────>│ (state local)              │
  ├─ seleciona data ───────────>│ (state local)              │
  ├─ clica "Confirmar" ────────>│ POST /confirmar (JSON) ───>│
  │                             │                            ├─ Verifica hash (dupla)
  │                             │                            ├─ Valida produtos ativos
  │                             │                            ├─ VendaDiaria.Criar() x N
  │                             │                            ├─ ImportacaoVendas.Criar()
  │                             │                            ├─ SaveChangesAsync (1x)
  │                             │<─── ResultadoImportacaoDto ┤
  ├─ vê resumo ────────────────>│                            │
```

## Suposições e Limitações

1. **Formato do PDF**: O parser espera o formato "Movimentação de Produtos - Sintético" com seções em maiúsculas, colunas separadas por múltiplos espaços, e números em formato BR (1.234,56). Se o PDF real tiver formato diferente, ajustar `TryParseProdutoLine` e os regexes de seção/total.

2. **Data dos lançamentos**: O relatório sintético agrega um período. O usuário escolhe uma data única para todos os lançamentos. Para relatórios diários, basta selecionar o dia correto.

3. **Sem alias/sinônimos**: O match usa apenas o nome normalizado do produto. Se nomes do PDV divergem muito do sistema, marcar manualmente no sistema um produto cujo nome inclua o nome do relatório, ou ajustar o nome do produto no sistema para coincidir.

4. **Itens ignorados**: Lista estática em `PdfVendasParser._ignorados`. Para adicionar novos itens, editar o código. Uma tela de configuração de itens ignorados pode ser adicionada futuramente.

5. **Sem rollback parcial**: Se o `SaveChangesAsync` falhar no meio, nenhuma venda é gravada (transação atômica do EF Core). O usuário pode re-confirmar com o mesmo PDF (o hash só é gravado se o save completar).

---

## Self-Review — Spec Coverage

| Requisito | Task |
|---|---|
| Upload PDF | Task 8 (controller), Task 9 (frontend) |
| Extração texto PDF | Task 3 (PdfVendasParser) |
| Parse linhas do relatório | Task 3 |
| Normalização e match de nomes | Task 4 (handler) |
| Status: matched/unmatched/ambiguous/ignored | Task 2 (enum + DTOs) |
| Preview antes da confirmação | Task 4, Task 8, Task 9 |
| Confirmação em batch | Task 5, Task 8 |
| Proteção contra duplicatas (hash) | Task 1, Task 4, Task 5 |
| Auditoria (histórico de importações) | Task 1, Task 5, Task 6 |
| Frontend upload + preview + confirm + resultado | Task 9 |
| UX: matched/failed/needs review/ignored | Task 9 (badges e dropdown) |
| Sem auto-criação de produtos | Task 4 (apenas match, sem create) |
| Sugestões fuzzy para ambíguos | Task 4 (match parcial + lista) |
| Arquitetura CQRS existente | Todas as tasks |
| Testes | Tasks 3, 4 |
