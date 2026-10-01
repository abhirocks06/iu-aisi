import { NavLink, Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CONTACT_EMAIL } from '../data/posts'

const links = [
  { label: 'P241', placeholder: true },
  { to: '/events', label: 'Events' },
  { to: '/resources', label: 'Resources' },
  { to: '/team', label: 'Team' },
]

function BurgerButton({ open, onClick, onCrimson }) {
  const bar = onCrimson ? 'bg-white' : 'bg-ink'
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
        className={`block h-px w-5 origin-center transition-all duration-200 ${bar} ${open ? 'translate-y-[3.5px] rotate-45' : ''}`}
      />
      <span
        className={`block h-px w-5 origin-center transition-all duration-200 ${bar} ${open ? '-translate-y-[3.5px] -rotate-45' : ''}`}
      />
    </button>
  )
}

function desktopClass(onCrimson, isActive) {
  return [
    'py-1 text-sm font-medium tracking-wide no-underline transition-colors',
    onCrimson
      ? isActive
        ? 'text-white'
        : 'text-white/75 hover:text-white'
      : isActive
        ? 'text-crimson'
        : 'text-ink hover:text-crimson',
  ].join(' ')
}

function mobileClass(isActive) {
  return [
    'mobile-menu-item text-3xl font-medium tracking-tight no-underline transition-colors sm:text-4xl',
    isActive ? 'text-crimson' : 'text-ink hover:text-crimson',
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
      <div className="h-14 shrink-0 border-b border-line bg-paper" aria-hidden />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 sm:px-8">
        <nav className="flex flex-col gap-5 pt-10" aria-label="Mobile">
          {links.map((link, index) =>
            link.placeholder ? (
              <a
                key={link.label}
                href="#"
                className={mobileClass(false)}
                style={{ animationDelay: `${0.06 + index * 0.05}s` }}
                onClick={(event) => {
                  event.preventDefault()
                  onClose()
                }}
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

        <div
          className="mobile-menu-item mt-auto border-t border-line py-8"
          style={{ animationDelay: '0.22s' }}
        >
          <p className="text-sm text-muted">Indiana University Bloomington</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-2 inline-block text-sm font-medium text-crimson no-underline hover:opacity-70"
            onClick={onClose}
          >
            {CONTACT_EMAIL}
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
  const onHome = location.pathname === '/'
  const onCrimson = onHome && !open

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
      <header
        className={[
          'relative z-50',
          onCrimson ? 'bg-crimson text-white' : 'bg-paper text-ink',
        ].join(' ')}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5 sm:px-8">
          <Link
            to="/"
            className="select-none no-underline"
            onClick={() => {
              if (location.pathname === '/') setOpen(false)
            }}
          >
            <span
              className={[
                'text-xl font-semibold tracking-tight',
                onCrimson ? 'text-white' : 'text-ink',
              ].join(' ')}
            >
              AISI
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-8 md:flex" aria-label="Primary">
            {links.map((link) =>
              link.placeholder ? (
                <a
                  key={link.label}
                  href="#"
                  className={desktopClass(onCrimson, false)}
                  onClick={(event) => event.preventDefault()}
                >
                  {link.label}
                </a>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => desktopClass(onCrimson, isActive)}
                >
                  {link.label}
                </NavLink>
              ),
            )}
          </nav>

          <BurgerButton
            open={open}
            onClick={() => setOpen((value) => !value)}
            onCrimson={onCrimson}
          />
        </div>
      </header>
      {mobileMenu}
    </>
  )
}
