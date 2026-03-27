using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly AppDbContext _db;

    public UsuarioRepository(AppDbContext db) => _db = db;

    public Task<Usuario?> ObterPorEmailAsync(string email, CancellationToken ct = default) =>
        _db.Usuarios.FirstOrDefaultAsync(
            u => u.Email == email.ToLowerInvariant() && u.Ativo, ct);

    public Task<Usuario?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Usuarios.FirstOrDefaultAsync(u => u.Id == id && u.Ativo, ct);

    public async Task AdicionarAsync(Usuario usuario, CancellationToken ct = default) =>
        await _db.Usuarios.AddAsync(usuario, ct);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
