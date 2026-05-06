using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class IngredienteConfiguration : IEntityTypeConfiguration<Ingrediente>
{
    public void Configure(EntityTypeBuilder<Ingrediente> builder)
    {
        builder.HasKey(i => i.Id);
        builder.ToTable("ingredientes", "estoque", t =>
        {
            t.HasCheckConstraint("chk_estoque_atual_nao_negativo", "estoque_atual >= 0");
            t.HasCheckConstraint("chk_estoque_minimo_nao_negativo", "estoque_minimo >= 0");
        });

        builder.Property(i => i.Id).HasColumnName("id");
        builder.Property(i => i.Nome).HasColumnName("nome").HasMaxLength(150).IsRequired();
        builder.Property(i => i.CodigoInterno).HasColumnName("codigo_interno").HasMaxLength(30);
        builder.HasIndex(i => i.CodigoInterno).IsUnique()
            .HasFilter("codigo_interno IS NOT NULL");
        builder.Property(i => i.CategoriaId).HasColumnName("categoria_id");
        builder.Property(i => i.UnidadeMedidaId).HasColumnName("unidade_medida_id").IsRequired();
        builder.Property(i => i.EstoqueAtual).HasColumnName("estoque_atual").HasPrecision(15, 4).IsRequired();
        builder.Property(i => i.EstoqueMinimo).HasColumnName("estoque_minimo").HasPrecision(15, 4).IsRequired();
        builder.Property(i => i.EstoqueMaximo).HasColumnName("estoque_maximo").HasPrecision(15, 4);
        builder.Property(i => i.CustoUnitario).HasColumnName("custo_unitario").HasPrecision(15, 4);
        builder.Property(i => i.Observacoes).HasColumnName("observacoes");
        builder.Property(i => i.QuantidadeEmbalagem).HasColumnName("quantidade_embalagem").HasMaxLength(100);
        builder.Property(i => i.Ativo).HasColumnName("ativo").IsRequired();
        builder.Property(i => i.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(i => i.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(i => i.CriadoPor).HasColumnName("criado_por").IsRequired();
        builder.Property(i => i.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();

        builder.HasOne(i => i.UnidadeMedida)
            .WithMany()
            .HasForeignKey(i => i.UnidadeMedidaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Categoria)
            .WithMany()
            .HasForeignKey(i => i.CategoriaId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(i => new { i.CategoriaId, i.Nome });
        builder.HasIndex(i => new { i.EstoqueAtual, i.EstoqueMinimo })
            .HasFilter("ativo = TRUE");
    }
}
