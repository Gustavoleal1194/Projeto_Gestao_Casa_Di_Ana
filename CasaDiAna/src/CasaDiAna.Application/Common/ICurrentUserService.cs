namespace CasaDiAna.Application.Common;

public interface ICurrentUserService
{
    Guid UsuarioId { get; }
    string Email { get; }
    string Papel { get; }
}
