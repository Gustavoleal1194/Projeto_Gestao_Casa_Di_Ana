# Confirmação da Importação Recalculada no Servidor — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O servidor passa a calcular hash, quantidades, totais de repasse, período e contagens da importação a partir do próprio CSV; a tela envia só o arquivo, a data de venda, o produto de cada linha e as linhas removidas.

**Architecture:** Um `LeitorRelatorioVendas` (Application) concentra parse + classificação de repasse e é usado pela prévia e pela confirmação. O `confirmar` vira `multipart/form-data` com `arquivo`, `dataVenda`, `vinculos[]` e `linhasRemovidas[]`; o handler relê o CSV e aplica as decisões. O frontend monta o `FormData` com o arquivo já guardado.

**Tech Stack:** ASP.NET Core 8, MediatR, FluentValidation, xUnit + Moq + FluentAssertions; React 18 + TypeScript.

**Spec:** `CasaDiAna/docs/superpowers/specs/2026-10-11-confirmacao-importacao-recalculada-servidor-design.md`

Todos os caminhos abaixo são relativos a `CasaDiAna/`.

## Global Constraints

- Todo texto (mensagens, testes, commits) em **português do Brasil**.
- Backend: `dotnet build src/CasaDiAna.API`; testes: `dotnet test tests/CasaDiAna.Application.Tests`.
- Erros de regra de negócio via `DomainException` (422); respostas via `ApiResponse<T>`.
- Frontend: `npx tsc -b --noEmit` dentro de `frontend/`; cores só via `var(--ada-*)`.
- Zero duplicação: validação de arquivo do controller num helper usado pelos dois endpoints; leitura/classificação do CSV só no `LeitorRelatorioVendas`.
- Comparação de `nomeRelatorio` é **exata** (ordinal), contra `LinhaRelatorio.Nome`.
- Mensagens mantidas literalmente: `"Este arquivo já foi importado anteriormente."`, `"Nenhum item ou repasse confirmado para importação."`, `"Nenhuma linha foi encontrada no CSV. Verifique se o arquivo é um relatório válido."`.

## Review Focus

1. **Linha casada pela criação de produto com nome diferente** ("Adicionar" renomeado) → a tela envia vínculo com o `produtoId` novo e a venda é criada. Teste no Task 2 (vínculo para linha que o servidor não casaria).
2. **Mesmo nome aparecendo duas vezes no CSV** → as duas linhas recebem a mesma decisão (duas vendas do mesmo produto, ou ambas removidas). Teste no Task 2.
3. **Tela tenta burlar o hash** → impossível: o hash vem do CSV; teste de CSV já importado no Task 2.
4. **Remover linha de repasse** → fora do total gravado. Teste no Task 2.
5. **Trocar a data de venda depois da prévia** → a data enviada vale (não há data no CSV). Coberto pelo teste de gravação no Task 2.

---

### Task 1: `LeitorRelatorioVendas` e prévia usando o leitor

**Files:**
- Create: `src/CasaDiAna.Application/ImportacaoVendas/Services/LeitorRelatorioVendas.cs`
- Modify: `src/CasaDiAna.Application/ImportacaoVendas/Commands/ProcessarPreview/ProcessarPreviewVendasCommandHandler.cs`
- Modify: `src/CasaDiAna.Infrastructure/DependencyInjection.cs` (ao lado de `IVendasParser`, ~linha 47)
- Test: `tests/CasaDiAna.Application.Tests/ImportacaoVendas/LeitorRelatorioVendasTests.cs`
- Test: `tests/CasaDiAna.Application.Tests/ImportacaoVendas/ProcessarPreviewHandlerTests.cs`

**Interfaces:**
- Produces:
  - `public class LeitorRelatorioVendas { public LeitorRelatorioVendas(IVendasParser parser); public RelatorioVendas Ler(byte[] csv); }`
  - `public record RelatorioVendas(string Hash, string? PeriodoDe, string? PeriodoAte, IReadOnlyList<LinhaClassificada> Linhas);`
  - `public record LinhaClassificada(LinhaRelatorio Linha, TipoRepasse? TipoRepasse);`
  - Namespace: `CasaDiAna.Application.ImportacaoVendas.Services`.
  - `ProcessarPreviewVendasCommandHandler(LeitorRelatorioVendas leitor, IProdutoRepository produtos, IImportacaoVendasRepository importacoes)`.

- [ ] **Step 1: Escrever os testes do leitor**

`tests/CasaDiAna.Application.Tests/ImportacaoVendas/LeitorRelatorioVendasTests.cs`:

