using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class BoletoEntradaConfiguration : IEntityTypeConfiguration<BoletoEntrada>
{
    public void Configure(EntityTypeBuilder<BoletoEntrada> builder)
    {
        builder.HasKey(b => b.Id);
        builder.ToTable("boletos_entrada", "estoque");

        builder.Property(b => b.Id).HasColumnName("id");
        builder.Property(b => b.EntradaId).HasColumnName("entrada_id").IsRequired();
        builder.Property(b => b.DataVencimento).HasColumnName("data_vencimento").IsRequired();

        builder.HasIndex(b => b.EntradaId);
        builder.HasIndex(b => b.DataVencimento);
    }
}
