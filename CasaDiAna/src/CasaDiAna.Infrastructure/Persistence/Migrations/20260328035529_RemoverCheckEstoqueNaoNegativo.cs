using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoverCheckEstoqueNaoNegativo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE estoque.ingredientes DROP CONSTRAINT IF EXISTS chk_estoque_atual_nao_negativo;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE estoque.ingredientes ADD CONSTRAINT chk_estoque_atual_nao_negativo CHECK (estoque_atual >= 0);");
        }
    }
}
