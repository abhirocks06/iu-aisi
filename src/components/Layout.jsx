import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import { getPostBySlug } from '../data/posts'

const PAGE_TITLES = {
  '/': 'Home',
  '/events': 'Events',
  '/editorial': 'Editorial',
  '/resources': 'Resources',
  '/team': 'Team',
}

const SITE_NAME = 'AI Safety Initiative @ IU'

function titleForPath(pathname) {
  const exact = PAGE_TITLES[pathname]
  if (exact) return `${exact} | ${SITE_NAME}`

  const editorialMatch = pathname.match(/^\/editorial\/([^/]+)$/)
  if (editorialMatch) {
    const post = getPostBySlug(editorialMatch[1])
    if (post) return `${post.title} | ${SITE_NAME}`
    return `Editorial | ${SITE_NAME}`
  }

  return SITE_NAME
}

export default function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    document.title = titleForPath(pathname)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
