using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class ConfiguracaoRepasseConfiguration : IEntityTypeConfiguration<ConfiguracaoRepasse>
{
    public void Configure(EntityTypeBuilder<ConfiguracaoRepasse> builder)
    {
        builder.ToTable("configuracao_repasse", "financeiro");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.PercentualRetencaoCasa).HasColumnName("percentual_retencao_casa").HasPrecision(6, 4).IsRequired();
        builder.Property(c => c.PercentualTaxaCartao).HasColumnName("percentual_taxa_cartao").HasPrecision(6, 4).IsRequired();
        builder.Property(c => c.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();
        builder.Property(c => c.AtualizadoPor).HasColumnName("atualizado_por").IsRequired();
    }
}
