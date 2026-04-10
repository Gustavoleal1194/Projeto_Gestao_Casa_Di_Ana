interface FormSectionProps {
  titulo: string
  primeiro?: boolean
}

export function FormSection({ titulo, primeiro }: FormSectionProps) {
  return (
    <div className={`flex items-center gap-3 ${primeiro ? 'mt-0 mb-4' : 'mt-7 mb-4'}`}>
      <div
        className="w-[3px] h-3.5 rounded-full shrink-0"
        style={{ background: '#C4870A' }}
        aria-hidden="true"
      />
      <span
        className="text-[10.5px] font-semibold uppercase tracking-[0.10em] whitespace-nowrap"
        style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {titulo}
      </span>
      <div
        className="flex-1"
        style={{ borderTop: '1px solid var(--ada-border-sub)' }}
        aria-hidden="true"
      />
    </div>
  )
}
