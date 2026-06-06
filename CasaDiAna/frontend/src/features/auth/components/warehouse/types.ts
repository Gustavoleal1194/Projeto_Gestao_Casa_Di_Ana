export type BoxColor = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'cream'

export interface ShelfBox {
  /** id único só para as caixas que entram no ciclo de reabastecimento */
  id?: string
  color: BoxColor
}

export interface ShelfRow {
  /** label da prateleira aparece só na primeira linha */
  label?: string
  boxes: ShelfBox[]
}

export interface ShelfConfig {
  position: 'A' | 'B' | 'C' | 'D'
  rows: ShelfRow[]
}

export type PacketVariant = 'amber' | 'green' | 'blue'

export interface PacketConfig {
  text: string
  variant: PacketVariant
  slot: 'dp1' | 'dp2' | 'dp3' | 'dp4'
}
