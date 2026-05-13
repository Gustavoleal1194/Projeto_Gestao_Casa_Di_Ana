using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVdCamposModeloNutricional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "vd_acucares_adicionados",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "vd_carboidratos",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "vd_fibra_alimentar",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "vd_gorduras_saturadas",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "vd_gorduras_totais",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "vd_gorduras_trans",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "vd_proteinas",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "vd_sodio",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "vd_valor_energetico",
                schema: "producao",
                table: "modelos_etiqueta_nutricional",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "vd_acucares_adicionados",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");

            migrationBuilder.DropColumn(
                name: "vd_carboidratos",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");

            migrationBuilder.DropColumn(
                name: "vd_fibra_alimentar",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");

            migrationBuilder.DropColumn(
                name: "vd_gorduras_saturadas",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");

            migrationBuilder.DropColumn(
                name: "vd_gorduras_totais",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");

            migrationBuilder.DropColumn(
                name: "vd_gorduras_trans",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");

            migrationBuilder.DropColumn(
                name: "vd_proteinas",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");

            migrationBuilder.DropColumn(
                name: "vd_sodio",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");

            migrationBuilder.DropColumn(
                name: "vd_valor_energetico",
                schema: "producao",
                table: "modelos_etiqueta_nutricional");
        }
    }
}
