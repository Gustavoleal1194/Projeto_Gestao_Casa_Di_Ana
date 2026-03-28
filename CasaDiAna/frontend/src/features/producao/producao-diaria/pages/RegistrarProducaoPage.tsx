import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { producaoDiariaService } from '../services/producaoDiariaService'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { ProdutoResumo, ProducaoFormValues } from '@/types/producao'

const producaoSchema = z.object({
  produtoId: z.string().min(1, 'Selecione um produto.'),
  data: z.string().min(1, 'Informe a data.'),
  quantidadeProduzida: z
    .string()
    .min(1, 'Informe a quantidade.')
    .refine(v => Number(v) > 0, 'Quantidade deve ser maior que 0.'),
  observacoes: z.string(),
})

const inputClass =
  'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

const selectClass = inputClass + ' bg-white'

export function RegistrarProducaoPage() {
  const navigate = useNavigate()
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ProducaoFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(producaoSchema) as any,
      defaultValues: {
        produtoId: '',
        data: new Date().toISOString().split('T')[0],
        quantidadeProduzida: '',
        observacoes: '',
      },
    })

  useEffect(() => {
    produtosService.listar().then(setProdutos).catch(() => {})
  }, [])

  const onSubmit = async (values: ProducaoFormValues) => {
    try {
      await producaoDiariaService.registrar({
        produtoId: values.produtoId,
        data: values.data,
        quantidadeProduzida: Number(values.quantidadeProduzida),
        observacoes: values.observacoes || null,
      })
      setToast({ tipo: 'sucesso', mensagem: 'Produção registrada com sucesso.' })
      setTimeout(() => navigate('/producao/diaria'), 1200)
    } catch (err: unknown) {
      const erros = (err as { response?: { data?: { erros?: string[] } } })?.response?.data?.erros
      setToast({ tipo: 'erro', mensagem: erros?.[0] ?? 'Erro ao registrar produção.' })
    }
  }

  return (
    <div className="p-6 max-w-lg">
      <button
        onClick={() => navigate('/producao/diaria')}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Produção Diária
      </button>

      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Registrar Produção</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Produto <span className="text-red-500">*</span>
            </label>
            <select className={selectClass} {...register('produtoId')}>
              <option value="">Selecione o produto...</option>
              {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            {errors.produtoId && <p className="mt-1 text-xs text-red-600">{errors.produtoId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Data <span className="text-red-500">*</span>
            </label>
            <input type="date" className={inputClass} {...register('data')} />
            {errors.data && <p className="mt-1 text-xs text-red-600">{errors.data.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Quantidade Produzida <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              placeholder="Ex: 10"
              className={inputClass}
              {...register('quantidadeProduzida')}
            />
            {errors.quantidadeProduzida && <p className="mt-1 text-xs text-red-600">{errors.quantidadeProduzida.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Observações</label>
            <textarea
              rows={2}
              placeholder="Observações (opcional)"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              {...register('observacoes')}
            />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4 text-xs text-amber-800">
          O estoque dos ingredientes da ficha técnica será debitado automaticamente ao registrar a produção.
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/producao/diaria')}
            className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Registrando...' : 'Registrar Produção'}
          </button>
        </div>
      </form>

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
