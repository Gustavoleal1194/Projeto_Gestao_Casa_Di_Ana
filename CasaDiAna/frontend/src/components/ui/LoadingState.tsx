interface LoadingStateProps {
  mensagem?: string
  altura?: string
}

export function LoadingState({ mensagem = 'Carregando…', altura }: LoadingStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3"
      style={{
        padding: altura ? undefined : '5rem 0',
        height: altura,
        background: 'var(--ada-surface)',
        border: '1px solid var(--ada-border)',
        borderRadius: '0.75rem',
        boxShadow: 'var(--shadow-sm)',
      }}
      aria-busy="true"
      aria-label={mensagem}
    >
      <div
        className="h-8 w-8 animate-spin rounded-full"
        style={{ border: '2.5px solid var(--ada-border-sub)', borderTopColor: '#C4870A' }}
        role="status"
        aria-hidden="true"
      />
      <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>{mensagem}</p>
    </div>
  )
}
