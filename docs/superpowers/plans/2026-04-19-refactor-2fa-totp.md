# Refatoração 2FA: SMS (Twilio) → TOTP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir 2FA baseado em SMS (Twilio) por TOTP (RFC 6238), eliminando dependência e custo externo — usuário usa Google/Microsoft Authenticator, com recovery codes BCrypt.

**Architecture:** TOTP puro processado localmente com `Otp.NET` (NuGet). Backend gera/valida secrets; frontend renderiza QR code com `qrcode` (npm). Recovery codes em BCrypt na tabela `auth.codigos_recuperacao`. Setup feito pelo próprio usuário em `/minha-conta`; Admin só desabilita em emergência.

**Tech Stack:** `Otp.NET` (NuGet, backend), `qrcode` npm (frontend QR), BCrypt já existente para hashing dos recovery codes, EF Core migration para esquema.

---

## Mapa de Arquivos

### Criar
- `src/CasaDiAna.Domain/Entities/CodigoRecuperacao.cs`
- `src/CasaDiAna.Domain/Interfaces/ICodigoRecuperacaoRepository.cs`
- `src/CasaDiAna.Domain/Interfaces/ITotpService.cs`
- `src/CasaDiAna.Infrastructure/Services/TotpService.cs`
- `src/CasaDiAna.Infrastructure/Persistence/Configurations/CodigoRecuperacaoConfiguration.cs`
- `src/CasaDiAna.Infrastructure/Repositories/CodigoRecuperacaoRepository.cs`
- `src/CasaDiAna.Infrastructure/Migrations/<timestamp>_RefatorarTotpAuth.cs` (gerada via EF)
- `src/CasaDiAna.Application/Auth/Commands/IniciarSetup2Fa/IniciarSetup2FaCommand.cs`
- `src/CasaDiAna.Application/Auth/Commands/IniciarSetup2Fa/IniciarSetup2FaCommandHandler.cs`
- `src/CasaDiAna.Application/Auth/Commands/ConfirmarSetup2Fa/ConfirmarSetup2FaCommand.cs`
- `src/CasaDiAna.Application/Auth/Commands/ConfirmarSetup2Fa/ConfirmarSetup2FaCommandHandler.cs`
- `src/CasaDiAna.Application/Auth/Dtos/IniciarSetup2FaResultDto.cs`
- `tests/CasaDiAna.Application.Tests/Auth/IniciarSetup2FaCommandHandlerTests.cs`
- `tests/CasaDiAna.Application.Tests/Auth/ConfirmarSetup2FaCommandHandlerTests.cs`
- `frontend/src/features/minha-conta/pages/MinhaContaPage.tsx`
- `frontend/src/features/minha-conta/services/minhaContaService.ts`

### Modificar
- `src/CasaDiAna.Domain/Entities/Usuario.cs` — remove campos SMS, adiciona `TotpSecret`, novos métodos
- `src/CasaDiAna.Infrastructure/Persistence/Configurations/UsuarioConfiguration.cs` — remove colunas SMS, adiciona `totp_secret`
- `src/CasaDiAna.Infrastructure/DependencyInjection.cs` — troca `ISmsService/TwilioSmsService` → `ITotpService/TotpService`, adiciona `ICodigoRecuperacaoRepository`
- `src/CasaDiAna.Infrastructure/CasaDiAna.Infrastructure.csproj` — remove Twilio, adiciona Otp.NET
- `src/CasaDiAna.Application/Auth/Commands/Login/LoginCommandHandler.cs` — remove lógica SMS
- `src/CasaDiAna.Application/Auth/Commands/VerificarOtp/VerificarOtpCommandHandler.cs` — valida TOTP + recovery code
- `src/CasaDiAna.Application/Auth/Dtos/LoginResultDto.cs` — remove `TelefoneMascarado`
- `src/CasaDiAna.Application/Usuarios/Commands/Desabilitar2Fa/Desabilitar2FaCommandHandler.cs` — deleta recovery codes
- `src/CasaDiAna.API/Controllers/AuthController.cs` — remove reenviar-codigo, adiciona iniciar/confirmar-setup-2fa
- `src/CasaDiAna.API/Controllers/UsuariosController.cs` — remove habilitar-2fa (com telefone)
- `tests/CasaDiAna.Application.Tests/Auth/LoginCommandHandlerTests.cs` — remove mocks de SMS
- `tests/CasaDiAna.Application.Tests/Auth/VerificarOtpCommandHandlerTests.cs` — reescreve para TOTP + recovery
- `tests/CasaDiAna.Application.Tests/Usuarios/Habilitar2FaCommandHandlerTests.cs` — substitui por Desabilitar2FaCommandHandlerTests
- `frontend/src/features/auth/services/authService.ts` — remove reenviarCodigo, adiciona iniciarSetup2Fa/confirmarSetup2Fa
- `frontend/src/features/auth/components/form/LoginForm.tsx` — remove reenvio, atualiza hints
- `frontend/src/components/layout/TopHeader.tsx` — adiciona link "Minha Conta"
- `frontend/src/routes/AppRoutes.tsx` — adiciona rota `/minha-conta`

### Deletar
- `src/CasaDiAna.Domain/Interfaces/ISmsService.cs`
- `src/CasaDiAna.Infrastructure/Services/TwilioSmsService.cs`
- `src/CasaDiAna.Application/Auth/Commands/ReenviarCodigo/ReenviarCodigoCommand.cs`
- `src/CasaDiAna.Application/Auth/Commands/ReenviarCodigo/ReenviarCodigoCommandHandler.cs`
- `src/CasaDiAna.Application/Usuarios/Commands/Habilitar2Fa/Habilitar2FaCommand.cs`
- `src/CasaDiAna.Application/Usuarios/Commands/Habilitar2Fa/Habilitar2FaCommandHandler.cs`
- `src/CasaDiAna.Application/Usuarios/Commands/Habilitar2Fa/Habilitar2FaCommandValidator.cs`

---

## Task 1: Domínio — entidade `CodigoRecuperacao` e interface `ICodigoRecuperacaoRepository`

**Files:**
- Create: `src/CasaDiAna.Domain/Entities/CodigoRecuperacao.cs`
- Create: `src/CasaDiAna.Domain/Interfaces/ICodigoRecuperacaoRepository.cs`

- [ ] **Step 1: Criar entidade `CodigoRecuperacao`**

```csharp
// src/CasaDiAna.Domain/Entities/CodigoRecuperacao.cs
namespace CasaDiAna.Domain.Entities;

public class CodigoRecuperacao
{
    public Guid Id { get; private set; }
    public Guid UsuarioId { get; private set; }
    public string CodigoHash { get; private set; } = string.Empty;
    public DateTime? UsadoEm { get; private set; }
    public DateTime CriadoEm { get; private set; }

    private CodigoRecuperacao() { }

    public static CodigoRecuperacao Criar(Guid usuarioId, string codigoHash)
    {
        return new CodigoRecuperacao
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            CodigoHash = codigoHash,
            CriadoEm = DateTime.UtcNow
        };
    }

    public void MarcarUsado()
    {
        UsadoEm = DateTime.UtcNow;
    }
}
```

- [ ] **Step 2: Criar interface `ICodigoRecuperacaoRepository`**

```csharp
// src/CasaDiAna.Domain/Interfaces/ICodigoRecuperacaoRepository.cs
namespace CasaDiAna.Domain.Interfaces;

public interface ICodigoRecuperacaoRepository
{
    Task AdicionarAsync(IEnumerable<CodigoRecuperacao> codigos, CancellationToken ct);
    Task<IReadOnlyList<CodigoRecuperacao>> ObterAtivosPorUsuarioAsync(Guid usuarioId, CancellationToken ct);
    Task MarcarUsadoAsync(Guid id, CancellationToken ct);
    Task DeletarPorUsuarioAsync(Guid usuarioId, CancellationToken ct);
}
```

Usando o namespace `CasaDiAna.Domain.Entities` está implícito via `using` global do projeto; verificar se o projeto tem `ImplicitUsings` ou adicionar `using CasaDiAna.Domain.Entities;` explicitamente se necessário.

- [ ] **Step 3: Commit**

```bash
git add src/CasaDiAna.Domain/Entities/CodigoRecuperacao.cs \
        src/CasaDiAna.Domain/Interfaces/ICodigoRecuperacaoRepository.cs
git commit -m "feat(domain): entidade CodigoRecuperacao e interface ICodigoRecuperacaoRepository"
```

