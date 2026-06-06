import type { ShelfConfig, PacketConfig } from './types'

/** ids inicialmente ausentes, reabastecidos em ciclo */
export const GONE_IDS = ['bA1', 'bA2', 'bB1', 'bB2', 'bC1', 'bD1'] as const

export const SHELVES: ShelfConfig[] = [
  {
    position: 'A',
    rows: [
      { label: 'SETOR A · CAFÉ', boxes: [
        { color: 'amber' }, { color: 'amber' }, { color: 'amber', id: 'bA1' },
        { color: 'amber' }, { color: 'amber' }, { color: 'amber' },
      ] },
      { boxes: [
        { color: 'cream' }, { color: 'cream' }, { color: 'cream' },
        { color: 'cream' }, { color: 'cream', id: 'bA2' }, { color: 'cream' },
      ] },
    ],
  },
  {
    position: 'B',
    rows: [
      { label: 'SETOR B · DOCES', boxes: [
        { color: 'purple' }, { color: 'purple' }, { color: 'purple' },
        { color: 'purple' }, { color: 'purple', id: 'bB1' }, { color: 'purple' },
      ] },
      { boxes: [
        { color: 'red' }, { color: 'red', id: 'bB2' }, { color: 'red' },
        { color: 'red' }, { color: 'red' }, { color: 'red' },
      ] },
    ],
  },
  {
    position: 'C',
    rows: [
      { label: 'SETOR C · BEBIDAS', boxes: [
        { color: 'blue' }, { color: 'blue', id: 'bC1' }, { color: 'blue' },
        { color: 'blue' }, { color: 'blue' }, { color: 'blue' },
      ] },
    ],
  },
  {
    position: 'D',
    rows: [
      { label: 'SETOR D · SALGADOS', boxes: [
        { color: 'green' }, { color: 'green' }, { color: 'green' },
        { color: 'green', id: 'bD1' }, { color: 'green' }, { color: 'green' },
      ] },
    ],
  },
]

export const PACKETS: PacketConfig[] = [
  { text: 'SKU·CAF-001 ✓',     variant: 'amber', slot: 'dp1' },
  { text: '+45kg · entrada',    variant: 'green', slot: 'dp2' },
  { text: 'ETQ #204 · printed', variant: 'blue',  slot: 'dp3' },
  { text: 'SCAN OK · 142ms',    variant: 'amber', slot: 'dp4' },
]

export const STATUS_ITEMS: Array<{ label: string; value: string; dot?: boolean }> = [
  { label: 'Sistema', value: 'operacional', dot: true },
  { label: 'Latência', value: '142ms' },
  { label: 'Build', value: 'v2.14.0' },
]
