import { useLayoutEffect, useRef } from 'react'

/*
 * The home headline folds into the nav wordmark. Once the page scrolls past a threshold,
 * A, I, S, I, "at" (as @), I and U fly up into their places in "AISI @ IU" while the rest
 * of the headline fades out; scrolling back above it plays the flight in reverse. The nav
 * wordmark stays hidden (via --wordmark) while the headline is showing.
 *
 * Like the Yale AIA logo, the scroll only triggers the animation; it doesn't scrub it.
 * Everything moves through Web Animations on transform and opacity, which browsers run off
 * the main thread, so it stays smooth when Safari holds scripts to 30fps in Low Power Mode.
 * Each letter's horizontal and vertical moves have their own easing, so it travels an arc,
 * and it cross-fades from the serif headline face to the nav's sans on the way.
 */

// [text, index of the nav wordmark letter it becomes, or null if it fades out]
const PARTS = [
  ['A', 0], ['I', 1], [' ', null], ['S', 2], ['afety', null], [' ', null],
  ['I', 3], ['nitiative', null], [' ', null], ['at', 4], [' ', null],
  ['I', 5], ['U', 6], [' ', null], ['Bloomington', null],
]

const DURATION = 860
const STAGGER = 20
// Each axis gets its own curve so the letters' paths don't cross. On the way up every
// letter slides sideways early, and letters from lower lines rise into the nav row last,
// once the first-line letters (the far-travelling "at" above all) have passed over them.
// Going back, each retraces its arc.
const FIRST = 'cubic-bezier(0.16, 1, 0.3, 1)'
const LATER = 'cubic-bezier(0.7, 0, 0.2, 1)'
const FADE_OUT = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'

