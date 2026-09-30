import JoinCTA from '../components/JoinCTA'
import { facultyAdvisor, officers } from '../data/team'

function MemberCard({ member }) {
  return (
    <li className="flex flex-col items-center border border-line p-5 text-center sm:p-6">
      {member.photo ? (
        <img
          src={member.photo}
          alt={member.name}
          width={448}
          height={560}
          className="aspect-[4/5] w-full object-cover object-center"
        />
      ) : (
        <div
          className="flex aspect-[4/5] w-full items-center justify-center bg-neutral-100 text-sm text-muted"
          aria-hidden="true"
        >
          Photo
        </div>
      )}
      <h3 className="mt-4 text-lg font-medium tracking-tight text-ink">{member.name}</h3>
      <p className="mt-1 text-sm text-crimson">{member.role}</p>
    </li>
  )
}

export default function Team() {
  return (
    <div className="flex flex-1 flex-col bg-paper">
      <section className="mx-auto w-full max-w-6xl px-5 pt-16 text-left sm:px-8 sm:pt-20">
        <h1 className="animate-rise text-4xl font-medium tracking-tight text-ink sm:text-5xl">
          Team
        </h1>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-12 text-left sm:px-8 sm:py-16">
        <div className="animate-rise-delay">
          <h2 className="text-2xl font-medium tracking-tight text-ink">Executive Board</h2>

          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {officers.map((member, index) => (
              <MemberCard key={`${member.role}-${index}`} member={member} />
            ))}
          </ul>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-medium tracking-tight text-ink">Advisory Board</h2>

          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <li>
              <a
                href={facultyAdvisor.website}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center border border-line p-5 text-center no-underline transition-opacity hover:opacity-70 sm:p-6"
              >
                {facultyAdvisor.photo ? (
                  <img
                    src={facultyAdvisor.photo}
                    alt={facultyAdvisor.name}
                    width={448}
                    height={560}
                    className="aspect-[4/5] w-full object-cover object-[62%_center]"
                  />
                ) : (
                  <div
                    className="flex aspect-[4/5] w-full items-center justify-center bg-neutral-100 text-sm text-muted"
                    aria-hidden="true"
                  >
                    Photo
                  </div>
                )}
                <h3 className="mt-4 text-lg font-medium tracking-tight text-ink">
                  {facultyAdvisor.name}
                </h3>
                <p className="mt-1 text-sm text-crimson">{facultyAdvisor.role}</p>
              </a>
            </li>
          </ul>
        </div>
      </section>

      <JoinCTA
        title="Want to join the team?"
        description="Officer roles fill as we launch. Reach out if you want to help build AISI."
      />
    </div>
  )
}
