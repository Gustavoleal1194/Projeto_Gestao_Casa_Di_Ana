using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificacoesEstoque : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "notificacoes_estoque",
                schema: "estoque",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    titulo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    mensagem = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    tipo = table.Column<int>(type: "integer", nullable: false),
                    data_criacao = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    lida = table.Column<bool>(type: "boolean", nullable: false),
                    ingrediente_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notificacoes_estoque", x => x.id);
                    table.ForeignKey(
                        name: "FK_notificacoes_estoque_ingredientes_ingrediente_id",
                        column: x => x.ingrediente_id,
                        principalSchema: "estoque",
                        principalTable: "ingredientes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_notificacoes_estoque_data_criacao",
                schema: "estoque",
                table: "notificacoes_estoque",
                column: "data_criacao");

            migrationBuilder.CreateIndex(
                name: "ix_notificacoes_estoque_ingrediente_lida",
                schema: "estoque",
                table: "notificacoes_estoque",
                columns: new[] { "ingrediente_id", "lida" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "notificacoes_estoque",
                schema: "estoque");
        }
    }
}