export default function HeroTitle({ className }) {
  const h1Ref = useRef(null)

  // Layout effect so the nav wordmark is hidden before the first paint.
  useLayoutEffect(() => {
    const h1 = h1Ref.current
    const root = document.documentElement
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const kept = [...h1.querySelectorAll('[data-fold]')]
    const leaving = [...h1.querySelectorAll('[data-leave]')]
    const marks = () => [...document.querySelectorAll('header [data-mark]')]
    const setWordmark = (on) => root.style.setProperty('--wordmark', on ? '1' : '0')

    // Letters heading for the nav live in a fixed layer (the nav doesn't scroll); letters
    // heading back live in page coordinates (the headline does), so both land exactly.
    const layer = (position) => {
      const el = document.createElement('div')
      el.setAttribute('aria-hidden', 'true')
      el.dataset.foldLayer = ''
      el.style.cssText = `position:${position};left:0;top:0;width:0;height:0;z-index:70;pointer-events:none;`
      return el
    }
    const fixedLayer = layer('fixed')
    const pageLayer = layer('absolute')

    // Each flier is a point at the glyph's centre, nested three deep so the horizontal
    // move, the vertical move and the scale each get their own easing; the two glyphs
    // (headline serif, nav sans) are centred on it.
    const glyph = 'position:absolute;left:0;top:0;transform:translate(-50%,-50%);white-space:pre;'
    const fliers = kept.map((el) => {
      const x = document.createElement('div')
      const y = document.createElement('div')
      const z = document.createElement('div')
      const serif = document.createElement('span')
      const sans = document.createElement('span')
      x.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;'
      y.style.cssText = 'position:absolute;left:0;top:0;'
      z.style.cssText = 'position:absolute;left:0;top:0;transform-origin:0 0;'
      serif.style.cssText = glyph
      sans.style.cssText = `${glyph}opacity:0;`
      serif.textContent = el.textContent
      z.append(serif, sans)
      y.append(z)
      x.append(y)
      return { el, x, y, z, serif, sans, mark: Number(el.dataset.fold), anims: [] }
    })

    let folded = false
    let live = false
    let flight = 0
    let fades = []
    let threshold = 80

    const center = (r, dx = 0, dy = 0) => ({ x: r.left + r.width / 2 + dx, y: r.top + r.height / 2 + dy })

    // Copy the current faces onto the fliers (fonts may have loaded since the last flight).
    const dress = () => {
      const hero = getComputedStyle(h1)
      const m = marks()
      const nav = m[0] ? getComputedStyle(m[0]) : hero
      const heroSize = parseFloat(hero.fontSize)
      const navSize = parseFloat(nav.fontSize)
      fliers.forEach((f) => {
        Object.assign(f.serif.style, {
          fontFamily: hero.fontFamily,
          fontSize: hero.fontSize,
          fontWeight: hero.fontWeight,
          letterSpacing: hero.letterSpacing,
          lineHeight: 'normal',
          color: hero.color,
        })
        // The sans glyph is set at the headline size and scaled down with the flier, so it
        // ends exactly at the nav letter's size without being enlarged from a small raster.
        Object.assign(f.sans.style, {
          fontFamily: nav.fontFamily,
          fontSize: hero.fontSize,
          fontWeight: nav.fontWeight,
          letterSpacing: `${(parseFloat(nav.letterSpacing) || 0) * (heroSize / navSize)}px`,
          textTransform: nav.textTransform,
          lineHeight: 'normal',
          color: nav.color,
        })
        f.sans.textContent = m[f.mark]?.textContent ?? f.el.textContent
      })
      return navSize / heroSize
    }

    const fly = (toNav) => {
      folded = toNav
      const id = ++flight
      const k = dress()
      const navRects = marks().map((m) => m.getBoundingClientRect())
      const sx = window.scrollX
      const sy = window.scrollY

      // Where every letter is right now (mid-flight letters included), read before any change.
      const now = fliers.map((f) => {
        if (live) {
          const p = f.z.getBoundingClientRect()
          return {
            x: p.left,
            y: p.top,
            s: f.serif.getBoundingClientRect().width / (f.serif.offsetWidth || 1),
            serif: parseFloat(getComputedStyle(f.serif).opacity),
            sans: parseFloat(getComputedStyle(f.sans).opacity),
          }
        }
        return toNav
          ? { ...center(f.el.getBoundingClientRect()), s: 1, serif: 1, sans: 0 }
          : { ...center(navRects[f.mark]), s: k, serif: 0, sans: 1 }
      })
      const targets = fliers.map((f) =>
        toNav
          ? { ...center(navRects[f.mark]), s: k }
          : { ...center(f.el.getBoundingClientRect(), sx, sy), s: 1 },
      )
      const leftNow = leaving.map((el) => parseFloat(getComputedStyle(el).opacity))
      // Which headline line each letter sits on (0 = first).
      const tops = kept.map((el) => el.getBoundingClientRect().top)
      const lineHeight = parseFloat(getComputedStyle(h1).fontSize)
      const lineOf = tops.map((t) => Math.round((t - Math.min(...tops)) / lineHeight))

      // Within each line, the letter furthest along the direction of travel leaves first,
      // so no letter catches up with the one ahead of it.
      const rank = new Map()
      for (const line of new Set(lineOf)) {
        const members = fliers.map((f, i) => i).filter((i) => lineOf[i] === line)
        const heading = Math.sign(members.reduce((sum, i) => sum + targets[i].x - now[i].x, 0)) || 1
        members
          .sort((a, b) => heading * (now[b].x - now[a].x))
          .forEach((i, r) => rank.set(i, r))
      }

      live = true
      kept.forEach((el) => { el.style.visibility = 'hidden' })
      if (!toNav) setWordmark(false)
      fliers.forEach((f, i) => {
        const from = now[i]
        const to = targets[i]
        if (!toNav) {
          from.x += sx
          from.y += sy
        }
        f.anims.forEach((a) => a.cancel())
        ;(toNav ? fixedLayer : pageLayer).appendChild(f.x)
        f.x.style.left = `${to.x}px`
        f.x.style.top = `${to.y}px`
        f.x.style.visibility = 'visible'
        const delay = rank.get(i) * STAGGER
        const timing = { duration: DURATION, delay, fill: 'both' }
        const firstLine = lineOf[i] === 0
        // The typeface changes over the middle of the flight: the old face mostly leaves
        // before the new one arrives, so the two never sit fully on top of each other.
        const swap = (start) => ({ duration: DURATION * 0.32, delay: delay + DURATION * start, fill: 'both', easing: 'linear' })
        const [inFace, outFace] = toNav ? ['sans', 'serif'] : ['serif', 'sans']
        f.anims = [
          f.x.animate(
            [{ transform: `translateX(${from.x - to.x}px)` }, { transform: 'translateX(0px)' }],
            { ...timing, easing: toNav ? FIRST : LATER },
          ),
          f.y.animate(
            [{ transform: `translateY(${from.y - to.y}px)` }, { transform: 'translateY(0px)' }],
            { ...timing, easing: firstLine === toNav ? FIRST : LATER },
          ),
          // Letters shrink early on the way up (before any can crowd its neighbour) and
          // grow late on the way back.
          f.z.animate(
            [{ transform: `scale(${from.s})` }, { transform: `scale(${to.s})` }],
            { ...timing, easing: toNav ? FIRST : LATER },
          ),
          f[outFace].animate([{ opacity: from[outFace] }, { opacity: 0 }], swap(0.16)),
          f[inFace].animate([{ opacity: from[inFace] }, { opacity: 1 }], swap(0.3)),
        ]
      })

      // The rest of the headline leaves fast and comes back once the letters are nearly home.
      fades.forEach((a) => a.cancel())
      fades = leaving.map((el, i) =>
        el.animate(
          [{ opacity: leftNow[i] }, { opacity: toNav ? 0 : 1 }],
          toNav
            ? { duration: 220, easing: FADE_OUT, fill: 'forwards' }
            : { duration: 380, delay: DURATION * 0.55, easing: 'ease-out', fill: 'forwards' },
        ),
      )

      const last = fliers.reduce((a, f, i) => (rank.get(i) > rank.get(a) ? i : a), 0)
      fliers[last].anims[1].finished
        .then(() => {
          if (id !== flight) return
          live = false
          fliers.forEach((f) => {
            f.x.style.visibility = 'hidden'
            f.anims.forEach((a) => a.cancel())
            f.anims = []
          })
          if (toNav) setWordmark(true)
          else kept.forEach((el) => { el.style.visibility = '' })
        })
        .catch(() => {})
    }

    // Reduced motion: the headline stays put and the wordmark simply fades in.
    const fadeWordmark = (on) => {
      folded = on
      setWordmark(on)
      document
        .querySelector('header [aria-label="AISI @ IU"]')
        ?.animate([{ opacity: on ? 0 : 1 }, { opacity: on ? 1 : 0 }], { duration: 200, easing: 'ease-out' })
    }

    const measure = () => {
      const header = document.querySelector('header')?.getBoundingClientRect().height ?? 56
      // Fold as the headline is about to slide under the nav (and not before 40px of scroll).
      threshold = Math.max(40, h1.getBoundingClientRect().top + window.scrollY - header - 16)
    }
    const onScroll = () => {
      const want = window.scrollY > threshold
      if (want === folded) return
      if (reduce) fadeWordmark(want)
      else fly(want)
    }

    measure()
    // Arriving already scrolled down (reload, back button): start folded, no flight.
    folded = window.scrollY > threshold
    setWordmark(folded)
    if (folded && !reduce) {
      kept.forEach((el) => { el.style.visibility = 'hidden' })
      leaving.forEach((el) => { el.style.opacity = '0' })
    }
    if (!reduce) document.body.append(fixedLayer, pageLayer)

    const onResize = () => {
      measure()
      onScroll()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    // Webfonts can move the headline after the first layout.
    document.fonts?.ready.then(() => {
      if (h1.isConnected) measure()
    })

    return () => {
      flight += 1
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      fliers.forEach((f) => f.anims.forEach((a) => a.cancel()))
      fades.forEach((a) => a.cancel())
      fixedLayer.remove()
      pageLayer.remove()
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
