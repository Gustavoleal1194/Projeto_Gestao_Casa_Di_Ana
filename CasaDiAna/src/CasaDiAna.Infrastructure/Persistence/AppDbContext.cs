using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<UnidadeMedida> UnidadesMedida => Set<UnidadeMedida>();
    public DbSet<CategoriaIngrediente> CategoriasIngrediente => Set<CategoriaIngrediente>();
    public DbSet<Ingrediente> Ingredientes => Set<Ingrediente>();
    public DbSet<Fornecedor> Fornecedores => Set<Fornecedor>();
    public DbSet<EntradaMercadoria> EntradasMercadoria => Set<EntradaMercadoria>();
    public DbSet<ItemEntradaMercadoria> ItensEntradaMercadoria => Set<ItemEntradaMercadoria>();
    public DbSet<Inventario> Inventarios => Set<Inventario>();
    public DbSet<ItemInventario> ItensInventario => Set<ItemInventario>();
    public DbSet<Movimentacao> Movimentacoes => Set<Movimentacao>();
    public DbSet<CategoriaProduto> CategoriasProduto => Set<CategoriaProduto>();
    public DbSet<Produto> Produtos => Set<Produto>();
    public DbSet<ItemFichaTecnica> ItensFichaTecnica => Set<ItemFichaTecnica>();
    public DbSet<ProducaoDiaria> ProducoesDiarias => Set<ProducaoDiaria>();
    public DbSet<VendaDiaria> VendasDiarias => Set<VendaDiaria>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
