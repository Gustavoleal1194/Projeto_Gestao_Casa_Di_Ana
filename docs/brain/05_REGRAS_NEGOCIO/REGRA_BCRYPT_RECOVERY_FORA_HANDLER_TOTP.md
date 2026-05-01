---
name: REGRA_BCRYPT_RECOVERY_FORA_HANDLER_TOTP
description: Não verificar BCrypt de recovery codes dentro do handler TOTP (custo ~200ms)
type: regra
status: existente
ultima_atualizacao: 2026-04-30
---

# Regra: BCrypt de recovery code fora do caminho TOTP

**Regra:** o handler do TOTP **não** deve fazer verificação BCrypt para recovery codes. Recovery codes devem ser tratados num endpoint/handler dedicado.

**Why:** BCrypt.Net-Next custa ~200ms por verificação. Se o handler TOTP cair em verificação BCrypt em cada falha, o caminho de erro fica perceptivelmente lento e enumeráveis (timing).

**How to apply:**
- TOTP: comparação de código gerado pelo secret (custo µs).
- Recovery: endpoint próprio com rate limit e BCrypt.

**Onde aplica:**
- [[MOD_AUTH_LOGIN_2FA]], [[MOD_MINHA_CONTA]].
