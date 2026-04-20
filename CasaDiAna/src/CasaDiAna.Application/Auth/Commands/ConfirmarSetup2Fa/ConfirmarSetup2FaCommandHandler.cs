using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.ConfirmarSetup2Fa;

public class ConfirmarSetup2FaCommandHandler : IRequestHandler<ConfirmarSetup2FaCommand, Unit>
{
    private readonly IUsuarioRepository _usuarios;
    private readonly ITotpService _totp;
    private readonly ICodigoRecuperacaoRepository _codigosRecuperacao;

    public ConfirmarSetup2FaCommandHandler(
        IUsuarioRepository usuarios,
        ITotpService totp,
        ICodigoRecuperacaoRepository codigosRecuperacao)
    {
        _usuarios = usuarios;
        _totp = totp;
        _codigosRecuperacao = codigosRecuperacao;
    }

    public async Task<Unit> Handle(
        ConfirmarSetup2FaCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorIdAsync(request.UsuarioId, cancellationToken)
            ?? throw new DomainException("Usuário não encontrado.");

        if (!_totp.ValidarCodigo(request.Secret, request.Codigo))
            throw new DomainException("Código inválido. Verifique o app e tente novamente.");

        // Deleta recovery codes anteriores antes de salvar novos
        await _codigosRecuperacao.DeletarPorUsuarioAsync(usuario.Id, cancellationToken);

        usuario.HabilitarTotp(request.Secret);
        _usuarios.Atualizar(usuario);

        var codigos = request.CodigosRecuperacao
            .Select(c => CodigoRecuperacao.Criar(
                usuario.Id,
                CodigoRecuperacao.HashCodigo(c)))
            .ToList();

        await _codigosRecuperacao.AdicionarAsync(codigos, cancellationToken);
        await _usuarios.SalvarAsync(cancellationToken);

        return Unit.Value;
    }
}
