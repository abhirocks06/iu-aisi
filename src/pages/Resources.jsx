import JoinCTA from '../components/JoinCTA'
import { resourceSections } from '../data/resources'

const [courseSection, ...otherSections] = resourceSections
const course = courseSection?.items?.[0]

function ResourceLink({ item }) {
  return (
    <a
      href={item.href ?? '#'}
      {...(item.href
        ? { target: '_blank', rel: 'noreferrer' }
        : { onClick: (event) => event.preventDefault() })}
      className="inline-block no-underline transition-opacity hover:opacity-70"
    >
      <span className="text-base font-normal tracking-tight text-ink hover:underline hover:underline-offset-4">
        {item.title}
      </span>
      {item.description ? (
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.description}</p>
      ) : null}
    </a>
  )
}

export default function Resources() {
  return (
    <div className="flex flex-1 flex-col bg-paper">
      <section className="bg-paper">
        <div className="mx-auto w-full max-w-site px-5 pt-16 pb-10 sm:px-8 sm:pt-20 sm:pb-12">
          <h1 className="animate-rise font-display text-4xl tracking-tight text-ink sm:text-5xl">
            What is AI Safety
          </h1>
        </div>
      </section>

      {course ? (
        <section className="bg-surface">
          <div className="mx-auto flex max-w-site flex-col gap-6 px-5 py-12 sm:px-8 sm:py-16 md:flex-row md:items-center md:justify-between md:gap-12">
            <div className="max-w-2xl animate-rise">
              <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">
                {course.title}
              </h2>
              {course.description ? (
                <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
                  {course.description}
                </p>
              ) : null}
            </div>
            {course.href ? (
              <a
                href={course.href}
                target="_blank"
                rel="noreferrer"
                className="btn-solid shrink-0 self-start md:self-center"
              >
                View course
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-site px-5 py-14 sm:px-8 sm:py-20">
        <div className="animate-rise-delay grid gap-14 sm:gap-16 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-20">
          {otherSections.map((section) => (
            <div key={section.title}>
              <h2 className="font-display text-2xl font-normal tracking-tight text-ink">
                {section.title}
              </h2>
              <ul className="mt-6 space-y-6">
                {section.items.map((item) => (
                  <li key={item.href ?? item.title}>
                    <ResourceLink item={item} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <JoinCTA title="New members always welcome." />
    </div>
  )
}
