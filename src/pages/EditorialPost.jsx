import { Link, useParams } from 'react-router-dom'
import { DISCORD_INVITE, formatPostDate, getPostBySlug } from '../data/posts'

export default function EditorialPost() {
  const { slug } = useParams()
  const post = getPostBySlug(slug)

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
        <h1 className="text-3xl font-medium text-ink">Post not found</h1>
        <Link
          to="/editorial"
          className="mt-6 inline-block text-sm text-muted no-underline hover:text-ink"
        >
          Back to Editorial
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col bg-paper">
      <article>
        <header className="mx-auto max-w-3xl px-5 pt-20 sm:px-8 sm:pt-28">
          {post.topics?.[0] ? (
            <p className="animate-rise text-sm font-medium text-crimson">{post.topics[0]}</p>
          ) : null}
          <h1
            className={[
              'animate-rise text-4xl font-medium tracking-tight text-ink sm:text-[2.75rem]',
              post.topics?.[0] ? 'mt-3' : '',
            ].join(' ')}
          >
            {post.title}
          </h1>
          <div className="animate-rise-delay mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-ink">
            <span>{post.author || 'AISI Editorial'}</span>
            <span aria-hidden="true">•</span>
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          </div>
          {post.image ? (
            <img
              src={post.image}
              alt={post.imageAlt || ''}
              className="animate-rise-delay-2 mt-8 aspect-[16/9] w-full object-cover object-top"
            />
          ) : null}
        </header>

        <div className="mx-auto max-w-3xl space-y-5 px-5 py-10 sm:px-8 sm:py-12">
          {post.body.map((paragraph) => (
            <p key={paragraph} className="text-lg leading-[1.75] text-ink-soft">
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      <section className="mt-auto bg-crimson text-white">
        <div className="mx-auto flex max-w-[90rem] flex-col items-center gap-8 px-5 py-20 text-center sm:px-8 sm:py-24 md:flex-row md:items-center md:justify-between md:text-left">
          <div className="min-w-0 md:max-w-none">
            <h2 className="text-3xl font-medium tracking-tight">More from the Editorial.</h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/70 md:mx-0">
              Analysis from IU students on the technical, policy, and philosophical questions shaping advanced AI.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
            <Link to="/editorial" className="btn-primary">
              Read more
            </Link>
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost text-white"
            >
              Join Discord
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
