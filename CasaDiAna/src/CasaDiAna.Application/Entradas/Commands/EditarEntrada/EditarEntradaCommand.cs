using CasaDiAna.Application.Entradas.Common;
using CasaDiAna.Application.Entradas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Entradas.Commands.EditarEntrada;

/// <summary>
/// Edita cabeçalho, boletos e custo dos itens de uma entrada confirmada. Não altera estoque.
/// Itens ausentes de <see cref="CustosItens"/>/<see cref="CustosItensUtensilio"/> mantêm o custo.
/// </summary>
public record EditarEntradaCommand(
    Guid EntradaId,
    Guid FornecedorId,
    DateTime DataEntrada,
    string RecebidoPor,
    string? NumeroNotaFiscal = null,
    string? Observacoes = null,
    IReadOnlyList<DateTime>? DatasVencimentoBoleto = null,
    IReadOnlyList<CustoItemInputDto>? CustosItens = null,
    IReadOnlyList<CustoItemInputDto>? CustosItensUtensilio = null) : IRequest<EntradaMercadoriaDto>, ICabecalhoEntrada;
