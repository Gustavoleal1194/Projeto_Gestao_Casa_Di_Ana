import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface Props {
  nomeIngrediente: string
  loading: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export function ModalDesativar({ nomeIngrediente, loading, onConfirmar, onCancelar }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-800">Desativar ingrediente</h2>
            <p className="text-sm text-stone-500 mt-0.5">Esta ação pode ser revertida depois.</p>
          </div>
        </div>

        <p className="text-sm text-stone-700 mb-6">
          Deseja desativar <span className="font-semibold">"{nomeIngrediente}"</span>?
          Ele não aparecerá mais nas listagens ativas.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancelar}
            disabled={loading}
            className="px-4 py-2 border border-stone-200 rounded-lg text-sm text-stone-600
                       hover:bg-stone-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg
                       text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            Desativar
          </button>
        </div>
      </div>
    </div>
  )
}
