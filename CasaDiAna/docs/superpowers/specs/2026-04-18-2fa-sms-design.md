# Spec: Autenticação em Dois Fatores via SMS

**Data:** 2026-04-18  
**Status:** Aprovado

---

## Visão Geral

Adicionar 2FA opcional via SMS ao fluxo de login da Casa di Ana. Quando habilitado para um usuário, as credenciais (e-mail + senha) são validadas normalmente, mas o JWT definitivo só é emitido após confirmação de um OTP de 6 dígitos enviado por SMS.

O fluxo preserva a UX existente: a tela de login não muda para usuários sem 2FA.

---

## Arquitetura

### Camadas afetadas

| Camada | O que muda |
|---|---|
| `Domain` | `Usuario` ganha campos de 2FA; novo método `GerarOtp()` e `ValidarOtp()` |
| `Application` | Novos commands: `VerificarOtp`, `ReenviarCodigo`, `Habilitaro2FA`, `Desabilitar2FA`; `LoginCommandHandler` alterado para retornar `LoginResultDto` em vez de `TokenDto` |
| `Infrastructure` | `JwtService` ganha `GerarTokenTemporario()` e `ValidarTokenTemporario()`; novo `TwilioSmsService : ISmsService`; migration |
| `API` | `AuthController` ganha 2 endpoints; `UsuariosController` ganha 2 endpoints |
| `Frontend` | `LoginForm` ganha etapa 2 (campo OTP + reenvio); `authService` atualizado; nova seção na tela de usuários |

---

## Domínio

### Novos campos em `Usuario`

```csharp
public string? Telefone { get; private set; }          // formato E.164: +5511999998888
public bool TwoFactorHabilitado { get; private set; }
public string? CodigoOtpHash { get; private set; }
public DateTime? CodigoOtpExpiraEm { get; private set; }
public int CodigoOtpTentativas { get; private set; }   // contador de falhas (máx 3)
```

### Novos métodos em `Usuario`

- `HabilitarDoisFatores(string telefone)` — seta `TwoFactorHabilitado = true` e salva telefone
- `DesabilitarDoisFatores()` — limpa todos os campos 2FA
- `GerarOtp() → string` — gera 6 dígitos, armazena hash BCrypt, expira em 5 min, zera tentativas; retorna o código limpo (para envio por SMS)
- `ValidarOtp(string codigo) → bool` — verifica hash, verifica expiração, incrementa tentativas; retorna true somente se válido
- `LimparOtp()` — limpa após uso bem-sucedido

### Regras de negócio

- OTP válido por **5 minutos**
- Máximo **3 tentativas** por token temporário; após esgotar, o OTP é invalidado e o usuário precisa fazer login novamente
- Reenvio disponível após **60 segundos** do último envio (controlado no frontend; backend tem rate limiting via policy)
- Telefone armazenado no formato E.164 (`+55XXXXXXXXXXX`)
- Exibição mascarada: `(**) *****-XXXX`

---

## Application

### `LoginCommand` → retorna `LoginResultDto`

```csharp
public record LoginResultDto(
    bool Requer2Fa,
    string? TokenTemporario,  // preenchido quando Requer2Fa = true
    string? Token,            // JWT definitivo (preenchido quando Requer2Fa = false)
    string? Nome,
    string? Papel,
    string? TelefoneMascarado // exibir no frontend durante etapa 2FA
);
```

O `LoginCommandHandler` passa a:
1. Validar credenciais (sem mudança)
2. Se `usuario.TwoFactorHabilitado`:
   - Gerar OTP via `usuario.GerarOtp()`
   - Enviar SMS via `ISmsService`
   - Gerar token temporário via `IJwtService.GerarTokenTemporario(usuario.Id)`
   - Retornar `LoginResultDto { Requer2Fa = true, TokenTemporario = ..., TelefoneMascarado = ... }`
3. Caso contrário: retornar `LoginResultDto { Token = ..., Nome = ..., Papel = ... }` (comportamento atual)

### `VerificarOtpCommand`

```csharp
public record VerificarOtpCommand(string Codigo) : IRequest<TokenDto>;
```

Handler:
- Extrai `usuarioId` do token temporário via `IJwtService.ValidarTokenTemporario()`
- Carrega usuário
- Chama `usuario.ValidarOtp(codigo)`
- Se válido: limpa OTP, salva, gera e retorna JWT definitivo
- Se inválido: lança `UnauthorizedAccessException("Código inválido ou expirado.")`
- Se tentativas esgotadas: lança `UnauthorizedAccessException("Número de tentativas excedido. Faça login novamente.")`

### `ReenviarCodigoCommand`

```csharp
public record ReenviarCodigoCommand : IRequest<Unit>;
```

Handler: extrai usuário do token temporário, regenera OTP, reenvia SMS. Não emite novo token temporário (o original ainda é válido por seu tempo restante).

### `Habilitar2FaCommand`

