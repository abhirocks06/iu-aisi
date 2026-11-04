import { useLayoutEffect, useRef } from 'react'

/*
 * What we do marks — same crimson / halftone language as the hero,
 * drawn quiet and editorial (soft plate, sparse silhouette, clear metaphor).
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

function dustCloud(g, W, H, points, crimson, seed, amount = 18) {
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
    for (let i = 0; i < amount; i += 1) splat(p.x + gauss() * 9, p.y + gauss() * 9, 0.22)
  }
  for (let i = 0; i < 6; i += 1) {
    const x = W * (0.18 + rand() * 0.64)
    const y = H * (0.22 + rand() * 0.56)
    const sigma = 12 + rand() * 14
    for (let j = 0; j < 8; j += 1) splat(x + gauss() * sigma, y + gauss() * sigma, 0.14)
  }
  g.fillStyle = crimson
  g.globalAlpha = 0.28
  for (let y = 0; y < gh; y += 1) {
    for (let x = 0; x < gw; x += 1) {
      const v = grid[y * gw + x]
      if (v < 0.1) continue
      const d = Math.min(CELL - 1, Math.max(1, Math.round(Math.sqrt(v * 0.5) * CELL * 0.45)))
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
  g.globalAlpha = 0.35
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
  g.globalAlpha = 0.8
  g.lineWidth = 1.15
  g.beginPath()
  g.arc(x, y, r, 0, Math.PI * 2)
  g.stroke()
  g.globalAlpha = 1
}

function roundRect(g, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  g.beginPath()
  g.moveTo(x + rr, y)
  g.arcTo(x + w, y, x + w, y + h, rr)
  g.arcTo(x + w, y + h, x, y + h, rr)
  g.arcTo(x, y + h, x, y, rr)
  g.arcTo(x, y, x + w, y, rr)
  g.closePath()
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
  // Quiet roundtable — equal seats, empty center, two dialogue arcs.
  const n = 5
  const cx = W * 0.5
  const cy = H * 0.52
  const rx = W * 0.28
  const ry = H * 0.26
  const seats = Array.from({ length: n }, (_, i) => {
    const t = -Math.PI / 2 + (i / n) * Math.PI * 2
    return { x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry }
  })
  dustCloud(g, W, H, seats, accent, 17, 12)

  g.strokeStyle = accent
  g.globalAlpha = 0.18
  g.lineWidth = 1.2
  g.beginPath()
  g.ellipse(cx, cy, rx * 0.38, ry * 0.38, 0, 0, Math.PI * 2)
  g.stroke()
  g.globalAlpha = 1

  g.strokeStyle = ink
  g.lineWidth = 1
  for (let i = 0; i < n; i += 1) curve(g, seats[i], seats[(i + 1) % n], 0.06)

  g.strokeStyle = accent
  g.globalAlpha = 0.5
  g.lineWidth = 1.15
  curve(g, seats[0], seats[2], 0.18)
  curve(g, seats[0], seats[3], 0.16)
  g.globalAlpha = 1

  seats.forEach((p, i) => {
    if (i === 0) drawNeuron(g, p.x, p.y, 10, accent, shade)
    else drawOpen(g, p.x, p.y, 4.5, accent, openFill)
  })
}

function paintResearch(g, W, H, accent, shade, ink, openFill) {
  // Stacked eval sheets + a sparse inspect path — research / interpretability.
  const sheets = [
    { x: W * 0.16, y: H * 0.18, w: W * 0.52, h: H * 0.58 },
    { x: W * 0.24, y: H * 0.24, w: W * 0.52, h: H * 0.58 },
    { x: W * 0.32, y: H * 0.3, w: W * 0.52, h: H * 0.58 },
  ]
  const focus = { x: sheets[2].x + sheets[2].w * 0.55, y: sheets[2].y + sheets[2].h * 0.42 }
  const inputs = [
    { x: sheets[0].x + sheets[0].w * 0.28, y: sheets[0].y + sheets[0].h * 0.22 },
    { x: sheets[0].x + sheets[0].w * 0.28, y: sheets[0].y + sheets[0].h * 0.48 },
    { x: sheets[0].x + sheets[0].w * 0.28, y: sheets[0].y + sheets[0].h * 0.74 },
  ]
  const outputs = [
    { x: sheets[2].x + sheets[2].w * 0.82, y: sheets[2].y + sheets[2].h * 0.28 },
    { x: sheets[2].x + sheets[2].w * 0.82, y: sheets[2].y + sheets[2].h * 0.58 },
  ]
  dustCloud(g, W, H, [focus, ...inputs, ...outputs], accent, 29, 10)

  sheets.forEach((s, i) => {
    g.strokeStyle = i === 2 ? accent : ink
    g.globalAlpha = i === 2 ? 0.45 : 0.28
    g.lineWidth = i === 2 ? 1.25 : 1
    roundRect(g, s.x, s.y, s.w, s.h, 10)
    g.stroke()
  })
  g.globalAlpha = 1

  g.strokeStyle = ink
  g.lineWidth = 1
  g.globalAlpha = 0.85
  inputs.forEach((p) => line(g, p, focus))
  outputs.forEach((p) => line(g, focus, p))
  g.globalAlpha = 1

  g.strokeStyle = accent
  g.globalAlpha = 0.55
  g.lineWidth = 1.2
  line(g, inputs[1], focus)
  line(g, focus, outputs[0])
  g.globalAlpha = 1

  inputs.forEach((p) => drawOpen(g, p.x, p.y, 3.8, accent, openFill))
  outputs.forEach((p) => drawOpen(g, p.x, p.y, 3.8, accent, openFill))
  drawNeuron(g, focus.x, focus.y, 11, accent, shade)
}

function paintEvents(g, W, H, accent, shade, ink, openFill) {
  // Stage platform + panel, soft rays to a shallow audience arc.
  const stageY = H * 0.34
  const speakers = [
    { x: W * 0.32, y: stageY - H * 0.02 },
    { x: W * 0.5, y: stageY - H * 0.06 },
    { x: W * 0.68, y: stageY - H * 0.02 },
  ]
  const audience = Array.from({ length: 6 }, (_, i) => {
    const t = i / 5
    return {
      x: W * (0.18 + t * 0.64),
      y: H * (0.62 + Math.sin(t * Math.PI) * 0.06),
    }
  })
  dustCloud(g, W, H, [...speakers, ...audience], accent, 41, 11)

  g.strokeStyle = accent
  g.globalAlpha = 0.35
  g.lineWidth = 1.2
  roundRect(g, W * 0.16, stageY + H * 0.02, W * 0.68, H * 0.06, 6)
  g.stroke()
  g.globalAlpha = 1

  g.strokeStyle = ink
  g.lineWidth = 1
  g.globalAlpha = 0.75
  for (const seat of audience) curve(g, speakers[1], seat, 0.05)
  g.globalAlpha = 1

  g.strokeStyle = accent
  g.globalAlpha = 0.5
  g.lineWidth = 1.15
  curve(g, speakers[1], audience[2], 0.08)
  curve(g, speakers[1], audience[3], 0.1)
  g.globalAlpha = 1

  // Soft canopy above the panel.
  g.strokeStyle = accent
  g.globalAlpha = 0.22
  g.lineWidth = 1
  g.beginPath()
  g.moveTo(W * 0.22, H * 0.2)
  g.quadraticCurveTo(W * 0.5, H * 0.08, W * 0.78, H * 0.2)
  g.stroke()
  g.globalAlpha = 1

  audience.forEach((p) => drawOpen(g, p.x, p.y, 3.4, accent, openFill))
  drawNeuron(g, speakers[0].x, speakers[0].y, 7.5, accent, shade)
  drawNeuron(g, speakers[1].x, speakers[1].y, 11, accent, shade)
  drawNeuron(g, speakers[2].x, speakers[2].y, 7.5, accent, shade)
}

function paint(canvas, kind, onDark) {
  const box = canvas.getBoundingClientRect()
  const W = box.width
  const H = box.height
  if (!W || !H) return
  const crimson = css('--color-crimson', '#990000')
  const paper = css('--color-paper', '#fffffd')
  const accent = onDark ? '#ffffff' : crimson
  const shade = onDark ? 'rgba(122, 0, 0, 0.55)' : paper
  const ink = onDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(23, 23, 23, 0.2)'
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
