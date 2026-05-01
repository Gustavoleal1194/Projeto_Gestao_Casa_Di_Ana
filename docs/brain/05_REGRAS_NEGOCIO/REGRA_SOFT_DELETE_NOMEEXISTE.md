---
name: REGRA_SOFT_DELETE_NOMEEXISTE
description: NomeExisteAsync deve filtrar ativo = true para não bloquear criação por entidade desativada
type: regra
status: existente
ultima_atualizacao: 2026-04-30
---

# Regra: NomeExisteAsync respeita soft delete

**Regra:** consultas de unicidade de nome (`NomeExisteAsync`, `EmailExisteAsync`, etc.) **devem** filtrar `ativo = true`.

**Why:** sem o filtro, ao desativar uma entidade ficaria impossível recriar com o mesmo nome — o que contradiz a UX de soft delete (entidade desativada some da listagem mas continua no banco).

**How to apply:**
- Repositório: `_db.Set<T>().AnyAsync(x => x.Nome == nome && x.Ativo)`.
- Em validators: usar a função do repositório, não consultar direto.

**Onde aplica:**
- [[MOD_INGREDIENTES]], [[MOD_FORNECEDORES]], [[MOD_CATEGORIAS_INGREDIENTE]], [[MOD_CATEGORIAS_PRODUTO]], [[MOD_PRODUTOS_FICHA_TECNICA]], [[MOD_USUARIOS]].

**Evidências:** `Infrastructure/Repositories/*Repository.cs`.