---

## Task 2: Domínio — refatorar `Usuario` para TOTP

**Files:**
- Modify: `src/CasaDiAna.Domain/Entities/Usuario.cs`
- Create: `src/CasaDiAna.Domain/Interfaces/ITotpService.cs`

- [ ] **Step 1: Criar interface `ITotpService`**

```csharp
// src/CasaDiAna.Domain/Interfaces/ITotpService.cs
namespace CasaDiAna.Domain.Interfaces;

public interface ITotpService
{
    string GerarSecret();
    string GerarQrCodeUrl(string secret, string email, string emissor = "Casa di Ana");
    bool ValidarCodigo(string secret, string codigo);
}
```

- [ ] **Step 2: Reescrever `Usuario.cs` — remover campos SMS, adicionar TOTP**

Substituir o conteúdo completo do arquivo:

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
}
```

- [ ] **Step 3: Tentar compilar para confirmar que quebras são esperadas**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build 2>&1" | head -50
```

Erros esperados neste ponto: referências a `GerarOtp`, `ValidarOtp`, `LimparOtp`, `MascararTelefone`, `HabilitarDoisFatores`, `DesabilitarDoisFatores`, `Telefone`, `CodigoOtpHash`, `CodigoOtpExpiraEm`, `CodigoOtpTentativas`, `ISmsService`. Serão corrigidos nas tasks seguintes.

- [ ] **Step 4: Commit**

```bash
git add src/CasaDiAna.Domain/Entities/Usuario.cs \
        src/CasaDiAna.Domain/Interfaces/ITotpService.cs
git commit -m "feat(domain): substitui campos SMS por TotpSecret em Usuario, cria ITotpService"
```

---

## Task 3: Infraestrutura — `TotpService`, trocar NuGet, remover Twilio

**Files:**
- Modify: `src/CasaDiAna.Infrastructure/CasaDiAna.Infrastructure.csproj`
- Create: `src/CasaDiAna.Infrastructure/Services/TotpService.cs`
- Delete: `src/CasaDiAna.Infrastructure/Services/TwilioSmsService.cs`
- Delete: `src/CasaDiAna.Domain/Interfaces/ISmsService.cs`

- [ ] **Step 1: Trocar pacotes NuGet**

```bash
cd src/CasaDiAna.Infrastructure
dotnet remove package Twilio
dotnet add package Otp.NET --version 1.4.0
cd ../..
```

Confirmar que `CasaDiAna.Infrastructure.csproj` não contém mais `Twilio` e contém `Otp.NET`.

- [ ] **Step 2: Criar `TotpService`**

```csharp
// src/CasaDiAna.Infrastructure/Services/TotpService.cs
using CasaDiAna.Domain.Interfaces;
using OtpNet;

namespace CasaDiAna.Infrastructure.Services;

public class TotpService : ITotpService
{
    public string GerarSecret()
    {
        var key = KeyGeneration.GenerateRandomKey(20);
        return Base32Encoding.ToString(key);
    }

    public string GerarQrCodeUrl(string secret, string email, string emissor = "Casa di Ana")
    {
        var emissorEncoded = Uri.EscapeDataString(emissor);
        var emailEncoded   = Uri.EscapeDataString(email);
        var secretClean    = secret.Replace(" ", "").ToUpperInvariant();
        return $"otpauth://totp/{emissorEncoded}:{emailEncoded}?secret={secretClean}&issuer={emissorEncoded}&algorithm=SHA1&digits=6&period=30";
    }

    public bool ValidarCodigo(string secret, string codigo)
    {
        if (string.IsNullOrWhiteSpace(secret) || string.IsNullOrWhiteSpace(codigo))
            return false;

        var secretBytes = Base32Encoding.ToBytes(secret);
        var totp = new Totp(secretBytes);
        return totp.VerifyTotp(codigo.Trim(), out _, new VerificationWindow(1, 1));
    }
}
```

- [ ] **Step 3: Deletar arquivos obsoletos**

```bash
rm src/CasaDiAna.Infrastructure/Services/TwilioSmsService.cs
rm src/CasaDiAna.Domain/Interfaces/ISmsService.cs
```

- [ ] **Step 4: Commit**

```bash
git add src/CasaDiAna.Infrastructure/CasaDiAna.Infrastructure.csproj \
        src/CasaDiAna.Infrastructure/Services/TotpService.cs
git rm src/CasaDiAna.Infrastructure/Services/TwilioSmsService.cs \
       src/CasaDiAna.Domain/Interfaces/ISmsService.cs
git commit -m "feat(infra): TotpService com Otp.NET, remove TwilioSmsService e ISmsService"
```

---

## Task 4: Infraestrutura — `UsuarioConfiguration`, `CodigoRecuperacaoConfiguration`, `CodigoRecuperacaoRepository`

**Files:**
- Modify: `src/CasaDiAna.Infrastructure/Persistence/Configurations/UsuarioConfiguration.cs`
- Create: `src/CasaDiAna.Infrastructure/Persistence/Configurations/CodigoRecuperacaoConfiguration.cs`
- Create: `src/CasaDiAna.Infrastructure/Repositories/CodigoRecuperacaoRepository.cs`

- [ ] **Step 1: Atualizar `UsuarioConfiguration`**

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
    }
}
```

- [ ] **Step 2: Criar `CodigoRecuperacaoConfiguration`**

```csharp
// src/CasaDiAna.Infrastructure/Persistence/Configurations/CodigoRecuperacaoConfiguration.cs
using CasaDiAna.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasaDiAna.Infrastructure.Persistence.Configurations;

public class CodigoRecuperacaoConfiguration : IEntityTypeConfiguration<CodigoRecuperacao>
{
    public void Configure(EntityTypeBuilder<CodigoRecuperacao> builder)
    {
        builder.ToTable("codigos_recuperacao", "auth");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.UsuarioId).HasColumnName("usuario_id").IsRequired();
        builder.Property(c => c.CodigoHash).HasColumnName("codigo_hash").IsRequired();
        builder.Property(c => c.UsadoEm).HasColumnName("usado_em").HasColumnType("timestamptz");
        builder.Property(c => c.CriadoEm).HasColumnName("criado_em").IsRequired();

