---
name: REGRA_PAPEIS_USUARIO
description: Papéis disponíveis e suas permissões básicas
type: regra
status: existente
ultima_atualizacao: 2026-04-30
---

# Regra: papéis de usuário

**Papéis (enum `PapelUsuario`):**
- `Admin` — gestão de usuários e configurações.
- `Coordenador` — visão geral e operação ampla.
- `Compras` — entradas, fornecedores.
- `OperadorCozinha` — produção, vendas, perdas (foco operacional cozinha).
- `OperadorPanificacao` — análogo, área panificação.
- `OperadorBar` — análogo, bar.

**Why:** segregação por área operacional e proteção dos cadastros estruturais. Parte da equipe tem baixa proficiência em informática — tela menor = menos erros.

**How to apply:**
- Backend: `[Authorize(Roles = "Admin")]` em endpoints sensíveis (gestão de usuários).
- Frontend: `useAuthStore().temPapel(...)` esconde rotas/itens.
- Quando houver papel novo, atualizar (1) enum, (2) seed/admin UI, (3) `temPapel`, (4) este memo.

**Onde aplica:**
- [[MOD_USUARIOS]], [[MOD_AUTH_LOGIN_2FA]], roteamento frontend.
