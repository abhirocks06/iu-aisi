import JoinCTA from '../components/JoinCTA'
import { resourceSections } from '../data/resources'

export default function Resources() {
  return (
    <div className="flex flex-1 flex-col bg-paper">
      <section className="mx-auto w-full max-w-6xl px-5 pt-16 text-left sm:px-8 sm:pt-20">
        <h1 className="animate-rise text-4xl font-medium tracking-tight text-ink sm:text-5xl">
          Resources
        </h1>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-12 text-left sm:px-8 sm:py-16">
        <div className="animate-rise-delay space-y-14">
          {resourceSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-2xl font-medium tracking-tight text-ink">{section.title}</h2>
              <ul className="mt-6 divide-y divide-line border-y border-line">
                {section.items.map((item) => (
                  <li key={item.href ?? item.title}>
                    <a
                      href={item.href ?? '#'}
                      {...(item.href
                        ? { target: '_blank', rel: 'noreferrer' }
                        : { onClick: (event) => event.preventDefault() })}
                      className="flex flex-col gap-3 py-5 no-underline transition-opacity hover:opacity-70 sm:flex-row sm:items-start sm:justify-between sm:gap-8"
                    >
                      <div className="min-w-0 max-w-3xl">
                        <span className="text-lg font-medium tracking-tight text-ink">
                          {item.title}
                        </span>
                        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
                          {item.description}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm text-crimson sm:pt-1">Visit</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <JoinCTA
        title="New members always welcome."
        description="No CS or AI background required. Join the Discord for meetings, updates, and discussion."
      />
    </div>
  )
}
