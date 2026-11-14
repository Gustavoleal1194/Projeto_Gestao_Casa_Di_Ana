import type { ReactNode } from 'react'

export function TituloSecao({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase tracking-[0.10em] mb-2"
      style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
    >
      {children}
    </p>
  )
}
