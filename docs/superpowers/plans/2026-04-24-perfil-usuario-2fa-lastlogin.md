# Perfil do Usuário — Status 2FA + Último Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Frontend tasks (7, 9, 10):** Invoke the `frontend-design` skill before writing any UI code.
> **Ordem obrigatória:** Tasks 1→2→3→4→5→6→7→8→9→10. Task 4 (AuthController) só adiciona Login/VerificarOtp — o endpoint `GET /api/auth/me` é adicionado na Task 6, após a query existir.

**Goal:** Exibir status real de 2FA e dados de último login na MinhaContaPage; adicionar coluna "Último Login" e tooltip educativo no badge 2FA da UsuariosPage; rastrear campos de auditoria de login (`ip`, `user_agent`, `total_logins`) como fundação SaaS.

**Architecture:** Backend: novos campos em `Usuario`, migration, `LoginCommand`/`VerificarOtpCommand` recebem IP e User-Agent do controller, novo endpoint `GET /api/auth/me` (acessível a qualquer usuário autenticado). Frontend: três componentes reutilizáveis (`<RelativeTime>`, `<InfoRow>`, `<StatusBadge2Fa>`), novo `minhaContaService`, `MinhaContaPage` e `UsuariosPage` atualizados.

**Tech Stack:** C# 12, ASP.NET Core 8, EF Core 8, xUnit + Moq + FluentAssertions; React 18 + TypeScript + Tailwind CSS v4, Zustand, Axios.

---

## Mapa de Arquivos

### Criar
- `src/CasaDiAna.Application/Usuarios/Dtos/MeuPerfilDto.cs`
- `src/CasaDiAna.Application/Usuarios/Queries/ObterMeuPerfil/ObterMeuPerfilQuery.cs`
- `src/CasaDiAna.Application/Usuarios/Queries/ObterMeuPerfil/ObterMeuPerfilQueryHandler.cs`
- `src/CasaDiAna.Infrastructure/Migrations/<timestamp>_AdicionarCamposLoginUsuario.cs` (gerada pelo EF)
- `tests/CasaDiAna.Application.Tests/Usuarios/ObterMeuPerfilQueryHandlerTests.cs`
- `frontend/src/components/ui/RelativeTime.tsx`
- `frontend/src/components/ui/InfoRow.tsx`
- `frontend/src/components/ui/StatusBadge2Fa.tsx`
- `frontend/src/features/minha-conta/services/minhaContaService.ts`

### Modificar
- `src/CasaDiAna.Domain/Entities/Usuario.cs`
- `src/CasaDiAna.Infrastructure/Persistence/Configurations/UsuarioConfiguration.cs`
- `src/CasaDiAna.Application/Auth/Commands/Login/LoginCommand.cs`
- `src/CasaDiAna.Application/Auth/Commands/Login/LoginCommandHandler.cs`
- `src/CasaDiAna.Application/Auth/Commands/VerificarOtp/VerificarOtpCommand.cs`
- `src/CasaDiAna.Application/Auth/Commands/VerificarOtp/VerificarOtpCommandHandler.cs`
- `src/CasaDiAna.Application/Usuarios/Dtos/UsuarioDto.cs`
- `src/CasaDiAna.Application/Usuarios/Queries/ListarUsuarios/ListarUsuariosQueryHandler.cs`
- `src/CasaDiAna.API/Controllers/AuthController.cs`
- `tests/CasaDiAna.Application.Tests/Auth/LoginCommandHandlerTests.cs`
- `frontend/src/features/minha-conta/pages/MinhaContaPage.tsx`
- `frontend/src/features/usuarios/pages/UsuariosPage.tsx`

---

## Task 1: Domain — novos campos e `RegistrarLogin()` em `Usuario`

**Files:**
- Modify: `src/CasaDiAna.Domain/Entities/Usuario.cs`

- [ ] **Step 1: Substituir o conteúdo de `Usuario.cs` pelo conteúdo abaixo**

```csharp
// src/CasaDiAna.Domain/Entities/Usuario.cs
using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Domain.Entities;

public class Usuario
{
    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string SenhaHash { get; private set; } = string.Empty;
    public PapelUsuario Papel { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }

    // 2FA
    public bool TwoFactorHabilitado { get; private set; }
    public string? TotpSecret { get; private set; }

    // Auditoria de login
    public DateTime? UltimoLogin { get; private set; }
    public string? IpUltimoLogin { get; private set; }
    public string? UserAgentUltimoLogin { get; private set; }
    public int TotalLogins { get; private set; }

    private Usuario() { }

    public static Usuario Criar(string nome, string email, string senhaHash, PapelUsuario papel)
    {
        return new Usuario
        {
            Id = Guid.NewGuid(),
            Nome = nome,
            Email = email.ToLowerInvariant(),
            SenhaHash = senhaHash,
            Papel = papel,
            Ativo = true,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow
        };
    }

    public bool SenhaCorreta(string senha) =>
        BCrypt.Net.BCrypt.Verify(senha, SenhaHash);

    public static string HashSenha(string senha) =>
        BCrypt.Net.BCrypt.HashPassword(senha);

    public void Desativar()
    {
        Ativo = false;
        AtualizadoEm = DateTime.UtcNow;
    }

    public void RedefinirSenha(string novaSenhaHash)
    {
        SenhaHash = novaSenhaHash;
        AtualizadoEm = DateTime.UtcNow;
    }

    public void HabilitarTotp(string secret)
    {
        TotpSecret = secret;
        TwoFactorHabilitado = true;
        AtualizadoEm = DateTime.UtcNow;
    }

    public void DesabilitarTotp()
    {
        TotpSecret = null;
        TwoFactorHabilitado = false;
        AtualizadoEm = DateTime.UtcNow;
    }

    public void RegistrarLogin(string? ip, string? userAgent)
    {
        UltimoLogin = DateTime.UtcNow;
        IpUltimoLogin = ip;
        UserAgentUltimoLogin = userAgent;
        TotalLogins++;
        AtualizadoEm = DateTime.UtcNow;
    }
}
```

