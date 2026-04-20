using CasaDiAna.Application.Auth.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.IniciarSetup2Fa;

public class IniciarSetup2FaCommandHandler
    : IRequestHandler<IniciarSetup2FaCommand, IniciarSetup2FaResultDto>
{
    private readonly IUsuarioRepository _usuarios;
    private readonly ITotpService _totp;

    public IniciarSetup2FaCommandHandler(IUsuarioRepository usuarios, ITotpService totp)
    {
        _usuarios = usuarios;
        _totp = totp;
    }

    public async Task<IniciarSetup2FaResultDto> Handle(
        IniciarSetup2FaCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorIdAsync(request.UsuarioId, cancellationToken)
            ?? throw new DomainException("Usuário não encontrado.");

        var secret = _totp.GerarSecret();
        var qrCodeUrl = _totp.GerarQrCodeUrl(secret, usuario.Email);

        var codigosRecuperacao = GerarCodigosRecuperacao(8);

        return new IniciarSetup2FaResultDto(
            QrCodeUrl: qrCodeUrl,
            SecretManual: secret,
            CodigosRecuperacao: codigosRecuperacao);
    }

    private static IReadOnlyList<string> GerarCodigosRecuperacao(int quantidade)
    {
        var codigos = new List<string>(quantidade);
        for (int i = 0; i < quantidade; i++)
        {
            var bytes = new byte[4];
            System.Security.Cryptography.RandomNumberGenerator.Fill(bytes);
            var hex = Convert.ToHexString(bytes);
            codigos.Add($"{hex[..4]}-{hex[4..]}");
        }
        return codigos;
    }
}
