import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { PencilSquareIcon, TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useProdutos } from '../hooks/useProdutos'
import { useAuthStore } from '@/store/authStore'
import { ModalDesativar } from '@/features/estoque/ingredientes/components/ModalDesativar'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { ProdutoResumo } from '@/types/producao'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function ProdutosPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { produtos, loading, erro, desativar } = useProdutos()
  const podeEditar = temPapel(...PAPEIS_EDICAO)

  const [paraDesativar, setParaDesativar] = useState<ProdutoResumo | null>(null)
  const [desativando, setDesativando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const handleDesativar = async () => {
    if (!paraDesativar) return
    setDesativando(true)
    try {
      await desativar(paraDesativar.id)
      setParaDesativar(null)
      setToast({ tipo: 'sucesso', mensagem: 'Produto desativado.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao desativar produto.' })
    } finally {
      setDesativando(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Produtos</h1>
        {podeEditar && (
          <button
            onClick={() => navigate('/producao/produtos/novo')}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white
                       px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Novo Produto
          </button>
        )}
      </div>

      {loading && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
          <p className="text-stone-500 mt-3 text-sm">Carregando produtos...</p>
        </div>
      )}
      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{erro}</div>
      )}
      {!loading && !erro && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {produtos.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-stone-500 text-sm">Nenhum produto cadastrado.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Nome</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Categoria</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Preço de Venda</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Status</th>
                  {podeEditar && (
                    <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {produtos.map(p => (
                  <tr key={p.id} className="border-b border-stone-100 hover:bg-amber-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-stone-800">{p.nome}</td>
                    <td className="px-4 py-3 text-sm text-stone-500">{p.categoriaNome ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-stone-800 text-right font-semibold">
                      {p.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.ativo ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    {podeEditar && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/producao/produtos/${p.id}/ficha-tecnica`)}
                          title="Ficha Técnica"
                          className="p-1.5 rounded hover:bg-stone-100 text-stone-500 hover:text-amber-700"
                        >
                          <DocumentTextIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/producao/produtos/${p.id}/editar`)}
                          title="Editar"
                          className="p-1.5 rounded hover:bg-stone-100 text-stone-500 hover:text-amber-700 ml-1"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setParaDesativar(p)}
                          title="Desativar"
                          className="p-1.5 rounded hover:bg-stone-100 text-stone-500 hover:text-red-600 ml-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {paraDesativar && (
        <ModalDesativar
          nomeIngrediente={paraDesativar.nome}
          loading={desativando}
          onConfirmar={handleDesativar}
          onCancelar={() => setParaDesativar(null)}
        />
      )}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
