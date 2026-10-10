using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoverLoteFabricacaoModeloNutricional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "lote_fabricacao",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "lote_fabricacao",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }
    }
}
