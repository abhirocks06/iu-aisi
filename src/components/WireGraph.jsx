import { useEffect, useRef, useState } from 'react'
import wire from '../data/wire.json'

/*
 * Home hero art: a slowly turning 3D graph of the 10 newest misalignment incidents
 * (crimson) and the 10 newest statements on AI risk by U.S. officials (ink), over a
 * halftone dust of older incidents. Pointing at a node opens a card with its source.
 * Data is a snapshot in src/data/wire.json; see its `source` field.
 */

// Only these nodes carry a short label by default; the rest show their full text on hover.
const ANCHORS = {
  'oa-images': 'User photos posted publicly',
  'oa-usgov': 'U.S. government sites probed',
  'oa-dns': 'Agent escaped through DNS',
  'gg-three-cos-public': 'Gemini hacked three firms',
  q0: 'Khanna: “extinction risk”',
}

const DUST = 'rgba(23, 23, 23, 0.34)'
const EDGE = 'rgba(23, 23, 23, 0.32)'
const CELL = 5
// Horizontal centre of the graph within its box; the box bleeds to the window edge.
const CX = 0.56
const KERNEL = [
  [0, 0, 1], [1, 0, 0.45], [-1, 0, 0.45], [0, 1, 0.45], [0, -1, 0.45],
  [1, 1, 0.2], [-1, 1, 0.2], [1, -1, 0.2], [-1, -1, 0.2],
]

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
  for (let k = 0; k < Math.max(incidents.length, quotes.length); k += 1) {
    if (incidents[k]) nodes.push(incidents[k])
    if (quotes[k]) nodes.push(quotes[k])
  }
  const scene = nodes.map((n, i) => ({
    ...n,
    handle: ANCHORS[n.id],
    size: n.kind === 'incident' ? 7 + n.severity * 5 : 6,
    p: sphere(i, nodes.length, n.kind === 'incident' ? 0.8 : 0.62, 0.5),
    grain: Array.from({ length: n.kind === 'incident' ? 140 : 60 }, () => [
      gauss() * 0.07, gauss() * 0.07, gauss() * 0.07,
    ]),
  }))

  // Older incidents as dust, clustered by chain.
  const chains = Object.entries(wire.olderByChain)
  const dust = chains.flatMap(([, count], i) => {
    const c = sphere(i, chains.length, 0.55, 1.3)
    return Array.from({ length: count * 10 }, () => [
      c[0] + gauss() * 0.14, c[1] + gauss() * 0.14, c[2] + gauss() * 0.14,
    ])
  })

  return { nodes: scene, dust, links: wire.links }
}

