import { useMemo, useState } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Paginacao } from '@/components/ui/Paginacao'
import { destacar } from '@/utils/destacar'
import type { ModeloNutricionalResumo } from '@/lib/etiquetasService'

const ITENS_POR_PAGINA = 10

interface Props {
  modelos: ModeloNutricionalResumo[]
  onRenomear: (produtoId: string, nome: string | null) => Promise<void>
  onExcluir: (produtoId: string) => Promise<void>
}

export function ModelosNutricionaisTable({ modelos, onRenomear, onExcluir }: Props) {
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [focado, setFocado] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [rascunho, setRascunho] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const filtrados = useMemo(() => {
    const t = busca.toLowerCase().trim()
    return !t ? modelos : modelos.filter(m =>
      (m.nome ?? m.produtoNome).toLowerCase().includes(t) ||
      m.produtoNome.toLowerCase().includes(t)
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

  return (
    <div className="ada-surface-card" style={{ marginTop: 0 }}>
      {/* ── Filtro premium ── */}
      <div style={{
        position: 'relative',
        borderBottom: '1px solid var(--ada-border-sub)',
        background: 'linear-gradient(180deg, var(--ada-surface) 0%, var(--ada-bg) 100%)',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 50px at 50% 0%, rgba(212,150,12,.08) 0%, transparent 100%)',
        }} aria-hidden="true" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', position: 'relative' }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif', whiteSpace: 'nowrap' }}>
            Modelos Nutricionais
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: 'var(--ada-muted)' }}>
              {modelos.length}
            </span>
          </h2>
          <div
            onFocus={() => setFocado(true)}
            onBlur={() => setFocado(false)}
            style={{
              flex: 1, maxWidth: 320, display: 'flex', alignItems: 'center', gap: 10,
              padding: '0 12px', height: 40,
              background: 'var(--ada-surface-2)',
              border: `1px solid ${focado ? 'rgba(240,176,48,.45)' : 'var(--ada-border)'}`,
              borderRadius: 10,
              transition: 'border-color 200ms, box-shadow 200ms',
              boxShadow: focado ? '0 0 0 4px rgba(212,150,12,.10), 0 0 20px -4px rgba(240,176,48,.30)' : 'none',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
              style={{ flexShrink: 0, color: focado ? '#F0B030' : 'var(--ada-muted)', transition: 'color 200ms' }}>
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <label htmlFor="busca-modelos" className="sr-only">Buscar modelos nutricionais</label>
            <input
              id="busca-modelos"
              type="text"
              placeholder="Buscar por nome ou produto…"
              value={busca}
              onChange={e => { setBusca(e.target.value); setPagina(1) }}
              autoComplete="off"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13.5, fontWeight: 500, color: 'var(--ada-heading)', letterSpacing: '-.005em' }}
            />
            {busca && (
              <button type="button" onClick={() => { setBusca(''); setPagina(1) }} aria-label="Limpar busca"
                style={{ width: 20, height: 20, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'rgba(255,255,255,.06)', color: 'var(--ada-muted)', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Conteúdo ── */}
      {modelos.length === 0 ? (
        <p className="text-sm text-center py-12" style={{ color: 'var(--ada-muted)' }}>
          Nenhum modelo nutricional cadastrado ainda.
        </p>
      ) : filtrados.length === 0 ? (
        <p className="text-sm text-center py-12" style={{ color: 'var(--ada-muted)' }}>
          Nenhum resultado para <strong style={{ color: 'var(--ada-heading)' }}>"{busca}"</strong>.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="table-head-row">
                <th className="table-th" scope="col">Nome do modelo</th>
                <th className="table-th" scope="col">Produto</th>
                <th className="table-th" scope="col">Porção</th>
                <th className="table-th" scope="col">Energia (kcal)</th>
                <th className="table-th table-th-right" scope="col"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {paginados.map(m => (
                <tr key={m.id} className="table-row group">
                  <td className="table-td">
                    <div className="flex items-center gap-2.5">
                      <span className="accent-bar shrink-0" aria-hidden="true" />
                      {editando === m.produtoId ? (
                        <input
                          autoFocus
                          value={rascunho}
                          onChange={e => setRascunho(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') salvar(m.produtoId); if (e.key === 'Escape') setEditando(null) }}
                          className="rounded px-2 py-1 text-sm border outline-none"
                          style={{ background: 'var(--ada-surface)', borderColor: 'rgba(240,176,48,.45)', color: 'var(--ada-body)', width: '100%', boxShadow: '0 0 0 3px rgba(212,150,12,.10)' }}
                        />
                      ) : (
                        <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                          {destacar(m.nome ?? m.produtoNome, busca)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="table-td">
                    <span className="text-sm" style={{ color: 'var(--ada-muted-dim)' }}>
                      {destacar(m.produtoNome, busca)}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{m.porcao}</span>
                  </td>
                  <td className="table-td">
                    <span className="text-sm tabular-nums" style={{ color: 'var(--ada-body)' }}>{m.valorEnergeticoKcal}</span>
                  </td>
                  <td className="table-td" style={{ textAlign: 'right' }}>
                    {confirmando === m.produtoId ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs" style={{ color: 'var(--ada-muted)' }}>Excluir?</span>
                        <button type="button" onClick={() => excluir(m.produtoId)} disabled={excluindo}
                          className="px-2 py-1 rounded text-xs font-semibold disabled:opacity-40"
                          style={{ background: 'var(--ada-error-bg)', color: '#DC2626' }}>
                          {excluindo ? '…' : 'Confirmar'}
                        </button>
                        <button type="button" onClick={() => setConfirmando(null)} className="row-action-btn" aria-label="Cancelar exclusão">
                          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : editando === m.produtoId ? (
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => salvar(m.produtoId)} disabled={salvando}
                          className="p-1.5 rounded-lg transition-opacity disabled:opacity-40"
                          style={{ color: '#16a34a', background: 'rgba(22,163,74,.12)' }} aria-label="Salvar nome">
                          <CheckIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => setEditando(null)} className="row-action-btn" aria-label="Cancelar edição">
                          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button type="button" onClick={() => iniciarEdicao(m)} className="row-action-btn" aria-label={`Renomear ${m.nome ?? m.produtoNome}`}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button type="button" onClick={() => { setConfirmando(m.produtoId); setEditando(null) }}
                          className="row-action-btn danger" aria-label={`Excluir ${m.nome ?? m.produtoNome}`}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
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
