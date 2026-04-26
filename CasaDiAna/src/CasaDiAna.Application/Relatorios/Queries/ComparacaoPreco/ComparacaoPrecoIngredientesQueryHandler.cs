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
                .ThenBy(f => f.FornecedorNome)
                .ToList()
                .AsReadOnly();

            decimal? ultimoPreco = cronologico.Count > 0
                ? cronologico[^1].Item.CustoUnitario : null;
            decimal? precoAnterior = cronologico.Count > 1
                ? cronologico[^2].Item.CustoUnitario : null;
            decimal? variacaoValor = ultimoPreco.HasValue && precoAnterior.HasValue
                ? Math.Round(ultimoPreco.Value - precoAnterior.Value, 4) : null;
            decimal? variacaoPercentual = variacaoValor.HasValue && precoAnterior.HasValue && precoAnterior.Value != 0
                ? Math.Round(variacaoValor.Value / precoAnterior.Value * 100, 2) : null;

            string tendencia = variacaoValor.HasValue
                ? variacaoValor.Value > 0 ? "aumento"
                : variacaoValor.Value < 0 ? "reducao"
                : "estavel"
                : "sem_historico";

            var ingredienteInfo = cronologico.First().Item.Ingrediente;
            return new ComparacaoPrecoIngredienteDto(
                grupo.Key,
                ingredienteInfo?.Nome ?? string.Empty,
                ingredienteInfo?.UnidadeMedida?.Codigo ?? string.Empty,
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
            .Where(i => i.VariacaoPercentual > 0)
            .OrderByDescending(i => i.VariacaoPercentual)
            .Take(5)
            .ToList()
            .AsReadOnly();

        var maioresReducoes = comVariacao
            .Where(i => i.VariacaoPercentual < 0)
            .OrderBy(i => i.VariacaoPercentual)
            .Take(5)
            .ToList()
            .AsReadOnly();

        return new ComparacaoPrecoDto(ingredientes, maioresAumentos, maioresReducoes);
    }
}
