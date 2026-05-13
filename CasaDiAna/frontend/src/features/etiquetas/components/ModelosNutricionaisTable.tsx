import { useMemo, useState } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { TabelaAcoesLinha } from '@/components/ui/TabelaAcoesLinha'
import { Paginacao } from '@/components/ui/Paginacao'
import type { ModeloNutricionalResumo } from '@/lib/etiquetasService'

const ITENS_POR_PAGINA = 10

interface Props {
  modelos: ModeloNutricionalResumo[]
  onRenomear: (produtoId: string, nome: string | null) => Promise<void>
  onExcluir: (produtoId: string) => Promise<void>
}

const thCls = 'px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em]'
const tdCls = 'px-5 py-3.5 text-sm'

export function ModelosNutricionaisTable({ modelos, onRenomear, onExcluir }: Props) {
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [editando, setEditando] = useState<string | null>(null)
  const [rascunho, setRascunho] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const filtrados = useMemo(() => {
    const t = busca.toLowerCase().trim()
    return !t ? modelos : modelos.filter(m =>
      (m.nome ?? m.produtoNome).toLowerCase().includes(t) || m.produtoNome.toLowerCase().includes(t)
    )
  }, [modelos, busca])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA))
  const paginados = filtrados.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA)

  const iniciarEdicao = (m: ModeloNutricionalResumo) => {
    setEditando(m.produtoId); setRascunho(m.nome ?? m.produtoNome); setConfirmando(null)
  }

  const salvar = async (produtoId: string) => {
    setSalvando(true)
    try { await onRenomear(produtoId, rascunho.trim() || null); setEditando(null) }
    finally { setSalvando(false) }
  }

  const excluir = async (produtoId: string) => {
    setExcluindo(true)
    try { await onExcluir(produtoId); setConfirmando(null) }
    finally { setExcluindo(false) }
  }

  if (modelos.length === 0) {
    return (
      <p className="text-sm text-center py-10" style={{ color: 'var(--ada-muted)' }}>
        Nenhum modelo nutricional cadastrado ainda.
      </p>
    )
  }

  return (
    <div>
      <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--ada-border)' }}>
        <input
          type="search"
          placeholder="Buscar por nome ou produto…"
          value={busca}
          onChange={e => { setBusca(e.target.value); setPagina(1) }}
          className="w-full max-w-xs rounded-lg px-3 py-2 text-sm border outline-none"
          style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }}
        />
      </div>

      {filtrados.length === 0 ? (
        <p className="text-sm text-center py-10" style={{ color: 'var(--ada-muted)' }}>
          Nenhum resultado para "{busca}".
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr style={{ background: 'var(--ada-surface-2)', borderBottom: '1px solid var(--ada-border-sub)' }}>
                {['Nome do modelo', 'Produto', 'Porção', 'Energia (kcal)'].map(h => (
                  <th key={h} className={thCls} style={{ color: 'var(--ada-muted)' }}>{h}</th>
                ))}
                <th className={`${thCls} text-right`} style={{ color: 'var(--ada-muted)' }}><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {paginados.map((m, idx) => (
                <tr
                  key={m.id}
                  className="group transition-colors duration-100"
                  style={{ borderBottom: idx < paginados.length - 1 ? '1px solid var(--ada-hover)' : 'none', background: 'var(--ada-surface)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--ada-surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--ada-surface)')}
                >
                  <td className={tdCls} style={{ color: 'var(--ada-heading)', fontWeight: 600 }}>
                    {editando === m.produtoId ? (
                      <input
                        autoFocus
                        value={rascunho}
                        onChange={e => setRascunho(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') salvar(m.produtoId); if (e.key === 'Escape') setEditando(null) }}
                        className="rounded px-2 py-1 text-sm border outline-none"
                        style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)', width: '100%' }}
                      />
                    ) : (m.nome ?? m.produtoNome)}
                  </td>
                  <td className={tdCls} style={{ color: 'var(--ada-body)' }}>{m.produtoNome}</td>
                  <td className={tdCls} style={{ color: 'var(--ada-body)' }}>{m.porcao}</td>
                  <td className={tdCls} style={{ color: 'var(--ada-body)' }}>{m.valorEnergeticoKcal}</td>
                  <td className={`${tdCls} text-right`}>
                    {confirmando === m.produtoId ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs" style={{ color: 'var(--ada-muted)' }}>Excluir?</span>
                        <button onClick={() => excluir(m.produtoId)} disabled={excluindo}
                          className="px-2 py-1 rounded text-xs font-semibold transition-opacity disabled:opacity-40"
                          style={{ background: '#FEE2E2', color: '#DC2626' }}>
                          {excluindo ? '…' : 'Confirmar'}
                        </button>
                        <button onClick={() => setConfirmando(null)}
                          className="p-1 rounded hover:opacity-70">
                          <XMarkIcon className="h-4 w-4" style={{ color: 'var(--ada-muted)' }} />
                        </button>
                      </div>
                    ) : editando === m.produtoId ? (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => salvar(m.produtoId)} disabled={salvando}
                          className="p-1.5 rounded-lg transition-opacity disabled:opacity-40"
                          style={{ color: '#16a34a', background: 'rgba(22,163,74,.12)' }}>
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditando(null)} className="p-1.5 rounded-lg hover:opacity-70">
                          <XMarkIcon className="h-4 w-4" style={{ color: 'var(--ada-muted)' }} />
                        </button>
                      </div>
                    ) : (
                      <TabelaAcoesLinha
                        onEditar={() => iniciarEdicao(m)}
                        onDesativar={() => { setConfirmando(m.produtoId); setEditando(null) }}
                        labelEditar={`Renomear ${m.nome ?? m.produtoNome}`}
                        labelDesativar={`Excluir ${m.nome ?? m.produtoNome}`}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Paginacao
        paginaAtual={pagina}
        totalPaginas={totalPaginas}
        totalItens={filtrados.length}
        itensPorPagina={ITENS_POR_PAGINA}
        onPaginaChange={setPagina}
      />
    </div>
  )
}
