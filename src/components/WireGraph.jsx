import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import wire from '../data/wire.json'

/*
 * Home hero art: a slowly turning 3D graph of the 10 newest misalignment incidents
 * (crimson) and the 10 newest statements on AI risk by U.S. officials (ink), over a
 * halftone dust of older incidents. Pointing at a node opens a card with its source.
 * The scene and its numbers are the "AI Safety Wire" artifact's; data is a snapshot in
 * src/data/wire.json.
 *
 * Why it isn't drawn frame by frame: Safari holds page scripts to 30fps in Low Power Mode
 * (and on 120Hz screens runs them at 60), but runs transform and opacity animations on its
 * own thread at the display's full rate. The drift is a steady turn, so every node, label
 * and link follows a known path. Those paths are computed once per turn and handed to the
 * browser as looping Web Animations. Only the halftone dust is drawn by script, about 30
 * times a second, and each new frame cross-fades in over the last on the compositor, so
 * the dots change smoothly instead of in steps (the screen is fixed to the page, so
 * blending two frames reads as the frame in between).
 */

const DUST = 'rgba(23, 23, 23, 0.34)'
const EDGE = 'rgba(23, 23, 23, 0.32)'
const LEADER = 'rgba(23, 23, 23, 0.3)'
const CELL = 5
const KERNEL = [
  [0, 0, 1], [1, 0, 0.45], [-1, 0, 0.45], [0, 1, 0.45], [0, -1, 0.45],
  [1, 1, 0.2], [-1, 1, 0.2], [1, -1, 0.2], [-1, -1, 0.2],
]
// The artifact's drift: 0.00012 rad per ms, one turn every ~52s.
const SPIN = 0.00012
const PERIOD = (2 * Math.PI) / SPIN
// Each path is sampled every half degree, then thinned to the keyframes that keep it
// within TOLERANCE px of the true path.
const SAMPLES = 720
const TOLERANCE = 0.2
// The dust is redrawn this often; the compositor blends each frame into the next.
const DUST_MS = 1000 / 30
// Links are drawn as this many straight pieces along their curve.
const SEGMENTS = 8
// Bubble sprites are drawn at the largest size they reach (nearest point, hovered) and
// only ever scaled down, which keeps them sharp.
const NEAREST = 2.4 / (2.4 - 0.8)
const FOCUS = 1.18
const SPRITE = NEAREST * FOCUS

function buildScene() {
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const gauss = () =>
    Math.max(-2.2, Math.min(2.2, Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand())))
  const sphere = (i, n, radius, twist = 0) => {
    const y = 1 - (2 * (i + 0.5)) / n
    const r = Math.sqrt(1 - y * y)
    const t = i * 2.39996 + twist
    return [Math.cos(t) * r * radius, y * radius, Math.sin(t) * r * radius]
  }

  // Incidents and statements alternate over one sphere.
  const incidents = wire.nodes.filter((n) => n.kind === 'incident')
  const quotes = wire.nodes.filter((n) => n.kind === 'quote')
  const nodes = []
  for (let k = 0; k < 10; k += 1) nodes.push({ ...incidents[k] }, { ...quotes[k] })
  nodes.forEach((n, i) => {
    // A few nodes carry a short label (`handle` in the data); the rest show their text on hover.
    n.size = n.kind === 'incident' ? 7 + n.severity * 5 : 6
    n.p = sphere(i, nodes.length, n.kind === 'incident' ? 0.8 : 0.62, 0.5)
    n.grain = Array.from({ length: n.kind === 'incident' ? 140 : 60 }, () => [gauss() * 0.07, gauss() * 0.07, gauss() * 0.07])
  })

  // Older incidents as background dust, clustered by chain (same order as the artifact).
  const centers = Array.from({ length: wire.chainCount }, (_, i) => sphere(i, wire.chainCount, 0.55, 1.3))
  const dust = wire.olderChains.flatMap((chain) => {
    const c = centers[chain]
    return Array.from({ length: 16 }, () => [c[0] + gauss() * 0.14, c[1] + gauss() * 0.14, c[2] + gauss() * 0.14])
  })

  return { nodes, dust, links: wire.links }
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const px = (v) => v.toFixed(2)
const fx = (v) => v.toFixed(4)

