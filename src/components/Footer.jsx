import { Link, useLocation } from 'react-router-dom'
import { LinkedInIcon } from './icons'
import { BEINVOLVED_URL, DISCORD_INVITE, INSTAGRAM_URL } from '../data/posts'

const navLinks = [
  { to: '/what-is-ai-safety', label: 'What is AI Safety' },
  { to: '/events', label: 'Events' },
  { to: '/team', label: 'Team' },
]

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
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/143631076',
    icon: <LinkedInIcon />,
  },
  {
    label: 'Instagram',
    href: INSTAGRAM_URL,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
]

export default function Footer() {
  const { pathname } = useLocation()

  return (
    <footer className="bg-paper">
      <div className="mx-auto grid max-w-site grid-cols-1 items-center gap-2 px-5 py-8 text-center sm:px-8 lg:grid-cols-3 lg:gap-4 lg:text-left">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center select-none justify-self-center no-underline lg:justify-self-start"
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
          className="flex flex-wrap items-center justify-center gap-x-2 text-sm font-normal tracking-wide text-ink-soft lg:flex-nowrap"
          aria-label="Footer"
        >
          {navLinks.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center px-2 no-underline transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.to}
                to={link.to}
                className="inline-flex min-h-11 items-center px-2 no-underline transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <nav
          className="flex shrink-0 items-center justify-center justify-self-center lg:-mr-3 lg:justify-self-end"
          aria-label="Social"
        >
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.label}
              className="inline-flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-ink"
            >
              {link.icon}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
