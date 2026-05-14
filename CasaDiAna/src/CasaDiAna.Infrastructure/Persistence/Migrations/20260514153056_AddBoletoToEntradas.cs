using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBoletoToEntradas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "data_vencimento_boleto",
                schema: "estoque",
                table: "entradas_mercadoria",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "tem_boleto",
                schema: "estoque",
                table: "entradas_mercadoria",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_entradas_mercadoria_data_vencimento_boleto",
                schema: "estoque",
                table: "entradas_mercadoria",
                column: "data_vencimento_boleto",
                filter: "data_vencimento_boleto IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_entradas_mercadoria_data_vencimento_boleto",
                schema: "estoque",
                table: "entradas_mercadoria");

            migrationBuilder.DropColumn(
                name: "data_vencimento_boleto",
                schema: "estoque",
                table: "entradas_mercadoria");

            migrationBuilder.DropColumn(
                name: "tem_boleto",
                schema: "estoque",
                table: "entradas_mercadoria");
        }
    }
}
