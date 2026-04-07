using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCamposNutricionaisAnvisa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "acucares_adicionados",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "gorduras_trans",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "porcoes_por_embalagem",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "medida_caseira",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
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
