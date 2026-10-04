import { useLayoutEffect, useRef } from 'react'

/*
 * "What We Do" drawn as a layer of a neural network, in the hero graph's halftone. On wide
 * screens the topics are the input layer (small open neurons) and the three activities
 * the next layer (halftone neurons, each heading its text). Like a dense layer every input
 * connects to every activity: its own by a crimson curve, the others by grey hairlines.
 * All weights sit in the gap between the layers, so none crosses text.
 *
 * Narrower screens get the same two levels as a tree: a line down the left, each activity
 * a large neuron heading its text, its topics branching off below.
 */

const activities = [
  {
    title: 'Discussion Meetings',
    copy: 'Weekly roundtables on new AI developments, emerging capabilities, and the U.S.–China race at the frontier.',
    topics: ['AI developments', 'U.S.–China race'],
  },
  {
    title: 'Research Projects',
    copy: 'Team projects on alignment, interpretability, evaluations, and governance frameworks.',
    topics: ['Interpretability', 'Evaluations', 'Governance frameworks'],
  },
  {
    title: 'Community Events',
    copy: 'Speaker panels and networking sessions with researchers, policymakers, and industry leaders.',
    topics: ['Researchers', 'Policymakers'],
  },
]

const ROW = 30 // vertical step between branches
const R = 10 // the one corner radius
const SPINE = -22 // x of the vertical line, relative to the text column

// Phones: off the vertical line, round one corner, out to each topic.
function branchRight(i) {
  const y = 14 + i * ROW
  return { d: `M${SPINE},${y - R - 4} Q${SPINE},${y} ${SPINE + R},${y} H6`, x: 6, y }
}

function Tree({ topics }) {
  const pts = topics.map((_, i) => branchRight(i))
  return (
    <div className="relative" style={{ height: topics.length * ROW }}>
      <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        {pts.map((p, i) => (
          <path key={i} d={p.d} className="wwd-branch" />
        ))}
        {pts.map((p, i) => (
          <circle key={`c${i}`} cx={p.x} cy={p.y} r="3.5" className="wwd-topic" />
        ))}
      </svg>
      {topics.map((t, i) => (
        <span
          key={t}
          className="absolute -translate-y-1/2 text-sm leading-none whitespace-nowrap text-ink-soft"
          style={{ left: pts[i].x + 10, top: pts[i].y }}
        >
          {t}
        </span>
      ))}
    </div>
  )
}

