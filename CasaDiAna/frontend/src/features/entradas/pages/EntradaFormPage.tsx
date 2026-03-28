import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { entradasService } from '../services/entradasService'
import { fornecedoresService } from '@/features/fornecedores/services/fornecedoresService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { Fornecedor, IngredienteResumo, EntradaFormValues } from '@/types/estoque'

const entradaSchema = z.object({
  fornecedorId: z.string().min(1, 'Selecione um fornecedor.'),
  dataEntrada: z.string().min(1, 'Informe a data da entrada.'),
  numeroNotaFiscal: z.string().max(60),
  observacoes: z.string(),
  itens: z
    .array(
      z.object({
        ingredienteId: z.string().min(1, 'Selecione um ingrediente.'),
        quantidade: z.string().min(1).refine(v => Number(v) > 0, 'Quantidade deve ser maior que 0.'),
        custoUnitario: z.string().min(1).refine(v => Number(v) >= 0, 'Custo deve ser ≥ 0.'),
      })
    )
    .min(1, 'Adicione pelo menos um item.'),
})

const selectClass =
  'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

const inputClass =
  'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

export function EntradaFormPage() {
  const navigate = useNavigate()
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<EntradaFormValues>({
    resolver: zodResolver(entradaSchema),
    defaultValues: {
      fornecedorId: '',
      dataEntrada: new Date().toISOString().split('T')[0],
      numeroNotaFiscal: '',
      observacoes: '',
      itens: [{ ingredienteId: '', quantidade: '', custoUnitario: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })

  useEffect(() => {
    fornecedoresService.listar().then(setFornecedores).catch(() => {})
    ingredientesService.listar().then(setIngredientes).catch(() => {})
  }, [])

  const onSubmit = async (values: EntradaFormValues) => {
    try {
      await entradasService.registrar({
        fornecedorId: values.fornecedorId,
        dataEntrada: values.dataEntrada,
        numeroNotaFiscal: values.numeroNotaFiscal || null,
        observacoes: values.observacoes || null,
        itens: values.itens.map(item => ({
          ingredienteId: item.ingredienteId,
          quantidade: Number(item.quantidade),
          custoUnitario: Number(item.custoUnitario),
        })),
      })
      setToast({ tipo: 'sucesso', mensagem: 'Entrada registrada com sucesso.' })
      setTimeout(() => navigate('/entradas'), 1200)
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao registrar entrada.' })
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={() => navigate('/entradas')}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Entradas
      </button>

      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Nova Entrada de Mercadoria</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-6">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">Dados da Entrada</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Fornecedor <span className="text-red-500">*</span>
                </label>
                <select className={selectClass} {...register('fornecedorId')}>
                  <option value="">Selecione o fornecedor...</option>
                  {fornecedores.map(f => (
                    <option key={f.id} value={f.id}>{f.razaoSocial}</option>
                  ))}
                </select>
                {errors.fornecedorId && (
                  <p className="mt-1 text-xs text-red-600">{errors.fornecedorId.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Data da Entrada <span className="text-red-500">*</span>
                </label>
                <input type="date" className={inputClass} {...register('dataEntrada')} />
                {errors.dataEntrada && (
                  <p className="mt-1 text-xs text-red-600">{errors.dataEntrada.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nota Fiscal</label>
                <input type="text" placeholder="Número da NF (opcional)" className={inputClass} {...register('numeroNotaFiscal')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Observações</label>
                <input type="text" placeholder="Observações (opcional)" className={inputClass} {...register('observacoes')} />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Itens da Entrada</p>
              <button
                type="button"
                onClick={() => append({ ingredienteId: '', quantidade: '', custoUnitario: '' })}
                className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Adicionar item
              </button>
            </div>

            {errors.itens && !Array.isArray(errors.itens) && (
              <p className="mb-2 text-xs text-red-600">{(errors.itens as { message?: string }).message}</p>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_100px_120px_40px] gap-2 text-xs font-medium text-stone-500 px-1">
                <span>Ingrediente</span>
                <span>Quantidade</span>
                <span>Custo Unit. (R$)</span>
                <span />
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_100px_120px_40px] gap-2 items-start">
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
                    <input type="number" step="0.001" min="0.001" placeholder="0.000" className={inputClass} {...register(`itens.${index}.quantidade`)} />
                    {errors.itens?.[index]?.quantidade && (
                      <p className="mt-0.5 text-xs text-red-600">{errors.itens[index]?.quantidade?.message}</p>
                    )}
                  </div>
                  <div>
                    <input type="number" step="0.01" min="0" placeholder="0.00" className={inputClass} {...register(`itens.${index}.custoUnitario`)} />
                    {errors.itens?.[index]?.custoUnitario && (
                      <p className="mt-0.5 text-xs text-red-600">{errors.itens[index]?.custoUnitario?.message}</p>
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
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/entradas')}
            className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Registrando...' : 'Registrar Entrada'}
          </button>
        </div>
      </form>

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
