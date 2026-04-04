using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class ProdutoConfiguration : IEntityTypeConfiguration<Produto>
{
    public void Configure(EntityTypeBuilder<Produto> builder)
    {
        builder.ToTable("produtos", "producao");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id");
        builder.Property(p => p.Nome).HasColumnName("nome").HasMaxLength(150).IsRequired();
        builder.HasIndex(p => p.Nome).IsUnique();
        builder.Property(p => p.CategoriaProdutoId).HasColumnName("categoria_produto_id");
        builder.Property(p => p.Descricao).HasColumnName("descricao");
        builder.Property(p => p.PrecoVenda).HasColumnName("preco_venda").HasPrecision(15, 2).IsRequired();
        builder.Property(p => p.DiasValidade).HasColumnName("dias_validade");
        builder.Property(p => p.Ativo).HasColumnName("ativo").IsRequired();
        builder.Property(p => p.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(p => p.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(p => p.CriadoPor).HasColumnName("criado_por").IsRequired();
        builder.Property(p => p.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();

        builder.HasOne(p => p.Categoria)
            .WithMany()
            .HasForeignKey(p => p.CategoriaProdutoId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(p => p.ItensFicha)
            .WithOne()
            .HasForeignKey(i => i.ProdutoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(p => p.ItensFicha)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
