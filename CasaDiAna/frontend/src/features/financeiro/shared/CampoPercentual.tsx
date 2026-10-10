interface Props {
  label: string
  value: string
  onChange: (valor: string) => void
}

export function CampoPercentual({ label, value, onChange }: Props) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-body)' }}>{label} (%)</label>
      <input type="text" inputMode="decimal" value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
        style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }} />
    </div>
  )
}
