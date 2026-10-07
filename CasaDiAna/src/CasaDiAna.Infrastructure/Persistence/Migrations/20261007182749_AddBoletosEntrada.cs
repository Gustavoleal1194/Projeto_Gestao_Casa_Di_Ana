using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBoletosEntrada : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "boletos_entrada",
                schema: "estoque",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    entrada_id = table.Column<Guid>(type: "uuid", nullable: false),
                    data_vencimento = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_boletos_entrada", x => x.id);
                    table.ForeignKey(
                        name: "FK_boletos_entrada_entradas_mercadoria_entrada_id",
                        column: x => x.entrada_id,
                        principalSchema: "estoque",
                        principalTable: "entradas_mercadoria",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_boletos_entrada_data_vencimento",
                schema: "estoque",
                table: "boletos_entrada",
                column: "data_vencimento");

            migrationBuilder.CreateIndex(
                name: "IX_boletos_entrada_entrada_id",
                schema: "estoque",
                table: "boletos_entrada",
                column: "entrada_id");

            migrationBuilder.Sql(@"
                INSERT INTO estoque.boletos_entrada (id, entrada_id, data_vencimento)
                SELECT gen_random_uuid(), id, data_vencimento_boleto
                FROM estoque.entradas_mercadoria
                WHERE tem_boleto = true AND data_vencimento_boleto IS NOT NULL;
            ");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.Sql(@"
                UPDATE estoque.entradas_mercadoria e
                SET tem_boleto = true,
                    data_vencimento_boleto = (
                        SELECT MIN(b.data_vencimento)
                        FROM estoque.boletos_entrada b
                        WHERE b.entrada_id = e.id
                    )
                WHERE EXISTS (
                    SELECT 1 FROM estoque.boletos_entrada b WHERE b.entrada_id = e.id
                );
            ");

            migrationBuilder.DropTable(
                name: "boletos_entrada",
                schema: "estoque");
        }
    }
}
