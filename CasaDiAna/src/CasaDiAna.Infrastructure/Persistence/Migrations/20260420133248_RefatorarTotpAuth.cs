using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RefatorarTotpAuth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "codigo_otp_expira_em",
                schema: "auth",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "codigo_otp_tentativas",
                schema: "auth",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "telefone",
                schema: "auth",
                table: "usuarios");

            migrationBuilder.RenameColumn(
                name: "codigo_otp_hash",
                schema: "auth",
                table: "usuarios",
                newName: "totp_secret");

            migrationBuilder.CreateTable(
                name: "codigos_recuperacao",
                schema: "auth",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    codigo_hash = table.Column<string>(type: "text", nullable: false),
                    usado_em = table.Column<DateTime>(type: "timestamptz", nullable: true),
                    criado_em = table.Column<DateTime>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_codigos_recuperacao", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_codigos_recuperacao_usuario_id",
                schema: "auth",
                table: "codigos_recuperacao",
                column: "usuario_id");

            migrationBuilder.Sql(
                "UPDATE auth.usuarios SET two_factor_habilitado = false, totp_secret = NULL WHERE two_factor_habilitado = true");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "codigos_recuperacao",
                schema: "auth");

            migrationBuilder.RenameColumn(
                name: "totp_secret",
                schema: "auth",
                table: "usuarios",
                newName: "codigo_otp_hash");

            migrationBuilder.AddColumn<DateTime>(
                name: "codigo_otp_expira_em",
                schema: "auth",
                table: "usuarios",
                type: "timestamptz",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "codigo_otp_tentativas",
                schema: "auth",
                table: "usuarios",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "telefone",
                schema: "auth",
                table: "usuarios",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }
    }
}