        builder.HasIndex(c => c.UsuarioId);
    }
}
```

- [ ] **Step 3: Registrar `CodigoRecuperacao` no `AppDbContext`**

Abrir `src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs` e adicionar o DbSet:

```csharp
public DbSet<CodigoRecuperacao> CodigosRecuperacao => Set<CodigoRecuperacao>();
```

- [ ] **Step 4: Criar `CodigoRecuperacaoRepository`**

```csharp
// src/CasaDiAna.Infrastructure/Repositories/CodigoRecuperacaoRepository.cs
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class CodigoRecuperacaoRepository : ICodigoRecuperacaoRepository
{
    private readonly AppDbContext _db;

    public CodigoRecuperacaoRepository(AppDbContext db) => _db = db;

    public async Task AdicionarAsync(IEnumerable<CodigoRecuperacao> codigos, CancellationToken ct)
    {
        await _db.CodigosRecuperacao.AddRangeAsync(codigos, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<CodigoRecuperacao>> ObterAtivosPorUsuarioAsync(
        Guid usuarioId, CancellationToken ct)
    {
        return await _db.CodigosRecuperacao
            .Where(c => c.UsuarioId == usuarioId && c.UsadoEm == null)
            .ToListAsync(ct);
    }

    public async Task MarcarUsadoAsync(Guid id, CancellationToken ct)
    {
        var codigo = await _db.CodigosRecuperacao.FindAsync([id], ct);
        if (codigo is null) return;
        codigo.MarcarUsado();
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeletarPorUsuarioAsync(Guid usuarioId, CancellationToken ct)
    {
        await _db.CodigosRecuperacao
            .Where(c => c.UsuarioId == usuarioId)
            .ExecuteDeleteAsync(ct);
    }
}
```

- [ ] **Step 5: Atualizar `DependencyInjection.cs`**

Remover a linha `services.AddScoped<ISmsService, TwilioSmsService>();` e adicionar as duas novas linhas:

```csharp
// Remover:
// services.AddScoped<ISmsService, TwilioSmsService>();

// Adicionar após services.AddScoped<IJwtService, JwtService>():
services.AddScoped<ITotpService, TotpService>();
services.AddScoped<ICodigoRecuperacaoRepository, CodigoRecuperacaoRepository>();
```

- [ ] **Step 6: Buildar para verificar infraestrutura compila**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build 2>&1" | head -60
```

Erros esperados ainda: handlers de Application que referenciam `ISmsService`, `GerarOtp`, etc. Serão corrigidos na Task 5.

- [ ] **Step 7: Commit**

```bash
git add src/CasaDiAna.Infrastructure/Persistence/Configurations/UsuarioConfiguration.cs \
        src/CasaDiAna.Infrastructure/Persistence/Configurations/CodigoRecuperacaoConfiguration.cs \
        src/CasaDiAna.Infrastructure/Persistence/AppDbContext.cs \
        src/CasaDiAna.Infrastructure/Repositories/CodigoRecuperacaoRepository.cs \
        src/CasaDiAna.Infrastructure/DependencyInjection.cs
git commit -m "feat(infra): CodigoRecuperacaoRepository, configurações EF, registra TotpService no DI"
```

---

## Task 5: EF Core — Migration

**Files:**
- Create: migration gerada pelo EF (caminho automático em `src/CasaDiAna.Infrastructure/Migrations/`)

- [ ] **Step 1: Gerar migration**

```bash
dotnet ef migrations add RefatorarTotpAuth \
  --project src/CasaDiAna.Infrastructure \
  --startup-project src/CasaDiAna.API
```

- [ ] **Step 2: Editar o arquivo de migration gerado**

Abrir o arquivo `src/CasaDiAna.Infrastructure/Migrations/<timestamp>_RefatorarTotpAuth.cs` e verificar que o método `Up` contém:
1. `DropColumn` para `telefone`, `codigo_otp_hash`, `codigo_otp_expira_em`, `codigo_otp_tentativas`
2. `AddColumn` para `totp_secret` (nullable string)
3. `CreateTable` para `auth.codigos_recuperacao`

Adicionar ao final do método `Up` o SQL de reset do 2FA para usuários existentes:

```csharp
migrationBuilder.Sql(
    "UPDATE auth.usuarios SET two_factor_habilitado = false, totp_secret = NULL WHERE two_factor_habilitado = true");
```

- [ ] **Step 3: Aplicar migration localmente**

```bash
dotnet ef database update \
  --project src/CasaDiAna.Infrastructure \
  --startup-project src/CasaDiAna.API
```

Saída esperada: `Done.`

- [ ] **Step 4: Commit**

```bash
git add src/CasaDiAna.Infrastructure/Migrations/
git commit -m "feat(migration): RefatorarTotpAuth — remove colunas SMS, adiciona totp_secret e codigos_recuperacao"
```

---

## Task 6: Application — limpar handlers SMS, atualizar Login e VerificarOtp

**Files:**
- Modify: `src/CasaDiAna.Application/Auth/Commands/Login/LoginCommandHandler.cs`
- Modify: `src/CasaDiAna.Application/Auth/Commands/VerificarOtp/VerificarOtpCommandHandler.cs`
- Modify: `src/CasaDiAna.Application/Auth/Dtos/LoginResultDto.cs`
- Modify: `src/CasaDiAna.Application/Usuarios/Commands/Desabilitar2Fa/Desabilitar2FaCommandHandler.cs`
- Delete: `src/CasaDiAna.Application/Auth/Commands/ReenviarCodigo/ReenviarCodigoCommand.cs`
- Delete: `src/CasaDiAna.Application/Auth/Commands/ReenviarCodigo/ReenviarCodigoCommandHandler.cs`
- Delete: `src/CasaDiAna.Application/Usuarios/Commands/Habilitar2Fa/Habilitar2FaCommand.cs`
- Delete: `src/CasaDiAna.Application/Usuarios/Commands/Habilitar2Fa/Habilitar2FaCommandHandler.cs`
- Delete: `src/CasaDiAna.Application/Usuarios/Commands/Habilitar2Fa/Habilitar2FaCommandValidator.cs`

- [ ] **Step 1: Atualizar `LoginResultDto`**

```csharp
// src/CasaDiAna.Application/Auth/Dtos/LoginResultDto.cs
namespace CasaDiAna.Application.Auth.Dtos;

public record LoginResultDto(
    bool Requer2Fa,
    string? TokenTemporario,
    string? Token,
    string? Nome,
    string? Papel);
```

- [ ] **Step 2: Reescrever `LoginCommandHandler`**

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

- [ ] **Step 3: Reescrever `VerificarOtpCommandHandler`**

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

        // Tenta validar como TOTP
        if (_totp.ValidarCodigo(usuario.TotpSecret, request.Codigo))
        {
            var token = _jwtService.GerarToken(usuario);
            return new TokenDto(token, usuario.Nome, usuario.Papel.ToString());
        }

        // Tenta validar como recovery code
        var ativos = await _codigosRecuperacao.ObterAtivosPorUsuarioAsync(
            usuario.Id, cancellationToken);

        foreach (var codigo in ativos)
        {
            if (BCrypt.Net.BCrypt.Verify(request.Codigo, codigo.CodigoHash))
            {
                await _codigosRecuperacao.MarcarUsadoAsync(codigo.Id, cancellationToken);
                var token = _jwtService.GerarToken(usuario);
                return new TokenDto(token, usuario.Nome, usuario.Papel.ToString());
            }
        }

        throw new DomainException("Código inválido. Verifique o app ou use um código de recuperação.");
    }
}
```

- [ ] **Step 4: Atualizar `Desabilitar2FaCommandHandler` para deletar recovery codes**

```csharp
// src/CasaDiAna.Application/Usuarios/Commands/Desabilitar2Fa/Desabilitar2FaCommandHandler.cs
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Usuarios.Commands.Desabilitar2Fa;

public class Desabilitar2FaCommandHandler : IRequestHandler<Desabilitar2FaCommand, Unit>
{
    private readonly IUsuarioRepository _usuarios;
    private readonly ICodigoRecuperacaoRepository _codigosRecuperacao;

    public Desabilitar2FaCommandHandler(
        IUsuarioRepository usuarios,
        ICodigoRecuperacaoRepository codigosRecuperacao)
    {
        _usuarios = usuarios;
        _codigosRecuperacao = codigosRecuperacao;
    }

    public async Task<Unit> Handle(Desabilitar2FaCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorIdAsync(request.UsuarioId, cancellationToken)
            ?? throw new DomainException("Usuário não encontrado.");

        usuario.DesabilitarTotp();
        _usuarios.Atualizar(usuario);
        await _codigosRecuperacao.DeletarPorUsuarioAsync(usuario.Id, cancellationToken);
        await _usuarios.SalvarAsync(cancellationToken);

        return Unit.Value;
    }
}
```

- [ ] **Step 5: Deletar arquivos obsoletos**

```bash
rm src/CasaDiAna.Application/Auth/Commands/ReenviarCodigo/ReenviarCodigoCommand.cs
rm src/CasaDiAna.Application/Auth/Commands/ReenviarCodigo/ReenviarCodigoCommandHandler.cs
rm src/CasaDiAna.Application/Usuarios/Commands/Habilitar2Fa/Habilitar2FaCommand.cs
rm src/CasaDiAna.Application/Usuarios/Commands/Habilitar2Fa/Habilitar2FaCommandHandler.cs
rm src/CasaDiAna.Application/Usuarios/Commands/Habilitar2Fa/Habilitar2FaCommandValidator.cs
```

- [ ] **Step 6: Remover validator do ReenviarCodigo se existir**

```bash
ls src/CasaDiAna.Application/Auth/Commands/ReenviarCodigo/
# Se houver validator, remover também
rm -f src/CasaDiAna.Application/Auth/Commands/ReenviarCodigo/ReenviarCodigoCommandValidator.cs
rmdir src/CasaDiAna.Application/Auth/Commands/ReenviarCodigo/ 2>/dev/null || true
rmdir src/CasaDiAna.Application/Usuarios/Commands/Habilitar2Fa/ 2>/dev/null || true
```

- [ ] **Step 7: Commit**

```bash
git add src/CasaDiAna.Application/Auth/Dtos/LoginResultDto.cs \
        src/CasaDiAna.Application/Auth/Commands/Login/LoginCommandHandler.cs \
        src/CasaDiAna.Application/Auth/Commands/VerificarOtp/VerificarOtpCommandHandler.cs \
        src/CasaDiAna.Application/Usuarios/Commands/Desabilitar2Fa/Desabilitar2FaCommandHandler.cs
git rm src/CasaDiAna.Application/Auth/Commands/ReenviarCodigo/ReenviarCodigoCommand.cs \
       src/CasaDiAna.Application/Auth/Commands/ReenviarCodigo/ReenviarCodigoCommandHandler.cs \
       src/CasaDiAna.Application/Usuarios/Commands/Habilitar2Fa/Habilitar2FaCommand.cs \
       src/CasaDiAna.Application/Usuarios/Commands/Habilitar2Fa/Habilitar2FaCommandHandler.cs \
       src/CasaDiAna.Application/Usuarios/Commands/Habilitar2Fa/Habilitar2FaCommandValidator.cs
git commit -m "refactor(application): login sem SMS, verifica TOTP e recovery codes, remove Habilitar2Fa e ReenviarCodigo"
```

---

## Task 7: Application — `IniciarSetup2FaCommand` e `ConfirmarSetup2FaCommand`

**Files:**
- Create: `src/CasaDiAna.Application/Auth/Dtos/IniciarSetup2FaResultDto.cs`
- Create: `src/CasaDiAna.Application/Auth/Commands/IniciarSetup2Fa/IniciarSetup2FaCommand.cs`
- Create: `src/CasaDiAna.Application/Auth/Commands/IniciarSetup2Fa/IniciarSetup2FaCommandHandler.cs`
- Create: `src/CasaDiAna.Application/Auth/Commands/ConfirmarSetup2Fa/ConfirmarSetup2FaCommand.cs`
- Create: `src/CasaDiAna.Application/Auth/Commands/ConfirmarSetup2Fa/ConfirmarSetup2FaCommandHandler.cs`

- [ ] **Step 1: Criar `IniciarSetup2FaResultDto`**

```csharp
// src/CasaDiAna.Application/Auth/Dtos/IniciarSetup2FaResultDto.cs
namespace CasaDiAna.Application.Auth.Dtos;

public record IniciarSetup2FaResultDto(
    string QrCodeUrl,
    string SecretManual,
    IReadOnlyList<string> CodigosRecuperacao);
```

- [ ] **Step 2: Criar `IniciarSetup2FaCommand` e handler**

```csharp
// src/CasaDiAna.Application/Auth/Commands/IniciarSetup2Fa/IniciarSetup2FaCommand.cs
using CasaDiAna.Application.Auth.Dtos;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.IniciarSetup2Fa;

public record IniciarSetup2FaCommand(Guid UsuarioId) : IRequest<IniciarSetup2FaResultDto>;
```

```csharp
// src/CasaDiAna.Application/Auth/Commands/IniciarSetup2Fa/IniciarSetup2FaCommandHandler.cs
using CasaDiAna.Application.Auth.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.IniciarSetup2Fa;

public class IniciarSetup2FaCommandHandler
    : IRequestHandler<IniciarSetup2FaCommand, IniciarSetup2FaResultDto>
{
    private readonly IUsuarioRepository _usuarios;
    private readonly ITotpService _totp;

    public IniciarSetup2FaCommandHandler(IUsuarioRepository usuarios, ITotpService totp)
    {
        _usuarios = usuarios;
        _totp = totp;
    }

    public async Task<IniciarSetup2FaResultDto> Handle(
        IniciarSetup2FaCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorIdAsync(request.UsuarioId, cancellationToken)
            ?? throw new DomainException("Usuário não encontrado.");

        var secret = _totp.GerarSecret();
        var qrCodeUrl = _totp.GerarQrCodeUrl(secret, usuario.Email);

        var codigosRecuperacao = GerarCodigosRecuperacao(8);

        return new IniciarSetup2FaResultDto(
            QrCodeUrl: qrCodeUrl,
            SecretManual: secret,
            CodigosRecuperacao: codigosRecuperacao);
    }

    private static IReadOnlyList<string> GerarCodigosRecuperacao(int quantidade)
    {
        var codigos = new List<string>(quantidade);
        for (int i = 0; i < quantidade; i++)
        {
            var bytes = new byte[4];
            System.Security.Cryptography.RandomNumberGenerator.Fill(bytes);
            var hex = Convert.ToHexString(bytes);
            codigos.Add($"{hex[..4]}-{hex[4..]}");
        }
        return codigos;
    }
}
```

- [ ] **Step 3: Criar `ConfirmarSetup2FaCommand` e handler**

```csharp
// src/CasaDiAna.Application/Auth/Commands/ConfirmarSetup2Fa/ConfirmarSetup2FaCommand.cs
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.ConfirmarSetup2Fa;

public record ConfirmarSetup2FaCommand(
    Guid UsuarioId,
    string Secret,
    string Codigo,
    IReadOnlyList<string> CodigosRecuperacao) : IRequest<Unit>;
```

```csharp
// src/CasaDiAna.Application/Auth/Commands/ConfirmarSetup2Fa/ConfirmarSetup2FaCommandHandler.cs
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.ConfirmarSetup2Fa;

public class ConfirmarSetup2FaCommandHandler : IRequestHandler<ConfirmarSetup2FaCommand, Unit>
{
    private readonly IUsuarioRepository _usuarios;
    private readonly ITotpService _totp;
    private readonly ICodigoRecuperacaoRepository _codigosRecuperacao;

    public ConfirmarSetup2FaCommandHandler(
        IUsuarioRepository usuarios,
        ITotpService totp,
        ICodigoRecuperacaoRepository codigosRecuperacao)
    {
        _usuarios = usuarios;
        _totp = totp;
        _codigosRecuperacao = codigosRecuperacao;
    }

    public async Task<Unit> Handle(
        ConfirmarSetup2FaCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorIdAsync(request.UsuarioId, cancellationToken)
            ?? throw new DomainException("Usuário não encontrado.");

        if (!_totp.ValidarCodigo(request.Secret, request.Codigo))
            throw new DomainException("Código inválido. Verifique o app e tente novamente.");

        // Deleta recovery codes anteriores antes de salvar novos
        await _codigosRecuperacao.DeletarPorUsuarioAsync(usuario.Id, cancellationToken);

        usuario.HabilitarTotp(request.Secret);
        _usuarios.Atualizar(usuario);
        await _usuarios.SalvarAsync(cancellationToken);

        var codigos = request.CodigosRecuperacao
            .Select(c => CodigoRecuperacao.Criar(
                usuario.Id,
                BCrypt.Net.BCrypt.HashPassword(c)))
            .ToList();

        await _codigosRecuperacao.AdicionarAsync(codigos, cancellationToken);

        return Unit.Value;
    }
}
```

- [ ] **Step 4: Buildar para verificar que compila sem erros**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build 2>&1" | head -30
```

Saída esperada: `Build succeeded.` (erros podem ser no Controller ainda — verificar).

- [ ] **Step 5: Commit**

```bash
git add src/CasaDiAna.Application/Auth/Dtos/IniciarSetup2FaResultDto.cs \
        src/CasaDiAna.Application/Auth/Commands/IniciarSetup2Fa/ \
        src/CasaDiAna.Application/Auth/Commands/ConfirmarSetup2Fa/
git commit -m "feat(application): IniciarSetup2Fa e ConfirmarSetup2Fa commands"
```

---

## Task 8: API — atualizar controllers

**Files:**
- Modify: `src/CasaDiAna.API/Controllers/AuthController.cs`
- Modify: `src/CasaDiAna.API/Controllers/UsuariosController.cs`

- [ ] **Step 1: Reescrever `AuthController`**

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
        [FromBody] LoginCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
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
        var token = await _mediator.Send(new VerificarOtpCommand(usuarioId, request.Codigo), ct);
        return Ok(ApiResponse<TokenDto>.Ok(token));
    }

    [HttpPost("iniciar-setup-2fa")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<IniciarSetup2FaResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> IniciarSetup2Fa(CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var resultado = await _mediator.Send(new IniciarSetup2FaCommand(usuarioId), ct);
        return Ok(ApiResponse<IniciarSetup2FaResultDto>.Ok(resultado));
    }

    [HttpPost("confirmar-setup-2fa")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
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

public record VerificarOtpRequest(string Codigo);
public record ConfirmarSetup2FaRequest(
    string Secret,
    string Codigo,
    IReadOnlyList<string> CodigosRecuperacao);
```

- [ ] **Step 2: Remover `POST /{id}/2fa/habilitar` do `UsuariosController`**

Abrir `src/CasaDiAna.API/Controllers/UsuariosController.cs`. Remover o endpoint `Habilitar2Fa` (action com rota `{id}/2fa/habilitar` ou `{id}/habilitar-2fa`) e seus usings relacionados (`Habilitar2FaCommand`, `Habilitar2FaRequest`). Manter o endpoint `Desabilitar2Fa`.

- [ ] **Step 3: Buildar para confirmar compilação limpa**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build 2>&1" | head -20
```

Saída esperada: `Build succeeded. 0 Warning(s) 0 Error(s)`

- [ ] **Step 4: Commit**

```bash
git add src/CasaDiAna.API/Controllers/AuthController.cs \
        src/CasaDiAna.API/Controllers/UsuariosController.cs
git commit -m "feat(api): adiciona iniciar/confirmar-setup-2fa, remove reenviar-codigo e habilitar-2fa"
```

---

## Task 9: Testes backend — atualizar LoginCommandHandlerTests e VerificarOtpCommandHandlerTests

**Files:**
- Modify: `tests/CasaDiAna.Application.Tests/Auth/LoginCommandHandlerTests.cs`
- Modify: `tests/CasaDiAna.Application.Tests/Auth/VerificarOtpCommandHandlerTests.cs`
- Modify: `tests/CasaDiAna.Application.Tests/Usuarios/Habilitar2FaCommandHandlerTests.cs`

- [ ] **Step 1: Reescrever `LoginCommandHandlerTests`**

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
        _jwtService.Setup(j => j.GerarToken(usuario)).Returns("token-jwt");

        var resultado = await _handler.Handle(
            new LoginCommand("ana@casa.com", "senha123"), CancellationToken.None);

        resultado.Requer2Fa.Should().BeFalse();
        resultado.Token.Should().Be("token-jwt");
        resultado.Nome.Should().Be("Ana");
        resultado.Papel.Should().Be("Admin");
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
}
```

- [ ] **Step 2: Reescrever `VerificarOtpCommandHandlerTests`**

```csharp
// tests/CasaDiAna.Application.Tests/Auth/VerificarOtpCommandHandlerTests.cs
using CasaDiAna.Application.Auth.Commands.VerificarOtp;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Auth;

public class VerificarOtpCommandHandlerTests
{
    private readonly Mock<IUsuarioRepository> _repositorio = new();
    private readonly Mock<IJwtService> _jwtService = new();
    private readonly Mock<ITotpService> _totp = new();
    private readonly Mock<ICodigoRecuperacaoRepository> _codigos = new();
    private readonly VerificarOtpCommandHandler _handler;

    public VerificarOtpCommandHandlerTests()
    {
        _handler = new VerificarOtpCommandHandler(
            _repositorio.Object, _jwtService.Object,
            _totp.Object, _codigos.Object);
    }

    private static Usuario CriarUsuarioCom2Fa()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com",
            BCrypt.Net.BCrypt.HashPassword("x"), PapelUsuario.Admin);
        usuario.HabilitarTotp("JBSWY3DPEHPK3PXP");
        return usuario;
    }

    [Fact]
    public async Task DeveRetornarToken_QuandoCodigoTotpValido()
    {
        var usuario = CriarUsuarioCom2Fa();
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);
        _totp.Setup(t => t.ValidarCodigo("JBSWY3DPEHPK3PXP", "123456")).Returns(true);
        _jwtService.Setup(j => j.GerarToken(usuario)).Returns("jwt-real");

        var resultado = await _handler.Handle(
            new VerificarOtpCommand(usuario.Id, "123456"), CancellationToken.None);

        resultado.Token.Should().Be("jwt-real");
        resultado.Nome.Should().Be("Ana");
    }

    [Fact]
    public async Task DeveRetornarToken_QuandoRecoveryCodeValido()
    {
        var usuario = CriarUsuarioCom2Fa();
        var codigoPlain = "ABCD-1234";
        var codigoHash = BCrypt.Net.BCrypt.HashPassword(codigoPlain);
        var codigoEntity = CodigoRecuperacao.Criar(usuario.Id, codigoHash);

        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);
        _totp.Setup(t => t.ValidarCodigo(It.IsAny<string>(), codigoPlain)).Returns(false);
        _codigos.Setup(c => c.ObterAtivosPorUsuarioAsync(usuario.Id, default))
                .ReturnsAsync(new List<CodigoRecuperacao> { codigoEntity });
        _jwtService.Setup(j => j.GerarToken(usuario)).Returns("jwt-recovery");

        var resultado = await _handler.Handle(
            new VerificarOtpCommand(usuario.Id, codigoPlain), CancellationToken.None);

        resultado.Token.Should().Be("jwt-recovery");
        _codigos.Verify(c => c.MarcarUsadoAsync(codigoEntity.Id, default), Times.Once);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoCodigoInvalido()
    {
        var usuario = CriarUsuarioCom2Fa();
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);
        _totp.Setup(t => t.ValidarCodigo(It.IsAny<string>(), "000000")).Returns(false);
        _codigos.Setup(c => c.ObterAtivosPorUsuarioAsync(usuario.Id, default))
                .ReturnsAsync(new List<CodigoRecuperacao>());

        var acao = () => _handler.Handle(
            new VerificarOtpCommand(usuario.Id, "000000"), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Código inválido. Verifique o app ou use um código de recuperação.");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUsuarioNaoEncontrado()
    {
        _repositorio.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default))
                    .ReturnsAsync((Usuario?)null);

        var acao = () => _handler.Handle(
            new VerificarOtpCommand(Guid.NewGuid(), "123456"), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Sessão inválida.");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoTotpSecretNulo()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com",
            BCrypt.Net.BCrypt.HashPassword("x"), PapelUsuario.Admin);
        // TwoFactorHabilitado = false → Sessão inválida
        // Forçamos TwoFactorHabilitado = true via reflexão para testar o caminho de TotpSecret nulo
        typeof(Usuario).GetProperty("TwoFactorHabilitado")!.SetValue(usuario, true);
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);

        var acao = () => _handler.Handle(
            new VerificarOtpCommand(usuario.Id, "123456"), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("2FA não configurado.");
    }
}
```

- [ ] **Step 3: Substituir `Habilitar2FaCommandHandlerTests` por `Desabilitar2FaCommandHandlerTests`**

Deletar o arquivo existente e criar o novo:

```bash
rm tests/CasaDiAna.Application.Tests/Usuarios/Habilitar2FaCommandHandlerTests.cs
```

```csharp
// tests/CasaDiAna.Application.Tests/Usuarios/Desabilitar2FaCommandHandlerTests.cs
using CasaDiAna.Application.Usuarios.Commands.Desabilitar2Fa;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Usuarios;

