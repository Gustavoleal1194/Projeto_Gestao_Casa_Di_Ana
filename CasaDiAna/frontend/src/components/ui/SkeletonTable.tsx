interface SkeletonTableProps {
  colunas?: number
  linhas?: number
}

export function SkeletonTable({ colunas = 4, linhas = 5 }: SkeletonTableProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--ada-surface)',
        border: '1px solid var(--ada-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      aria-busy="true"
      aria-label="Carregando dados…"
    >
      {/* Cabeçalho */}
      <div
        className="flex gap-4 px-5 py-3"
        style={{ background: 'var(--ada-surface-2)', borderBottom: '1px solid var(--ada-border-sub)' }}
      >
        {Array.from({ length: colunas }).map((_, i) => (
          <div key={i} className="skeleton h-3 rounded flex-1" style={{ maxWidth: i === 0 ? '180px' : '120px' }} />
        ))}
      </div>
      {/* Linhas */}
      {Array.from({ length: linhas }).map((_, row) => (
        <div
          key={row}
          className="flex gap-4 px-5 py-3.5"
          style={{ borderBottom: row < linhas - 1 ? '1px solid var(--ada-hover)' : 'none' }}
        >
          {Array.from({ length: colunas }).map((_, col) => (
            <div
              key={col}
              className="skeleton h-3.5 rounded flex-1"
              style={{
                maxWidth: col === 0 ? '200px' : '100px',
                opacity: 1 - row * 0.12,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
