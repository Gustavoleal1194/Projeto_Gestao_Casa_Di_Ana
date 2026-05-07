---
name: MOD_FORNECEDORES
description: Cadastro de fornecedores (CNPJ com máscara, contato, e-mail, telefone com máscara)
type: modulo
status: existente
ultima_atualizacao: 2026-05-07
---

# 🚚 Módulo: Fornecedores

## Status detectado
**existente** — CRUD com soft delete, máscaras de CNPJ e Telefone.

## Objetivo
Manter fornecedores referenciados pelas entradas de mercadoria.

## Evidências
- Backend: `CasaDiAna/src/CasaDiAna.Application/Fornecedores/`
- Domain: `Domain/Entities/Fornecedor.cs`
- Frontend: `CasaDiAna/frontend/src/features/fornecedores/`
- Hook de formulário: `frontend/src/features/fornecedores/hooks/useFornecedorForm.ts`
- Plans: `docs/superpowers/plans/2026-03-27-fornecedores.md`, `2026-05-06-formularios-ingredientes-fornecedores.md`.

## Campos com máscara (2026-05-06)

### CNPJ
- Máscara no input: `00.000.000/0000-00` — aplicada via `Controller` RHF + `formatarCnpj()`.
- Strip antes de enviar: `values.cnpj.replace(/\D/g, '')` → 14 dígitos enviados ao backend.
- Validação Zod: `.refine(v => v.replace(/\D/g,'').length === 14)`.
- Validação backend: `Matches(@"^\d{14}$")` em `CriarFornecedorCommandValidator` e `AtualizarFornecedorCommandValidator`.

### Telefone
- Máscara: ≤10 dígitos → `(XX) XXXX-XXXX`; 11 dígitos → `(XX) XXXXX-XXXX`.
- Strip antes de enviar: `values.telefone.replace(/\D/g, '')` → 10 ou 11 dígitos.
- Validação Zod: `.refine(v => { const d = v.replace(/\D/g,''); return d.length >= 10 && d.length <= 11 })`.
- Validação backend: `Matches(@"^\d{10,11}$")`.

### Atenção ao usar `Controller` com `CampoTexto`
`CampoTexto` **não usa `React.forwardRef`** — nunca passar `ref={field.ref}`. Causa TS2322 no build Docker mesmo que `tsc` local passe (ver [[ERROS_RESOLVIDOS]] E7).

## Regras relacionadas
- [[REGRA_SOFT_DELETE_NOMEEXISTE]]

## Módulos relacionados
- [[MOD_ENTRADAS]]

## Pontos de atenção
- Fornecedor desativado **não** deve aparecer no select de entrada (filtrar `ativo = true`).

## O que NÃO fazer
- Não excluir fornecedor com entradas vinculadas — usar soft delete.
- Não passar `ref={field.ref}` em `CampoTexto` — ver E7 em [[ERROS_RESOLVIDOS]].
