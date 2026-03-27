using CasaDiAna.Application.Entradas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;

public record RegistrarEntradaCommand(
    Guid FornecedorId,
    DateTime DataEntrada,
    IReadOnlyList<ItemEntradaInputDto> Itens,
    string? NumeroNotaFiscal = null,
    string? Observacoes = null) : IRequest<EntradaMercadoriaDto>;
