using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTipoProdutoCustoUnitario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "custo_unitario",
                schema: "producao",
                table: "produtos",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "tipo",
                schema: "producao",
                table: "produtos",
                type: "integer",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "custo_unitario",
                schema: "producao",
                table: "produtos");

            migrationBuilder.DropColumn(
                name: "tipo",
                schema: "producao",
                table: "produtos");
        }
    }
}
