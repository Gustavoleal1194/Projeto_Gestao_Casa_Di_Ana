import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon, PlusIcon } from '@heroicons/react/24/outline'
import { inventariosService } from '../services/inventariosService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { useAuthStore } from '@/store/authStore'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { Inventario, IngredienteResumo } from '@/types/estoque'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

interface ItemFormValues {
  ingredienteId: string
  quantidadeContada: string
  observacoes: string
}

const itemSchema = z.object({
  ingredienteId: z.string().min(1, 'Selecione um ingrediente.'),
  quantidadeContada: z.string().min(1).refine(v => Number(v) >= 0, 'Quantidade deve ser ≥ 0.'),
  observacoes: z.string(),
})

function badgeStatus(status: string) {
  if (status === 'EmAndamento') return 'bg-amber-100 text-amber-700'
  if (status === 'Finalizado') return 'bg-green-100 text-green-700'
  if (status === 'Cancelado') return 'bg-red-100 text-red-700'
  return 'bg-stone-100 text-stone-500'
}

function labelStatus(status: string) {
  if (status === 'EmAndamento') return 'Em Andamento'
  return status
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

const inputClass =
  'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

const selectClass =
  'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

export function InventarioDetalhePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { temPapel } = useAuthStore()

  const [inventario, setInventario] = useState<Inventario | null>(null)
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [confirmandoFinalizar, setConfirmandoFinalizar] = useState(false)
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false)
  const [processando, setProcessando] = useState(false)

  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const podeEditar = temPapel(...PAPEIS_EDICAO)
  const emAndamento = inventario?.status === 'EmAndamento'

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { ingredienteId: '', quantidadeContada: '', observacoes: '' },
  })

  useEffect(() => {
    if (!id) return
    Promise.all([inventariosService.obterPorId(id), ingredientesService.listar()])
      .then(([inv, ings]) => { setInventario(inv); setIngredientes(ings) })
      .catch(() => setErro('Erro ao carregar inventário.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleAdicionarItem = async (values: ItemFormValues) => {
    if (!id) return
    try {
      const atualizado = await inventariosService.adicionarItem(id, {
        ingredienteId: values.ingredienteId,
        quantidadeContada: Number(values.quantidadeContada),
        observacoes: values.observacoes || null,
      })
      setInventario(atualizado)
      reset({ ingredienteId: '', quantidadeContada: '', observacoes: '' })
      setToast({ tipo: 'sucesso', mensagem: 'Item adicionado.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao adicionar item.' })
    }
  }

  const handleFinalizar = async () => {
    if (!id) return
    setProcessando(true)
    try {
      const atualizado = await inventariosService.finalizar(id)
      setInventario(atualizado)
      setConfirmandoFinalizar(false)
      setToast({ tipo: 'sucesso', mensagem: 'Inventário finalizado com sucesso.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao finalizar inventário.' })
    } finally {
      setProcessando(false)
    }
  }

  const handleCancelar = async () => {
    if (!id) return
    setProcessando(true)
    try {
      const atualizado = await inventariosService.cancelar(id)
      setInventario(atualizado)
      setConfirmandoCancelar(false)
      setToast({ tipo: 'sucesso', mensagem: 'Inventário cancelado.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao cancelar inventário.' })
    } finally {
      setProcessando(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
      </div>
    )
  }

  if (erro || !inventario) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {erro ?? 'Inventário não encontrado.'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl">
      <button
        onClick={() => navigate('/inventarios')}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Inventários
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">
            {inventario.descricao ?? `Inventário de ${formatarData(inventario.dataRealizacao)}`}
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {formatarData(inventario.dataRealizacao)}
            {inventario.finalizadoEm && ` · Finalizado em ${formatarData(inventario.finalizadoEm)}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${badgeStatus(inventario.status)}`}>
            {labelStatus(inventario.status)}
          </span>
          {podeEditar && emAndamento && (
            <>
              <button
                onClick={() => setConfirmandoCancelar(true)}
                className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setConfirmandoFinalizar(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Finalizar
              </button>
            </>
          )}
        </div>
      </div>

      {podeEditar && emAndamento && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 mb-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">Adicionar Item</p>
          <form onSubmit={handleSubmit(handleAdicionarItem)}>
            <div className="grid grid-cols-[1fr_120px_180px_auto] gap-3 items-start">
              <div>
                <select className={selectClass} {...register('ingredienteId')}>
                  <option value="">Selecione o ingrediente...</option>
                  {ingredientes.map(ing => (
                    <option key={ing.id} value={ing.id}>
                      {ing.nome} ({ing.unidadeMedidaCodigo})
                    </option>
                  ))}
                </select>
                {errors.ingredienteId && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.ingredienteId.message}</p>
                )}
              </div>
              <div>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="Qtd. contada"
                  className={inputClass}
                  {...register('quantidadeContada')}
                />
                {errors.quantidadeContada && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.quantidadeContada.message}</p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Observação (opcional)"
                  className={inputClass}
                  {...register('observacoes')}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white
                           rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap"
              >
                <PlusIcon className="h-4 w-4" />
                {isSubmitting ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {inventario.itens.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-stone-500 text-sm">Nenhum item lançado ainda.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Ingrediente</th>
                <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Sistema</th>
                <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Contado</th>
                <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Diferença</th>
                <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {inventario.itens.map(item => (
                <tr key={item.id} className="border-b border-stone-100">
                  <td className="px-4 py-3 text-sm text-stone-800">
                    {item.ingredienteNome}
                    <span className="text-stone-400 ml-1">({item.unidadeMedidaCodigo})</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-600 text-right">{item.quantidadeSistema}</td>
                  <td className="px-4 py-3 text-sm text-stone-800 font-medium text-right">{item.quantidadeContada}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-medium ${
                      item.diferenca < 0 ? 'text-red-600' : item.diferenca > 0 ? 'text-green-600' : 'text-stone-500'
                    }`}>
                      {item.diferenca > 0 ? '+' : ''}{item.diferenca}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-500">{item.observacoes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirmandoFinalizar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmandoFinalizar(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-stone-800 mb-2">Finalizar inventário?</h2>
            <p className="text-sm text-stone-500 mb-5">O estoque será ajustado conforme as diferenças. Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmandoFinalizar(false)} className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium">Voltar</button>
              <button onClick={handleFinalizar} disabled={processando} className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {processando ? 'Finalizando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmandoCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmandoCancelar(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-stone-800 mb-2">Cancelar inventário?</h2>
            <p className="text-sm text-stone-500 mb-5">Nenhum ajuste de estoque será feito.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmandoCancelar(false)} className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium">Voltar</button>
              <button onClick={handleCancelar} disabled={processando} className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {processando ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
