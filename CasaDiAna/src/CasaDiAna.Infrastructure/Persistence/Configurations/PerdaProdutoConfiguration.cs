using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class PerdaProdutoConfiguration : IEntityTypeConfiguration<PerdaProduto>
{
    public void Configure(EntityTypeBuilder<PerdaProduto> builder)
    {
        builder.ToTable("perdas_produto", "producao");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id");
        builder.Property(p => p.ProdutoId).HasColumnName("produto_id").IsRequired();
        builder.Property(p => p.Data).HasColumnName("data").IsRequired();
        builder.Property(p => p.Quantidade)
            .HasColumnName("quantidade")
            .HasPrecision(15, 4)
            .IsRequired();
        builder.Property(p => p.Justificativa)
            .HasColumnName("justificativa")
            .HasMaxLength(500)
            .IsRequired();
        builder.Property(p => p.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(p => p.CriadoPor).HasColumnName("criado_por").IsRequired();

        builder.HasOne(p => p.Produto)
            .WithMany()
            .HasForeignKey(p => p.ProdutoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => new { p.ProdutoId, p.Data });
        builder.HasIndex(p => p.Data);
    }
}
