---
name: MOD_MINHA_CONTA
description: Página de perfil do usuário logado — 2FA, lastLogin, troca de senha
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 🪪 Módulo: Minha Conta

## Status detectado
**existente** — frontend (`features/minha-conta/`), com fluxos de 2FA + lastLogin.

## Objetivo
Permitir ao usuário logado gerir o próprio perfil sem depender do Admin: ativar/desativar 2FA, trocar senha, ver último login.

## Fluxo geral
- Visualizar dados (e-mail, nome, papel, lastLogin).
- Ativar 2FA: gera secret + QR (`qrcode` lib) → confirmação com 6 dígitos.
- Desativar 2FA: precisa confirmar com código atual.
- Recovery codes: gerados ao ativar; armazenados com BCrypt (não validar no caminho TOTP).
- Trocar senha.

## Evidências
- Frontend: `CasaDiAna/frontend/src/features/minha-conta/`
- Plans: `docs/superpowers/plans/2026-04-24-perfil-usuario-2fa-lastlogin.md`
- Backend: endpoints sob `Auth/` ou `Usuarios/` (a_confirmar exatamente quais)

## Regras relacionadas
- [[REGRA_2FA_TOTP_FORMATO]]
- [[REGRA_BCRYPT_RECOVERY_FORA_HANDLER_TOTP]]

## Módulos relacionados
- [[MOD_AUTH_LOGIN_2FA]]
- [[MOD_USUARIOS]]

## Pontos de atenção
- Hash de recovery codes via BCrypt — **lento**. Avaliar fora do hot path.
- Nunca exibir secret TOTP em log.

## O que NÃO fazer
- Não permitir desativar 2FA sem confirmar código.
- Não persistir secret em plain text fora do banco.
