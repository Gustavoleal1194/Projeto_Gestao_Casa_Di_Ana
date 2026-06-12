import { useState } from 'react'
import { PlusIcon, BanknotesIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { ModalDesativar } from '@/components/ui/ModalDesativar'
import { useDespesas } from '../hooks/useDespesas'
import { TabelaDespesas } from '../components/TabelaDespesas'
import { ModalDespesa } from '../components/ModalDespesa'
import { ModalGerenciarCategorias } from '../components/ModalGerenciarCategorias'
import { despesasService, type Despesa, type DespesaInput } from '../services/despesasService'
import { competenciaInicial, formatarBRL, TIPO_DESPESA_LABELS, type TipoDespesa } from '../../shared/competencia'

export function DespesasPage() {
  const [mes, setMes] = useState(competenciaInicial())
  const [tipo, setTipo] = useState<TipoDespesa>('fixa')
  const { dados, compras, loading, erro, recarregar } = useDespesas(mes, tipo)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Despesa | null>(null)
  const [removendo, setRemovendo] = useState<Despesa | null>(null)
  const [removendoLoading, setRemovendoLoading] = useState(false)
  const [gerenciar, setGerenciar] = useState(false)

  const salvar = async (input: DespesaInput) => {
    if (editando) await despesasService.atualizar(editando.id, input)
    else await despesasService.criar(input)
    await recarregar()
  }
  const confirmarRemocao = async () => {
    if (!removendo) return
    setRemovendoLoading(true)
    try { await despesasService.cancelar(removendo.id); setRemovendo(null); await recarregar() }
    finally { setRemovendoLoading(false) }
  }

  return (
    <div className="ada-page space-y-6">
      <PageHeader titulo="Despesas" subtitulo="Despesas fixas e variáveis da empresa, e compras das notas" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Competência</label>
            <input type="month" value={mes} onChange={e => setMes(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)', colorScheme: 'dark' }} />
          </div>
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--ada-border)' }}>
            {(['fixa', 'variavel'] as const).map(t => (
              <button key={t} type="button" onClick={() => setTipo(t)} className="px-4 py-2.5 text-sm font-medium"
                style={{ background: tipo === t ? 'var(--sb-accent)' : 'var(--ada-bg)', color: tipo === t ? '#fff' : 'var(--ada-body)' }}>
                {TIPO_DESPESA_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setGerenciar(true)} className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium border" style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }}>
            <Cog6ToothIcon className="h-4 w-4" /> Gerenciar categorias
          </button>
          <button type="button" onClick={() => { setEditando(null); setModalAberto(true) }} className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ background: 'var(--sb-accent)' }}>
            <PlusIcon className="h-4 w-4" /> Nova despesa {TIPO_DESPESA_LABELS[tipo].toLowerCase()}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Total fixas" valor={formatarBRL(dados?.totalFixas ?? 0)} variante="amber" />
        <KpiCard label="Total variáveis" valor={formatarBRL(dados?.totalVariaveis ?? 0)} variante="yellow" />
        <KpiCard label="Compras (notas)" valor={formatarBRL(compras?.totalCompras ?? 0)} variante="blue" />
      </div>

      <div className="rounded-xl border p-6" style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
        {loading ? <SkeletonTable colunas={5} />
          : erro ? <p className="text-sm" style={{ color: 'var(--ada-error-text)' }}>{erro}</p>
          : !dados || dados.itens.length === 0
            ? <EmptyState icon={<BanknotesIcon />} titulo={`Nenhuma despesa ${TIPO_DESPESA_LABELS[tipo].toLowerCase()} nesta competência`} descricao="Adicione a primeira despesa deste tipo e mês." />
            : <TabelaDespesas itens={dados.itens} onEditar={d => { setEditando(d); setModalAberto(true) }} onRemover={setRemovendo} />}
      </div>

      <div className="rounded-xl border p-6 space-y-3" style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)' }}>Compras do mês (notas)</p>
          <Link to="/entradas" className="text-xs" style={{ color: 'var(--sb-accent)', textDecoration: 'underline' }}>Ver entradas</Link>
        </div>
        {!compras || compras.itens.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Nenhuma compra registrada neste mês.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {compras.itens.map(c => (
                  <tr key={c.entradaId} style={{ borderTop: '1px solid var(--ada-border)' }}>
                    <td className="py-2 pr-4" style={{ color: 'var(--ada-body)' }}>{c.fornecedor}</td>
                    <td className="py-2 pr-4" style={{ color: 'var(--ada-muted)' }}>{c.numeroNotaFiscal ?? '—'}</td>
                    <td className="py-2 pr-4" style={{ color: 'var(--ada-muted)' }}>{new Date(c.data).toLocaleDateString('pt-BR')}</td>
                    <td className="py-2 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>{formatarBRL(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && <ModalDespesa mes={mes} tipo={tipo} despesa={editando} onFechar={() => setModalAberto(false)} onSalvar={salvar} />}
      {removendo && <ModalDesativar nome={removendo.descricao ?? removendo.categoriaNome} entidade="despesa" loading={removendoLoading} onConfirmar={confirmarRemocao} onCancelar={() => setRemovendo(null)} />}
      {gerenciar && <ModalGerenciarCategorias tipo={tipo} onFechar={() => setGerenciar(false)} onMudou={recarregar} />}
    </div>
  )
}
