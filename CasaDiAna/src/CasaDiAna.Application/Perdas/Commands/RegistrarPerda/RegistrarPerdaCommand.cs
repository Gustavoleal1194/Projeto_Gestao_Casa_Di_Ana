using CasaDiAna.Application.Perdas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Perdas.Commands.RegistrarPerda;

public record RegistrarPerdaCommand(
    Guid ProdutoId,
    DateTime Data,
    decimal Quantidade,
    string Justificativa) : IRequest<PerdaProdutoDto>;
