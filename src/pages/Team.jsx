import JoinCTA from '../components/JoinCTA'
import { advisoryBoard, officers } from '../data/team'

function MemberCard({ member }) {
  const content = (
    <>
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
      <h3 className="mt-4 text-lg font-medium tracking-tight text-ink">{member.name}</h3>
      <p className="mt-1 text-sm text-muted">{member.role}</p>
    </>
  )

  return (
    <li>
      {member.website ? (
        <a
          href={member.website}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col no-underline transition-opacity hover:opacity-70"
        >
          {content}
        </a>
      ) : (
        <div className="flex flex-col">{content}</div>
      )}
    </li>
  )
}

function AdvisorCard({ member }) {
  const content = (
    <>
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
      <h3 className="mt-4 text-lg font-medium tracking-tight text-ink">{member.name}</h3>
      <p className="mt-1 text-sm text-muted">{member.role}</p>
    </>
  )

  return (
    <li>
      {member.website ? (
        <a
          href={member.website}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col no-underline transition-opacity hover:opacity-70"
        >
          {content}
        </a>
      ) : (
        <div className="flex flex-col">{content}</div>
      )}
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

          <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {officers.map((member, index) => (
              <MemberCard key={`${member.role}-${index}`} member={member} />
            ))}
          </ul>
        </div>

        <div className="mt-20 border-t border-line pt-16">
          <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">
            Advisory Board
          </h2>

          <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {advisoryBoard.map((member) => (
              <AdvisorCard key={member.name} member={member} />
            ))}
          </ul>
        </div>
      </section>

      <JoinCTA title="Interested in joining the board?" />
    </div>
  )
}
