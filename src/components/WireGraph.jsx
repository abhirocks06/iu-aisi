import { useEffect, useRef, useState } from 'react'
import wire from '../data/wire.json'

/*
 * Home hero art: a slowly turning 3D graph of the 10 newest misalignment incidents
 * (crimson) and the 10 newest statements on AI risk by U.S. officials (ink), over a
 * halftone dust of older incidents. Pointing at a node opens a card with its source.
 *
 * The drawing is a direct port of the "AI Safety Wire" artifact, with the same numbers,
 * so the two look and move the same. Data is a snapshot in src/data/wire.json.
 */

// Only these nodes carry a short label; the rest show their full text on hover.
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
  for (let k = 0; k < 10; k += 1) nodes.push({ ...incidents[k] }, { ...quotes[k] })
  nodes.forEach((n, i) => {
    n.handle = ANCHORS[n.id]
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

export default function WireGraph({ className = '' }) {
  const canvasRef = useRef(null)
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
    // The halftone screen is written straight into a pixel buffer at CSS resolution and
    // drawn with one call, instead of ~20,000 fillRect calls a frame. Every square sits on
    // whole CSS pixels and squares in different cells never overlap, so the picture is
    // identical; Safari in particular pays heavily per canvas call.
    const screen = document.createElement('canvas')
    const sctx = screen.getContext('2d')
    let image = null
    let pixels = null
    let dpr = 1
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = canvas.clientWidth
      H = canvas.clientHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      screen.width = Math.max(1, W)
      screen.height = Math.max(1, H)
      image = sctx.createImageData(screen.width, screen.height)
      pixels = new Uint32Array(image.data.buffer)
    }
    const resize = new ResizeObserver(size)
    resize.observe(canvas)
    size()

    // Halftone screen: points are splatted into a coarse grid, then each cell is drawn
    // as one square whose size follows the density there, like a printed screen.
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
    // The three layers (dust, incident grain, statement grain) are drawn in that order with
    // these colours and opacities, exactly as three fillRect passes would. Any pixel is
    // covered by some subset of the three squares in its cell, so its final colour comes
    // from a table of the 8 possible subsets, composited once.
    const rgb = (c) => {
      const t = document.createElement('canvas').getContext('2d')
      t.fillStyle = c
      t.fillRect(0, 0, 1, 1)
      return [...t.getImageData(0, 0, 1, 1).data]
    }
    const layers = [
      { grid: 'dust', gain: 0.6, rgba: rgb(DUST), alpha: 0.55 },
      { grid: 'incident', gain: 0.5, rgba: rgb(colors.incident), alpha: 0.45 },
      { grid: 'quote', gain: 0.5, rgba: rgb(colors.quote), alpha: 0.35 },
    ]
    const table = new Uint32Array(8)
    for (let mask = 1; mask < 8; mask += 1) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      layers.forEach((l, i) => {
        if (!(mask & (1 << i))) return
        const la = (l.rgba[3] / 255) * l.alpha
        r = l.rgba[0] * la + r * (1 - la)
        g = l.rgba[1] * la + g * (1 - la)
        b = l.rgba[2] * la + b * (1 - la)
        a = la + a * (1 - la)
      })
      const ch = (v) => Math.round(v / a)
      table[mask] = (Math.round(a * 255) << 24) | (ch(b) << 16) | (ch(g) << 8) | ch(r)
    }
    const squareSize = (v, gain) =>
      v < 0.08 ? 0 : Math.min(CELL - 1, Math.max(1, Math.round(Math.sqrt(v * gain) * CELL * 0.5)))
    const drawScreens = () => {
      pixels.fill(0)
      const sw = screen.width
      const sh = screen.height
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
      sctx.putImageData(image, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(screen, 0, 0, W, H)
      ctx.imageSmoothingEnabled = true
    }
    // A disc shaded with halftone: a dot screen in the page colour, heavier on the side
    // away from the light, so each node reads as a printed sphere. The disc is filled as
    // before; its paper dots are drawn once per radius (to the nearest half pixel) into a
    // sprite and laid on at the same opacity, which composites exactly like drawing each dot.
    const dotSprites = new Map()
    const dotSprite = (rq) => {
      let sprite = dotSprites.get(rq)
      if (sprite) return sprite
      sprite = document.createElement('canvas')
      const px = Math.ceil((rq * 2 + 2) * dpr)
      sprite.width = px
      sprite.height = px
      const g = sprite.getContext('2d')
      g.scale(dpr, dpr)
      const c = rq + 1
      g.beginPath()
      g.arc(c, c, rq, 0, Math.PI * 2)
      g.clip()
      g.fillStyle = paper
      g.globalAlpha = 0.9
      const step = 3.5
      for (let py = -rq; py <= rq; py += step) {
        for (let px2 = -rq; px2 <= rq; px2 += step) {
          const nx = px2 / rq
          const ny = py / rq
          const q = nx * nx + ny * ny
          if (q > 1) continue
          const light = nx * -0.55 + ny * -0.6 + Math.sqrt(1 - q) * 0.58
          const d = Math.max(0, 0.62 - light) * step * 0.95
          if (d < 0.35) continue
          g.fillRect(c + px2 - d / 2, c + py - d / 2, d, d)
        }
      }
      dotSprites.set(rq, sprite)
      return sprite
    }
    const halftoneDisc = (x, y, r, color, alpha) => {
      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      if (r >= 6) {
        const rq = Math.ceil(r * 2) / 2
        const half = (rq + 1) * (r / rq)
        ctx.drawImage(dotSprite(rq), x - half, y - half, half * 2, half * 2)
      }
      ctx.globalAlpha = 1
    }

    const state = { yaw: 0.3, pitch: 0.28, drag: null, hover: null, pinned: null }
    const project = ([x, y, z]) => {
      const cy = Math.cos(state.yaw)
      const sy = Math.sin(state.yaw)
      const cp = Math.cos(state.pitch)
      const sp = Math.sin(state.pitch)
      const x1 = x * cy - z * sy
      const z1 = x * sy + z * cy
      const y1 = y * cp - z1 * sp
      const z2 = y * sp + z1 * cp
      const f = 2.4 / (2.4 + z2)
      const s = Math.min(W * (W < 600 ? 0.62 : 0.5), H * 0.55) * f
      return [W / 2 + x1 * s, H * (W < 600 ? 0.58 : 0.54) - y1 * s, -z2, f]
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

    const frame = (now) => {
      const dt = Math.min(64, now - last)
      last = now
      if (!reduce && !state.drag && !state.hover && !state.pinned) state.yaw += dt * 0.00012
      const focus = state.hover || state.pinned
      ctx.clearRect(0, 0, W, H)

      resetGrids()
      for (const p of dust) {
        const [x, y, z] = project(p)
        splat(grids.dust, x, y, Math.max(0.25, Math.min(1, 0.6 + z * 0.6)))
      }
      shown = nodes.map((n) => {
        const [x, y, z, f] = project(n.p)
        return { n, x, y, z, f, r: n.size * f * (W < 600 ? 0.85 : 1.2) }
      })
      for (const s of shown) {
        const w = Math.max(0.3, Math.min(1, 0.7 + s.z * 0.55)) * (focus && focus !== s.n.id ? 0.4 : 1)
        for (const g of s.n.grain) {
          const [gx, gy] = project([s.n.p[0] + g[0], s.n.p[1] + g[1], s.n.p[2] + g[2]])
          splat(grids[s.n.kind], gx, gy, w)
        }
      }
      drawScreens()
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

        // The node: a halftone-shaded disc with a thin outer ring.
        const r = s.r * (focus === n.id ? 1.18 : 1)
        halftoneDisc(s.x, s.y, r, color, depth * dim)
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.globalAlpha = depth * dim * 0.45
        ctx.beginPath()
        ctx.arc(s.x, s.y, r + 4, 0, Math.PI * 2)
        ctx.stroke()

        // Anchor labels orbit their node instead of flipping sides (after Moritz Stefaner's
        // label placement): each label points away from the graph's centre, its angle eases
        // toward that direction with a damped follow, and the text alignment blends from
        // left-aligned (label to the right) to right-aligned (label to the left) with the angle.
        if (n.handle && s.z > -0.55 && focus !== n.id) {
          const dx = s.x - W / 2
          const dy = s.y - H * 0.54
          const far = Math.hypot(dx, dy)
          const target = far > 8 ? Math.atan2(dy * 0.6, dx) : (n.ang ?? 0)
          if (n.ang === undefined) n.ang = target
          let delta = target - n.ang
          delta = Math.atan2(Math.sin(delta), Math.cos(delta))
          n.ang += delta * (1 - Math.exp(-dt / 200))
          const c = Math.cos(n.ang)
          const sn = Math.sin(n.ang)

          // Fade out as the node turns away rather than disappearing at a cut-off.
          const turn = Math.max(0, Math.min(1, (s.z + 0.55) / 0.35))
          const a = (focus ? 0.3 : 1) * Math.max(0.45, depth) * turn
          ctx.font = `500 14px ${font}`
          const w1 = ctx.measureText(n.handle).width
          ctx.font = `12px ${font}`
          const w2 = ctx.measureText(n.short).width
          const bw = Math.max(w1, w2)
          const bh = 32

          // Leader line along the orbit angle, then the text block hangs off its end.
          const ax = s.x + c * (r + 16)
          const ay = s.y + sn * (r + 16)
          ctx.globalAlpha = a * 0.4
          ctx.strokeStyle = ink
          ctx.lineWidth = 0.75
          ctx.beginPath()
          ctx.moveTo(s.x + c * (r + 3), s.y + sn * (r + 3))
          ctx.lineTo(ax, ay)
          ctx.stroke()
          const left = Math.max(8, Math.min(W - bw - 8, ax + 4 * c - (bw * (1 - c)) / 2))
          const top = Math.max(8, Math.min(H - bh - 8, ay + 3 * sn - (bh * (1 - sn)) / 2))

          ctx.globalAlpha = a
          ctx.textBaseline = 'top'
          ctx.lineJoin = 'round'
          ctx.lineWidth = 4
          ctx.strokeStyle = paper
          const line = (text, f, fill, dx2, y) => {
            ctx.font = f
            ctx.textAlign = 'left'
            ctx.strokeText(text, left + dx2, y)
            ctx.fillStyle = fill
            ctx.fillText(text, left + dx2, y)
          }
          // Each line keeps the same blended alignment inside the block.
          const blend = (wl) => ((bw - wl) * (1 - c)) / 2
          line(n.handle, `500 14px ${font}`, ink, blend(w1), top)
          line(n.short, `12px ${font}`, muted, blend(w2), top + 18)
        }
        ctx.globalAlpha = 1
      }
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

    // Pointer: drag turns the graph; pointing at a node shows its card with a link.
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
    const hit = (x, y) => shown.filter((s) => Math.hypot(s.x - x, s.y - y) < s.r + 8).sort((a, b) => b.z - a.z)[0]

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
      // Touch has no hover, so a tap shows the card; tapping empty space hides it.
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
