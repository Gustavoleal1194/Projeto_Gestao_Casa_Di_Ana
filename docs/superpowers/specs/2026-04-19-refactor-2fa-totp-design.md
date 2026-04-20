# Refatoração 2FA: SMS (Twilio) → TOTP (Google/Microsoft Authenticator)

## Goal

Substituir o 2FA baseado em SMS (Twilio) por TOTP (RFC 6238), eliminando dependência e custo externo. O usuário usa qualquer app autenticador (Google Authenticator, Microsoft Authenticator, Authy). O Admin gerencia o status de 2FA dos usuários pelo painel; o setup é feito pelo próprio usuário via nova página `/minha-conta`.

## Architecture

**Abordagem:** TOTP puro com `Otp.NET` (NuGet, gratuito). Todo o processamento é local — nenhuma API externa. Backend gera/valida secrets TOTP. Frontend renderiza QR code com `qrcode` (npm). Recovery codes armazenados como BCrypt hash.

**Tech Stack:** `Otp.NET` (backend), `qrcode` npm (frontend QR render), BCrypt (já em uso) para hashing dos recovery codes.

---

## Design

### 1. Domínio

**`Usuario` — mudanças em campos:**

Remove:
- `Telefone`
- `CodigoOtpHash`
- `CodigoOtpExpiraEm`
- `CodigoOtpTentativas`

Adiciona:
- `TotpSecret` (string?, nullable)

Remove métodos:
- `GerarOtp()` — geração de código SMS
- `ValidarOtp(codigo)` — validação de hash SMS
- `MascararTelefone(tel)` — não mais necessário

Mantém:
- `TwoFactorHabilitado`
- `LimparOtp()` → renomear para `LimparTotp()` — zera `TotpSecret`

Novos métodos:
- `HabilitarTotp(secret)` — seta `TotpSecret`, `TwoFactorHabilitado = true`
- `DesabilitarTotp()` — zera `TotpSecret`, `TwoFactorHabilitado = false`

**Nova entidade `CodigoRecuperacao`:**
```
Id              Guid
UsuarioId       Guid  (FK → Usuario)
CodigoHash      string
UsadoEm         DateTime?
CriadoEm        DateTime
```

Métodos estáticos:
- `Criar(usuarioId, codigoHash)` — factory

**Interface `ICodigoRecuperacaoRepository`:**
- `AdicionarAsync(codigos, ct)`
- `ListarAtivosAsync(usuarioId, ct)` — `UsadoEm == null`
- `ObterPorUsuarioEHashAsync(usuarioId, ct)` — retorna todos ativos para validação
- `MarcarUsadoAsync(id, ct)`
- `DeletarPorUsuarioAsync(usuarioId, ct)` — ao reativar 2FA

---

### 2. Infraestrutura

**Remove:** `ISmsService`, `TwilioSmsService`, dependências NuGet do Twilio.

**Nova interface `ITotpService`:**
```csharp
string GerarSecret();
string GerarQrCodeUrl(string secret, string email, string emissor = "Casa di Ana");
bool ValidarCodigo(string secret, string codigo);  // janela ±1 (30s antes/depois)
```

**`TotpService` com `Otp.NET`:**
- `GerarSecret()` → `Base32Encoding.ToString(KeyGeneration.GenerateRandomKey(20))`
- `GerarQrCodeUrl()` → formato `otpauth://totp/...` que qualquer app TOTP entende
- `ValidarCodigo()` → `Totp.VerifyTotp()` com janela de ±1 período (tolerância de clock)

**Nova `UsuarioConfiguration` (EF):** remove colunas SMS, adiciona `totp_secret`.

**Nova `CodigoRecuperacaoConfiguration`:** tabela `auth.codigos_recuperacao`.

**`CodigoRecuperacaoRepository`:** implementação das 4 operações acima.

**`DependencyInjection.cs`:** remove `TwilioSmsService`, registra `TotpService` e `CodigoRecuperacaoRepository`.

---

### 3. Application

**Remove completamente:**
- `ReenviarCodigoCommand` + handler + validator
- `Habilitar2FaCommand` + handler + validator (substituído pelos dois abaixo)

**Novos commands:**

`IniciarSetup2FaCommand(UsuarioId)` → `IniciarSetup2FaResultDto`
- Gera secret via `ITotpService.GerarSecret()`
- Gera 8 recovery codes no formato `XXXX-XXXX` (hex aleatório)
- **Não persiste nada ainda** — retorna secret, QR code URL e recovery codes em plain text
- O secret e os códigos ficam apenas na resposta; o usuário confirma com um código válido antes de salvar

```csharp
record IniciarSetup2FaResultDto(
    string QrCodeUrl,
    string SecretManual,   // para quem não consegue escanear
    IReadOnlyList<string> CodigosRecuperacao);
```

`ConfirmarSetup2FaCommand(UsuarioId, Secret, Codigo, CodigosRecuperacao[])` → `Unit`
- Valida o código TOTP contra o secret recebido
- Se válido: persiste `TotpSecret` no usuário, salva BCrypt hash de cada recovery code
- Se inválido: `DomainException("Código inválido. Verifique o app e tente novamente.")`

