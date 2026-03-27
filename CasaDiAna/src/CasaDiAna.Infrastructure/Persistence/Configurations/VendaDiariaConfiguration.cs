using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class VendaDiariaConfiguration : IEntityTypeConfiguration<VendaDiaria>
{
    public void Configure(EntityTypeBuilder<VendaDiaria> builder)
    {
        builder.ToTable("vendas_diarias", "producao");
        builder.HasKey(v => v.Id);
        builder.Property(v => v.Id).HasColumnName("id");
        builder.Property(v => v.ProdutoId).HasColumnName("produto_id").IsRequired();
        builder.Property(v => v.Data).HasColumnName("data").IsRequired();
        builder.Property(v => v.QuantidadeVendida)
            .HasColumnName("quantidade_vendida")
            .HasPrecision(15, 4)
            .IsRequired();
        builder.Property(v => v.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(v => v.CriadoPor).HasColumnName("criado_por").IsRequired();

        builder.HasOne(v => v.Produto)
            .WithMany()
            .HasForeignKey(v => v.ProdutoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(v => new { v.ProdutoId, v.Data });
        builder.HasIndex(v => v.Data);
    }
}
