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
        builder.Property(i => i.CriadoPor).HasColumnName("criado_por").IsRequired();
    }
}
