import { Link } from 'react-router-dom'
import HeroVisual from '../components/HeroVisual'
import JoinCTA from '../components/JoinCTA'
import { DISCORD_INVITE } from '../data/posts'

const activities = [
  {
    title: 'Discussion Meetings',
    copy: 'Weekly roundtables on new AI developments, emerging capabilities, and U.S.-China race at the frontier.',
    tone: 'bg-[#a85a52]',
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

/** Soft editorial bottom graphics — closer to Goodfire / hero language than icon line art. */
function CardArt({ kind }) {
  if (kind === 'discussion') {
    return (
      <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="art-d" x1="40" y1="20" x2="280" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity="0.55" />
            <stop offset="1" stopColor="white" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <path
          d="M20 150C48 96 92 58 148 52c56-6 96 28 132 18 28-8 48-36 70-28"
          fill="none"
          stroke="url(#art-d)"
          strokeWidth="1.1"
        />
        <path
          d="M10 168C54 118 108 84 168 80c52-4 86 30 122 22 30-6 52-28 78-18"
          fill="none"
          stroke="white"
          strokeOpacity="0.28"
          strokeWidth="1"
        />
        <ellipse cx="118" cy="118" rx="54" ry="34" fill="white" fillOpacity="0.08" />
        <ellipse cx="196" cy="128" rx="70" ry="40" fill="white" fillOpacity="0.12" />
        <ellipse cx="248" cy="142" rx="48" ry="28" fill="white" fillOpacity="0.07" />
      </svg>
    )
  }

  if (kind === 'research') {
    const cols = 8
    const rows = 5
    const cells = []
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const t = ((r * 3 + c * 5) % 11) / 11
        cells.push(
          <rect
            key={`${r}-${c}`}
            x={36 + c * 32}
            y={48 + r * 22}
            width="22"
            height="14"
            fill="white"
            fillOpacity={0.06 + t * 0.28}
          />,
        )
      }
    }
    return (
      <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="art-r" x1="0" y1="0" x2="0" y2="180" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity="0" />
            <stop offset="0.35" stopColor="white" stopOpacity="0.5" />
            <stop offset="1" stopColor="white" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <g opacity="0.9">{cells}</g>
        <path
          d="M28 40h264M28 160h264"
          stroke="url(#art-r)"
          strokeWidth="1"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="art-e" x1="160" y1="20" x2="160" y2="170" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.4" />
          <stop offset="1" stopColor="white" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path
        d="M40 150c28-46 62-72 120-72s92 26 120 72"
        fill="none"
        stroke="url(#art-e)"
        strokeWidth="1.15"
      />
      <path
        d="M64 150c22-34 48-52 96-52s74 18 96 52"
        fill="none"
        stroke="white"
        strokeOpacity="0.22"
        strokeWidth="1"
      />
      <path
        d="M92 150c16-22 34-34 68-34s52 12 68 34"
        fill="none"
        stroke="white"
        strokeOpacity="0.16"
        strokeWidth="1"
      />
      <circle cx="160" cy="58" r="18" fill="white" fillOpacity="0.1" />
      <circle cx="160" cy="58" r="8" fill="white" fillOpacity="0.22" />
      <path d="M24 158h272" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
    </svg>
  )
}

function ActivityCard({ item }) {
  return (
    <li
      className={[
        'relative flex min-h-[22rem] flex-col overflow-hidden p-6 text-white sm:min-h-[26rem] sm:p-7',
        item.tone,
      ].join(' ')}
    >
      <h3 className="relative z-10 text-xl font-medium tracking-tight">{item.title}</h3>
      <p className="relative z-10 mt-4 text-[0.95rem] leading-relaxed text-white/80">
        {item.copy}
      </p>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%]"
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
              Reduce catastrophic risks from advanced AI.
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
