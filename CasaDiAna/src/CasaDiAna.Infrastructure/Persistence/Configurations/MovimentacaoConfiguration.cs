using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class MovimentacaoConfiguration : IEntityTypeConfiguration<Movimentacao>
{
    public void Configure(EntityTypeBuilder<Movimentacao> builder)
    {
        builder.HasKey(m => m.Id);
        builder.ToTable("movimentacoes", "estoque", t =>
        {
            t.HasCheckConstraint("chk_mov_quantidade_positiva", "quantidade > 0");
            t.HasCheckConstraint("chk_mov_saldo_nao_negativo", "saldo_apos >= 0");
        });

        builder.Property(m => m.Id).HasColumnName("id");
        builder.Property(m => m.IngredienteId).HasColumnName("ingrediente_id").IsRequired();
        builder.Property(m => m.Tipo)
            .HasColumnName("tipo")
            .HasConversion(t => t.ToString(), s => Enum.Parse<TipoMovimentacao>(s))
            .HasMaxLength(30)
            .IsRequired();
        builder.Property(m => m.Quantidade).HasColumnName("quantidade").HasPrecision(15, 4).IsRequired();
        builder.Property(m => m.SaldoApos).HasColumnName("saldo_apos").HasPrecision(15, 4).IsRequired();
        builder.Property(m => m.ReferenciaTipo).HasColumnName("referencia_tipo").HasMaxLength(50);
        builder.Property(m => m.ReferenciaId).HasColumnName("referencia_id");
        builder.Property(m => m.Observacoes).HasColumnName("observacoes");
        builder.Property(m => m.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(m => m.CriadoPor).HasColumnName("criado_por").IsRequired();

        builder.HasOne(m => m.Ingrediente)
            .WithMany()
            .HasForeignKey(m => m.IngredienteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(m => m.IngredienteId);
        builder.HasIndex(m => m.CriadoEm);
        builder.HasIndex(m => m.Tipo);
        builder.HasIndex(m => new { m.ReferenciaTipo, m.ReferenciaId })
            .HasFilter("referencia_id IS NOT NULL");
    }
}
