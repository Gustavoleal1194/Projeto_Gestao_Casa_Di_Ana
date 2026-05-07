---
name: CONTEXT_PACK_FRONTEND
description: Pack denso para tasks no frontend React 19 + Tailwind 4 + Vite 8
type: context_pack
status: existente
ultima_atualizacao: 2026-05-07
---

# 🧰 Context pack — Frontend

## Quando usar
Tasks em `CasaDiAna/frontend/`: páginas, componentes, services HTTP, formulários, tema, animações.

## Status resumido
- React **19** (atualizado de 18) + TypeScript 5.9.
- Vite 8 + Tailwind CSS 4 (via `@tailwindcss/vite`).
- Estado global mínimo: apenas `authStore` (Zustand) — token + usuário em localStorage.
- Form: `react-hook-form` + Zod (`resolver: zodResolver(schema) as any`).
- HTTP: Axios com Bearer interceptor + logout automático em 401.
- Gráficos: ECharts (não Recharts — README desatualizado).
- Animações: framer-motion. Login tem globo 3D via `cobe`.
- PDF: `jspdf` + `jspdf-autotable`.

## Responsabilidades / organização
- `features/<area>/<modulo>/` — feature-based, com `pages/`, `components/`, `services/`.
- `components/form/` — `FormCard`, `FormSection`, `CampoTexto`, `SelectCampo`, `FormTextarea`, `FormActions`, `Spinner`. **Nenhum desses componentes usa `React.forwardRef`** — não aceita `ref` como prop. Passar `ref` causa TS2322 no build Docker mesmo que passe no `tsc` local com cache.
- `components/ui/` e `shared/components/` — primitivos compartilhados.
- `lib/api.ts` — cliente Axios.
- `lib/etiquetasService.ts`, `lib/notificacoesService.ts`, `lib/pdf.ts` — utilidades cross-feature.

## Regras críticas

- **Tema** via tokens `var(--ada-*)` em `index.css`. Não usar classes Tailwind de cor direta.
- **Datas:** backend retorna `"2026-03-28T00:00:00"`; usar `new Date(valor)` sem concatenar `T12:00:00`.
- **Componentes obrigatórios:** `<PageHeader>`, `<SkeletonTable>` (loading), `<EmptyState>` (lista vazia), `<div className="overflow-x-auto">` em toda tabela.
- **Padrão atual de modal de confirmação:** seguir `ConfirmacaoProducaoModal.tsx` (plan `2026-04-29-modal-confirmacao-todos-formularios.md`).

### Forms — regras obrigatórias (Zod 4 + RHF + Docker TS)
- `resolver: zodResolver(schema) as any` — obrigatório em **todos** os formulários.
- `handleSubmit(fn as any)` — obrigatório para qualquer função nomeada com tipo explícito passada ao `handleSubmit`.
- Campos numéricos: usar `z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number()...)`. Nunca `z.string().refine(...)`.
- `defaultValues` numéricos: `undefined`. Payload: `values.campo!`.
- Sem `required_error`/`invalid_type_error` no construtor — são Zod 3 e falham no Docker.
- `CampoTexto`, `SelectCampo`, `FormTextarea` não têm `forwardRef` — nunca passar `ref={field.ref}`.
- Ver pack completo em [[CONTEXT_PACK_FORMULARIOS_FRONTEND]] e erros E7–E10 em [[ERROS_RESOLVIDOS]].

## Módulos relacionados
- [[MOC_MODULOS]] (todos os módulos têm pasta correspondente em `features/`).

## Arquivos / docs de referência
- `CasaDiAna/CLAUDE.md`
- `CasaDiAna/frontend/src/index.css` (tokens `--ada-*`)
- `CasaDiAna/frontend/src/lib/api.ts` (interceptor)
- `CasaDiAna/frontend/src/store/authStore.ts`
- Plans em `docs/superpowers/plans/` por feature.

## Cuidados
- Nunca commitar `.env*` com URLs reais.
- `VITE_API_URL` é build-time — alterar requer rebuild.
- Não introduzir Redux / Tanstack Query sem registrar [[DEC]] — estado global hoje é mínimo.
- Verificar `features/design_libs/` antes de criar componentes novos (lib experimental untracked).

## Prompt curto para agentes
> "Você está editando o frontend Casa di Ana ERP (React 19 + Vite 8 + Tailwind 4 + Zod 4.3.6 + RHF 7, feature-based). Use tokens `var(--ada-*)` (não classes Tailwind de cor). Em formulários: `resolver: zodResolver(schema) as any` obrigatório; `handleSubmit(fn as any)` para funções nomeadas; campos numéricos via `z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number()...)`; sem `required_error`/`invalid_type_error`; payload numérico usa `values.campo!`. Modais de confirmação seguem `ConfirmacaoProducaoModal.tsx`. `<PageHeader>`, `<SkeletonTable>`, `<EmptyState>`, `overflow-x-auto` são obrigatórios. Pt-BR sempre. Ver E7–E10 em ERROS_RESOLVIDOS.md e CONTEXT_PACK_FORMULARIOS_FRONTEND para detalhes."
