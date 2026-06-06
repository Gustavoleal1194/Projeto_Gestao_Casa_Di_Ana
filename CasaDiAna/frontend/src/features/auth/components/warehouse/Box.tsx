import type { BoxColor } from './types'

interface BoxProps {
  color: BoxColor
  gone?: boolean
  landing?: boolean
}

/** Caixa em prateleira. `gone` = ausente; `landing` = aterrissando de volta. */
export function Box({ color, gone, landing }: BoxProps) {
  const cls = ['lr-box', `b-${color}`, gone ? 'gone' : '', landing ? 'land' : '']
    .filter(Boolean)
    .join(' ')
  return <div className={cls} />
}
