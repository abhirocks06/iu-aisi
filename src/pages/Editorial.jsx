import { useState } from 'react'
import { Link } from 'react-router-dom'
import JoinCTA from '../components/JoinCTA'
import { formatPostDate, posts, topics } from '../data/posts'

const filters = ['All', ...topics]

export default function Editorial() {
  const [active, setActive] = useState('All')

  const visible =
    active === 'All' ? posts : posts.filter((post) => post.topics.includes(active))

  return (
    <div className="flex flex-1 flex-col bg-paper">
      <section className="mx-auto w-full max-w-site px-5 pt-16 text-left sm:px-8 sm:pt-20">
        <h1 className="animate-rise text-4xl font-medium tracking-tight text-ink sm:text-5xl">
          Editorial
        </h1>

        <div
          className="animate-rise-delay mt-6 -ml-2 flex flex-wrap gap-x-2"
          role="tablist"
          aria-label="Filter by topic"
        >
          {filters.map((filter) => {
            const isActive = active === filter
            return (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(filter)}
                className={[
                  'min-h-11 px-2 text-base transition-colors',
                  isActive ? 'font-medium text-ink' : 'text-muted hover:text-ink',
                ].join(' ')}
              >
                {filter}
              </button>
            )
          })}
        </div>
      </section>

      <section className="animate-rise-delay-2 mx-auto w-full max-w-site flex-1 px-5 py-10 sm:px-8 sm:py-12">
        {visible.length === 0 ? (
          <p className="border-t border-line py-10 text-muted">No pieces in this topic yet.</p>
        ) : (
          <ul className="border-t border-line">
            {visible.map((post) => {
              const topic = post.topics[0]
              return (
                <li key={post.slug} className="border-b border-line">
                  <Link
                    to={`/editorial/${post.slug}`}
                    className="group grid gap-3 py-8 no-underline transition-opacity hover:opacity-70 sm:grid-cols-[11rem_1fr] sm:gap-10 sm:py-10 md:grid-cols-[14rem_1fr]"
                  >
                    <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-start sm:gap-1 sm:pt-0.5">
                      <span className="text-sm font-medium text-crimson">{topic}</span>
                      <time dateTime={post.date} className="text-sm text-ink">
                        {formatPostDate(post.date)}
                      </time>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-medium tracking-tight text-ink sm:text-xl">
                        {post.title}
                      </h2>
                      <p className="mt-2 max-w-3xl text-base leading-relaxed text-ink-soft">
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <JoinCTA
        title="Stay in the loop."
        description="Subscribe for new Editorial pieces and announcements."
      />
    </div>
  )
}