- [ ] **Step 2: Buildar para confirmar que o domínio compila**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build 2>&1" | tail -5
```

Saída esperada: `Build succeeded.`

- [ ] **Step 3: Commit**

```bash
git add src/CasaDiAna.Domain/Entities/Usuario.cs
git commit -m "feat(domain): adiciona campos de auditoria de login e RegistrarLogin em Usuario"
```

---

## Task 2: Infraestrutura — `UsuarioConfiguration` + Migration

**Files:**
- Modify: `src/CasaDiAna.Infrastructure/Persistence/Configurations/UsuarioConfiguration.cs`
- Create: migration gerada pelo EF (caminho automático)

- [ ] **Step 1: Substituir o conteúdo de `UsuarioConfiguration.cs`**

```csharp
// src/CasaDiAna.Infrastructure/Persistence/Configurations/UsuarioConfiguration.cs
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("usuarios", "auth");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasColumnName("id");
        builder.Property(u => u.Nome).HasColumnName("nome").HasMaxLength(150).IsRequired();
        builder.Property(u => u.Email).HasColumnName("email").HasMaxLength(254).IsRequired();
        builder.HasIndex(u => u.Email).IsUnique();
        builder.Property(u => u.SenhaHash).HasColumnName("senha_hash").IsRequired();
        builder.Property(u => u.Papel)
            .HasColumnName("papel")
            .HasConversion(p => p.ToString(), s => Enum.Parse<PapelUsuario>(s))
            .HasMaxLength(50)
            .IsRequired();
        builder.Property(u => u.Ativo).HasColumnName("ativo").IsRequired();
        builder.Property(u => u.CriadoEm).HasColumnName("criado_em").IsRequired();
        builder.Property(u => u.AtualizadoEm).HasColumnName("atualizado_em").IsRequired();

        builder.Property(u => u.TwoFactorHabilitado)
            .HasColumnName("two_factor_habilitado")
            .IsRequired()
            .HasDefaultValue(false);
        builder.Property(u => u.TotpSecret).HasColumnName("totp_secret");

        builder.Property(u => u.UltimoLogin)
            .HasColumnName("ultimo_login")
            .HasColumnType("timestamptz");
        builder.Property(u => u.IpUltimoLogin)
            .HasColumnName("ip_ultimo_login")
            .HasMaxLength(45);
        builder.Property(u => u.UserAgentUltimoLogin)
            .HasColumnName("user_agent_ultimo_login")
            .HasMaxLength(512);
        builder.Property(u => u.TotalLogins)
            .HasColumnName("total_logins")
            .HasDefaultValue(0)
            .IsRequired();
    }
}
```

- [ ] **Step 2: Gerar a migration**

```bash
dotnet ef migrations add AdicionarCamposLoginUsuario \
  --project src/CasaDiAna.Infrastructure \
  --startup-project src/CasaDiAna.API
```

Saída esperada: `Done. To undo this action, use 'ef migrations remove'`

- [ ] **Step 3: Verificar a migration gerada**

Abrir o arquivo `src/CasaDiAna.Infrastructure/Migrations/<timestamp>_AdicionarCamposLoginUsuario.cs` e confirmar que o método `Up` contém:
- `AddColumn` para `ultimo_login` (nullable timestamptz)
- `AddColumn` para `ip_ultimo_login` (nullable varchar 45)
- `AddColumn` para `user_agent_ultimo_login` (nullable varchar 512)
- `AddColumn` para `total_logins` (int, default 0)

- [ ] **Step 4: Aplicar a migration**

```bash
dotnet ef database update \
  --project src/CasaDiAna.Infrastructure \
  --startup-project src/CasaDiAna.API
```

Saída esperada: `Done.`

- [ ] **Step 5: Commit**

```bash
git add src/CasaDiAna.Infrastructure/Persistence/Configurations/UsuarioConfiguration.cs \
        src/CasaDiAna.Infrastructure/Migrations/
git commit -m "feat(infra): AdicionarCamposLoginUsuario — ultimo_login, ip, user_agent, total_logins"
```

---

## Task 3: Application — `LoginCommand` e `VerificarOtpCommand` recebem contexto HTTP

**Files:**
- Modify: `src/CasaDiAna.Application/Auth/Commands/Login/LoginCommand.cs`
- Modify: `src/CasaDiAna.Application/Auth/Commands/VerificarOtp/VerificarOtpCommand.cs`

- [ ] **Step 1: Atualizar `LoginCommand.cs` com parâmetros opcionais**

```csharp
// src/CasaDiAna.Application/Auth/Commands/Login/LoginCommand.cs
using CasaDiAna.Application.Auth.Dtos;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.Login;

public record LoginCommand(
    string Email,
    string Senha,
    string? Ip = null,
    string? UserAgent = null) : IRequest<LoginResultDto>;
```

Os parâmetros com default `null` preservam compatibilidade com os testes existentes (que usam `new LoginCommand("email", "senha")`).

- [ ] **Step 2: Atualizar `VerificarOtpCommand.cs`**

```csharp
// src/CasaDiAna.Application/Auth/Commands/VerificarOtp/VerificarOtpCommand.cs
using CasaDiAna.Application.Auth.Dtos;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.VerificarOtp;

public record VerificarOtpCommand(
    Guid UsuarioId,
    string Codigo,
    string? Ip = null,
    string? UserAgent = null) : IRequest<TokenDto>;
```

- [ ] **Step 3: Confirmar que os testes existentes ainda compilam**

```bash
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet build 2>&1" | tail -5
```

Saída esperada: `Build succeeded.`

- [ ] **Step 4: Commit**

```bash
git add src/CasaDiAna.Application/Auth/Commands/Login/LoginCommand.cs \
        src/CasaDiAna.Application/Auth/Commands/VerificarOtp/VerificarOtpCommand.cs
git commit -m "feat(application): LoginCommand e VerificarOtpCommand recebem Ip e UserAgent opcionais"
```

---

## Task 4: Application — handlers registram login + `AuthController` extrai IP/UA

**Files:**
- Modify: `src/CasaDiAna.Application/Auth/Commands/Login/LoginCommandHandler.cs`
- Modify: `src/CasaDiAna.Application/Auth/Commands/VerificarOtp/VerificarOtpCommandHandler.cs`
- Modify: `src/CasaDiAna.API/Controllers/AuthController.cs`
- Modify: `tests/CasaDiAna.Application.Tests/Auth/LoginCommandHandlerTests.cs`

- [ ] **Step 1: Atualizar `LoginCommandHandler.cs`**

Registrar login apenas quando a autenticação é completa (sem 2FA). Para usuários com 2FA, o registro ocorre no `VerificarOtpCommandHandler`.

```csharp
// src/CasaDiAna.Application/Auth/Commands/Login/LoginCommandHandler.cs
using CasaDiAna.Application.Auth.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResultDto>
{
    private readonly IUsuarioRepository _usuarios;
    private readonly IJwtService _jwtService;

    public LoginCommandHandler(IUsuarioRepository usuarios, IJwtService jwtService)
    {
        _usuarios = usuarios;
        _jwtService = jwtService;
    }

    public async Task<LoginResultDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorEmailAsync(request.Email, cancellationToken)
            ?? throw new UnauthorizedAccessException("E-mail ou senha inválidos.");

        if (!usuario.SenhaCorreta(request.Senha))
            throw new UnauthorizedAccessException("E-mail ou senha inválidos.");

        if (usuario.TwoFactorHabilitado)
        {
            var tokenTemp = _jwtService.GerarTokenTemporario(usuario.Id);
            return new LoginResultDto(
                Requer2Fa: true,
                TokenTemporario: tokenTemp,
                Token: null,
                Nome: null,
                Papel: null);
        }

        usuario.RegistrarLogin(request.Ip, request.UserAgent);
        _usuarios.Atualizar(usuario);
        await _usuarios.SalvarAsync(cancellationToken);

        var token = _jwtService.GerarToken(usuario);
        return new LoginResultDto(
            Requer2Fa: false,
            Token: token,
            Nome: usuario.Nome,
            Papel: usuario.Papel.ToString(),
            TokenTemporario: null);
    }
}
```

- [ ] **Step 2: Atualizar `VerificarOtpCommandHandler.cs`**

Chamar `RegistrarLogin` nos dois caminhos de sucesso (TOTP e recovery code):

```csharp
// src/CasaDiAna.Application/Auth/Commands/VerificarOtp/VerificarOtpCommandHandler.cs
using CasaDiAna.Application.Auth.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.VerificarOtp;