export default function WireGraph({ className = '' }) {
  const canvasRef = useRef(null)
  const screenRef = useRef(null)
  const cardRef = useRef(null)
  const api = useRef({})
  const [card, setCard] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
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

    let W = 0
    let H = 0
    // The halftone sits on its own canvas behind the main one, so the browser composites
    // the two layers and nothing is copied per frame.
    const screen = screenRef.current
    const sctx = screen.getContext('2d')
    let lastScreen = -Infinity
    let lastFocus = null
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = canvas.clientWidth
      H = canvas.clientHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      screen.width = canvas.width
      screen.height = canvas.height
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const resize = new ResizeObserver(() => {
      size()
      lastScreen = -Infinity
    })
    resize.observe(canvas)
    size()

    // Halftone screen: points land in a coarse grid; each cell becomes one square
    // sized by the density there.
    let gw = 0
    let gh = 0
    const grids = {}
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
    const drawScreen = (g, grid, color, gain, alpha) => {
      g.fillStyle = color
      g.globalAlpha = alpha
      g.beginPath()
      for (let gy = 0; gy < gh; gy += 1) {
        for (let gx = 0; gx < gw; gx += 1) {
          const v = grid[gy * gw + gx]
          if (v < 0.08) continue
          const d = Math.min(CELL - 1, Math.max(1, Math.round(Math.sqrt(v * gain) * CELL * 0.5)))
          g.rect(gx * CELL - (d >> 1), gy * CELL - (d >> 1), d, d)
        }
      }
      g.fill()
      g.globalAlpha = 1
    }
    // A disc shaded with a halftone dot screen, heavier on the side away from the light.
    // Each colour and size is drawn once into a small sprite and reused every frame.
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const sprites = new Map()
    const discSprite = (color, r) => {
      const key = `${color}|${r}`
      let sprite = sprites.get(key)
      if (sprite) return sprite
      const size = Math.ceil((r * 2 + 2) * dpr)
      sprite = document.createElement('canvas')
      sprite.width = size
      sprite.height = size
      const g = sprite.getContext('2d')
      g.scale(dpr, dpr)
      const c = r + 1
      g.fillStyle = color
      g.beginPath()
      g.arc(c, c, r, 0, Math.PI * 2)
      g.fill()
      if (r >= 6) {
        g.clip()
        g.fillStyle = paper
        g.globalAlpha = 0.9
        const step = 3.5
        g.beginPath()
        for (let py = -r; py <= r; py += step) {
          for (let px = -r; px <= r; px += step) {
            const nx = px / r
            const ny = py / r
            const q = nx * nx + ny * ny
            if (q > 1) continue
            const light = nx * -0.55 + ny * -0.6 + Math.sqrt(1 - q) * 0.58
            const d = Math.max(0, 0.62 - light) * step * 0.95
            if (d >= 0.35) g.rect(c + px - d / 2, c + py - d / 2, d, d)
          }
        }
        g.fill()
      }
      sprites.set(key, sprite)
      return sprite
    }
    const halftoneDisc = (x, y, r, color, alpha) => {
      const rr = Math.max(2, Math.round(r))
      const sprite = discSprite(color, rr)
      ctx.globalAlpha = alpha
      ctx.drawImage(sprite, x - rr - 1, y - rr - 1, rr * 2 + 2, rr * 2 + 2)
      ctx.globalAlpha = 1
    }

    const state = { yaw: 0.3, pitch: 0.28, drag: null, hover: null, pinned: null }
    let cy = 1
    let sy = 0
    let cp = 1
    let sp = 0
    const project = ([x, y, z]) => {
      const x1 = x * cy - z * sy
      const z1 = x * sy + z * cy
      const y1 = y * cp - z1 * sp
      const z2 = y * sp + z1 * cp
      const f = 2.4 / (2.4 + z2)
      const s = Math.min(W * 0.4, H * 0.44) * f
      return [W * CX + x1 * s, H * 0.5 - y1 * s, -z2, f]
    }

    // Anchor labels orbit their node (after Moritz Stefaner's label placement): each points
    // away from the graph's centre, its angle eases toward that direction, and its alignment
    // blends from left- to right-aligned with the angle. Labels are placed nearest-first; one
    // that would cover a nearer label or another node fades out until the space clears.
    const handleFont = `500 14px ${font}`
    const metaFont = `12px ${font}`
    const drawLabels = (list, focus, dt) => {
      const ease = 1 - Math.exp(-dt / 200)
      const placed = []
      const discs = list.map((s) => ({ id: s.n.id, x: s.x, y: s.y, r: s.r + 4 }))
      for (const s of [...list].sort((p, q) => q.z - p.z)) {
        const { n } = s
        if (!n.handle) continue
        const dx = s.x - W * CX
        const dy = s.y - H * 0.5
        const target = Math.hypot(dx, dy) > 8 ? Math.atan2(dy * 0.6, dx) : (n.ang ?? 0)
        if (n.ang === undefined) n.ang = target
        n.ang += Math.atan2(Math.sin(target - n.ang), Math.cos(target - n.ang)) * ease
        const c = Math.cos(n.ang)
        const sn = Math.sin(n.ang)
        ctx.font = handleFont
        const w1 = ctx.measureText(n.handle).width
        ctx.font = metaFont
        const w2 = ctx.measureText(n.short).width
        const bw = Math.max(w1, w2)
        const bh = 32
        const ax = s.x + c * (s.r + 16)
        const ay = s.y + sn * (s.r + 16)
        const freeLeft = ax + 4 * c - (bw * (1 - c)) / 2
        const left = Math.max(8, Math.min(W - bw - 8, freeLeft))
        // Pushed in from the edge, a label can land on its own node; only then does that count.
        const pinnedToEdge = Math.abs(left - freeLeft) > 1
        const top = Math.max(8, Math.min(H - bh - 8, ay + 3 * sn - (bh * (1 - sn)) / 2))
        const box = { l: left - 4, t: top - 2, r: left + bw + 4, b: top + bh + 2 }
        const hitsBox = placed.some((o) => box.l < o.r && box.r > o.l && box.t < o.b && box.b > o.t)
        const hitsNode = discs.some((d) => (d.id !== n.id || pinnedToEdge)
          && d.x + d.r > box.l && d.x - d.r < box.r && d.y + d.r > box.t && d.y - d.r < box.b)
        const wanted = s.z > -0.25 && focus !== n.id && !hitsBox && !hitsNode ? 1 : 0
        n.vis = (n.vis ?? wanted) + (wanted - (n.vis ?? wanted)) * ease
        if (wanted) placed.push(box)
        if (n.vis < 0.02) continue

        const depth = Math.max(0.45, Math.min(1, 0.72 + s.z * 0.55))
        const a = (focus ? 0.3 : 1) * depth * n.vis
        ctx.globalAlpha = a * 0.4
        ctx.strokeStyle = ink
        ctx.lineWidth = 0.75
        ctx.beginPath()
        ctx.moveTo(s.x + c * (s.r + 3), s.y + sn * (s.r + 3))
        ctx.lineTo(ax, ay)
        ctx.stroke()
        ctx.globalAlpha = a
        ctx.textBaseline = 'top'
        ctx.textAlign = 'left'
        ctx.lineJoin = 'round'
        ctx.lineWidth = 4
        ctx.strokeStyle = paper
        const line = (text, f, fill, wl, y) => {
          const x = left + ((bw - wl) * (1 - c)) / 2
          ctx.font = f
          ctx.strokeText(text, x, y)
          ctx.fillStyle = fill
          ctx.fillText(text, x, y)
        }
        line(n.handle, handleFont, ink, w1, top)
        line(n.short, metaFont, muted, w2, top + 18)
      }
      ctx.globalAlpha = 1
    }

    let shown = []
    let frameId = 0
    let running = false
    let last = performance.now()

    const placeCard = (s) => {
      const el = cardRef.current
      if (!s || !el) return
      const w = el.offsetWidth
      const h = el.offsetHeight
      let x = s.x + s.r + 12
      if (x + w > W - 12) x = s.x - s.r - 12 - w
      x = Math.max(12, x)
      const y = Math.max(12, Math.min(H - h - 12, s.y - 12))
      el.style.left = `${x}px`
      el.style.top = `${y}px`
    }

    const drawScreens = (focus) => {
      resetGrids()
      for (const p of dust) {
        const [x, y, z] = project(p)
        splat(grids.dust, x, y, Math.max(0.25, Math.min(1, 0.6 + z * 0.6)))
      }
      for (const n of nodes) {
        const [, , z] = project(n.p)
        const w = Math.max(0.3, Math.min(1, 0.7 + z * 0.55)) * (focus && focus !== n.id ? 0.4 : 1)
        for (const g of n.grain) {
          const [gx, gy] = project([n.p[0] + g[0], n.p[1] + g[1], n.p[2] + g[2]])
          splat(grids[n.kind], gx, gy, w)
        }
      }
      sctx.clearRect(0, 0, W, H)
      drawScreen(sctx, grids.dust, DUST, 0.45, 0.4)
      drawScreen(sctx, grids.incident, colors.incident, 0.5, 0.45)
      drawScreen(sctx, grids.quote, colors.quote, 0.5, 0.35)
    }

    const frame = (now) => {
      const focus = state.hover || state.pinned
      // Idle drift is slow, so every other frame is enough; interaction gets full rate.
      if (!focus && !state.drag && now - last < 30) {
        frameId = requestAnimationFrame(frame)
        return
      }
      const dt = Math.min(64, now - last)
      last = now
      if (!reduce && !state.drag && !focus) state.yaw += dt * 0.00012
      ctx.clearRect(0, 0, W, H)

      cy = Math.cos(state.yaw)
      sy = Math.sin(state.yaw)
      cp = Math.cos(state.pitch)
      sp = Math.sin(state.pitch)

      // The halftone layer barely changes between frames, so it is rebuilt into its own
      // canvas about ten times a second while idle, and every frame during interaction.
      const refresh = focus !== lastFocus || state.drag || now - lastScreen > 100
      lastFocus = focus
      if (refresh) {
        lastScreen = now
        drawScreens(focus)
      }

      shown = nodes.map((n) => {
        const [x, y, z, f] = project(n.p)
        return { n, x, y, z, r: n.size * f * 1.1 }
      })

      const at = new Map(shown.map((s) => [s.n.id, s]))
      ctx.strokeStyle = EDGE
      ctx.lineWidth = 1
      for (const [a, b] of links) {
        const p = at.get(a)
        const q = at.get(b)
        if (!p || !q) continue
        const mx = (p.x + q.x) / 2
        const my = (p.y + q.y) / 2
        const dx = q.x - p.x
        const dy = q.y - p.y
        ctx.globalAlpha = focus && focus !== a && focus !== b ? 0.25 : 1
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.quadraticCurveTo(mx - dy * 0.25, my + dx * 0.25, q.x, q.y)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      for (const s of [...shown].sort((p, q) => p.z - q.z)) {
        const { n } = s
        const depth = Math.max(0.3, Math.min(1, 0.72 + s.z * 0.55))
        const dim = focus && focus !== n.id ? 0.35 : 1
        const color = colors[n.kind]
        const r = s.r * (focus === n.id ? 1.18 : 1)
        halftoneDisc(s.x, s.y, r, color, depth * dim)
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.globalAlpha = depth * dim * 0.45
        ctx.beginPath()
        ctx.arc(s.x, s.y, r + 4, 0, Math.PI * 2)
        ctx.stroke()

        ctx.globalAlpha = 1
      }
      drawLabels(shown, focus, dt)
      if (state.pinned) placeCard(at.get(state.pinned))
      frameId = requestAnimationFrame(frame)
    }

    // Only animate while the hero is on screen and the tab is visible.
    const start = () => {
      if (running) return
      running = true
      last = performance.now()
      frameId = requestAnimationFrame(frame)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(frameId)
    }
    let visible = true
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !document.hidden) start()
      else stop()
    })
    io.observe(canvas)
    const onVisibility = () => (document.hidden || !visible ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)

    // Pointer: drag turns the graph; pointing at a node opens its card.
    let hideTimer = 0
    const show = (id) => {
      clearTimeout(hideTimer)
      if (state.pinned === id) return
      state.pinned = id
      setCard(byId.get(id))
    }
    const hideSoon = () => {
      clearTimeout(hideTimer)
      hideTimer = setTimeout(() => {
        state.pinned = null
        setCard(null)
      }, 350)
    }
    const hide = () => {
      clearTimeout(hideTimer)
      state.pinned = null
      setCard(null)
    }
    api.current = { keep: () => clearTimeout(hideTimer), hideSoon }

    const local = (e) => {
      const b = canvas.getBoundingClientRect()
      return [e.clientX - b.left, e.clientY - b.top]
    }
    const hit = (x, y) =>
      shown.filter((s) => Math.hypot(s.x - x, s.y - y) < s.r + 8).sort((a, b) => b.z - a.z)[0]

    const onDown = (e) => {
      const [x, y] = local(e)
      state.drag = { x, y, yaw: state.yaw, pitch: state.pitch, moved: 0 }
      canvas.setPointerCapture(e.pointerId)
    }
    const onMove = (e) => {
      const [x, y] = local(e)
      if (state.drag) {
        const d = state.drag
        d.moved = Math.max(d.moved, Math.hypot(x - d.x, y - d.y))
        state.yaw = d.yaw + (x - d.x) / 170
        state.pitch = Math.max(-1, Math.min(1, d.pitch + (y - d.y) / 230))
        canvas.style.cursor = 'grabbing'
        return
      }
      const s = hit(x, y)
      state.hover = s ? s.n.id : null
      canvas.style.cursor = s ? 'pointer' : 'grab'
      if (s) show(s.n.id)
      else if (state.pinned) hideSoon()
    }
    const onUp = (e) => {
      canvas.style.cursor = 'grab'
      const tap = state.drag && state.drag.moved < 6
      state.drag = null
      if (!tap) return
      const [x, y] = local(e)
      const s = hit(x, y)
      if (s) show(s.n.id)
      else hide()
    }
    const onLeave = () => {
      state.hover = null
      if (state.pinned) hideSoon()
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('pointerleave', onLeave)

    return () => {
      stop()
      clearTimeout(hideTimer)
      io.disconnect()
      resize.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    // The caller positions and sizes the box (it must be positioned for the card).
    <div className={className}>
      <canvas ref={screenRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab touch-none"
        aria-label="The newest AI safety incidents and statements by officials"
        role="img"
      />
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
