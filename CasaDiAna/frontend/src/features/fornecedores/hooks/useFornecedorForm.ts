import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Fornecedor, FornecedorFormValues, CriarFornecedorInput } from '@/types/estoque'

export const fornecedorSchema = z.object({
  razaoSocial: z.string().min(1, 'Razão Social é obrigatória.').max(200, 'Máximo de 200 caracteres.'),
  nomeFantasia: z.string().max(200, 'Máximo de 200 caracteres.'),
  cnpj: z.string().refine(v => !v || /^\d{14}$/.test(v), 'CNPJ deve ter exatamente 14 dígitos numéricos.'),
  telefone: z.string().max(20, 'Máximo de 20 caracteres.'),
  email: z.string().refine(v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Informe um e-mail válido.'),
  contatoNome: z.string(),
  observacoes: z.string(),
})

export function fornecedorParaForm(f: Fornecedor): FornecedorFormValues {
  return {
    razaoSocial: f.razaoSocial,
    nomeFantasia: f.nomeFantasia ?? '',
    cnpj: f.cnpj ?? '',
    telefone: f.telefone ?? '',
    email: f.email ?? '',
    contatoNome: f.contatoNome ?? '',
    observacoes: f.observacoes ?? '',
  }
}

export function formParaInput(values: FornecedorFormValues): CriarFornecedorInput {
  return {
    razaoSocial: values.razaoSocial,
    nomeFantasia: values.nomeFantasia || null,
    cnpj: values.cnpj || null,
    telefone: values.telefone || null,
    email: values.email || null,
    contatoNome: values.contatoNome || null,
    observacoes: values.observacoes || null,
  }
}

export function useFornecedorForm() {
  return useForm<FornecedorFormValues>({
    resolver: zodResolver(fornecedorSchema),
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
