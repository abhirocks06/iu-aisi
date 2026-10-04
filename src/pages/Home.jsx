import { Link } from 'react-router-dom'
import HeroVisual from '../components/HeroVisual'
import JoinCTA from '../components/JoinCTA'
import { DISCORD_INVITE } from '../data/posts'

const activities = [
  {
    title: 'Discussion Meetings',
    copy: 'Weekly roundtables on new AI developments, emerging capabilities, and U.S.-China race at the frontier.',
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
    copy: 'Speaker panels and networking sessions with researchers, policymakers, and industry leaders.',
    tone: 'bg-crimson-deep',
    art: 'events',
  },
]

/** Polished bottom graphics — Goodfire-style soft forms with edge fade. */
function CardArt({ kind }) {
  if (kind === 'discussion') {
    return (
      <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="art-d-fade" x1="160" y1="0" x2="160" y2="180" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity="0" />
            <stop offset="0.35" stopColor="white" stopOpacity="1" />
            <stop offset="1" stopColor="white" stopOpacity="1" />
          </linearGradient>
          <mask id="art-d-mask">
            <rect width="320" height="180" fill="url(#art-d-fade)" />
          </mask>
          <linearGradient id="art-d-stroke" x1="40" y1="40" x2="300" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity="0.5" />
            <stop offset="1" stopColor="white" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <g mask="url(#art-d-mask)">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path
              key={i}
              d={`M-10 ${120 + i * 8}C40 ${70 + i * 6} 100 ${48 + i * 4} 160 ${52 + i * 3}C220 ${56 + i * 3} 270 ${78 + i * 5} 340 ${68 + i * 4}`}
              fill="none"
              stroke="url(#art-d-stroke)"
              strokeWidth={1.05 - i * 0.06}
              strokeOpacity={0.85 - i * 0.08}
            />
          ))}
          <ellipse cx="150" cy="130" rx="78" ry="42" fill="white" fillOpacity="0.06" />
          <ellipse cx="210" cy="138" rx="64" ry="36" fill="white" fillOpacity="0.09" />
        </g>
      </svg>
    )
  }

  if (kind === 'research') {
    const cols = 10
    const rows = 6
    const cells = []
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const ridge = Math.exp(-(((c - 5.5) / 4) ** 2 + ((r - 2.5) / 2.4) ** 2))
        const t = Math.min(1, ridge * 0.85 + (((r * 3 + c * 5) % 7) / 7) * 0.25)
        if (t < 0.12) continue
        cells.push(
          <rect
            key={`${r}-${c}`}
            x={28 + c * 27}
            y={42 + r * 20}
            width="18"
            height="12"
            rx="1"
            fill="white"
            fillOpacity={0.05 + t * 0.32}
          />,
        )
      }
    }
    return (
      <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="art-r-fade" cx="50%" cy="55%" r="58%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="55%" stopColor="white" stopOpacity="0.85" />
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

  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="art-e-fade" x1="160" y1="20" x2="160" y2="170" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.4" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="white" stopOpacity="1" />
        </linearGradient>
        <mask id="art-e-mask">
          <rect width="320" height="180" fill="url(#art-e-fade)" />
        </mask>
        <linearGradient id="art-e-stroke" x1="160" y1="40" x2="160" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.45" />
          <stop offset="1" stopColor="white" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <g mask="url(#art-e-mask)">
        <path
          d="M36 156c30-52 68-78 124-78s94 26 124 78"
          fill="none"
          stroke="url(#art-e-stroke)"
          strokeWidth="1.15"
        />
        <path
          d="M62 156c24-38 54-58 98-58s74 20 98 58"
          fill="none"
          stroke="white"
          strokeOpacity="0.22"
          strokeWidth="1"
        />
        <path
          d="M90 156c18-26 40-40 70-40s52 14 70 40"
          fill="none"
          stroke="white"
          strokeOpacity="0.14"
          strokeWidth="1"
        />
        <path
          d="M118 156c12-16 26-24 42-24s30 8 42 24"
          fill="white"
          fillOpacity="0.06"
          stroke="white"
          strokeOpacity="0.12"
          strokeWidth="1"
        />
        <path d="M28 156h264" stroke="white" strokeOpacity="0.14" strokeWidth="1" />
      </g>
    </svg>
  )
}

function ActivityCard({ item }) {
  return (
    <li
      className={[
        'relative flex min-h-[16rem] flex-col overflow-hidden p-6 text-white sm:min-h-[26rem] sm:p-7',
        item.tone,
      ].join(' ')}
    >
      <h3 className="relative z-10 text-xl font-medium tracking-tight">{item.title}</h3>
      <p className="relative z-10 mt-4 text-base leading-relaxed text-white/80">
        {item.copy}
      </p>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[50%] opacity-90"
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
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted sm:text-lg">
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
          <div className="animate-rise-delay max-w-xl space-y-5 text-base leading-[1.75] text-ink-soft sm:text-lg sm:leading-[1.8]">
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
