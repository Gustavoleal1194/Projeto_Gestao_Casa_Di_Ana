import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { usePrecificacao } from '../hooks/usePrecificacao'
import { ConfigPrecificacaoEditor } from '../components/ConfigPrecificacaoEditor'
import { TabelaPrecificacao } from '../components/TabelaPrecificacao'
import { ModalSimulador } from '../components/ModalSimulador'
import type { ProdutoPrecificacao } from '../services/precificacaoService'
import { competenciaInicial } from '../../shared/competencia'

export function PrecificacaoPage() {
  const [mes, setMes] = useState(competenciaInicial())
  const { analise, loading, erro, setAnalise } = usePrecificacao(mes)
  const [simular, setSimular] = useState<ProdutoPrecificacao | null>(null)

  return (
    <div className="ada-page space-y-6">
      <PageHeader titulo="Precificação"
        subtitulo="Custo da ficha + despesas fixas do mês → preço sugerido, margem líquida e status por produto" />

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Mês de referência</label>
        <input type="month" value={mes} onChange={e => setMes(e.target.value)}
          className="rounded-lg px-3 py-2.5 text-sm border outline-none"
          style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)', colorScheme: 'dark' }} />
      </div>

      {loading ? (
        <SkeletonTable colunas={9} />
      ) : erro ? (
        <p className="text-sm" style={{ color: 'var(--ada-error-text)' }}>{erro}</p>
      ) : analise && (
        <>
          {analise.despesaFixaPercentual === null && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'var(--ada-warning-badge)', color: 'var(--ada-warning-text)' }}>
              Sem faturamento neste mês — o rateio de despesas fixas está em 0.{' '}
              <Link to="/financeiro/fechamento" style={{ textDecoration: 'underline' }}>Definir no Fechamento</Link>.
            </p>
          )}
          <ConfigPrecificacaoEditor config={analise.config}
            onSalvo={c => setAnalise({ ...analise, config: c })} />
          {analise.produtos.length === 0 ? (
            <EmptyState icon={<CurrencyDollarIcon />} titulo="Nenhum produto ativo para analisar"
              descricao="Cadastre produtos com preço e ficha técnica." />
          ) : (
            <TabelaPrecificacao analise={analise} onSimular={setSimular} />
          )}
        </>
      )}

      {simular && analise && (
        <ModalSimulador produto={simular} config={analise.config}
          despesaFixaPct={analise.despesaFixaPercentual} onFechar={() => setSimular(null)} />
      )}
    </div>
  )
}
