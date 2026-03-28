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
}
