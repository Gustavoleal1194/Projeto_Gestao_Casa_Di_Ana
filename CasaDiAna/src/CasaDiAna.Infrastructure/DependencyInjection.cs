using CasaDiAna.Application.Common;
using CasaDiAna.Application.ImportacaoVendas.Services;
using CasaDiAna.Application.Notificacoes.Services;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using CasaDiAna.Infrastructure.Repositories;
using CasaDiAna.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CasaDiAna.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Suporta DATABASE_URL no formato postgres:// (Render, Railway, Heroku)
        // ou ConnectionStrings__Default no formato Npgsql
        var connectionString = ResolverConnectionString(configuration);

        services.AddDbContext<AppDbContext>(opt =>
            opt.UseNpgsql(
                connectionString,
                npgsql => npgsql.MigrationsAssembly(
                    typeof(AppDbContext).Assembly.FullName))
        );

        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<ICategoriaIngredienteRepository, CategoriaIngredienteRepository>();
        services.AddScoped<IUnidadeMedidaRepository, UnidadeMedidaRepository>();
        services.AddScoped<IIngredienteRepository, IngredienteRepository>();
        services.AddScoped<IFornecedorRepository, FornecedorRepository>();
        services.AddScoped<IEntradaMercadoriaRepository, EntradaMercadoriaRepository>();
        services.AddScoped<IMovimentacaoRepository, MovimentacaoRepository>();
        services.AddScoped<IInventarioRepository, InventarioRepository>();
        services.AddScoped<ICategoriaProdutoRepository, CategoriaProdutoRepository>();
        services.AddScoped<IProdutoRepository, ProdutoRepository>();
        services.AddScoped<IProducaoDiariaRepository, ProducaoDiariaRepository>();
        services.AddScoped<IVendaDiariaRepository, VendaDiariaRepository>();
        services.AddScoped<IImportacaoVendasRepository, ImportacaoVendasRepository>();
        services.AddScoped<IVendasParser, CsvVendasParser>();
        services.AddScoped<IPerdaProdutoRepository, PerdaProdutoRepository>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<INotificacaoEstoqueRepository, NotificacaoEstoqueRepository>();
        services.AddScoped<INotificacaoEstoqueService, NotificacaoEstoqueService>();
        services.AddScoped<IHistoricoImpressaoRepository, HistoricoImpressaoRepository>();
        services.AddScoped<IModeloEtiquetaNutricionalRepository, ModeloEtiquetaNutricionalRepository>();
        services.AddHttpContextAccessor();

        return services;
    }

    /// <summary>
    /// Converte DATABASE_URL (postgres://user:pass@host:port/db) para formato Npgsql,
    /// ou devolve ConnectionStrings:Default diretamente.
    /// </summary>
    private static string ResolverConnectionString(IConfiguration configuration)
    {
        var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
        if (!string.IsNullOrWhiteSpace(databaseUrl))
        {
            // postgres://user:password@host:port/database
            // uri.Port retorna -1 quando a porta não está explícita na URL (usa default 5432)
            var uri = new Uri(databaseUrl);
            var port = uri.Port == -1 ? 5432 : uri.Port;
            var colonIdx = uri.UserInfo.IndexOf(':');
            var username = uri.UserInfo[..colonIdx];
            var password = Uri.UnescapeDataString(uri.UserInfo[(colonIdx + 1)..]);
            return $"Host={uri.Host};Port={port};Database={uri.AbsolutePath.TrimStart('/')};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
        }

        return configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string não configurada. Defina DATABASE_URL ou ConnectionStrings__Default.");
    }
}
