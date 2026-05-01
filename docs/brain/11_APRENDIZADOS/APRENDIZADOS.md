---
name: APRENDIZADOS – aprendizados consolidados do projeto
description: Aprendizados não-óbvios que valem reusar em decisões futuras
type: aprendizado
status: existente
ultima_atualizacao: 2026-04-30
---

# 🎓 Aprendizados

> Cada item: o aprendizado, **por que** importa, e **onde** se aplica.

## A1 — `private readonly List<T>` quebra `_db.Update(parent)`
- **Onde:** `EntradaMercadoria.Itens`, `Inventario.Itens`, `Produto.ItensFichaTecnica`.
- **Lição:** encapsular bem a coleção (boa prática) **incompatibiliza** com `_db.Update` para inserir filhos. Sempre inserir o filho diretamente pelo repositório.
- **Origem:** `CasaDiAna/CLAUDE.md` (seção Backend → Armadilhas).

## A2 — `JwtRegisteredClaimNames.Sub` é uma armadilha
- **Onde:** `CurrentUserService`.
- **Lição:** ASP.NET Core remapeia `sub` para `ClaimTypes.NameIdentifier` automaticamente. Ler pelo nome `sub` retorna `null`.
- **Aplicação:** sempre usar `User.FindFirstValue(ClaimTypes.NameIdentifier)`.

## A3 — BCrypt no caminho TOTP custa caro
- **Onde:** verificação de recovery code.
- **Lição:** ~200ms por chamada cria latência visível e enumeráveis. Recovery code precisa de endpoint dedicado, fora do hot path TOTP.

## A4 — Estoque negativo é decisão, não bug
- **Onde:** migrations `RemoverCheckEstoqueNaoNegativo*` e `ZerarEstoqueNegativo`.
- **Lição:** restrições de banco não substituem regras de domínio. Permitir negativo no banco refletiu uma necessidade real, e o domínio passou a ser o guardião do clamp em 0.

## A5 — Filtros de data com `<=` são uma armadilha
- **Onde:** todos os relatórios.
- **Lição:** `<= ate` perde os registros das horas posteriores a `00:00:00`. Padronizar `< ate.Date.AddDays(1)`.

## A6 — Build pelo projeto API (Windows + lock de DLL)
- **Onde:** terminal local Windows.
- **Lição:** `dotnet build` na raiz da solução pode bloquear DLL em uso. Sempre `dotnet build src/CasaDiAna.API`.

## A7 — Tokens CSS > classes Tailwind de cor
- **Onde:** todo o frontend.
- **Lição:** classes Tailwind de cor direta quebram tema escuro. Tokens `--ada-*` em `index.css` mantêm temas alternáveis.

## A8 — Plans são a memória de longo prazo de decisão
- **Onde:** `docs/superpowers/plans/`.
- **Lição:** mesmo planos não executados deixam pista do raciocínio. Marcar status do plan em vez de apagar é mais útil para o futuro.
