using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddHistoricoImpressaoEtiquetas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "historico_impressao_etiquetas",
                schema: "producao",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    produto_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tipo_etiqueta = table.Column<int>(type: "integer", nullable: false),
                    quantidade = table.Column<int>(type: "integer", nullable: false),
                    data_producao = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    impresso_por = table.Column<Guid>(type: "uuid", nullable: false),
                    impresso_em = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_historico_impressao_etiquetas", x => x.id);
                    table.ForeignKey(
                        name: "FK_historico_impressao_etiquetas_produtos_produto_id",
                        column: x => x.produto_id,
                        principalSchema: "producao",
                        principalTable: "produtos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_historico_impressao_etiquetas_impresso_em",
                schema: "producao",
                table: "historico_impressao_etiquetas",
                column: "impresso_em");

            migrationBuilder.CreateIndex(
                name: "ix_historico_impressao_etiquetas_produto_id",
                schema: "producao",
                table: "historico_impressao_etiquetas",
                column: "produto_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "historico_impressao_etiquetas",
                schema: "producao");
        }
    }
}
