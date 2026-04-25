using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class EntradaMercadoriaConfiguration : IEntityTypeConfiguration<EntradaMercadoria>
{
    public void Configure(EntityTypeBuilder<EntradaMercadoria> builder)
    {
        builder.ToTable("entradas_mercadoria", "estoque");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.FornecedorId).HasColumnName("fornecedor_id").IsRequired();
        builder.Property(e => e.NumeroNotaFiscal).HasColumnName("numero_nota_fiscal").HasMaxLength(60);
        builder.Property(e => e.DataEntrada).HasColumnName("data_entrada").IsRequired();
        builder.Property(e => e.RecebidoPor).HasColumnName("recebido_por").HasMaxLength(100);
        builder.Property(e => e.Observacoes).HasColumnName("observacoes");
        builder.Property(e => e.Status)
            .HasColumnName("status")
            .HasConversion(s => s.ToString(), s => Enum.Parse<StatusEntrada>(s))
            .HasMaxLength(20)
            .IsRequired();
        builder.Property(e => e.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(e => e.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(e => e.CriadoPor).HasColumnName("criado_por").IsRequired();
        builder.Property(e => e.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();

        builder.HasOne(e => e.Fornecedor)
            .WithMany()
            .HasForeignKey(e => e.FornecedorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Itens)
            .WithOne()
            .HasForeignKey(i => i.EntradaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(e => e.Itens)
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasIndex(e => e.FornecedorId);
        builder.HasIndex(e => e.DataEntrada);
        builder.HasIndex(e => e.NumeroNotaFiscal)
            .HasFilter("numero_nota_fiscal IS NOT NULL");
    }
}
