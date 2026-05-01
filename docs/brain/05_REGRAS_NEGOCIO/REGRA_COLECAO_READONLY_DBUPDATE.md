---
name: REGRA_COLECAO_READONLY_DBUPDATE
description: Inserir filhos via _db.Update() falha em entidades com private readonly List — usar repositório
type: regra
status: existente
ultima_atualizacao: 2026-04-30
---

# Regra: coleções `private readonly List<T>` exigem inserção via repositório

**Regra:** entidades de domínio com filhos como `private readonly List<T>` (encapsulamento) **não** aceitam adicionar filhos por `_db.Update(entidade)` — gera `DbUpdateConcurrencyException`.

**Why:** o EF não rastreia mudanças na coleção quando ela é exposta por método mas materializada por backing field privado.

**How to apply:**
- Inserir o filho diretamente pelo `DbSet<TFilho>` ou repositório dedicado.
- Manter o método de domínio (`AdicionarItem`) para validação, mas a persistência do filho passa pelo repositório.

**Onde aplica:**
- [[MOD_ENTRADAS]] (`ItemEntradaMercadoria`), [[MOD_PRODUTOS_FICHA_TECNICA]] (`ItemFichaTecnica`), [[MOD_INVENTARIOS]] (`ItemInventario`), [[MOD_INGREDIENTES]] (`Movimentacao`).

**Evidências:** `CasaDiAna/CLAUDE.md` (seção Backend → Armadilhas).
