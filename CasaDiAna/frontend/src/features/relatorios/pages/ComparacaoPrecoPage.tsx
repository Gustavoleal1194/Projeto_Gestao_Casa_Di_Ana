import { useState } from 'react'
import { ScaleIcon } from '@heroicons/react/24/outline'
import { relatoriosService } from '../services/relatoriosService'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { FiltrosRelatorio } from '../components/FiltrosRelatorio'
import { ResultadoComparacao } from '../components/comparacao-preco/ResultadoComparacao'
import { fmtData } from '../components/comparacao-preco/formatadores'
import type { ComparacaoPreco } from '@/types/estoque'

function hoje(): string { return new Date().toISOString().split('T')[0] }
function primeiroDiaMes(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

export function ComparacaoPrecoPage() {
  const [dados, setDados] = useState<ComparacaoPreco | null>(null)
  const [consulta, setConsulta] = useState(0)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(primeiroDiaMes)
  const [ate, setAte] = useState(hoje)

  const handleFiltrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro(null)
    try {
      setDados(await relatoriosService.comparacaoPrecos(de || undefined, ate || undefined))
      setConsulta(c => c + 1)
    } catch {
      setErro('Erro ao carregar comparação de preços.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ada-page">
      <PageHeader
        titulo="Comparação de Preços"
        breadcrumb={['Relatórios', 'Comparação de Preços']}
        subtitulo="Variação de preços de ingredientes entre entradas e fornecedores"
      />

      <FiltrosRelatorio
        de={de} onDeChange={setDe} ate={ate} onAteChange={setAte}
        onSubmit={handleFiltrar} loading={loading}
        submitLabel="Gerar Comparação"
        pills={[
          ...(de ? [{ tag: 'De', valor: fmtData(de), onRemove: () => setDe('') }] : []),
          ...(ate ? [{ tag: 'Até', valor: fmtData(ate), onRemove: () => setAte('') }] : []),
        ]}
      />

      {loading && <SkeletonTable colunas={7} linhas={6} />}
      {!loading && erro && <div className="state-error" role="alert">{erro}</div>}
      {/* key: nova consulta zera busca, linhas expandidas e foco */}
      {!loading && dados && <ResultadoComparacao key={consulta} dados={dados} />}

      {!loading && !dados && !erro && (
        <EmptyState
          icon={<ScaleIcon className="w-7 h-7" />}
          titulo="Selecione um período"
          descricao='Defina o intervalo de datas e clique em "Gerar Comparação" para visualizar.'
        />
      )}
    </div>
  )
}
