import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { produtosService } from '../services/produtosService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { FichaTecnica } from '@/types/producao'
import type { IngredienteResumo } from '@/types/estoque'

const fichaSchema = z.object({
  itens: z.array(
    z.object({
      ingredienteId: z.string().min(1, 'Selecione um ingrediente.'),
      quantidadePorUnidade: z
        .string()
        .min(1)
        .refine(v => Number(v) > 0, 'Quantidade deve ser > 0.'),
    })
  ).min(1, 'Adicione pelo menos um ingrediente.'),
})

type FichaFormValues = {
  itens: { ingredienteId: string; quantidadePorUnidade: string }[]
}

const inputClass =
  'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

const selectClass = inputClass + ' bg-white'

export function FichaTecnicaPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [ficha, setFicha] = useState<FichaTecnica | null>(null)
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FichaFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(fichaSchema) as any,
      defaultValues: { itens: [{ ingredienteId: '', quantidadePorUnidade: '' }] },
    })

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })

  useEffect(() => {
    if (!id) return
    Promise.all([
      produtosService.obterFichaTecnica(id).catch(() => null),
      ingredientesService.listar(),
    ])
      .then(([fichaData, ingsData]) => {
        setIngredientes(ingsData)
        if (fichaData && fichaData.itens.length > 0) {
          setFicha(fichaData)
          reset({
            itens: fichaData.itens.map(i => ({
              ingredienteId: i.ingredienteId,
              quantidadePorUnidade: String(i.quantidadePorUnidade),
            })),
          })
        }
      })
      .catch(() => setToast({ tipo: 'erro', mensagem: 'Erro ao carregar ficha técnica.' }))
      .finally(() => setCarregando(false))
  }, [id, reset])

  const onSubmit = async (values: FichaFormValues) => {
    if (!id) return
    try {
      const fichaAtualizada = await produtosService.definirFichaTecnica(id, {
        itens: values.itens.map(i => ({
          ingredienteId: i.ingredienteId,
          quantidadePorUnidade: Number(i.quantidadePorUnidade),
        })),
      })
      setFicha(fichaAtualizada)
      setToast({ tipo: 'sucesso', mensagem: 'Ficha técnica salva com sucesso.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar ficha técnica.' })
    }
  }

  if (carregando) {
    return (
      <div className="p-6 flex justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={() => navigate('/producao/produtos')}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Produtos
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">
            Ficha Técnica — {ficha?.produtoNome ?? 'Produto'}
          </h1>
          {ficha && (
            <p className="text-sm text-stone-500 mt-1">
              Preço de venda:{' '}
              {ficha.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          )}
        </div>
        {ficha && ficha.custoTotal > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 px-5 py-3 text-right">
            <p className="text-xs text-stone-500 uppercase tracking-wide">Custo Total</p>
            <p className="text-lg font-semibold text-stone-800">
              {ficha.custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            {ficha.margemLucro != null && (
              <p className={`text-xs font-medium mt-0.5 ${ficha.margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Margem: {ficha.margemLucro.toFixed(1)}%
              </p>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Ingredientes</p>
            <button
              type="button"
              onClick={() => append({ ingredienteId: '', quantidadePorUnidade: '' })}
              className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Adicionar ingrediente
            </button>
          </div>

          {errors.itens && !Array.isArray(errors.itens) && (
            <p className="mb-2 text-xs text-red-600">{(errors.itens as { message?: string }).message}</p>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_120px_40px] gap-2 text-xs font-medium text-stone-500 px-1">
              <span>Ingrediente</span>
              <span>Qtd por Unidade</span>
              <span />
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_120px_40px] gap-2 items-start">
                <div>
                  <select className={selectClass} {...register(`itens.${index}.ingredienteId`)}>
                    <option value="">Selecione...</option>
                    {ingredientes.map(ing => (
                      <option key={ing.id} value={ing.id}>
                        {ing.nome} ({ing.unidadeMedidaCodigo})
                      </option>
                    ))}
                  </select>
                  {errors.itens?.[index]?.ingredienteId && (
                    <p className="mt-0.5 text-xs text-red-600">{errors.itens[index]?.ingredienteId?.message}</p>
                  )}
                </div>
                <div>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="0.000"
                    className={inputClass}
                    {...register(`itens.${index}.quantidadePorUnidade`)}
                  />
                  {errors.itens?.[index]?.quantidadePorUnidade && (
                    <p className="mt-0.5 text-xs text-red-600">{errors.itens[index]?.quantidadePorUnidade?.message}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length === 1}
                  className="p-2 rounded hover:bg-red-50 text-stone-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed mt-0.5"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/producao/produtos')}
            className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium"
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Ficha Técnica'}
          </button>
        </div>
      </form>

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
