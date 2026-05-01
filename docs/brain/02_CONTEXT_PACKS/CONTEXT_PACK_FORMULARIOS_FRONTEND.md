---
name: CONTEXT_PACK_FORMULARIOS_FRONTEND
description: Pack para criar/alterar formulários no frontend (RHF + Zod + components/form)
type: context_pack
status: existente
ultima_atualizacao: 2026-04-30
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

## Regras críticas
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
> "Task em formulário do Casa di Ana ERP. Use RHF + Zod (`as any` no resolver), componentes de `components/form/`, tokens `var(--ada-*)`, modal animado de confirmação seguindo `ConfirmacaoProducaoModal.tsx`. Veja plan `docs/superpowers/plans/2026-04-29-modal-confirmacao-todos-formularios.md` para padrão."
