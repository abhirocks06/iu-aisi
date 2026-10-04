import { NavLink, Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { DISCORD_INVITE } from '../data/posts'

const links = [
  { to: '/events', label: 'Events' },
  { to: '/resources', label: 'Resources' },
  { to: '/team', label: 'Team' },
]

function BurgerButton({ open, onClick }) {
  return (
    <button
      type="button"
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      aria-controls="mobile-nav"
      className="relative z-50 ml-auto flex h-8 w-8 cursor-pointer flex-col items-center justify-center gap-[6px] border-none bg-transparent outline-none focus:outline-none md:hidden"
      onClick={onClick}
    >
      <span
        className={`block h-px w-5 origin-center bg-ink transition-all duration-200 ${open ? 'translate-y-[3.5px] rotate-45' : ''}`}
      />
      <span
        className={`block h-px w-5 origin-center bg-ink transition-all duration-200 ${open ? '-translate-y-[3.5px] -rotate-45' : ''}`}
      />
    </button>
  )
}

function desktopClass(isActive) {
  return [
    'py-1 text-sm font-normal tracking-wide no-underline transition-colors',
    isActive ? 'text-ink' : 'text-ink-soft hover:text-ink',
  ].join(' ')
}

function mobileClass(isActive) {
  return [
    'mobile-menu-item font-display text-[2.35rem] leading-none tracking-tight no-underline transition-opacity sm:text-5xl',
    isActive ? 'text-ink' : 'text-ink/55 hover:text-ink hover:opacity-100',
  ].join(' ')
}

function MobileMenuOverlay({ pathname, onClose }) {
  return (
    <div
      id="mobile-nav"
      className="mobile-menu-overlay fixed inset-0 z-40 flex flex-col bg-paper md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
    >
      <div className="h-14 shrink-0 bg-paper" aria-hidden />
      <div className="mx-auto flex w-full max-w-site flex-1 flex-col px-5 sm:px-8">
        <nav className="flex flex-col gap-7 pt-8" aria-label="Mobile">
          {links.map((link, index) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className={mobileClass(false)}
                style={{ animationDelay: `${0.06 + index * 0.05}s` }}
                onClick={onClose}
              >
                {link.label}
              </a>
            ) : (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => mobileClass(isActive)}
                style={{ animationDelay: `${0.06 + index * 0.05}s` }}
                onClick={() => {
                  if (pathname === link.to) onClose()
                }}
              >
                {link.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="mobile-menu-item mt-auto py-8" style={{ animationDelay: '0.2s' }}>
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noreferrer"
            className="btn-solid w-full"
            onClick={onClose}
          >
            Get involved
          </a>
        </div>
      </div>
    </div>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const { body, documentElement } = document
    const previousBodyOverflow = body.style.overflow
    const previousHtmlOverflow = documentElement.style.overflow
    body.style.overflow = 'hidden'
    documentElement.style.overflow = 'hidden'
    return () => {
      body.style.overflow = previousBodyOverflow
      documentElement.style.overflow = previousHtmlOverflow
    }
  }, [open])

  const mobileMenu =
    open && mounted
      ? createPortal(
          <MobileMenuOverlay
            pathname={location.pathname}
            onClose={() => setOpen(false)}
          />,
          document.body,
        )
      : null

  return (
    <>
      <header className="sticky top-0 z-[60] bg-paper text-ink">
        <div className="mx-auto flex h-14 max-w-site items-center gap-6 px-5 sm:px-8">
          <Link
            to="/"
            className="relative z-[60] select-none no-underline"
            onClick={(event) => {
              setOpen(false)
              if (location.pathname === '/') {
                event.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
          >
            {/* Letters are marked so the home headline can fold into them; the home page
                hides the wordmark until then through --wordmark. */}
            <span
              className="text-base font-medium tracking-[0.14em] text-ink uppercase"
              style={{ opacity: 'var(--wordmark, 1)' }}
              aria-label="AISI @ IU"
            >
              {['A', 'I', 'S', 'I', ' ', '@', ' ', 'I', 'U'].map((ch, i, all) =>
                ch === ' ' ? (
                  ' '
                ) : (
                  <span key={i} data-mark={all.slice(0, i).filter((c) => c !== ' ').length} aria-hidden="true">
                    {ch}
                  </span>
                ),
              )}
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-7 md:flex" aria-label="Primary">
            {links.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={desktopClass(false)}
                >
                  {link.label}
                </a>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => desktopClass(isActive)}
                >
                  {link.label}
                </NavLink>
              ),
            )}
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noreferrer"
              className="btn-solid !px-3.5 !py-1.5 !text-sm"
            >
              Get involved
            </a>
          </nav>

          <BurgerButton open={open} onClick={() => setOpen((value) => !value)} />
        </div>
      </header>
      {mobileMenu}
    </>
  )
}
