import { useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'

interface NeuralMeshProps {
  ativo: boolean
}

/**
 * Malha neural sobreposta ao globo: nós distribuídos uniformemente sobre o
 * hemisfério frontal de uma esfera unitária, conectados aos vizinhos mais
 * próximos em distância 3D (conexões curtas → densidade sináptica, nunca
 * rotas continentais). Cada sinapse pulsa independentemente via SMIL
 * (dispara → brilha → escurece), simulando atividade neuronal.
 *
 * A profundidade (z da amostragem esférica) modula tamanho do neurônio,
 * espessura e opacidade da sinapse — criando volume tridimensional em SVG
 * puro, sem custo de JS por frame.
 */
export function NeuralMesh({ ativo }: NeuralMeshProps) {
  const motionReduzido = useReducedMotion()
  const malha = useMemo(() => gerarMalha(), [])

  if (!ativo) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div style={{ width: '100%', maxWidth: 560, aspectRatio: '1' }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
          aria-hidden="true"
          style={{ mixBlendMode: 'screen' }}
        >
          <defs>
            <radialGradient id="glow-neuron" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="rgba(190, 230, 255, 0.95)" />
              <stop offset="55%"  stopColor="rgba(80, 180, 230, 0.38)"  />
              <stop offset="100%" stopColor="rgba(56, 153, 204, 0)"     />
            </radialGradient>
          </defs>

          {/* Sinapses — pulsam independentemente */}
          <g>
            {malha.arestas.map((a, idx) => {
              const na = malha.nos[a.i]
              const nb = malha.nos[a.j]
              const profMedia = ((na.z + nb.z) / 2 + 1) / 2
              const baseOp = 0.06 + profMedia * 0.12
              const peakOp = a.opacidadePico * (0.4 + profMedia * 0.6)
              return (
                <line
                  key={idx}
                  x1={projX(na.x)} y1={projY(na.y)}
                  x2={projX(nb.x)} y2={projY(nb.y)}
                  stroke="rgb(140, 215, 245)"
                  strokeWidth={0.08 + profMedia * 0.14}
                  strokeOpacity={motionReduzido ? (baseOp + peakOp) / 2 : baseOp}
                  strokeLinecap="round"
                >
                  {!motionReduzido && (
                    <animate
                      attributeName="stroke-opacity"
                      values={`${baseOp};${peakOp};${baseOp}`}
                      dur={`${a.duracao}s`}
                      begin={`${a.atraso}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </line>
              )
            })}
          </g>

          {/* Neurônios — glow + core */}
          <g>
            {malha.nos.map((n, i) => {
              const prof = (n.z + 1) / 2
              const rGlow = 0.55 + prof * 0.75
              const rCore = 0.16 + prof * 0.22
              const opBase = 0.22 + prof * 0.30
              const opPico = 0.55 + prof * 0.40
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
                        values={`${opBase};${opPico};${opBase}`}
                        dur={`${pulse.duracao}s`}
                        begin={`${pulse.atraso}s`}
                        repeatCount="indefinite"
                      />
                    )}
                  </circle>
                  <circle
                    cx={projX(n.x)} cy={projY(n.y)}
                    r={rCore}
                    fill="rgba(225, 245, 255, 0.92)"
                  />
                </g>
              )
            })}
          </g>
        </svg>
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

const RAIO_VB = 41          // raio em % do viewBox 100 (casa com silhueta visível do globo)
const NUM_NOS_ALVO = 62
const MAX_AMOSTRAS = 260
const Z_MIN = -0.18         // permite alguns nós na borda da silhueta
const DIST_MIN_3D = 0.26    // separação mínima entre nós (evita aglomeração)
const K_VIZINHOS = 3
const DIST_MAX_ARESTA = 0.46 // conexões curtas: mantém feel sináptico, não rota

// Mulberry32 — PRNG deterministico, 32 bits, rápido
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
  // Distribuição uniforme em área de esfera
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
        duracao: 1.8 + rng() * 3.4,
        atraso: rng() * 6,
        opacidadePico: 0.4 + rng() * 0.55,
      })
    }
  })

  const pulsosNo = nos.map(() => ({
    duracao: 2 + rng() * 2.5,
    atraso: rng() * 4,
  }))

  return { nos, arestas, pulsosNo }
}

// Projeção esfera → viewBox (SVG y cresce pra baixo; invertemos)
function projX(x: number): number {
  return 50 + x * RAIO_VB
}
function projY(y: number): number {
  return 50 - y * RAIO_VB
}
