using CasaDiAna.Application.Common;
using CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;
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

        if (entrada.CriadoPor != _currentUser.UsuarioId && _currentUser.Papel != "Admin")
            throw new UnauthorizedAccessException("Acesso negado.");

        return RegistrarEntradaCommandHandler.ToDto(entrada);
    }
}
