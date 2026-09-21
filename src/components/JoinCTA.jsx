import { CONTACT_EMAIL, DISCORD_INVITE } from '../data/posts'

const socialActions = [
  { label: 'Follow on LinkedIn', href: 'https://www.linkedin.com/company/143631076', primary: true },
  { label: 'Follow on X', href: 'https://x.com/', primary: false },
]

export default function JoinCTA({
  id,
  title = 'New members always welcome.',
  description = 'No CS or AI background required. Join the Discord for meetings, updates, and discussion.',
  mode = 'join',
}) {
  return (
    <section id={id} className="mt-auto bg-crimson text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-5 py-20 text-center sm:px-8 sm:py-24 md:flex-row md:items-center md:justify-between md:text-left">
        <div className="min-w-0 md:max-w-none">
          <h2 className="text-3xl font-medium tracking-tight">{title}</h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/70 md:mx-0">{description}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
          {mode === 'social' ? (
            socialActions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                target="_blank"
                rel="noreferrer"
                className={action.primary ? 'btn-primary' : 'btn-ghost text-white'}
              >
                {action.label}
              </a>
            ))
          ) : mode === 'partner' ? (
            <>
              <a href={`mailto:${CONTACT_EMAIL}`} className="btn-primary">
                Email us
              </a>
              <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost text-white"
              >
                Join Discord
              </a>
            </>
          ) : (
            <>
              <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
              >
                Join Discord
              </a>
              <a href={`mailto:${CONTACT_EMAIL}`} className="btn-ghost text-white">
                Email us
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
