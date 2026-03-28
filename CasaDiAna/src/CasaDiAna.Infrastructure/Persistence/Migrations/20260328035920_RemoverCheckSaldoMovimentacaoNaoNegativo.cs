using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoverCheckSaldoMovimentacaoNaoNegativo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE estoque.movimentacoes DROP CONSTRAINT IF EXISTS chk_mov_saldo_nao_negativo;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE estoque.movimentacoes ADD CONSTRAINT chk_mov_saldo_nao_negativo CHECK (saldo_apos >= 0);");
        }
    }
}
