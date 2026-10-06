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
