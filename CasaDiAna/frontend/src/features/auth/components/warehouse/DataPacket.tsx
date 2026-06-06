import type { PacketConfig } from './types'

/** Chip mono flutuante. Posição/tempo vêm da classe slot (dp1..dp4) no CSS. */
export function DataPacket({ text, variant, slot }: PacketConfig) {
  const variantCls = variant === 'amber' ? '' : ` ${variant}`
  return <div className={`lr-dpacket ${slot}${variantCls}`}>{text}</div>
}
