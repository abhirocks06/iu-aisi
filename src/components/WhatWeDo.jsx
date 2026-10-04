import { useLayoutEffect, useRef, useState } from 'react'

/*
 * "What We Do" as a small graph with two levels. Each activity is a primary node (its
 * title and a large dot); the topics in its copy are secondary nodes (highlighted, with a
 * small dot), tied to their activity by thin pale edges. Crimson edges run across
 * activities and trace the path the work takes: discussion of new AI developments feeds
 * the research, and its governance frameworks reach policymakers at community events.
 *
 * Edges are drawn in an SVG overlay from the nodes' measured positions, so they follow
 * the text however it wraps. They draw themselves in once when the section comes into
 * view (opacity and stroke only; nothing is drawn per frame).
 */

const activities = [
  {
    id: 'meet',
    title: 'Discussion Meetings',
    copy: ['Weekly roundtables on new ', ['ai', 'AI developments'], ', emerging capabilities, and the U.S.–China race at the frontier.'],
    place: 'lg:mr-auto lg:max-w-[34rem]',
  },
  {
    id: 'research',
    title: 'Research Projects',
    copy: ['Team projects on alignment, ', ['interp', 'interpretability'], ', evaluations, and ', ['gov', 'governance frameworks'], '.'],
    place: 'lg:ml-auto lg:mr-[2%] lg:max-w-[38rem]',
  },
  {
    id: 'events',
    title: 'Community Events',
    copy: ['Speaker panels and networking sessions with researchers, ', ['policy', 'policymakers'], ', and industry leaders.'],
    place: 'lg:ml-[16%] lg:max-w-[36rem]',
  },
]

// [from, to, kind]: 'tree' joins an activity to its topics; 'flow' runs across activities.
const EDGES = [
  ['meet', 'ai', 'tree'],
  ['research', 'interp', 'tree'],
  ['research', 'gov', 'tree'],
  ['events', 'policy', 'tree'],
  ['meet', 'research', 'flow'],
  ['gov', 'events', 'flow'],
]

// A curve that leaves and arrives along the longer axis, so edges read as a tidy flow.
function curve(a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (Math.abs(dx) > Math.abs(dy)) {
    return `M${a.x},${a.y} C${a.x + dx * 0.5},${a.y} ${b.x - dx * 0.5},${b.y} ${b.x},${b.y}`
  }
  return `M${a.x},${a.y} C${a.x},${a.y + dy * 0.5} ${b.x},${b.y - dy * 0.5} ${b.x},${b.y}`
}

// Down, then across into the target, with one rounded corner: the governance route.
function elbow(a, b) {
  const r = Math.min(18, Math.abs(b.y - a.y) / 2, Math.abs(b.x - a.x) / 2)
  const sx = Math.sign(b.x - a.x) || 1
  return `M${a.x},${a.y} V${b.y - r} Q${a.x},${b.y} ${a.x + sx * r},${b.y} H${b.x}`
}

// Narrow screens: out to a rail in the right margin, down it, and back in, so the edge
// never crosses a paragraph.
function rail(a, b, x) {
  const r = 10
  return `M${a.x},${a.y} H${x - r} Q${x},${a.y} ${x},${a.y + r} V${b.y - r} Q${x},${b.y} ${x - r},${b.y} H${b.x}`
}

export default function WhatWeDo() {
  const rootRef = useRef(null)
  const [geo, setGeo] = useState(null)
  const [shown, setShown] = useState(false)

  useLayoutEffect(() => {
    const root = rootRef.current
    const measure = () => {
      const box = root.getBoundingClientRect()
      const at = {}
      for (const el of root.querySelectorAll('[data-node]')) {
        const r = el.getBoundingClientRect()
        at[el.dataset.node] = { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top }
      }
      setGeo({ w: box.width, h: box.height, at })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    document.fonts?.ready.then(() => root.isConnected && measure())
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(root)
    return () => {
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return (
    <div ref={rootRef} className={`wwd relative ${shown ? 'wwd-on' : ''}`}>
      {geo ? (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          viewBox={`0 0 ${geo.w} ${geo.h}`}
          aria-hidden="true"
        >
          {/* Faint guides through each activity's node, like construction lines. */}
          {activities.map(({ id }) => {
            const p = geo.at[id]
            return p ? (
              <g key={id} className="wwd-guide" stroke="currentColor">
                <line x1={p.x} y1={p.y - 70} x2={p.x} y2={p.y + 90} strokeDasharray="1 5" />
                <line x1={p.x - 90} y1={p.y} x2={p.x + 50} y2={p.y} strokeDasharray="1 5" />
              </g>
            ) : null
          })}
          {EDGES.map(([from, to, kind], i) => {
            const a = geo.at[from]
            const b = geo.at[to]
            if (!a || !b) return null
            const d =
              kind === 'flow' && geo.w < 640
                ? rail(a, b, geo.w + 10)
                : from === 'gov' && to === 'events'
                  ? elbow(a, b)
                  : curve(a, b)
            return (
              <path
                key={`${from}-${to}`}
                d={d}
                pathLength="1"
                className={`wwd-edge wwd-${kind}`}
                style={{ transitionDelay: `${300 + i * 140}ms` }}
              />
            )
          })}
        </svg>
      ) : null}

      <ol className="relative flex flex-col gap-14 sm:gap-16 lg:gap-12">
        {activities.map((item, i) => (
          <li key={item.id} className={`wwd-item ${item.place}`} style={{ transitionDelay: `${i * 120}ms` }}>
            <h3 className="wwd-halo font-display text-[2rem] leading-[1.1] tracking-tight text-ink sm:text-[2.6rem] lg:text-5xl">
              {item.title}
              <span
                data-node={item.id}
                className="wwd-dot ml-3 inline-block h-3 w-3 translate-y-[-0.12em] rounded-full bg-crimson align-middle"
              />
            </h3>
            <p className="wwd-halo mt-4 max-w-[34rem] text-base leading-[1.75] text-muted sm:text-lg">
              {item.copy.map((part, j) =>
                typeof part === 'string' ? (
                  part
                ) : (
                  <mark key={j} className="relative whitespace-nowrap bg-crimson/[0.08] px-1 text-ink">
                    {part[1]}
                    <span
                      data-node={part[0]}
                      className={`wwd-dot absolute left-1/2 -ml-[3px] h-1.5 w-1.5 bg-crimson ${part[0] === 'gov' ? '-bottom-[3px]' : '-top-[3px] rounded-full'}`}
                    />
                  </mark>
                ),
              )}
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}