```csharp
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Application.ImportacaoVendas.Services;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class LeitorRelatorioVendasTests
{
    private readonly Mock<IVendasParser> _parser = new();

    private LeitorRelatorioVendas Criar() => new(_parser.Object);

    [Fact]
    public void Ler_DeveRepassarHashPeriodoEClassificarRepasses()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new VendasParseResult("01/06/2026", "30/06/2026", "hash1", new List<LinhaRelatorio>
               {
                   new("001", "Croissant", null, 10m, 100m),
                   new("77", "TAXA DE SERVIÇO", null, 1m, 90m),
                   new("50", "Entrega longe", null, 2m, 20m),
               }));

        var relatorio = Criar().Ler([1, 2, 3]);

        relatorio.Hash.Should().Be("hash1");
        relatorio.PeriodoDe.Should().Be("01/06/2026");
        relatorio.PeriodoAte.Should().Be("30/06/2026");
        relatorio.Linhas.Select(l => l.TipoRepasse).Should().Equal(
            null, TipoRepasse.TaxaServico, TipoRepasse.Entrega);
        relatorio.Linhas[0].Linha.Nome.Should().Be("Croissant");
    }

    [Fact]
    public void Ler_SemLinhas_LancaDomainException()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new VendasParseResult(null, null, "h", new List<LinhaRelatorio>()));

        var act = () => Criar().Ler([1]);

        act.Should().Throw<DomainException>().WithMessage("Nenhuma linha*");
    }

    [Fact]
    public void Ler_ParserFalha_LancaDomainExceptionComMotivo()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>())).Throws(new FormatException("coluna ausente"));

        var act = () => Criar().Ler([1]);

        act.Should().Throw<DomainException>()
           .WithMessage("Falha ao processar o arquivo CSV: coluna ausente");
    }
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter LeitorRelatorioVendasTests`
Expected: erro de compilação (`LeitorRelatorioVendas` inexistente).

- [ ] **Step 3: Implementar o leitor**

`src/CasaDiAna.Application/ImportacaoVendas/Services/LeitorRelatorioVendas.cs`:

```csharp
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Application.ImportacaoVendas.Services;

public record LinhaClassificada(LinhaRelatorio Linha, TipoRepasse? TipoRepasse);

public record RelatorioVendas(
    string Hash,
    string? PeriodoDe,
    string? PeriodoAte,
    IReadOnlyList<LinhaClassificada> Linhas);

/// <summary>
/// Lê o CSV de vendas e classifica cada linha. Fonte única para a prévia e
/// para a confirmação: o servidor nunca confia em valores vindos da tela.
/// </summary>
public class LeitorRelatorioVendas
{
    private readonly IVendasParser _parser;

    public LeitorRelatorioVendas(IVendasParser parser) => _parser = parser;

    public RelatorioVendas Ler(byte[] csv)
    {
        VendasParseResult resultado;
        try
        {
            resultado = _parser.Parse(csv);
        }
        catch (Exception ex)
        {
            throw new DomainException($"Falha ao processar o arquivo CSV: {ex.Message}");
        }

        if (resultado.Linhas.Count == 0)
            throw new DomainException("Nenhuma linha foi encontrada no CSV. Verifique se o arquivo é um relatório válido.");

        var linhas = resultado.Linhas
            .Select(l => new LinhaClassificada(l, ClassificadorLinhaVenda.ClassificarRepasse(l.Nome)))
            .ToList()
            .AsReadOnly();

        return new RelatorioVendas(resultado.Hash, resultado.PeriodoDe, resultado.PeriodoAte, linhas);
    }
}
```

- [ ] **Step 4: Rodar os testes do leitor**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter LeitorRelatorioVendasTests`
Expected: 3 PASS.

- [ ] **Step 5: Prévia passa a usar o leitor**

Em `ProcessarPreviewVendasCommandHandler.cs`:
- Trocar o campo/parâmetro `IVendasParser _parser` por `LeitorRelatorioVendas _leitor` (mesma posição no construtor).
- O início de `Handle` vira:

```csharp
        var relatorio = _leitor.Ler(request.CsvBytes);

        if (await _importacoes.HashExisteAsync(relatorio.Hash, cancellationToken))
            throw new DomainException("Este arquivo já foi importado anteriormente.");

        var todosProdutos = await _produtos.ListarAsync(apenasAtivos: false, cancellationToken);
        var produtosAtivos = todosProdutos.Where(p => p.Ativo).ToList();

        var itens = relatorio.Linhas
            .Select(l => l.TipoRepasse is { } tipo
                ? Repasse(l.Linha, tipo)
                : Match(l.Linha, produtosAtivos))
            .ToList();
```

- No `return new PreviewImportacaoDto(...)`, trocar `parseResult.Hash/PeriodoDe/PeriodoAte/Linhas.Count` por `relatorio.Hash`, `relatorio.PeriodoDe`, `relatorio.PeriodoAte`, `relatorio.Linhas.Count`.
- Em `Match`, remover as 3 primeiras linhas (a chamada a `ClassificadorLinhaVenda` e o `return Repasse(...)`): a classificação agora vem do leitor.
- Remover o `try/catch` do parse e a checagem de `Linhas.Count == 0` (estão no leitor).

- [ ] **Step 6: Registrar o leitor na DI**

Em `src/CasaDiAna.Infrastructure/DependencyInjection.cs`, logo abaixo de `services.AddScoped<IVendasParser, CsvVendasParser>();`:

```csharp
        services.AddScoped<LeitorRelatorioVendas>();
```

(o `using CasaDiAna.Application.ImportacaoVendas.Services;` já existe por causa do `IVendasParser`; conferir).

- [ ] **Step 7: Ajustar os testes da prévia**

Em `ProcessarPreviewHandlerTests.cs`, `CreateHandler()` vira:

```csharp
    private ProcessarPreviewVendasCommandHandler CreateHandler() =>
        new(new LeitorRelatorioVendas(_parser.Object), _produtos.Object, _importacoes.Object);
