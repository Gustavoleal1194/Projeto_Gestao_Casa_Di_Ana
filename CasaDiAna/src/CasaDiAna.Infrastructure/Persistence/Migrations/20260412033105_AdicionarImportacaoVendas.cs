using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarImportacaoVendas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "importacoes_vendas",
                schema: "producao",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome_arquivo = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    hash_conteudo = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    periodo_de = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    periodo_ate = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    total_linhas_parseadas = table.Column<int>(type: "integer", nullable: false),
                    total_importadas = table.Column<int>(type: "integer", nullable: false),
                    total_ignoradas = table.Column<int>(type: "integer", nullable: false),
                    total_nao_encontradas = table.Column<int>(type: "integer", nullable: false),
                    criado_por = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_importacoes_vendas", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_importacoes_vendas_hash_conteudo",
                schema: "producao",
                table: "importacoes_vendas",
                column: "hash_conteudo",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "importacoes_vendas",
                schema: "producao");
        }
    }
}
