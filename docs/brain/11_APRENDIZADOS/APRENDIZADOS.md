---
name: APRENDIZADOS – aprendizados consolidados do projeto
description: Aprendizados não-óbvios que valem reusar em decisões futuras
type: aprendizado
status: existente
ultima_atualizacao: 2026-05-07
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

## A9 — Docker TypeScript é significativamente mais estrito que o `tsc` local
- **Onde:** qualquer build frontend no Render.
- **Lição:** `npx tsc --noEmit` local pode passar com 0 erros enquanto o Docker falha com TS2345/TS2322/TS6133. A razão é cache de `@types` local versus imagem limpa do Docker. Os erros E8, E9, E10 só apareceram no Docker após 6 tentativas de deploy.
- **Aplicação:** ao usar padrões novos (Zod 4, `z.preprocess`, `resolver as any`), **o Docker é o compilador autoritativo**, não o local. Se houver dúvida, testar no Docker antes de commitar.

## A10 — `z.string().refine(Number(v) > 0)` é anti-pattern — usar `z.preprocess`
- **Onde:** todo formulário com campo numérico.
- **Lição:** inputs HTML retornam `string` sempre. `z.string().refine(...)` passa a validação Zod mas entrega `string` ao submit handler — quebrando tipos e payloads. O padrão correto é `z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number()...)`, que converte antes de validar e garante `number` na saída.
- **Consequência direta:** `defaultValues` numéricos devem ser `undefined` (não `''`); payload usa `values.campo!`.

## A11 — Zod 4 e React Hook Form: dois `as any` obrigatórios, razões diferentes
- **Onde:** todo `useForm` + `handleSubmit` do projeto.
- **A11a — `resolver: zodResolver(schema) as any`:** Zod 4 infere o input de schemas com `z.preprocess` como `unknown`, gerando conflito de tipo com `FormValues` no resolver. O `as any` silencia esse conflito sem perda de safety em runtime.
- **A11b — `handleSubmit(namedFn as any)`:** quando a função de submit tem tipo explícito (`(values: XFormValues) => void`), o Docker TypeScript (contravariance check mais estrito) rejeita a assinatura. Funções inline passam porque recebem tipagem contextual. A correção é `as any` na passagem, mantendo o tipo na definição da função.
- **Aplicação:** ambos são obrigatórios em **todos** os formulários do projeto. Ver E8 em [[ERROS_RESOLVIDOS]].
