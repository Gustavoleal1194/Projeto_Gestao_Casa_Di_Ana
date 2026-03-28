import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { inventariosService } from '../services/inventariosService'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'

interface IniciarFormValues {
  dataRealizacao: string
  descricao: string
  observacoes: string
}

const schema = z.object({
  dataRealizacao: z.string().min(1, 'Informe a data de realização.'),
  descricao: z.string().max(200),
  observacoes: z.string(),
})

const inputClass =
  'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

export function InventarioFormPage() {
  const navigate = useNavigate()
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<IniciarFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dataRealizacao: new Date().toISOString().split('T')[0],
      descricao: '',
      observacoes: '',
    },
  })

  const onSubmit = async (values: IniciarFormValues) => {
    try {
      const inventario = await inventariosService.iniciar({
        dataRealizacao: values.dataRealizacao,
        descricao: values.descricao || null,
        observacoes: values.observacoes || null,
      })
      setToast({ tipo: 'sucesso', mensagem: 'Inventário iniciado.' })
      setTimeout(() => navigate(`/inventarios/${inventario.id}`), 800)
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao iniciar inventário.' })
    }
  }

  return (
    <div className="p-6 max-w-lg">
      <button
        onClick={() => navigate('/inventarios')}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Inventários
      </button>

      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Novo Inventário</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Data de Realização <span className="text-red-500">*</span>
            </label>
            <input type="date" className={inputClass} {...register('dataRealizacao')} />
            {errors.dataRealizacao && (
              <p className="mt-1 text-xs text-red-600">{errors.dataRealizacao.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Inventário mensal de janeiro"
              maxLength={200}
              className={inputClass}
              {...register('descricao')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Observações</label>
            <textarea
              rows={3}
              placeholder="Observações gerais..."
              className={`${inputClass} resize-none`}
              {...register('observacoes')}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/inventarios')}
            className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Iniciando...' : 'Iniciar Inventário'}
          </button>
        </div>
      </form>

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
