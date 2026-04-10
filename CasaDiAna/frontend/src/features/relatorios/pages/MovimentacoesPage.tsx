import { useEffect, useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { relatoriosService } from '../services/relatoriosService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { gerarPdfMovimentacoes } from '@/lib/pdf'
import type { MovimentacaoRelatorio, IngredienteResumo } from '@/types/estoque'

const TIPOS = ['', 'Entrada', 'AjustePositivo', 'AjusteNegativo', 'SaidaProducao']

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

  const handleFiltrar = (e: React.FormEvent) => { e.preventDefault(); carregar() }

  return (
    <div className="ada-page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Movimentações de Estoque
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ada-muted)' }}>
            {loading ? 'Carregando…' : `${movimentacoes.length} movimentação(ões) no período`}
          </p>
        </div>
        {movimentacoes.length > 0 && (
          <button onClick={() => gerarPdfMovimentacoes(movimentacoes, de, ate)} className="btn-secondary">
            <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
            Baixar PDF
          </button>
        )}
      </div>

      <form onSubmit={handleFiltrar} className="filter-bar" role="search" aria-label="Filtrar movimentações">
        <div>
          <label className="filter-label">De</label>
          <input type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label className="filter-label">Até</label>
          <input type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label className="filter-label">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="filter-input">
            {TIPOS.map(t => <option key={t} value={t}>{t || 'Todos'}</option>)}
          </select>
        </div>
        <div>
          <label className="filter-label">Ingrediente</label>
          <select value={ingredienteId} onChange={e => setIngredienteId(e.target.value)} className="filter-input">
            <option value="">Todos</option>
            {ingredientes.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </select>
        </div>
        <button type="submit" className="btn-secondary">Filtrar</button>
      </form>

      {loading && (
        <div className="state-loading">
          <div
            className="inline-block h-9 w-9 animate-spin rounded-full mb-4"
            style={{ border: '3px solid var(--ada-border-sub)', borderTopColor: '#C4870A' }}
            role="status" aria-label="Carregando…"
          />
          <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Carregando movimentações…</p>
        </div>
      )}
      {!loading && erro && <div className="state-error" role="alert">{erro}</div>}
      {!loading && !erro && movimentacoes.length === 0 && (
        <div className="state-loading">
          <p className="text-sm font-semibold" style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}>
            Nenhuma movimentação no período
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>Ajuste os filtros e tente novamente.</p>
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
                      <span className="text-sm" style={{ color: 'var(--ada-heading)' }}>{m.ingredienteNome}</span>
                      <span className="text-xs ml-1" style={{ color: 'var(--ada-placeholder)' }}>({m.unidadeMedidaCodigo})</span>
                    </td>
                    <td className="table-td">
                      <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{m.tipo}</span>
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
                    <td className="table-td">
                      <span className="text-xs" style={{ color: 'var(--ada-muted)' }}>{m.referenciaTipo ?? '—'}</span>
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
