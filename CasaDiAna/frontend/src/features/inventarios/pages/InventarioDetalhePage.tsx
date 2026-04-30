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
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { SelectCampo } from '@/features/estoque/ingredientes/components/SelectCampo'
import { LoadingState } from '@/components/ui/LoadingState'
import type { Inventario, IngredienteResumo } from '@/types/estoque'
import { ConfirmacaoFinalizacaoInventarioModal, type DadosConfirmacaoFinalizacaoInventario } from '../components/ConfirmacaoFinalizacaoInventarioModal'

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

function getBadgeClass(status: string) {
  if (status === 'EmAndamento') return 'badge badge-warning'
  if (status === 'Finalizado') return 'badge badge-active'
  if (status === 'Cancelado') return 'badge badge-danger'
  return 'badge badge-inactive'
}

function labelStatus(status: string) {
  if (status === 'EmAndamento') return 'Em Andamento'
  return status
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}


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
  const [confirmaFinalizado, setConfirmaFinalizado] = useState<DadosConfirmacaoFinalizacaoInventario | null>(null)

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
      setConfirmaFinalizado({
        totalItens: atualizado.itens.length,
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      })
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
      <div className="ada-page">
        <LoadingState mensagem="Carregando inventário…" />
      </div>
    )
  }

  if (erro || !inventario) {
    return (
      <div className="ada-page">
        <div className="state-error" role="alert">{erro ?? 'Inventário não encontrado.'}</div>
      </div>
    )
  }

  return (
    <div className="ada-page max-w-4xl">
      {confirmaFinalizado && (
        <ConfirmacaoFinalizacaoInventarioModal
          aberto
          dados={confirmaFinalizado}
          onFechar={() => setConfirmaFinalizado(null)}
        />
      )}
      <button onClick={() => navigate('/inventarios')} className="back-link">
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        Inventários
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            {inventario.descricao ?? `Inventário de ${formatarData(inventario.dataRealizacao)}`}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ada-muted)' }}>
            {formatarData(inventario.dataRealizacao)}
            {inventario.finalizadoEm && ` · Finalizado em ${formatarData(inventario.finalizadoEm)}`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={getBadgeClass(inventario.status)}>{labelStatus(inventario.status)}</span>
          {podeEditar && emAndamento && (
            <>
              <button
                onClick={() => setConfirmandoCancelar(true)}
                className="btn-secondary"
              >
                Cancelar Inventário
              </button>
              <button
                onClick={() => setConfirmandoFinalizar(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-150"
                style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', boxShadow: '0 3px 10px rgba(22,163,74,0.28)' }}
              >
                Finalizar
              </button>
            </>
          )}
        </div>
      </div>

      {podeEditar && emAndamento && (
        <div className="ada-surface-card p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-[3px] h-3.5 rounded-full shrink-0" style={{ background: '#C4870A' }} aria-hidden="true" />
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.10em]"
              style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Adicionar Item
            </span>
          </div>
          <form onSubmit={handleSubmit(handleAdicionarItem)}>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_180px_auto] gap-3 items-start">
              <SelectCampo
                label="Ingrediente"
                obrigatorio
                opcoes={ingredientes.map(ing => ({
                  valor: ing.id,
                  rotulo: `${ing.nome} (${ing.unidadeMedidaCodigo})`,
                }))}
                {...register('ingredienteId')}
                erro={errors.ingredienteId?.message}
              />
              <CampoTexto
                label="Qtd. contada"
                obrigatorio
                type="number"
                step="0.001"
                min="0"
                placeholder="0"
                {...register('quantidadeContada')}
                erro={errors.quantidadeContada?.message}
              />
              <CampoTexto
                label="Observação"
                placeholder="Opcional"
                {...register('observacoes')}
              />
              <div className="pt-[22px]">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary whitespace-nowrap"
                >
                  <PlusIcon className="h-4 w-4" />
                  {isSubmitting ? '…' : 'Adicionar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="ada-surface-card">
        {inventario.itens.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Nenhum item lançado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead>
                <tr className="table-head-row">
                  <th className="table-th" scope="col">Ingrediente</th>
                  <th className="table-th table-th-right" scope="col">Sistema</th>
                  <th className="table-th table-th-right" scope="col">Contado</th>
                  <th className="table-th table-th-right" scope="col">Diferença</th>
                  <th className="table-th" scope="col">Observação</th>
                </tr>
              </thead>
              <tbody>
                {inventario.itens.map(item => (
                  <tr key={item.id} className="table-row">
                    <td className="table-td">
                      <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>{item.ingredienteNome}</span>
                      <span className="text-xs ml-1" style={{ color: 'var(--ada-placeholder)' }}>({item.unidadeMedidaCodigo})</span>
                    </td>
                    <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                      <span className="text-sm" style={{ color: 'var(--ada-muted)' }}>{item.quantidadeSistema}</span>
                    </td>
                    <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                      <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>{item.quantidadeContada}</span>
                    </td>
                    <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color: item.diferenca < 0 ? 'var(--ada-error-text)'
                            : item.diferenca > 0 ? 'var(--ada-success-text)'
                            : 'var(--ada-muted)'
                        }}
                      >
                        {item.diferenca > 0 ? '+' : ''}{item.diferenca}
                      </span>
                    </td>
                    <td className="table-td">
                      <span className="text-sm" style={{ color: 'var(--ada-muted)' }}>{item.observacoes ?? '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmandoFinalizar && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget && !processando) setConfirmandoFinalizar(false) }}
        >
          <div className="modal-card max-w-sm">
            <div className="px-6 pt-5 pb-1">
              <h2 className="text-base font-bold mb-1" style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Finalizar inventário?
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--ada-muted)' }}>
                O estoque será ajustado conforme as diferenças. Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setConfirmandoFinalizar(false)}
                className="btn-secondary"
              >
                Voltar
              </button>
              <button
                onClick={handleFinalizar}
                disabled={processando}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-all duration-150"
                style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', boxShadow: '0 3px 10px rgba(22,163,74,0.28)' }}
              >
                {processando ? 'Finalizando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmandoCancelar && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget && !processando) setConfirmandoCancelar(false) }}
        >
          <div className="modal-card max-w-sm">
            <div className="px-6 pt-5 pb-1">
              <h2 className="text-base font-bold mb-1" style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Cancelar inventário?
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--ada-muted)' }}>
                Nenhum ajuste de estoque será feito.
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setConfirmandoCancelar(false)}
                className="btn-secondary"
              >
                Voltar
              </button>
              <button
                onClick={handleCancelar}
                disabled={processando}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-all duration-150"
                style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', boxShadow: '0 3px 10px rgba(220,38,38,0.28)' }}
              >
                {processando ? 'Cancelando…' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
