using CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;
using CasaDiAna.Application.Entradas.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Entradas.Queries.ObterEntrada;

public class ObterEntradaQueryHandler : IRequestHandler<ObterEntradaQuery, EntradaMercadoriaDto>
{
    private readonly IEntradaMercadoriaRepository _entradas;

    public ObterEntradaQueryHandler(IEntradaMercadoriaRepository entradas)
    {
        _entradas = entradas;
    }

    public async Task<EntradaMercadoriaDto> Handle(
        ObterEntradaQuery request, CancellationToken cancellationToken)
    {
        var entrada = await _entradas.ObterPorIdComItensAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Entrada não encontrada.");

        return RegistrarEntradaCommandHandler.ToDto(entrada);
    }
}
