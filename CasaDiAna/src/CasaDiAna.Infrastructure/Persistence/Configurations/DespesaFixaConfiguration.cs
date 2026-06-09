using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class DespesaFixaConfiguration : IEntityTypeConfiguration<DespesaFixa>
{
    public void Configure(EntityTypeBuilder<DespesaFixa> builder)
    {
        builder.ToTable("despesas_fixas", "financeiro");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasColumnName("id");
        builder.Property(d => d.Competencia).HasColumnName("competencia").IsRequired();
        builder.Property(d => d.Categoria).HasColumnName("categoria").HasConversion<int>().IsRequired();
        builder.Property(d => d.Descricao).HasColumnName("descricao").HasMaxLength(200);
        builder.Property(d => d.Valor).HasColumnName("valor").HasPrecision(15, 2).IsRequired();
        builder.Property(d => d.Observacao).HasColumnName("observacao").HasMaxLength(500);
        builder.Property(d => d.DataLancamento).HasColumnName("data_lancamento").IsRequired();
        builder.Property(d => d.Ativo).HasColumnName("ativo").IsRequired();
        builder.Property(d => d.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(d => d.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(d => d.CriadoPor).HasColumnName("criado_por").IsRequired();
        builder.Property(d => d.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();

        builder.HasIndex(d => d.Competencia).HasDatabaseName("ix_despesas_fixas_competencia");
    }
}
