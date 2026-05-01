---
name: ERROS_RESOLVIDOS – erros já solucionados
description: Bug → causa → cura, para evitar repetição
type: erros_resolvidos
status: existente
ultima_atualizacao: 2026-04-30
---

# 🐛 Erros Resolvidos

> Use [[TEMPLATE_ERRO_RESOLVIDO]] para novas entradas.
> Inclua causa raiz, sintoma, cura e como evitar.

## E1 — `DbUpdateConcurrencyException` ao adicionar filhos via parent
- **Sintoma:** salvar entrada/inventário/ficha técnica nova após `Adicionar*` joga `DbUpdateConcurrencyException`.
- **Causa raiz:** EF não rastreia `private readonly List<T>` materializada como backing field, o `_db.Update(parent)` não vê novos filhos.
- **Cura:** inserir o filho diretamente pelo repositório/`DbSet<TFilho>`.
- **Como evitar:** ver [[REGRA_COLECAO_READONLY_DBUPDATE]] e [[A1]] em [[APRENDIZADOS]].

## E2 — Latência alta no caminho de erro do TOTP
- **Sintoma:** falha em verificar 2FA demorava ~200 ms.
- **Causa raiz:** handler do TOTP estava verificando recovery code via BCrypt no mesmo fluxo.
- **Cura:** mover recovery code para endpoint dedicado; manter validator do TOTP em `^\d{6}$`.
- **Como evitar:** ver [[REGRA_2FA_TOTP_FORMATO]] e [[REGRA_BCRYPT_RECOVERY_FORA_HANDLER_TOTP]].

## E3 — `CurrentUserService` retornava `null` para o ID do usuário
- **Sintoma:** auditoria gravava `criado_por` vazio.
- **Causa raiz:** leitura por `JwtRegisteredClaimNames.Sub`. ASP.NET remapeia `sub` para `ClaimTypes.NameIdentifier`.
- **Cura:** usar `User.FindFirstValue(ClaimTypes.NameIdentifier)`.

## E4 — Filtros de data perdiam o último dia
- **Sintoma:** relatório com filtro `ate = hoje` retornava 0 itens criados após 00:00 de hoje.
- **Causa raiz:** `criadoEm <= ate` interpretava `ate` como `00:00:00`.
- **Cura:** `criadoEm < ate.Date.AddDays(1)` (exclusivo).
- **Como evitar:** ver [[REGRA_FILTROS_DATA_EXCLUSIVO]].

## E5 — Ficha técnica retornando custo zero
- **Sintoma:** após uma entrada de mercadoria, custo de produção continuava zero.
- **Causa raiz:** handler chamava só `AtualizarEstoque`, esquecia `AtualizarCusto`.
- **Cura:** sempre chamar ambos.
- **Como evitar:** ver [[REGRA_ENTRADA_ATUALIZA_CUSTO]].
