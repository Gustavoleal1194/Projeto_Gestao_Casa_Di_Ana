using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class ImportacaoVendasConfiguration : IEntityTypeConfiguration<ImportacaoVendas>
{
    public void Configure(EntityTypeBuilder<ImportacaoVendas> builder)
    {
        builder.ToTable("importacoes_vendas", "producao");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("id");
        builder.Property(i => i.NomeArquivo).HasColumnName("nome_arquivo").HasMaxLength(255).IsRequired();
        builder.Property(i => i.HashConteudo).HasColumnName("hash_conteudo").HasMaxLength(64).IsRequired();
        builder.HasIndex(i => i.HashConteudo).IsUnique();
        builder.Property(i => i.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(i => i.PeriodoDe).HasColumnName("periodo_de").HasMaxLength(10);
        builder.Property(i => i.PeriodoAte).HasColumnName("periodo_ate").HasMaxLength(10);
        builder.Property(i => i.TotalLinhasParseadas).HasColumnName("total_linhas_parseadas").IsRequired();
        builder.Property(i => i.TotalImportadas).HasColumnName("total_importadas").IsRequired();
        builder.Property(i => i.TotalIgnoradas).HasColumnName("total_ignoradas").IsRequired();
        builder.Property(i => i.TotalNaoEncontradas).HasColumnName("total_nao_encontradas").IsRequired();
        // Mesmo mapeamento de VendaDiaria.Data (sem HasColumnType), para os dois
        // filtros por data de venda se comportarem igual.
        builder.Property(i => i.DataVenda).HasColumnName("data_venda");
        builder.HasIndex(i => i.DataVenda);
        builder.Property(i => i.TotalTaxaServico).HasColumnName("total_taxa_servico").HasPrecision(12, 2).IsRequired();
        builder.Property(i => i.TotalEntregas).HasColumnName("total_entregas").HasPrecision(12, 2).IsRequired();
        builder.Property(i => i.PercentualRetencaoCasa).HasColumnName("percentual_retencao_casa").HasPrecision(6, 4).IsRequired();
        builder.Property(i => i.PercentualTaxaCartao).HasColumnName("percentual_taxa_cartao").HasPrecision(6, 4).IsRequired();
        builder.Ignore(i => i.RepasseEquipe);
        builder.Ignore(i => i.RepasseMotoboys);
        builder.Property(i => i.CriadoPor).HasColumnName("criado_por").IsRequired();
    }
}
