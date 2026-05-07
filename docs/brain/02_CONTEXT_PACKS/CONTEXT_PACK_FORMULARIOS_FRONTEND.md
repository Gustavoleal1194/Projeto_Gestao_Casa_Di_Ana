---
name: CONTEXT_PACK_FORMULARIOS_FRONTEND
description: Pack para criar/alterar formulários no frontend (RHF + Zod + components/form)
type: context_pack
status: existente
ultima_atualizacao: 2026-05-07
---

# 🧰 Context pack — Formulários (Frontend)

## Quando usar
Criar ou modificar qualquer formulário (cadastro, edição, modal de confirmação).

## Status resumido
- RHF + Zod (`@hookform/resolvers`).
- Resolver com **cast `as any`** por causa de campos opcionais (conflito de tipos).
- Componentes compartilhados em `components/form/`: `FormCard`, `FormSection`, `CampoTexto`, `SelectCampo`, `FormTextarea`, `FormActions`, `Spinner`.
- Modal de confirmação animado: padrão = `ConfirmacaoProducaoModal.tsx` (em produção em produção-diaria, vendas, fornecedores, ficha técnica, inventários, importação de vendas).
- Plan global: `docs/superpowers/plans/2026-04-29-modal-confirmacao-todos-formularios.md`.

## Regras críticas — TypeScript / Zod 4 (OBRIGATÓRIO)

### 1. `resolver: zodResolver(schema) as any` — em TODO formulário
Zod 4 infere `input` de schemas com `z.preprocess` como `unknown`. Sem o `as any`, o TypeScript conflita com `FormValues`. **Aplica em 100% dos formulários, mesmo os simples.**

```typescript
useForm<MinhaFormValues>({
  resolver: zodResolver(meuSchema) as any,
  defaultValues: { ... },
})
```

### 2. `handleSubmit(fn as any)` — para funções nomeadas com tipo explícito
Quando a função de submit tem tipo explícito (`async (values: MinhaFormValues) => void`), o Docker TypeScript (mais estrito) falha com TS2345. **Aplica a toda função nomeada; funções inline não precisam.**

```typescript
// ✅ Correto
<form onSubmit={handleSubmit(onSubmit as any)}>

// ❌ Errado — falha no build Docker
<form onSubmit={handleSubmit(onSubmit)}>
```

### 3. Campos numéricos: padrão `z.preprocess` (Zod 4 — não usar `z.string().refine`)
Inputs HTML sempre retornam `string`. Usar `z.preprocess` para converter antes de validar:

```typescript
// Obrigatório, positivo:
z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().positive('Deve ser > 0'))

// Obrigatório, >= 0:
z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().min(0, 'Deve ser >= 0'))

// Inteiro positivo:
z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().int('Inteiro').positive('Deve ser > 0'))

// Opcional:
z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().positive('Deve ser > 0').optional())
```

- `defaultValues` numéricos: **`undefined`** (não `''` nem `0` quando opcional).
- No `FormValues`: tipo `number | undefined`.
- No payload para a API (que espera `number`): usar **non-null assertion** — `values.campo!`. Seguro pós-validação Zod.

### 4. Zod 4: sem `required_error` / `invalid_type_error` no construtor
Esses parâmetros não existem em Zod 4. Mensagens customizadas vão nos métodos encadeados:

```typescript
// ✅ Correto
z.number().positive('Deve ser > 0')
z.number().min(0, 'Deve ser >= 0')
z.number().int('Deve ser inteiro')

// ❌ Errado — falha no build Docker
z.number({ required_error: '...', invalid_type_error: '...' })
```

### 5. Componentes `CampoTexto`, `SelectCampo`, `FormTextarea` — SEM `forwardRef`
Nunca passar `ref={field.ref}` nesses componentes. Para campos com máscara, usar `Controller` sem `ref`. Ver E7 em [[ERROS_RESOLVIDOS]].

### Regras de estilo
- Sem classes Tailwind de cor — usar `var(--ada-*)`.
- `<PageHeader>`, `<SkeletonTable>` (loading), `<EmptyState>` (lista vazia) são obrigatórios em telas correspondentes.
- Toda tabela em `<div className="overflow-x-auto">`.

## Design System — Paleta oficial dos modais de confirmação

**Referência visual:** `design_libs/confirmation_animations/confirmacoes.html` + README.  
**Decisão (2026-04-30):** todos os modais de confirmação usam **âmbar `#D4960C`** como cor de acento — checkmark, sparkles, top bar, label uppercase e botão primário. Não usar verde, azul, teal, roxo ou vermelho, mesmo para módulos com semântica diferente (ex: perdas). A identidade de marca prevalece sobre cores semânticas por módulo.

| Token de cor obrigatório | Valor |
|---|---|
| Checkmark / sparkles / label / btn primário | `#D4960C` |
| Top bar gradient | `linear-gradient(90deg, #D4960C, #E8A520)` |
| Botão primário gradient | `linear-gradient(135deg, #D4960C, #B87D0A)` |
| Botão primário shadow | `0 4px 14px rgba(212,150,12,0.30)` |
| CheckMark circle fill | `#FFFBEB` |
| Info box bg / border / icon / text | `#FFFBEB / #FDE68A / #92580A / #7A5206` |
| Título nome (fontSize) | `22` |
| Chip value (fontSize) | `16` |

## Padrão de integração (modal de confirmação)

```tsx
const [confirma, setConfirma] = useState<DadosConfirmacaoXxx | null>(null)

// após sucesso da API:
setConfirma({ ...dados })

// render:
{confirma && (
  <ConfirmacaoXxxModal
    aberto
    dados={confirma}
    onFechar={() => { setConfirma(null) }}
    onVerLista={() => { setConfirma(null); navigate('/rota') }}
  />
)}
```

## Arquivos / docs de referência
- `frontend/src/components/form/*`
- `frontend/src/features/producao/producao-diaria/components/ConfirmacaoProducaoModal.tsx` (referência)
- `frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx` (referência de integração)

## Cuidados
- Toast de sucesso é substituído pelo modal animado; toast de erro permanece.
- Não criar componente "ConfirmacaoModalGenerico" (decisão por modais específicos).
- Datas: `new Date(valor)` direto. Sem concat `T12:00:00`.

## Prompt curto
> "Task em formulário do Casa di Ana ERP (Zod 4.3.6 + RHF 7). Obrigatório: `resolver: zodResolver(schema) as any`; `handleSubmit(onSubmit as any)` para funções nomeadas; campos numéricos via `z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number()...)`; defaultValues numéricos = `undefined`; payload numérico usa `values.campo!`. Sem `required_error`/`invalid_type_error` — são Zod 3. Componentes de `components/form/`, tokens `var(--ada-*)`, modal animado seguindo `ConfirmacaoProducaoModal.tsx`. Ver erros E7, E8, E9, E10 em [[ERROS_RESOLVIDOS]]."
