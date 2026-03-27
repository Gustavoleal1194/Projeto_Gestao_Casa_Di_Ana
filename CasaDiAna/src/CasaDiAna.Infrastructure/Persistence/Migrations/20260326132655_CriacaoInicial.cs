using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CriacaoInicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "estoque");

            migrationBuilder.EnsureSchema(
                name: "auth");

            migrationBuilder.CreateTable(
                name: "categorias_ingrediente",
                schema: "estoque",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    criado_por = table.Column<Guid>(type: "uuid", nullable: false),
                    atualizado_por = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_categorias_ingrediente", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "fornecedores",
                schema: "estoque",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    razao_social = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    nome_fantasia = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    cnpj = table.Column<string>(type: "character(14)", fixedLength: true, maxLength: 14, nullable: true),
                    telefone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: true),
                    contato_nome = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    observacoes = table.Column<string>(type: "text", nullable: true),
                    ativo = table.Column<bool>(type: "boolean", nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    criado_por = table.Column<Guid>(type: "uuid", nullable: false),
                    atualizado_por = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fornecedores", x => x.id);
                    table.CheckConstraint("chk_cnpj_formato", "cnpj IS NULL OR cnpj ~ '^[0-9]{14}$'");
                });

            migrationBuilder.CreateTable(
                name: "inventarios",
                schema: "estoque",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    data_realizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    descricao = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    finalizado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    observacoes = table.Column<string>(type: "text", nullable: true),
                    criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    criado_por = table.Column<Guid>(type: "uuid", nullable: false),
                    atualizado_por = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventarios", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "unidades_medida",
                schema: "estoque",
                columns: table => new
                {
                    id = table.Column<short>(type: "smallint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    codigo = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    descricao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_unidades_medida", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "usuarios",
                schema: "auth",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    senha_hash = table.Column<string>(type: "text", nullable: false),
                    papel = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuarios", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "entradas_mercadoria",
                schema: "estoque",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    fornecedor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    numero_nota_fiscal = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    data_entrada = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    observacoes = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    criado_por = table.Column<Guid>(type: "uuid", nullable: false),
                    atualizado_por = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_entradas_mercadoria", x => x.id);
                    table.ForeignKey(
                        name: "FK_entradas_mercadoria_fornecedores_fornecedor_id",
                        column: x => x.fornecedor_id,
                        principalSchema: "estoque",
                        principalTable: "fornecedores",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ingredientes",
                schema: "estoque",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    codigo_interno = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    categoria_id = table.Column<Guid>(type: "uuid", nullable: true),
                    unidade_medida_id = table.Column<short>(type: "smallint", nullable: false),
                    estoque_atual = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false),
                    estoque_minimo = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false),
                    estoque_maximo = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: true),
                    observacoes = table.Column<string>(type: "text", nullable: true),
                    ativo = table.Column<bool>(type: "boolean", nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    criado_por = table.Column<Guid>(type: "uuid", nullable: false),
                    atualizado_por = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ingredientes", x => x.id);
                    table.CheckConstraint("chk_estoque_atual_nao_negativo", "estoque_atual >= 0");
                    table.CheckConstraint("chk_estoque_minimo_nao_negativo", "estoque_minimo >= 0");
                    table.ForeignKey(
                        name: "FK_ingredientes_categorias_ingrediente_categoria_id",
                        column: x => x.categoria_id,
                        principalSchema: "estoque",
                        principalTable: "categorias_ingrediente",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ingredientes_unidades_medida_unidade_medida_id",
                        column: x => x.unidade_medida_id,
                        principalSchema: "estoque",
                        principalTable: "unidades_medida",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "itens_entrada_mercadoria",
                schema: "estoque",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    entrada_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ingrediente_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quantidade = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false),
                    custo_unitario = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_itens_entrada_mercadoria", x => x.id);
                    table.CheckConstraint("chk_item_custo_nao_negativo", "custo_unitario >= 0");
                    table.CheckConstraint("chk_item_quantidade_positiva", "quantidade > 0");
                    table.ForeignKey(
                        name: "FK_itens_entrada_mercadoria_entradas_mercadoria_entrada_id",
                        column: x => x.entrada_id,
                        principalSchema: "estoque",
                        principalTable: "entradas_mercadoria",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_itens_entrada_mercadoria_ingredientes_ingrediente_id",
                        column: x => x.ingrediente_id,
                        principalSchema: "estoque",
                        principalTable: "ingredientes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "itens_inventario",
                schema: "estoque",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    inventario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ingrediente_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quantidade_sistema = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false),
                    quantidade_contada = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false),
                    observacoes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_itens_inventario", x => x.id);
                    table.CheckConstraint("chk_qtd_contada_nao_negativa", "quantidade_contada >= 0");
                    table.CheckConstraint("chk_qtd_sistema_nao_negativa", "quantidade_sistema >= 0");
                    table.ForeignKey(
                        name: "FK_itens_inventario_ingredientes_ingrediente_id",
                        column: x => x.ingrediente_id,
                        principalSchema: "estoque",
                        principalTable: "ingredientes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_itens_inventario_inventarios_inventario_id",
                        column: x => x.inventario_id,
                        principalSchema: "estoque",
                        principalTable: "inventarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "movimentacoes",
                schema: "estoque",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    ingrediente_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tipo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    quantidade = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false),
                    saldo_apos = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false),
                    referencia_tipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    referencia_id = table.Column<Guid>(type: "uuid", nullable: true),
                    observacoes = table.Column<string>(type: "text", nullable: true),
                    criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    criado_por = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movimentacoes", x => x.id);
                    table.CheckConstraint("chk_mov_quantidade_positiva", "quantidade > 0");
                    table.CheckConstraint("chk_mov_saldo_nao_negativo", "saldo_apos >= 0");
                    table.ForeignKey(
                        name: "FK_movimentacoes_ingredientes_ingrediente_id",
                        column: x => x.ingrediente_id,
                        principalSchema: "estoque",
                        principalTable: "ingredientes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                schema: "estoque",
                table: "unidades_medida",
                columns: new[] { "id", "codigo", "descricao" },
                values: new object[,]
                {
                    { (short)1, "KG", "Quilograma" },
                    { (short)2, "G", "Grama" },
                    { (short)3, "L", "Litro" },
                    { (short)4, "ML", "Mililitro" },
                    { (short)5, "UN", "Unidade" },
                    { (short)6, "CX", "Caixa" },
                    { (short)7, "PCT", "Pacote" },
                    { (short)8, "DZ", "Dúzia" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_categorias_ingrediente_nome",
                schema: "estoque",
                table: "categorias_ingrediente",
                column: "nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_entradas_mercadoria_data_entrada",
                schema: "estoque",
                table: "entradas_mercadoria",
                column: "data_entrada");

            migrationBuilder.CreateIndex(
                name: "IX_entradas_mercadoria_fornecedor_id",
                schema: "estoque",
                table: "entradas_mercadoria",
                column: "fornecedor_id");

            migrationBuilder.CreateIndex(
                name: "IX_entradas_mercadoria_numero_nota_fiscal",
                schema: "estoque",
                table: "entradas_mercadoria",
                column: "numero_nota_fiscal",
                filter: "numero_nota_fiscal IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_fornecedores_ativo",
                schema: "estoque",
                table: "fornecedores",
                column: "ativo");

            migrationBuilder.CreateIndex(
                name: "IX_fornecedores_cnpj",
                schema: "estoque",
                table: "fornecedores",
                column: "cnpj",
                unique: true,
                filter: "cnpj IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_fornecedores_razao_social",
                schema: "estoque",
                table: "fornecedores",
                column: "razao_social");

            migrationBuilder.CreateIndex(
                name: "IX_ingredientes_categoria_id_nome",
                schema: "estoque",
                table: "ingredientes",
                columns: new[] { "categoria_id", "nome" });

            migrationBuilder.CreateIndex(
                name: "IX_ingredientes_codigo_interno",
                schema: "estoque",
                table: "ingredientes",
                column: "codigo_interno",
                unique: true,
                filter: "codigo_interno IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ingredientes_estoque_atual_estoque_minimo",
                schema: "estoque",
                table: "ingredientes",
                columns: new[] { "estoque_atual", "estoque_minimo" },
                filter: "ativo = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_ingredientes_unidade_medida_id",
                schema: "estoque",
                table: "ingredientes",
                column: "unidade_medida_id");

            migrationBuilder.CreateIndex(
                name: "IX_inventarios_data_realizacao",
                schema: "estoque",
                table: "inventarios",
                column: "data_realizacao");

            migrationBuilder.CreateIndex(
                name: "IX_inventarios_status",
                schema: "estoque",
                table: "inventarios",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_itens_entrada_mercadoria_entrada_id_ingrediente_id",
                schema: "estoque",
                table: "itens_entrada_mercadoria",
                columns: new[] { "entrada_id", "ingrediente_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_itens_entrada_mercadoria_ingrediente_id",
                schema: "estoque",
                table: "itens_entrada_mercadoria",
                column: "ingrediente_id");

            migrationBuilder.CreateIndex(
                name: "IX_itens_inventario_ingrediente_id",
                schema: "estoque",
                table: "itens_inventario",
                column: "ingrediente_id");

            migrationBuilder.CreateIndex(
                name: "IX_itens_inventario_inventario_id_ingrediente_id",
                schema: "estoque",
                table: "itens_inventario",
                columns: new[] { "inventario_id", "ingrediente_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_movimentacoes_criado_em",
                schema: "estoque",
                table: "movimentacoes",
                column: "criado_em");

            migrationBuilder.CreateIndex(
                name: "IX_movimentacoes_ingrediente_id",
                schema: "estoque",
                table: "movimentacoes",
                column: "ingrediente_id");

            migrationBuilder.CreateIndex(
                name: "IX_movimentacoes_referencia_tipo_referencia_id",
                schema: "estoque",
                table: "movimentacoes",
                columns: new[] { "referencia_tipo", "referencia_id" },
                filter: "referencia_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_movimentacoes_tipo",
                schema: "estoque",
                table: "movimentacoes",
                column: "tipo");

            migrationBuilder.CreateIndex(
                name: "IX_unidades_medida_codigo",
                schema: "estoque",
                table: "unidades_medida",
                column: "codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_email",
                schema: "auth",
                table: "usuarios",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "itens_entrada_mercadoria",
                schema: "estoque");

            migrationBuilder.DropTable(
                name: "itens_inventario",
                schema: "estoque");

            migrationBuilder.DropTable(
                name: "movimentacoes",
                schema: "estoque");

            migrationBuilder.DropTable(
                name: "usuarios",
                schema: "auth");

            migrationBuilder.DropTable(
                name: "entradas_mercadoria",
                schema: "estoque");

            migrationBuilder.DropTable(
                name: "inventarios",
                schema: "estoque");

            migrationBuilder.DropTable(
                name: "ingredientes",
                schema: "estoque");

            migrationBuilder.DropTable(
                name: "fornecedores",
                schema: "estoque");

            migrationBuilder.DropTable(
                name: "categorias_ingrediente",
                schema: "estoque");

            migrationBuilder.DropTable(
                name: "unidades_medida",
                schema: "estoque");
        }
    }
}
