import { useEffect, useRef } from 'react'

/*
 * The home headline folds into the nav wordmark as you scroll: A, I, S, I, "at" (as @),
 * I and U fly to their places in "AISI @ IU", the rest fades out, and in the last stretch
 * the serif letters cross-fade into the nav's wordmark. The nav wordmark stays hidden at
 * the top of the home page (via --wordmark). Scrubbed by scroll, so it reverses on the way
 * back up. Reduced motion: no flight, the wordmark simply fades in.
 *
 * Mechanism after the Codrops "Collapsing Logo" effect (PracticalVR): leftover content
 * leaves fast, the kept marks collapse to the logo with a staggered ease-out.
 */

// [text, index of the nav wordmark letter it becomes, or null if it fades out]
const PARTS = [
  ['A', 0], ['I', 1], [' ', null], ['S', 2], ['afety', null], [' ', null],
  ['I', 3], ['nitiative', null], [' ', null], ['at', 4], [' ', null],
  ['I', 5], ['U', 6], [' ', null], ['Bloomington', null],
]

const clamp = (v) => Math.max(0, Math.min(1, v))
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
// Ease-out (expo-like, as in the Codrops piece) so letters settle into the nav.
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

export default function HeroTitle({ className }) {
  const h1Ref = useRef(null)

  useEffect(() => {
    const h1 = h1Ref.current
    const root = document.documentElement
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const kept = [...h1.querySelectorAll('[data-fold]')]
    const leaving = [...h1.querySelectorAll('[data-leave]')]
    const marks = () => [...document.querySelectorAll('header [data-mark]')]

    // Fixed layer above the sticky nav for the letters in flight.
    const layer = document.createElement('div')
    layer.setAttribute('aria-hidden', 'true')
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:70;display:none;'
    const fliers = kept.map((el) => {
      const s = document.createElement('span')
      s.textContent = el.textContent
      s.style.cssText = 'position:absolute;left:0;top:0;white-space:pre;transform-origin:50% 50%;will-change:transform,opacity;'
      layer.appendChild(s)
      return s
    })
    // Reduced motion never flies letters, so the layer is only added when it can be used.
    if (!reduce) document.body.appendChild(layer)

    let from = []
    let to = []
    let distance = 300
    const measure = () => {
      const cs = getComputedStyle(h1)
      const y = window.scrollY
      from = kept.map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top + y + r.height / 2, w: r.width, h: r.height }
      })
      const m = marks()
      const markSize = m[0] ? parseFloat(getComputedStyle(m[0]).fontSize) : 16
      to = kept.map((el) => {
        const r = m[Number(el.dataset.fold)]?.getBoundingClientRect()
        return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2, k: markSize / parseFloat(cs.fontSize) } : null
      })
      fliers.forEach((s, i) => {
        Object.assign(s.style, {
          font: cs.font,
          letterSpacing: cs.letterSpacing,
          color: cs.color,
          width: `${from[i].w}px`,
          height: `${from[i].h}px`,
          lineHeight: `${from[i].h}px`,
          textAlign: 'center',
        })
      })
      // The fold completes as the headline would reach the nav.
      const header = document.querySelector('header')?.getBoundingClientRect().height ?? 56
      distance = Math.max(160, h1.getBoundingClientRect().top + y - header)
    }

    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      const p = clamp(y / distance)
      if (p === 0) measure()
      root.style.setProperty('--wordmark', reduce ? String(p >= 1 ? 1 : 0) : String(smooth(0.82, 1, p)))
      if (reduce) return

      const flying = p > 0 && p < 1
      layer.style.display = p > 0 ? 'block' : 'none'
      layer.style.opacity = String(1 - smooth(0.82, 1, p))
      kept.forEach((el) => {
        el.style.visibility = p > 0 ? 'hidden' : ''
      })
      leaving.forEach((el) => {
        // Leftover words leave fast, before the kept letters have travelled far.
        el.style.opacity = String(1 - smooth(0, 0.15, p))
      })
      fliers.forEach((s, i) => {
        const a = from[i]
        const b = to[i]
        if (!a || !b) return
        const t = easeOut(clamp((p - i * 0.03) / (1 - 6 * 0.03)))
        const x = a.x + (b.x - a.x) * t
        const yy = a.y - y + (b.y - (a.y - y)) * t
        const k = 1 + (b.k - 1) * t
        s.style.transform = `translate3d(${x - a.w / 2}px, ${yy - a.h / 2}px, 0) scale(${k})`
      })
      layer.style.visibility = flying || p >= 1 ? 'visible' : 'hidden'
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const onResize = () => {
      measure()
      update()
    }

    measure()
    update()
    // The headline rises in on load; measure again once it has settled.
    const settle = setTimeout(onResize, 700)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(settle)
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      layer.remove()
      root.style.removeProperty('--wordmark')
      kept.forEach((el) => { el.style.visibility = '' })
      leaving.forEach((el) => { el.style.opacity = '' })
    }
  }, [])

  return (
    <h1 ref={h1Ref} className={className} aria-label="AI Safety Initiative at IU Bloomington">
      {PARTS.map(([text, mark], i) =>
        mark === null ? (
          <span key={i} data-leave="" aria-hidden="true">
            {text}
          </span>
        ) : (
          <span key={i} data-fold={mark} aria-hidden="true">
            {text}
          </span>
        ),
      )}
    </h1>
  )
}
