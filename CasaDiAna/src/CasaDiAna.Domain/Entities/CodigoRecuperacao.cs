// src/CasaDiAna.Domain/Entities/CodigoRecuperacao.cs
namespace CasaDiAna.Domain.Entities;

public class CodigoRecuperacao
{
    public Guid Id { get; private set; }
    public Guid UsuarioId { get; private set; }
    public string CodigoHash { get; private set; } = string.Empty;
    public DateTime? UsadoEm { get; private set; }
    public DateTime CriadoEm { get; private set; }

    private CodigoRecuperacao() { }

    public static CodigoRecuperacao Criar(Guid usuarioId, string codigoHash)
    {
        return new CodigoRecuperacao
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            CodigoHash = codigoHash,
            CriadoEm = DateTime.UtcNow
        };
    }

    public void MarcarUsado()
    {
        UsadoEm = DateTime.UtcNow;
    }

    public bool VerificarCodigo(string codigo) =>
        BCrypt.Net.BCrypt.Verify(codigo, CodigoHash);
}