public class Desabilitar2FaCommandHandlerTests
{
    private readonly Mock<IUsuarioRepository> _repositorio = new();
    private readonly Mock<ICodigoRecuperacaoRepository> _codigos = new();
    private readonly Desabilitar2FaCommandHandler _handler;

    public Desabilitar2FaCommandHandlerTests()
    {
        _handler = new Desabilitar2FaCommandHandler(_repositorio.Object, _codigos.Object);
    }

    [Fact]
    public async Task DeveDesabilitar2Fa_QuandoUsuarioExiste()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com", "hash", PapelUsuario.Admin);
        usuario.HabilitarTotp("JBSWY3DPEHPK3PXP");
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);

        await _handler.Handle(new Desabilitar2FaCommand(usuario.Id), CancellationToken.None);

        usuario.TwoFactorHabilitado.Should().BeFalse();
        usuario.TotpSecret.Should().BeNull();
        _codigos.Verify(c => c.DeletarPorUsuarioAsync(usuario.Id, default), Times.Once);
        _repositorio.Verify(r => r.Atualizar(usuario), Times.Once);
        _repositorio.Verify(r => r.SalvarAsync(default), Times.Once);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUsuarioNaoEncontrado()
    {
        _repositorio.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default))
                    .ReturnsAsync((Usuario?)null);

        var acao = () => _handler.Handle(
            new Desabilitar2FaCommand(Guid.NewGuid()), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Usuário não encontrado.");
    }
}
```

- [ ] **Step 4: Rodar testes**

```bash
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test 2>&1"
```

Saída esperada: todos os testes passando. Se algum falhar, corrigir antes de continuar.

- [ ] **Step 5: Commit**

```bash
git add tests/CasaDiAna.Application.Tests/Auth/LoginCommandHandlerTests.cs \
        tests/CasaDiAna.Application.Tests/Auth/VerificarOtpCommandHandlerTests.cs \
        tests/CasaDiAna.Application.Tests/Usuarios/Desabilitar2FaCommandHandlerTests.cs
