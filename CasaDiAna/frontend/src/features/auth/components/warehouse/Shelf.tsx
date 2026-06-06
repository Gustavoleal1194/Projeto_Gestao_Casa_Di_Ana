import type { ShelfConfig } from './types'
import { Box } from './Box'

interface ShelfProps {
  config: ShelfConfig
  /** ids de caixas atualmente ausentes (controlado pela cena) */
  goneIds: Set<string>
  /** ids que estão aterrissando neste tick */
  landingIds: Set<string>
}

export function Shelf({ config, goneIds, landingIds }: ShelfProps) {
  return (
    <div className={`lr-shelf lr-shelf-${config.position}`}>
      <span className="post l" />
      <span className="post r" />
      {config.rows.map((row, ri) => (
        <div className="lr-shelf-row" key={ri}>
          {row.label && <span className="lbl">{row.label}</span>}
          {row.boxes.map((box, bi) => (
            <Box
              key={box.id ?? `${ri}-${bi}`}
              color={box.color}
              gone={box.id ? goneIds.has(box.id) : false}
              landing={box.id ? landingIds.has(box.id) : false}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
