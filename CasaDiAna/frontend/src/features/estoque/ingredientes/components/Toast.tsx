import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/20/solid'

interface Props {
  tipo: 'sucesso' | 'erro'
  mensagem: string
  onFechar: () => void
}

const estilos = {
  sucesso: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icone: <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />,
  },
  erro: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icone: <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />,
  },
}

export function Toast({ tipo, mensagem, onFechar }: Props) {
  const { container, icone } = estilos[tipo]

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-start gap-3 border rounded-xl
                     px-4 py-3 shadow-lg max-w-sm ${container}`}>
      {icone}
      <p className="text-sm font-medium flex-1">{mensagem}</p>
      <button onClick={onFechar} className="text-current opacity-60 hover:opacity-100">
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
