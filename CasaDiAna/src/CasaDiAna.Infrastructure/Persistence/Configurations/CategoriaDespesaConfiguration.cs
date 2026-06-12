using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class CategoriaDespesaConfiguration : IEntityTypeConfiguration<CategoriaDespesa>
{
    public void Configure(EntityTypeBuilder<CategoriaDespesa> builder)
    {
        builder.ToTable("categorias_despesa", "financeiro");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.Nome).HasColumnName("nome").HasMaxLength(100).IsRequired();
        builder.Property(c => c.Tipo).HasColumnName("tipo").HasConversion<int>().IsRequired();
        builder.Property(c => c.EhFolhaPagamento).HasColumnName("eh_folha_pagamento").IsRequired();
        builder.Property(c => c.Ativo).HasColumnName("ativo").IsRequired();
        builder.Property(c => c.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(c => c.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(c => c.CriadoPor).HasColumnName("criado_por").IsRequired();
        builder.Property(c => c.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();

        builder.HasIndex(c => c.Nome).HasDatabaseName("ix_categorias_despesa_nome");
    }
}