```

Os demais testes ficam como estão (o leitor real roda sobre o parser mockado).

- [ ] **Step 8: Suíte completa e commit**

Run: `dotnet build src/CasaDiAna.API && dotnet test tests/CasaDiAna.Application.Tests`
Expected: build OK; todos PASS.

```bash
git add src/CasaDiAna.Application/ImportacaoVendas src/CasaDiAna.Infrastructure/DependencyInjection.cs tests/CasaDiAna.Application.Tests/ImportacaoVendas
git commit -m "refactor(importacao): leitor único de relatório de vendas para prévia e confirmação"
```

---

### Task 2: Confirmação recalculada no servidor (comando, handler, validator, controller)

**Files:**
- Create: `src/CasaDiAna.Application/ImportacaoVendas/Dtos/VinculoLinhaDto.cs`
- Delete: `src/CasaDiAna.Application/ImportacaoVendas/Dtos/ItemConfirmarDto.cs`
- Modify: `src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/ConfirmarImportacaoCommand.cs`
- Modify: `src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/ConfirmarImportacaoCommandHandler.cs`
- Modify: `src/CasaDiAna.Application/ImportacaoVendas/Commands/ConfirmarImportacao/ConfirmarImportacaoCommandValidator.cs`
- Create: `src/CasaDiAna.API/Controllers/ConfirmarImportacaoForm.cs`
- Modify: `src/CasaDiAna.API/Controllers/ImportacaoVendasController.cs`
- Test: `tests/CasaDiAna.Application.Tests/ImportacaoVendas/ConfirmarImportacaoCommandHandlerTests.cs` (reescrito)
- Test: `tests/CasaDiAna.Application.Tests/ImportacaoVendas/ConfirmarImportacaoCommandValidatorTests.cs` (reescrito)

**Interfaces:**
- Consumes: `LeitorRelatorioVendas`, `RelatorioVendas`, `LinhaClassificada` (Task 1).
- Produces:
  - `public record VinculoLinhaDto(string NomeRelatorio, Guid ProdutoId);` (namespace `...ImportacaoVendas.Dtos`)
  - `public record ConfirmarImportacaoCommand(byte[] CsvBytes, string NomeArquivo, DateTime DataVenda, IReadOnlyList<VinculoLinhaDto> Vinculos, IReadOnlyList<string> LinhasRemovidas) : IRequest<ResultadoImportacaoDto>;`
  - Handler: `ConfirmarImportacaoCommandHandler(LeitorRelatorioVendas leitor, IVendaDiariaRepository vendas, IProdutoRepository produtos, IImportacaoVendasRepository importacoes, IConfiguracaoRepasseRepository configuracaoRepasse, ICurrentUserService currentUser)`.
  - HTTP: `POST /api/importacao-vendas/confirmar`, `multipart/form-data`, campos `arquivo`, `dataVenda`, `vinculos[i].nomeRelatorio`, `vinculos[i].produtoId`, `linhasRemovidas[i]`. Resposta 201 `ApiResponse<ResultadoImportacaoDto>` (inalterado).

- [ ] **Step 1: Reescrever os testes do handler**

`tests/CasaDiAna.Application.Tests/ImportacaoVendas/ConfirmarImportacaoCommandHandlerTests.cs` (substitui o arquivo inteiro):

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Application.ImportacaoVendas.Services;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;
using EntidadeImportacao = CasaDiAna.Domain.Entities.ImportacaoVendas;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class ConfirmarImportacaoCommandHandlerTests
{
    private static readonly DateTime DataVenda = new(2026, 6, 10);

    private readonly Mock<IVendasParser> _parser = new();
    private readonly Mock<IVendaDiariaRepository> _vendas = new();
    private readonly Mock<IProdutoRepository> _produtos = new();
    private readonly Mock<IImportacaoVendasRepository> _importacoes = new();
    private readonly Mock<IConfiguracaoRepasseRepository> _configRepasse = new();
    private readonly Mock<ICurrentUserService> _user = new();
    private readonly List<Produto> _catalogo = new();
    private EntidadeImportacao? _gravada;
    private List<VendaDiaria> _vendasGravadas = new();

    private readonly Produto _croissant;
    private readonly Produto _bolo;

    public ConfirmarImportacaoCommandHandlerTests()
    {
        _croissant = CriarProduto("Croissant");
        _bolo = CriarProduto("Bolo de cenoura");
        _catalogo.AddRange([_croissant, _bolo]);

        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _importacoes.Setup(r => r.HashExisteAsync(It.IsAny<string>(), default)).ReturnsAsync(false);
        _importacoes.Setup(r => r.AdicionarAsync(It.IsAny<EntidadeImportacao>(), default))
                    .Callback<EntidadeImportacao, CancellationToken>((i, _) => _gravada = i)
                    .Returns(Task.CompletedTask);
        _vendas.Setup(r => r.AdicionarRangeAsync(It.IsAny<IEnumerable<VendaDiaria>>(), default))
               .Callback<IEnumerable<VendaDiaria>, CancellationToken>((v, _) => _vendasGravadas = v.ToList())
               .Returns(Task.CompletedTask);
        _vendas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _produtos.Setup(r => r.ListarAsync(false, default)).ReturnsAsync(_catalogo);
        _configRepasse.Setup(r => r.ObterAsync(default)).ReturnsAsync((ConfiguracaoRepasse?)null);

        CsvCom(
            new("001", "Croissant", null, 10m, 100m),
            new("002", "Bolo Cenoura", null, 3m, 60m),
            new("77", "TAXA DE SERVIÇO", null, 1m, 90m),
            new("50", "Entrega longe", null, 2m, 20m));
    }

    private void CsvCom(params LinhaRelatorio[] linhas) =>
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new VendasParseResult("01/06/2026", "30/06/2026", "hash-real", linhas.ToList()));

    private ConfirmarImportacaoCommandHandler Criar() =>
        new(new LeitorRelatorioVendas(_parser.Object), _vendas.Object, _produtos.Object,
            _importacoes.Object, _configRepasse.Object, _user.Object);

    private static ConfirmarImportacaoCommand Command(
        IReadOnlyList<VinculoLinhaDto>? vinculos = null,
        IReadOnlyList<string>? removidas = null) =>
        new([1, 2, 3], "vendas.csv", DataVenda, vinculos ?? [], removidas ?? []);

    private VinculoLinhaDto Vinculo(string nome, Produto produto) => new(nome, produto.Id);

    [Fact]
    public async Task DeveUsarQuantidadesETotaisDoCsv()
    {
        var resultado = await Criar().Handle(
            Command([Vinculo("Croissant", _croissant)]), CancellationToken.None);

        _vendasGravadas.Should().ContainSingle();
        _vendasGravadas[0].ProdutoId.Should().Be(_croissant.Id);
        _vendasGravadas[0].QuantidadeVendida.Should().Be(10m);
        _gravada!.HashConteudo.Should().Be("hash-real");
        _gravada.DataVenda.Should().Be(DataVenda);
        _gravada.PeriodoDe.Should().Be("01/06/2026");
        _gravada.TotalTaxaServico.Should().Be(90m);
        _gravada.TotalEntregas.Should().Be(20m);
        _gravada.TotalLinhasParseadas.Should().Be(4);
        _gravada.TotalImportadas.Should().Be(1);
        _gravada.TotalNaoEncontradas.Should().Be(1); // "Bolo Cenoura" sem vínculo
        resultado.TotalTaxaServico.Should().Be(90m);
        resultado.TotalEntregas.Should().Be(20m);
    }

    [Fact]
    public async Task VinculoParaLinhaQueOServidorNaoCasaria_GeraVendaDoProdutoVinculado()
    {
        await Criar().Handle(
            Command([Vinculo("Bolo Cenoura", _bolo)]), CancellationToken.None);

        _vendasGravadas.Should().ContainSingle(v => v.ProdutoId == _bolo.Id && v.QuantidadeVendida == 3m);
    }

    [Fact]
    public async Task LinhasRemovidas_FicamForaDasVendasEDosTotais()
    {
        await Criar().Handle(
            Command([Vinculo("Croissant", _croissant)], ["Entrega longe", "Bolo Cenoura"]),
            CancellationToken.None);

        _gravada!.TotalEntregas.Should().Be(0m);
        _gravada.TotalTaxaServico.Should().Be(90m);
        _gravada.TotalIgnoradas.Should().Be(2);
        _gravada.TotalNaoEncontradas.Should().Be(0);
    }

    [Fact]
    public async Task NomeRepetidoNoCsv_RecebeAMesmaDecisao()
    {
        CsvCom(
            new("001", "Croissant", null, 10m, 100m),
            new("001", "Croissant", null, 4m, 40m));

        await Criar().Handle(Command([Vinculo("Croissant", _croissant)]), CancellationToken.None);

        _vendasGravadas.Select(v => v.QuantidadeVendida).Should().BeEquivalentTo([10m, 4m]);
    }

    [Fact]
    public async Task CsvJaImportado_LancaDomainException()
    {
        _importacoes.Setup(r => r.HashExisteAsync("hash-real", default)).ReturnsAsync(true);

        var act = () => Criar().Handle(Command([Vinculo("Croissant", _croissant)]), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>()
                 .WithMessage("Este arquivo já foi importado anteriormente.");
    }

    [Fact]
    public async Task CsvSoComRepasses_ImportaSemVendas()
    {
        CsvCom(new("77", "TAXA DE SERVIÇO", null, 1m, 90m));

        var resultado = await Criar().Handle(Command(), CancellationToken.None);

        resultado.TotalImportadas.Should().Be(0);
        _gravada!.TotalTaxaServico.Should().Be(90m);
    }

    [Fact]
    public async Task TudoRemovido_LancaDomainException()
    {
        CsvCom(new("77", "TAXA DE SERVIÇO", null, 1m, 90m));

        var act = () => Criar().Handle(Command(removidas: ["TAXA DE SERVIÇO"]), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>()
                 .WithMessage("Nenhum item ou repasse confirmado para importação.");
    }

    [Fact]
    public async Task DeveUsarSnapshotDaConfiguracaoVigente()
    {
        var config = ConfiguracaoRepasse.Padrao(Guid.NewGuid());
        config.Atualizar(0.20m, 0.05m, Guid.NewGuid());
        _configRepasse.Setup(r => r.ObterAsync(default)).ReturnsAsync(config);

        await Criar().Handle(Command(), CancellationToken.None);

        _gravada!.PercentualRetencaoCasa.Should().Be(0.20m);
        _gravada.PercentualTaxaCartao.Should().Be(0.05m);
        _configRepasse.Verify(r => r.AdicionarAsync(It.IsAny<ConfiguracaoRepasse>(), default), Times.Never);
    }

    [Fact]
    public async Task DecisoesInvalidas_LancamDomainExceptionComTodosOsMotivos()
    {
        var inativo = CriarProduto("Antigo", ativo: false);
        _catalogo.Add(inativo);

        var act = () => Criar().Handle(Command(
            vinculos:
            [
                new("Não existe no CSV", _croissant.Id),
                new("TAXA DE SERVIÇO", _croissant.Id),
                new("Croissant", inativo.Id),
                new("Bolo Cenoura", Guid.NewGuid()),
            ],
            removidas: ["Croissant", "Também não existe"]), CancellationToken.None);

        var ex = (await act.Should().ThrowAsync<DomainException>()).Which;
        ex.Message.Should().Contain("Não existe no CSV")
            .And.Contain("Também não existe")
            .And.Contain("TAXA DE SERVIÇO")
            .And.Contain("Antigo")
            .And.Contain("vinculada e removida");
        _importacoes.Verify(r => r.AdicionarAsync(It.IsAny<EntidadeImportacao>(), default), Times.Never);
    }

    private static Produto CriarProduto(string nome, bool ativo = true)
    {
        var produto = (Produto)System.Runtime.CompilerServices.RuntimeHelpers
            .GetUninitializedObject(typeof(Produto));
        typeof(Produto).GetProperty(nameof(Produto.Id))!.SetValue(produto, Guid.NewGuid());
        typeof(Produto).GetProperty(nameof(Produto.Nome))!.SetValue(produto, nome);
        typeof(Produto).GetProperty(nameof(Produto.Ativo))!.SetValue(produto, ativo);
        return produto;
    }
}
```

