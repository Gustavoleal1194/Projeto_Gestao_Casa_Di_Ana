import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Fornecedor, FornecedorFormValues, CriarFornecedorInput } from '@/types/estoque'

// ─── Utilitários de máscara ───────────────────────────────────────────────────

export function formatarCnpj(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 14)
  return digitos
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)
  if (digitos.length <= 10) {
    return digitos
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }
  return digitos
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

// ─── Schema de validação ──────────────────────────────────────────────────────

export const fornecedorSchema = z.object({
  razaoSocial: z.string().min(1, 'Razão Social é obrigatória.').max(200, 'Máximo de 200 caracteres.'),
  nomeFantasia: z.string().max(200, 'Máximo de 200 caracteres.'),
  cnpj: z.string().refine(
    v => !v || v.replace(/\D/g, '').length === 14,
    'CNPJ deve ter exatamente 14 dígitos.'
  ),
  telefone: z.string().refine(
    v => !v || (v.replace(/\D/g, '').length >= 10 && v.replace(/\D/g, '').length <= 11),
    'Telefone inválido. Informe DDD + número (10 ou 11 dígitos).'
  ),
  email: z.string().refine(v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Informe um e-mail válido.'),
  contatoNome: z.string(),
  observacoes: z.string(),
})

// ─── Conversores ──────────────────────────────────────────────────────────────

export function fornecedorParaForm(f: Fornecedor): FornecedorFormValues {
  return {
    razaoSocial: f.razaoSocial,
    nomeFantasia: f.nomeFantasia ?? '',
    cnpj: f.cnpj ? formatarCnpj(f.cnpj) : '',
    telefone: f.telefone ? formatarTelefone(f.telefone) : '',
    email: f.email ?? '',
    contatoNome: f.contatoNome ?? '',
    observacoes: f.observacoes ?? '',
  }
}

export function formParaInput(values: FornecedorFormValues): CriarFornecedorInput {
  return {
    razaoSocial: values.razaoSocial,
    nomeFantasia: values.nomeFantasia || null,
    cnpj: values.cnpj ? values.cnpj.replace(/\D/g, '') : null,
    telefone: values.telefone ? values.telefone.replace(/\D/g, '') : null,
    email: values.email || null,
    contatoNome: values.contatoNome || null,
    observacoes: values.observacoes || null,
  }
}

export function useFornecedorForm() {
  return useForm<FornecedorFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(fornecedorSchema) as any,
    defaultValues: {
      razaoSocial: '',
      nomeFantasia: '',
      cnpj: '',
      telefone: '',
      email: '',
      contatoNome: '',
      observacoes: '',
    },
  })
}