**Atualiza `VerificarOtpCommandHandler`:**
- Busca usuário pelo token temporário
- Tenta validar como TOTP: `ITotpService.ValidarCodigo(usuario.TotpSecret, codigo)`
- Se falhar, tenta como recovery code: busca `CodigosRecuperacao` ativos, testa BCrypt de cada um
- Se recovery code válido: marca como usado (`UsadoEm = now`)
- Ambos caminhos retornam JWT completo no sucesso
- `DomainException` se nenhum funcionar

**Atualiza `LoginCommandHandler`:**
- Remove toda lógica de SMS (GerarOtp, EnviarAsync)
- Se `TwoFactorHabilitado`: apenas retorna `Requer2Fa: true` + `TokenTemporario` (sem side effects)

**Atualiza `Habilitar2FaCommand` → na verdade, remover. Setup passa por `IniciarSetup2Fa` + `ConfirmarSetup2Fa`.**

**`DesabilitarTotpCommand(UsuarioId)`** (substitui `Desabilitar2FaCommand`):
- Chama `usuario.DesabilitarTotp()`
- Deleta todos os `CodigosRecuperacao` do usuário
- Salva

**`UsuarioDto`:** remove `TelefoneMascarado`, mantém `TwoFactorHabilitado`.

---

### 4. API

**`AuthController`:**
- Remove `POST /api/auth/reenviar-codigo`
- Adiciona `POST /api/auth/iniciar-setup-2fa` (requer auth)
- Adiciona `POST /api/auth/confirmar-setup-2fa` (requer auth)

**`UsuariosController`:**
- Remove `POST /api/usuarios/{id}/habilitar-2fa`
- Mantém `POST /api/usuarios/{id}/desabilitar-2fa` (Admin desativa em emergência)

---

### 5. Banco de dados (Migration)

Uma migration EF:
1. Altera `auth.usuarios`: remove colunas SMS, adiciona `totp_secret`
2. Cria `auth.codigos_recuperacao`
3. SQL inline: `UPDATE auth.usuarios SET two_factor_habilitado = false, totp_secret = NULL WHERE two_factor_habilitado = true`

---

### 6. Frontend

**Remove:**
- Botão "Reenviar código" no `LoginForm`
- Modal de telefone/2FA em `UsuariosPage` (habilitar via telefone)
- `usuariosService.habilitar2Fa()`

**Mantém em `UsuariosPage`:**
- Coluna "2FA" (badge ativo/inativo)
- Botão "Desabilitar 2FA" (Admin usa em emergência)

**Nova página `/minha-conta`:**
- Rota protegida, acessível pelo avatar/nome do usuário no `TopHeader`
- Seções: dados do usuário (nome, email, papel — read-only) + gestão de 2FA

**Fluxo de setup 2FA em `/minha-conta`:**

```
Estado: 2FA desativado
  → botão "Ativar autenticação em dois fatores"
  → POST /api/auth/iniciar-setup-2fa
  → Passo 1: exibe QR code (renderizado com lib `qrcode`) + secret manual
  → Passo 2: exibe 8 recovery codes com aviso "Guarde em lugar seguro — não serão exibidos novamente"
             + checkbox "Guardei meus códigos de recuperação"
  → Passo 3: campo para digitar o primeiro código do app
  → POST /api/auth/confirmar-setup-2fa
  → Sucesso: badge "2FA Ativo" aparece, fluxo fecha

Estado: 2FA ativado
  → botão "Desativar 2FA" (requer confirmação)
  → POST /api/usuarios/{id}/desabilitar-2fa (usa o próprio ID do usuário logado)
```

**`LoginForm`:**
- Remove botão "Reenviar código"
- Mantém campo OTP no step 2
- Atualiza placeholder/hint: "Código do app autenticador ou código de recuperação"

**Novo serviço `authService` — adiciona:**
- `iniciarSetup2Fa()` → POST `/api/auth/iniciar-setup-2fa`
- `confirmarSetup2Fa(secret, codigo, codigosRecuperacao)` → POST `/api/auth/confirmar-setup-2fa`

**`TopHeader`:** adiciona link "Minha Conta" no dropdown do usuário (ou clique direto no nome).

---

### 7. Testes (backend)

Novos testes unitários:
- `IniciarSetup2FaCommandHandlerTests` — verifica que retorna QR URL + 8 recovery codes sem persistir
- `ConfirmarSetup2FaCommandHandlerTests` — código válido persiste, código inválido lança DomainException
- `VerificarOtpCommandHandlerTests` — atualizar: validação TOTP e via recovery code
- `LoginCommandHandlerTests` — atualizar: remove asserts de SMS

---

### 8. Limpeza

Remove:
- `ISmsService.cs`
- `TwilioSmsService.cs`
- Dependências NuGet Twilio (`Twilio`, `Twilio.AspNet.Core` se presentes)
- Variáveis de ambiente `Twilio__*` do `render.yaml` (substituir por comentário)
- `ReenviarCodigoCommand`, `ReenviarCodigoCommandHandler`, `ReenviarCodigoCommandValidator`

---

## Error Handling

| Situação | Resposta |
|---|---|
| Código TOTP inválido no login | `DomainException` → HTTP 422 |
| Recovery code inválido/já usado | `DomainException` → HTTP 422 |
| Setup confirmado com código errado | `DomainException` → HTTP 422 |
| `TotpSecret` nulo ao tentar verificar | `DomainException("2FA não configurado.")` |
| Usuário sem 2FA tenta verificar OTP | `UnauthorizedAccessException` |
