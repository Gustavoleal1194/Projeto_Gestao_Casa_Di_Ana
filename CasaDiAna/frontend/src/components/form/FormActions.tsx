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
        className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 outline-none
                   focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 disabled:opacity-50
                   hover:bg-[var(--ada-bg)]"
        style={{ border: '1px solid var(--ada-border)', color: 'var(--ada-body)', background: 'var(--ada-surface)' }}
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={salvando}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white
                   transition-all duration-200 outline-none
                   focus-visible:ring-2 focus-visible:ring-[#C4870A]/40
                   disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)',
          boxShadow: '0 3px 10px rgba(196,135,10,0.28)',
          fontFamily: 'Sora, system-ui, sans-serif',
        }}
      >
        {salvando && <Spinner />}
        {salvando ? 'Salvando…' : labelSalvar}
      </button>
    </div>
  )
}
