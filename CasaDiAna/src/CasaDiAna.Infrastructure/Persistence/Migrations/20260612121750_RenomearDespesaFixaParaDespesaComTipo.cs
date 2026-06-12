using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenomearDespesaFixaParaDespesaComTipo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameTable(
                name: "despesas_fixas", schema: "financeiro",
                newName: "despesas", newSchema: "financeiro");

            migrationBuilder.RenameIndex(
                name: "ix_despesas_fixas_competencia", schema: "financeiro",
                table: "despesas", newName: "ix_despesas_competencia");

            migrationBuilder.AddColumn<int>(
                name: "tipo", schema: "financeiro", table: "despesas",
                type: "integer", nullable: false, defaultValue: 1); // 1 = Fixa (backfill)
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "tipo", schema: "financeiro", table: "despesas");

            migrationBuilder.RenameIndex(
                name: "ix_despesas_competencia", schema: "financeiro",
                table: "despesas", newName: "ix_despesas_fixas_competencia");

            migrationBuilder.RenameTable(
                name: "despesas", schema: "financeiro",
                newName: "despesas_fixas", newSchema: "financeiro");
        }
    }
}
