using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class ItemEntradaUtensilioConfiguration : IEntityTypeConfiguration<ItemEntradaUtensilio>
{
    public void Configure(EntityTypeBuilder<ItemEntradaUtensilio> builder)
    {
        builder.HasKey(i => i.Id);
        builder.ToTable("itens_entrada_utensilio", "estoque", t =>
        {
            t.HasCheckConstraint("chk_item_utensilio_quantidade_positiva", "quantidade > 0");
            t.HasCheckConstraint("chk_item_utensilio_custo_nao_negativo", "custo_unitario >= 0");
        });

        builder.Property(i => i.Id).HasColumnName("id");
        builder.Property(i => i.EntradaId).HasColumnName("entrada_id").IsRequired();
        builder.Property(i => i.UtensilioId).HasColumnName("utensilio_id").IsRequired();
        builder.Property(i => i.Quantidade).HasColumnName("quantidade").HasPrecision(15, 4).IsRequired();
        builder.Property(i => i.CustoUnitario).HasColumnName("custo_unitario").HasPrecision(15, 4).IsRequired();
        builder.Ignore(i => i.CustoTotal);

        builder.HasIndex(i => new { i.EntradaId, i.UtensilioId }).IsUnique();
        builder.HasIndex(i => i.UtensilioId);

        builder.HasOne(i => i.Utensilio)
            .WithMany()
            .HasForeignKey(i => i.UtensilioId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