export default function WhatWeDo() {
  return (
    <div>
      <Network />
      <ol className="relative grid gap-12 pl-8 lg:hidden">
        <span aria-hidden="true" className="wwd-line-v absolute top-4 bottom-4 left-[9.25px] w-[1.5px]" />
        {activities.map((a, i) => (
          <li key={a.title} className="relative">
            <h3 className="relative font-display text-[1.9rem] leading-[1.1] tracking-tight text-ink">
              <span
                aria-hidden="true"
                className="absolute top-[0.3em] -left-[29.5px] h-3.5 w-3.5 rounded-full bg-crimson ring-4 ring-paper"
              />
              {a.title}
            </h3>
            <p className="mt-3 max-w-[30rem] text-base leading-relaxed text-muted">{a.copy}</p>
            <div className="mt-4">
              <Tree topics={a.topics} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

// Wide screens: topics (inputs) on the left, activities on the right, weights between,
// drawn once onto a canvas: each weight a bowed curve (crimson to an activity's own topics,
// a grey hairline to the rest), and, in the hero graph's halftone, each activity a halftone-shaded neuron in a cloud of grain.
const CELL = 5
const KERNEL = [
  [0, 0, 1], [1, 0, 0.45], [-1, 0, 0.45], [0, 1, 0.45], [0, -1, 0.45],
  [1, 1, 0.2], [-1, 1, 0.2], [1, -1, 0.2], [-1, -1, 0.2],
]

function drawNetwork(canvas, root) {
  // The canvas runs past the network on every side so dust can settle around it.
  const box = canvas.getBoundingClientRect()
  const W = box.width
  const H = box.height
  if (!W || !H) return
  const css = (name, fallback) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
  const crimson = css('--color-crimson', '#990000')
  const paper = css('--color-paper', '#fffffd')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  const g = canvas.getContext('2d')
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.clearRect(0, 0, W, H)

  const center = (el) => {
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top }
  }
  const ins = [...root.querySelectorAll('[data-in]')].map((el) => ({ ...center(el), k: Number(el.dataset.in) }))
  const outs = [...root.querySelectorAll('[data-out]')].map(center)

  let seed = 11
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand())

  const gw = Math.ceil(W / CELL) + 1
  const gh = Math.ceil(H / CELL) + 1
  const red = new Float32Array(gw * gh)
  const splat = (grid, x, y, w) => {
    const cx = Math.round(x / CELL)
    const cy = Math.round(y / CELL)
    for (const [dx, dy, k] of KERNEL) {
      const gx = cx + dx
      const gy = cy + dy
      if (gx >= 0 && gy >= 0 && gx < gw && gy < gh) grid[gy * gw + gx] += w * k
    }
  }
  // Weights bow like a sigmoid, leaving and arriving level: grey hairlines to the other
  // activities first, then crimson to each topic's own.
  const weight = (a, b) => {
    const dx = (b.x - a.x) * 0.55
    g.beginPath()
    g.moveTo(a.x, a.y)
    g.bezierCurveTo(a.x + dx, a.y, b.x - dx, b.y, b.x, b.y)
    g.stroke()
  }
  g.lineWidth = 1
  g.strokeStyle = '#171717'
  g.globalAlpha = 0.12
  for (const a of ins) outs.forEach((b, j) => a.k !== j && weight(a, b))
  g.strokeStyle = crimson
  g.globalAlpha = 0.8
  g.lineWidth = 1.25
  for (const a of ins) weight(a, outs[a.k])
  g.globalAlpha = 1
  for (const b of outs) {
    for (let i = 0; i < 110; i += 1) splat(red, b.x + gauss() * 10, b.y + gauss() * 10, 0.3)
  }
  // Crimson dust frames the scene on a diagonal, like the hero's grain: two masses, top
  // right and bottom left, thinning outward, with a little along the other edges. It
  // covers roughly a fifth of the empty space, never text or the weights.
  const pad = (r, p) => [r.left - box.left - p, r.top - box.top - p, r.right - box.left + p, r.bottom - box.top + p]
  const text = [...root.querySelectorAll('[data-text]')].map((el) => pad(el.getBoundingClientRect(), 14))
  const x0 = Math.min(...ins.map((a) => a.x)) - 12
  const x1 = Math.max(...outs.map((b) => b.x)) + 24
  const net = root.getBoundingClientRect()
  const top = net.top - box.top
  const bottom = net.bottom - box.top
  const clear = (x, y) =>
    x > 0 && y > 0 && x < W && y < H &&
    !(x > x0 && x < x1 && y > top && y < bottom) &&
    !text.some(([l, t, r, b]) => x > l && x < r && y > t && y < b)
  const dust = new Float32Array(gw * gh)
  const left = net.left - box.left
  const right = net.right - box.left
  const sides = [
    [0.4, () => [right + 60 + gauss() * 110, top - 10 + gauss() * 80]],
    [0.4, () => [left + 20 + gauss() * 110, bottom - 40 + gauss() * 80]],
    [0.1, () => [right - 40 + Math.abs(gauss()) * 170, top + rand() * (bottom - top)]],
    [0.1, () => [left + 60 - Math.abs(gauss()) * 150, top + rand() * (bottom - top)]],
  ]
  let placed = 0
  for (let tries = 0; tries < 400 && placed < 22; tries += 1) {
    let r = rand()
    const [, pick] = sides.find(([w]) => (r -= w) < 0) ?? sides[0]
    const [cx, cy] = pick()
    if (!clear(cx, cy)) continue
    placed += 1
    // Wide, sparse clouds, as in the hero, so most squares print at 1-2px.
    const sigma = 35 + rand() * 40
    for (let i = 0; i < 30 + rand() * 20; i += 1) {
      const x = cx + gauss() * sigma
      const y = cy + gauss() * sigma
      if (clear(x, y)) splat(dust, x, y, 0.4)
    }
  }

  const size = (v, gain) => (v < 0.08 ? 0 : Math.min(CELL - 1, Math.max(1, Math.round(Math.sqrt(v * gain) * CELL * 0.5))))
  const screen = (grid, color, alpha, gain) => {
    g.fillStyle = color
    g.globalAlpha = alpha
    for (let y = 0; y < gh; y += 1) {
      for (let x = 0; x < gw; x += 1) {
        const d = size(grid[y * gw + x], gain)
        // Whole pixels, like the hero's screen, so squares stay crisp.
        if (d) g.fillRect(x * CELL - (d >> 1), y * CELL - (d >> 1), d, d)
      }
    }
  }
  screen(dust, crimson, 0.45, 0.5)
  screen(red, crimson, 0.6, 0.5)
  g.globalAlpha = 1

  // Activities: halftone-shaded neurons, paper dots heavier away from an upper-left light.
  for (const b of outs) {
    const r = 11
    g.fillStyle = crimson
    g.beginPath()
    g.arc(b.x, b.y, r, 0, Math.PI * 2)
    g.fill()
    g.save()
    g.clip()
    g.fillStyle = paper
    g.globalAlpha = 0.9
    const step = 3.2
    for (let py = -r; py <= r; py += step) {
      for (let px = -r; px <= r; px += step) {
        const nx = px / r
        const ny = py / r
        const q = nx * nx + ny * ny
        if (q > 1) continue
        const light = nx * -0.55 + ny * -0.6 + Math.sqrt(1 - q) * 0.58
        const d = Math.max(0, 0.62 - light) * step * 0.95
        if (d >= 0.35) g.fillRect(b.x + px - d / 2, b.y + py - d / 2, d, d)
      }
    }
    g.restore()
    g.globalAlpha = 0.45
    g.strokeStyle = crimson
    g.lineWidth = 1
    g.beginPath()
    g.arc(b.x, b.y, r + 4, 0, Math.PI * 2)
    g.stroke()
    g.globalAlpha = 1
  }
  // Topics: small open neurons.
  for (const a of ins) {
    g.fillStyle = paper
    g.strokeStyle = crimson
    g.lineWidth = 1.25
    g.beginPath()
    g.arc(a.x, a.y, 4, 0, Math.PI * 2)
    g.fill()
    g.stroke()
  }
}

function Network() {
  const ref = useRef(null)
  const canvasRef = useRef(null)

  useLayoutEffect(() => {
    const root = ref.current
    const draw = () => drawNetwork(canvasRef.current, root)
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(root)
    document.fonts?.ready.then(() => root.isConnected && draw())
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} className="relative hidden grid-cols-[14rem_minmax(6rem,11rem)_minmax(0,34rem)] lg:grid">
      <canvas ref={canvasRef} className="pointer-events-none absolute -top-32 -right-[22rem] -bottom-20 -left-[16rem] h-[calc(100%+13rem)] w-[calc(100%+38rem)]" aria-hidden="true" />

      {/* Input layer: every topic, grouped by activity, spread over the layer's height. */}
      <ul className="flex flex-col justify-between py-2">
        {activities.flatMap((a, i) =>
          a.topics.map((t, j) => (
            <li
              key={t}
              className={`flex items-center justify-end gap-4 text-sm text-ink-soft ${j === 0 && i > 0 ? 'mt-5' : ''}`}
            >
              <span data-text>{t}</span>
              <span data-in={i} aria-hidden="true" className="h-2.5 w-2.5 shrink-0" />
            </li>
          )),
        )}
      </ul>
      <span aria-hidden="true" />

      {/* Next layer: the activities. */}
      <ol className="flex flex-col gap-12 py-1">
        {activities.map((a) => (
          <li key={a.title} className="relative pl-12">
            <span data-out aria-hidden="true" className="absolute top-[0.85rem] left-0 h-4 w-4" />
            <h3 data-text className="font-display text-[2.35rem] leading-[1.1] tracking-tight text-ink">{a.title}</h3>
            <p data-text className="mt-3 max-w-[30rem] text-base leading-relaxed text-muted">{a.copy}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
