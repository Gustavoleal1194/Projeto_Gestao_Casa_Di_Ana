using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUtensilios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "categorias_utensilio",
                schema: "estoque",
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
                    table.PrimaryKey("PK_categorias_utensilio", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "utensilios",
                schema: "estoque",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    codigo_interno = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    categoria_utensilio_id = table.Column<Guid>(type: "uuid", nullable: true),
                    unidade_medida_id = table.Column<short>(type: "smallint", nullable: false),
                    estoque_atual = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false),
                    estoque_minimo = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false),
                    estoque_maximo = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: true),
                    custo_unitario = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: true),
                    ativo = table.Column<bool>(type: "boolean", nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    criado_por = table.Column<Guid>(type: "uuid", nullable: false),
                    atualizado_por = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_utensilios", x => x.id);
                    table.CheckConstraint("chk_utensilio_estoque_atual_nao_negativo", "estoque_atual >= 0");
                    table.CheckConstraint("chk_utensilio_estoque_minimo_nao_negativo", "estoque_minimo >= 0");
                    table.ForeignKey(
                        name: "FK_utensilios_categorias_utensilio_categoria_utensilio_id",
                        column: x => x.categoria_utensilio_id,
                        principalSchema: "estoque",
                        principalTable: "categorias_utensilio",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_utensilios_unidades_medida_unidade_medida_id",
                        column: x => x.unidade_medida_id,
                        principalSchema: "estoque",
                        principalTable: "unidades_medida",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "itens_entrada_utensilio",
                schema: "estoque",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    entrada_id = table.Column<Guid>(type: "uuid", nullable: false),
                    utensilio_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quantidade = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false),
                    custo_unitario = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_itens_entrada_utensilio", x => x.id);
                    table.CheckConstraint("chk_item_utensilio_custo_nao_negativo", "custo_unitario >= 0");
                    table.CheckConstraint("chk_item_utensilio_quantidade_positiva", "quantidade > 0");
                    table.ForeignKey(
                        name: "FK_itens_entrada_utensilio_entradas_mercadoria_entrada_id",
                        column: x => x.entrada_id,
                        principalSchema: "estoque",
                        principalTable: "entradas_mercadoria",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_itens_entrada_utensilio_utensilios_utensilio_id",
                        column: x => x.utensilio_id,
                        principalSchema: "estoque",
                        principalTable: "utensilios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "movimentacoes_utensilio",
                schema: "estoque",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    utensilio_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tipo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    quantidade = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false),
                    saldo_apos = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false),
                    referencia_tipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    referencia_id = table.Column<Guid>(type: "uuid", nullable: true),
                    observacoes = table.Column<string>(type: "text", nullable: true),
                    criado_em = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    criado_por = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movimentacoes_utensilio", x => x.id);
                    table.CheckConstraint("chk_mov_utensilio_quantidade_positiva", "quantidade > 0");
                    table.CheckConstraint("chk_mov_utensilio_saldo_nao_negativo", "saldo_apos >= 0");
                    table.ForeignKey(
                        name: "FK_movimentacoes_utensilio_utensilios_utensilio_id",
                        column: x => x.utensilio_id,
                        principalSchema: "estoque",
                        principalTable: "utensilios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_categorias_utensilio_nome",
                schema: "estoque",
                table: "categorias_utensilio",
                column: "nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_itens_entrada_utensilio_entrada_id_utensilio_id",
                schema: "estoque",
                table: "itens_entrada_utensilio",
                columns: new[] { "entrada_id", "utensilio_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_itens_entrada_utensilio_utensilio_id",
                schema: "estoque",
                table: "itens_entrada_utensilio",
                column: "utensilio_id");

            migrationBuilder.CreateIndex(
                name: "IX_movimentacoes_utensilio_criado_em",
                schema: "estoque",
                table: "movimentacoes_utensilio",
                column: "criado_em");

            migrationBuilder.CreateIndex(
                name: "IX_movimentacoes_utensilio_referencia_tipo_referencia_id",
                schema: "estoque",
                table: "movimentacoes_utensilio",
                columns: new[] { "referencia_tipo", "referencia_id" },
                filter: "referencia_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_movimentacoes_utensilio_utensilio_id",
                schema: "estoque",
                table: "movimentacoes_utensilio",
                column: "utensilio_id");

            migrationBuilder.CreateIndex(
                name: "IX_utensilios_categoria_utensilio_id_nome",
                schema: "estoque",
                table: "utensilios",
                columns: new[] { "categoria_utensilio_id", "nome" });

            migrationBuilder.CreateIndex(
                name: "IX_utensilios_codigo_interno",
                schema: "estoque",
                table: "utensilios",
                column: "codigo_interno",
                unique: true,
                filter: "codigo_interno IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_utensilios_estoque_atual_estoque_minimo",
                schema: "estoque",
                table: "utensilios",
                columns: new[] { "estoque_atual", "estoque_minimo" },
                filter: "ativo = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_utensilios_unidade_medida_id",
                schema: "estoque",
                table: "utensilios",
                column: "unidade_medida_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "itens_entrada_utensilio",
                schema: "estoque");

            migrationBuilder.DropTable(
                name: "movimentacoes_utensilio",
                schema: "estoque");

            migrationBuilder.DropTable(
                name: "utensilios",
                schema: "estoque");

            migrationBuilder.DropTable(
                name: "categorias_utensilio",
                schema: "estoque");
        }
    }
}
