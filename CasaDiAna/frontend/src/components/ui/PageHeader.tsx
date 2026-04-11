import type { ReactNode } from 'react'

interface PageHeaderProps {
  titulo: string
  subtitulo?: string
  breadcrumb?: string[]
  actions?: ReactNode
}

export function PageHeader({ titulo, subtitulo, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="page-breadcrumb" aria-label="Localização atual">
            {breadcrumb.map((item, i) => (
              <span key={i}>
                {item}
                {i < breadcrumb.length - 1 && <span aria-hidden="true"> /</span>}
              </span>
            ))}
          </div>
        )}
        <h1 className="page-header-title">{titulo}</h1>
        {subtitulo && (
          <p className="page-header-subtitle">{subtitulo}</p>
        )}
      </div>
      {actions && (
        <div className="page-header-actions">{actions}</div>
      )}
    </div>
  )
}
