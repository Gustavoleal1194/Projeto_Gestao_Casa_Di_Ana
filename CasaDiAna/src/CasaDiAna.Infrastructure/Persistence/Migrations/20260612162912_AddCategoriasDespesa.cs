using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoriasDespesa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "categorias_despesa", schema: "financeiro",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    tipo = table.Column<int>(type: "integer", nullable: false),
                    eh_folha_pagamento = table.Column<bool>(type: "boolean", nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    atualizado_em = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    criado_por = table.Column<Guid>(type: "uuid", nullable: false),
                    atualizado_por = table.Column<Guid>(type: "uuid", nullable: false),
                },
                constraints: table => table.PrimaryKey("PK_categorias_despesa", x => x.id));

            migrationBuilder.CreateIndex(
                name: "ix_categorias_despesa_nome", schema: "financeiro",
                table: "categorias_despesa", column: "nome");

            // Seed das 15 categorias (GUIDs fixos = mapa do enum antigo)
            migrationBuilder.Sql(@"
INSERT INTO financeiro.categorias_despesa (id, nome, tipo, eh_folha_pagamento, ativo, criado_em, atualizado_em, criado_por, atualizado_por) VALUES
('00000000-0000-0000-0000-000000000001','Aluguel',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000002','Folha de pagamento',1,true,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000003','Água',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000004','Energia',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000005','Gás',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000006','Internet',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000007','Contabilidade',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000008','Manutenção',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000009','Sistema',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000010','Marketing',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000011','Outros',1,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000012','Taxa de cartão',2,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000013','Comissão delivery',2,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000014','Embalagens',2,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000015','Frete',2,false,true,now(),now(),'00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000');");

            // coluna FK (nullable durante o backfill)
            migrationBuilder.AddColumn<Guid>(
                name: "categoria_despesa_id", schema: "financeiro", table: "despesas",
                type: "uuid", nullable: true);

            // backfill enum int -> guid semeado
            migrationBuilder.Sql(@"
UPDATE financeiro.despesas SET categoria_despesa_id =
  ('00000000-0000-0000-0000-0000000000' || lpad(categoria::text, 2, '0'))::uuid;");

            // torna NOT NULL, indexa e cria FK
            migrationBuilder.AlterColumn<Guid>(
                name: "categoria_despesa_id", schema: "financeiro", table: "despesas",
                type: "uuid", nullable: false, oldClrType: typeof(Guid), oldType: "uuid", oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_despesas_categoria_despesa_id", schema: "financeiro",
                table: "despesas", column: "categoria_despesa_id");

            migrationBuilder.AddForeignKey(
                name: "FK_despesas_categorias_despesa_categoria_despesa_id",
                schema: "financeiro", table: "despesas", column: "categoria_despesa_id",
                principalSchema: "financeiro", principalTable: "categorias_despesa", principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            // remove colunas antigas
            migrationBuilder.DropColumn(name: "categoria", schema: "financeiro", table: "despesas");
            migrationBuilder.DropColumn(name: "tipo", schema: "financeiro", table: "despesas");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(name: "categoria", schema: "financeiro", table: "despesas", type: "integer", nullable: false, defaultValue: 11);
            migrationBuilder.AddColumn<int>(name: "tipo", schema: "financeiro", table: "despesas", type: "integer", nullable: false, defaultValue: 1);
            migrationBuilder.Sql(@"
UPDATE financeiro.despesas d SET
  categoria = COALESCE(NULLIF(right(c.id::text, 2), '')::int, 11),
  tipo = c.tipo
FROM financeiro.categorias_despesa c WHERE d.categoria_despesa_id = c.id;");
            migrationBuilder.DropForeignKey(name: "FK_despesas_categorias_despesa_categoria_despesa_id", schema: "financeiro", table: "despesas");
            migrationBuilder.DropIndex(name: "ix_despesas_categoria_despesa_id", schema: "financeiro", table: "despesas");
            migrationBuilder.DropColumn(name: "categoria_despesa_id", schema: "financeiro", table: "despesas");
            migrationBuilder.DropTable(name: "categorias_despesa", schema: "financeiro");
        }
    }
}
