import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/*
 * "What We Do" drawn as a layer of a neural network. On wide screens the topics are the
 * input layer (small hollow neurons) and the three activities the next layer (large
 * neurons, each heading its text). Like a dense layer every input connects to every
 * activity: its own activity by a strong crimson weight, the others by faint ones. All
 * edges sit in the gap between the layers, so none crosses text.
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

// Wide screens: topics (inputs) on the left, activities on the right, weights between.
function Network() {
  const ref = useRef(null)
  const [edges, setEdges] = useState([])

  useLayoutEffect(() => {
    const root = ref.current
    const measure = () => {
      const box = root.getBoundingClientRect()
      const c = (el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top }
      }
      const ins = [...root.querySelectorAll('[data-in]')]
      const outs = [...root.querySelectorAll('[data-out]')]
      const list = []
      ins.forEach((el) => {
        const a = c(el)
        outs.forEach((o) => {
          const b = c(o)
          list.push({ a, b, strong: el.dataset.in === o.dataset.out })
        })
      })
      setEdges(list)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    document.fonts?.ready.then(() => root.isConnected && measure())
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} className="relative hidden grid-cols-[14rem_minmax(6rem,11rem)_minmax(0,34rem)] lg:grid">
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        {edges
          .filter((e) => !e.strong)
          .map((e, i) => (
            <line key={`w${i}`} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} className="wwd-weight" />
          ))}
        {edges
          .filter((e) => e.strong)
          .map((e, i) => (
            <line
              key={`s${i}`}
              x1={e.a.x}
              y1={e.a.y}
              x2={e.b.x}
              y2={e.b.y}
              pathLength="1"
              className="wwd-branch wwd-strong"
              style={{ transitionDelay: `${600 + i * 90}ms` }}
            />
          ))}
      </svg>

      {/* Input layer: every topic, grouped by activity, spread over the layer's height. */}
      <ul className="flex flex-col justify-between py-2">
        {activities.flatMap((a, i) =>
          a.topics.map((t, j) => (
            <li
              key={t}
              className={`wwd-topic flex items-center justify-end gap-3 text-sm text-ink-soft ${j === 0 && i > 0 ? 'mt-5' : ''}`}
              style={{ transitionDelay: `${300 + (i * 3 + j) * 60}ms` }}
            >
              {t}
              <span data-in={i} className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full border-[1.25px] border-crimson bg-paper" />
            </li>
          )),
        )}
      </ul>
      <span aria-hidden="true" />

      {/* Next layer: the activities. */}
      <ol className="flex flex-col gap-12 py-1">
        {activities.map((a, i) => (
          <li key={a.title} className="relative pl-9">
            <span
              data-out={i}
              aria-hidden="true"
              className="wwd-station absolute top-[0.85rem] left-0 z-10 h-4 w-4 rounded-full bg-crimson ring-4 ring-paper"
              style={{ transitionDelay: `${200 + i * 160}ms` }}
            />
            <h3 className="font-display text-[2.35rem] leading-[1.1] tracking-tight text-ink">{a.title}</h3>
            <p className="mt-3 max-w-[30rem] text-base leading-relaxed text-muted">{a.copy}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
