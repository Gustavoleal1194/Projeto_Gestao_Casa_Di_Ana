using CasaDiAna.Application.Common;
using CasaDiAna.Application.Despesas.Commands.ReplicarDespesasFixas;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Despesas;

public class ReplicarDespesasFixasCommandHandlerTests
{
    private static readonly DateTime Outubro = new(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Novembro = new(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly Mock<IDespesaRepository> _repo = new();
    private readonly Mock<ICurrentUserService> _user = new();
    private readonly List<Despesa> _adicionadas = [];
    private readonly CategoriaDespesa _aluguel = CategoriaDespesa.Criar("Aluguel", TipoDespesa.Fixa, false, Guid.NewGuid());

    public ReplicarDespesasFixasCommandHandlerTests()
    {
        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _repo.Setup(r => r.AdicionarAsync(It.IsAny<Despesa>(), default))
             .Callback<Despesa, CancellationToken>((d, _) => _adicionadas.Add(d))
             .Returns(Task.CompletedTask);
        _repo.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
    }

    private async Task<(int Copiadas, int JaExistentes)> Executar(IReadOnlyList<Despesa> outubro, IReadOnlyList<Despesa> novembro)
    {
        _repo.Setup(r => r.ListarPorCompetenciaAsync(Outubro, default)).ReturnsAsync(outubro);
        _repo.Setup(r => r.ListarPorCompetenciaAsync(Novembro, default)).ReturnsAsync(novembro);
        var dto = await new ReplicarDespesasFixasCommandHandler(_repo.Object, _user.Object)
            .Handle(new ReplicarDespesasFixasCommand(Novembro), default);
        return (dto.Copiadas, dto.JaExistentes);
    }

    private static Despesa Lancamento(DateTime comp, CategoriaDespesa cat, string? descricao, decimal valor, int dia = 5)
    {
        var d = Despesa.Criar(comp, cat.Id, descricao, valor, "obs", comp.AddDays(dia - 1), Guid.NewGuid());
        typeof(Despesa).GetProperty("Categoria")!.SetValue(d, cat);
        return d;
    }

    [Fact]
    public async Task CopiaFixasDoMesAnterior_MantendoDadosEDia()
    {
        var resultado = await Executar([Lancamento(Outubro, _aluguel, "Loja", 3000m, dia: 10)], []);

        resultado.Should().Be((1, 0));
        var copia = _adicionadas.Single();
        copia.Competencia.Should().Be(Novembro);
        copia.DataLancamento.Should().Be(new DateTime(2026, 11, 10));
        copia.CategoriaDespesaId.Should().Be(_aluguel.Id);
        copia.Descricao.Should().Be("Loja");
        copia.Valor.Should().Be(3000m);
        copia.Observacao.Should().Be("obs");
    }

    [Fact]
    public async Task NaoDuplica_OQueJaExisteNoDestino()
    {
        var energia = CategoriaDespesa.Criar("Energia", TipoDespesa.Fixa, false, Guid.NewGuid());
        var resultado = await Executar(
            [Lancamento(Outubro, _aluguel, "Loja", 3000m), Lancamento(Outubro, energia, null, 800m)],
            [Lancamento(Novembro, _aluguel, "LOJA", 3100m)]);

        resultado.Should().Be((1, 1));
        _adicionadas.Single().CategoriaDespesaId.Should().Be(energia.Id);
    }

    [Fact]
    public async Task IgnoraVariaveisECategoriasInativas()
    {
        var insumos = CategoriaDespesa.Criar("Gás", TipoDespesa.Variavel, false, Guid.NewGuid());
        var inativa = CategoriaDespesa.Criar("Antiga", TipoDespesa.Fixa, false, Guid.NewGuid());
        inativa.Desativar(Guid.NewGuid());

        var resultado = await Executar(
            [Lancamento(Outubro, insumos, null, 200m), Lancamento(Outubro, inativa, null, 50m)], []);

        resultado.Should().Be((0, 0));
        _repo.Verify(r => r.SalvarAsync(default), Times.Never);
    }

    [Fact]
    public void CopiarPara_LimitaDiaAoUltimoDiaDoMes()
    {
        var janeiro = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var d = Lancamento(janeiro, _aluguel, null, 100m, dia: 31);

        d.CopiarPara(new DateTime(2026, 2, 1), Guid.NewGuid()).DataLancamento
            .Should().Be(new DateTime(2026, 2, 28));
    }
}
