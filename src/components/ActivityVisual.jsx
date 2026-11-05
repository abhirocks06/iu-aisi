import { useLayoutEffect, useRef } from 'react'

/*
 * Marks under What we do — hero WireGraph language (halftone neurons, hairlines),
 * each shaped so it reads as that activity: roundtable, layered net, stage + audience.
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

function dustCloud(g, W, H, points, crimson, seed) {
  const { rand, gauss } = makeRand(seed)
  const gw = Math.ceil(W / CELL) + 1
  const gh = Math.ceil(H / CELL) + 1
  const grid = new Float32Array(gw * gh)
  const splat = (x, y, w) => {
    const cx = Math.round(x / CELL)
    const cy = Math.round(y / CELL)
    for (const [dx, dy, k] of KERNEL) {
      const gx = cx + dx
      const gy = cy + dy
      if (gx >= 0 && gy >= 0 && gx < gw && gy < gh) grid[gy * gw + gx] += w * k
    }
  }
  for (const p of points) {
    for (let i = 0; i < 36; i += 1) splat(p.x + gauss() * 12, p.y + gauss() * 12, 0.28)
  }
  for (let i = 0; i < 14; i += 1) {
    const x = W * (0.12 + rand() * 0.76)
    const y = H * (0.18 + rand() * 0.7)
    const sigma = 16 + rand() * 20
    for (let j = 0; j < 14; j += 1) splat(x + gauss() * sigma, y + gauss() * sigma, 0.2)
  }
  g.fillStyle = crimson
  g.globalAlpha = 0.4
  for (let y = 0; y < gh; y += 1) {
    for (let x = 0; x < gw; x += 1) {
      const v = grid[y * gw + x]
      if (v < 0.08) continue
      const d = Math.min(CELL - 1, Math.max(1, Math.round(Math.sqrt(v * 0.55) * CELL * 0.5)))
      g.fillRect(x * CELL - (d >> 1), y * CELL - (d >> 1), d, d)
    }
  }
  g.globalAlpha = 1
}

function drawNeuron(g, x, y, r, crimson, paper) {
  g.fillStyle = crimson
  g.beginPath()
  g.arc(x, y, r, 0, Math.PI * 2)
  g.fill()
  g.save()
  g.clip()
  g.fillStyle = paper
  g.globalAlpha = 0.9
  const step = Math.max(2.6, r * 0.28)
  for (let py = -r; py <= r; py += step) {
    for (let px = -r; px <= r; px += step) {
      const nx = px / r
      const ny = py / r
      const q = nx * nx + ny * ny
      if (q > 1) continue
      const light = nx * -0.55 + ny * -0.6 + Math.sqrt(1 - q) * 0.58
      const d = Math.max(0, 0.62 - light) * step * 0.95
      if (d >= 0.35) g.fillRect(x + px - d / 2, y + py - d / 2, d, d)
    }
  }
  g.restore()
  g.globalAlpha = 0.4
  g.strokeStyle = crimson
  g.lineWidth = 1
  g.beginPath()
  g.arc(x, y, r + 3, 0, Math.PI * 2)
  g.stroke()
  g.globalAlpha = 1
}

function drawOpen(g, x, y, r, accent, fill) {
  g.fillStyle = fill
  g.beginPath()
  g.arc(x, y, r, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = accent
  g.globalAlpha = 0.85
  g.lineWidth = 1.15
  g.beginPath()
  g.arc(x, y, r, 0, Math.PI * 2)
  g.stroke()
  g.globalAlpha = 1
}

function curve(g, a, b, lift = 0.35) {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2 - Math.hypot(b.x - a.x, b.y - a.y) * lift
  g.beginPath()
  g.moveTo(a.x, a.y)
  g.quadraticCurveTo(mx, my, b.x, b.y)
  g.stroke()
}

function line(g, a, b) {
  g.beginPath()
  g.moveTo(a.x, a.y)
  g.lineTo(b.x, b.y)
  g.stroke()
}

function paintDiscussion(g, W, H, accent, shade, ink, openFill) {
  // Roundtable: equal seats in a ring — weekly discussion.
  const n = 6
  const cx = W * 0.5
  const cy = H * 0.52
  const rx = W * 0.3
  const ry = H * 0.28
  const seats = Array.from({ length: n }, (_, i) => {
    const t = -Math.PI / 2 + (i / n) * Math.PI * 2
    return { x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry }
  })
  dustCloud(g, W, H, seats, accent, 17)

  // Table ellipse (empty center).
  g.strokeStyle = accent
  g.globalAlpha = 0.2
  g.lineWidth = 1.25
  g.beginPath()
  g.ellipse(cx, cy, rx * 0.42, ry * 0.42, 0, 0, Math.PI * 2)
  g.stroke()
  g.globalAlpha = 1

  g.strokeStyle = ink
  g.lineWidth = 1
  for (let i = 0; i < n; i += 1) curve(g, seats[i], seats[(i + 1) % n], 0.08)

  // Dialogue accents across the table.
  g.strokeStyle = accent
  g.globalAlpha = 0.55
  g.lineWidth = 1.2
  curve(g, seats[0], seats[3], 0.15)
  curve(g, seats[1], seats[4], 0.12)
  g.globalAlpha = 1

  seats.forEach((p, i) => {
    if (i % 2 === 0) drawNeuron(g, p.x, p.y, 9, accent, shade)
    else drawOpen(g, p.x, p.y, 5, accent, openFill)
  })
}

function paintResearch(g, W, H, accent, shade, ink, openFill) {
  // Three-layer net: inputs → hidden → outputs — research / models.
  const layers = [
    Array.from({ length: 4 }, (_, i) => ({ x: W * 0.2, y: H * (0.22 + i * 0.18) })),
    Array.from({ length: 5 }, (_, i) => ({ x: W * 0.5, y: H * (0.16 + i * 0.16) })),
    Array.from({ length: 3 }, (_, i) => ({ x: W * 0.8, y: H * (0.28 + i * 0.2) })),
  ]
  dustCloud(g, W, H, layers.flat(), accent, 29)

  g.strokeStyle = ink
  g.lineWidth = 1
  g.globalAlpha = 0.9
  for (let L = 0; L < layers.length - 1; L += 1) {
    for (const a of layers[L]) {
      for (const b of layers[L + 1]) line(g, a, b)
    }
  }
  g.globalAlpha = 1

  // A few accent “active” weights.
  g.strokeStyle = accent
  g.globalAlpha = 0.65
  g.lineWidth = 1.2
  ;[
    [layers[0][1], layers[1][2]],
    [layers[0][2], layers[1][1]],
    [layers[1][1], layers[2][0]],
    [layers[1][3], layers[2][1]],
    [layers[1][2], layers[2][2]],
  ].forEach(([a, b]) => line(g, a, b))
  g.globalAlpha = 1

  layers[0].forEach((p) => drawOpen(g, p.x, p.y, 4, accent, openFill))
  layers[1].forEach((p, i) =>
    i === 2 ? drawNeuron(g, p.x, p.y, 10, accent, shade) : drawOpen(g, p.x, p.y, 4.5, accent, openFill),
  )
  layers[2].forEach((p) => drawNeuron(g, p.x, p.y, 8, accent, shade))
}

function paintEvents(g, W, H, accent, shade, ink, openFill) {
  // Stage + audience rows — speaker panel / gathering.
  const speaker = { x: W * 0.5, y: H * 0.22 }
  const rows = [
    Array.from({ length: 5 }, (_, i) => ({ x: W * (0.22 + i * 0.14), y: H * 0.48 })),
    Array.from({ length: 7 }, (_, i) => ({ x: W * (0.14 + i * 0.12), y: H * 0.68 })),
  ]
  dustCloud(g, W, H, [speaker, ...rows.flat()], accent, 41)

  g.strokeStyle = ink
  g.lineWidth = 1
  for (const row of rows) {
    for (const seat of row) curve(g, speaker, seat, 0.08)
  }

  g.strokeStyle = accent
  g.globalAlpha = 0.55
  g.lineWidth = 1.15
  curve(g, speaker, rows[0][2], 0.1)
  curve(g, speaker, rows[1][3], 0.12)
  g.globalAlpha = 1

  rows.flat().forEach((p) => drawOpen(g, p.x, p.y, 3.5, accent, openFill))
  drawNeuron(g, speaker.x, speaker.y, 12, accent, shade)
  // Side panelists on stage.
  drawNeuron(g, W * 0.34, H * 0.24, 7, accent, shade)
  drawNeuron(g, W * 0.66, H * 0.24, 7, accent, shade)
}

function paint(canvas, kind, onDark) {
  const box = canvas.getBoundingClientRect()
  const W = box.width
  const H = box.height
  if (!W || !H) return
  const crimson = css('--color-crimson', '#990000')
  const paper = css('--color-paper', '#fffffd')
  // On crimson cards: white marks with deep shade; on paper: crimson marks.
  const accent = onDark ? '#ffffff' : crimson
  const shade = onDark ? 'rgba(122, 0, 0, 0.55)' : paper
  const ink = onDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(23, 23, 23, 0.22)'
  const openFill = onDark ? 'rgba(255, 255, 255, 0.06)' : paper
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  const g = canvas.getContext('2d')
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.clearRect(0, 0, W, H)

  if (kind === 'discussion') paintDiscussion(g, W, H, accent, shade, ink, openFill)
  else if (kind === 'research') paintResearch(g, W, H, accent, shade, ink, openFill)
  else paintEvents(g, W, H, accent, shade, ink, openFill)
}

export default function ActivityVisual({ kind, onDark = false, className = '' }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const draw = () => paint(canvas, kind, onDark)
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [kind, onDark])

  return <canvas ref={ref} className={`block h-full w-full ${className}`} aria-hidden="true" />
}
