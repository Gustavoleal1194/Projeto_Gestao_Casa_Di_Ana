using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDiAna.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarCamposLoginUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ip_ultimo_login",
                schema: "auth",
                table: "usuarios",
                type: "character varying(45)",
                maxLength: 45,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "total_logins",
                schema: "auth",
                table: "usuarios",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ultimo_login",
                schema: "auth",
                table: "usuarios",
                type: "timestamptz",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "user_agent_ultimo_login",
                schema: "auth",
                table: "usuarios",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ip_ultimo_login",
                schema: "auth",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "total_logins",
                schema: "auth",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "ultimo_login",
                schema: "auth",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "user_agent_ultimo_login",
                schema: "auth",
                table: "usuarios");
        }
    }
}
