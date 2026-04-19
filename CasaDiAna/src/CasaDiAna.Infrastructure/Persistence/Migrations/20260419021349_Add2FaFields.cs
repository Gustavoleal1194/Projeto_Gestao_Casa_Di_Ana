using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Add2FaFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "codigo_otp_expira_em",
                schema: "auth",
                table: "usuarios",
                type: "timestamptz",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "codigo_otp_hash",
                schema: "auth",
                table: "usuarios",
                type: "text",
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

            migrationBuilder.AddColumn<bool>(
                name: "two_factor_habilitado",
                schema: "auth",
                table: "usuarios",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "codigo_otp_expira_em",
                schema: "auth",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "codigo_otp_hash",
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

            migrationBuilder.DropColumn(
                name: "two_factor_habilitado",
                schema: "auth",
                table: "usuarios");
        }
    }
}
