---
name: MOD_USUARIOS
description: Cadastro, desativação e redefinição de senha de usuários (Admin only)
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 👤 Módulo: Usuários

## Status detectado
**existente** — CRUD completo, com soft delete e papéis.

## Objetivo
Gerir contas internas da cafeteria. Apenas `Admin` cria, desativa ou redefine senhas.

## Fluxo geral
- Criar usuário (Admin): nome, e-mail, senha temporária, papel.
- Desativar (soft delete) → `ativo = false`.
- Redefinir senha (Admin).
- Campos auxiliares: último login, 2FA ativo, etc.

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/Usuarios/`
- Controller: `CasaDiAna/src/CasaDiAna.API/Controllers/UsuariosController.cs` — protegido por `[Authorize(Roles = "Admin")]`
- Frontend: `CasaDiAna/frontend/src/features/usuarios/`
- Migration: `AdicionarCamposLoginUsuario`

## Regras relacionadas
- [[REGRA_PAPEIS_USUARIO]]
- [[REGRA_SOFT_DELETE_NOMEEXISTE]]
- [[REGRAS_BACKEND_CRITICAS]] (BCrypt + soft delete + NomeExisteAsync)

## Módulos relacionados
- [[MOD_AUTH_LOGIN_2FA]]
- [[MOD_MINHA_CONTA]]

## Pontos de atenção
- Senha mínima 8 chars com maiúscula, minúscula, número, especial.
- E-mail é **único**; verificar com filtro `ativo = true` antes de criar.

## O que NÃO fazer
- Não permitir auto-criação de usuário (não há fluxo de signup).
- Não usar hard delete; sempre soft delete.
