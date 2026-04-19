import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { CAPITAIS } from '../../lib/globeConfig'
import type { RotacaoGlobo } from './Globe3DScene'

interface NeuralMeshProps {
  ativo: boolean
  rotationRef: RefObject<RotacaoGlobo>
}

/**
 * Malha neural ancorada à superfície da esfera.
 *
 * Os nós são gerados na esfera INTEIRA (Fibonacci sphere + jitter para
 * organicidade), e a cada frame são rotacionados pelo mesmo phi/theta que
 * o cobe usa no globo — rotação fica perfeitamente sincronizada.
 *
 * Após a rotação, a coordenada z de cada nó determina profundidade real:
 *  • z > +0.25  → nítido, nos "cume" do hemisfério frontal
 *  • z entre ±0.25 → fade progressivo pela silhueta
 *  • z < -0.25 → oculto, atrás do globo
 *
 * Arestas e nós são z-ordenados antes de desenhar, então elementos da
 * frente se sobrepõem aos de trás naturalmente — sem overlay 2D, sem
 * deslizar por cima da esfera.
 *
 * Pulsos de sinapse são calculados por tempo absoluto (não SMIL), com
 * perfil de spike (rise rápido, decay longo).
 */
export function NeuralMesh({ ativo, rotationRef }: NeuralMeshProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const malha = useMemo(() => gerarMalha(), [])

  useEffect(() => {
    if (!ativo) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let largCss = 0
    let altCss = 0

    const ajustarTamanho = () => {
      const dpr = window.devicePixelRatio || 1
      largCss = canvas.clientWidth
      altCss = canvas.clientHeight
      canvas.width = Math.max(1, Math.round(largCss * dpr))
      canvas.height = Math.max(1, Math.round(altCss * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    ajustarTamanho()
    const obs = new ResizeObserver(ajustarTamanho)
    obs.observe(canvas)

    const t0 = performance.now()
    let rafId = 0

    const desenhar = (agora: number) => {
      rafId = requestAnimationFrame(desenhar)
      const t = (agora - t0) / 1000

      const rot = rotationRef.current ?? { phi: 0, theta: 0.25 }
      const cosP = Math.cos(rot.phi)
      const sinP = Math.sin(rot.phi)
      const cosT = Math.cos(rot.theta)
      const sinT = Math.sin(rot.theta)

      const raio = Math.min(largCss, altCss) * 0.40
      const cx = largCss / 2
      const cy = altCss / 2

      ctx.clearRect(0, 0, largCss, altCss)

      // Rotaciona todos os nós uma vez por frame
      const rotacionados = new Array<NoRotacionado>(malha.nos.length)
      for (let i = 0; i < malha.nos.length; i++) {
        const n = malha.nos[i]
        // Rotação em torno de Y (phi) depois em torno de X (theta)
        const x1 =  n.x * cosP + n.z * sinP
        const z1 = -n.x * sinP + n.z * cosP
        const y2 =  n.y * cosT - z1 * sinT
        const z2 =  n.y * sinT + z1 * cosT
        rotacionados[i] = {
          x: cx + x1 * raio,
          y: cy - y2 * raio,   // SVG-like: y cresce pra baixo
          z: z2,
          vis: visibilidade(z2),
          primario: n.primario,
          sp: n.sp,
        }
      }

      // Arestas z-ordenadas (atrás primeiro)
      const arestasComZ = malha.arestas.map((a) => ({
        a,
        zm: (rotacionados[a.i].z + rotacionados[a.j].z) / 2,
      }))
      arestasComZ.sort((p, q) => p.zm - q.zm)

      ctx.lineCap = 'round'
      for (const { a } of arestasComZ) {
        const na = rotacionados[a.i]
        const nb = rotacionados[a.j]
        const visMedia = (na.vis + nb.vis) / 2
        if (visMedia < 0.02) continue

        const profMedia = ((na.z + nb.z) / 2 + 1) / 2  // 0..1
        const intensidade = spike(t, a.duracao, a.atraso)

        const baseOp = (0.08 + profMedia * 0.18) * visMedia
        const peakOp = a.opacidadePico * (0.55 + profMedia * 0.45) * visMedia
        const op = baseOp + (peakOp - baseOp) * intensidade
        ctx.strokeStyle = `rgba(200, 230, 255, ${op})`
        ctx.lineWidth = 0.90 + profMedia * 1.10

        ctx.beginPath()
        ctx.moveTo(na.x, na.y)
        ctx.lineTo(nb.x, nb.y)
        ctx.stroke()
      }

      // Nós z-ordenados (atrás primeiro)
      const nosSort = rotacionados
        .map((n, i) => ({ n, i }))
        .sort((p, q) => p.n.z - q.n.z)

      const dim = Math.min(largCss, altCss)

      for (const { n, i } of nosSort) {
        if (n.vis < 0.02) continue

        const profNorm = (n.z + 1) / 2
        const pulse = malha.pulsosNo[i]
        const intensidade = spikeNo(t, pulse.duracao, pulse.atraso)

        if (n.sp) {
          // São Paulo — hub principal: glow dominante âmbar-dourado + anel pulsante
          const opBase = 0.60 + profNorm * 0.30
          const opPico = 1.00
          const op = (opBase + (opPico - opBase) * intensidade) * n.vis

          // Anel externo pulsante (expande e some no ritmo do spike)
          const rAnel = (2.8 + profNorm * 1.2 + intensidade * 1.8) / 100 * dim
          ctx.strokeStyle = `rgba(255, 200, 60, ${0.28 * intensidade * n.vis})`
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.arc(n.x, n.y, rAnel, 0, Math.PI * 2)
          ctx.stroke()

          // Glow amplo dourado
          const rGlow = (2.80 + profNorm * 1.40) / 100 * dim
          const rCore = (0.52 + profNorm * 0.36) / 100 * dim
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, rGlow)
          grad.addColorStop(0,    `rgba(255, 230, 120, ${0.98 * op})`)
          grad.addColorStop(0.22, `rgba(255, 200,  80, ${0.80 * op})`)
          grad.addColorStop(0.55, `rgba(220, 140,  40, ${0.35 * op})`)
          grad.addColorStop(0.82, `rgba(150,  90,  20, ${0.12 * op})`)
          grad.addColorStop(1,    'rgba(80, 40, 0, 0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(n.x, n.y, rGlow, 0, Math.PI * 2)
          ctx.fill()

          // Núcleo quase-branco intenso
          const gradCore = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, rCore)
          gradCore.addColorStop(0,   `rgba(255, 255, 240, ${1.00 * n.vis})`)
          gradCore.addColorStop(0.5, `rgba(255, 235, 160, ${0.95 * n.vis})`)
          gradCore.addColorStop(1,   `rgba(255, 200,  80, 0)`)
          ctx.fillStyle = gradCore
          ctx.beginPath()
          ctx.arc(n.x, n.y, rCore, 0, Math.PI * 2)
          ctx.fill()

        } else if (n.primario) {
          // Nó principal: glow amplo, núcleo âmbar-branco com coroa cyan
          const opBase = 0.42 + profNorm * 0.30
          const opPico = 0.82 + profNorm * 0.18
          const op = (opBase + (opPico - opBase) * intensidade) * n.vis

          const rGlow = (1.45 + profNorm * 0.95) / 100 * dim
          const rCore = (0.30 + profNorm * 0.26) / 100 * dim

          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, rGlow)
          grad.addColorStop(0,    `rgba(255, 225, 160, ${0.92 * op})`)
          grad.addColorStop(0.28, `rgba(200, 235, 255, ${0.55 * op})`)
          grad.addColorStop(0.65, `rgba(80, 180, 230, ${0.25 * op})`)
          grad.addColorStop(1,    'rgba(56, 153, 204, 0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(n.x, n.y, rGlow, 0, Math.PI * 2)
          ctx.fill()

          // Núcleo quente — âmbar com punch de branco
          const gradCore = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, rCore)
          gradCore.addColorStop(0,   `rgba(255, 250, 230, ${0.95 * n.vis})`)
          gradCore.addColorStop(0.6, `rgba(255, 215, 140, ${0.88 * n.vis})`)
          gradCore.addColorStop(1,   `rgba(255, 180, 80, 0)`)
          ctx.fillStyle = gradCore
          ctx.beginPath()
          ctx.arc(n.x, n.y, rCore, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    rafId = requestAnimationFrame(desenhar)

    return () => {
      cancelAnimationFrame(rafId)
      obs.disconnect()
    }
  }, [ativo, rotationRef, malha])

  if (!ativo) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          width:       '100%',
          maxWidth:    '560px',
          aspectRatio: '1',
          mixBlendMode: 'screen',
          isolation: 'isolate',
        }}
      />
    </div>
  )
}

// ── Visibilidade e perfis temporais ───────────────────────────────────

/**
 * Converte z rotacionado em visibilidade perceptual:
 *   z >= 0.25  →  1.0 (front-center, nítido)
 *   z = 0      →  ~0.5 (silhueta, meio-fade)
 *   z <= -0.25 →  0.0 (back, oculto)
 * Curva quadrática pro meio → fade mais suave perto da silhueta.
 */
function visibilidade(z: number): number {
  if (z >= 0.25) return 1
  if (z <= -0.25) return 0
  const t = (z + 0.25) / 0.5  // 0..1
  return t * t * (3 - 2 * t)  // smoothstep
}

// Spike para sinapses: rise 12% → pico breve → decay 78%
function spike(t: number, dur: number, atraso: number): number {
  const fase = (((t - atraso) / dur) % 1 + 1) % 1
  if (fase < 0.12) return fase / 0.12
  if (fase < 0.22) return 1
  return Math.max(0, 1 - (fase - 0.22) / 0.78)
}

// Spike para nós: rise um pouco mais lento, decay mais amplo
function spikeNo(t: number, dur: number, atraso: number): number {
  const fase = (((t - atraso) / dur) % 1 + 1) % 1
  if (fase < 0.15) return fase / 0.15
  if (fase < 0.30) return 1 - (fase - 0.15) / 0.15 * 0.5
  // cotovelo de derivada intencional: decay rápido 0.15→0.30, lento 0.30→1.0
  return 0.5 * Math.max(0, 1 - (fase - 0.30) / 0.70)
}

// ── Geração da malha ──────────────────────────────────────────────────

interface No3D {
  x: number
  y: number
  z: number
}

interface NoMalha extends No3D {
  primario: boolean
  sp: boolean        // true apenas para São Paulo
}

interface NoRotacionado {
  x: number  // CSS px
  y: number  // CSS px
  z: number  // -1..1 após rotação
  vis: number // 0..1
  primario: boolean
  sp: boolean        // propagado para o render
}

interface Sinapse {
  i: number
  j: number
  duracao: number
  atraso: number
  opacidadePico: number
}

interface DadosMalha {
  nos: NoMalha[]
  arestas: Sinapse[]
  pulsosNo: Array<{ duracao: number; atraso: number }>
}

function criarPrng(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function latLngPara3D(lat: number, lng: number): No3D {
  // Convenção do cobe (lida do shader WebGL):
  // marcador em (lat, lng) é armazenado como (cos·cosλ, sinφ, -cos·sinλ).
  // Rotação: m = l * J(theta, phi) — multiplicação à direita, right-handed Y→X.
  // Raio do globo no canvas CSS = 0.40 × css_width (círculo c≤0.64 em a-space).
  const latR = (lat * Math.PI) / 180
  const lngR = (lng * Math.PI) / 180
  const cosLat = Math.cos(latR)
  return {
    x:  cosLat * Math.cos(lngR),
    y:  Math.sin(latR),
    z: -cosLat * Math.sin(lngR),
  }
}

// 30 conexões entre as capitais das 20 maiores potências (índices 0–19).
// 0:SP  1:Washington  2:Toronto     3:Cidade do México
// 4:Londres  5:Paris  6:Berlim      7:Roma       8:Madri
// 9:Amsterdã 10:Zurique 11:Moscou   12:Istambul  13:Riade
// 14:Nova Déli  15:Pequim  16:Seul  17:Tóquio    18:Jacarta  19:Sydney
const CONEXOES_HUB: [number, number][] = [
  // SP(0) — hub principal: 9 conexões
  [0,  1], [0,  2], [0,  4], [0,  5], [0, 10], [0, 13], [0, 15], [0, 17], [0, 19],
  // Corredor Americano
  [1,  2], [1,  3], [1,  4],
  // Europa Ocidental
  [4,  5], [4,  6], [4, 11], [4, 12],
  [5,  6],
  [6,  9], [9, 10],
  // Europa → Oriente Médio
  [11, 12], [11, 15],
  [12, 13],
  [13, 14],
  // Sul da Ásia / Ásia Oriental
  [14, 15], [14, 18],
  [15, 16], [15, 17],
  [16, 17],
  [17, 19],
  [18, 19],
]

function gerarMalha(): DadosMalha {
  const rng = criarPrng(1337)

  // Nós principais: capitais reais, ancorados em lat/lng fixos
  // São Paulo é sempre o índice 0
  const nos: NoMalha[] = CAPITAIS.map((c, idx) => ({
    ...latLngPara3D(c.lat, c.lng),
    primario: true,
    sp: idx === 0,
  }))

  const chaves = new Set<string>()
  const arestas: Sinapse[] = []

  for (const [i, j] of CONEXOES_HUB) {
    const a = Math.min(i, j)
    const b = Math.max(i, j)
    const chave = `${a}-${b}`
    if (chaves.has(chave)) continue
    chaves.add(chave)
    arestas.push({
      i: a,
      j: b,
      duracao: 2.5 + rng() * 2.5,
      atraso: rng() * 8,
      opacidadePico: 0.65 + rng() * 0.35,
    })
  }

  const pulsosNo = nos.map(() => ({
    duracao: 3.4 + rng() * 2.4,
    atraso: rng() * 6,
  }))

  return { nos, arestas, pulsosNo }
}
