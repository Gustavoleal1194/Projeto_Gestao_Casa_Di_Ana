import { useState } from 'react'
import { PencilSquareIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { ModeloNutricionalResumo } from '@/lib/etiquetasService'

interface Props {
  modelos: ModeloNutricionalResumo[]
  onRenomear: (produtoId: string, nome: string | null) => Promise<void>
}

export function ModelosNutricionaisTable({ modelos, onRenomear }: Props) {
  const [editando, setEditando] = useState<string | null>(null)
  const [rascunho, setRascunho] = useState('')
  const [salvando, setSalvando] = useState(false)

  const iniciarEdicao = (m: ModeloNutricionalResumo) => {
    setEditando(m.produtoId)
    setRascunho(m.nome ?? m.produtoNome)
  }

  const cancelar = () => setEditando(null)

  const salvar = async (produtoId: string) => {
    setSalvando(true)
    try {
      await onRenomear(produtoId, rascunho.trim() || null)
      setEditando(null)
    } finally {
      setSalvando(false)
    }
  }

  if (modelos.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--ada-muted)' }}>
        Nenhum modelo nutricional cadastrado ainda.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--ada-border)' }}>
            {['Nome do modelo', 'Produto', 'Porção', 'Energia (kcal)'].map(h => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--ada-muted)' }}
              >
                {h}
              </th>
            ))}
            <th className="px-4 py-3 w-20" />
          </tr>
        </thead>
        <tbody>
          {modelos.map((m, i) => (
            <tr
              key={m.id}
              style={{
                borderBottom: '1px solid var(--ada-border)',
                background: i % 2 === 0 ? 'transparent' : 'var(--ada-hover)',
              }}
            >
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--ada-heading)' }}>
                {editando === m.produtoId ? (
                  <input
                    autoFocus
                    value={rascunho}
                    onChange={e => setRascunho(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') salvar(m.produtoId)
                      if (e.key === 'Escape') cancelar()
                    }}
                    className="w-full rounded px-2 py-1 text-sm border outline-none"
                    style={{
                      background: 'var(--ada-surface)',
                      borderColor: 'var(--ada-border)',
                      color: 'var(--ada-body)',
                    }}
                  />
                ) : (
                  m.nome ?? m.produtoNome
                )}
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--ada-body)' }}>
                {m.produtoNome}
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--ada-body)' }}>
                {m.porcao}
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--ada-body)' }}>
                {m.valorEnergeticoKcal}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 justify-end">
                  {editando === m.produtoId ? (
                    <>
                      <button
                        onClick={() => salvar(m.produtoId)}
                        disabled={salvando}
                        className="p-1 rounded hover:opacity-70 disabled:opacity-40 transition-opacity"
                        title="Salvar"
                      >
                        <CheckIcon className="h-4 w-4" style={{ color: 'var(--ada-success-text, #16a34a)' }} />
                      </button>
                      <button
                        onClick={cancelar}
                        className="p-1 rounded hover:opacity-70 transition-opacity"
                        title="Cancelar"
                      >
                        <XMarkIcon className="h-4 w-4" style={{ color: 'var(--ada-muted)' }} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => iniciarEdicao(m)}
                      className="p-1 rounded hover:opacity-70 transition-opacity"
                      title="Renomear"
                    >
                      <PencilSquareIcon className="h-4 w-4" style={{ color: 'var(--ada-muted)' }} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
