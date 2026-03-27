using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class InventarioConfiguration : IEntityTypeConfiguration<Inventario>
{
    public void Configure(EntityTypeBuilder<Inventario> builder)
    {
        builder.ToTable("inventarios", "estoque");
        builder.HasKey(inv => inv.Id);
        builder.Property(inv => inv.Id).HasColumnName("id");
        builder.Property(inv => inv.DataRealizacao).HasColumnName("data_realizacao").IsRequired();
        builder.Property(inv => inv.Descricao).HasColumnName("descricao").HasMaxLength(200);
        builder.Property(inv => inv.Status)
            .HasColumnName("status")
            .HasConversion(s => s.ToString(), s => Enum.Parse<StatusInventario>(s))
            .HasMaxLength(20)
            .IsRequired();
        builder.Property(inv => inv.FinalizadoEm).HasColumnName("finalizado_em");
        builder.Property(inv => inv.Observacoes).HasColumnName("observacoes");
        builder.Property(inv => inv.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(inv => inv.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(inv => inv.CriadoPor).HasColumnName("criado_por").IsRequired();
        builder.Property(inv => inv.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();

        builder.HasMany(inv => inv.Itens)
            .WithOne()
            .HasForeignKey(i => i.InventarioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(inv => inv.Itens)
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasIndex(inv => inv.DataRealizacao);
        builder.HasIndex(inv => inv.Status);
    }
}
