import { Link } from 'react-router-dom'
import JoinCTA from '../components/JoinCTA'
import NeuralNetVisual from '../components/NeuralNetVisual'
import { DISCORD_INVITE } from '../data/posts'

const activities = [
  {
    title: 'Discussion Meetings',
    copy: 'Weekly meetings to talk through new developments and what they signal about AI capabilities.',
  },
  {
    title: 'Editorial',
    copy: 'Long-form essays, research breakdowns, and policy commentary on frontier AI developments.',
  },
  {
    title: 'Research Projects',
    copy: 'Semester-long team projects on alignment, interpretability, evaluations, and federal/state policy.',
  },
  {
    title: 'Community Events',
    copy: 'Expert speaker panels, workshops, and other gatherings that bring the AISI community together.',
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
              <Link to="/editorial" className="btn-ghost text-white">
                Read Our Editorial
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
              As AI systems grow more capable, ensuring they remain safe, controllable, and aligned
              with human interests is one of the most consequential open problems of this decade.
            </p>
            <p>
              The AI Safety Initiative (AISI) is a student-run interdisciplinary hub
              for IUB students across computer science, philosophy, economics, and beyond to take on
              the technical and governance challenges of advanced AI.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-neutral-50">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <h2 className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">What We Do</h2>

          <ul className="mt-12 grid gap-5 sm:grid-cols-2">
            {activities.map((item, index) => (
              <li key={item.title} className="border border-line bg-paper p-6 sm:p-8">
                <span className="text-sm font-medium text-crimson">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 text-lg font-medium tracking-tight text-ink">{item.title}</h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{item.copy}</p>
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
