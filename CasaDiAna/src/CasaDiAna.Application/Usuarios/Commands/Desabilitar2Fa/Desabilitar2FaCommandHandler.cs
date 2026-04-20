using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Usuarios.Commands.Desabilitar2Fa;

public class Desabilitar2FaCommandHandler : IRequestHandler<Desabilitar2FaCommand, Unit>
{
    private readonly IUsuarioRepository _usuarios;
    private readonly ICodigoRecuperacaoRepository _codigosRecuperacao;

    public Desabilitar2FaCommandHandler(
        IUsuarioRepository usuarios,
        ICodigoRecuperacaoRepository codigosRecuperacao)
    {
        _usuarios = usuarios;
        _codigosRecuperacao = codigosRecuperacao;
    }

    public async Task<Unit> Handle(Desabilitar2FaCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorIdAsync(request.UsuarioId, cancellationToken)
            ?? throw new DomainException("Usuário não encontrado.");

        usuario.DesabilitarTotp();
        _usuarios.Atualizar(usuario);
        await _codigosRecuperacao.DeletarPorUsuarioAsync(usuario.Id, cancellationToken);
        await _usuarios.SalvarAsync(cancellationToken);

        return Unit.Value;
    }
}
