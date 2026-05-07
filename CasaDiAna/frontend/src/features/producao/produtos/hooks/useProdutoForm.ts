import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Produto, ProdutoFormValues, CriarProdutoInput } from '@/types/producao'

export const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.').max(150, 'Máximo de 150 caracteres.'),
  precoVenda: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ required_error: 'Campo obrigatório', invalid_type_error: 'Deve ser um número' })
      .positive('Deve ser maior que zero')
  ),
  categoriaProdutoId: z.string(),
  descricao: z.string(),
})

export function produtoParaForm(p: Produto): ProdutoFormValues {
  return {
    nome: p.nome,
    precoVenda: p.precoVenda,
    categoriaProdutoId: p.categoriaProdutoId ?? '',
    descricao: p.descricao ?? '',
  }
}

export function formParaInput(values: ProdutoFormValues): CriarProdutoInput {
  return {
    nome: values.nome,
    precoVenda: values.precoVenda as number,
    categoriaProdutoId: values.categoriaProdutoId || null,
    descricao: values.descricao || null,
  }
}

export function useProdutoForm() {
  return useForm<ProdutoFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(produtoSchema) as any,
    defaultValues: {
      nome: '',
      precoVenda: undefined,
      categoriaProdutoId: '',
      descricao: '',
    },
  })
}
