using CasaDiAna.Application.Common;
using CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;
using CasaDiAna.Application.Entradas.Common;
using CasaDiAna.Application.Entradas.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Entradas.Queries.ObterEntrada;

public class ObterEntradaQueryHandler : IRequestHandler<ObterEntradaQuery, EntradaMercadoriaDto>
{
    private readonly IEntradaMercadoriaRepository _entradas;
    private readonly ICurrentUserService _currentUser;

    public ObterEntradaQueryHandler(IEntradaMercadoriaRepository entradas, ICurrentUserService currentUser)
    {
        _entradas = entradas;
        _currentUser = currentUser;
    }

    public async Task<EntradaMercadoriaDto> Handle(
        ObterEntradaQuery request, CancellationToken cancellationToken)
    {
        var entrada = await _entradas.ObterPorIdComItensAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Entrada não encontrada.");

        EntradaPermissao.GarantirAcesso(entrada, _currentUser);

        return RegistrarEntradaCommandHandler.ToDto(entrada);
    }
}
