import { useState, useRef, useEffect, useCallback } from 'react'
import { animateValue } from '../../lib/animateValue'
import { createParticleSystem, type ParticleSystem } from '../../lib/particleSystem'

type AuthState = 'idle' | 'verifying' | 'success' | 'failure'

const CIRC = 283

interface TokenResult { token: string; nome: string; papel: string }

interface Props {
  tokenTemporario: string
  verificarOtp: (codigo: string, token: string) => Promise<TokenResult>
  onSuccess: (token: string, nome: string, papel: string) => void
  onVoltar: () => void
}

function CoffeeIcon() {
  return (
    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 4c0 0 .4-1.5 1.5-1.5s1.5 1.5 1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 8.5h12v8.5a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 014 17V8.5z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 11h2a1.5 1.5 0 010 3h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function TwoFactorPanel({ tokenTemporario, verificarOtp, onSuccess, onVoltar }: Props) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [authState, setAuthState] = useState<AuthState>('idle')
  const [ringProgress, setRingProgress] = useState(0)
  const [ringColor, setRingColor] = useState('#D4960C')
  const [iconPhase, setIconPhase] = useState<'lock' | 'check' | 'x'>('lock')
  const [iconBg, setIconBg] = useState('rgba(255,255,255,0.04)')
  const [iconBorder, setIconBorder] = useState('rgba(255,255,255,0.10)')
  const [showScan, setShowScan] = useState(false)
  const [showDots, setShowDots] = useState(false)
  const [activeDot, setActiveDot] = useState(0)
  const [digitStyle, setDigitStyle] = useState<'idle' | 'success' | 'failure'>('idle')
  const [cardShake, setCardShake] = useState(false)
  const [pulseActive, setPulseActive] = useState(false)
  const [pulseColor, setPulseColor] = useState('#4ADE80')
  const [cardGlow, setCardGlow] = useState<'none' | 'success' | 'failure'>('none')
  const [statusText, setStatusText] = useState('')
  const [statusColor, setStatusColor] = useState('#4ADE80')
  const [resultOpen, setResultOpen] = useState(false)
  const [resultType, setResultType] = useState<'success' | 'failure' | null>(null)
  const [checkVisible, setCheckVisible] = useState(false)
  const [xVisible, setXVisible] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)
  const particleRef = useRef<ParticleSystem | null>(null)
  const dotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ringProgressRef = useRef(0)

  useEffect(() => { ringProgressRef.current = ringProgress }, [ringProgress])

  useEffect(() => {
    if (!canvasRef.current) return
    const ps = createParticleSystem(canvasRef.current)
    particleRef.current = ps
    return () => ps.destroy()
  }, [])

  useEffect(() => {
    if (authState === 'idle') {
      setTimeout(() => inputRefs.current[0]?.focus(), 80)
    }
  }, [authState])

  const stopDots = () => {
    if (dotIntervalRef.current) { clearInterval(dotIntervalRef.current); dotIntervalRef.current = null }
  }

  const startDots = () => {
    let idx = 0
    dotIntervalRef.current = setInterval(() => {
      idx = (idx + 1) % 3
      setActiveDot(idx)
    }, 280)
  }

  const resetState = useCallback(() => {
    setDigits(['', '', '', '', '', ''])
    setAuthState('idle')
    setRingProgress(0)
    setRingColor('#D4960C')
    setIconPhase('lock')
    setIconBg('rgba(255,255,255,0.04)')
    setIconBorder('rgba(255,255,255,0.10)')
    setShowScan(false)
    setShowDots(false)
    stopDots()
    setActiveDot(0)
    setDigitStyle('idle')
    setCardShake(false)
    setPulseActive(false)
    setCardGlow('none')
    setStatusText('')
    setResultOpen(false)
    setResultType(null)
    setCheckVisible(false)
    setXVisible(false)
    particleRef.current?.stopAmbient()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fireParticles = useCallback((type: 'success' | 'failure') => {
    if (!iconRef.current || !particleRef.current) return
    const rect = iconRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const ps = particleRef.current

    if (type === 'success') {
      const colors = ['#D4960C', '#4ADE80', '#F0B030', '#ffffff']
      for (let i = 0; i < 8; i++) {
        setTimeout(() => ps.burst(cx, cy, 12, { colors, speed: 7, glow: true, gravity: 0.07 }), i * 40)
      }
      for (let i = 0; i < 24; i++) {
        setTimeout(() => {
          const angle = (i / 24) * Math.PI * 2
          const r = 55
          ps.burst(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 3,
            { colors: ['#F0B030', '#4ADE80'], speed: 1.5, minR: 0.8, maxR: 2, gravity: 0.01 })
        }, i * 25)
      }
    } else {
      const colors = ['#EF4444', '#DC2626', '#FCA5A5']
      for (let i = 0; i < 12; i++) {
        setTimeout(() => ps.burst(cx, cy, 8, { colors, speed: 5, fastDecay: true, gravity: 0.12, glow: true }), i * 30)
      }
    }
  }, [])

  const runSuccess = useCallback(async (result: TokenResult) => {
    await animateValue(ringProgressRef.current, 1, 600, v => setRingProgress(v))
    setShowScan(false)
    setShowDots(false)
    stopDots()

    await new Promise(r => setTimeout(r, 120))
    setRingColor('#4ADE80')
    setPulseColor('#4ADE80')
    setPulseActive(true)
    setIconBg('rgba(22,163,74,0.15)')
    setIconBorder('rgba(74,222,128,0.35)')

    await new Promise(r => setTimeout(r, 80))
    setIconPhase('check')
    await new Promise(r => setTimeout(r, 50))
    setCheckVisible(true)

    await new Promise(r => setTimeout(r, 100))
    fireParticles('success')

    await new Promise(r => setTimeout(r, 100))
    setDigitStyle('success')
    setCardGlow('success')
    setStatusText('Identidade confirmada')
    setStatusColor('#4ADE80')
    particleRef.current?.startAmbient('#4ADE80')

    await new Promise(r => setTimeout(r, 600))
    setResultType('success')
    setResultOpen(true)

    await new Promise(r => setTimeout(r, 500))
    onSuccess(result.token, result.nome, result.papel)
  }, [fireParticles, onSuccess])

  const runFailure = useCallback(async () => {
    setRingColor('#EF4444')
    await animateValue(ringProgressRef.current, 0.62, 200, v => setRingProgress(v))
    setShowScan(false)
    setShowDots(false)
    stopDots()

    await new Promise(r => setTimeout(r, 200))
    setIconBg('rgba(239,68,68,0.12)')
    setIconBorder('rgba(252,165,165,0.30)')
    setCardShake(true)
    setTimeout(() => setCardShake(false), 420)
    setPulseColor('#EF4444')
    setPulseActive(true)

    await new Promise(r => setTimeout(r, 110))
    setIconPhase('x')
    await new Promise(r => setTimeout(r, 50))
    setXVisible(true)

    await new Promise(r => setTimeout(r, 90))
    fireParticles('failure')

    await new Promise(r => setTimeout(r, 100))
    setDigitStyle('failure')
    setCardGlow('failure')
    setStatusText('Código incorreto')
    setStatusColor('#EF4444')

    await new Promise(r => setTimeout(r, 500))
    setResultType('failure')
    setResultOpen(true)

    await new Promise(r => setTimeout(r, 3000))
    resetState()
  }, [fireParticles, resetState])

  const handleVerify = useCallback(async (code: string) => {
    setAuthState('verifying')
    setShowScan(true)
    setShowDots(true)
    startDots()

    const minWait = animateValue(0, 0.85, 1200, v => setRingProgress(v))

    let result: TokenResult | null = null
    let failed = false
    const apiCall = verificarOtp(code, tokenTemporario)
      .then(r => { result = r })
      .catch(() => { failed = true })

    await Promise.all([minWait, apiCall])

    if (!failed && result) {
      await runSuccess(result)
    } else {
      setAuthState('failure')
      await runFailure()
    }
  }, [tokenTemporario, verificarOtp, runSuccess, runFailure]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDigitChange = (index: number, raw: string) => {
    if (authState !== 'idle') return
    const v = raw.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = v
    setDigits(next)
    if (v && index < 5) inputRefs.current[index + 1]?.focus()
    if (next.every(d => d !== '')) handleVerify(next.join(''))
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      handleVerify(pasted)
    }
  }

  const isLocked = authState !== 'idle'

  const cardShadow = cardGlow === 'success'
    ? '0 0 0 1px rgba(74,222,128,0.20), 0 0 60px rgba(22,163,74,0.25), 0 32px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)'
    : cardGlow === 'failure'
    ? '0 0 0 1px rgba(239,68,68,0.25), 0 0 60px rgba(239,68,68,0.20), 0 32px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)'
    : '0 0 0 1px rgba(212,150,12,0.08), 0 32px 64px rgba(0,0,0,0.55), 0 8px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)'

  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: 9999, width: '100vw', height: '100vh' }}
        width={typeof window !== 'undefined' ? window.innerWidth : 1440}
        height={typeof window !== 'undefined' ? window.innerHeight : 900}
      />

      <div
        className={cardShake ? 'shake' : ''}
        style={{
          background: 'rgba(11,17,28,0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '24px',
          padding: '44px 40px 40px',
          boxShadow: cardShadow,
          transition: 'box-shadow 500ms ease',
          textAlign: 'center',
        }}
      >
        <div className="inline-flex items-center gap-2.5 mb-8">
          <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #D4960C, #B87D0A)', boxShadow: '0 4px 12px rgba(212,150,12,0.35)' }}>
            <CoffeeIcon />
          </div>
          <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.90)', fontFamily: 'Sora, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
            Casa di Ana
          </span>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 mb-4"
            style={{ background: 'rgba(212,150,12,0.08)', border: '1px solid rgba(212,150,12,0.25)', color: '#F0B030', fontFamily: 'Sora, system-ui, sans-serif', fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#D4960C' }} />
            Verificação em dois fatores
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ color: '#fff', fontFamily: 'Sora, system-ui, sans-serif', letterSpacing: '-0.02em', transition: 'color 400ms' }}>
          Código de acesso
        </h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.50)', lineHeight: 1.55 }}>
          Digite o código de 6 dígitos do app autenticador.
        </p>

        <div className="flex flex-col items-center mb-6">
          <div className="relative" style={{ width: 100, height: 100 }}>
            <svg className="absolute inset-0 w-full h-full" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
              <circle cx="50" cy="50" r="45" fill="none"
                stroke={ringColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - ringProgress)}
                style={{ transition: 'stroke 600ms ease' }}
              />
            </svg>

            {pulseActive && (
              <>
                <div className="absolute rounded-full pointer-events-none"
                  style={{ inset: -10, border: `1.5px solid ${pulseColor}`, animation: 'pulseRing 700ms ease-out forwards' }} />
                <div className="absolute rounded-full pointer-events-none"
                  style={{ inset: -10, border: `1px solid ${pulseColor}`, animation: 'pulseRing 700ms ease-out 100ms forwards' }} />
              </>
            )}

            <div ref={iconRef} className="absolute flex items-center justify-center rounded-full overflow-hidden"
              style={{
                inset: 14,
                background: iconBg,
                border: `1.5px solid ${iconBorder}`,
                transition: 'background 400ms ease, border-color 400ms ease',
              }}>
              {showScan && (
                <div className="absolute left-2 right-2 h-[1.5px] rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, #D4960C 30%, #F0B030 50%, #D4960C 70%, transparent 100%)',
                    boxShadow: '0 0 8px #D4960C',
                    top: 8,
                    animation: 'scanLoop 800ms linear 3 forwards',
                  }} />
              )}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, transparent 60%)' }} />

              <svg viewBox="0 0 24 24" fill="none" className="absolute"
                style={{
                  width: 28, height: 28,
                  opacity: iconPhase === 'lock' ? 1 : 0,
                  transform: iconPhase === 'x' ? 'scale(0.8) rotate(-10deg)' : iconPhase === 'check' ? 'scale(0.7)' : 'scale(1)',
                  transition: 'opacity 200ms ease, transform 200ms ease',
                  stroke: '#D4960C', zIndex: 1,
                }}>
                <rect x="5" y="11" width="14" height="10" rx="2" strokeWidth="1.5" />
                <path d="M8 11V7a4 4 0 018 0v4" strokeWidth="1.5" strokeLinecap="round" />
              </svg>

              <svg viewBox="0 0 100 100" fill="none" className="absolute"
                style={{
                  width: 28, height: 28,
                  opacity: iconPhase === 'check' ? 1 : 0,
                  transform: iconPhase === 'check' ? 'scale(1)' : 'scale(0.5)',
                  transition: 'opacity 200ms ease, transform 350ms cubic-bezier(0.34,1.4,0.64,1)',
                  zIndex: 1,
                }}>
                <path d="M22 52 L42 70 L78 30"
                  stroke="#4ADE80" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="80"
                  strokeDashoffset={checkVisible ? 0 : 80}
                  style={{ transition: checkVisible ? 'stroke-dashoffset 450ms ease' : 'none' }}
                />
              </svg>

              <svg viewBox="0 0 100 100" fill="none" className="absolute"
                style={{
                  width: 28, height: 28,
                  opacity: iconPhase === 'x' ? 1 : 0,
                  transform: iconPhase === 'x' ? 'scale(1)' : 'scale(0.5)',
                  transition: 'opacity 150ms ease, transform 250ms cubic-bezier(0.34,1.4,0.64,1)',
                  zIndex: 1,
                }}>
                <path d="M28 28 L72 72 M72 28 L28 72"
                  stroke="#EF4444" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray="80"
                  strokeDashoffset={xVisible ? 0 : 80}
                  style={{ transition: xVisible ? 'stroke-dashoffset 350ms ease' : 'none' }}
                />
              </svg>
            </div>
          </div>

          {showDots && (
            <div className="flex items-center gap-1.5 mt-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: i === activeDot ? '#F0B030' : 'rgba(255,255,255,0.20)',
                    boxShadow: i === activeDot ? '0 0 8px #D4960C' : 'none',
                    animation: i === activeDot ? 'dotPulse 600ms ease infinite alternate' : 'none',
                  }} />
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2.5 justify-center mb-7" onPaste={handlePaste}>
          {digits.map((d, i) => {
            const isFilled = d !== ''
            const isActive = !isLocked && digits.findIndex(x => !x) === i
            const borderColor = digitStyle === 'success' ? 'rgba(74,222,128,0.6)'
              : digitStyle === 'failure' ? 'rgba(252,165,165,0.6)'
              : isActive ? '#D4960C'
              : isFilled ? 'rgba(212,150,12,0.35)'
              : 'rgba(255,255,255,0.10)'
            const bg = digitStyle === 'success' ? 'rgba(22,163,74,0.12)'
              : digitStyle === 'failure' ? 'rgba(239,68,68,0.12)'
              : isFilled ? 'rgba(212,150,12,0.06)'
              : 'rgba(255,255,255,0.04)'
            const color = digitStyle === 'success' ? '#4ADE80'
              : digitStyle === 'failure' ? '#FCA5A5'
              : '#F0B030'
            return (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                disabled={isLocked}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="text-center font-bold outline-none disabled:cursor-not-allowed"
                style={{
                  width: 52, height: 60,
                  background: bg,
                  border: `1.5px solid ${borderColor}`,
                  borderRadius: 12,
                  fontSize: 22,
                  fontFamily: 'Sora, monospace',
                  color,
                  boxShadow: isActive ? '0 0 0 3px rgba(212,150,12,0.15)' : 'none',
                  transition: `border-color 300ms ease, background 300ms ease, color 300ms ease`,
                  transitionDelay: `${i * 50}ms`,
                }}
              />
            )
          })}
        </div>

        <div style={{ height: 20, marginBottom: 24, overflow: 'hidden', position: 'relative' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{
              color: statusColor,
              fontFamily: 'Sora, system-ui, sans-serif',
              opacity: statusText ? 1 : 0,
              transform: statusText ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 300ms ease, transform 300ms ease',
            }}>
            {statusText}
          </p>
        </div>

        <div style={{
          maxHeight: resultOpen ? '200px' : 0,
          opacity: resultOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 500ms cubic-bezier(0.4,0,0.2,1), opacity 400ms ease',
        }}>
          {resultType === 'success' && (
            <div className="rounded-[14px] p-4 text-left mb-4"
              style={{ background: 'rgba(22,163,74,0.10)', border: '1px solid rgba(22,163,74,0.25)' }}>
              <p className="text-[13px] font-bold mb-1" style={{ color: '#4ADE80', fontFamily: 'Sora, system-ui, sans-serif' }}>
                ✓ Acesso liberado
              </p>
              <p className="text-[12.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Redirecionando para o sistema…
              </p>
            </div>
          )}
          {resultType === 'failure' && (
            <div className="rounded-[14px] p-4 text-left mb-4"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <p className="text-[13px] font-bold mb-1" style={{ color: '#FCA5A5', fontFamily: 'Sora, system-ui, sans-serif' }}>
                ✕ Acesso negado
              </p>
              <p className="text-[12.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Código incorreto. Aguarde para tentar novamente.
              </p>
            </div>
          )}
        </div>

        {authState === 'idle' && (
          <div className="mt-2">
            <button onClick={onVoltar}
              className="text-xs transition-opacity hover:opacity-60"
              style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Sora, system-ui, sans-serif' }}>
              ← Voltar ao login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
