import { CONTACT_EMAIL, DISCORD_INVITE } from '../data/posts'

export default function JoinCTA({
  id,
  title = 'New members always welcome.',
  description,
  mode = 'join',
}) {
  return (
    <section id={id} className="mt-auto bg-surface">
      <div className="mx-auto flex max-w-site flex-col items-center gap-8 px-5 py-20 text-center sm:px-8 sm:py-24 md:flex-row md:items-end md:justify-between md:text-left">
        <div className="min-w-0 max-w-xl">
          <h2 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">{title}</h2>
          {description ? (
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted md:mx-0">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
          {mode === 'partner' ? (
            <a href={`mailto:${CONTACT_EMAIL}`} className="btn-solid">
              Contact us
            </a>
          ) : (
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noreferrer"
              className="btn-solid"
            >
              Join Discord
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
