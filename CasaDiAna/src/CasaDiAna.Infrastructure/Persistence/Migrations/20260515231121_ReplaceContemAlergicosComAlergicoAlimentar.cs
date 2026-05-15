using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceContemAlergicosComAlergicoAlimentar : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "contem_alergicos",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");

            migrationBuilder.AddColumn<string>(
                name: "alergico_alimentar",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "alergico_alimentar",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");

            migrationBuilder.AddColumn<bool>(
                name: "contem_alergicos",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
