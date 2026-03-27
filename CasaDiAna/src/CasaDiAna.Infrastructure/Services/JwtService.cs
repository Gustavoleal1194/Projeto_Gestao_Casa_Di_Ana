using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace CasaDiAna.Infrastructure.Services;

public class JwtService : IJwtService
{
    private readonly string _chave;
    private readonly string _emissor;
    private readonly int _expiracaoMinutos;

    public JwtService(IConfiguration config)
    {
        _chave = config["Jwt:Chave"]
            ?? throw new InvalidOperationException("Jwt:Chave não configurada.");
        _emissor = config["Jwt:Emissor"] ?? "CasaDiAna";
        _expiracaoMinutos = int.Parse(config["Jwt:ExpiracaoMinutos"] ?? "60");
    }

    public string GerarToken(Usuario usuario)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
            new Claim(ClaimTypes.Role, usuario.Papel.ToString()),
            new Claim(ClaimTypes.Name, usuario.Nome),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var chave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_chave));
        var credenciais = new SigningCredentials(chave, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _emissor,
            audience: _emissor,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_expiracaoMinutos),
            signingCredentials: credenciais);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
