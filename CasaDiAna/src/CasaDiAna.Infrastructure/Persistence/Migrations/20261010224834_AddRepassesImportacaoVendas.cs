using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRepassesImportacaoVendas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "data_venda",
                schema: "producao",
                table: "importacoes_vendas",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "percentual_retencao_casa",
                schema: "producao",
                table: "importacoes_vendas",
                type: "numeric(6,4)",
                precision: 6,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "percentual_taxa_cartao",
                schema: "producao",
                table: "importacoes_vendas",
                type: "numeric(6,4)",
                precision: 6,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "total_entregas",
                schema: "producao",
                table: "importacoes_vendas",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "total_taxa_servico",
                schema: "producao",
                table: "importacoes_vendas",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "configuracao_repasse",
                schema: "financeiro",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    percentual_retencao_casa = table.Column<decimal>(type: "numeric(6,4)", precision: 6, scale: 4, nullable: false),
                    percentual_taxa_cartao = table.Column<decimal>(type: "numeric(6,4)", precision: 6, scale: 4, nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    atualizado_por = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_configuracao_repasse", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_importacoes_vendas_data_venda",
                schema: "producao",
                table: "importacoes_vendas",
                column: "data_venda");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "configuracao_repasse",
                schema: "financeiro");

            migrationBuilder.DropIndex(
                name: "IX_importacoes_vendas_data_venda",
                schema: "producao",
                table: "importacoes_vendas");

            migrationBuilder.DropColumn(
                name: "data_venda",
                schema: "producao",
                table: "importacoes_vendas");

            migrationBuilder.DropColumn(
                name: "percentual_retencao_casa",
                schema: "producao",
                table: "importacoes_vendas");

            migrationBuilder.DropColumn(
                name: "percentual_taxa_cartao",
                schema: "producao",
                table: "importacoes_vendas");

            migrationBuilder.DropColumn(
                name: "total_entregas",
                schema: "producao",
                table: "importacoes_vendas");

            migrationBuilder.DropColumn(
                name: "total_taxa_servico",
                schema: "producao",
                table: "importacoes_vendas");
        }
    }
}
