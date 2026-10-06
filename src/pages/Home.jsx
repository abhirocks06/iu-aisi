import { Link } from 'react-router-dom'
import HeroVisual from '../components/HeroVisual'
import JoinCTA from '../components/JoinCTA'
import { DISCORD_INVITE } from '../data/posts'

const activities = [
  {
    title: 'Discussion Meetings',
    copy: 'Weekly roundtables on new AI developments and the U.S.-China race at the frontier.',
    tone: 'bg-[#9a3f38]',
    art: 'discussion',
  },
  {
    title: 'Research Projects',
    copy: 'Team projects on alignment, interpretability, evaluations, and governance frameworks.',
    tone: 'bg-crimson',
    art: 'research',
  },
  {
    title: 'Community Events',
    copy: 'Speaker panels featuring researchers, policymakers, and industry leaders.',
    tone: 'bg-crimson-deep',
    art: 'events',
  },
]

/** Polished bottom graphics — same motifs, tighter geometry and fades. */
function CardArt({ kind }) {
  if (kind === 'discussion') {
    // Even ribbon family — shared curve, stepped offset (reads as conversation flow)
    const ribbons = [0, 1, 2, 3, 4, 5]
    return (
      <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="art-d-fade" x1="160" y1="0" x2="160" y2="180" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity="0" />
            <stop offset="0.4" stopColor="white" stopOpacity="1" />
            <stop offset="1" stopColor="white" stopOpacity="1" />
          </linearGradient>
          <mask id="art-d-mask">
            <rect width="320" height="180" fill="url(#art-d-fade)" />
          </mask>
          <linearGradient id="art-d-stroke" x1="0" y1="90" x2="320" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity="0.08" />
            <stop offset="0.35" stopColor="white" stopOpacity="0.55" />
            <stop offset="0.65" stopColor="white" stopOpacity="0.55" />
            <stop offset="1" stopColor="white" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <g mask="url(#art-d-mask)" fill="none" strokeLinecap="round">
          <ellipse cx="168" cy="132" rx="96" ry="48" fill="white" fillOpacity="0.05" stroke="none" />
          {ribbons.map((i) => {
            const y = i * 9
            return (
              <path
                key={i}
                d={`M-16 ${108 + y} C48 ${58 + y * 0.55} 112 ${44 + y * 0.35} 160 ${48 + y * 0.3} C208 ${52 + y * 0.3} 264 ${72 + y * 0.45} 336 ${64 + y * 0.4}`}
                stroke="url(#art-d-stroke)"
                strokeWidth={1.35}
                strokeOpacity={0.95 - i * 0.1}
              />
            )
          })}
        </g>
      </svg>
    )
  }

  if (kind === 'research') {
    // Soft heatmap lattice — even cells, smooth gaussian falloff
    const cols = 11
    const rows = 7
    const cellW = 16
    const cellH = 11
    const gapX = 10
    const gapY = 8
    const originX = (320 - cols * cellW - (cols - 1) * gapX) / 2
    const originY = 38
    const cells = []
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const dx = (c - (cols - 1) / 2) / 3.6
        const dy = (r - (rows - 1) / 2) / 2.4
        const t = Math.exp(-(dx * dx + dy * dy))
        if (t < 0.08) continue
        cells.push(
          <rect
            key={`${r}-${c}`}
            x={originX + c * (cellW + gapX)}
            y={originY + r * (cellH + gapY)}
            width={cellW}
            height={cellH}
            rx="2"
            fill="white"
            fillOpacity={0.04 + t * 0.38}
          />,
        )
      }
    }
    return (
      <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="art-r-fade" cx="50%" cy="58%" r="62%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="60%" stopColor="white" stopOpacity="0.9" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="art-r-mask">
            <rect width="320" height="180" fill="url(#art-r-fade)" />
          </mask>
        </defs>
        <g mask="url(#art-r-mask)">{cells}</g>
      </svg>
    )
  }

  // Perfect concentric arcs — amphitheater / gathering
  const radii = [28, 48, 68, 88, 108, 128]
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="art-e-fade" x1="160" y1="10" x2="160" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.42" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="white" stopOpacity="1" />
        </linearGradient>
        <mask id="art-e-mask">
          <rect width="320" height="180" fill="url(#art-e-fade)" />
        </mask>
        <linearGradient id="art-e-stroke" x1="160" y1="40" x2="160" y2="168" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.5" />
          <stop offset="1" stopColor="white" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <g mask="url(#art-e-mask)" fill="none" strokeLinecap="round">
        <path d="M40 168h240" stroke="white" strokeOpacity="0.16" strokeWidth="1.25" />
        {radii.map((r, i) => (
          <path
            key={r}
            d={`M${160 - r} 168 A${r} ${r} 0 0 1 ${160 + r} 168`}
            stroke={i === 0 ? 'url(#art-e-stroke)' : 'white'}
            strokeOpacity={i === 0 ? 1 : 0.42 - i * 0.05}
            strokeWidth="1.35"
            fill={i === 0 ? 'white' : 'none'}
            fillOpacity={i === 0 ? 0.07 : 0}
          />
        ))}
      </g>
    </svg>
  )
}

