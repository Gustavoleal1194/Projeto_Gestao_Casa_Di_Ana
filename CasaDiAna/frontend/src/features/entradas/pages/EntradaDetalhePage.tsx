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
      <div className="ada-page">
        <div className="state-loading py-32">
          <div
            className="inline-block h-9 w-9 animate-spin rounded-full mb-4"
            style={{ border: '3px solid var(--ada-border-sub)', borderTopColor: '#C4870A' }}
            role="status" aria-label="Carregando…"
          />
          <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Carregando entrada…</p>
        </div>
      </div>
    )
  }

  if (erro || !entrada) {
    return (
      <div className="ada-page">
        <div className="state-error" role="alert">{erro ?? 'Entrada não encontrada.'}</div>
      </div>
    )
  }

  return (
    <div className="ada-page max-w-3xl">
      <button
        onClick={() => navigate('/entradas')}
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 rounded
                   transition-colors duration-150 outline-none
                   focus-visible:ring-2 focus-visible:ring-[#C4870A]/40
                   hover:text-[#C4870A]"
        style={{ color: 'var(--ada-muted)' }}
      >
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        Entradas
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            {entrada.fornecedorNome}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ada-muted)' }}>
            {formatarData(entrada.dataEntrada)}
            {entrada.numeroNotaFiscal && (
              <span className="font-mono ml-1">· NF {entrada.numeroNotaFiscal}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`badge ${entrada.status === 'Confirmada' ? 'badge-active' : 'badge-danger'}`}>
            {entrada.status}
          </span>
          {podeCancelar && entrada.status === 'Confirmada' && (
            <button
              onClick={() => setConfirmando(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
              style={{
                border: '1px solid var(--ada-error-border)',
                color: 'var(--ada-error-text)',
                background: 'var(--ada-error-bg)',
              }}
            >
              <XCircleIcon className="h-4 w-4" />
              Cancelar Entrada
            </button>
          )}
        </div>
      </div>

      {entrada.observacoes && (
        <div
          className="rounded-xl px-4 py-3 text-sm mb-4"
          style={{ background: 'var(--ada-warning-badge)', border: '1px solid var(--ada-warning-border)', color: 'var(--ada-body)' }}
        >
          {entrada.observacoes}
        </div>
      )}

      <div className="ada-surface-card mb-4">
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="table-head-row">
                <th className="table-th" scope="col">Ingrediente</th>
                <th className="table-th table-th-right" scope="col">Qtd.</th>
                <th className="table-th table-th-right" scope="col">Custo Unit.</th>
                <th className="table-th table-th-right" scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {entrada.itens.map(item => (
                <tr key={item.id} className="table-row">
                  <td className="table-td">
                    <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>{item.ingredienteNome}</span>
                    <span className="text-xs ml-1" style={{ color: 'var(--ada-placeholder)' }}>({item.unidadeMedidaCodigo})</span>
                  </td>
                  <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                    <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{item.quantidade}</span>
                  </td>
                  <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                    <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{formatarMoeda(item.custoUnitario)}</span>
                  </td>
                  <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                    <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>{formatarMoeda(item.custoTotal)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '1px solid var(--ada-border)' }}>
                <td
                  colSpan={3}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ textAlign: 'right', color: 'var(--ada-muted)' }}
                >
                  Total
                </td>
                <td
                  className="px-4 py-3 text-sm font-bold tabular-nums"
                  style={{ textAlign: 'right', color: 'var(--ada-heading)' }}
                >
                  {formatarMoeda(entrada.custoTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(13,17,23,0.55)', backdropFilter: 'blur(4px)' }}>
          <div
            className="w-full max-w-sm mx-4 rounded-2xl p-6"
            style={{ background: 'var(--ada-surface)', boxShadow: 'var(--shadow-xl)' }}
          >
            <h2 className="text-base font-bold mb-1" style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}>
              Cancelar esta entrada?
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--ada-muted)' }}>
              O estoque dos ingredientes será revertido. Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2.5 pt-4" style={{ borderTop: '1px solid var(--ada-border-sub)' }}>
              <button
                onClick={() => setConfirmando(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-[var(--ada-bg)]"
                style={{ border: '1px solid var(--ada-border)', color: 'var(--ada-body)', background: 'var(--ada-surface)' }}
              >
                Voltar
              </button>
              <button
                onClick={handleCancelar}
                disabled={cancelando}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-all duration-150"
                style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', boxShadow: '0 3px 10px rgba(220,38,38,0.28)' }}
              >
                {cancelando ? 'Cancelando…' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