public class VerificarOtpCommandHandler : IRequestHandler<VerificarOtpCommand, TokenDto>
{
    private readonly IUsuarioRepository _usuarios;
    private readonly IJwtService _jwtService;
    private readonly ITotpService _totp;
    private readonly ICodigoRecuperacaoRepository _codigosRecuperacao;

    public VerificarOtpCommandHandler(
        IUsuarioRepository usuarios,
        IJwtService jwtService,
        ITotpService totp,
        ICodigoRecuperacaoRepository codigosRecuperacao)
    {
        _usuarios = usuarios;
        _jwtService = jwtService;
        _totp = totp;
        _codigosRecuperacao = codigosRecuperacao;
    }

    public async Task<TokenDto> Handle(VerificarOtpCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorIdAsync(request.UsuarioId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Sessão inválida.");

        if (!usuario.TwoFactorHabilitado)
            throw new UnauthorizedAccessException("Sessão inválida.");

        if (usuario.TotpSecret is null)
            throw new DomainException("2FA não configurado.");

        if (_totp.ValidarCodigo(usuario.TotpSecret, request.Codigo))
        {
            usuario.RegistrarLogin(request.Ip, request.UserAgent);
            _usuarios.Atualizar(usuario);
            await _usuarios.SalvarAsync(cancellationToken);
            var token = _jwtService.GerarToken(usuario);
            return new TokenDto(token, usuario.Nome, usuario.Papel.ToString());
        }

        var ativos = await _codigosRecuperacao.ObterAtivosPorUsuarioAsync(
            usuario.Id, cancellationToken);

        foreach (var codigo in ativos)
        {
            if (codigo.VerificarCodigo(request.Codigo))
            {
                await _codigosRecuperacao.MarcarUsadoAsync(codigo.Id, cancellationToken);
                await _codigosRecuperacao.SalvarAsync(cancellationToken);
                usuario.RegistrarLogin(request.Ip, request.UserAgent);
                _usuarios.Atualizar(usuario);
                await _usuarios.SalvarAsync(cancellationToken);
                var token = _jwtService.GerarToken(usuario);
                return new TokenDto(token, usuario.Nome, usuario.Papel.ToString());
            }
        }

        throw new DomainException("Código inválido. Verifique o app ou use um código de recuperação.");
    }
}
```

- [ ] **Step 3: Atualizar `AuthController.cs`**

Introduzir `LoginRequest` para o body do login (evita expor `Ip`/`UserAgent` no JSON) e atualizar `VerificarOtp` para passar IP/UA. **Não adicionar `GET me` aqui** — ele será adicionado na Task 6, após `ObterMeuPerfilQuery` existir.

```csharp
// src/CasaDiAna.API/Controllers/AuthController.cs
using CasaDiAna.Application.Auth.Commands.ConfirmarSetup2Fa;
using CasaDiAna.Application.Auth.Commands.IniciarSetup2Fa;
using CasaDiAna.Application.Auth.Commands.Login;
using CasaDiAna.Application.Auth.Commands.VerificarOtp;
using CasaDiAna.Application.Auth.Dtos;
using CasaDiAna.Application.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator) => _mediator = mediator;

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest req, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.FirstOrDefault();
        var resultado = await _mediator.Send(new LoginCommand(req.Email, req.Senha, ip, ua), ct);
        return Ok(ApiResponse<LoginResultDto>.Ok(resultado));
    }

    [HttpPost("verificar-2fa")]
    [Authorize(Policy = "Pre2Fa")]
    [ProducesResponseType(typeof(ApiResponse<TokenDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> VerificarOtp(
        [FromBody] VerificarOtpRequest request, CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.FirstOrDefault();
        var token = await _mediator.Send(
            new VerificarOtpCommand(usuarioId, request.Codigo, ip, ua), ct);
        return Ok(ApiResponse<TokenDto>.Ok(token));
    }

    [HttpPost("iniciar-setup-2fa")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<IniciarSetup2FaResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> IniciarSetup2Fa(CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var resultado = await _mediator.Send(new IniciarSetup2FaCommand(usuarioId), ct);
        return Ok(ApiResponse<IniciarSetup2FaResultDto>.Ok(resultado));
    }

    [HttpPost("confirmar-setup-2fa")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ConfirmarSetup2Fa(
        [FromBody] ConfirmarSetup2FaRequest request, CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _mediator.Send(
            new ConfirmarSetup2FaCommand(usuarioId, request.Secret, request.Codigo, request.CodigosRecuperacao), ct);
        return Ok(ApiResponse<object>.Ok(null!));
    }
}

public record LoginRequest(string Email, string Senha);
public record VerificarOtpRequest(string Codigo);
public record ConfirmarSetup2FaRequest(
    string Secret,
    string Codigo,
    IReadOnlyList<string> CodigosRecuperacao);
```

- [ ] **Step 4: Atualizar `LoginCommandHandlerTests.cs`**

O `LoginCommandHandler` agora chama `_usuarios.Atualizar` e `_usuarios.SalvarAsync` no caminho sem 2FA. Atualizar os mocks:

```csharp
// tests/CasaDiAna.Application.Tests/Auth/LoginCommandHandlerTests.cs
using CasaDiAna.Application.Auth.Commands.Login;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Auth;

public class LoginCommandHandlerTests
{
    private readonly Mock<IUsuarioRepository> _repositorio = new();
    private readonly Mock<IJwtService> _jwtService = new();
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        _handler = new LoginCommandHandler(_repositorio.Object, _jwtService.Object);
    }

    [Fact]
    public async Task DeveRetornarToken_QuandoCredenciaisValidas_Sem2Fa()
    {
        var senhaHash = BCrypt.Net.BCrypt.HashPassword("senha123");
        var usuario = Usuario.Criar("Ana", "ana@casa.com", senhaHash, PapelUsuario.Admin);
        _repositorio.Setup(r => r.ObterPorEmailAsync("ana@casa.com", default))
                    .ReturnsAsync(usuario);
        _repositorio.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _jwtService.Setup(j => j.GerarToken(usuario)).Returns("token-jwt");

        var resultado = await _handler.Handle(
            new LoginCommand("ana@casa.com", "senha123"), CancellationToken.None);

        resultado.Requer2Fa.Should().BeFalse();
        resultado.Token.Should().Be("token-jwt");
        resultado.Nome.Should().Be("Ana");
        resultado.Papel.Should().Be("Admin");
        _repositorio.Verify(r => r.Atualizar(usuario), Times.Once);
        _repositorio.Verify(r => r.SalvarAsync(default), Times.Once);
        usuario.TotalLogins.Should().Be(1);
    }

    [Fact]
    public async Task DeveRetornarTokenTemporario_QuandoCredenciaisValidas_Com2Fa()
    {
        var senhaHash = BCrypt.Net.BCrypt.HashPassword("senha123");
        var usuario = Usuario.Criar("Ana", "ana@casa.com", senhaHash, PapelUsuario.Admin);
        usuario.HabilitarTotp("JBSWY3DPEHPK3PXP");
        _repositorio.Setup(r => r.ObterPorEmailAsync("ana@casa.com", default))
                    .ReturnsAsync(usuario);
        _jwtService.Setup(j => j.GerarTokenTemporario(usuario.Id)).Returns("token-temp");

        var resultado = await _handler.Handle(
            new LoginCommand("ana@casa.com", "senha123"), CancellationToken.None);

        resultado.Requer2Fa.Should().BeTrue();
        resultado.TokenTemporario.Should().Be("token-temp");
        resultado.Token.Should().BeNull();
        _repositorio.Verify(r => r.Atualizar(It.IsAny<Usuario>()), Times.Never);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUsuarioNaoEncontrado()
    {
        _repositorio.Setup(r => r.ObterPorEmailAsync(It.IsAny<string>(), default))
                    .ReturnsAsync((Usuario?)null);

        var acao = () => _handler.Handle(
            new LoginCommand("x@x.com", "123"), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("E-mail ou senha inválidos.");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoSenhaInvalida()
    {
        var senhaHash = BCrypt.Net.BCrypt.HashPassword("correta");
        var usuario = Usuario.Criar("Ana", "ana@casa.com", senhaHash, PapelUsuario.Admin);
        _repositorio.Setup(r => r.ObterPorEmailAsync("ana@casa.com", default))
                    .ReturnsAsync(usuario);

        var acao = () => _handler.Handle(
            new LoginCommand("ana@casa.com", "errada"), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("E-mail ou senha inválidos.");
    }

    [Fact]
    public async Task DeveRegistrarIpEUserAgent_QuandoLoginSemDoisFatores()
    {
        var senhaHash = BCrypt.Net.BCrypt.HashPassword("senha123");
        var usuario = Usuario.Criar("Ana", "ana@casa.com", senhaHash, PapelUsuario.Admin);
        _repositorio.Setup(r => r.ObterPorEmailAsync("ana@casa.com", default))
                    .ReturnsAsync(usuario);
        _repositorio.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _jwtService.Setup(j => j.GerarToken(usuario)).Returns("token-jwt");

        await _handler.Handle(
            new LoginCommand("ana@casa.com", "senha123", "192.168.1.1", "Mozilla/5.0"),
            CancellationToken.None);

        usuario.IpUltimoLogin.Should().Be("192.168.1.1");
        usuario.UserAgentUltimoLogin.Should().Be("Mozilla/5.0");
        usuario.UltimoLogin.Should().NotBeNull();
        usuario.TotalLogins.Should().Be(1);
    }
}
```

- [ ] **Step 5: Rodar os testes**

```bash
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test 2>&1" | tail -5
```

Saída esperada: `Aprovado! – Com falha: 0`

- [ ] **Step 6: Commit**

```bash
git add src/CasaDiAna.Application/Auth/Commands/Login/LoginCommandHandler.cs \
        src/CasaDiAna.Application/Auth/Commands/VerificarOtp/VerificarOtpCommandHandler.cs \
        src/CasaDiAna.API/Controllers/AuthController.cs \
        tests/CasaDiAna.Application.Tests/Auth/LoginCommandHandlerTests.cs
git commit -m "feat(application): handlers registram login com ip/ua, AuthController usa LoginRequest"
```

---

## Task 5: Application — `UsuarioDto` + `ListarUsuariosQueryHandler`

**Files:**
- Modify: `src/CasaDiAna.Application/Usuarios/Dtos/UsuarioDto.cs`
- Modify: `src/CasaDiAna.Application/Usuarios/Queries/ListarUsuarios/ListarUsuariosQueryHandler.cs`

- [ ] **Step 1: Adicionar `UltimoLogin` ao `UsuarioDto`**

```csharp
// src/CasaDiAna.Application/Usuarios/Dtos/UsuarioDto.cs
namespace CasaDiAna.Application.Usuarios.Dtos;

public record UsuarioDto(
    Guid Id,
    string Nome,
    string Email,
    string Papel,
    bool Ativo,
    DateTime CriadoEm,
    bool TwoFactorHabilitado,
    DateTime? UltimoLogin);
```

- [ ] **Step 2: Atualizar `ToDto` no `ListarUsuariosQueryHandler`**

```csharp
// src/CasaDiAna.Application/Usuarios/Queries/ListarUsuarios/ListarUsuariosQueryHandler.cs
using CasaDiAna.Application.Usuarios.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Usuarios.Queries.ListarUsuarios;

public class ListarUsuariosQueryHandler : IRequestHandler<ListarUsuariosQuery, IReadOnlyList<UsuarioDto>>
{
    private readonly IUsuarioRepository _usuarios;

    public ListarUsuariosQueryHandler(IUsuarioRepository usuarios) => _usuarios = usuarios;

    public async Task<IReadOnlyList<UsuarioDto>> Handle(ListarUsuariosQuery request, CancellationToken ct)
    {
        var lista = await _usuarios.ListarAsync(ct);
        return lista.Select(ToDto).ToList();
    }

    internal static UsuarioDto ToDto(Usuario u) => new(
        u.Id,
        u.Nome,
        u.Email,
        u.Papel.ToString(),
        u.Ativo,
        u.CriadoEm,
        u.TwoFactorHabilitado,
        u.UltimoLogin);
}
```

- [ ] **Step 3: Buildar e rodar testes**

```bash
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test 2>&1" | tail -5
```

Saída esperada: `Aprovado! – Com falha: 0`

- [ ] **Step 4: Commit**

```bash
git add src/CasaDiAna.Application/Usuarios/Dtos/UsuarioDto.cs \
        src/CasaDiAna.Application/Usuarios/Queries/ListarUsuarios/ListarUsuariosQueryHandler.cs
git commit -m "feat(application): adiciona UltimoLogin ao UsuarioDto e ToDto"
```

---

## Task 6: Application — `MeuPerfilDto`, `ObterMeuPerfilQuery` e handler

**Files:**
- Create: `src/CasaDiAna.Application/Usuarios/Dtos/MeuPerfilDto.cs`
- Create: `src/CasaDiAna.Application/Usuarios/Queries/ObterMeuPerfil/ObterMeuPerfilQuery.cs`
- Create: `src/CasaDiAna.Application/Usuarios/Queries/ObterMeuPerfil/ObterMeuPerfilQueryHandler.cs`
- Create: `tests/CasaDiAna.Application.Tests/Usuarios/ObterMeuPerfilQueryHandlerTests.cs`

- [ ] **Step 1: Criar `MeuPerfilDto.cs`**

```csharp
// src/CasaDiAna.Application/Usuarios/Dtos/MeuPerfilDto.cs
namespace CasaDiAna.Application.Usuarios.Dtos;

public record MeuPerfilDto(
    string Nome,
    string Email,
    string Papel,
    bool TwoFactorHabilitado,
    DateTime? UltimoLogin,
    string? IpUltimoLogin,
    string? UserAgentUltimoLogin,
    int TotalLogins);
```

- [ ] **Step 2: Criar `ObterMeuPerfilQuery.cs`**

```csharp
// src/CasaDiAna.Application/Usuarios/Queries/ObterMeuPerfil/ObterMeuPerfilQuery.cs
using CasaDiAna.Application.Usuarios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Usuarios.Queries.ObterMeuPerfil;

public record ObterMeuPerfilQuery(Guid UsuarioId) : IRequest<MeuPerfilDto>;
```

- [ ] **Step 3: Criar `ObterMeuPerfilQueryHandler.cs`**

```csharp
// src/CasaDiAna.Application/Usuarios/Queries/ObterMeuPerfil/ObterMeuPerfilQueryHandler.cs
using CasaDiAna.Application.Usuarios.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Usuarios.Queries.ObterMeuPerfil;

public class ObterMeuPerfilQueryHandler : IRequestHandler<ObterMeuPerfilQuery, MeuPerfilDto>
{
    private readonly IUsuarioRepository _usuarios;

    public ObterMeuPerfilQueryHandler(IUsuarioRepository usuarios) => _usuarios = usuarios;

    public async Task<MeuPerfilDto> Handle(ObterMeuPerfilQuery request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorIdAsync(request.UsuarioId, cancellationToken)
            ?? throw new DomainException("Usuário não encontrado.");

        return new MeuPerfilDto(
            usuario.Nome,
            usuario.Email,
            usuario.Papel.ToString(),
            usuario.TwoFactorHabilitado,
            usuario.UltimoLogin,
            usuario.IpUltimoLogin,
            usuario.UserAgentUltimoLogin,
            usuario.TotalLogins);
    }
}
```

- [ ] **Step 4: Escrever `ObterMeuPerfilQueryHandlerTests.cs`**

```csharp
// tests/CasaDiAna.Application.Tests/Usuarios/ObterMeuPerfilQueryHandlerTests.cs
using CasaDiAna.Application.Usuarios.Queries.ObterMeuPerfil;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Usuarios;

public class ObterMeuPerfilQueryHandlerTests
{
    private readonly Mock<IUsuarioRepository> _repositorio = new();
    private readonly ObterMeuPerfilQueryHandler _handler;

    public ObterMeuPerfilQueryHandlerTests()
    {
        _handler = new ObterMeuPerfilQueryHandler(_repositorio.Object);
    }

    [Fact]
    public async Task DeveRetornarPerfil_QuandoUsuarioExiste()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com", "hash", PapelUsuario.Admin);
        usuario.RegistrarLogin("192.168.1.1", "Chrome/120");
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default))
                    .ReturnsAsync(usuario);

        var resultado = await _handler.Handle(
            new ObterMeuPerfilQuery(usuario.Id), CancellationToken.None);

        resultado.Nome.Should().Be("Ana");
        resultado.Email.Should().Be("ana@casa.com");
        resultado.Papel.Should().Be("Admin");
        resultado.TwoFactorHabilitado.Should().BeFalse();
        resultado.IpUltimoLogin.Should().Be("192.168.1.1");
        resultado.UserAgentUltimoLogin.Should().Be("Chrome/120");
        resultado.TotalLogins.Should().Be(1);
        resultado.UltimoLogin.Should().NotBeNull();
    }

    [Fact]
    public async Task DeveRetornarTwoFactorHabilitadoTrue_QuandoTotpAtivo()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com", "hash", PapelUsuario.Admin);
        usuario.HabilitarTotp("JBSWY3DPEHPK3PXP");
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default))
                    .ReturnsAsync(usuario);

        var resultado = await _handler.Handle(
            new ObterMeuPerfilQuery(usuario.Id), CancellationToken.None);

        resultado.TwoFactorHabilitado.Should().BeTrue();
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUsuarioNaoEncontrado()
    {
        _repositorio.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default))
                    .ReturnsAsync((Domain.Entities.Usuario?)null);

        var acao = () => _handler.Handle(
            new ObterMeuPerfilQuery(Guid.NewGuid()), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Usuário não encontrado.");
    }
}
```

- [ ] **Step 5: Adicionar `GET /api/auth/me` ao `AuthController`**

Agora que `ObterMeuPerfilQuery` existe, adicionar o endpoint. Abrir `src/CasaDiAna.API/Controllers/AuthController.cs` e:

1. Adicionar os usings no topo:
```csharp
using CasaDiAna.Application.Usuarios.Dtos;
using CasaDiAna.Application.Usuarios.Queries.ObterMeuPerfil;
```

2. Adicionar o método dentro da classe `AuthController`, após `ConfirmarSetup2Fa`:
```csharp
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<MeuPerfilDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MeuPerfil(CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var resultado = await _mediator.Send(new ObterMeuPerfilQuery(usuarioId), ct);
        return Ok(ApiResponse<MeuPerfilDto>.Ok(resultado));
    }
```

- [ ] **Step 6: Rodar os testes**

```bash
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test 2>&1" | tail -5
```

Saída esperada: `Aprovado! – Com falha: 0`

- [ ] **Step 7: Build final do backend**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build 2>&1" | tail -5
```

Saída esperada: `Build succeeded. 0 Warning(s) 0 Error(s)`

- [ ] **Step 8: Commit**

```bash
git add src/CasaDiAna.Application/Usuarios/Dtos/MeuPerfilDto.cs \
        src/CasaDiAna.Application/Usuarios/Queries/ObterMeuPerfil/ \
        src/CasaDiAna.API/Controllers/AuthController.cs \
        tests/CasaDiAna.Application.Tests/Usuarios/ObterMeuPerfilQueryHandlerTests.cs
git commit -m "feat(application): MeuPerfilDto, ObterMeuPerfilQuery, handler, GET /api/auth/me"
```

---

## Task 7: Frontend — componentes reutilizáveis (`RelativeTime`, `InfoRow`, `StatusBadge2Fa`)

> **REQUIRED:** Invoke `frontend-design` skill before writing any component code. Apresente o design dos 3 componentes e aguarde aprovação antes de implementar.

**Files:**
- Create: `frontend/src/components/ui/RelativeTime.tsx`
- Create: `frontend/src/components/ui/InfoRow.tsx`
- Create: `frontend/src/components/ui/StatusBadge2Fa.tsx`

- [ ] **Step 1: Invocar `frontend-design` skill para os 3 componentes**

Descreva ao skill: três componentes reutilizáveis premium para o sistema Casa di Ana, usando design tokens CSS (`--ada-*`) e Tailwind v4, sem dependências externas.

- [ ] **Step 2: Criar `RelativeTime.tsx`**

```tsx
// frontend/src/components/ui/RelativeTime.tsx
interface Props {
  date: string | Date | null | undefined
  fallback?: string
}

export function RelativeTime({ date, fallback = 'Nunca' }: Props) {
  if (!date) return <span style={{ color: 'var(--ada-muted)' }}>{fallback}</span>

  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return <span style={{ color: 'var(--ada-muted)' }}>{fallback}</span>

  const now = Date.now()
  const diffMs = now - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffH = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  let label: string
  if (diffMin < 1) label = 'agora mesmo'
  else if (diffMin < 60) label = `há ${diffMin} min`
  else if (diffH < 24) label = `há ${diffH}h`
  else if (diffDays < 7) label = `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`
  else label = d.toLocaleDateString('pt-BR')

  return (
    <time
      dateTime={d.toISOString()}
      title={d.toLocaleString('pt-BR')}
      style={{ color: 'var(--ada-muted)' }}
      className="text-sm"
    >
      {label}
    </time>
  )
}
```

- [ ] **Step 3: Criar `InfoRow.tsx`**

```tsx
// frontend/src/components/ui/InfoRow.tsx
import type { ReactNode } from 'react'

interface Props {
  label: string
  children: ReactNode
  icon?: ReactNode
}

export function InfoRow({ label, children, icon }: Props) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0"
      style={{ borderColor: 'var(--ada-border)' }}>
      {icon && (
        <span className="mt-0.5 shrink-0" style={{ color: 'var(--ada-muted)' }}>
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide mb-0.5"
          style={{ color: 'var(--ada-muted)' }}>
          {label}
        </p>
        <div className="text-sm font-medium" style={{ color: 'var(--ada-heading)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Criar `StatusBadge2Fa.tsx`**

```tsx
// frontend/src/components/ui/StatusBadge2Fa.tsx
import { ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline'

interface Props {
  status: 'ativo' | 'inativo'
}

export function StatusBadge2Fa({ status }: Props) {
  if (status === 'ativo') {
    return (
      <span className="inline-flex items-center gap-1 badge badge-active">
        <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
        Ativo
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1 badge badge-inactive"
      title="O usuário deve ativar em Minha Conta"
      style={{ cursor: 'help' }}
    >
      <ShieldExclamationIcon className="h-3.5 w-3.5" aria-hidden="true" />
      Inativo
    </span>
  )
}
```

- [ ] **Step 5: Verificar tipos**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Saída esperada: nenhuma saída (sem erros).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ui/RelativeTime.tsx \
        frontend/src/components/ui/InfoRow.tsx \
        frontend/src/components/ui/StatusBadge2Fa.tsx
git commit -m "feat(frontend): componentes reutilizáveis RelativeTime, InfoRow, StatusBadge2Fa"
```

---

## Task 8: Frontend — `minhaContaService.ts`

**Files:**
- Create: `frontend/src/features/minha-conta/services/minhaContaService.ts`

- [ ] **Step 1: Criar o diretório e o serviço**

```bash
mkdir -p frontend/src/features/minha-conta/services
```

```ts
// frontend/src/features/minha-conta/services/minhaContaService.ts
import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'

export interface MeuPerfilDto {
  nome: string
  email: string
  papel: string
  twoFactorHabilitado: boolean
  ultimoLogin: string | null
  ipUltimoLogin: string | null
  userAgentUltimoLogin: string | null
  totalLogins: number
}

export const minhaContaService = {
  obterMeuPerfil: async (): Promise<MeuPerfilDto> => {
    const resp = await api.get<ApiResponse<MeuPerfilDto>>('/auth/me')
    if (!resp.data.sucesso)
      throw new Error(resp.data.erros?.[0] ?? 'Erro ao carregar perfil.')
    return resp.data.dados
  },
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/minha-conta/services/minhaContaService.ts
git commit -m "feat(frontend): minhaContaService com obterMeuPerfil"
```

---

## Task 9: Frontend — `MinhaContaPage` reescrita

> **REQUIRED:** Invoke `frontend-design` skill antes de implementar. Descreva: página premium de perfil com duas seções — "Dados da Conta" (usando `<InfoRow>`) e "Autenticação em Dois Fatores" (condicional: ativar ou reconfigurar). Padrão visual Casa di Ana: tokens `--ada-*`, Tailwind v4, skeleton de carregamento, `<StatusBadge2Fa>`, `<RelativeTime>`.

**Files:**
- Modify: `frontend/src/features/minha-conta/pages/MinhaContaPage.tsx`

- [ ] **Step 1: Invocar `frontend-design` skill para a página**

- [ ] **Step 2: Substituir o conteúdo de `MinhaContaPage.tsx`**

```tsx
// frontend/src/features/minha-conta/pages/MinhaContaPage.tsx
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import {
  UserCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  ComputerDesktopIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline'
import { authService } from '@/features/auth/services/authService'
import type { IniciarSetup2FaResultDto } from '@/features/auth/services/authService'
import { minhaContaService, type MeuPerfilDto } from '../services/minhaContaService'
import { PageHeader } from '@/components/ui/PageHeader'
import { InfoRow } from '@/components/ui/InfoRow'
import { RelativeTime } from '@/components/ui/RelativeTime'
import { StatusBadge2Fa } from '@/components/ui/StatusBadge2Fa'
import { Spinner } from '@/components/form/Spinner'

type Passo = 'idle' | 'qrcode' | 'recovery' | 'confirmar'

function parseUserAgent(ua: string | null): string {
  if (!ua) return 'Dispositivo desconhecido'
  const browser = /Chrome\//.test(ua) ? 'Chrome'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Safari\//.test(ua) && !/Chrome/.test(ua) ? 'Safari'
    : /Edg\//.test(ua) ? 'Edge'
    : 'Navegador'
  const os = /Windows/.test(ua) ? 'Windows'
    : /Mac OS/.test(ua) ? 'macOS'
    : /Linux/.test(ua) ? 'Linux'
    : /Android/.test(ua) ? 'Android'
    : /iPhone|iPad/.test(ua) ? 'iOS'
    : 'SO desconhecido'
  return `${browser} · ${os}`
}

export function MinhaContaPage() {
  const [perfil, setPerfil] = useState<MeuPerfilDto | null>(null)
  const [carregandoPerfil, setCarregandoPerfil] = useState(true)
  const [erroPerfil, setErroPerfil] = useState<string | null>(null)

  const [passo, setPasso] = useState<Passo>('idle')
  const [setupData, setSetupData] = useState<IniciarSetup2FaResultDto | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [codigosConfirmados, setCodigosConfirmados] = useState(false)
  const [codigoConfirmacao, setCodigoConfirmacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const carregarPerfil = async () => {
    setCarregandoPerfil(true)
    setErroPerfil(null)
    try {
      setPerfil(await minhaContaService.obterMeuPerfil())
    } catch (e: unknown) {
      setErroPerfil((e as Error)?.message ?? 'Erro ao carregar perfil.')
    } finally {
      setCarregandoPerfil(false)
    }
  }

  useEffect(() => { carregarPerfil() }, [])

  const iniciarSetup = async () => {
    setCarregando(true)
    setErro(null)
    setSucesso(null)
    try {
      const dados = await authService.iniciarSetup2Fa()
      const dataUrl = await QRCode.toDataURL(dados.qrCodeUrl, { width: 200, margin: 1 })
      setSetupData(dados)
      setQrDataUrl(dataUrl)
      setPasso('qrcode')
    } catch (e: unknown) {
      setErro((e as Error)?.message ?? 'Erro ao iniciar setup.')
    } finally {
      setCarregando(false)
    }
  }

  const confirmarSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigoConfirmacao.trim() || !setupData) return
    setCarregando(true)
    setErro(null)
    try {
      await authService.confirmarSetup2Fa(
        setupData.secretManual,
        codigoConfirmacao.trim(),
        setupData.codigosRecuperacao
      )
      setPasso('idle')
      setSetupData(null)
      setQrDataUrl(null)
      setCodigosConfirmados(false)
      setCodigoConfirmacao('')
      setSucesso('Autenticação em dois fatores ativada com sucesso.')
      await carregarPerfil()
    } catch (e: unknown) {
      setErro((e as Error)?.message ?? 'Código inválido.')
    } finally {
      setCarregando(false)
    }
  }

  const cancelarSetup = () => {
    setPasso('idle')
    setSetupData(null)
    setQrDataUrl(null)
    setCodigosConfirmados(false)
    setCodigoConfirmacao('')
    setErro(null)
  }

  return (
    <div className="ada-page">
      <PageHeader
        titulo="Minha Conta"
        breadcrumb={['Configurações', 'Minha Conta']}
        subtitulo="Gerencie seus dados e segurança"
      />

      {/* ── Dados da Conta ─────────────────────────────────────────── */}
      <div className="ada-surface-card p-6 mb-6 max-w-xl">
        <h2 className="text-base font-semibold mb-4"
          style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}>
          Dados da Conta
        </h2>

        {carregandoPerfil ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton h-10 rounded-lg" />
            ))}
          </div>
        ) : erroPerfil ? (
          <p className="text-sm" style={{ color: '#DC2626' }}>{erroPerfil}</p>
        ) : perfil ? (
          <>
            <InfoRow label="Nome" icon={<UserCircleIcon className="h-4 w-4" />}>
              {perfil.nome}
            </InfoRow>
            <InfoRow label="Papel" icon={<ShieldCheckIcon className="h-4 w-4" />}>
              <span className="inline-block text-[12px] font-semibold rounded-md px-2 py-0.5"
                style={{ background: 'var(--ada-bg)', color: 'var(--ada-muted)', border: '1px solid var(--ada-border)' }}>
                {perfil.papel}
              </span>
            </InfoRow>
            <InfoRow label="Último acesso" icon={<ClockIcon className="h-4 w-4" />}>
              <RelativeTime date={perfil.ultimoLogin} />
            </InfoRow>
            <InfoRow label="Dispositivo" icon={<ComputerDesktopIcon className="h-4 w-4" />}>
              {parseUserAgent(perfil.userAgentUltimoLogin)}
            </InfoRow>
            <InfoRow label="Total de acessos" icon={<HashtagIcon className="h-4 w-4" />}>
              {perfil.totalLogins}
            </InfoRow>
          </>
        ) : null}
      </div>

      {/* ── Autenticação em Dois Fatores ───────────────────────────── */}
      <div className="ada-surface-card p-6 max-w-xl">
        <h2 className="text-base font-semibold mb-1"
          style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}>
          Autenticação em Dois Fatores
        </h2>

        {sucesso && (
          <div className="mt-3 rounded-lg px-4 py-3 text-sm mb-4"
            style={{ background: 'var(--ada-success-bg, #f0fdf4)', border: '1px solid #86efac', color: '#15803d' }}>
            {sucesso}
          </div>
        )}

        {erro && (
          <div className="mt-3 rounded-lg px-4 py-3 text-sm mb-4"
            style={{ background: 'var(--ada-error-bg)', border: '1px solid var(--ada-error-border)', color: '#DC2626' }}>
            {erro}
          </div>
        )}

        {passo === 'idle' && (
          <>
            {perfil?.twoFactorHabilitado ? (
              <div className="mt-3 space-y-4">
                <div className="flex items-center gap-3">
                  <StatusBadge2Fa status="ativo" />
                  <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>
                    Sua conta está protegida com autenticação em dois fatores.
                  </p>
                </div>
                <button onClick={iniciarSetup} disabled={carregando} className="btn-secondary">
                  {carregando ? <Spinner /> : null}
                  {carregando ? 'Aguarde…' : 'Reconfigurar autenticador'}
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm mb-4 mt-2" style={{ color: 'var(--ada-muted)' }}>
                  Adicione uma camada extra de segurança usando Google Authenticator, Microsoft Authenticator ou qualquer app TOTP.
                </p>
                <button onClick={iniciarSetup} disabled={carregando || carregandoPerfil} className="btn-primary">
                  {carregando ? <Spinner /> : null}
                  {carregando ? 'Aguarde…' : 'Ativar autenticação em dois fatores'}
                </button>
              </>
            )}
          </>
        )}

        {passo === 'qrcode' && setupData && (
          <div className="space-y-4 mt-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
              Passo 1 — Escaneie o QR code
            </p>
            <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>
              Abra o app autenticador e escaneie o código abaixo. Caso não consiga escanear, insira o código manualmente.
            </p>
            {qrDataUrl && (
              <div className="flex justify-center py-2">
                <img src={qrDataUrl} alt="QR Code para configurar 2FA" className="rounded-lg"
                  style={{ width: 200, height: 200 }} />
              </div>
            )}
            <div className="rounded-lg px-3 py-2 text-xs font-mono break-all"
              style={{ background: 'var(--ada-surface-sub, var(--ada-surface))', border: '1px solid var(--ada-border)', color: 'var(--ada-muted)' }}>
              {setupData.secretManual}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setPasso('recovery')} className="btn-primary flex-1">
                Próximo →
              </button>
              <button onClick={cancelarSetup} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        )}

        {passo === 'recovery' && setupData && (
          <div className="space-y-4 mt-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
              Passo 2 — Salve seus códigos de recuperação
            </p>
            <div className="rounded-lg p-3 border"
              style={{ background: 'var(--ada-warning-badge, #fef9c3)', borderColor: 'var(--ada-warning-border, #fde047)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#854d0e' }}>
                ⚠ Guarde estes códigos em lugar seguro — não serão exibidos novamente.
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {setupData.codigosRecuperacao.map((c, i) => (
                  <span key={i} className="text-xs font-mono px-2 py-1 rounded text-center"
                    style={{ background: 'rgba(255,255,255,0.7)', color: '#1c1917', border: '1px solid rgba(0,0,0,0.1)' }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={codigosConfirmados}
                onChange={e => setCodigosConfirmados(e.target.checked)}
                className="w-4 h-4 accent-amber-600" />
              <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
                Guardei meus códigos de recuperação
              </span>
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setPasso('confirmar')} disabled={!codigosConfirmados}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                Próximo →
              </button>
              <button onClick={cancelarSetup} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        )}

        {passo === 'confirmar' && (
          <form onSubmit={confirmarSetup} className="space-y-4 mt-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
              Passo 3 — Confirme com o app
            </p>
            <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>
              Digite o código de 6 dígitos que aparece no seu app autenticador.
            </p>
            <input
              type="text"
              value={codigoConfirmacao}
              onChange={e => setCodigoConfirmacao(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold
                         text-[var(--ada-heading)] bg-white border border-[var(--ada-border)]
                         outline-none transition-all duration-200
                         focus-visible:border-[#C4870A] focus-visible:ring-2 focus-visible:ring-[#C4870A]/20"
              style={{ boxShadow: 'var(--shadow-xs)' }}
            />
            <div className="flex gap-3 pt-2">
              <button type="submit"
                disabled={carregando || codigoConfirmacao.length !== 6}
                className="btn-primary flex-1 disabled:opacity-50">
                {carregando ? <Spinner /> : null}
                {carregando ? 'Verificando…' : 'Ativar 2FA'}
              </button>
              <button type="button" onClick={cancelarSetup} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar tipos**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/minha-conta/pages/MinhaContaPage.tsx
git commit -m "feat(frontend): MinhaContaPage com status 2FA real, dados de perfil e reconfigurar"
```

---

## Task 10: Frontend — `UsuariosPage` com coluna "Último Login" e `StatusBadge2Fa`

> **REQUIRED:** Invoke `frontend-design` skill antes de modificar o arquivo. Descreva: adicionar coluna "Último Login" usando `<RelativeTime>` e substituir os badges de 2FA pelo `<StatusBadge2Fa>` — manter o layout existente sem redesenhar a página.

**Files:**
- Modify: `frontend/src/features/usuarios/pages/UsuariosPage.tsx`

- [ ] **Step 1: Invocar `frontend-design` skill**

- [ ] **Step 2: Adicionar os imports no topo de `UsuariosPage.tsx`**

Após os imports existentes, adicionar:

```tsx
import { RelativeTime } from '@/components/ui/RelativeTime'
import { StatusBadge2Fa } from '@/components/ui/StatusBadge2Fa'
```

- [ ] **Step 3: Adicionar `ultimoLogin` ao tipo `UsuarioDto` no frontend**

Localizar onde `UsuarioDto` é importado de `usuariosService`. Abrir o arquivo de serviço e adicionar o campo:

```ts
// em frontend/src/features/usuarios/services/usuariosService.ts
// Adicionar ao interface/type UsuarioDto:
ultimoLogin: string | null
```

- [ ] **Step 4: Adicionar cabeçalho "Último Login" na tabela**

Localizar o bloco `<thead>` e adicionar após o `<th>` de "2FA":

```tsx
<th className="table-th" scope="col">Último Login</th>
```

- [ ] **Step 5: Substituir os badges de 2FA pelo `<StatusBadge2Fa>`**

Localizar o bloco:
```tsx
<td className="table-td">
  {u.twoFactorHabilitado ? (
    <span className="badge badge-active">Ativo</span>
  ) : (
    <span className="badge badge-inactive">Inativo</span>
  )}
</td>
```

Substituir por:
```tsx
<td className="table-td">
  <StatusBadge2Fa status={u.twoFactorHabilitado ? 'ativo' : 'inativo'} />
</td>
```

- [ ] **Step 6: Adicionar célula "Último Login" na linha de dados**

Após a célula de 2FA e antes da célula de ações:

```tsx
<td className="table-td">
  <RelativeTime date={u.ultimoLogin} />
</td>
```

- [ ] **Step 7: Verificar tipos**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/features/usuarios/pages/UsuariosPage.tsx \
        frontend/src/features/usuarios/services/usuariosService.ts
git commit -m "feat(frontend): UsuariosPage com coluna Último Login e StatusBadge2Fa com tooltip"
```

---

## Verificação Final

- [ ] **Backend build limpo**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build 2>&1" | tail -5
```

Saída esperada: `Build succeeded. 0 Warning(s) 0 Error(s)`

- [ ] **Todos os testes passando**

```bash
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test 2>&1" | tail -5
```

Saída esperada: `Aprovado! – Com falha: 0`

- [ ] **TypeScript sem erros**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -10
```

Saída esperada: nenhuma saída.

- [ ] **Push**

```bash
git push origin master
```
