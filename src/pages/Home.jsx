import { Link } from 'react-router-dom'
import JoinCTA from '../components/JoinCTA'
import NeuralNetVisual from '../components/NeuralNetVisual'
import { DISCORD_INVITE } from '../data/posts'

const activities = [
  {
    title: 'Discussion Meetings',
    copy: 'Weekly meetings on new developments, AI capabilities, and the U.S.-China race at the frontier.',
    image: '/illustrations/discussion.svg',
    imageAlt: '',
  },
  {
    title: 'Research Projects',
    copy: 'Team projects on alignment, interpretability, evaluations, and governance frameworks.',
    image: '/illustrations/research.svg',
    imageAlt: '',
  },
  {
    title: 'Community Events',
    copy: 'Speaker panels and networking sessions with researchers, policymakers, and industry leaders.',
    image: '/illustrations/events.svg',
    imageAlt: '',
  },
]

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="bg-crimson text-white">
        <div className="mx-auto grid max-w-6xl items-center justify-items-center gap-12 px-5 pt-16 pb-24 text-center sm:px-8 sm:pt-20 sm:pb-28 lg:grid-cols-[1fr_auto] lg:justify-items-stretch lg:gap-20 lg:pt-24 lg:pb-32 lg:text-left">
          <div className="flex flex-col items-center lg:items-start">
            <h1 className="animate-rise text-[2rem] font-medium leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.15rem]">
              AI Safety Initiative
              <br />
              at&nbsp;IU&nbsp;Bloomington
            </h1>
            <p className="animate-rise-delay mt-6 max-w-[23rem] text-base leading-relaxed text-white/75 sm:max-w-[26rem] sm:text-lg">
              An interdisciplinary research community working to ensure advanced AI benefits humanity.
            </p>
            <div className="animate-rise-delay-2 mt-10 flex flex-wrap justify-center gap-3 lg:justify-start">
              <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
              >
                Join Discord
              </a>
              <Link to="/events" className="btn-ghost text-white">
                Explore Events
              </Link>
            </div>
          </div>

          <NeuralNetVisual className="animate-rise-delay" />
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[16rem_1fr] lg:gap-[13rem]">
          <h2 className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            Our Mission
          </h2>
          <div className="max-w-3xl space-y-5 text-lg leading-[1.75] text-ink-soft sm:text-xl sm:leading-[1.8]">
            <p>
              It’s hard to miss how fast AI is moving. Frontier AI systems are gaining capability
              faster than our ability to understand, evaluate, or control them. Keeping them aligned
              with human interests remains one of the most consequential problems of our time.
            </p>
            <p>
              We’re a community of students and faculty at Indiana University working
              to reduce the catastrophic risks from advanced AI. We study how these models behave,
              along with the ethical, economic, and geopolitical implications of deploying them.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-neutral-50">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <h2 className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">What We Do</h2>

          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((item) => (
              <li
                key={item.title}
                className="flex h-[28rem] flex-col overflow-hidden border border-line bg-paper sm:h-auto sm:min-h-[24rem]"
              >
                <div className="flex min-h-0 flex-[5] items-center justify-center bg-paper px-5 pt-5 pb-2 sm:px-6 sm:pt-6 sm:pb-3">
                  <img
                    src={item.image}
                    alt={item.imageAlt}
                    className="pointer-events-none h-full w-full select-none object-contain"
                    draggable={false}
                  />
                </div>
                <div className="flex min-h-0 flex-[2.5] flex-col justify-center px-6 pt-3 pb-7 sm:px-8 sm:pt-4 sm:pb-8">
                  <h3 className="text-lg font-medium tracking-tight text-ink">{item.title}</h3>
                  <p className="mt-2.5 text-[0.95rem] leading-relaxed text-muted">{item.copy}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <JoinCTA
        id="join"
        title="New members always welcome."
        description="No CS or AI background required. Join the Discord for meetings, updates, and discussion."
      />
    </div>
  )
}
