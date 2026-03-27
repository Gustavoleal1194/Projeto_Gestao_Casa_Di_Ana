using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class ItemFichaTecnicaConfiguration : IEntityTypeConfiguration<ItemFichaTecnica>
{
    public void Configure(EntityTypeBuilder<ItemFichaTecnica> builder)
    {
        builder.ToTable("itens_ficha_tecnica", "producao");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("id");
        builder.Property(i => i.ProdutoId).HasColumnName("produto_id").IsRequired();
        builder.Property(i => i.IngredienteId).HasColumnName("ingrediente_id").IsRequired();
        builder.Property(i => i.QuantidadePorUnidade)
            .HasColumnName("quantidade_por_unidade")
            .HasPrecision(15, 4)
            .IsRequired();

        builder.HasIndex(i => new { i.ProdutoId, i.IngredienteId }).IsUnique();

        builder.HasOne(i => i.Ingrediente)
            .WithMany()
            .HasForeignKey(i => i.IngredienteId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
