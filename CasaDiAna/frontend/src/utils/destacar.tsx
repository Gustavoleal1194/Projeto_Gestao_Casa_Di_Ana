import type { ReactNode } from 'react'

export function destacar(texto: string, termo: string): ReactNode {
  if (!termo.trim()) return texto
  const partes = texto.split(new RegExp(`(${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return partes.map((parte, i) =>
    parte.toLowerCase() === termo.toLowerCase()
      ? (
        <mark
          key={i}
          style={{
            background: 'rgba(240,176,48,.22)',
            color: '#FFC857',
            padding: '1px 3px',
            margin: '-1px 0',
            borderRadius: 3,
            fontWeight: 600,
          }}
        >
          {parte}
        </mark>
      )
      : parte
  )
}