```csharp
public record Habilitar2FaCommand(Guid UsuarioId, string Telefone) : IRequest<Unit>;
```

Validator: telefone no formato E.164, validado por regex `^\+55\d{10,11}$`.

### `Desabilitar2FaCommand`

```csharp
public record Desabilitar2FaCommand(Guid UsuarioId) : IRequest<Unit>;
```

---

## Infrastructure

### `IJwtService` — novos métodos

```csharp
string GerarTokenTemporario(Guid usuarioId);   // expira em 5 min, claim tipo=pre2fa
Guid? ValidarTokenTemporario(string token);    // retorna usuarioId ou null se inválido
```

### `ISmsService`

```csharp
public interface ISmsService
{
    Task EnviarAsync(string telefone, string codigo, CancellationToken ct = default);
}
```

### `TwilioSmsService : ISmsService`

Usa `Twilio.Rest.Api.V2010.Account.MessageResource.CreateAsync()`. Configuração via `appsettings.json`:

```json
"Twilio": {
  "AccountSid": "",
  "AuthToken": "",
  "NumeroDe": "+15XXXXXXXXX"
}
```

A mensagem enviada: `"Seu código de verificação Casa di Ana: {codigo}. Válido por 5 minutos."`

### Migration

Nova migration `Add2FaFields` adiciona colunas em `auth.usuarios`:
- `telefone` varchar(20) nullable
- `two_factor_habilitado` boolean not null default false
- `codigo_otp_hash` text nullable
- `codigo_otp_expira_em` timestamptz nullable
- `codigo_otp_tentativas` int not null default 0

---

## API

### `AuthController` — novos endpoints

```
POST /api/auth/verificar-2fa
  Body: { "codigo": "123456" }
  Auth: Bearer <tokenTemporario>
  Returns: ApiResponse<TokenDto>

POST /api/auth/reenviar-codigo
  Body: (vazio)
  Auth: Bearer <tokenTemporario>
  Returns: ApiResponse<object>
  Rate limit: policy "reenvio2fa" (1 req/min por IP)
```

Ambos os endpoints usam policy de autorização `Pre2Fa` (valida claim `tipo=pre2fa`).

### `UsuariosController` — novos endpoints (Admin only)

```
POST /api/usuarios/{id}/2fa/habilitar
  Body: { "telefone": "+5511999998888" }
  Returns: ApiResponse<object>

DELETE /api/usuarios/{id}/2fa
  Returns: ApiResponse<object>
```

---

## Frontend

### Fluxo em `LoginForm`

O componente passa a ter dois estados internos: `etapa: 'credenciais' | 'otp'`.

**Etapa 1 (atual):** e-mail + senha. Se resposta contém `requer2fa: true`:
- Armazena `tokenTemporario` em estado local (não no `authStore`)
- Transiciona para etapa 2, exibindo o `telefoneMascarado`

**Etapa 2 (nova):** campo de 6 dígitos + botão "Verificar". Exibe `"Código enviado para (**) *****-XXXX"`. Botão "Reenviar código" aparece com countdown de 60s.

**Erro de OTP:** exibe mensagem inline igual ao erro de credenciais.

**Após 3 tentativas falhas (HTTP 401 com mensagem específica):** retorna automaticamente para etapa 1 com aviso.

### `authService` — novos métodos

```typescript
verificarOtp(codigo: string, tokenTemporario: string): Promise<TokenDto>
reenviarCodigo(tokenTemporario: string): Promise<void>
```

### Tela de Usuários (`features/usuarios`)

Na listagem/detalhes de cada usuário (papel Admin), adicionar seção "Autenticação em dois fatores" com:
- Badge "Ativo" / "Inativo"
- Botão "Habilitar 2FA" (abre modal com campo de telefone)
- Botão "Desabilitar 2FA" (confirmação simples)

---

## Segurança

| Vetor | Mitigação |
|---|---|
| Brute force no OTP | Máx 3 tentativas; token temporário com expiração de 5 min |
| Replay do token temporário | Claim `tipo=pre2fa` + policy separada; não aceito em endpoints normais |
| Interceptação do OTP | SMS é canal inseguro por design (trade-off padrão de mercado); OTP expira em 5 min |
| Enumeração de usuários via 2FA | Resposta de login sempre demora o mesmo tempo (não vaza se 2FA está ativo) |
| Força bruta no reenvio | Rate limiting `reenvio2fa`: 1 req/min por IP |
| Telefone exposto | Armazenado em texto simples no banco (não é senha); exibido mascarado na UI |
| OTP no log | `TwilioSmsService` nunca loga o código; só loga sucesso/falha de envio |

---

## Fora do escopo

- Recovery codes (backup caso o telefone seja perdido) — implementar em iteração futura
- 2FA via TOTP (Google Authenticator) — escopo diferente
- Auto-enroll no primeiro login — admin habilita manualmente
