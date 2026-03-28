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
        _db.Usuarios.FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant() && u.Ativo, ct);

    public Task<Usuario?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Usuarios.FirstOrDefaultAsync(u => u.Id == id, ct);

    public async Task<IReadOnlyList<Usuario>> ListarAsync(CancellationToken ct = default) =>
        await _db.Usuarios.OrderBy(u => u.Nome).ToListAsync(ct);

    public Task<bool> EmailExisteAsync(string email, Guid? ignorarId = null, CancellationToken ct = default) =>
        _db.Usuarios.AnyAsync(u =>
            u.Email == email.ToLowerInvariant() &&
            (ignorarId == null || u.Id != ignorarId), ct);

    public async Task AdicionarAsync(Usuario usuario, CancellationToken ct = default) =>
        await _db.Usuarios.AddAsync(usuario, ct);

    public void Atualizar(Usuario usuario) =>
        _db.Usuarios.Update(usuario);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