- [ ] **Step 2: Reescrever os testes do validator**

`tests/CasaDiAna.Application.Tests/ImportacaoVendas/ConfirmarImportacaoCommandValidatorTests.cs` (substitui o arquivo inteiro):

```csharp
using CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class ConfirmarImportacaoCommandValidatorTests
{
    private readonly ConfirmarImportacaoCommandValidator _validator = new();

    private static ConfirmarImportacaoCommand Command(
        byte[]? csv = null, string nome = "vendas.csv", DateTime? data = null,
        IReadOnlyList<VinculoLinhaDto>? vinculos = null) =>
        new(csv ?? [1], nome, data ?? DateTime.Today, vinculos ?? [], []);

    [Fact]
    public void ComandoMinimo_Valido() =>
        _validator.Validate(Command()).IsValid.Should().BeTrue();

    [Fact]
    public void CsvVazio_Invalido() =>
        _validator.Validate(Command(csv: [])).IsValid.Should().BeFalse();

    [Fact]
    public void NomeArquivoVazio_Invalido() =>
        _validator.Validate(Command(nome: "")).IsValid.Should().BeFalse();

    [Fact]
    public void DataFutura_Invalido() =>
        _validator.Validate(Command(data: DateTime.Today.AddDays(3))).IsValid.Should().BeFalse();

    [Fact]
    public void VinculoSemNome_Invalido() =>
        _validator.Validate(Command(vinculos: [new VinculoLinhaDto("", Guid.NewGuid())])).IsValid.Should().BeFalse();

    [Fact]
    public void VinculoSemProduto_Invalido() =>
        _validator.Validate(Command(vinculos: [new VinculoLinhaDto("Croissant", Guid.Empty)])).IsValid.Should().BeFalse();
}
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "ConfirmarImportacao"`
Expected: erro de compilação (`VinculoLinhaDto`, novo construtor do comando/handler).

