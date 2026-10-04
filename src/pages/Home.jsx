import { Link } from 'react-router-dom'
import HeroTitle from '../components/HeroTitle'
import WireGraph from '../components/WireGraph'
import JoinCTA from '../components/JoinCTA'
import WhatWeDo from '../components/WhatWeDo'
import { DISCORD_INVITE } from '../data/posts'

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="relative bg-paper">
        <div className="mx-auto flex max-w-site items-center px-5 pt-16 pb-20 sm:px-8 sm:pt-20 sm:pb-24 lg:min-h-[min(46rem,calc(100svh-3.5rem))] lg:py-16">
          <div className="animate-rise relative z-10 lg:max-w-[28rem]">
            <HeroTitle className="font-display text-[2.4rem] leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.35rem]" />
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
        </div>
        {/* The graph fills the right of the hero out to the window edge and fades in toward
            the headline. It needs the wide layout; phones get the text alone. */}
        <WireGraph className="animate-rise-delay absolute inset-y-0 right-0 hidden w-[62%] lg:block" />
        {/* A paper-coloured gradient over the graph's left edge; cheaper than masking an
            animating canvas. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-[48%] hidden w-[14%] bg-gradient-to-r from-paper to-transparent lg:block"
        />
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

      <section className="overflow-hidden bg-paper">
        <div className="mx-auto max-w-site px-5 py-20 sm:px-8 sm:py-28">
          <h2 className="animate-rise font-display text-3xl leading-[1.15] tracking-tight text-ink sm:text-4xl">
            What We Do
          </h2>
          <div className="mt-12 sm:mt-16 lg:px-[4%]">
            <WhatWeDo />
          </div>
        </div>
      </section>

      <JoinCTA id="join" title="New members always welcome." />
    </div>
  )
}
