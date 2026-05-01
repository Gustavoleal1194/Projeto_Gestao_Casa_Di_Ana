---
name: REGRA_2FA_TOTP_FORMATO
description: Validator do código 2FA aceita apenas 6 dígitos; recovery codes seguem caminho separado
type: regra
status: existente
ultima_atualizacao: 2026-04-30
---

# Regra: validator do TOTP aceita apenas `^\d{6}$`

**Regra:** o validator do `VerificarCodigo2FaCommand` aceita **somente** códigos no formato `^\d{6}$`. Recovery codes (`XXXX-XXXX`) **nunca chegam** ao handler TOTP — devem ser tratados em endpoint/handler separado.

**Why:**
- Reduz superfície de ataque do TOTP.
- BCrypt de recovery code custa ~200ms; misturá-lo no caminho TOTP cria latência visível em cada erro.

**How to apply:**
- Manter regex no validator.
- Recovery code: handler dedicado (com BCrypt) e endpoint distinto.

**Onde aplica:**
- [[MOD_AUTH_LOGIN_2FA]], [[MOD_MINHA_CONTA]].

**Evidências:**
- `Application/Auth/Commands/Verificar2Fa*.cs` (validator).
- Plans `2026-04-19-refactor-2fa-totp.md`, `2026-04-24-2fa-animated-panel.md`.
