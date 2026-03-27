using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddModuloProducao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "producao");

            migrationBuilder.AlterColumn<DateTime>(
                name: "criado_em",
                schema: "auth",
                table: "usuarios",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "atualizado_em",
                schema: "auth",
                table: "usuarios",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "criado_em",
                schema: "estoque",
                table: "movimentacoes",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "finalizado_em",
                schema: "estoque",
                table: "inventarios",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "data_realizacao",
                schema: "estoque",
                table: "inventarios",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "criado_em",
                schema: "estoque",
                table: "inventarios",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "atualizado_em",
                schema: "estoque",
                table: "inventarios",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "criado_em",
                schema: "estoque",
                table: "ingredientes",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "atualizado_em",
                schema: "estoque",
                table: "ingredientes",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddColumn<decimal>(
                name: "custo_unitario",
                schema: "estoque",
                table: "ingredientes",
                type: "numeric(15,4)",
                precision: 15,
                scale: 4,
                nullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "criado_em",
                schema: "estoque",
                table: "fornecedores",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "atualizado_em",
                schema: "estoque",
                table: "fornecedores",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "data_entrada",
                schema: "estoque",
                table: "entradas_mercadoria",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "criado_em",
                schema: "estoque",
                table: "entradas_mercadoria",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "atualizado_em",
                schema: "estoque",
                table: "entradas_mercadoria",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "criado_em",
                schema: "estoque",
                table: "categorias_ingrediente",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "atualizado_em",
                schema: "estoque",
                table: "categorias_ingrediente",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.CreateTable(
                name: "categorias_produto",
                schema: "producao",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    criado_por = table.Column<Guid>(type: "uuid", nullable: false),
                    atualizado_por = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_categorias_produto", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "produtos",
                schema: "producao",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    categoria_produto_id = table.Column<Guid>(type: "uuid", nullable: true),
                    descricao = table.Column<string>(type: "text", nullable: true),
                    preco_venda = table.Column<decimal>(type: "numeric(15,2)", precision: 15, scale: 2, nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    criado_por = table.Column<Guid>(type: "uuid", nullable: false),
                    atualizado_por = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_produtos", x => x.id);
                    table.ForeignKey(
                        name: "FK_produtos_categorias_produto_categoria_produto_id",
                        column: x => x.categoria_produto_id,
                        principalSchema: "producao",
                        principalTable: "categorias_produto",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "itens_ficha_tecnica",
                schema: "producao",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    produto_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ingrediente_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quantidade_por_unidade = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_itens_ficha_tecnica", x => x.id);
                    table.ForeignKey(
                        name: "FK_itens_ficha_tecnica_ingredientes_ingrediente_id",
                        column: x => x.ingrediente_id,
                        principalSchema: "estoque",
                        principalTable: "ingredientes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_itens_ficha_tecnica_produtos_produto_id",
                        column: x => x.produto_id,
                        principalSchema: "producao",
                        principalTable: "produtos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "producoes_diarias",
                schema: "producao",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    produto_id = table.Column<Guid>(type: "uuid", nullable: false),
                    data = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    quantidade_produzida = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false),
                    custo_total = table.Column<decimal>(type: "numeric(15,2)", precision: 15, scale: 2, nullable: false),
                    observacoes = table.Column<string>(type: "text", nullable: true),
                    criado_em = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    criado_por = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_producoes_diarias", x => x.id);
                    table.ForeignKey(
                        name: "FK_producoes_diarias_produtos_produto_id",
                        column: x => x.produto_id,
                        principalSchema: "producao",
                        principalTable: "produtos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "vendas_diarias",
                schema: "producao",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    produto_id = table.Column<Guid>(type: "uuid", nullable: false),
                    data = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    quantidade_vendida = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    criado_por = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vendas_diarias", x => x.id);
                    table.ForeignKey(
                        name: "FK_vendas_diarias_produtos_produto_id",
                        column: x => x.produto_id,
                        principalSchema: "producao",
                        principalTable: "produtos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_categorias_produto_nome",
                schema: "producao",
                table: "categorias_produto",
                column: "nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_itens_ficha_tecnica_ingrediente_id",
                schema: "producao",
                table: "itens_ficha_tecnica",
                column: "ingrediente_id");

            migrationBuilder.CreateIndex(
                name: "IX_itens_ficha_tecnica_produto_id_ingrediente_id",
                schema: "producao",
                table: "itens_ficha_tecnica",
                columns: new[] { "produto_id", "ingrediente_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_producoes_diarias_data",
                schema: "producao",
                table: "producoes_diarias",
                column: "data");

            migrationBuilder.CreateIndex(
                name: "IX_producoes_diarias_produto_id_data",
                schema: "producao",
                table: "producoes_diarias",
                columns: new[] { "produto_id", "data" });

            migrationBuilder.CreateIndex(
                name: "IX_produtos_categoria_produto_id",
                schema: "producao",
                table: "produtos",
                column: "categoria_produto_id");

            migrationBuilder.CreateIndex(
                name: "IX_produtos_nome",
                schema: "producao",
                table: "produtos",
                column: "nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vendas_diarias_data",
                schema: "producao",
                table: "vendas_diarias",
                column: "data");

            migrationBuilder.CreateIndex(
                name: "IX_vendas_diarias_produto_id_data",
                schema: "producao",
                table: "vendas_diarias",
                columns: new[] { "produto_id", "data" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "itens_ficha_tecnica",
                schema: "producao");

            migrationBuilder.DropTable(
                name: "producoes_diarias",
                schema: "producao");

            migrationBuilder.DropTable(
                name: "vendas_diarias",
                schema: "producao");

            migrationBuilder.DropTable(
                name: "produtos",
                schema: "producao");

            migrationBuilder.DropTable(
                name: "categorias_produto",
                schema: "producao");

            migrationBuilder.DropColumn(
                name: "custo_unitario",
                schema: "estoque",
                table: "ingredientes");

            migrationBuilder.AlterColumn<DateTime>(
                name: "criado_em",
                schema: "auth",
                table: "usuarios",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "atualizado_em",
                schema: "auth",
                table: "usuarios",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "criado_em",
                schema: "estoque",
                table: "movimentacoes",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "finalizado_em",
                schema: "estoque",
                table: "inventarios",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "data_realizacao",
                schema: "estoque",
                table: "inventarios",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "criado_em",
                schema: "estoque",
                table: "inventarios",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "atualizado_em",
                schema: "estoque",
                table: "inventarios",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "criado_em",
                schema: "estoque",
                table: "ingredientes",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "atualizado_em",
                schema: "estoque",
                table: "ingredientes",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "criado_em",
                schema: "estoque",
                table: "fornecedores",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "atualizado_em",
                schema: "estoque",
                table: "fornecedores",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "data_entrada",
                schema: "estoque",
                table: "entradas_mercadoria",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "criado_em",
                schema: "estoque",
                table: "entradas_mercadoria",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "atualizado_em",
                schema: "estoque",
                table: "entradas_mercadoria",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "criado_em",
                schema: "estoque",
                table: "categorias_ingrediente",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "atualizado_em",
                schema: "estoque",
                table: "categorias_ingrediente",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");
        }
    }
}
