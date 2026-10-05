import JoinCTA from '../components/JoinCTA'
import { GitHubIcon, GlobeIcon, LinkedInIcon } from '../components/icons'
import { advisoryBoard, officers } from '../data/team'

const LINK_TYPES = [
  { key: 'website', label: 'Website', Icon: GlobeIcon },
  { key: 'linkedin', label: 'LinkedIn', Icon: LinkedInIcon },
  { key: 'github', label: 'GitHub', Icon: GitHubIcon },
]

function MemberCard({ member }) {
  const links = LINK_TYPES.filter(({ key }) => member.links?.[key])

  return (
    <li className="flex flex-col">
      {member.photo ? (
        <img
          src={member.photo}
          alt={member.name}
          width={448}
          height={560}
          className="aspect-[4/5] w-full object-cover"
          style={{ objectPosition: member.photoPosition ?? 'center' }}
        />
      ) : (
        <div
          className="flex aspect-[4/5] w-full items-center justify-center bg-surface-muted text-sm text-muted"
          aria-hidden="true"
        >
          Photo
        </div>
      )}
      <h3 className="mt-4 text-base font-medium tracking-tight text-ink sm:text-lg">{member.name}</h3>
      <p className="mt-1 text-sm text-muted">{member.role}</p>
      {links.length > 0 ? (
        <div className="mt-1 -ml-2.5 flex items-center">
          {links.map(({ key, label, Icon }) => (
            <a
              key={key}
              href={member.links[key]}
              target="_blank"
              rel="noreferrer"
              aria-label={key === 'website' ? `${member.name}’s website` : `${member.name} on ${label}`}
              title={label}
              className="inline-flex h-9 w-9 items-center justify-center text-muted transition-colors hover:text-ink"
            >
              <Icon />
            </a>
          ))}
        </div>
      ) : null}
    </li>
  )
}

export default function Team() {
  return (
    <div className="flex flex-1 flex-col bg-paper">
      <section className="bg-paper">
        <div className="mx-auto w-full max-w-site px-5 pt-16 pb-10 sm:px-8 sm:pt-20 sm:pb-12">
          <h1 className="animate-rise font-display text-4xl tracking-tight text-ink sm:text-5xl">
            Team
          </h1>
        </div>
      </section>

      <section className="mx-auto w-full max-w-site px-5 py-12 sm:px-8 sm:py-16">
        <div className="animate-rise-delay">
          <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">
            Executive Board
          </h2>

          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {officers.map((member, index) => (
              <MemberCard key={`${member.role}-${index}`} member={member} />
            ))}
          </ul>
        </div>

        <div className="mt-20">
          <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">
            Advisory Board
          </h2>

          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {advisoryBoard.map((member) => (
              <MemberCard key={member.name} member={member} />
            ))}
          </ul>
        </div>
      </section>

      <JoinCTA title="Interested in joining the board?" />
    </div>
  )
}
