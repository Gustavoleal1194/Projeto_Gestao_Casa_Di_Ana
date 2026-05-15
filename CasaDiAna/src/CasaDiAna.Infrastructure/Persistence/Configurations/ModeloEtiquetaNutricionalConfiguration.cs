using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class ModeloEtiquetaNutricionalConfiguration
    : IEntityTypeConfiguration<ModeloEtiquetaNutricional>
{
    public void Configure(EntityTypeBuilder<ModeloEtiquetaNutricional> builder)
    {
        builder.ToTable("modelos_etiqueta_nutricional", "producao");

        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasColumnName("id");
        builder.Property(m => m.ProdutoId).HasColumnName("produto_id").IsRequired();
        builder.Property(m => m.Porcao).HasColumnName("porcao").HasMaxLength(50).IsRequired();
        builder.Property(m => m.ValorEnergeticoKcal).HasColumnName("valor_energetico_kcal").HasPrecision(10, 2).IsRequired();
        builder.Property(m => m.ValorEnergeticoKJ).HasColumnName("valor_energetico_kj").HasPrecision(10, 2).IsRequired();
        builder.Property(m => m.Carboidratos).HasColumnName("carboidratos").HasPrecision(10, 2).IsRequired();
        builder.Property(m => m.AcucaresTotais).HasColumnName("acucares_totais").HasPrecision(10, 2).IsRequired();
        builder.Property(m => m.AcucaresAdicionados).HasColumnName("acucares_adicionados").HasPrecision(10, 2).IsRequired();
        builder.Property(m => m.Proteinas).HasColumnName("proteinas").HasPrecision(10, 2).IsRequired();
        builder.Property(m => m.GordurasTotais).HasColumnName("gorduras_totais").HasPrecision(10, 2).IsRequired();
        builder.Property(m => m.GordurasSaturadas).HasColumnName("gorduras_saturadas").HasPrecision(10, 2).IsRequired();
        builder.Property(m => m.GordurasTrans).HasColumnName("gorduras_trans").HasPrecision(10, 2).IsRequired();
        builder.Property(m => m.FibraAlimentar).HasColumnName("fibra_alimentar").HasPrecision(10, 2).IsRequired();
        builder.Property(m => m.Sodio).HasColumnName("sodio").HasPrecision(10, 2).IsRequired();
        builder.Property(m => m.PorcoesPorEmbalagem).HasColumnName("porcoes_por_embalagem");
        builder.Property(m => m.MedidaCaseira).HasColumnName("medida_caseira").HasMaxLength(100);

        builder.Property(m => m.VdValorEnergetico).HasColumnName("vd_valor_energetico").HasMaxLength(20);
        builder.Property(m => m.VdCarboidratos).HasColumnName("vd_carboidratos").HasMaxLength(20);
        builder.Property(m => m.VdAcucaresAdicionados).HasColumnName("vd_acucares_adicionados").HasMaxLength(20);
        builder.Property(m => m.VdProteinas).HasColumnName("vd_proteinas").HasMaxLength(20);
        builder.Property(m => m.VdGordurasTotais).HasColumnName("vd_gorduras_totais").HasMaxLength(20);
        builder.Property(m => m.VdGordurasSaturadas).HasColumnName("vd_gorduras_saturadas").HasMaxLength(20);
        builder.Property(m => m.VdGordurasTrans).HasColumnName("vd_gorduras_trans").HasMaxLength(20);
        builder.Property(m => m.VdFibraAlimentar).HasColumnName("vd_fibra_alimentar").HasMaxLength(20);
        builder.Property(m => m.VdSodio).HasColumnName("vd_sodio").HasMaxLength(20);

        builder.Property(m => m.Nome).HasColumnName("nome").HasMaxLength(100);
        builder.Property(m => m.ContemAlergicos).HasColumnName("contem_alergicos").IsRequired().HasDefaultValue(false);
        builder.Property(m => m.ContemGluten).HasColumnName("contem_gluten").IsRequired().HasDefaultValue(false);
        builder.Property(m => m.ContemLactose).HasColumnName("contem_lactose").IsRequired().HasDefaultValue(false);
        builder.Property(m => m.LoteFabricacao).HasColumnName("lote_fabricacao").HasMaxLength(100);

        builder.Property(m => m.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(m => m.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();

        builder.HasOne(m => m.Produto)
               .WithMany()
               .HasForeignKey(m => m.ProdutoId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(m => m.ProdutoId)
               .IsUnique()
               .HasDatabaseName("ix_modelos_etiqueta_nutricional_produto_id");
    }
}
