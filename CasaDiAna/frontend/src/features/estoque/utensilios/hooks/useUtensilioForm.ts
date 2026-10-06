import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { utensiliosService } from '../services/utensiliosService'
import type { Utensilio, UtensilioFormValues } from '@/types/estoque'

const numeroObrigatorio = () =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().nonnegative('Deve ser ≥ 0')
  )

const numeroOpcionalPositivo = z.preprocess(
  (v) => (v === '' || v == null ? undefined : Number(v)),
  z.number().positive('Deve ser maior que zero').optional()
)

export const utensilioSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(150, 'Nome deve ter no máximo 150 caracteres'),
  codigoInterno: z.string().max(30, 'Máximo 30 caracteres').optional().or(z.literal('')),
  categoriaUtensilioId: z.string().uuid('Categoria inválida').optional().or(z.literal('')),
  unidadeMedidaId: z
    .string()
    .min(1, 'Unidade de medida é obrigatória')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Selecione uma unidade'),
  estoqueMinimo: numeroObrigatorio(),
  estoqueMaximo: numeroOpcionalPositivo,
})

type UtensilioSchema = z.infer<typeof utensilioSchema>

const defaultValues: UtensilioFormValues = {
  nome: '',
  codigoInterno: '',
  categoriaUtensilioId: '',
  unidadeMedidaId: '',
  estoqueMinimo: 0,
  estoqueMaximo: undefined,
}

export function utensilioParaForm(u: Utensilio): UtensilioFormValues {
  return {
    nome: u.nome,
    codigoInterno: u.codigoInterno ?? '',
    categoriaUtensilioId: u.categoriaUtensilioId ?? '',
    unidadeMedidaId: String(u.unidadeMedidaId),
    estoqueMinimo: u.estoqueMinimo,
    estoqueMaximo: u.estoqueMaximo ?? undefined,
  }
}

function formParaInput(values: UtensilioSchema) {
  return {
    nome: values.nome,
    unidadeMedidaId: Number(values.unidadeMedidaId),
    estoqueMinimo: values.estoqueMinimo as number,
    codigoInterno: values.codigoInterno || null,
    categoriaUtensilioId: values.categoriaUtensilioId || null,
    estoqueMaximo: values.estoqueMaximo ?? null,
  }
}

interface UseUtensilioFormOptions {
  utensilioExistente?: Utensilio | null
}

export function useUtensilioForm({ utensilioExistente }: UseUtensilioFormOptions = {}) {
  const form = useForm<UtensilioFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(utensilioSchema) as any,
    defaultValues: utensilioExistente
      ? utensilioParaForm(utensilioExistente)
      : defaultValues,
  })

  const salvar = useCallback(
    async (values: UtensilioFormValues): Promise<Utensilio> => {
      const input = formParaInput(values as UtensilioSchema)

      if (utensilioExistente) {
        return utensiliosService.atualizar({ id: utensilioExistente.id, ...input })
      }
      return utensiliosService.criar(input)
    },
    [utensilioExistente]
  )

  return { form, salvar }
}
