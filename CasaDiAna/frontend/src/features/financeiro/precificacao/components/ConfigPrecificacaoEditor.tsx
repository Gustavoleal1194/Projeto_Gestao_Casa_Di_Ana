import { useState } from 'react'
import { precificacaoService, type ConfiguracaoPrecificacao } from '../services/precificacaoService'

interface Props {
  config: ConfiguracaoPrecificacao
  onSalvo: (c: ConfiguracaoPrecificacao) => void
}

const pct = (frac: number) => String(Math.round(frac * 1000) / 10) // 0.3 -> "30"

export function ConfigPrecificacaoEditor({ config, onSalvo }: Props) {
  const [cmv, setCmv] = useState(pct(config.cmvAlvo))
  const [margem, setMargem] = useState(pct(config.margemDesejada))
  const [taxas, setTaxas] = useState(pct(config.taxas))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const salvar = async () => {
    const toFrac = (s: string) => Number(s.replace(',', '.')) / 100
    const body = { cmvAlvo: toFrac(cmv), margemDesejada: toFrac(margem), taxas: toFrac(taxas) }
    if (body.cmvAlvo <= 0 || body.cmvAlvo >= 1 || body.margemDesejada < 0 || body.margemDesejada >= 1 || body.taxas < 0 || body.taxas >= 1) {
      setErro('Cada percentual deve estar entre 0 e 100% (CMV alvo acima de 0).')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      onSalvo(await precificacaoService.atualizarConfig(body))
    } catch {
      setErro('Erro ao salvar a configuração.')
    } finally {
      setSalvando(false)
    }
  }

  const campo = (label: string, value: string, set: (v: string) => void) => (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-body)' }}>{label} (%)</label>
      <input type="text" inputMode="decimal" value={value} onChange={e => set(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
        style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }} />
    </div>
  )

  return (
    <div className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)' }}>Alvos de precificação</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {campo('CMV alvo', cmv, setCmv)}
        {campo('Margem desejada', margem, setMargem)}
        {campo('Taxas/impostos', taxas, setTaxas)}
      </div>
      {erro && <p className="text-sm" style={{ color: 'var(--ada-error-text)' }}>{erro}</p>}
      <button type="button" onClick={salvar} disabled={salvando}
        className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        style={{ background: 'var(--sb-accent)' }}>
        {salvando ? 'Salvando...' : 'Salvar alvos'}
      </button>
    </div>
  )
}
