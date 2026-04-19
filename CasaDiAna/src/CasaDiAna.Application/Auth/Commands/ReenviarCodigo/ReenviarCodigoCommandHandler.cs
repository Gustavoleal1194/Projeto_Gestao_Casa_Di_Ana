using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.ReenviarCodigo;

public class ReenviarCodigoCommandHandler : IRequestHandler<ReenviarCodigoCommand, Unit>
{
    private readonly IUsuarioRepository _usuarios;
    private readonly ISmsService _smsService;

    public ReenviarCodigoCommandHandler(IUsuarioRepository usuarios, ISmsService smsService)
    {
        _usuarios = usuarios;
        _smsService = smsService;
    }

    public async Task<Unit> Handle(ReenviarCodigoCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorIdAsync(request.UsuarioId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Sessão inválida.");

        if (!usuario.TwoFactorHabilitado || usuario.Telefone is null)
            throw new UnauthorizedAccessException("Sessão inválida.");

        var codigo = usuario.GerarOtp();
        _usuarios.Atualizar(usuario);
        await _usuarios.SalvarAsync(cancellationToken);
        try
        {
            await _smsService.EnviarAsync(usuario.Telefone, codigo, cancellationToken);
        }
        catch (Exception)
        {
            throw new DomainException("Não foi possível enviar o código por SMS. Verifique o número cadastrado ou contate o administrador.");
        }

        return Unit.Value;
    }
}
