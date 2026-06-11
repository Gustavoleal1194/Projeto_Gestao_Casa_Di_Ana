using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddConfiguracaoPrecificacao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "configuracao_precificacao",
                schema: "financeiro",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    cmv_alvo = table.Column<decimal>(type: "numeric(6,4)", precision: 6, scale: 4, nullable: false),
                    margem_desejada = table.Column<decimal>(type: "numeric(6,4)", precision: 6, scale: 4, nullable: false),
                    taxas = table.Column<decimal>(type: "numeric(6,4)", precision: 6, scale: 4, nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    atualizado_por = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_configuracao_precificacao", x => x.id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "configuracao_precificacao",
                schema: "financeiro");
        }
    }
}
