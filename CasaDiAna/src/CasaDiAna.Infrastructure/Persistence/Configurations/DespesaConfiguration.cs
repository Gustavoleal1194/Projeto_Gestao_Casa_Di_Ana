using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class DespesaConfiguration : IEntityTypeConfiguration<Despesa>
{
    public void Configure(EntityTypeBuilder<Despesa> builder)
    {
        builder.ToTable("despesas", "financeiro");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasColumnName("id");
        builder.Property(d => d.Competencia).HasColumnName("competencia").IsRequired();
        builder.Property(d => d.CategoriaDespesaId).HasColumnName("categoria_despesa_id").IsRequired();
        builder.Property(d => d.Descricao).HasColumnName("descricao").HasMaxLength(200);
        builder.Property(d => d.Valor).HasColumnName("valor").HasPrecision(15, 2).IsRequired();
        builder.Property(d => d.Observacao).HasColumnName("observacao").HasMaxLength(500);
        builder.Property(d => d.DataLancamento).HasColumnName("data_lancamento").IsRequired();
        builder.Property(d => d.Ativo).HasColumnName("ativo").IsRequired();
        builder.Property(d => d.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(d => d.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(d => d.CriadoPor).HasColumnName("criado_por").IsRequired();
        builder.Property(d => d.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();

        builder.HasOne(d => d.Categoria)
            .WithMany()
            .HasForeignKey(d => d.CategoriaDespesaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(d => d.Competencia).HasDatabaseName("ix_despesas_competencia");
        builder.HasIndex(d => d.CategoriaDespesaId).HasDatabaseName("ix_despesas_categoria_despesa_id");
    }
}
