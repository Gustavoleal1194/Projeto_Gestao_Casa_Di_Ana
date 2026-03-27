using System.Security.Claims;
using CasaDiAna.Application.Common;
using Microsoft.AspNetCore.Http;

namespace CasaDiAna.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    public Guid UsuarioId { get; }
    public string Email { get; }
    public string Papel { get; }

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        var user = httpContextAccessor.HttpContext?.User
            ?? throw new InvalidOperationException("Contexto HTTP não disponível.");

        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Claim 'sub' ausente no token.");

        UsuarioId = Guid.Parse(sub);
        Email = user.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
        Papel = user.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
    }
}
