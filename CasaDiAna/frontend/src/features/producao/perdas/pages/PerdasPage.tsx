import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { perdasService } from '../services/perdasService'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { Toast } from '@/components/ui/Toast'
import { CampoTexto } from '@/components/form/CampoTexto'
import { SelectCampo } from '@/components/form/SelectCampo'
import { FormTextarea } from '@/components/form/FormTextarea'
import { Spinner } from '@/components/form/Spinner'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterBar, FilterBarActions } from '@/components/ui/FilterBar'
import { FiltroPeriodo, gerarChipsPeriodo } from '@/components/ui/FiltroPeriodo'
import type { PerdaProduto } from '@/types/producao'
import type { ProdutoResumo } from '@/types/producao'
import { ConfirmacaoPerdasModal, type DadosConfirmacaoPerdas } from '../components/ConfirmacaoPerdasModal'

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
  const [confirma, setConfirma] = useState<DadosConfirmacaoPerdas | null>(null)

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

  const handleFiltrar = (e?: React.FormEvent) => {
    e?.preventDefault()
    carregar(de, ate)
  }

  const onSubmitPerda = async (values: PerdaFormValues) => {
    try {
      await perdasService.registrar({
        produtoId: values.produtoId,
        data: values.data,
        quantidade: Number(values.quantidade),
        justificativa: values.justificativa.trim(),
      })
      const produtoNome = produtos.find(p => p.id === values.produtoId)?.nome ?? '—'
      setModalAberto(false)
      resetForm({ produtoId: '', data: hoje(), quantidade: '', justificativa: '' })
      carregar(de, ate)
      setConfirma({
        produtoNome,
        quantidade: Number(values.quantidade),
        motivo: values.justificativa.trim(),
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      })
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
      <FilterBar onSubmit={handleFiltrar} ariaLabel="Filtrar perdas">
        <FiltroPeriodo de={de} onChangeDe={setDe} ate={ate} onChangeAte={setAte} idDe="perdas-de" idAte="perdas-ate" />
        <FilterBarActions
          loading={loading}
          chips={[
            ...gerarChipsPeriodo(de, ate, () => setDe(''), () => setAte('')),
          ]}
        />
        {perdas.length > 0 && (
          <span className="ml-auto text-sm" style={{ color: 'var(--ada-muted)' }}>
            {perdas.length} registro(s) — total de{' '}
            <span className="font-semibold" style={{ color: 'var(--ada-error-text)' }}>
              {totalPerdas.toFixed(0)} un.
            </span>
          </span>
        )}
      </FilterBar>

      {/* ── Estados ────────────────────────────────────────────────────── */}
      {loading && <LoadingState mensagem="Carregando registros…" />}
      {!loading && erro && (
        <div className="state-error" role="alert">{erro}</div>
      )}
      {!loading && !erro && perdas.length === 0 && (
        <div className="ada-surface-card">
          <EmptyState
            icon={<ExclamationTriangleIcon className="w-7 h-7" />}
            iconColor="red"
            titulo="Nenhuma perda no período"
            descricao="Ajuste o período ou registre uma nova perda."
          />
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
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-perda-titulo"
          onClick={e => { if (e.target === e.currentTarget && !isSubmitting) setModalAberto(false) }}
        >
          <div className="modal-card max-w-md">
            <div className="modal-header">
              <div>
                <h2
                  id="modal-perda-titulo"
                  className="text-[15px] font-semibold"
                  style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
                >
                  Registrar Perda
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--ada-muted)' }}>
                  Produtos perdidos, descartados ou danificados.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmitPerda)}>
            <div className="px-6 py-5 space-y-4">
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

            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                disabled={isSubmitting}
                className="btn-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary disabled:opacity-60"
              >
                {isSubmitting && <Spinner />}
                {isSubmitting ? 'Salvando…' : 'Registrar Perda'}
              </button>
            </div>
            </form>
          </div>
        </div>
      )}

      {confirma && (
        <ConfirmacaoPerdasModal
          aberto
          dados={confirma}
          onFechar={() => setConfirma(null)}
          onVerPerdas={() => setConfirma(null)}
        />
      )}

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
