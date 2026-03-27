using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class ItemEntradaMercadoriaConfiguration : IEntityTypeConfiguration<ItemEntradaMercadoria>
{
    public void Configure(EntityTypeBuilder<ItemEntradaMercadoria> builder)
    {
        builder.HasKey(i => i.Id);
        builder.ToTable("itens_entrada_mercadoria", "estoque", t =>
        {
            t.HasCheckConstraint("chk_item_quantidade_positiva", "quantidade > 0");
            t.HasCheckConstraint("chk_item_custo_nao_negativo", "custo_unitario >= 0");
        });

        builder.Property(i => i.Id).HasColumnName("id");
        builder.Property(i => i.EntradaId).HasColumnName("entrada_id").IsRequired();
        builder.Property(i => i.IngredienteId).HasColumnName("ingrediente_id").IsRequired();
        builder.Property(i => i.Quantidade).HasColumnName("quantidade").HasPrecision(15, 4).IsRequired();
        builder.Property(i => i.CustoUnitario).HasColumnName("custo_unitario").HasPrecision(15, 4).IsRequired();
        builder.Ignore(i => i.CustoTotal);

        builder.HasIndex(i => new { i.EntradaId, i.IngredienteId }).IsUnique();
        builder.HasIndex(i => i.IngredienteId);

        builder.HasOne(i => i.Ingrediente)
            .WithMany()
            .HasForeignKey(i => i.IngredienteId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
