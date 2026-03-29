import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { entradasService } from '../services/entradasService'
import { useAuthStore } from '@/store/authStore'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { EntradaMercadoria } from '@/types/estoque'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function EntradaDetalhePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { temPapel } = useAuthStore()

  const [entrada, setEntrada] = useState<EntradaMercadoria | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const podeCancelar = temPapel(...PAPEIS_EDICAO)

  useEffect(() => {
    if (!id) return
    entradasService.obterPorId(id)
      .then(setEntrada)
      .catch(() => setErro('Erro ao carregar entrada.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleCancelar = async () => {
    if (!id) return
    setCancelando(true)
    try {
      const atualizada = await entradasService.cancelar(id)
      setEntrada(atualizada)
      setConfirmando(false)
      setToast({ tipo: 'sucesso', mensagem: 'Entrada cancelada com sucesso.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao cancelar entrada.' })
    } finally {
      setCancelando(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
      </div>
    )
  }

  if (erro || !entrada) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {erro ?? 'Entrada não encontrada.'}
        </div>
      </div>
    )
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

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">{entrada.fornecedorNome}</h1>
          <p className="text-stone-500 text-sm mt-1">
            {formatarData(entrada.dataEntrada)}
            {entrada.numeroNotaFiscal && ` · NF ${entrada.numeroNotaFiscal}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
            entrada.status === 'Confirmada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {entrada.status}
          </span>
          {podeCancelar && entrada.status === 'Confirmada' && (
            <button
              onClick={() => setConfirmando(true)}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600
                         hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
            >
              <XCircleIcon className="h-4 w-4" />
              Cancelar Entrada
            </button>
          )}
        </div>
      </div>

      {entrada.observacoes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-stone-700 mb-4">
          {entrada.observacoes}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Ingrediente</th>
              <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Qtd.</th>
              <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Custo Unit.</th>
              <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {entrada.itens.map(item => (
              <tr key={item.id} className="border-b border-stone-100">
                <td className="px-4 py-3 text-sm text-stone-800">
                  {item.ingredienteNome}
                  <span className="text-stone-400 ml-1">({item.unidadeMedidaCodigo})</span>
                </td>
                <td className="px-4 py-3 text-sm text-stone-600 text-right">{item.quantidade}</td>
                <td className="px-4 py-3 text-sm text-stone-600 text-right">{formatarMoeda(item.custoUnitario)}</td>
                <td className="px-4 py-3 text-sm font-medium text-stone-800 text-right">{formatarMoeda(item.custoTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-stone-200">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-stone-700 text-right">Total</td>
              <td className="px-4 py-3 text-sm font-bold text-stone-900 text-right">{formatarMoeda(entrada.custoTotal)}</td>
            </tr>
          </tfoot>
        </table>
        </div>
      </div>

      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmando(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-stone-800 mb-2">Cancelar esta entrada?</h2>
            <p className="text-sm text-stone-500 mb-5">
              O estoque dos ingredientes será revertido. Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmando(false)} className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium">Voltar</button>
              <button onClick={handleCancelar} disabled={cancelando} className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {cancelando ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
