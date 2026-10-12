import { useLayoutEffect, useRef } from 'react'

/*
 * Editorial hero art — Dorian Gray face on edge-faded glitch dust
 * (same halftone language as the What we do marks).
 */

const CELL = 5
const KERNEL = [
  [0, 0, 1],
  [1, 0, 0.45],
  [-1, 0, 0.45],
  [0, 1, 0.45],
  [0, -1, 0.45],
  [1, 1, 0.2],
  [-1, 1, 0.2],
  [1, -1, 0.2],
  [-1, -1, 0.2],
]

function css(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function makeRand(seed0) {
  let seed = seed0
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand())
  return { rand, gauss }
}

function paintDust(canvas) {
  const box = canvas.getBoundingClientRect()
  const W = box.width
  const H = box.height
  if (!W || !H) return

  const crimson = css('--color-crimson', '#990000')
  const ink = 'rgba(23, 23, 23, 0.22)'
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  const g = canvas.getContext('2d')
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.clearRect(0, 0, W, H)

  const { rand, gauss } = makeRand(43)
  const gw = Math.ceil(W / CELL) + 1
  const gh = Math.ceil(H / CELL) + 1
  const red = new Float32Array(gw * gh)
  const dark = new Float32Array(gw * gh)
  const splat = (grid, x, y, w) => {
    const cx = Math.round(x / CELL)
    const cy = Math.round(y / CELL)
    for (const [dx, dy, k] of KERNEL) {
      const gx = cx + dx
      const gy = cy + dy
      if (gx >= 0 && gy >= 0 && gx < gw && gy < gh) grid[gy * gw + gx] += w * k
    }
  }

  // Soft clouds behind where the bust sits — denser toward center, thins outward.
  const clusters = [
    [W * 0.5, H * 0.48, 160, 70],
    [W * 0.38, H * 0.42, 70, 32],
    [W * 0.62, H * 0.4, 68, 30],
    [W * 0.48, H * 0.68, 90, 40],
    [W * 0.28, H * 0.55, 55, 22],
    [W * 0.72, H * 0.58, 58, 24],
    [W * 0.5, H * 0.3, 50, 28],
    [W * 0.22, H * 0.35, 40, 20],
    [W * 0.78, H * 0.38, 42, 20],
  ]
  for (const [cx, cy, n, sigma] of clusters) {
    for (let i = 0; i < n; i += 1) {
      splat(red, cx + gauss() * sigma, cy + gauss() * sigma, 0.38)
    }
  }
  for (let i = 0; i < 48; i += 1) {
    const x = W * (0.08 + rand() * 0.84)
    const y = H * (0.1 + rand() * 0.8)
    const sigma = 16 + rand() * 28
    for (let j = 0; j < 14; j += 1) splat(dark, x + gauss() * sigma, y + gauss() * sigma, 0.22)
  }

  const screen = (grid, color, alpha, gain) => {
    g.fillStyle = color
    g.globalAlpha = alpha
    for (let y = 0; y < gh; y += 1) {
      for (let x = 0; x < gw; x += 1) {
        const v = grid[y * gw + x]
        if (v < 0.06) continue
        const d = Math.min(CELL - 1, Math.max(1, Math.round(Math.sqrt(v * gain) * CELL * 0.55)))
        g.fillRect(x * CELL - (d >> 1), y * CELL - (d >> 1), d, d)
      }
    }
  }
  screen(dark, ink, 0.42, 0.55)
  screen(red, crimson, 0.55, 0.65)
  g.globalAlpha = 1
}

function HeroDust() {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const draw = () => paintDust(canvas)
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{
        WebkitMaskImage: 'radial-gradient(ellipse 70% 66% at 50% 48%, #000 22%, transparent 76%)',
        maskImage: 'radial-gradient(ellipse 70% 66% at 50% 48%, #000 22%, transparent 76%)',
      }}
      aria-hidden="true"
    />
  )
}

export default function HeroVisual({ className = '' }) {
  return (
    <div
      className={`relative aspect-[5/4] w-full max-w-lg overflow-hidden rounded-sm bg-paper select-none ${className}`}
      aria-hidden="true"
    >
      <HeroDust />

      <img
        src="/hero-interpretability.png"
        alt=""
        width={1200}
        height={960}
        className="pointer-events-none relative z-10 h-full w-full scale-[1.05] object-cover object-center select-none"
        draggable={false}
      />
    </div>
  )
}
