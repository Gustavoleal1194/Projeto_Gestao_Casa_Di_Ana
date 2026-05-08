import { useEffect, useState, useMemo } from 'react'
import { ArrowDownTrayIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import { relatoriosService } from '../services/relatoriosService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { gerarPdfMovimentacoes } from '@/lib/pdf'
import { FiltrosMovimentacoes } from '../components/FiltrosMovimentacoes'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import type { MovimentacaoRelatorio, IngredienteResumo } from '@/types/estoque'

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
  const [busca, setBusca] = useState('')

  const carregar = async (
    filtroDe = de,
    filtroAte = ate,
    filtroTipo = tipo,
    filtroIngredienteId = ingredienteId
  ) => {
    setLoading(true)
    setErro(null)
    try {
      const data = await relatoriosService.movimentacoes(
        filtroDe, filtroAte,
        filtroTipo || undefined,
        filtroIngredienteId || undefined
      )
      setMovimentacoes(data)
    } catch {
      setErro('Erro ao carregar movimentações.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ingredientesService.listar().then(setIngredientes).catch(() => {})
    carregar()
  }, [])

  const handleDeChange = (v: string) => { setDe(v); carregar(v, ate, tipo, ingredienteId) }
  const handleAteChange = (v: string) => { setAte(v); carregar(de, v, tipo, ingredienteId) }
  const handleTipoChange = (v: string) => { setTipo(v); carregar(de, ate, v, ingredienteId) }
  const handleIngredienteChange = (v: string) => { setIngredienteId(v); carregar(de, ate, tipo, v) }

  const movimentacoesFiltradas = useMemo(() => {
    if (!busca) return movimentacoes
    const termo = busca.toLowerCase()
    return movimentacoes.filter(m =>
      m.ingredienteNome.toLowerCase().includes(termo) ||
      (m.referenciaTipo ?? '').toLowerCase().includes(termo)
    )
  }, [movimentacoes, busca])

  return (
    <div className="ada-page">
      <PageHeader
        titulo="Movimentações de Estoque"
        breadcrumb={['Relatórios', 'Movimentações']}
        subtitulo={loading ? 'Carregando…' : `${movimentacoesFiltradas.length} movimentação(ões)`}
        actions={movimentacoes.length > 0 ? (
          <button onClick={() => gerarPdfMovimentacoes(movimentacoes, de, ate)} className="btn-secondary">
            <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
            Baixar PDF
          </button>
        ) : undefined}
      />

      <FiltrosMovimentacoes
        busca={busca}
        onBuscaChange={setBusca}
        de={de}
        onDeChange={handleDeChange}
        ate={ate}
        onAteChange={handleAteChange}
        tipo={tipo}
        onTipoChange={handleTipoChange}
        ingredienteId={ingredienteId}
        onIngredienteChange={handleIngredienteChange}
        ingredientes={ingredientes}
      />

      {loading && <LoadingState mensagem="Carregando movimentações…" />}
      {!loading && erro && <div className="state-error" role="alert">{erro}</div>}
      {!loading && !erro && movimentacoesFiltradas.length === 0 && (
        <div className="ada-surface-card">
          <EmptyState
            icon={<ArrowsRightLeftIcon className="w-7 h-7" />}
            iconColor="neutral"
            titulo="Nenhuma movimentação no período"
            descricao="Ajuste os filtros e tente novamente."
          />
        </div>
      )}
      {!loading && !erro && movimentacoesFiltradas.length > 0 && (
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
                {movimentacoesFiltradas.map(m => (
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
