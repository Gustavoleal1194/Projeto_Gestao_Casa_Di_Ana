using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class FornecedorConfiguration : IEntityTypeConfiguration<Fornecedor>
{
    public void Configure(EntityTypeBuilder<Fornecedor> builder)
    {
        builder.HasKey(f => f.Id);
        builder.ToTable("fornecedores", "estoque", t =>
        {
            t.HasCheckConstraint("chk_cnpj_formato", "cnpj IS NULL OR cnpj ~ '^[0-9]{14}$'");
        });

        builder.Property(f => f.Id).HasColumnName("id");
        builder.Property(f => f.RazaoSocial).HasColumnName("razao_social").HasMaxLength(200).IsRequired();
        builder.Property(f => f.NomeFantasia).HasColumnName("nome_fantasia").HasMaxLength(200);
        builder.Property(f => f.Cnpj).HasColumnName("cnpj").HasMaxLength(14).IsFixedLength();
        builder.HasIndex(f => f.Cnpj).IsUnique().HasFilter("cnpj IS NOT NULL");
        builder.Property(f => f.Telefone).HasColumnName("telefone").HasMaxLength(20);
        builder.Property(f => f.Email).HasColumnName("email").HasMaxLength(254);
        builder.Property(f => f.ContatoNome).HasColumnName("contato_nome").HasMaxLength(150);
        builder.Property(f => f.Observacoes).HasColumnName("observacoes");
        builder.Property(f => f.Ativo).HasColumnName("ativo").IsRequired();
        builder.Property(f => f.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(f => f.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(f => f.CriadoPor).HasColumnName("criado_por").IsRequired();
        builder.Property(f => f.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();

        builder.HasIndex(f => f.RazaoSocial);
        builder.HasIndex(f => f.Ativo);
    }
}
