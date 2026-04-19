using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("usuarios", "auth");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasColumnName("id");
        builder.Property(u => u.Nome).HasColumnName("nome").HasMaxLength(150).IsRequired();
        builder.Property(u => u.Email).HasColumnName("email").HasMaxLength(254).IsRequired();
        builder.HasIndex(u => u.Email).IsUnique();
        builder.Property(u => u.SenhaHash).HasColumnName("senha_hash").IsRequired();
        builder.Property(u => u.Papel)
            .HasColumnName("papel")
            .HasConversion(p => p.ToString(), s => Enum.Parse<PapelUsuario>(s))
            .HasMaxLength(50)
            .IsRequired();
        builder.Property(u => u.Ativo).HasColumnName("ativo").IsRequired();
        builder.Property(u => u.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(u => u.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();

        builder.Property(u => u.Telefone).HasColumnName("telefone").HasMaxLength(20);
        builder.Property(u => u.TwoFactorHabilitado)
            .HasColumnName("two_factor_habilitado")
            .IsRequired()
            .HasDefaultValue(false);
        builder.Property(u => u.CodigoOtpHash).HasColumnName("codigo_otp_hash");
        builder.Property(u => u.CodigoOtpExpiraEm).HasColumnName("codigo_otp_expira_em").HasColumnType("timestamptz");
        builder.Property(u => u.CodigoOtpTentativas)
            .HasColumnName("codigo_otp_tentativas")
            .IsRequired()
            .HasDefaultValue(0);
    }
}