git rm tests/CasaDiAna.Application.Tests/Usuarios/Habilitar2FaCommandHandlerTests.cs
git commit -m "test(auth): atualiza LoginHandlerTests e VerificarOtpTests para TOTP, substitui Habilitar por Desabilitar2FaTests"
```

---

## Task 10: Testes backend — `IniciarSetup2FaCommandHandlerTests` e `ConfirmarSetup2FaCommandHandlerTests`

**Files:**
- Create: `tests/CasaDiAna.Application.Tests/Auth/IniciarSetup2FaCommandHandlerTests.cs`
- Create: `tests/CasaDiAna.Application.Tests/Auth/ConfirmarSetup2FaCommandHandlerTests.cs`

- [ ] **Step 1: Criar `IniciarSetup2FaCommandHandlerTests`**

```csharp
// tests/CasaDiAna.Application.Tests/Auth/IniciarSetup2FaCommandHandlerTests.cs
using CasaDiAna.Application.Auth.Commands.IniciarSetup2Fa;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Auth;

public class IniciarSetup2FaCommandHandlerTests
{
    private readonly Mock<IUsuarioRepository> _repositorio = new();
    private readonly Mock<ITotpService> _totp = new();
    private readonly IniciarSetup2FaCommandHandler _handler;

    public IniciarSetup2FaCommandHandlerTests()
    {
        _handler = new IniciarSetup2FaCommandHandler(_repositorio.Object, _totp.Object);
    }

