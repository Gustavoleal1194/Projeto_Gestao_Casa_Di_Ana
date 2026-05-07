import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ingredientesService } from '../services/ingredientesService'
import type { Ingrediente, IngredienteFormValues } from '@/types/estoque'

// ─── Helpers z.preprocess ─────────────────────────────────────────────────────
const numeroObrigatorio = (msg = 'Campo obrigatório') =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z
      .number()
      .nonnegative('Deve ser ≥ 0')
  )

const numeroOpcionalPositivo = z.preprocess(
  (v) => (v === '' || v == null ? undefined : Number(v)),
  z
    .number()
    .positive('Deve ser maior que zero')
    .optional()
)

// ─── Schema de validação ──────────────────────────────────────────────────────
export const ingredienteSchema = z
  .object({
    nome: z
      .string()
      .min(1, 'Nome é obrigatório')
      .max(200, 'Nome deve ter no máximo 200 caracteres'),
    codigoInterno: z.string().max(30, 'Máximo 30 caracteres').optional().or(z.literal('')),
    categoriaId: z.string().uuid('Categoria inválida').optional().or(z.literal('')),
    unidadeMedidaId: z
      .string()
      .min(1, 'Unidade de medida é obrigatória')
      .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Selecione uma unidade'),
    estoqueMinimo: numeroObrigatorio('Estoque mínimo é obrigatório'),
    estoqueMaximo: numeroOpcionalPositivo,
    observacoes: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
    quantidadeEmbalagemValor: numeroOpcionalPositivo,
    unidadeEmbalagem: z.enum(['', 'ml', 'g']).optional().or(z.literal('')),
    _ehPacote: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const temValor =
      data.quantidadeEmbalagemValor !== undefined && data.quantidadeEmbalagemValor > 0
    const temUnidade =
      data.unidadeEmbalagem !== '' && data.unidadeEmbalagem !== undefined
    if (temValor && !temUnidade) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione a unidade de embalagem',
        path: ['unidadeEmbalagem'],
      })
    }
    if (temUnidade && !temValor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe a quantidade por embalagem',
        path: ['quantidadeEmbalagemValor'],
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
  estoqueMinimo: 0,
  estoqueMaximo: undefined,
  observacoes: '',
  quantidadeEmbalagemValor: undefined,
  unidadeEmbalagem: '',
  _ehPacote: false,
}

// ─── Preencher formulário a partir do ingrediente existente (edição) ──────────
export function ingredienteParaForm(ing: Ingrediente): IngredienteFormValues {
  return {
    nome: ing.nome,
    codigoInterno: ing.codigoInterno ?? '',
    categoriaId: ing.categoriaId ?? '',
    unidadeMedidaId: String(ing.unidadeMedidaId),
    estoqueMinimo: ing.estoqueMinimo,
    estoqueMaximo: ing.estoqueMaximo ?? undefined,
    observacoes: ing.observacoes ?? '',
    quantidadeEmbalagemValor: ing.quantidadeEmbalagemValor ?? undefined,
    unidadeEmbalagem: ing.unidadeEmbalagem ?? '',
    _ehPacote: false,
  }
}

// ─── Converter formulário → input para a API ──────────────────────────────────
function formParaInput(values: IngredienteSchema) {
  return {
    nome: values.nome,
    unidadeMedidaId: Number(values.unidadeMedidaId),
    estoqueMinimo: values.estoqueMinimo as number,
    codigoInterno: values.codigoInterno || null,
    categoriaId: values.categoriaId || null,
    estoqueMaximo: values.estoqueMaximo ?? null,
    observacoes: values.observacoes || null,
    quantidadeEmbalagemValor: values.quantidadeEmbalagemValor || undefined,
    unidadeEmbalagem: values.unidadeEmbalagem || undefined,
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