- [ ] **Step 4: DTO e comando**

`src/CasaDiAna.Application/ImportacaoVendas/Dtos/VinculoLinhaDto.cs`:

```csharp
namespace CasaDiAna.Application.ImportacaoVendas.Dtos;

/// <summary>Produto em que uma linha do relatório vira venda (decisão do usuário).</summary>
public record VinculoLinhaDto(string NomeRelatorio, Guid ProdutoId);
```

Apagar `ItemConfirmarDto.cs`.

`ConfirmarImportacaoCommand.cs`:

```csharp
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using MediatR;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;

/// <summary>
/// A tela envia o CSV e as decisões do usuário; quantidades, valores, repasses,
/// hash, período e contagens são recalculados do próprio arquivo.
/// </summary>
public record ConfirmarImportacaoCommand(
    byte[] CsvBytes,
    string NomeArquivo,
    DateTime DataVenda,
    IReadOnlyList<VinculoLinhaDto> Vinculos,
    IReadOnlyList<string> LinhasRemovidas
) : IRequest<ResultadoImportacaoDto>;
```

- [ ] **Step 5: Validator**

`ConfirmarImportacaoCommandValidator.cs` (substitui o corpo do construtor):

```csharp
        RuleFor(x => x.CsvBytes)
            .NotEmpty().WithMessage("Arquivo CSV é obrigatório.");

        RuleFor(x => x.NomeArquivo)
            .NotEmpty().WithMessage("Nome do arquivo é obrigatório.");

        RuleFor(x => x.DataVenda)
            .NotEmpty().WithMessage("Data de venda é obrigatória.")
            .LessThanOrEqualTo(DateTime.Today.AddDays(1))
            .WithMessage("Data de venda não pode ser no futuro.");

        RuleForEach(x => x.Vinculos).ChildRules(v =>
        {
            v.RuleFor(i => i.NomeRelatorio)
                .NotEmpty().WithMessage("Nome da linha é obrigatório em cada vínculo.");
            v.RuleFor(i => i.ProdutoId)
                .NotEmpty().WithMessage("Produto é obrigatório em cada vínculo.");
        });
```

