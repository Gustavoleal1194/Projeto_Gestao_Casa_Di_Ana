using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class UnidadeMedidaConfiguration : IEntityTypeConfiguration<UnidadeMedida>
{
    public void Configure(EntityTypeBuilder<UnidadeMedida> builder)
    {
        builder.ToTable("unidades_medida", "estoque");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasColumnName("id");
        builder.Property(u => u.Codigo).HasColumnName("codigo").HasMaxLength(10).IsRequired();
        builder.HasIndex(u => u.Codigo).IsUnique();
        builder.Property(u => u.Descricao).HasColumnName("descricao").HasMaxLength(50).IsRequired();

        builder.HasData(
            new { Id = (short)1, Codigo = "KG",  Descricao = "Quilograma" },
            new { Id = (short)2, Codigo = "G",   Descricao = "Grama"      },
            new { Id = (short)3, Codigo = "L",   Descricao = "Litro"      },
            new { Id = (short)4, Codigo = "ML",  Descricao = "Mililitro"  },
            new { Id = (short)5, Codigo = "UN",  Descricao = "Unidade"    },
            new { Id = (short)6, Codigo = "CX",  Descricao = "Caixa"      },
            new { Id = (short)7, Codigo = "PCT", Descricao = "Pacote"     },
            new { Id = (short)8, Codigo = "DZ",  Descricao = "Dúzia"      }
        );
    }
}
