import { useState } from 'react'
import { precificacaoService, type ConfiguracaoPrecificacao } from '../services/precificacaoService'

interface Props {
  config: ConfiguracaoPrecificacao
  /** Atualização ao vivo (preview da tabela enquanto digita, sem persistir). */
  onAlterar: (c: ConfiguracaoPrecificacao) => void
  /** Persistido no backend ao clicar em "Salvar alvos". */
  onSalvo: (c: ConfiguracaoPrecificacao) => void
}

const pct = (frac: number) => String(Math.round(frac * 1000) / 10) // 0.3 -> "30"
const toFrac = (s: string) => Number(s.replace(',', '.')) / 100
const fracaoValida = (v: number, permiteZero: boolean) =>
  Number.isFinite(v) && v < 1 && (permiteZero ? v >= 0 : v > 0)

export function ConfigPrecificacaoEditor({ config, onAlterar, onSalvo }: Props) {
  const [cmv, setCmv] = useState(pct(config.cmvAlvo))
  const [margem, setMargem] = useState(pct(config.margemDesejada))
  const [taxas, setTaxas] = useState(pct(config.taxas))
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Sempre que um alvo muda, atualiza a tabela ao vivo (se os 3 forem válidos).
  const emitir = (c: string, m: string, t: string) => {
    setSalvo(false)
    const cf = toFrac(c), mf = toFrac(m), tf = toFrac(t)
    if (fracaoValida(cf, false) && fracaoValida(mf, true) && fracaoValida(tf, true))
      onAlterar({ cmvAlvo: cf, margemDesejada: mf, taxas: tf })
  }

  const salvar = async () => {
    const body = { cmvAlvo: toFrac(cmv), margemDesejada: toFrac(margem), taxas: toFrac(taxas) }
    if (!fracaoValida(body.cmvAlvo, false) || !fracaoValida(body.margemDesejada, true) || !fracaoValida(body.taxas, true)) {
      setErro('Cada percentual deve estar entre 0 e 100% (CMV alvo acima de 0).')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      onSalvo(await precificacaoService.atualizarConfig(body))
      setSalvo(true)
    } catch {
      setErro('Erro ao salvar a configuração.')
    } finally {
      setSalvando(false)
    }
  }

  const campo = (label: string, value: string, onChange: (v: string) => void) => (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-body)' }}>{label} (%)</label>
      <input type="text" inputMode="decimal" value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
        style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }} />
    </div>
  )

  return (
    <div className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)' }}>Alvos de precificação</p>
        <p className="text-[11px]" style={{ color: 'var(--ada-muted)' }}>A tabela atualiza ao vivo · salve para manter</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {campo('CMV alvo', cmv, v => { setCmv(v); emitir(v, margem, taxas) })}
        {campo('Margem desejada', margem, v => { setMargem(v); emitir(cmv, v, taxas) })}
        {campo('Taxas/impostos', taxas, v => { setTaxas(v); emitir(cmv, margem, v) })}
      </div>
      {erro && <p className="text-sm" style={{ color: 'var(--ada-error-text)' }}>{erro}</p>}
      <button type="button" onClick={salvar} disabled={salvando}
        className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        style={{ background: salvo ? 'var(--ada-success-text, #16a34a)' : 'var(--sb-accent)' }}>
        {salvando ? 'Salvando...' : salvo ? 'Alvos salvos!' : 'Salvar alvos'}
      </button>
    </div>
  )
}