    [Fact]
    public async Task DeveRetornarQrCodeUrlECodigosRecuperacao_SemPersistir()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com", "hash", PapelUsuario.Admin);
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);
        _totp.Setup(t => t.GerarSecret()).Returns("JBSWY3DPEHPK3PXP");
        _totp.Setup(t => t.GerarQrCodeUrl("JBSWY3DPEHPK3PXP", "ana@casa.com", "Casa di Ana"))
             .Returns("otpauth://totp/Casa%20di%20Ana:ana%40casa.com?secret=JBSWY3DPEHPK3PXP&issuer=Casa%20di%20Ana&algorithm=SHA1&digits=6&period=30");

        var resultado = await _handler.Handle(
            new IniciarSetup2FaCommand(usuario.Id), CancellationToken.None);

        resultado.QrCodeUrl.Should().StartWith("otpauth://totp/");
        resultado.SecretManual.Should().Be("JBSWY3DPEHPK3PXP");
        resultado.CodigosRecuperacao.Should().HaveCount(8);
        resultado.CodigosRecuperacao.Should().AllSatisfy(c =>
            c.Should().MatchRegex(@"^[0-9A-F]{4}-[0-9A-F]{4}$"));

        // Não deve persistir nada
        _repositorio.Verify(r => r.Atualizar(It.IsAny<Usuario>()), Times.Never);
        _repositorio.Verify(r => r.SalvarAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUsuarioNaoEncontrado()
    {
        _repositorio.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default))
                    .ReturnsAsync((Usuario?)null);

        var acao = () => _handler.Handle(
            new IniciarSetup2FaCommand(Guid.NewGuid()), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Usuário não encontrado.");
    }
}
```

- [ ] **Step 2: Criar `ConfirmarSetup2FaCommandHandlerTests`**

```csharp
// tests/CasaDiAna.Application.Tests/Auth/ConfirmarSetup2FaCommandHandlerTests.cs
using CasaDiAna.Application.Auth.Commands.ConfirmarSetup2Fa;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Auth;

public class ConfirmarSetup2FaCommandHandlerTests
{
    private readonly Mock<IUsuarioRepository> _repositorio = new();
    private readonly Mock<ITotpService> _totp = new();
    private readonly Mock<ICodigoRecuperacaoRepository> _codigos = new();
    private readonly ConfirmarSetup2FaCommandHandler _handler;

    public ConfirmarSetup2FaCommandHandlerTests()
    {
        _handler = new ConfirmarSetup2FaCommandHandler(
            _repositorio.Object, _totp.Object, _codigos.Object);
    }

    [Fact]
    public async Task DevePersistirTotpECodigosRecuperacao_QuandoCodigoValido()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com", "hash", PapelUsuario.Admin);
        var secret = "JBSWY3DPEHPK3PXP";
        var codigosPlain = new List<string>
        {
            "AAAA-1111", "BBBB-2222", "CCCC-3333", "DDDD-4444",
            "EEEE-5555", "FFFF-6666", "1111-AAAA", "2222-BBBB"
        };
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);
        _totp.Setup(t => t.ValidarCodigo(secret, "654321")).Returns(true);

        await _handler.Handle(
            new ConfirmarSetup2FaCommand(usuario.Id, secret, "654321", codigosPlain),
            CancellationToken.None);

        usuario.TwoFactorHabilitado.Should().BeTrue();
        usuario.TotpSecret.Should().Be(secret);
        _repositorio.Verify(r => r.Atualizar(usuario), Times.Once);
        _repositorio.Verify(r => r.SalvarAsync(default), Times.Once);
        _codigos.Verify(c => c.AdicionarAsync(
            It.Is<IEnumerable<CodigoRecuperacao>>(list => list.Count() == 8),
            default), Times.Once);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoCodigoInvalido()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com", "hash", PapelUsuario.Admin);
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);
        _totp.Setup(t => t.ValidarCodigo(It.IsAny<string>(), "000000")).Returns(false);

        var acao = () => _handler.Handle(
            new ConfirmarSetup2FaCommand(usuario.Id, "SECRET", "000000",
                new List<string> { "AAAA-1111" }),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Código inválido. Verifique o app e tente novamente.");

        usuario.TwoFactorHabilitado.Should().BeFalse();
        _repositorio.Verify(r => r.Atualizar(It.IsAny<Usuario>()), Times.Never);
    }
}
```

- [ ] **Step 3: Rodar todos os testes**

```bash
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test 2>&1"
```

Saída esperada: todos passando.

- [ ] **Step 4: Commit**

```bash
git add tests/CasaDiAna.Application.Tests/Auth/IniciarSetup2FaCommandHandlerTests.cs \
        tests/CasaDiAna.Application.Tests/Auth/ConfirmarSetup2FaCommandHandlerTests.cs
git commit -m "test(auth): testes para IniciarSetup2Fa e ConfirmarSetup2Fa"
```

---

## Task 11: Frontend — `authService`, `LoginForm`

**Files:**
- Modify: `frontend/src/features/auth/services/authService.ts`
- Modify: `frontend/src/features/auth/components/form/LoginForm.tsx`

- [ ] **Step 1: Instalar `qrcode` e seus tipos**

```bash
cd frontend
npm install qrcode
npm install --save-dev @types/qrcode
cd ..
```

- [ ] **Step 2: Atualizar `authService.ts`**

```typescript
// frontend/src/features/auth/services/authService.ts
import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'

interface LoginInput {
  email: string
  senha: string
}

export interface LoginResultDto {
  requer2Fa: boolean
  tokenTemporario: string | null
  token: string | null
  nome: string | null
  papel: string | null
}

interface TokenDto {
  token: string
  nome: string
  papel: string
}

export interface IniciarSetup2FaResultDto {
  qrCodeUrl: string
  secretManual: string
  codigosRecuperacao: string[]
}

