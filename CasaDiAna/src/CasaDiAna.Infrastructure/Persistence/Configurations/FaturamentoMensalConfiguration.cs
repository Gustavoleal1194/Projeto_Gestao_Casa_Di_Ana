using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class FaturamentoMensalConfiguration : IEntityTypeConfiguration<FaturamentoMensal>
{
    public void Configure(EntityTypeBuilder<FaturamentoMensal> builder)
    {
        builder.ToTable("faturamentos_mensais", "financeiro");
        builder.HasKey(f => f.Id);
        builder.Property(f => f.Id).HasColumnName("id");
        builder.Property(f => f.Competencia).HasColumnName("competencia").IsRequired();
        builder.Property(f => f.ValorManual).HasColumnName("valor_manual").HasPrecision(15, 2);
        builder.Property(f => f.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(f => f.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(f => f.CriadoPor).HasColumnName("criado_por").IsRequired();
        builder.Property(f => f.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();

        builder.HasIndex(f => f.Competencia).IsUnique().HasDatabaseName("ix_faturamentos_mensais_competencia");
    }
}
