import { useEffect, useState } from 'react'
import { ArrowDownTrayIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import { relatoriosService } from '../services/relatoriosService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { gerarPdfMovimentacoes } from '@/lib/pdf'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterBar, FilterBarActions } from '@/components/ui/FilterBar'
import { FiltroPeriodo, gerarChipsPeriodo } from '@/components/ui/FiltroPeriodo'
import type { MovimentacaoRelatorio, IngredienteResumo } from '@/types/estoque'

const TIPOS: { valor: string; rotulo: string }[] = [
  { valor: '',               rotulo: 'Todos' },
  { valor: 'Entrada',        rotulo: 'Entrada' },
  { valor: 'AjustePositivo', rotulo: 'Ajuste Positivo' },
  { valor: 'AjusteNegativo', rotulo: 'Ajuste Negativo' },
  { valor: 'SaidaProducao',  rotulo: 'Saída — Produção' },
]

const TIPO_LABEL: Record<string, string> = {
  Entrada:        'Entrada',
  AjustePositivo: 'Ajuste Positivo',
  AjusteNegativo: 'Ajuste Negativo',
  SaidaProducao:  'Saída — Produção',
}

function hoje(): string { return new Date().toISOString().split('T')[0] }
function ha30Dias(): string {
  const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]
}

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function MovimentacoesPage() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoRelatorio[]>([])
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(ha30Dias)
  const [ate, setAte] = useState(hoje)
  const [tipo, setTipo] = useState('')
  const [ingredienteId, setIngredienteId] = useState('')

  useEffect(() => {
    ingredientesService.listar().then(setIngredientes).catch(() => {})
    carregar()
  }, [])

  const carregar = async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await relatoriosService.movimentacoes(de, ate, tipo || undefined, ingredienteId || undefined)
      setMovimentacoes(data)
    } catch {
      setErro('Erro ao carregar movimentações.')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrar = (e?: React.FormEvent) => { e?.preventDefault(); carregar() }

  return (
    <div className="ada-page">
      <PageHeader
        titulo="Movimentações de Estoque"
        breadcrumb={['Relatórios', 'Movimentações']}
        subtitulo={loading ? 'Carregando…' : `${movimentacoes.length} movimentação(ões) no período`}
        actions={movimentacoes.length > 0 ? (
          <button onClick={() => gerarPdfMovimentacoes(movimentacoes, de, ate)} className="btn-secondary">
            <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
            Baixar PDF
          </button>
        ) : undefined}
      />

      <FilterBar onSubmit={handleFiltrar} ariaLabel="Filtrar movimentações">
        <FiltroPeriodo de={de} onChangeDe={setDe} ate={ate} onChangeAte={setAte} />
        <div>
          <label className="filter-label">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="filter-input">
            {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
          </select>
        </div>
        <div>
          <label className="filter-label">Ingrediente</label>
          <select value={ingredienteId} onChange={e => setIngredienteId(e.target.value)} className="filter-input">
            <option value="">Todos</option>
            {ingredientes.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </select>
        </div>
        <FilterBarActions
          loading={loading}
          chips={[
            ...gerarChipsPeriodo(de, ate, () => setDe(''), () => setAte('')),
            ...(tipo ? [{ label: `Tipo: ${TIPOS.find(t => t.valor === tipo)?.rotulo ?? tipo}`, onRemove: () => setTipo('') }] : []),
            ...(ingredienteId ? [{ label: `Ingrediente: ${ingredientes.find(i => i.id === ingredienteId)?.nome ?? ingredienteId}`, onRemove: () => setIngredienteId('') }] : []),
          ]}
        />
      </FilterBar>

      {loading && <LoadingState mensagem="Carregando movimentações…" />}
      {!loading && erro && <div className="state-error" role="alert">{erro}</div>}
      {!loading && !erro && movimentacoes.length === 0 && (
        <div className="ada-surface-card">
          <EmptyState
            icon={<ArrowsRightLeftIcon className="w-7 h-7" />}
            iconColor="neutral"
            titulo="Nenhuma movimentação no período"
            descricao="Ajuste os filtros e tente novamente."
          />
        </div>
      )}
      {!loading && !erro && movimentacoes.length > 0 && (
        <div className="ada-surface-card">
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead>
                <tr className="table-head-row">
                  <th className="table-th" scope="col">Data/Hora</th>
                  <th className="table-th" scope="col">Ingrediente</th>
                  <th className="table-th" scope="col">Tipo</th>
                  <th className="table-th table-th-right" scope="col">Quantidade</th>
                  <th className="table-th table-th-right" scope="col">Saldo Após</th>
                  <th className="table-th" scope="col">Referência</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.map(m => (
                  <tr key={m.id} className="table-row">
                    <td className="table-td whitespace-nowrap">
                      <span className="text-xs tabular-nums" style={{ color: 'var(--ada-muted)' }}>
                        {formatarDataHora(m.criadoEm)}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2.5">
                        <span className="accent-bar shrink-0" aria-hidden="true" />
                        <span className="text-sm" style={{ color: 'var(--ada-heading)' }}>{m.ingredienteNome}</span>
                        <span className="text-xs" style={{ color: 'var(--ada-placeholder)' }}>({m.unidadeMedidaCodigo})</span>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{TIPO_LABEL[m.tipo] ?? m.tipo}</span>
                    </td>
                    <td className="table-td" style={{ textAlign: 'right' }}>
                      <span
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: m.tipo.includes('Saida') || m.tipo.includes('Negativo') ? 'var(--ada-error-text)' : 'var(--ada-success-text)' }}
                      >
                        {m.tipo.includes('Saida') || m.tipo.includes('Negativo') ? '-' : '+'}{m.quantidade}
                      </span>
                    </td>
                    <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                      <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{m.saldoApos}</span>
                    </td>
                    <td className="table-td" style={{ maxWidth: '140px' }}>
                      <span
                        className="text-xs cell-truncate block"
                        style={{ color: 'var(--ada-muted)' }}
                        title={m.referenciaTipo ?? ''}
                      >
                        {m.referenciaTipo ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
