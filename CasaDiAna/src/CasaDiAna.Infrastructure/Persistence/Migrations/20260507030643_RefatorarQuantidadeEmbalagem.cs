using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RefatorarQuantidadeEmbalagem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "quantidade_embalagem",
                schema: "estoque",
                table: "ingredientes");

            migrationBuilder.AddColumn<decimal>(
                name: "quantidade_embalagem_valor",
                schema: "estoque",
                table: "ingredientes",
                type: "numeric(15,4)",
                precision: 15,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "unidade_embalagem",
                schema: "estoque",
                table: "ingredientes",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "quantidade_embalagem_valor",
                schema: "estoque",
                table: "ingredientes");

            migrationBuilder.DropColumn(
                name: "unidade_embalagem",
                schema: "estoque",
                table: "ingredientes");

            migrationBuilder.AddColumn<string>(
                name: "quantidade_embalagem",
                schema: "estoque",
                table: "ingredientes",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }
    }
}
