import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { useInventarios } from '../hooks/useInventarios'
import { useAuthStore } from '@/store/authStore'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

function badgeStatus(status: string) {
  if (status === 'EmAndamento') return 'bg-amber-100 text-amber-700'
  if (status === 'Finalizado') return 'bg-green-100 text-green-700'
  if (status === 'Cancelado') return 'bg-red-100 text-red-700'
  return 'bg-stone-100 text-stone-500'
}

function labelStatus(status: string) {
  if (status === 'EmAndamento') return 'Em Andamento'
  return status
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function InventariosPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { inventarios, loading, erro } = useInventarios()
  const podeCriar = temPapel(...PAPEIS_EDICAO)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Inventários</h1>
        {podeCriar && (
          <button
            onClick={() => navigate('/inventarios/novo')}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white
                       px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Novo Inventário
          </button>
        )}
      </div>

      {loading && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
          <p className="text-stone-500 mt-3 text-sm">Carregando inventários...</p>
        </div>
      )}
      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{erro}</div>
      )}
      {!loading && !erro && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {inventarios.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-stone-500 text-sm">Nenhum inventário registrado.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Data</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Descrição</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Itens</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventarios.map(inv => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/inventarios/${inv.id}`)}
                    className="border-b border-stone-100 hover:bg-amber-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm text-stone-800">{formatarData(inv.dataRealizacao)}</td>
                    <td className="px-4 py-3 text-sm text-stone-600">{inv.descricao ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-stone-600">{inv.totalItens}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badgeStatus(inv.status)}`}>
                        {labelStatus(inv.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
