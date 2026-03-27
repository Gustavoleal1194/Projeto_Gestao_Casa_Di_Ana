using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class ItemInventarioConfiguration : IEntityTypeConfiguration<ItemInventario>
{
    public void Configure(EntityTypeBuilder<ItemInventario> builder)
    {
        builder.HasKey(i => i.Id);
        builder.ToTable("itens_inventario", "estoque", t =>
        {
            t.HasCheckConstraint("chk_qtd_contada_nao_negativa", "quantidade_contada >= 0");
            t.HasCheckConstraint("chk_qtd_sistema_nao_negativa", "quantidade_sistema >= 0");
        });

        builder.Property(i => i.Id).HasColumnName("id");
        builder.Property(i => i.InventarioId).HasColumnName("inventario_id").IsRequired();
        builder.Property(i => i.IngredienteId).HasColumnName("ingrediente_id").IsRequired();
        builder.Property(i => i.QuantidadeSistema).HasColumnName("quantidade_sistema").HasPrecision(15, 4).IsRequired();
        builder.Property(i => i.QuantidadeContada).HasColumnName("quantidade_contada").HasPrecision(15, 4).IsRequired();
        builder.Property(i => i.Observacoes).HasColumnName("observacoes");
        builder.Ignore(i => i.Diferenca);

        builder.HasIndex(i => new { i.InventarioId, i.IngredienteId }).IsUnique();
        builder.HasIndex(i => i.IngredienteId);

        builder.HasOne(i => i.Ingrediente)
            .WithMany()
            .HasForeignKey(i => i.IngredienteId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
