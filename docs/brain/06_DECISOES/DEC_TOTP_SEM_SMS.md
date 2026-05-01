---
name: DEC_TOTP_SEM_SMS
description: 2FA usa apenas app autenticador (TOTP); sem SMS
type: decisao
status: existente
ultima_atualizacao: 2026-04-30
data_decisao: 2026-04-19
---

# Decisão: 2FA via TOTP, sem SMS

**Decisão:** o segundo fator é exclusivamente TOTP (app autenticador). SMS está fora do escopo.

**Why:**
- Custo zero por usuário (sem gateway SMS).
- Mais seguro contra SIM-swap.
- Cafeteria sem necessidade de fallback corporativo complexo.

**Como funciona:**
- Endpoints: `POST /auth/login` → `POST /auth/verificar-2fa`.
- Validator aceita `^\d{6}$`. Recovery codes (`XXXX-XXXX`) por endpoint separado.
- Painel animado no front (plan `2026-04-24-2fa-animated-panel.md`).

**Onde aplica:** [[MOD_AUTH_LOGIN_2FA]], [[MOD_MINHA_CONTA]].

**Evidências:** migrations `Add2FaFields`, `RefatorarTotpAuth`. Plan `docs/superpowers/plans/2026-04-19-refactor-2fa-totp.md`.
