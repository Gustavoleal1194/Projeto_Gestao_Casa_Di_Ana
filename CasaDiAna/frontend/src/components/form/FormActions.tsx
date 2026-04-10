import { Spinner } from './Spinner'

interface FormActionsProps {
  salvando: boolean
  labelSalvar?: string
  onCancelar: () => void
}

export function FormActions({ salvando, labelSalvar = 'Salvar', onCancelar }: FormActionsProps) {
  return (
    <div
      className="flex justify-end gap-2.5 pt-5 mt-6"
      style={{ borderTop: '1px solid var(--ada-border-sub)' }}
    >
      <button
        type="button"
        onClick={onCancelar}
        disabled={salvando}
        className="btn-secondary disabled:opacity-50"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={salvando}
        className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {salvando && <Spinner />}
        {salvando ? 'Salvando…' : labelSalvar}
      </button>
    </div>
  )
}