export const authService = {
  login: async (input: LoginInput): Promise<LoginResultDto> => {
    try {
      const resp = await api.post<ApiResponse<LoginResultDto>>('/auth/login', input)
      if (!resp.data.sucesso) {
        throw new Error(resp.data.erros?.[0] ?? 'Credenciais inválidas.')
      }
      return resp.data.dados
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: ApiResponse<LoginResultDto> } }
      if (err?.response?.status === 401) {
        const erros = err.response?.data?.erros
        throw new Error(erros?.[0] ?? 'E-mail ou senha incorretos.')
      }
      throw e
    }
  },

  verificarOtp: async (codigo: string, tokenTemporario: string): Promise<TokenDto> => {
    try {
      const resp = await api.post<ApiResponse<TokenDto>>(
        '/auth/verificar-2fa',
        { codigo },
        { headers: { Authorization: `Bearer ${tokenTemporario}` } }
      )
      if (!resp.data.sucesso) {
        throw new Error(resp.data.erros?.[0] ?? 'Código inválido.')
      }
      return resp.data.dados
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: ApiResponse<TokenDto> } }
      if (err?.response?.status === 401 || err?.response?.status === 422) {
        const erros = err.response?.data?.erros
        throw new Error(erros?.[0] ?? 'Código inválido ou expirado.')
      }
      throw e
    }
  },

  iniciarSetup2Fa: async (): Promise<IniciarSetup2FaResultDto> => {
    const resp = await api.post<ApiResponse<IniciarSetup2FaResultDto>>('/auth/iniciar-setup-2fa')
    if (!resp.data.sucesso) throw new Error(resp.data.erros?.[0] ?? 'Erro ao iniciar setup.')
    return resp.data.dados
  },

  confirmarSetup2Fa: async (
    secret: string,
    codigo: string,
    codigosRecuperacao: string[]
  ): Promise<void> => {
    const resp = await api.post<ApiResponse<null>>('/auth/confirmar-setup-2fa', {
      secret,
      codigo,
      codigosRecuperacao,
    })
    if (!resp.data.sucesso) throw new Error(resp.data.erros?.[0] ?? 'Código inválido.')
  },
}
```

- [ ] **Step 3: Atualizar `LoginForm.tsx` — remover reenvio, atualizar hints OTP**

Substituir o conteúdo da etapa `otp` e remover variáveis/funções relacionadas ao reenvio:

Remover: `reenvioCountdown`, `setReenvioCountdown`, o `useEffect` do countdown, `handleReenviar`, o bloco JSX do botão/countdown de reenvio, e a referência a `telefoneMascarado`.

Atualizar o subtítulo da etapa OTP e o placeholder do input:

```typescript
// Linha ~27: remover telefoneMascarado state
// Linha ~31: remover reenvioCountdown state
// Linhas ~38-42: remover useEffect do countdown

// Linha ~60 (login handler): remover setTelefoneMascarado e setReenvioCountdown
// Substituir bloco if (dados.requer2Fa) por:
if (dados.requer2Fa) {
  setTokenTemporario(dados.tokenTemporario)
  setEtapa('otp')
}

// Etapa OTP — subtítulo atualizado:
<p className="mt-1.5 text-sm" style={{ color: 'var(--ada-muted)' }}>
  Digite o código do seu app autenticador ou um código de recuperação.
</p>

// Input OTP — atualizar maxLength para 10 (acomoda recovery codes XXXX-XXXX)
// e remover pattern para aceitar alfanumérico+hífen
maxLength={10}
// remover: pattern="\d{6}"
// remover: inputMode="numeric"

// Placeholder:
placeholder="000000 ou XXXX-XXXX"

// handleVerificarOtp — remover validação de 6 dígitos e aceitar qualquer entrada não-vazia:
if (!otp.trim()) {
  setErro('Digite o código.')
  return
}

// Remover: handleReenviar function
// Remover: bloco JSX countdown/reenvio (linhas ~261-279)
```

O arquivo completo do `LoginForm.tsx` após as modificações:

```typescript
// frontend/src/features/auth/components/form/LoginForm.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import { useAuthStore } from '@/store/authStore'
import { AnimatedInput } from './AnimatedInput'
import { AnimatedButton } from './AnimatedButton'

function CoffeeIcon() {
  return (
    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 4c0 0 .4-1.5 1.5-1.5s1.5 1.5 1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 8.5h12v8.5a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 014 17V8.5z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 11h2a1.5 1.5 0 010 3h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

type Etapa = 'credenciais' | 'otp'

export function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  const [etapa, setEtapa] = useState<Etapa>('credenciais')
  const [tokenTemporario, setTokenTemporario] = useState<string | null>(null)
  const [otp, setOtp] = useState('')

  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const otpInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (etapa === 'otp') {
      setTimeout(() => otpInputRef.current?.focus(), 100)
    }
  }, [etapa])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !senha) {
      setErro('Preencha e-mail e senha.')
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const dados = await authService.login({ email, senha })
      if (dados.requer2Fa) {
        setTokenTemporario(dados.tokenTemporario)
        setEtapa('otp')
      } else {
        login(dados.token!, { nome: dados.nome!, papel: dados.papel! })
        navigate('/', { replace: true })
      }
    } catch (e: unknown) {
      setErro((e as Error)?.message ?? 'E-mail ou senha inválidos. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  const handleVerificarOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim()) {
      setErro('Digite o código.')
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const dados = await authService.verificarOtp(otp.trim(), tokenTemporario!)
      login(dados.token, { nome: dados.nome, papel: dados.papel })
      navigate('/', { replace: true })
    } catch (e: unknown) {
      const msg = (e as Error)?.message ?? 'Código inválido.'
      setErro(msg)
      if (msg.toLowerCase().includes('tentativas') || msg.toLowerCase().includes('login novamente')) {
        setEtapa('credenciais')
        setTokenTemporario(null)
        setOtp('')
      }
    } finally {
      setCarregando(false)
    }
  }

  const voltarParaCredenciais = () => {
    setEtapa('credenciais')
    setTokenTemporario(null)
    setOtp('')
    setErro(null)
  }

  return (
    <div className="w-full max-w-[380px]">
      {/* Logo mobile */}
      <div className="lg:hidden flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: '#D4960C' }}
        >
          <CoffeeIcon />
        </div>
        <h1
          className="text-xl font-bold text-[var(--ada-heading)]"
          style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          Casa di Ana
        </h1>
      </div>

      {etapa === 'credenciais' ? (
        <>
          <div className="mb-8">
            <h2
              className="text-2xl font-bold text-[var(--ada-heading)] tracking-tight"
              style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Bem-vindo de volta
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--ada-muted)' }}>
              Acesse com suas credenciais para continuar.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <AnimatedInput
              id="email"
              label="E-mail"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              disabled={carregando}
            />
            <AnimatedInput
              id="senha"
              label="Senha"
              type="password"
              value={senha}
              onChange={setSenha}
              autoComplete="current-password"
              disabled={carregando}
            />

            {erro && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: 'var(--ada-error-bg)',
                  border: '1px solid var(--ada-error-border)',
                  color: '#DC2626',
                }}
                role="alert"
                aria-live="polite"
              >
                {erro}
              </div>
            )}

            <AnimatedButton type="submit" carregando={carregando}>
              {carregando ? 'Verificando…' : 'Entrar no Sistema'}
            </AnimatedButton>
          </form>
        </>
      ) : (
        <>
          <div className="mb-8">
            <h2
              className="text-2xl font-bold text-[var(--ada-heading)] tracking-tight"
              style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Verificação em dois fatores
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--ada-muted)' }}>
              Digite o código do app autenticador ou um código de recuperação.
            </p>
          </div>

          <form onSubmit={handleVerificarOtp} className="space-y-5" noValidate>
            <div className="relative">
              <label
                htmlFor="otp"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--ada-muted)' }}
              >
                Código de verificação
              </label>
              <input
                ref={otpInputRef}
                id="otp"
                type="text"
                maxLength={10}
                value={otp}
                onChange={e => {
                  setOtp(e.target.value.slice(0, 10))
                  if (erro) setErro(null)
                }}
                autoComplete="one-time-code"
                disabled={carregando}
                placeholder="000000 ou XXXX-XXXX"
                className="w-full rounded-xl px-4 py-3 text-center text-xl tracking-widest font-bold
                           text-[var(--ada-heading)] bg-white border border-[var(--ada-border)]
                           outline-none transition-all duration-200
                           focus-visible:border-[#C4870A] focus-visible:ring-2 focus-visible:ring-[#C4870A]/20
                           disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: 'var(--shadow-xs)' }}
              />
            </div>

            {erro && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: 'var(--ada-error-bg)',
                  border: '1px solid var(--ada-error-border)',
                  color: '#DC2626',
                }}
                role="alert"
                aria-live="polite"
              >
                {erro}
              </div>
            )}

            <AnimatedButton type="submit" carregando={carregando}>
              {carregando ? 'Verificando…' : 'Verificar código'}
            </AnimatedButton>

            <div className="text-center">
              <button
                type="button"
                onClick={voltarParaCredenciais}
                className="text-sm transition-opacity hover:opacity-70"
                style={{ color: 'var(--ada-muted)' }}
              >
                ← Voltar ao login
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verificar tipos**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/auth/services/authService.ts \
        frontend/src/features/auth/components/form/LoginForm.tsx \
        frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): authService TOTP, LoginForm sem reenvio — aceita TOTP e recovery code"
