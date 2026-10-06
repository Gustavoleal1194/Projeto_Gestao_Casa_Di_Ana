using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class UtensilioConfiguration : IEntityTypeConfiguration<Utensilio>
{
    public void Configure(EntityTypeBuilder<Utensilio> builder)
    {
        builder.HasKey(u => u.Id);
        builder.ToTable("utensilios", "estoque", t =>
        {
            t.HasCheckConstraint("chk_utensilio_estoque_atual_nao_negativo", "estoque_atual >= 0");
            t.HasCheckConstraint("chk_utensilio_estoque_minimo_nao_negativo", "estoque_minimo >= 0");
        });

        builder.Property(u => u.Id).HasColumnName("id");
        builder.Property(u => u.Nome).HasColumnName("nome").HasMaxLength(150).IsRequired();
        builder.Property(u => u.CodigoInterno).HasColumnName("codigo_interno").HasMaxLength(30);
        builder.HasIndex(u => u.CodigoInterno).IsUnique()
            .HasFilter("codigo_interno IS NOT NULL");
        builder.Property(u => u.CategoriaUtensilioId).HasColumnName("categoria_utensilio_id");
        builder.Property(u => u.UnidadeMedidaId).HasColumnName("unidade_medida_id").IsRequired();
        builder.Property(u => u.EstoqueAtual).HasColumnName("estoque_atual").HasPrecision(15, 4).IsRequired();
        builder.Property(u => u.EstoqueMinimo).HasColumnName("estoque_minimo").HasPrecision(15, 4).IsRequired();
        builder.Property(u => u.EstoqueMaximo).HasColumnName("estoque_maximo").HasPrecision(15, 4);
        builder.Property(u => u.CustoUnitario).HasColumnName("custo_unitario").HasPrecision(15, 4);
        builder.Property(u => u.Ativo).HasColumnName("ativo").IsRequired();
        builder.Property(u => u.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(u => u.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(u => u.CriadoPor).HasColumnName("criado_por").IsRequired();
        builder.Property(u => u.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();

        builder.HasOne(u => u.UnidadeMedida)
            .WithMany()
            .HasForeignKey(u => u.UnidadeMedidaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(u => u.Categoria)
            .WithMany()
            .HasForeignKey(u => u.CategoriaUtensilioId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(u => new { u.CategoriaUtensilioId, u.Nome });
        builder.HasIndex(u => new { u.EstoqueAtual, u.EstoqueMinimo })
            .HasFilter("ativo = TRUE");
    }
}
