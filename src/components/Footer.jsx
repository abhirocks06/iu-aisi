import { Link, useLocation } from 'react-router-dom'
import { BEINVOLVED_URL, COURSE_URL, DISCORD_INVITE } from '../data/posts'

const socialLinks = [
  {
    label: 'Discord',
    href: DISCORD_INVITE,
    icon: (
      <svg
        viewBox="0 -28.5 256 256"
        aria-hidden="true"
        className="h-[1.125rem] w-[1.125rem] fill-current md:h-5 md:w-5"
        preserveAspectRatio="xMidYMid"
      >
        <path d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z" />
      </svg>
    ),
  },
  {
    label: 'beINvolved',
    href: BEINVOLVED_URL,
    icon: (
      <span
        aria-hidden="true"
        className="block h-4 w-4 bg-current"
        style={{
          WebkitMaskImage: 'url(/social/beinvolved.png)',
          maskImage: 'url(/social/beinvolved.png)',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
    ),
  },
]

export default function Footer() {
  const { pathname } = useLocation()

  return (
    <footer className="bg-paper">
      <div className="mx-auto flex max-w-site flex-col items-center gap-5 px-5 py-6 text-center sm:px-8 md:flex-row md:items-center md:justify-between md:gap-4 md:text-left">
        <Link
          to="/"
          className="mb-1 select-none no-underline md:mb-0"
          onClick={(event) => {
            if (pathname === '/') {
              event.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          }}
        >
          <span className="text-sm font-medium text-ink">
            © AI Safety Initiative at IU Bloomington
          </span>
        </Link>
        <nav
          className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-normal text-muted md:justify-start"
          aria-label="Footer"
        >
          <a
            href={COURSE_URL}
            target="_blank"
            rel="noreferrer"
            className="no-underline hover:text-ink"
          >
            P241
          </a>
          <Link to="/events" className="no-underline hover:text-ink">
            Events
          </Link>
          <Link to="/resources" className="no-underline hover:text-ink">
            Resources
          </Link>
          <Link to="/team" className="no-underline hover:text-ink">
            Team
          </Link>
        </nav>
      </div>
      <div className="mx-auto flex max-w-site flex-col items-center gap-4 border-t border-line/70 px-5 py-5 text-center sm:px-8 md:flex-row md:justify-between md:text-left">
        <p className="text-xs leading-relaxed text-muted">
          This organization is a registered student
          <br className="sm:hidden" /> organization of Indiana University.
        </p>
        <nav className="flex shrink-0 items-center justify-center gap-0.5 md:gap-3" aria-label="Social">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.label}
              className="inline-flex h-9 w-8 items-center justify-center text-muted transition-colors hover:text-ink md:h-auto md:w-auto"
            >
              {link.icon}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