```

---

## Task 12: Frontend — página `/minha-conta`

**Files:**
- Create: `frontend/src/features/minha-conta/pages/MinhaContaPage.tsx`
- Modify: `frontend/src/routes/AppRoutes.tsx`
- Modify: `frontend/src/components/layout/TopHeader.tsx`

- [ ] **Step 1: Criar `MinhaContaPage.tsx`**

A página tem duas seções: dados do usuário (read-only) e gestão de 2FA. O fluxo de setup 2FA tem 3 passos inline (QR code → recovery codes → confirmação).

```typescript
// frontend/src/features/minha-conta/pages/MinhaContaPage.tsx
import { useState } from 'react'
import QRCode from 'qrcode'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/features/auth/services/authService'
import type { IniciarSetup2FaResultDto } from '@/features/auth/services/authService'
import { PageHeader } from '@/components/ui/PageHeader'

type Passo = 'idle' | 'qrcode' | 'recovery' | 'confirmar'

export function MinhaContaPage() {
  const { usuario } = useAuthStore()

  const [passo, setPasso] = useState<Passo>('idle')
  const [setupData, setSetupData] = useState<IniciarSetup2FaResultDto | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [codigosConfirmados, setCodigosConfirmados] = useState(false)
  const [codigoConfirmacao, setCodigoConfirmacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const iniciarSetup = async () => {
    setCarregando(true)
    setErro(null)
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
      // Atualiza o store para refletir 2FA ativo sem recarregar página
      // (o backend vai retornar 2FA ativo no próximo login)
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
      <PageHeader titulo="Minha Conta" subtitulo="Gerencie seus dados e segurança" />

      {/* Dados do usuário */}
      <div className="ada-surface-card p-6 mb-6 max-w-xl">
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}>
          Dados da Conta
        </h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ada-muted)' }}>Nome</p>
            <p className="text-sm font-medium" style={{ color: 'var(--ada-heading)' }}>{usuario?.nome ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ada-muted)' }}>Papel</p>
            <p className="text-sm font-medium" style={{ color: 'var(--ada-heading)' }}>{usuario?.papel ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Gestão de 2FA */}
      <div className="ada-surface-card p-6 max-w-xl">
        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}>
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
            <p className="text-sm mb-4" style={{ color: 'var(--ada-muted)' }}>
              Adicione uma camada extra de segurança usando Google Authenticator, Microsoft Authenticator ou qualquer app TOTP.
            </p>
            <button onClick={iniciarSetup} disabled={carregando} className="btn-primary">
              {carregando ? 'Aguarde…' : 'Ativar autenticação em dois fatores'}
            </button>
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
                <img src={qrDataUrl} alt="QR Code para configurar 2FA" className="rounded-lg" style={{ width: 200, height: 200 }} />
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
              <button onClick={cancelarSetup} className="btn-secondary">
                Cancelar
              </button>
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
              <input
                type="checkbox"
                checked={codigosConfirmados}
                onChange={e => setCodigosConfirmados(e.target.checked)}
                className="w-4 h-4 accent-amber-600"
              />
              <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
                Guardei meus códigos de recuperação
              </span>
            </label>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPasso('confirmar')}
                disabled={!codigosConfirmados}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo →
              </button>
              <button onClick={cancelarSetup} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {passo === 'confirmar' && (
          <form onSubmit={confirmarSetup} className="space-y-4 mt-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
              Passo 3 — Confirme com o app
            </p>
            <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>
              Digite o código de 6 dígitos que aparece no seu app autenticador para confirmar a configuração.
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
              <button type="submit" disabled={carregando || codigoConfirmacao.length !== 6} className="btn-primary flex-1 disabled:opacity-50">
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

- [ ] **Step 2: Adicionar rota `/minha-conta` em `AppRoutes.tsx`**

```typescript
// Adicionar import no topo:
import { MinhaContaPage } from '@/features/minha-conta/pages/MinhaContaPage'

// Adicionar rota dentro de <Route element={<MainLayout />}>:
<Route path="/minha-conta" element={<MinhaContaPage />} />
```

- [ ] **Step 3: Adicionar link "Minha Conta" no `TopHeader.tsx`**

No bloco de perfil do usuário (div com `title={...}`), transformar em botão clicável que navega para `/minha-conta`. Envolver o conteúdo existente em um `button` ou adicionar ícone + link após o nome. Forma mais simples: adicionar `cursor-pointer` e `onClick` no div existente:

```typescript
// Adicionar import no topo:
import { UserCircleIcon } from '@heroicons/react/24/outline'

// Substituir o div de perfil (linhas ~356-383) por:
<button
  onClick={() => navigate('/minha-conta')}
  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors duration-150
             outline-none focus-visible:ring-2 focus-visible:ring-[#C4870A]/40"
  title={`${usuario?.nome ?? ''} · ${usuario?.papel ?? ''} — Minha Conta`}
  onMouseEnter={e => {
    const el = e.currentTarget as HTMLElement
    el.style.background = 'var(--topbar-hover)'
  }}
  onMouseLeave={e => {
    const el = e.currentTarget as HTMLElement
    el.style.background = 'transparent'
  }}
>
  {/* Avatar */}
  <div
    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
    style={{ background: 'var(--sb-accent)' }}
    aria-hidden="true"
  >
    {inicial}
  </div>

  {/* Nome e papel — oculto em telas muito pequenas */}
  <div className="hidden sm:block min-w-0">
    <p
      className="text-[13px] font-medium leading-none truncate max-w-[140px]"
      style={{ color: 'var(--topbar-heading)' }}
    >
      {usuario?.nome ?? '—'}
    </p>
    <p
      className="text-[10.5px] mt-[3px] leading-none truncate"
      style={{ color: 'var(--topbar-text)' }}
    >
      {usuario?.papel ?? ''}
    </p>
  </div>
</button>
```

- [ ] **Step 4: Verificar tipos**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/minha-conta/pages/MinhaContaPage.tsx \
        frontend/src/routes/AppRoutes.tsx \
        frontend/src/components/layout/TopHeader.tsx
git commit -m "feat(frontend): página Minha Conta com setup TOTP, link no TopHeader"
```

---

## Task 13: Limpeza final — `UsuariosPage`, render.yaml

**Files:**
- Modify: `frontend/src/features/usuarios/pages/UsuariosPage.tsx`

- [ ] **Step 1: Remover modal/botão de habilitar 2FA por telefone em `UsuariosPage.tsx`**

Abrir o arquivo e:
1. Remover o botão "Habilitar 2FA" (que pedia telefone)
2. Remover o modal com campo de telefone para habilitar 2FA
3. Remover `usuariosService.habilitar2Fa()` se existir
4. Manter a coluna "2FA" com badge ativo/inativo
5. Manter o botão "Desabilitar 2FA" (Admin usa em emergência)

- [ ] **Step 2: Verificar render.yaml**

```bash
grep -n "Twilio\|twilio\|sms" render.yaml 2>/dev/null || echo "Nenhuma referência Twilio no render.yaml"
```

Se encontrar variáveis `Twilio__AccountSid`, `Twilio__AuthToken`, `Twilio__NumeroDe`, remover ou comentar essas linhas.

- [ ] **Step 3: Build final do backend**

```bash
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build 2>&1" | tail -10
```

Saída esperada: `Build succeeded. 0 Warning(s) 0 Error(s)`

- [ ] **Step 4: Todos os testes passando**

```bash
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test 2>&1" | tail -15
```

- [ ] **Step 5: Build do frontend sem erros de tipo**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit final**

```bash
git add frontend/src/features/usuarios/pages/UsuariosPage.tsx
git add render.yaml 2>/dev/null || true
git commit -m "chore: remove modal habilitar-2fa por telefone de UsuariosPage, limpa vars Twilio do render.yaml"
```

---

## Resumo de Comandos de Verificação

Após todas as tasks:

```bash
# Backend
powershell.exe -Command "Set-Location 'src/CasaDiAna.API'; dotnet build 2>&1" | tail -5
powershell.exe -Command "Set-Location 'tests/CasaDiAna.Application.Tests'; dotnet test 2>&1" | tail -10

# Frontend
cd frontend && npx tsc --noEmit && npm run build 2>&1 | tail -10
```

Critérios de conclusão:
- `Build succeeded. 0 Warning(s) 0 Error(s)` no backend
- Todos os testes passando
- `npx tsc --noEmit` sem erros
- Login com 2FA funciona usando código do app autenticador
- Login com recovery code funciona
- `/minha-conta` exibe formulário de setup 3 passos
- Admin consegue desabilitar 2FA de usuário em `/usuarios`
