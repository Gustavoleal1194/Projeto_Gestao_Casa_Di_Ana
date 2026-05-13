using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260407000000_AddCamposNutricionaisAnvisa")]
    public partial class AddCamposNutricionaisAnvisa : Migration
    {
        // Migration criada manualmente sem Designer.cs — atributo [Migration] adicionado aqui
        // para que o EF Core a reconheça e aplique via db.Database.Migrate().
        // Up() usa ADD COLUMN IF NOT EXISTS para ser idempotente em qualquer estado do banco.
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE producao.modelos_etiqueta_nutricional
                    ADD COLUMN IF NOT EXISTS acucares_adicionados  numeric(10,2) NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS gorduras_trans         numeric(10,2) NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS porcoes_por_embalagem  integer,
                    ADD COLUMN IF NOT EXISTS medida_caseira         character varying(100);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "acucares_adicionados",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");

            migrationBuilder.DropColumn(
                name: "gorduras_trans",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");

            migrationBuilder.DropColumn(
                name: "porcoes_por_embalagem",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");

            migrationBuilder.DropColumn(
                name: "medida_caseira",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");
        }
    }
}
