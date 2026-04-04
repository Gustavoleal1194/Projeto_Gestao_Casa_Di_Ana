using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class HistoricoImpressaoEtiquetaConfiguration
    : IEntityTypeConfiguration<HistoricoImpressaoEtiqueta>
{
    public void Configure(EntityTypeBuilder<HistoricoImpressaoEtiqueta> builder)
    {
        builder.ToTable("historico_impressao_etiquetas", "producao");

        builder.HasKey(h => h.Id);

        builder.Property(h => h.Id)
               .HasColumnName("id");

        builder.Property(h => h.ProdutoId)
               .HasColumnName("produto_id")
               .IsRequired();

        builder.Property(h => h.TipoEtiqueta)
               .HasColumnName("tipo_etiqueta")
               .IsRequired();

        builder.Property(h => h.Quantidade)
               .HasColumnName("quantidade")
               .IsRequired();

        builder.Property(h => h.DataProducao)
               .HasColumnName("data_producao")
               .IsRequired();

        builder.Property(h => h.ImpressoPor)
               .HasColumnName("impresso_por")
               .IsRequired();

        builder.Property(h => h.ImpressoEm)
               .HasColumnName("impresso_em")
               .IsRequired();

        builder.HasOne(h => h.Produto)
               .WithMany()
               .HasForeignKey(h => h.ProdutoId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(h => h.ProdutoId)
               .HasDatabaseName("ix_historico_impressao_etiquetas_produto_id");

        builder.HasIndex(h => h.ImpressoEm)
               .HasDatabaseName("ix_historico_impressao_etiquetas_impresso_em");
    }
}
