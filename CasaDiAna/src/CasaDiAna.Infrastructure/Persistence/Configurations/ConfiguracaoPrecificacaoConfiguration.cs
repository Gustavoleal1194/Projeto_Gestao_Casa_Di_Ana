using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class ConfiguracaoPrecificacaoConfiguration : IEntityTypeConfiguration<ConfiguracaoPrecificacao>
{
    public void Configure(EntityTypeBuilder<ConfiguracaoPrecificacao> builder)
    {
        builder.ToTable("configuracao_precificacao", "financeiro");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.CmvAlvo).HasColumnName("cmv_alvo").HasPrecision(6, 4).IsRequired();
        builder.Property(c => c.MargemDesejada).HasColumnName("margem_desejada").HasPrecision(6, 4).IsRequired();
        builder.Property(c => c.Taxas).HasColumnName("taxas").HasPrecision(6, 4).IsRequired();
        builder.Property(c => c.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(c => c.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();
    }
}
