using CasaDiAna.Application.VendasDiarias.Dtos;
using MediatR;

namespace CasaDiAna.Application.VendasDiarias.Commands.RegistrarVenda;

public record RegistrarVendaCommand(
    Guid ProdutoId,
    DateTime Data,
    decimal QuantidadeVendida) : IRequest<VendaDiariaDto>;
