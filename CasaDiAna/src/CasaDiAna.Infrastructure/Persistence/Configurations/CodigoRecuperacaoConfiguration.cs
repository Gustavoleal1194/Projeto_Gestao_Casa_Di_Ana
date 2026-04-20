// src/CasaDiAna.Infrastructure/Persistence/Configurations/CodigoRecuperacaoConfiguration.cs
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class CodigoRecuperacaoConfiguration : IEntityTypeConfiguration<CodigoRecuperacao>
{
    public void Configure(EntityTypeBuilder<CodigoRecuperacao> builder)
    {
        builder.ToTable("codigos_recuperacao", "auth");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.UsuarioId).HasColumnName("usuario_id").IsRequired();
        builder.Property(c => c.CodigoHash).HasColumnName("codigo_hash").IsRequired();
        builder.Property(c => c.UsadoEm).HasColumnName("usado_em").HasColumnType("timestamptz");
        builder.Property(c => c.CriadoEm).HasColumnName("criado_em").HasColumnType("timestamptz").IsRequired();

        builder.HasIndex(c => c.UsuarioId);
    }
}
