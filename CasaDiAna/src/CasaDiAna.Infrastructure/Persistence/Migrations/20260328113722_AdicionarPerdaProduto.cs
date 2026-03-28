using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarPerdaProduto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "perdas_produto",
                schema: "producao",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    produto_id = table.Column<Guid>(type: "uuid", nullable: false),
                    data = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    quantidade = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false),
                    justificativa = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    criado_por = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_perdas_produto", x => x.id);
                    table.ForeignKey(
                        name: "FK_perdas_produto_produtos_produto_id",
                        column: x => x.produto_id,
                        principalSchema: "producao",
                        principalTable: "produtos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_perdas_produto_data",
                schema: "producao",
                table: "perdas_produto",
                column: "data");

            migrationBuilder.CreateIndex(
                name: "IX_perdas_produto_produto_id_data",
                schema: "producao",
                table: "perdas_produto",
                columns: new[] { "produto_id", "data" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "perdas_produto",
                schema: "producao");
        }
    }
}
