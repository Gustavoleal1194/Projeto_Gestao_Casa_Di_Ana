---
name: CONTEXT_PACK_FRONTEND
description: Pack denso para tasks no frontend React 19 + Tailwind 4 + Vite 8
type: context_pack
status: existente
ultima_atualizacao: 2026-04-30
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
- `components/form/` — `FormCard`, `FormSection`, `CampoTexto`, `SelectCampo`, `FormTextarea`, `FormActions`, `Spinner`.
- `components/ui/` e `shared/components/` — primitivos compartilhados.
- `lib/api.ts` — cliente Axios.
- `lib/etiquetasService.ts`, `lib/notificacoesService.ts`, `lib/pdf.ts` — utilidades cross-feature.

## Regras críticas
- **Tema** via tokens `var(--ada-*)` em `index.css`. Não usar classes Tailwind de cor direta.
- **Datas:** backend retorna `"2026-03-28T00:00:00"`; usar `new Date(valor)` sem concatenar `T12:00:00`.
- **Componentes obrigatórios:** `<PageHeader>`, `<SkeletonTable>` (loading), `<EmptyState>` (lista vazia), `<div className="overflow-x-auto">` em toda tabela.
- **Forms:** sempre RHF + Zod com `as any` no resolver (campos opcionais).
- **Padrão atual de modal de confirmação:** seguir `ConfirmacaoProducaoModal.tsx` (plan `2026-04-29-modal-confirmacao-todos-formularios.md`).

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
> "Você está editando o frontend Casa di Ana ERP (React 19 + Vite 8 + Tailwind 4, feature-based). Use tokens `var(--ada-*)` (não classes Tailwind de cor). Forms com RHF + Zod (`as any` no resolver). Modais de confirmação seguem `ConfirmacaoProducaoModal.tsx`. `<PageHeader>`, `<SkeletonTable>`, `<EmptyState>`, `overflow-x-auto` são obrigatórios. Pt-BR sempre."
