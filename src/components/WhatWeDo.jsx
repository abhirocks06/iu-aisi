import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/*
 * "What We Do" drawn as a layer of a neural network, in the hero graph's halftone. On wide
 * screens the topics are the input layer (small open neurons) and the three activities
 * the next layer (halftone neurons, each heading its text). Like a dense layer every input
 * connects to every activity: its own by a crimson curve, the others by grey hairlines.
 * All weights sit in the gap between the layers, so none crosses text.
 *
 * Narrower screens get the same two levels as a tree: a line down the left, each activity
 * a large neuron heading its text, its topics branching off below.
 *
 * It draws itself in once when it comes into view.
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
          <path key={i} d={p.d} pathLength="1" className="wwd-branch" style={{ transitionDelay: `${900 + i * 120}ms` }} />
        ))}
        {pts.map((p, i) => (
          <circle key={`c${i}`} cx={p.x} cy={p.y} r="3.5" className="wwd-topic" style={{ transitionDelay: `${1150 + i * 120}ms` }} />
        ))}
      </svg>
      {topics.map((t, i) => (
        <span
          key={t}
          className="wwd-topic absolute -translate-y-1/2 text-sm leading-none whitespace-nowrap text-ink-soft"
          style={{ left: pts[i].x + 10, top: pts[i].y, transitionDelay: `${1200 + i * 120}ms` }}
        >
          {t}
        </span>
      ))}
    </div>
  )
}

export default function WhatWeDo() {
  const ref = useRef(null)
  const [on, setOn] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={`wwd ${on ? 'wwd-on' : ''}`}>
      <Network />
      <ol className="relative grid gap-12 pl-8 lg:hidden">
        <span aria-hidden="true" className="wwd-line-v absolute top-4 bottom-4 left-[9.25px] w-[1.5px]" />
        {activities.map((a, i) => (
          <li key={a.title} className="relative">
            <h3 className="relative font-display text-[1.9rem] leading-[1.1] tracking-tight text-ink">
              <span
                aria-hidden="true"
                className="wwd-station absolute top-[0.3em] -left-[29.5px] h-3.5 w-3.5 rounded-full bg-crimson ring-4 ring-paper"
                style={{ transitionDelay: `${300 + i * 180}ms` }}
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
  const box = root.getBoundingClientRect()
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

  const size = (v, gain) => (v < 0.08 ? 0 : Math.min(CELL - 1, Math.max(1, Math.round(Math.sqrt(v * gain) * CELL * 0.5))))
  const screen = (grid, color, alpha, gain) => {
    g.fillStyle = color
    g.globalAlpha = alpha
    for (let y = 0; y < gh; y += 1) {
      for (let x = 0; x < gw; x += 1) {
        const d = size(grid[y * gw + x], gain)
        if (d) g.fillRect(x * CELL - d / 2, y * CELL - d / 2, d, d)
      }
    }
  }
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
      <canvas ref={canvasRef} className="wwd-reveal pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />

      {/* Input layer: every topic, grouped by activity, spread over the layer's height. */}
      <ul className="flex flex-col justify-between py-2">
        {activities.flatMap((a, i) =>
          a.topics.map((t, j) => (
            <li
              key={t}
              className={`wwd-topic flex items-center justify-end gap-4 text-sm text-ink-soft ${j === 0 && i > 0 ? 'mt-5' : ''}`}
              style={{ transitionDelay: `${300 + (i * 3 + j) * 60}ms` }}
            >
              {t}
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
            <h3 className="font-display text-[2.35rem] leading-[1.1] tracking-tight text-ink">{a.title}</h3>
            <p className="mt-3 max-w-[30rem] text-base leading-relaxed text-muted">{a.copy}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
