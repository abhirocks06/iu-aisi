import { Link } from 'react-router-dom'
import ActivityVisual from '../components/ActivityVisual'
import HeroVisual from '../components/HeroVisual'
import JoinCTA from '../components/JoinCTA'
import { DISCORD_INVITE } from '../data/posts'

const activities = [
  {
    title: 'Discussion Meetings',
    copy: 'Weekly roundtables on new AI developments and the U.S.-China race at the frontier.',
    art: 'discussion',
  },
  {
    title: 'Research Projects',
    copy: 'Team projects on alignment, interpretability, evaluations, and governance frameworks.',
    art: 'research',
  },
  {
    title: 'Community Events',
    copy: 'Speaker panels featuring researchers, policymakers, and industry leaders.',
    art: 'events',
  },
]

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
        <div className="mx-auto max-w-site px-5 py-20 sm:px-8 sm:py-24">
          <h2 className="animate-rise font-display text-3xl leading-[1.15] tracking-tight text-ink sm:text-4xl">
            What we do
          </h2>

          <ul className="animate-rise-delay mt-12 grid gap-4 sm:mt-14 lg:grid-cols-3 lg:gap-4">
            {activities.map((item) => (
              <li
                key={item.title}
                className="flex flex-col border border-line p-5 sm:p-6"
              >
                <h3 className="text-xl font-medium tracking-tight text-ink">{item.title}</h3>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">
                  {item.copy}
                </p>
                <div className="mt-8 aspect-[5/4] w-full">
                  <ActivityVisual kind={item.art} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <JoinCTA id="join" title="New members always welcome." />
    </div>
  )
}