function ActivityCard({ item }) {
  return (
    <li
      className={[
        'relative flex min-h-[14rem] flex-col overflow-hidden p-6 text-white sm:min-h-[26rem] sm:p-7',
        item.tone,
      ].join(' ')}
    >
      <h3 className="relative z-10 text-xl font-medium tracking-tight">{item.title}</h3>
      <p className="relative z-10 mt-4 text-[0.95rem] leading-relaxed text-white/80">
        {item.copy}
      </p>
      <div
        className="pointer-events-none absolute -inset-x-[12%] -bottom-8 h-[62%] scale-110 opacity-90 sm:inset-x-0 sm:bottom-0 sm:h-[50%] sm:scale-100"
        aria-hidden="true"
      >
        <CardArt kind={item.art} />
      </div>
    </li>
  )
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="bg-paper">
        <div className="mx-auto grid max-w-site items-center gap-12 px-5 pt-16 pb-20 sm:px-8 sm:pt-20 sm:pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:pt-24 lg:pb-28">
          <div className="animate-rise">
            <h1 className="font-display text-[2.4rem] leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.35rem]">
              AI Safety Initiative at&nbsp;IU&nbsp;Bloomington
            </h1>
            <p className="mt-6 max-w-[22.75rem] text-base leading-relaxed text-muted sm:max-w-md sm:text-lg">
              An interdisciplinary research community working to ensure advanced AI benefits
              humanity.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noreferrer"
                className="btn-solid"
              >
                Join Discord
              </a>
              <Link to="/events" className="btn-outline">
                Explore Events
              </Link>
            </div>
          </div>

          <HeroVisual className="animate-rise-delay mx-auto lg:mx-0 lg:justify-self-end" />
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto grid max-w-site gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-16">
          <div className="animate-rise">
            <h2 className="font-display max-w-md text-3xl leading-[1.15] tracking-tight text-ink sm:text-4xl">
              Our mission
            </h2>
          </div>
          <div className="animate-rise-delay max-w-[calc(36rem-2.5ch)] space-y-5 text-base leading-[1.75] text-ink-soft sm:text-lg sm:leading-[1.8]">
            <p>
              It’s hard to miss how fast AI is moving. Frontier AI systems are gaining capability
              faster than our ability to understand, evaluate, or control them, and keeping them
              aligned with human interests remains one of the most consequential problems of our
              time.
            </p>
            <p>
              We’re a community of students and faculty at Indiana University working
              to reduce catastrophic risks from advanced AI. We study how these models behave,
              along with the ethical, economic, and geopolitical implications of deploying them.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto grid max-w-site gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1.7fr)] lg:items-start lg:gap-8">
          <h2 className="animate-rise font-display text-3xl leading-[1.15] tracking-tight text-ink sm:text-4xl">
            What We Do
          </h2>

          <ul className="animate-rise-delay grid gap-3 sm:grid-cols-3">
            {activities.map((item) => (
              <ActivityCard key={item.title} item={item} />
            ))}
          </ul>
        </div>
      </section>

      <JoinCTA id="join" title="New members always welcome." />
    </div>
  )
}
