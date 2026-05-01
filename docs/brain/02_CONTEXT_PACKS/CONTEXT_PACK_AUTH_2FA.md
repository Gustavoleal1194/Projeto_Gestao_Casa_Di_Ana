---
name: CONTEXT_PACK_AUTH_2FA
description: Pack para tasks de autenticação, 2FA TOTP, perfil
type: context_pack
status: existente
ultima_atualizacao: 2026-04-30
---

# 🧰 Context pack — Auth & 2FA

## Quando usar
Tasks que tocam login, JWT, 2FA, perfil de usuário (ativar/desativar 2FA, recovery codes, lastLogin).

## Status resumido
- JWT HS256, claim `sub` (GUID), `email`, `papel`, `exp`, `tipo`.
- 2FA via TOTP puro (sem SMS).
- Token intermediário `tipo=pre2fa` autorizado pela policy `Pre2Fa`.
- Rate limit: `login` 10/min, `reenvio2fa` 1/min.
- Frontend: `LoginPage` + painel animado 2FA + `Minha Conta`.

## Responsabilidades dos módulos
- [[MOD_AUTH_LOGIN_2FA]]
- [[MOD_USUARIOS]]
- [[MOD_MINHA_CONTA]]

## Regras críticas
- [[REGRA_2FA_TOTP_FORMATO]] — validator aceita só `^\d{6}$`.
- [[REGRA_BCRYPT_RECOVERY_FORA_HANDLER_TOTP]] — recovery code em endpoint separado.
- ASP.NET remapeia `sub` → `ClaimTypes.NameIdentifier`. **Nunca** `JwtRegisteredClaimNames.Sub`.

## Arquivos / docs de referência
- `API/Program.cs:42-94` (JWT + policies + rate limit)
- `Application/Auth/`
- `Infrastructure/Services/{TotpService,JwtService,CurrentUserService}.cs`
- Frontend: `features/auth/`, `features/minha-conta/`
- Plans: `docs/superpowers/plans/2026-04-19-refactor-2fa-totp.md`, `2026-04-24-2fa-animated-panel.md`, `2026-04-24-perfil-usuario-2fa-lastlogin.md`

## Cuidados
- Nunca logar secret TOTP.
- Recovery code: BCrypt (~200ms) só no caminho dedicado.
- Logout no front limpa Zustand + localStorage + redireciona.

## Prompt curto
> "Task em auth/2FA do Casa di Ana ERP. JWT HS256, TOTP puro (sem SMS), validator aceita só 6 dígitos, recovery code em endpoint separado. Use `ClaimTypes.NameIdentifier` para ler `sub`."