- [ ] **Step 6: Handler**

`ConfirmarImportacaoCommandHandler.cs` (substitui o arquivo inteiro):

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Application.ImportacaoVendas.Services;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;
using ConfiguracaoRepasse = CasaDiAna.Domain.Entities.ConfiguracaoRepasse;
using EntidadeImportacao = CasaDiAna.Domain.Entities.ImportacaoVendas;
using Produto = CasaDiAna.Domain.Entities.Produto;
using VendaDiaria = CasaDiAna.Domain.Entities.VendaDiaria;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;

public class ConfirmarImportacaoCommandHandler
    : IRequestHandler<ConfirmarImportacaoCommand, ResultadoImportacaoDto>
{
    private readonly LeitorRelatorioVendas _leitor;
    private readonly IVendaDiariaRepository _vendas;
    private readonly IProdutoRepository _produtos;
    private readonly IImportacaoVendasRepository _importacoes;
    private readonly IConfiguracaoRepasseRepository _configuracaoRepasse;
    private readonly ICurrentUserService _currentUser;

    public ConfirmarImportacaoCommandHandler(
        LeitorRelatorioVendas leitor,
        IVendaDiariaRepository vendas,
        IProdutoRepository produtos,
        IImportacaoVendasRepository importacoes,
        IConfiguracaoRepasseRepository configuracaoRepasse,
        ICurrentUserService currentUser)
    {
        _leitor = leitor;
        _vendas = vendas;
        _produtos = produtos;
        _importacoes = importacoes;
        _configuracaoRepasse = configuracaoRepasse;
        _currentUser = currentUser;
    }

    public async Task<ResultadoImportacaoDto> Handle(
        ConfirmarImportacaoCommand request,
        CancellationToken cancellationToken)
    {
        var relatorio = _leitor.Ler(request.CsvBytes);

        if (await _importacoes.HashExisteAsync(relatorio.Hash, cancellationToken))
            throw new DomainException("Este arquivo já foi importado anteriormente.");

        var produtos = (await _produtos.ListarAsync(apenasAtivos: false, cancellationToken))
            .ToDictionary(p => p.Id);
        var vinculos = request.Vinculos
            .GroupBy(v => v.NomeRelatorio, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.Last().ProdutoId, StringComparer.Ordinal);
        var removidas = request.LinhasRemovidas.ToHashSet(StringComparer.Ordinal);

        ValidarDecisoes(relatorio, vinculos, removidas, produtos);

        var novasVendas = new List<VendaDiaria>();
        decimal totalTaxaServico = 0, totalEntregas = 0;
        int totalIgnoradas = 0, totalNaoEncontradas = 0;

        foreach (var (linha, tipoRepasse) in relatorio.Linhas)
        {
            if (removidas.Contains(linha.Nome)) { totalIgnoradas++; continue; }

            switch (tipoRepasse)
            {
                case TipoRepasse.TaxaServico: totalTaxaServico += linha.ValorTotal; continue;
                case TipoRepasse.Entrega: totalEntregas += linha.ValorTotal; continue;
            }

            if (!vinculos.TryGetValue(linha.Nome, out var produtoId)) { totalNaoEncontradas++; continue; }

            if (linha.Quantidade > 0)
                novasVendas.Add(VendaDiaria.Criar(produtoId, request.DataVenda, linha.Quantidade, _currentUser.UsuarioId));
        }

        if (novasVendas.Count == 0 && totalTaxaServico == 0 && totalEntregas == 0)
            throw new DomainException("Nenhum item ou repasse confirmado para importação.");

        await _vendas.AdicionarRangeAsync(novasVendas, cancellationToken);

        // Snapshot dos percentuais vigentes: mudar a configuração depois não
        // recalcula importações antigas. Sem configuração salva, vale o padrão.
        var configuracaoRepasse = await _configuracaoRepasse.ObterAsync(cancellationToken)
            ?? ConfiguracaoRepasse.Padrao(_currentUser.UsuarioId);

        var importacao = EntidadeImportacao.Criar(
            request.NomeArquivo,
            relatorio.Hash,
            relatorio.PeriodoDe,
            relatorio.PeriodoAte,
            relatorio.Linhas.Count,
            totalImportadas: novasVendas.Count,
            totalIgnoradas,
            totalNaoEncontradas,
            request.DataVenda,
            totalTaxaServico,
            totalEntregas,
            configuracaoRepasse,
            _currentUser.UsuarioId);

        await _importacoes.AdicionarAsync(importacao, cancellationToken);
        await _vendas.SalvarAsync(cancellationToken);

        return new ResultadoImportacaoDto(
            novasVendas.Count,
            totalIgnoradas,
            totalNaoEncontradas,
            importacao.TotalTaxaServico,
            importacao.TotalEntregas);
    }

    private static void ValidarDecisoes(
        RelatorioVendas relatorio,
        IReadOnlyDictionary<string, Guid> vinculos,
        IReadOnlySet<string> removidas,
        IReadOnlyDictionary<Guid, Produto> produtos)
    {
        var tipoPorNome = relatorio.Linhas
            .GroupBy(l => l.Linha.Nome, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.First().TipoRepasse, StringComparer.Ordinal);

        var erros = new List<string>();

        foreach (var nome in vinculos.Keys.Concat(removidas).Distinct(StringComparer.Ordinal))
            if (!tipoPorNome.ContainsKey(nome))
                erros.Add($"Linha '{nome}' não existe no arquivo.");

        foreach (var (nome, produtoId) in vinculos)
        {
            if (removidas.Contains(nome))
                erros.Add($"Linha '{nome}' foi vinculada e removida ao mesmo tempo.");
            if (tipoPorNome.TryGetValue(nome, out var tipo) && tipo is not null)
                erros.Add($"Linha '{nome}' é um repasse e não pode virar venda de produto.");
            if (!produtos.TryGetValue(produtoId, out var produto))
                erros.Add($"Produto {produtoId} não encontrado.");
            else if (!produto.Ativo)
                erros.Add($"Produto '{produto.Nome}' está inativo.");
        }

        if (erros.Count > 0)
            throw new DomainException(string.Join(" | ", erros));
    }
}
```

> Se `foreach (var (linha, tipoRepasse) in ...)` não compilar (deconstrução de record posicional funciona por padrão), troque por `foreach (var l in relatorio.Linhas) { var linha = l.Linha; ... }`.

- [ ] **Step 7: Rodar os testes de confirmação**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "ConfirmarImportacao"`
Expected: todos PASS.

