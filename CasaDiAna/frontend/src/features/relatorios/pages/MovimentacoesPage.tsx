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
import { StreamMovimentacoes } from '../components/StreamMovimentacoes'

function hoje(): string { return new Date().toISOString().split('T')[0] }
function ha30Dias(): string {
  const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]
}


export function MovimentacoesPage() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoRelatorio[]>([])
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(ha30Dias)
  const [ate, setAte] = useState(hoje)
  const [tipos, setTipos] = useState<string[]>([])
  const [ingredienteIds, setIngredienteIds] = useState<string[]>([])
  const [busca, setBusca] = useState('')

  const carregar = async (
    filtroDe = de,
    filtroAte = ate,
    filtroTipos = tipos,
    filtroIngredienteIds = ingredienteIds
  ) => {
    setLoading(true)
    setErro(null)
    try {
      const data = await relatoriosService.movimentacoes(
        filtroDe, filtroAte,
        filtroTipos.length > 0 ? filtroTipos : undefined,
        filtroIngredienteIds.length > 0 ? filtroIngredienteIds : undefined
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

  const handleDeChange = (v: string) => { setDe(v); carregar(v, ate, tipos, ingredienteIds) }
  const handleAteChange = (v: string) => { setAte(v); carregar(de, v, tipos, ingredienteIds) }
  const handleTipoChange = (vs: string[]) => { setTipos(vs); carregar(de, ate, vs, ingredienteIds) }
  const handleIngredienteChange = (vs: string[]) => { setIngredienteIds(vs); carregar(de, ate, tipos, vs) }

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
        tipos={tipos}
        onTipoChange={handleTipoChange}
        ingredienteIds={ingredienteIds}
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
        <StreamMovimentacoes movimentacoes={movimentacoesFiltradas} />
      )}
    </div>
  )
}
