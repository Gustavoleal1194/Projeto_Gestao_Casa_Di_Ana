import { useState } from 'react'
import { PlusIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { ModalDesativar } from '@/components/ui/ModalDesativar'
import { useDespesasFixas } from '../hooks/useDespesasFixas'
import { TabelaDespesasFixas } from '../components/TabelaDespesasFixas'
import { ModalDespesaFixa } from '../components/ModalDespesaFixa'
import { despesasFixasService, type DespesaFixa, type DespesaFixaInput } from '../services/despesasFixasService'
import { competenciaInicial, formatarBRL, CATEGORIA_DESPESA_LABELS } from '../../shared/competencia'

export function DespesasFixasPage() {
  const [mes, setMes] = useState(competenciaInicial())
  const { dados, loading, erro, recarregar } = useDespesasFixas(mes)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<DespesaFixa | null>(null)
  const [removendo, setRemovendo] = useState<DespesaFixa | null>(null)
  const [removendoLoading, setRemovendoLoading] = useState(false)

  const abrirNova = () => { setEditando(null); setModalAberto(true) }
  const abrirEdicao = (d: DespesaFixa) => { setEditando(d); setModalAberto(true) }

  const salvar = async (input: DespesaFixaInput) => {
    if (editando) await despesasFixasService.atualizar(editando.id, input)
    else await despesasFixasService.criar(input)
    await recarregar()
  }

  const confirmarRemocao = async () => {
    if (!removendo) return
    setRemovendoLoading(true)
    try {
      await despesasFixasService.cancelar(removendo.id)
      setRemovendo(null)
      await recarregar()
    } finally {
      setRemovendoLoading(false)
    }
  }

  return (
    <div className="ada-page space-y-6">
      <PageHeader titulo="Despesas Fixas Mensais"
        subtitulo="Cadastre as despesas operacionais da empresa por competência" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Competência</label>
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            className="rounded-lg px-3 py-2.5 text-sm border outline-none"
            style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)', colorScheme: 'dark' }} />
        </div>
        <button type="button" onClick={abrirNova}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: 'var(--sb-accent)' }}>
          <PlusIcon className="h-4 w-4" /> Nova despesa
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total do mês" valor={formatarBRL(dados?.total ?? 0)} variante="amber" />
      </div>

      <div className="rounded-xl border p-6"
        style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
        {loading ? (
          <SkeletonTable colunas={5} />
        ) : erro ? (
          <p className="text-sm" style={{ color: 'var(--ada-error-text)' }}>{erro}</p>
        ) : !dados || dados.itens.length === 0 ? (
          <EmptyState icon={<BanknotesIcon />} titulo="Nenhuma despesa nesta competência"
            descricao="Adicione a primeira despesa fixa deste mês." />
        ) : (
          <TabelaDespesasFixas itens={dados.itens} onEditar={abrirEdicao} onRemover={setRemovendo} />
        )}
      </div>

      {modalAberto && (
        <ModalDespesaFixa mes={mes} despesa={editando}
          onFechar={() => setModalAberto(false)} onSalvar={salvar} />
      )}

      {removendo && (
        <ModalDesativar
          nome={removendo.descricao ?? CATEGORIA_DESPESA_LABELS[removendo.categoria]}
          entidade="despesa"
          loading={removendoLoading}
          onConfirmar={confirmarRemocao}
          onCancelar={() => setRemovendo(null)}
        />
      )}
    </div>
  )
}
