using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Domain.Entities;

public class Usuario
{
    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string SenhaHash { get; private set; } = string.Empty;
    public PapelUsuario Papel { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }

    // 2FA
    public string? Telefone { get; private set; }
    public bool TwoFactorHabilitado { get; private set; }
    public string? CodigoOtpHash { get; private set; }
    public DateTime? CodigoOtpExpiraEm { get; private set; }
    public int CodigoOtpTentativas { get; private set; }

    private Usuario() { }

    public static Usuario Criar(string nome, string email, string senhaHash, PapelUsuario papel)
    {
        return new Usuario
        {
            Id = Guid.NewGuid(),
            Nome = nome,
            Email = email.ToLowerInvariant(),
            SenhaHash = senhaHash,
            Papel = papel,
            Ativo = true,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow
        };
    }

    public bool SenhaCorreta(string senha) =>
        BCrypt.Net.BCrypt.Verify(senha, SenhaHash);

    public static string HashSenha(string senha) =>
        BCrypt.Net.BCrypt.HashPassword(senha);

    public void Desativar()
    {
        Ativo = false;
        AtualizadoEm = DateTime.UtcNow;
    }

    public void RedefinirSenha(string novaSenhaHash)
    {
        SenhaHash = novaSenhaHash;
        AtualizadoEm = DateTime.UtcNow;
    }

    public void HabilitarDoisFatores(string telefone)
    {
        Telefone = telefone;
        TwoFactorHabilitado = true;
        LimparOtp();
    }

    public void DesabilitarDoisFatores()
    {
        Telefone = null;
        TwoFactorHabilitado = false;
        LimparOtp();
    }

    // Gera OTP de 6 dígitos, armazena hash, expira em 5 min; retorna código limpo para SMS.
    public string GerarOtp()
    {
        var codigo = System.Security.Cryptography.RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        CodigoOtpHash = BCrypt.Net.BCrypt.HashPassword(codigo);
        CodigoOtpExpiraEm = DateTime.UtcNow.AddMinutes(5);
        CodigoOtpTentativas = 0;
        AtualizadoEm = DateTime.UtcNow;
        return codigo;
    }

    // Verifica hash e incrementa tentativas. Não valida expiração/limite — responsabilidade do handler.
    public bool ValidarOtp(string codigo)
    {
        if (CodigoOtpHash is null) return false;
        CodigoOtpTentativas++;
        AtualizadoEm = DateTime.UtcNow;
        return BCrypt.Net.BCrypt.Verify(codigo, CodigoOtpHash);
    }

    public void LimparOtp()
    {
        CodigoOtpHash = null;
        CodigoOtpExpiraEm = null;
        CodigoOtpTentativas = 0;
        AtualizadoEm = DateTime.UtcNow;
    }

    public static string MascararTelefone(string tel) =>
        tel.Length >= 4 ? $"(**) *****-{tel[^4..]}" : "(**) *****";
}
