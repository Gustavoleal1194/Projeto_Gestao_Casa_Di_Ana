import { Spinner } from '@/components/form/Spinner'

interface Props {
  salvando: boolean
  onVoltar: () => void
  labelSalvar: string
}

export function FooterFormulario({ salvando, onVoltar, labelSalvar }: Props) {
  return (
    <div
      className="flex justify-end gap-2.5 pt-5 mt-6"
      style={{ borderTop: '1px solid var(--ada-border-sub)' }}
    >
      <button
        type="button"
        onClick={onVoltar}
        disabled={salvando}
        className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 hover:bg-[var(--ada-bg)]"
        style={{ border: '1px solid var(--ada-border)', color: 'var(--ada-body)', background: 'var(--ada-surface)' }}
      >
        Voltar
      </button>
      <button
        type="submit"
        disabled={salvando}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)', boxShadow: '0 3px 10px rgba(196,135,10,0.28)' }}
      >
        {salvando && <Spinner />}
        {salvando ? 'Salvando…' : labelSalvar}
      </button>
    </div>
  )
}
