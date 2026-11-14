import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface Props {
  dataVenda: string
  confirmada: boolean
  onConfirmadaChange: (v: boolean) => void
}

export function AvisoDataJaImportada({ dataVenda, confirmada, onConfirmadaChange }: Props) {
  const data = dataVenda.split('-').reverse().join('/')
  return (
    <div className="state-warning mt-3" role="alert">
      <ExclamationTriangleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="space-y-2">
        <p>
          Já existe importação de vendas para <strong>{data}</strong>. Importar de novo soma estas
          vendas às já lançadas e baixa os insumos outra vez.
        </p>
        <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--ada-body)' }}>
          <input
            type="checkbox"
            checked={confirmada}
            onChange={e => onConfirmadaChange(e.target.checked)}
          />
          Entendo, importar mesmo assim
        </label>
      </div>
    </div>
  )
}
