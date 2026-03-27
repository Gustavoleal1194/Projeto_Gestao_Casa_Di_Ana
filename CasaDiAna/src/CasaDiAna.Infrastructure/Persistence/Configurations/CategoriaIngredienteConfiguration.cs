using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class CategoriaIngredienteConfiguration : IEntityTypeConfiguration<CategoriaIngrediente>
{
    public void Configure(EntityTypeBuilder<CategoriaIngrediente> builder)
    {
        builder.ToTable("categorias_ingrediente", "estoque");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.Nome).HasColumnName("nome").HasMaxLength(100).IsRequired();
        builder.HasIndex(c => c.Nome).IsUnique();
        builder.Property(c => c.Ativo).HasColumnName("ativo").IsRequired();
        builder.Property(c => c.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(c => c.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(c => c.CriadoPor).HasColumnName("criado_por").IsRequired();
        builder.Property(c => c.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();
    }
}
