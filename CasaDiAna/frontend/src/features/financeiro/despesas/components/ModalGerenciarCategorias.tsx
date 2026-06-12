import { useEffect, useState } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { categoriasDespesaService, type CategoriaDespesa } from '../services/categoriasDespesaService'
import { TIPO_DESPESA_LABELS, type TipoDespesa } from '../../shared/competencia'

interface Props { tipo: TipoDespesa; onFechar: () => void; onMudou: () => void }

export function ModalGerenciarCategorias({ tipo, onFechar, onMudou }: Props) {
  const [itens, setItens] = useState<CategoriaDespesa[]>([])
  const [nome, setNome] = useState('')
  const [ehFolha, setEhFolha] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = () => categoriasDespesaService.listar(tipo).then(setItens).catch(() => {})
  useEffect(() => { carregar() }, [tipo])

  const adicionar = async () => {
    if (!nome.trim()) return
    setErro(null)
    try {
      await categoriasDespesaService.criar({ nome: nome.trim(), tipo, ehFolhaPagamento: ehFolha })
      setNome(''); setEhFolha(false); await carregar(); onMudou()
    } catch { setErro('Não foi possível criar (nome duplicado?).') }
  }
  const remover = async (id: string) => { await categoriasDespesaService.desativar(id); await carregar(); onMudou() }

  const inputStyle = { background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onFechar}>
      <div className="w-full max-w-md rounded-xl border p-6 space-y-4" style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }} onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--ada-heading)' }}>
          Categorias — {TIPO_DESPESA_LABELS[tipo]}
        </h2>

        <div className="space-y-2">
          {itens.length === 0 && <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Nenhuma categoria deste tipo.</p>}
          {itens.map(c => (
            <div key={c.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'var(--ada-bg)' }}>
              <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{c.nome}{c.ehFolhaPagamento ? ' · folha' : ''}</span>
              <button type="button" onClick={() => remover(c.id)} title="Remover" className="p-1.5 rounded-lg hover:opacity-80" style={{ color: '#F87171' }}>
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--ada-border)' }}>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nova categoria"
            className="w-full rounded-lg px-3 py-2 text-sm border outline-none" style={inputStyle} />
          {tipo === 'fixa' && (
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ada-body)' }}>
              <input type="checkbox" checked={ehFolha} onChange={e => setEhFolha(e.target.checked)} /> É folha de pagamento (prime cost)
            </label>
          )}
          {erro && <p className="text-sm" style={{ color: 'var(--ada-error-text)' }}>{erro}</p>}
          <button type="button" onClick={adicionar} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ background: 'var(--sb-accent)' }}>
            <PlusIcon className="h-4 w-4" /> Adicionar
          </button>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={onFechar} className="rounded-lg px-4 py-2 text-sm font-medium border" style={inputStyle}>Fechar</button>
        </div>
      </div>
    </div>
  )
}