- [ ] **Step 8: Controller multipart com helper de arquivo**

`src/CasaDiAna.API/Controllers/ConfirmarImportacaoForm.cs`:

```csharp
using CasaDiAna.Application.ImportacaoVendas.Dtos;

namespace CasaDiAna.API.Controllers;

/// <summary>Corpo multipart do POST /api/importacao-vendas/confirmar.</summary>
public class ConfirmarImportacaoForm
{
    public IFormFile? Arquivo { get; set; }
    public DateTime DataVenda { get; set; }
    public List<VinculoLinhaDto> Vinculos { get; set; } = [];
    public List<string> LinhasRemovidas { get; set; } = [];
}
```

Em `ImportacaoVendasController.cs`:

1. Adicionar o helper privado (antes do fim da classe):

```csharp
    private const long TamanhoMaximoArquivo = 10 * 1024 * 1024;

    /// <summary>Valida e lê o CSV enviado; devolve o erro 400 ou os bytes.</summary>
    private static async Task<(IActionResult? Erro, byte[] Bytes)> LerCsvAsync(
        IFormFile? arquivo, CancellationToken ct)
    {
        if (arquivo == null || arquivo.Length == 0)
            return (new BadRequestObjectResult(ApiResponse<object>.Erro("Nenhum arquivo enviado.")), []);

        if (!arquivo.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return (new BadRequestObjectResult(ApiResponse<object>.Erro("Somente arquivos CSV são aceitos.")), []);

        if (arquivo.Length > TamanhoMaximoArquivo)
            return (new BadRequestObjectResult(ApiResponse<object>.Erro("Arquivo muito grande. Máximo: 10 MB.")), []);

        await using var ms = new MemoryStream();
        await arquivo.CopyToAsync(ms, ct);
        return (null, ms.ToArray());
    }
```

2. `Preview` passa a:

```csharp
    public async Task<IActionResult> Preview(IFormFile arquivo, CancellationToken ct)
    {
        var (erro, bytes) = await LerCsvAsync(arquivo, ct);
        if (erro != null) return erro;

        var command = new ProcessarPreviewVendasCommand(bytes, arquivo.FileName);
        var resultado = await _mediator.Send(command, ct);
        return Ok(ApiResponse<PreviewImportacaoDto>.Ok(resultado));
    }
```

3. `Confirmar` passa a (com `[Consumes("multipart/form-data")]` acima, mantendo os `ProducesResponseType`):

```csharp
    public async Task<IActionResult> Confirmar(
        [FromForm] ConfirmarImportacaoForm form,
        CancellationToken ct)
    {
        var (erro, bytes) = await LerCsvAsync(form.Arquivo, ct);
        if (erro != null) return erro;

        var command = new ConfirmarImportacaoCommand(
            bytes, form.Arquivo!.FileName, form.DataVenda, form.Vinculos, form.LinhasRemovidas);
        var resultado = await _mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ResultadoImportacaoDto>.Ok(resultado));
    }
```

- [ ] **Step 9: Build, suíte e commit**

