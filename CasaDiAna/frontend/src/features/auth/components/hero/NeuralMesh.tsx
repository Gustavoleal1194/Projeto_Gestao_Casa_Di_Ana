import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface NeuralMeshProps {
  ativo: boolean
}

/**
 * Malha neural sobreposta ao globo: nós distribuídos uniformemente sobre o
 * hemisfério frontal de uma esfera unitária, conectados aos vizinhos mais
 * próximos em distância 3D (conexões curtas → sinapses, nunca rotas).
 *
 * Cada aresta pulsa com perfil de *spike* (rise rápido → pico → decay longo)
 * em vez de onda senoidal — fica com cara de disparo neuronal, não de
 * gradiente pulsante.
 *
 * A profundidade z modula tamanho, espessura e opacidade, criando volume
 * tridimensional em SVG puro — zero JS por frame. Todo o grupo respira em
 * ciclo lento (scale 1 ↔ 1.012) para não ficar estático entre disparos.
 */
export function NeuralMesh({ ativo }: NeuralMeshProps) {
  const motionReduzido = useReducedMotion()
  const malha = useMemo(() => gerarMalha(), [])

  if (!ativo) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div style={{ width: '100%', maxWidth: 560, aspectRatio: '1' }}>
        <motion.svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
          aria-hidden="true"
          style={{ mixBlendMode: 'screen', isolation: 'isolate' }}
          animate={motionReduzido ? undefined : { scale: [1, 1.012, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <defs>
            <radialGradient id="glow-neuron" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="rgba(200, 235, 255, 0.95)" />
              <stop offset="55%"  stopColor="rgba(90, 185, 230, 0.35)"  />
              <stop offset="100%" stopColor="rgba(56, 153, 204, 0)"     />
            </radialGradient>
          </defs>

          {/* Sinapses — spike com rise rápido, pico curto, decay longo */}
          <g>
            {malha.arestas.map((a, idx) => {
              const na = malha.nos[a.i]
              const nb = malha.nos[a.j]
              const profMedia = ((na.z + nb.z) / 2 + 1) / 2
              const baseOp = 0.05 + profMedia * 0.10
              const peakOp = a.opacidadePico * (0.35 + profMedia * 0.60)
              return (
                <line
                  key={idx}
                  x1={projX(na.x)} y1={projY(na.y)}
                  x2={projX(nb.x)} y2={projY(nb.y)}
                  stroke="rgb(150, 220, 250)"
                  strokeWidth={0.05 + profMedia * 0.09}
                  strokeOpacity={motionReduzido ? (baseOp + peakOp) / 2 : baseOp}
                  strokeLinecap="round"
                >
                  {!motionReduzido && (
                    <animate
                      attributeName="stroke-opacity"
                      values={`${baseOp};${peakOp};${peakOp * 0.7};${baseOp}`}
                      keyTimes="0;0.12;0.22;1"
                      dur={`${a.duracao}s`}
                      begin={`${a.atraso}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </line>
              )
            })}
          </g>

          {/* Neurônios — glow volumétrico + core discreto */}
          <g>
            {malha.nos.map((n, i) => {
              const prof = (n.z + 1) / 2
              const rGlow = 0.45 + prof * 0.60
              const rCore = 0.11 + prof * 0.17
              const opBase = 0.18 + prof * 0.28
              const opPico = 0.55 + prof * 0.38
              const pulse = malha.pulsosNo[i]
              return (
                <g key={i}>
                  <circle
                    cx={projX(n.x)} cy={projY(n.y)}
                    r={rGlow}
                    fill="url(#glow-neuron)"
                    opacity={motionReduzido ? (opBase + opPico) / 2 : opBase}
                  >
                    {!motionReduzido && (
                      <animate
                        attributeName="opacity"
                        values={`${opBase};${opPico};${(opBase + opPico) / 2};${opBase}`}
                        keyTimes="0;0.15;0.35;1"
                        dur={`${pulse.duracao}s`}
                        begin={`${pulse.atraso}s`}
                        repeatCount="indefinite"
                      />
                    )}
                  </circle>
                  <circle
                    cx={projX(n.x)} cy={projY(n.y)}
                    r={rCore}
                    fill="rgba(210, 240, 255, 0.78)"
                  />
                </g>
              )
            })}
          </g>
        </motion.svg>
      </div>
    </div>
  )
}

// ─── Geração da malha (uma vez, determinística via PRNG com seed fixa) ─────

interface No3D {
  x: number  // -1..1
  y: number  // -1..1
  z: number  // -1..1 (>0 = frente, <0 = atrás, -ZMIN..1 = hemisfério frontal)
}

interface Sinapse {
  i: number
  j: number
  duracao: number
  atraso: number
  opacidadePico: number
}

interface DadosMalha {
  nos: No3D[]
  arestas: Sinapse[]
  pulsosNo: Array<{ duracao: number; atraso: number }>
}

const RAIO_VB = 42          // raio em % do viewBox 100 — casa com silhueta visível do globo
const NUM_NOS_ALVO = 74     // densidade alta: densidade ~1 nó por 24 u² de disco
const MAX_AMOSTRAS = 360
const Z_MIN = -0.22         // inclui nós na borda → mesh "envolve" a esfera
const DIST_MIN_3D = 0.23    // separação mínima 3D (evita aglomeração)
const K_VIZINHOS = 3
const DIST_MAX_ARESTA = 0.42 // conexões curtas: feel sináptico, nunca rota

// Mulberry32 — PRNG determinístico, 32 bits, rápido
function criarPrng(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function amostrarEsfera(rng: () => number): No3D {
  const z = rng() * 2 - 1
  const theta = rng() * Math.PI * 2
  const r = Math.sqrt(1 - z * z)
  return { x: r * Math.cos(theta), y: r * Math.sin(theta), z }
}

function dist3D(a: No3D, b: No3D): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function gerarMalha(): DadosMalha {
  const rng = criarPrng(1337)
  const nos: No3D[] = []

  for (let t = 0; t < MAX_AMOSTRAS && nos.length < NUM_NOS_ALVO; t++) {
    const candidato = amostrarEsfera(rng)
    if (candidato.z < Z_MIN) continue
    let colide = false
    for (const existente of nos) {
      if (dist3D(existente, candidato) < DIST_MIN_3D) {
        colide = true
        break
      }
    }
    if (!colide) nos.push(candidato)
  }

  // Arestas: k vizinhos mais próximos em 3D, limitadas por DIST_MAX_ARESTA
  const chaves = new Set<string>()
  const arestas: Sinapse[] = []

  nos.forEach((no, i) => {
    const vizinhos = nos
      .map((outro, j) => ({ j, d: i === j ? Infinity : dist3D(no, outro) }))
      .filter((v) => v.d <= DIST_MAX_ARESTA)
      .sort((a, b) => a.d - b.d)
      .slice(0, K_VIZINHOS)

    for (const { j } of vizinhos) {
      const a = Math.min(i, j)
      const b = Math.max(i, j)
      const chave = `${a}-${b}`
      if (chaves.has(chave)) continue
      chaves.add(chave)
      arestas.push({
        i: a,
        j: b,
        duracao: 2.0 + rng() * 3.6,
        atraso: rng() * 7,
        opacidadePico: 0.45 + rng() * 0.50,
      })
    }
  })

  const pulsosNo = nos.map(() => ({
    duracao: 2.2 + rng() * 2.8,
    atraso: rng() * 5,
  }))

  return { nos, arestas, pulsosNo }
}

function projX(x: number): number {
  return 50 + x * RAIO_VB
}
function projY(y: number): number {
  return 50 - y * RAIO_VB  // SVG y cresce pra baixo; inverte
}
