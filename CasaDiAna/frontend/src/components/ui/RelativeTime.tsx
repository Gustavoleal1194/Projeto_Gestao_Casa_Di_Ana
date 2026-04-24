// frontend/src/components/ui/RelativeTime.tsx
interface Props {
  date: string | Date | null | undefined
  fallback?: string
}

export function RelativeTime({ date, fallback = 'Nunca' }: Props) {
  if (!date) return <span style={{ color: 'var(--ada-muted)' }}>{fallback}</span>

  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return <span style={{ color: 'var(--ada-muted)' }}>{fallback}</span>

  const now = Date.now()
  const diffMs = now - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffH = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  let label: string
  if (diffMin < 1) label = 'agora mesmo'
  else if (diffMin < 60) label = `há ${diffMin} min`
  else if (diffH < 24) label = `há ${diffH}h`
  else if (diffDays < 7) label = `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`
  else label = d.toLocaleDateString('pt-BR')

  return (
    <time
      dateTime={d.toISOString()}
      title={d.toLocaleString('pt-BR')}
      style={{ color: 'var(--ada-muted)' }}
      className="text-sm"
    >
      {label}
    </time>
  )
}
