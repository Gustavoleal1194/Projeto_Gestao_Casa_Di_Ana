import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { SHELVES, PACKETS, STATUS_ITEMS, GONE_IDS } from './warehouse.data'
import { Shelf } from './Shelf'
import { Robot } from './Robot'
import { DataPacket } from './DataPacket'
import { ScanRay } from './ScanRay'
import { DustParticles } from './DustParticles'

// Marca local da cena (variante contextual do logo — não é o mesmo SVG de outras telas).
function BrandMark() {
  return (
    <div className="lr-bm">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 3c0 1.5 2 1.5 2 3M11 3c0 1.5 2 1.5 2 3" />
        <path d="M4 8h14v8a4 4 0 01-4 4H8a4 4 0 01-4-4V8z" />
        <path d="M18 11h2.5a2.5 2.5 0 010 5H18" />
      </svg>
    </div>
  )
}

/** Painel esquerdo decorativo. aria-hidden: leitor de tela vai direto ao form. */
export function WarehouseScene() {
  const reduced = usePrefersReducedMotion()
  const [goneIds, setGoneIds] = useState<Set<string>>(() => new Set(GONE_IDS))
  const [landingIds, setLandingIds] = useState<Set<string>>(() => new Set())
  const [ops, setOps] = useState(347)

  // Ciclo de reabastecimento — uma caixa volta a cada 2.2s e some de novo após 5s.
  useEffect(() => {
    if (reduced) return
    let cycle = 0
    const pending = new Set<ReturnType<typeof setTimeout>>()

    const tick = setInterval(() => {
      const id = GONE_IDS[cycle % GONE_IDS.length]
      cycle++
      setGoneIds(prev => { const next = new Set(prev); next.delete(id); return next })
      setLandingIds(prev => new Set(prev).add(id))

      const t1 = setTimeout(() => {
        setLandingIds(prev => { const n = new Set(prev); n.delete(id); return n })
        pending.delete(t1)
      }, 400)
      const t2 = setTimeout(() => {
        setGoneIds(prev => new Set(prev).add(id))
        pending.delete(t2)
      }, 5000)
      pending.add(t1)
      pending.add(t2)
    }, 2200)

    return () => {
      clearInterval(tick)
      pending.forEach(clearTimeout)
    }
  }, [reduced])

  // Contador de operações ativas.
  useEffect(() => {
    if (reduced) return
    const tick = setInterval(() => {
      setOps(n => n + Math.floor(Math.random() * 3) + 1)
    }, 2800)
    return () => clearInterval(tick)
  }, [reduced])

  // Em reduced-motion, todas as caixas presentes (cena estática "cheia").
  const effectiveGone = reduced ? new Set<string>() : goneIds

  return (
    <div className="lr-scene" aria-hidden="true">
      <div className="lr-brand">
        <BrandMark />
        <div>
          <div className="lr-brand-name">Casa di Ana</div>
          <div className="lr-brand-sub">Sistema · Estoque</div>
        </div>
      </div>

      <div className="lr-telem">
        <div className="tlabel">Operações</div>
        <div className="tval">{ops.toLocaleString('pt-BR')} · ativas</div>
      </div>

      <div className="lr-floor" />
      <div className="lr-horizon" />
      <div className="lr-horizon-soft" />
      <DustParticles animate={!reduced} />

      <div className="lr-shelves">
        {SHELVES.map(s => (
          <Shelf key={s.position} config={s} goneIds={effectiveGone} landingIds={landingIds} />
        ))}
      </div>

      <ScanRay ray="r1" />
      <ScanRay ray="r2" />

      {PACKETS.map(p => (
        <DataPacket key={p.slot} {...p} />
      ))}

      <Robot variant="walker" path="r1" holding="amber" scanEyes screen="green" bounceMs={380} />
      <Robot variant="forklift" path="r2" holding="purple" screen="amber" bounceMs={420} />

      <div className="lr-scene-tag">
        <div className="lr-eyebrow"><span className="ld" />Operações autônomas · 24/7</div>
        <div className="lr-scene-h">Seu estoque <em>nunca dorme</em></div>
        <p className="lr-scene-p">
          Enquanto você descansa, nossos sistemas inteligentes organizam, contam e
          etiquetam cada item — em sincronia perfeita com a operação da sua cafeteria.
        </p>
      </div>

      <div className="lr-statusbar">
        {STATUS_ITEMS.map(s => (
          <span className="it" key={s.label}>
            {s.dot && <span className="d" />}
            {s.label} <b>{s.value}</b>
          </span>
        ))}
      </div>
    </div>
  )
}
