import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { perdasService } from '../services/perdasService'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { SelectCampo } from '@/features/estoque/ingredientes/components/SelectCampo'
import { FormTextarea } from '@/components/form/FormTextarea'
import { Spinner } from '@/components/form/Spinner'
import { PageHeader } from '@/components/ui/PageHeader'
import type { PerdaProduto } from '@/types/producao'
import type { ProdutoResumo } from '@/types/producao'

const perdaSchema = z.object({
  produtoId: z.string().min(1, 'Produto obrigatório.'),
  data: z.string().min(1, 'Data obrigatória.'),
  quantidade: z
    .string()
    .min(1, 'Quantidade obrigatória.')
    .refine(v => Number(v) > 0, 'Deve ser maior que zero.'),
  justificativa: z
    .string()
    .min(1, 'Justificativa obrigatória.')
    .max(500, 'Máximo 500 caracteres.'),
})

type PerdaFormValues = z.infer<typeof perdaSchema>

function hoje() {
  return new Date().toISOString().split('T')[0]
}

function primeiroDoMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}


export function PerdasPage() {
  const [perdas, setPerdas] = useState<PerdaProduto[]>([])
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [de, setDe] = useState(primeiroDoMes())
  const [ate, setAte] = useState(hoje())

  const { register, handleSubmit, reset: resetForm, formState: { errors: formErrors, isSubmitting } } =
    useForm<PerdaFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(perdaSchema) as any,
      defaultValues: { produtoId: '', data: hoje(), quantidade: '', justificativa: '' },
    })

  const carregar = useCallback(async (filtroDe: string, filtroAte: string) => {
    setLoading(true)
    setErro(null)
    try {
      const data = await perdasService.listar(filtroDe, filtroAte)
      setPerdas(data)
    } catch {
      setErro('Erro ao carregar registros de perda.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    produtosService.listar().then(setProdutos).catch(() => {})
    carregar(primeiroDoMes(), hoje())
  }, [carregar])

  const handleFiltrar = () => carregar(de, ate)

  const onSubmitPerda = async (values: PerdaFormValues) => {
    try {
      await perdasService.registrar({
        produtoId: values.produtoId,
        data: values.data,
        quantidade: Number(values.quantidade),
        justificativa: values.justificativa.trim(),
      })
      setToast({ tipo: 'sucesso', mensagem: 'Perda registrada com sucesso.' })
      setModalAberto(false)
      resetForm({ produtoId: '', data: hoje(), quantidade: '', justificativa: '' })
      carregar(de, ate)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erros?: string[] } } })?.response?.data?.erros?.[0]
        ?? 'Erro ao registrar perda.'
      setToast({ tipo: 'erro', mensagem: msg })
    }
  }

  const totalPerdas = perdas.reduce((a, p) => a + p.quantidade, 0)

  return (
    <div className="ada-page">

      <PageHeader
        titulo="Registro de Perdas"
        breadcrumb={['Produção', 'Perdas']}
        subtitulo={loading ? 'Carregando…' : `${perdas.length} registro${perdas.length !== 1 ? 's' : ''} no período`}
        actions={
          <button
            onClick={() => { resetForm({ produtoId: '', data: hoje(), quantidade: '', justificativa: '' }); setModalAberto(true) }}
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Registrar Perda
          </button>
        }
      />

      {/* ── Filtros ─────────────────────────────────────────────────────── */}
      <div className="filter-bar" role="search" aria-label="Filtrar perdas">
        <div>
          <label htmlFor="perdas-de" className="filter-label">De</label>
          <input id="perdas-de" type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label htmlFor="perdas-ate" className="filter-label">Até</label>
          <input id="perdas-ate" type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <button type="button" onClick={handleFiltrar} className="btn-secondary">
          Filtrar
        </button>
        {perdas.length > 0 && (
          <span className="ml-auto text-sm" style={{ color: 'var(--ada-muted)' }}>
            {perdas.length} registro(s) — total de{' '}
            <span className="font-semibold" style={{ color: 'var(--ada-error-text)' }}>
              {totalPerdas.toFixed(0)} un.
            </span>
          </span>
        )}
      </div>

      {/* ── Estados ────────────────────────────────────────────────────── */}
      {loading && (
        <div className="state-loading">
          <div
            className="inline-block h-9 w-9 animate-spin rounded-full mb-4"
            style={{ border: '3px solid var(--ada-border-sub)', borderTopColor: '#C4870A' }}
            role="status"
            aria-label="Carregando…"
          />
          <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Carregando registros…</p>
        </div>
      )}
      {!loading && erro && (
        <div className="state-error" role="alert">{erro}</div>
      )}
      {!loading && !erro && perdas.length === 0 && (
        <div className="state-loading">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--ada-bg)', border: '1px solid var(--ada-border)' }}
            aria-hidden="true"
          >
            <ExclamationTriangleIcon className="h-6 w-6" style={{ color: 'var(--ada-placeholder)' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}>
            Nenhuma perda registrada no período
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>
            Ajuste o período ou registre uma nova perda.
          </p>
        </div>
      )}
      {!loading && !erro && perdas.length > 0 && (
        <div className="ada-surface-card">
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead>
                <tr className="table-head-row">
                  <th className="table-th" scope="col">Data</th>
                  <th className="table-th" scope="col">Produto</th>
                  <th className="table-th table-th-right" scope="col">Quantidade</th>
                  <th className="table-th" scope="col">Justificativa</th>
                </tr>
              </thead>
              <tbody>
                {perdas.map(p => (
                  <tr key={p.id} className="table-row">
                    <td className="table-td">
                      <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
                        {new Date(p.data).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="table-td">
                      <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                        {p.produtoNome}
                      </span>
                    </td>
                    <td className="table-td" style={{ textAlign: 'right' }}>
                      <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--ada-error-text)' }}>
                        {p.quantidade.toFixed(0)} un.
                      </span>
                    </td>
                    <td className="table-td" style={{ maxWidth: '280px' }}>
                      <span className="text-sm truncate block" style={{ color: 'var(--ada-muted-dim)' }} title={p.justificativa}>
                        {p.justificativa}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="w-full max-w-md mx-4 rounded-2xl p-6"
            style={{ background: 'var(--ada-surface)', boxShadow: 'var(--shadow-xl)' }}
          >
            <h2
              className="text-base font-bold mb-1"
              style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Registrar Perda
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--ada-muted)' }}>
              Registre produtos perdidos, descartados ou danificados.
            </p>

            <form onSubmit={handleSubmit(onSubmitPerda)} className="space-y-4">
              <SelectCampo
                label="Produto"
                obrigatorio
                opcoes={produtos.filter(p => p.ativo).map(p => ({ valor: p.id, rotulo: p.nome }))}
                {...register('produtoId')}
                erro={formErrors.produtoId?.message}
              />
              <div className="grid grid-cols-2 gap-3">
                <CampoTexto
                  label="Data"
                  obrigatorio
                  type="date"
                  {...register('data')}
                  erro={formErrors.data?.message}
                />
                <CampoTexto
                  label="Quantidade (un.)"
                  obrigatorio
                  type="number"
                  step="1"
                  min="1"
                  placeholder="0"
                  {...register('quantidade')}
                  erro={formErrors.quantidade?.message}
                />
              </div>
              <FormTextarea
                label="Justificativa"
                obrigatorio
                placeholder="Descreva o motivo da perda..."
                rows={3}
                maxLength={500}
                {...register('justificativa')}
                erro={formErrors.justificativa?.message}
              />

              <div
                className="flex justify-end gap-2.5 pt-4"
                style={{ borderTop: '1px solid var(--ada-border-sub)' }}
              >
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-50 hover:bg-[var(--ada-bg)]"
                  style={{ border: '1px solid var(--ada-border)', color: 'var(--ada-body)', background: 'var(--ada-surface)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)', boxShadow: '0 3px 10px rgba(196,135,10,0.28)' }}
                >
                  {isSubmitting && <Spinner />}
                  {isSubmitting ? 'Salvando…' : 'Registrar Perda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
