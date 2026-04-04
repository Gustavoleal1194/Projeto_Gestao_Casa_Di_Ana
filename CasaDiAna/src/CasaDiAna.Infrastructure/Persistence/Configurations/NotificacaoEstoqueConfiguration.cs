using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class NotificacaoEstoqueConfiguration : IEntityTypeConfiguration<NotificacaoEstoque>
{
    public void Configure(EntityTypeBuilder<NotificacaoEstoque> builder)
    {
        builder.ToTable("notificacoes_estoque", "estoque");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.Id)
               .HasColumnName("id");

        builder.Property(n => n.Titulo)
               .HasColumnName("titulo")
               .HasMaxLength(200)
               .IsRequired();

        builder.Property(n => n.Mensagem)
               .HasColumnName("mensagem")
               .HasMaxLength(1000)
               .IsRequired();

        builder.Property(n => n.Tipo)
               .HasColumnName("tipo")
               .IsRequired();

        builder.Property(n => n.DataCriacao)
               .HasColumnName("data_criacao")
               .IsRequired();

        builder.Property(n => n.Lida)
               .HasColumnName("lida")
               .IsRequired();

        builder.Property(n => n.IngredienteId)
               .HasColumnName("ingrediente_id")
               .IsRequired();

        builder.HasOne(n => n.Ingrediente)
               .WithMany()
               .HasForeignKey(n => n.IngredienteId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(n => new { n.IngredienteId, n.Lida })
               .HasDatabaseName("ix_notificacoes_estoque_ingrediente_lida");

        builder.HasIndex(n => n.DataCriacao)
               .HasDatabaseName("ix_notificacoes_estoque_data_criacao");
    }
}
