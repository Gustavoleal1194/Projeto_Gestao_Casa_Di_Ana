import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { CategoriaProduto } from '@/types/producao'

interface Props {
  categoria: CategoriaProduto | null
  salvando: boolean
  onSalvar: (nome: string) => Promise<void>
  onFechar: () => void
}

export function ModalCategoriaProduto({ categoria, salvando, onSalvar, onFechar }: Props) {
  const [nome, setNome] = useState(categoria?.nome ?? '')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    setNome(categoria?.nome ?? '')
    setErro(null)
  }, [categoria])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = nome.trim()
    if (!trimmed) { setErro('Nome é obrigatório.'); return }
    if (trimmed.length > 100) { setErro('Máximo de 100 caracteres.'); return }
    setErro(null)
    await onSalvar(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-stone-800">
            {categoria ? 'Editar Categoria' : 'Nova Categoria de Produto'}
          </h2>
          <button onClick={onFechar} className="p-1 rounded hover:bg-stone-100 text-stone-400">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Bolos, Salgados, Bebidas..."
              maxLength={100}
              autoFocus
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm
                         text-stone-600 hover:bg-stone-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white
                         rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
