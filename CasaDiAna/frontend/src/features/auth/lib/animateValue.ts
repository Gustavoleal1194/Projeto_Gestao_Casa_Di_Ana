export function animateValue(
  from: number,
  to: number,
  duration: number,
  onUpdate: (value: number) => void
): Promise<void> {
  return new Promise(resolve => {
    const start = performance.now()
    function step(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      onUpdate(from + (to - from) * eased)
      if (t < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}
