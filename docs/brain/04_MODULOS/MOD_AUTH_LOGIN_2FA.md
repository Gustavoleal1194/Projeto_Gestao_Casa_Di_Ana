---
name: MOD_AUTH_LOGIN_2FA
description: Login JWT + 2FA TOTP em duas etapas (sem SMS)
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 🔐 Módulo: Auth – Login + 2FA TOTP

## Status detectado
**existente** — implementado, refatorado para TOTP puro, com painel animado.

## Objetivo
Autenticar usuários e proteger a conta com segundo fator opcional via app autenticador (Google Authenticator, Authy, etc.). Sem SMS por decisão de design.

## Fluxo geral

```
POST /api/auth/login            → token "pre2fa" se 2FA ativo, senão JWT final
POST /api/auth/verificar-2fa    → JWT final (claim tipo=user, papel)
POST /api/auth/reenviar-2fa     → rate limit 1/min (tela de fallback)
```

- Token intermediário usa policy `Pre2Fa` (claim `tipo=pre2fa`).
- Validator do código aceita **apenas** `^\d{6}$` — recovery codes (`XXXX-XXXX`) **não chegam** ao handler TOTP.
- BCrypt de recovery code custa ~200ms; **não** verificar dentro do handler do TOTP.

## Evidências
- `CasaDiAna/src/CasaDiAna.API/Program.cs:61-94` (policy Pre2Fa, rate limit `login` e `reenvio2fa`)
- `CasaDiAna/src/CasaDiAna.API/Controllers/AuthController.cs`
- `CasaDiAna/src/CasaDiAna.Application/Auth/`
- `CasaDiAna/src/CasaDiAna.Infrastructure/Services/TotpService.cs`
- Frontend: `CasaDiAna/frontend/src/features/auth/`
- Plans: `docs/superpowers/plans/2026-04-19-refactor-2fa-totp.md`, `2026-04-24-2fa-animated-panel.md`
- Migrations: `Add2FaFields`, `RefatorarTotpAuth`

## Regras relacionadas
- [[REGRA_2FA_TOTP_FORMATO]]
- [[REGRA_BCRYPT_RECOVERY_FORA_HANDLER_TOTP]]
- [[REGRAS_BACKEND_CRITICAS]]

## Módulos relacionados
- [[MOD_USUARIOS]] (campos 2FA, lastLogin)
- [[MOD_MINHA_CONTA]] (ativar/desativar 2FA, ver QR, recovery codes)

## Pontos de atenção
- ASP.NET remapeia `sub` para `ClaimTypes.NameIdentifier`. Nunca usar `JwtRegisteredClaimNames.Sub` ao ler claim no `CurrentUserService`.
- Token JWT exposto via Bearer; logout no frontend limpa Zustand + localStorage.
- 401 no Axios → logout automático.

## O que NÃO fazer
- Não introduzir SMS.
- Não validar recovery code dentro do handler TOTP (custo BCrypt visível).
- Não aceitar formatos de código diferentes de 6 dígitos no validator TOTP.
- Não relaxar o rate limit de `login`/`reenvio2fa` sem registrar decisão.
