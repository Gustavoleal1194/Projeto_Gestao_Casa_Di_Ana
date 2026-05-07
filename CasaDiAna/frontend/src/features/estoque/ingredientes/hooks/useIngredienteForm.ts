import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ingredientesService } from '../services/ingredientesService'
import type { Ingrediente, IngredienteFormValues } from '@/types/estoque'

// ─── Schema de validação ──────────────────────────────────────────────────────
export const ingredienteSchema = z
  .object({
    nome: z
      .string()
      .min(1, 'Nome é obrigatório')
      .max(200, 'Nome deve ter no máximo 200 caracteres'),
    codigoInterno: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
    categoriaId: z.string().uuid('Categoria inválida').optional().or(z.literal('')),
    unidadeMedidaId: z
      .string()
      .min(1, 'Unidade de medida é obrigatória')
      .refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Selecione uma unidade'),
    estoqueMinimo: z
      .string()
      .min(1, 'Estoque mínimo é obrigatório')
      .refine(v => !isNaN(Number(v)) && Number(v) >= 0, 'Deve ser ≥ 0'),
    estoqueMaximo: z
      .string()
      .refine(v => v === '' || (!isNaN(Number(v)) && Number(v) >= 0), 'Deve ser ≥ 0')
      .optional()
      .or(z.literal('')),
    observacoes: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
    quantidadeEmbalagem: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
    _ehPacote: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data._ehPacote && !data.quantidadeEmbalagem) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe a quantidade por embalagem (ex: 500 gramas, 1000 ml)',
        path: ['quantidadeEmbalagem'],
      })
    }
  })

type IngredienteSchema = z.infer<typeof ingredienteSchema>

// ─── Defaults do formulário vazio ─────────────────────────────────────────────
const defaultValues: IngredienteFormValues = {
  nome: '',
  codigoInterno: '',
  categoriaId: '',
  unidadeMedidaId: '',
  estoqueMinimo: '',
  estoqueMaximo: '',
  observacoes: '',
  quantidadeEmbalagem: '',
  _ehPacote: false,
}

// ─── Preencher formulário a partir do ingrediente existente (edição) ──────────
export function ingredienteParaForm(ing: Ingrediente): IngredienteFormValues {
  return {
    nome: ing.nome,
    codigoInterno: ing.codigoInterno ?? '',
    categoriaId: ing.categoriaId ?? '',
    unidadeMedidaId: String(ing.unidadeMedidaId),
    estoqueMinimo: String(ing.estoqueMinimo),
    estoqueMaximo: ing.estoqueMaximo != null ? String(ing.estoqueMaximo) : '',
    observacoes: ing.observacoes ?? '',
    quantidadeEmbalagem: ing.quantidadeEmbalagem ?? '',
    _ehPacote: false,
  }
}

// ─── Converter formulário → input para a API ──────────────────────────────────
function formParaInput(values: IngredienteSchema) {
  return {
    nome: values.nome,
    unidadeMedidaId: Number(values.unidadeMedidaId),
    estoqueMinimo: Number(values.estoqueMinimo),
    codigoInterno: values.codigoInterno || null,
    categoriaId: values.categoriaId || null,
    estoqueMaximo: values.estoqueMaximo ? Number(values.estoqueMaximo) : null,
    observacoes: values.observacoes || null,
    quantidadeEmbalagem: values.quantidadeEmbalagem || null,
  }
}

// ─── Hook principal ───────────────────────────────────────────────────────────
interface UseIngredienteFormOptions {
  ingredienteExistente?: Ingrediente | null
}

export function useIngredienteForm({ ingredienteExistente }: UseIngredienteFormOptions = {}) {
  const form = useForm<IngredienteFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ingredienteSchema) as any,
    defaultValues: ingredienteExistente
      ? ingredienteParaForm(ingredienteExistente)
      : defaultValues,
  })

  const salvar = useCallback(
    async (values: IngredienteFormValues): Promise<Ingrediente> => {
      const input = formParaInput(values as IngredienteSchema)

      if (ingredienteExistente) {
        return ingredientesService.atualizar({ id: ingredienteExistente.id, ...input })
      }
      return ingredientesService.criar(input)
    },
    [ingredienteExistente]
  )

  return { form, salvar }
}
