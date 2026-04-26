import { useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { relatoriosService } from '../services/relatoriosService'
import { gerarPdfEntradas } from '@/lib/pdf'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { FilterBar, FilterBarActions } from '@/components/ui/FilterBar'
import type { EntradaRelatorioResumo } from '@/types/estoque'

function hoje(): string { return new Date().toISOString().split('T')[0] }
function primeiroDiaMes(): string {
  const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function EntradasRelatorioPage() {
  const [resumo, setResumo] = useState<EntradaRelatorioResumo | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(primeiroDiaMes)
  const [ate, setAte] = useState(hoje)

  const carregar = async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await relatoriosService.entradas(de, ate)
      setResumo(data)
    } catch {
      setErro('Erro ao carregar relatório de entradas.')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrar = (e: React.FormEvent) => { e.preventDefault(); carregar() }

  return (
    <div className="ada-page">
      <PageHeader
        titulo="Relatório de Entradas"
        breadcrumb={['Relatórios', 'Entradas']}
        subtitulo="Entradas de mercadoria por período"
        actions={resumo && resumo.entradas.length > 0 ? (
          <button onClick={() => gerarPdfEntradas(resumo!, de, ate)} className="btn-secondary">
            <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
            Baixar PDF
          </button>
        ) : undefined}
      />

      <FilterBar onSubmit={handleFiltrar} ariaLabel="Filtrar entradas">
        <div>
          <label className="filter-label">De</label>
          <input type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label className="filter-label">Até</label>
          <input type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <FilterBarActions
          submitLabel="Gerar Relatório"
          loading={loading}
          chips={[
            ...(de ? [{ label: `De: ${de.split('-').reverse().join('/')}`, onRemove: () => setDe('') }] : []),
            ...(ate ? [{ label: `Até: ${ate.split('-').reverse().join('/')}`, onRemove: () => setAte('') }] : []),
          ]}
        />
      </FilterBar>

      {loading && <LoadingState mensagem="Carregando relatório…" />}
      {!loading && erro && <div className="state-error" role="alert">{erro}</div>}
      {!loading && resumo && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="ada-surface-card p-5">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.10em] mb-1"
                style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
              >
                Total de Entradas
              </p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ada-heading)' }}>
                {resumo.totalEntradas}
              </p>
            </div>
            <div className="ada-surface-card p-5">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.10em] mb-1"
                style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
              >
                Confirmadas
              </p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ada-success-text)' }}>
                {resumo.totalEntradasConfirmadas}
              </p>
            </div>
            <div className="ada-surface-card p-5">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.10em] mb-1"
                style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
              >
                Custo Total (Confirmadas)
              </p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ada-heading)' }}>
                {formatarMoeda(resumo.custoTotalConfirmadas)}
              </p>
            </div>
          </div>

          {resumo.entradas.length === 0 ? (
            <div className="state-loading">
              <p className="text-sm font-semibold" style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Nenhuma entrada no período
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>Ajuste o período e gere o relatório novamente.</p>
            </div>
          ) : (
            <div className="ada-surface-card">
              <div className="overflow-x-auto">
                <table className="w-full" role="table">
                  <thead>
                    <tr className="table-head-row">
                      <th className="table-th" scope="col">Fornecedor</th>
                      <th className="table-th" scope="col">Nota Fiscal</th>
                      <th className="table-th" scope="col">Data</th>
                      <th className="table-th" scope="col">Status</th>
                      <th className="table-th table-th-right" scope="col">Itens</th>
                      <th className="table-th table-th-right" scope="col">Custo Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumo.entradas.map(e => (
                      <tr key={e.id} className="table-row">
                        <td className="table-td">
                          <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>{e.fornecedorNome}</span>
                        </td>
                        <td className="table-td font-mono">
                          <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{e.numeroNotaFiscal ?? '—'}</span>
                        </td>
                        <td className="table-td">
                          <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{formatarData(e.dataEntrada)}</span>
                        </td>
                        <td className="table-td">
                          <span className={`badge ${e.status === 'Confirmada' ? 'badge-active' : 'badge-danger'}`}>
                            {e.status}
                          </span>
                        </td>
                        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                          <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{e.totalItens}</span>
                        </td>
                        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                          <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                            {formatarMoeda(e.custoTotal)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
