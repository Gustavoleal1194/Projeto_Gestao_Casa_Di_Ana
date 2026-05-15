using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAlergicosLoteToModeloNutricional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "contem_alergicos",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "contem_gluten",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "contem_lactose",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "lote_fabricacao",
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
                name: "contem_alergicos",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");

            migrationBuilder.DropColumn(
                name: "contem_gluten",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");

            migrationBuilder.DropColumn(
                name: "contem_lactose",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");

            migrationBuilder.DropColumn(
                name: "lote_fabricacao",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");
        }
    }
}
