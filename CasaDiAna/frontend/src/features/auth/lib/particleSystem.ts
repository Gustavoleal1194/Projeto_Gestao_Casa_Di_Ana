interface Particle {
  x: number; y: number
  vx: number; vy: number
  r: number
  life: number
  decay: number
  color: string
  type: 'circle' | 'spark' | 'diamond'
  rot: number
  rotV: number
  gravity: number
  glow: boolean
}

export interface BurstOpts {
  colors: string[]
  speed?: number
  minR?: number
  maxR?: number
  gravity?: number
  glow?: boolean
  fastDecay?: boolean
  type?: Particle['type']
}

export interface ParticleSystem {
  burst(x: number, y: number, count: number, opts: BurstOpts): void
  startAmbient(color: string): void
  stopAmbient(): void
  destroy(): void
}

export function createParticleSystem(canvas: HTMLCanvasElement): ParticleSystem {
  const ctx = canvas.getContext('2d')!
  let parts: Particle[] = []
  let rafId = 0
  let ambientId: ReturnType<typeof setInterval> | null = null

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    parts = parts.filter(p => p.life > 0)
    for (const p of parts) {
      p.vx *= 0.96
      p.vy *= 0.96
      p.vy += p.gravity
      p.x += p.vx
      p.y += p.vy
      p.rot += p.rotV
      p.life -= p.decay

      ctx.save()
      ctx.globalAlpha = Math.max(0, p.life)
      if (p.glow) { ctx.shadowBlur = 8; ctx.shadowColor = p.color }
      ctx.fillStyle = p.color
      ctx.strokeStyle = p.color
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)

      if (p.type === 'diamond') {
        ctx.beginPath()
        ctx.moveTo(0, -p.r * 1.4)
        ctx.lineTo(p.r * 0.8, 0)
        ctx.lineTo(0, p.r * 1.4)
        ctx.lineTo(-p.r * 0.8, 0)
        ctx.closePath()
        ctx.fill()
      } else if (p.type === 'spark') {
        ctx.lineWidth = p.r * 0.5
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(-p.r * 2, 0)
        ctx.lineTo(p.r * 2, 0)
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
    rafId = requestAnimationFrame(loop)
  }
  rafId = requestAnimationFrame(loop)

  function spawnParticle(x: number, y: number, opts: BurstOpts, upward = false): Particle {
    const speed = opts.speed ?? 6
    return {
      x, y,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed - (upward ? 1.5 : 0),
      r: Math.random() * ((opts.maxR ?? 4) - (opts.minR ?? 1.5)) + (opts.minR ?? 1.5),
      life: 1,
      decay: Math.random() * 0.018 + (opts.fastDecay ? 0.022 : 0.010),
      color: opts.colors[Math.floor(Math.random() * opts.colors.length)],
      type: opts.type ?? 'circle',
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.15,
      gravity: opts.gravity ?? 0.08,
      glow: opts.glow ?? false,
    }
  }

  return {
    burst(x, y, count, opts) {
      for (let i = 0; i < count; i++) parts.push(spawnParticle(x, y, opts))
    },
    startAmbient(color) {
      ambientId = setInterval(() => {
        const x = Math.random() * canvas.width
        parts.push(spawnParticle(x, canvas.height, {
          colors: [color], speed: 1.5, minR: 1, maxR: 2.5,
          gravity: -0.02, glow: true,
        }, true))
      }, 120)
    },
    stopAmbient() {
      if (ambientId) { clearInterval(ambientId); ambientId = null }
    },
    destroy() {
      cancelAnimationFrame(rafId)
      if (ambientId) clearInterval(ambientId)
      parts = []
    },
  }
}