Run: `dotnet build src/CasaDiAna.API && dotnet test tests/CasaDiAna.Application.Tests`
Expected: build OK; todos PASS.

```bash
git add -A src/CasaDiAna.Application/ImportacaoVendas src/CasaDiAna.API/Controllers tests/CasaDiAna.Application.Tests/ImportacaoVendas
git commit -m "feat(importacao): confirmação relê o CSV e calcula quantidades, repasses e hash no servidor"
```

---

### Task 3: Frontend envia arquivo, vínculos e linhas removidas

**Files:**
- Modify: `frontend/src/types/importacao.ts`
- Modify: `frontend/src/features/producao/importacao-vendas/services/importacaoVendasService.ts`
- Modify: `frontend/src/features/producao/importacao-vendas/pages/ImportacaoVendasPage.tsx`

**Interfaces:**
- Consumes: contrato HTTP do Task 2.
- Produces: `VinculoLinha`, novo `ConfirmarImportacaoInput`, `importacaoVendasService.confirmar(input)`.

- [ ] **Step 1: Tipos**

Em `frontend/src/types/importacao.ts`, substituir `ItemConfirmar` e `ConfirmarImportacaoInput` por:

```ts
export interface VinculoLinha {
  nomeRelatorio: string
  produtoId: string
}

export interface ConfirmarImportacaoInput {
  arquivo: File
  dataVenda: string
  vinculos: VinculoLinha[]
  linhasRemovidas: string[]
}
```

- [ ] **Step 2: Service monta o FormData**

Em `importacaoVendasService.ts`, `confirmar` vira:

```ts
  confirmar: async (input: ConfirmarImportacaoInput): Promise<ResultadoImportacao> => {
    const form = new FormData()
    form.append('arquivo', input.arquivo)
    form.append('dataVenda', input.dataVenda)
    input.vinculos.forEach((v, i) => {
      form.append(`vinculos[${i}].nomeRelatorio`, v.nomeRelatorio)
      form.append(`vinculos[${i}].produtoId`, v.produtoId)
    })
    input.linhasRemovidas.forEach((nome, i) => form.append(`linhasRemovidas[${i}]`, nome))
    const resp = await api.post<ApiResponse<ResultadoImportacao>>(
      '/importacao-vendas/confirmar',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return resp.data.dados!
  },
```

- [ ] **Step 3: Página guarda as linhas removidas**

Em `ImportacaoVendasPage.tsx`:

1. Novo estado junto dos outros:

```tsx
  const [linhasRemovidas, setLinhasRemovidas] = useState<Set<string>>(new Set())
```

2. Em `removerSelecionados`, depois do `setPreview(...)`:

```tsx
    setLinhasRemovidas(prev => new Set([...prev, ...nomesRemover]))
```

3. Em `confirmarRemocao`, depois do `setPreview(...)`:

```tsx
    setLinhasRemovidas(prev => new Set(prev).add(itemParaRemover.nomeRelatorio))
```

4. Em `reiniciar`, adicionar `setLinhasRemovidas(new Set())`; em `processarCsv`, junto do `setSelecionados(new Set())`, também `setLinhasRemovidas(new Set())`.

- [ ] **Step 4: `confirmar()` envia vínculos**

Em `confirmar()`, trocar o bloco `const itens = [...]` e a chamada ao service por:

```tsx
    const vinculos: VinculoLinha[] = [
      ...matched.map(i => ({ nomeRelatorio: i.nomeRelatorio, produtoId: i.produtoId! })),
      ...resolvidos.map(i => ({ nomeRelatorio: i.nomeRelatorio, produtoId: resolucoes[i.nomeRelatorio] })),
    ]

    try {
      const res = await importacaoVendasService.confirmar({
        arquivo: arquivoSelecionado,
        dataVenda,
        vinculos,
        linhasRemovidas: [...linhasRemovidas],
      })
```

Importar `VinculoLinha` de `@/types/importacao`. O restante (`itensModal`, `setDadosConfirmacao` com os totais de `res`) fica igual. Remover imports que ficarem sem uso.

- [ ] **Step 5: Checagem de tipos e commit**

Run (em `frontend/`): `npx tsc -b --noEmit`
Expected: sem erros.

```bash
git add frontend/src/types/importacao.ts frontend/src/features/producao/importacao-vendas
git commit -m "feat(importacao): tela envia o CSV e as decisões; servidor calcula os valores"
```

---

### Task 4: Verificação final e entrega

- [ ] **Step 1:** `dotnet build src/CasaDiAna.API && dotnet test tests/CasaDiAna.Application.Tests` e, em `frontend/`, `npx tsc -b --noEmit`. Tudo verde.
- [ ] **Step 2:** Atualizar `../docs/brain/04_MODULOS/MOD_IMPORTACAO_VENDAS.md` (fica só em disco; a pasta está no `.gitignore`): confirmação multipart, servidor recalcula hash/quantidades/repasses/contagens, a tela envia vínculos e linhas removidas.
- [ ] **Step 3:** `git push origin master`.
- [ ] **Step 4 (manual, após deploy):** importar um CSV com produto casado, um ambíguo resolvido, um criado com "Adicionar" (renomeado), taxa e uma entrega removida; conferir o resultado e o fechamento do mês.