// Ramer–Douglas–Peucker on a sampled path: keep only the samples needed so that straight
// interpolation between kept ones stays within tolerance. `weights` scale each dimension
// so that an error of 1 is the tolerance.
function thin(track, weights) {
  const keep = new Uint8Array(track.length)
  keep[0] = 1
  keep[track.length - 1] = 1
  const stack = [[0, track.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    let worst = 1
    let at = -1
    for (let i = a + 1; i < b; i += 1) {
      const t = (i - a) / (b - a)
      for (let d = 0; d < weights.length; d += 1) {
        const e = Math.abs(track[a][d] + (track[b][d] - track[a][d]) * t - track[i][d]) * weights[d]
        if (e > worst) {
          worst = e
          at = i
        }
      }
    }
    if (at >= 0) {
      keep[at] = 1
      stack.push([a, at], [at, b])
    }
  }
  return keep
}

const halo = (c) =>
  [[0, 0, 2], [1.5, 0, 0], [-1.5, 0, 0], [0, 1.5, 0], [0, -1.5, 0], [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0]]
    .map(([x, y, b]) => `${x}px ${y}px ${b}px ${c}`)
    .join(', ')

export default function WireGraph({ className = '' }) {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const canvasRefs = [useRef(null), useRef(null)]
  const cardRef = useRef(null)
  const api = useRef({})
  const [card, setCard] = useState(null)

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const canvases = canvasRefs.map((r) => r.current)
    const contexts = canvases.map((c) => c.getContext('2d', { alpha: false }))
    const { nodes, dust, links } = buildScene()
    const byId = new Map(nodes.map((n) => [n.id, n]))
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const css = (name, fallback) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
    const ink = css('--color-ink', '#171717')
    const muted = css('--color-muted', '#6f6f68')
    const paper = css('--color-paper', '#fffffd')
    const font = css('--font-sans', 'Helvetica, Arial, sans-serif')
    const colors = { incident: css('--color-crimson', '#990000'), quote: ink }
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let W = 0
    let H = 0
    const view = { yaw: 0.3, pitch: 0.28 }
    const state = { drag: null, hover: null, pinned: null }
    const focusOf = () => state.hover || state.pinned

    const projector = (yaw, pitch) => {
      const cy = Math.cos(yaw)
      const sy = Math.sin(yaw)
      const cp = Math.cos(pitch)
      const sp = Math.sin(pitch)
      const s0 = Math.min(W * (W < 600 ? 0.62 : 0.5), H * 0.55)
      const oy = H * (W < 600 ? 0.58 : 0.54)
      return ([x, y, z]) => {
        const x1 = x * cy - z * sy
        const z1 = x * sy + z * cy
        const y1 = y * cp - z1 * sp
        const z2 = y * sp + z1 * cp
        const f = 2.4 / (2.4 + z2)
        return [W / 2 + x1 * s0 * f, oy - y1 * s0 * f, -z2, f]
      }
    }
    const nodeScale = () => (W < 600 ? 0.85 : 1.2)
    const anchors = nodes.filter((n) => n.handle)
    const place = (yaw, pitch) => {
      const project = projector(yaw, pitch)
      const k = nodeScale()
      return nodes.map((n) => {
        const [x, y, z, f] = project(n.p)
        return { n, x, y, z, f, r: n.size * f * k }
      })
    }

    // ---- The moving parts: DOM elements whose paths become looping animations ----------

    // A disc shaded with halftone: a dot screen in the page colour, heavier on the side
    // away from the light, so each node reads as a printed sphere, with a thin outer ring.
    // Drawn once at its largest size; at 1x zoom it matches the artifact's drawing.
    const bubbleSprite = (n) => {
      const k = nodeScale()
      const unit = SPRITE // sprite px per artifact px
      const r = n.size * k * unit
      const ring = r + 4 * unit
      const half = Math.ceil(ring + unit)
      const c = document.createElement('canvas')
      c.width = half * 2 * dpr
      c.height = half * 2 * dpr
      const g = c.getContext('2d')
      g.scale(dpr, dpr)
      g.fillStyle = colors[n.kind]
      g.beginPath()
      g.arc(half, half, r, 0, Math.PI * 2)
      g.fill()
      g.save()
      g.clip()
      g.fillStyle = paper
      g.globalAlpha = 0.9
      const step = 3.5 * unit
      for (let py = -r; py <= r; py += step) {
        for (let qx = -r; qx <= r; qx += step) {
          const nx = qx / r
          const ny = py / r
          const q = nx * nx + ny * ny
          if (q > 1) continue
          const light = nx * -0.55 + ny * -0.6 + Math.sqrt(1 - q) * 0.58
          const d = Math.max(0, 0.62 - light) * step * 0.95
          if (d < 0.35 * unit) continue
          g.fillRect(half + qx - d / 2, half + py - d / 2, d, d)
        }
      }
      g.restore()
      g.globalAlpha = 0.45
      g.strokeStyle = colors[n.kind]
      g.lineWidth = unit
      g.beginPath()
      g.arc(half, half, ring, 0, Math.PI * 2)
      g.stroke()
      c.style.cssText = `display:block;width:${half * 2}px;height:${half * 2}px;transition:opacity 200ms ease, transform 200ms ease;`
      return { sprite: c, half }
    }
    const div = (style, parent = stage) => {
      const el = document.createElement('div')
      el.style.cssText = `position:absolute;left:0;top:0;${style}`
      parent.appendChild(el)
      return el
    }
    // A hairline that stays sharp at any angle: a 1px band in a 3px strip, so rotating it
    // on the compositor filters the edges smoothly. It is only ever scaled down.
    const hairline = (width, color, parent) =>
      div(
        `top:-1.5px;width:${width}px;height:3px;transform-origin:0 50%;` +
          `background:linear-gradient(transparent 1px, ${color} 1px, ${color} 2px, transparent 2px);`,
        parent,
      )

    let parts = []
    let maxPiece = 1
    const build = () => {
      stage.replaceChildren()
      parts = []
      const s0 = Math.min(W * (W < 600 ? 0.62 : 0.5), H * 0.55)
      // Longest a link piece can get: a sphere diameter at the nearest depth, bowed.
      maxPiece = Math.ceil((2 * 0.8 * s0 * NEAREST * 1.15) / SEGMENTS + 1)

      links.forEach(([a, b]) => {
        const group = div('inset:0;transition:opacity 200ms ease;')
        group.dataset.ends = `${a} ${b}`
        for (let i = 0; i < SEGMENTS; i += 1) {
          parts.push({ el: hairline(maxPiece, EDGE, group), kind: 'piece', link: [a, b], i })
        }
      })
      nodes.forEach((n) => {
        const { sprite, half } = bubbleSprite(n)
        const holder = div('')
        const pose = div(`left:${-half}px;top:${-half}px;width:${half * 2}px;height:${half * 2}px;`, holder)
        pose.appendChild(sprite)
        n.dom = { holder, fx: sprite }
        parts.push({ el: pose, kind: 'bubble', n, half })
      })
      nodes.forEach((n) => {
        if (!n.handle) return
        const group = div('inset:0;z-index:40;transition:opacity 200ms ease;')
        const text = (t, size, weight, color) =>
          div(
            `white-space:nowrap;font:${weight} ${size}px/1 ${font};color:${color};text-shadow:${halo(paper)};`,
            group,
          )
        const lead = hairline(13, LEADER, group)
        const l1 = text(n.handle, 14, 500, ink)
        const l2 = text(n.short, 12, 400, muted)
        l1.textContent = n.handle
        l2.textContent = n.short
        n.dom.label = group
        n.box = { w1: l1.offsetWidth, w2: l2.offsetWidth }
        n.box.bw = Math.max(n.box.w1, n.box.w2)
        parts.push({ el: lead, kind: 'lead', n }, { el: l1, kind: 'l1', n }, { el: l2, kind: 'l2', n })
      })
      paintFocus()
    }

    // Every part's state at one angle, as plain numbers. `dt` drives the label easing;
    // `labelsOnly` just advances that easing.
    const sample = (yaw, pitch, dt, labelsOnly = false) => {
      const project = projector(yaw, pitch)
      const k = nodeScale()
      const shown = (labelsOnly ? anchors : nodes).map((n) => {
        const [x, y, z, f] = project(n.p)
        return { n, x, y, z, f, r: n.size * f * k }
      })
      const at = new Map(shown.map((s) => [s.n.id, s]))
      const ox = W / 2
      const oy = H * 0.54
      for (const s of shown) {
        const { n } = s
        if (!n.handle) continue
        // Anchor labels orbit their node instead of flipping sides (after Moritz Stefaner's
        // label placement): each points away from the graph's centre, its angle eases toward
        // that direction, and the text alignment blends from left to right with the angle.
        const dx = s.x - ox
        const dy = s.y - oy
        const target = Math.hypot(dx, dy) > 8 ? Math.atan2(dy * 0.6, dx) : (n.ang ?? 0)
        if (n.ang === undefined) n.ang = target
        let delta = target - n.ang
        delta = Math.atan2(Math.sin(delta), Math.cos(delta))
        n.ang += delta * (1 - Math.exp(-dt / 200))
        const c = Math.cos(n.ang)
        const sn = Math.sin(n.ang)
        const depth = clamp(0.72 + s.z * 0.55, 0.3, 1)
        // Fade out as the node turns away rather than disappearing at a cut-off.
        const turn = clamp((s.z + 0.55) / 0.35, 0, 1)
        const a = Math.max(0.45, depth) * turn
        const ax = s.x + c * (s.r + 16)
        const ay = s.y + sn * (s.r + 16)
        const { bw, w1, w2 } = n.box
        const left = clamp(ax + 4 * c - (bw * (1 - c)) / 2, 8, W - bw - 8)
        const top = clamp(ay + 3 * sn - (32 * (1 - sn)) / 2, 8, H - 32 - 8)
        const blend = (wl) => ((bw - wl) * (1 - c)) / 2
        s.label = {
          lead: [s.x + c * (s.r + 3), s.y + sn * (s.r + 3), n.ang, a],
          l1: [left + blend(w1), top, a],
          l2: [left + blend(w2), top + 18, a],
        }
      }
      if (labelsOnly) return null
      return parts.map((p) => {
        if (p.kind === 'bubble') {
          const s = at.get(p.n.id)
          return [s.x, s.y, s.f / SPRITE, clamp(0.72 + s.z * 0.55, 0.3, 1)]
        }
        if (p.kind === 'piece') {
          const P = at.get(p.link[0])
          const Q = at.get(p.link[1])
          // The artifact's link: a quadratic curve bowed a quarter of its length to one side.
          const cx = (P.x + Q.x) / 2 - (Q.y - P.y) * 0.25
          const cy = (P.y + Q.y) / 2 + (Q.x - P.x) * 0.25
          const pt = (t) => [
            (1 - t) * (1 - t) * P.x + 2 * (1 - t) * t * cx + t * t * Q.x,
            (1 - t) * (1 - t) * P.y + 2 * (1 - t) * t * cy + t * t * Q.y,
          ]
          const [x0, y0] = pt(p.i / SEGMENTS)
          const [x1, y1] = pt((p.i + 1) / SEGMENTS)
          const len = Math.hypot(x1 - x0, y1 - y0) + 0.6
          return [x0, y0, Math.atan2(y1 - y0, x1 - x0), Math.min(1, len / maxPiece)]
        }
        const l = at.get(p.n.id).label
        return p.kind === 'lead' ? l.lead : p.kind === 'l1' ? l.l1 : l.l2
      })
    }

    const frameOf = (p, v) => {
      if (p.kind === 'bubble') return { transform: `translate(${px(v[0])}px, ${px(v[1])}px) scale(${fx(v[2])})`, opacity: fx(v[3]) }
      if (p.kind === 'piece') return { transform: `translate(${px(v[0])}px, ${px(v[1])}px) rotate(${fx(v[2])}rad) scaleX(${fx(v[3])})` }
      if (p.kind === 'lead') return { transform: `translate(${px(v[0])}px, ${px(v[1])}px) rotate(${fx(v[2])}rad)`, opacity: fx(v[3]) }
      return { transform: `translate(${px(v[0])}px, ${px(v[1])}px)`, opacity: fx(v[2]) }
    }
    const weightsOf = (p) => {
      const t = 1 / TOLERANCE
      if (p.kind === 'bubble') return [t, t, p.half * 2 * t, 250]
      if (p.kind === 'piece') return [t, t, maxPiece * t, maxPiece * t]
      if (p.kind === 'lead') return [t, t, 13 * t, 250]
      return [t, t, 250]
    }

    // Still pose (reduced motion, dragging): write the values straight onto the elements.
    // A one-off pose passes a long dt so labels settle at once.
    const STILL = 10000
    const pose = (yaw, pitch, dt) => {
      sample(yaw, pitch, dt).forEach((v, i) => Object.assign(parts[i].el.style, frameOf(parts[i], v)))
    }

    // Bake one full turn from `yaw` into looping animations. The work (~100ms) is done in
    // slices between frames so it never blocks the page; meanwhile the graph holds still at
    // `yaw`, which is exactly where the animations start.
    let anims = []
    let base = 0.3
    let playing = false
    let baking = 0
    const unbake = () => {
      baking += 1
      anims.forEach((a) => a.cancel())
      anims = []
    }
    const bake = (yaw, pitch) => {
      unbake()
      const id = baking
      view.yaw = yaw
      pose(yaw, pitch, STILL)
      dirty = true
      const step = PERIOD / SAMPLES
      const at = (i) => yaw + (2 * Math.PI * i) / SAMPLES
      // A few seconds of turning lets the label easing settle before the recorded turn.
      for (let i = -60; i < 0; i += 1) sample(at(i), pitch, step, true)
      const tracks = parts.map(() => [])
      const made = []
      let started = 0
      let start = 0
      let i = 0
      const work = () => {
        if (id !== baking) return
        const until = performance.now() + 8
        while (performance.now() < until) {
          if (i <= SAMPLES) {
            sample(at(i), pitch, step).forEach((v, j) => {
              // Keep link angles continuous so no piece spins the long way round at ±180°.
              const prev = tracks[j][i - 1]
              if (prev && parts[j].kind === 'piece') v[2] = prev[2] + Math.atan2(Math.sin(v[2] - prev[2]), Math.cos(v[2] - prev[2]))
              tracks[j].push(v)
            })
            i += 1
          } else if (made.length < parts.length) {
            const p = parts[made.length]
            const track = tracks[made.length]
            const frames = []
            thin(track, weightsOf(p)).forEach((k, f) => {
              if (k) frames.push({ ...frameOf(p, track[f]), offset: f / SAMPLES })
            })
            // Held at the start (= the still pose) until every part is ready.
            const a = p.el.animate(frames, { duration: PERIOD, iterations: Infinity, easing: 'linear' })
            a.pause()
            a.currentTime = 0
            made.push(a)
          } else if (started < made.length) {
            // Start them all from the same moment, a few at a time.
            if (!started) start = document.timeline.currentTime
            made[started].startTime = start
            started += 1
          } else {
            base = yaw
            anims = made
            anims.forEach((a) => (playing ? a.play() : a.pause()))
            dirty = true
            return
          }
        }
        setTimeout(work, 0)
      }
      setTimeout(work, 0)
    }
    const yawNow = (lead = 0) => {
      if (!anims.length) return view.yaw
      return base + SPIN * ((anims[0].currentTime ?? 0) + (playing ? lead : 0))
    }

    // ---- The halftone dust, drawn by script --------------------------------------------

    // Points are splatted into a coarse grid, then each cell becomes one square whose size
    // follows the density there, like a printed screen. Squares are written straight into a
    // pixel buffer at CSS resolution (they sit on whole CSS pixels), shown with one call.
    let gw = 0
    let gh = 0
    const grids = {}
    let image = null
    let pixels = null
    const resetGrids = () => {
      gw = Math.ceil(W / CELL) + 1
      gh = Math.ceil(H / CELL) + 1
      for (const k of ['dust', 'incident', 'quote']) {
        if (!grids[k] || grids[k].length !== gw * gh) grids[k] = new Float32Array(gw * gh)
        else grids[k].fill(0)
      }
    }
    const splat = (grid, x, y, w) => {
      const cx = Math.round(x / CELL)
      const cy = Math.round(y / CELL)
      for (const [dx, dy, k] of KERNEL) {
        const gx = cx + dx
        const gy = cy + dy
        if (gx >= 0 && gy >= 0 && gx < gw && gy < gh) grid[gy * gw + gx] += w * k
      }
    }
    // The three layers (dust, incident grain, statement grain) stack in that order with
    // these colours and opacities over the paper. Any pixel is covered by some subset of
    // the three squares in its cell, so its colour comes from a table of the 8 subsets.
    const rgb = (c) => {
      const t = document.createElement('canvas').getContext('2d')
      t.fillStyle = c
      t.fillRect(0, 0, 1, 1)
      return [...t.getImageData(0, 0, 1, 1).data]
    }
    const layers = [
      { rgba: rgb(DUST), alpha: 0.55 },
      { rgba: rgb(colors.incident), alpha: 0.45 },
      { rgba: rgb(colors.quote), alpha: 0.35 },
    ]
    const table = new Uint32Array(8)
    const bg = rgb(paper)
    for (let mask = 0; mask < 8; mask += 1) {
      let [r, g, b] = bg
      layers.forEach((l, i) => {
        if (!(mask & (1 << i))) return
        const la = (l.rgba[3] / 255) * l.alpha
        r = l.rgba[0] * la + r * (1 - la)
        g = l.rgba[1] * la + g * (1 - la)
        b = l.rgba[2] * la + b * (1 - la)
      })
      table[mask] = (255 << 24) | (Math.round(b) << 16) | (Math.round(g) << 8) | Math.round(r)
    }
    const squareSize = (v, gain) =>
      v < 0.08 ? 0 : Math.min(CELL - 1, Math.max(1, Math.round(Math.sqrt(v * gain) * CELL * 0.5)))
    const drawDust = (ctx, yaw, pitch) => {
      const project = projector(yaw, pitch)
      const focus = focusOf()
      resetGrids()
      for (const p of dust) {
        const [x, y, z] = project(p)
        splat(grids.dust, x, y, Math.max(0.25, Math.min(1, 0.6 + z * 0.6)))
      }
      for (const n of nodes) {
        const z = project(n.p)[2]
        const w = Math.max(0.3, Math.min(1, 0.7 + z * 0.55)) * (focus && focus !== n.id ? 0.4 : 1)
        for (const g of n.grain) {
          const [gx, gy] = project([n.p[0] + g[0], n.p[1] + g[1], n.p[2] + g[2]])
          splat(grids[n.kind], gx, gy, w)
        }
      }
      pixels.fill(table[0])
      const sw = W
      const sh = H
      for (let gy = 0; gy < gh; gy += 1) {
        for (let gx = 0; gx < gw; gx += 1) {
          const k = gy * gw + gx
          const d0 = squareSize(grids.dust[k], 0.6)
          const d1 = squareSize(grids.incident[k], 0.5)
          const d2 = squareSize(grids.quote[k], 0.5)
          const dm = Math.max(d0, d1, d2)
          if (!dm) continue
          const x0 = gx * CELL - (d0 >> 1)
          const y0 = gy * CELL - (d0 >> 1)
          const x1 = gx * CELL - (d1 >> 1)
          const y1 = gy * CELL - (d1 >> 1)
          const x2 = gx * CELL - (d2 >> 1)
          const y2 = gy * CELL - (d2 >> 1)
          const lo = gx * CELL - (dm >> 1)
          const to = gy * CELL - (dm >> 1)
          for (let y = Math.max(0, to); y < Math.min(sh, to + dm); y += 1) {
            for (let x = Math.max(0, lo); x < Math.min(sw, lo + dm); x += 1) {
              const m = (d0 && x >= x0 && x < x0 + d0 && y >= y0 && y < y0 + d0 ? 1 : 0)
                | (d1 && x >= x1 && x < x1 + d1 && y >= y1 && y < y1 + d1 ? 2 : 0)
                | (d2 && x >= x2 && x < x2 + d2 && y >= y2 && y < y2 + d2 ? 4 : 0)
              if (m) pixels[y * sw + x] = table[m]
            }
          }
        }
      }
      ctx.putImageData(image, 0, 0)
    }

    // ---- Frame loop: the dust, bubble stacking order, and cross-fades ------------------

    // Two opaque canvases: whichever is hidden gets the new frame, then the top one fades
    // in (new frame on top) or out (new frame underneath). Either way it is a straight
    // blend from the old frame to the new, with no change in stacking.
    let topShown = true
    let fade = null
    let gap = 16.7
    let last = 0
    let lastDust = 0
    let dirty = true
    let frameId = 0
    let looping = false
    let order = ''
    const tick = (now) => {
      frameId = requestAnimationFrame(tick)
      const dt = now - last
      last = now
      if (dt > 0 && dt < 250) gap += (dt - gap) * 0.1
      // While turning, the dust is drawn ~30 times a second whatever the script frame rate
      // (Safari's Low Power Mode gives 30, a 120Hz screen in Chrome 120), each frame drawn
      // for the moment the next one will replace it and faded in on the compositor over
      // that time, so the dots move continuously. Still: drawn straight away when changed.
      const blend = playing && anims.length > 0
      if (blend ? now - lastDust < DUST_MS - 5 : !dirty) return
      const lead = blend ? Math.ceil((DUST_MS - 5) / gap) * gap : 0
      lastDust = now
      dirty = false
      const yaw = yawNow(lead)

      // Nearer bubbles in front; the order changes rarely, so this runs at script pace.
      const shown = place(yawNow(), view.pitch).sort((p, q) => p.z - q.z)
      const key = shown.map((s) => s.n.id).join()
      if (key !== order) {
        order = key
        shown.forEach((s, i) => { s.n.dom.holder.style.zIndex = String(i + 1) })
      }

      fade?.cancel()
      fade = null
      const top = canvases[1]
      if (blend) {
        drawDust(contexts[topShown ? 0 : 1], yaw, view.pitch)
        topShown = !topShown
        top.style.opacity = topShown ? '1' : '0'
        fade = top.animate([{ opacity: topShown ? 0 : 1 }, { opacity: topShown ? 1 : 0 }], { duration: lead, easing: 'linear' })
      } else {
        drawDust(contexts[topShown ? 1 : 0], yaw, view.pitch)
      }
    }
    const startLoop = () => {
      if (looping) return
      looping = true
      last = performance.now()
      frameId = requestAnimationFrame(tick)
    }
    const stopLoop = () => {
      looping = false
      cancelAnimationFrame(frameId)
    }

    // Drift plays only while the hero is on screen, the tab is visible and nothing is
    // pointed at or dragged.
    let visible = true
    let ready = false
    const sync = () => {
      const on = ready && visible && !document.hidden
      if (on) startLoop()
      else stopLoop()
      const play = on && !reduce && !state.drag && !focusOf()
      if (play === playing) return
      playing = play
      dirty = true
      anims.forEach((a) => (play ? a.play() : a.pause()))
    }

    const size = () => {
      W = root.clientWidth
      H = root.clientHeight
      if (!W || !H) return false
      canvases.forEach((c) => {
        c.width = W
        c.height = H
      })
      image = contexts[0].createImageData(W, H)
      pixels = new Uint32Array(image.data.buffer)
      return true
    }
    const rebuild = () => {
      const yaw = yawNow()
      if (!size()) return
      build()
      view.yaw = yaw
      if (reduce) pose(view.yaw, view.pitch, STILL)
      else bake(view.yaw, view.pitch)
      order = ''
      dirty = true
    }

    let resizeTimer = 0
    let lastSize = ''
    const resize = new ResizeObserver(() => {
      const key = `${root.clientWidth}x${root.clientHeight}`
      if (key === lastSize || !ready) return
      lastSize = key
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(rebuild, 120)
    })
    resize.observe(root)

    let alive = true
    // Labels are measured, so wait for the webfont.
    ;(document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (!alive) return
      lastSize = `${root.clientWidth}x${root.clientHeight}`
      ready = true
      rebuild()
      sync()
    })

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sync()
    })
    io.observe(root)
    document.addEventListener('visibilitychange', sync)

    // ---- Pointer: drag turns the graph; pointing at a node shows its card --------------

    function paintFocus() {
      const focus = focusOf()
      for (const n of nodes) {
        if (!n.dom) continue
        n.dom.fx.style.opacity = focus && focus !== n.id ? '0.35' : '1'
        n.dom.fx.style.transform = focus === n.id ? `scale(${FOCUS})` : ''
        if (n.dom.label) n.dom.label.style.opacity = !focus ? '1' : focus === n.id ? '0' : '0.3'
      }
      for (const group of stage.querySelectorAll('[data-ends]')) {
        const [a, b] = group.dataset.ends.split(' ')
        group.style.opacity = focus && focus !== a && focus !== b ? '0.25' : '1'
      }
      dirty = true
    }

    const placeCard = (id) => {
      const el = cardRef.current
      const s = place(yawNow(), view.pitch).find((p) => p.n.id === id)
      if (!s || !el) return
      const r = s.r * FOCUS
      const w = el.offsetWidth
      const h = el.offsetHeight
      let x = s.x + r + 12
      if (x + w > W - 12) x = s.x - r - 12 - w
      x = Math.max(12, x)
      const y = Math.max(12, Math.min(H - h - 12, s.y - 12))
      el.style.left = `${x}px`
      el.style.top = `${y}px`
    }

    let hideTimer = 0
    const setFocus = () => {
      paintFocus()
      sync()
    }
    const show = (id) => {
      clearTimeout(hideTimer)
      if (state.pinned === id) return
      state.pinned = id
      setCard(byId.get(id))
      setFocus()
    }
    const hide = () => {
      clearTimeout(hideTimer)
      state.pinned = null
      setCard(null)
      setFocus()
    }
    const hideSoon = () => {
      clearTimeout(hideTimer)
      hideTimer = setTimeout(hide, 350)
    }
    api.current = { keep: () => clearTimeout(hideTimer), hideSoon, placeCard }

    const local = (e) => {
      const b = root.getBoundingClientRect()
      return [e.clientX - b.left, e.clientY - b.top]
    }
    const hit = (x, y) =>
      place(yawNow(), view.pitch)
        .filter((s) => Math.hypot(s.x - x, s.y - y) < s.r + 8)
        .sort((a, b) => b.z - a.z)[0]

    let dragAt = 0
    const onDown = (e) => {
      if (!ready || e.target !== canvases[0] && e.target !== canvases[1]) return
      const [x, y] = local(e)
      state.drag = { x, y, yaw: yawNow(), pitch: view.pitch, moved: 0, still: false }
      root.setPointerCapture(e.pointerId)
      sync()
    }
    const onMove = (e) => {
      if (!ready) return
      const [x, y] = local(e)
      const d = state.drag
      if (d) {
        d.moved = Math.max(d.moved, Math.hypot(x - d.x, y - d.y))
        if (d.moved < 4) return
        // Dragging leaves the baked paths and poses the parts directly.
        if (!d.still) {
          d.still = true
          unbake()
        }
        view.yaw = d.yaw + (x - d.x) / 170
        view.pitch = clamp(d.pitch + (y - d.y) / 230, -1, 1)
        root.style.cursor = 'grabbing'
        pose(view.yaw, view.pitch, dragAt ? clamp(e.timeStamp - dragAt, 1, 100) : 16)
        dragAt = e.timeStamp
        dirty = true
        return
      }
      if (e.target !== canvases[0] && e.target !== canvases[1]) {
        // Over the card: keep it, but nothing under the pointer is hovered any more.
        if (state.hover) {
          state.hover = null
          setFocus()
        }
        return
      }
      const s = hit(x, y)
      state.hover = s ? s.n.id : null
      root.style.cursor = s ? 'pointer' : 'grab'
      if (s) show(s.n.id)
      else if (state.pinned) hideSoon()
      else setFocus()
    }
    const onUp = (e) => {
      const d = state.drag
      if (!d) return
      root.style.cursor = 'grab'
      state.drag = null
      dragAt = 0
      if (d.still) {
        // Pick the drift up again from wherever the drag left the graph.
        if (reduce) pose(view.yaw, view.pitch, STILL)
        else bake(view.yaw, view.pitch)
        dirty = true
      }
      sync()
      if (d.moved >= 6) return
      // Touch has no hover, so a tap shows the card; tapping empty space hides it.
      const [x, y] = local(e)
      const s = hit(x, y)
      if (s) show(s.n.id)
      else hide()
    }
    const onLeave = () => {
      state.hover = null
      if (state.pinned) hideSoon()
      else setFocus()
    }
    root.addEventListener('pointerdown', onDown)
    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerup', onUp)
    root.addEventListener('pointercancel', onUp)
    root.addEventListener('pointerleave', onLeave)

    return () => {
      alive = false
      stopLoop()
      unbake()
      fade?.cancel()
      clearTimeout(hideTimer)
      clearTimeout(resizeTimer)
      io.disconnect()
      resize.disconnect()
      document.removeEventListener('visibilitychange', sync)
      root.removeEventListener('pointerdown', onDown)
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerup', onUp)
      root.removeEventListener('pointercancel', onUp)
      root.removeEventListener('pointerleave', onLeave)
      stage.replaceChildren()
    }
    // The refs are stable for the component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Put the card beside its node once it has rendered and has a size, before it paints.
  useLayoutEffect(() => {
    if (card) api.current.placeCard?.(card.id)
  }, [card])

  return (
    // The caller positions and sizes the box (it must be positioned for the card).
    <div
      ref={rootRef}
      className={`${className} cursor-grab touch-none select-none`}
      role="img"
      aria-label="The newest AI safety incidents and statements by officials"
    >
      {canvasRefs.map((ref, i) => (
        <canvas
          key={i}
          ref={ref}
          className="absolute inset-0 h-full w-full"
          style={{ imageRendering: 'pixelated' }}
          aria-hidden="true"
        />
      ))}
      <div ref={stageRef} className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden="true" />
      {card ? (
        <div
          ref={cardRef}
          className="absolute z-10 w-72 max-w-[calc(100%-1.5rem)] border border-line bg-paper px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
          onPointerEnter={() => api.current.keep?.()}
          onPointerLeave={() => api.current.hideSoon?.()}
        >
          <p className="text-base leading-snug text-ink">{card.head}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{card.meta}</p>
          {card.link ? (
            <a
              href={card.link.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-ink underline underline-offset-4 hover:opacity-70"
            >
              {card.link.title} ↗
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
