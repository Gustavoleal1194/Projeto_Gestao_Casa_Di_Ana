using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IJwtService
{
    string GerarToken(Usuario usuario);
    string GerarTokenTemporario(Guid usuarioId);
}
