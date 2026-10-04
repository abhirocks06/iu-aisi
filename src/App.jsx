import { Navigate, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Events from './pages/Events'
import Editorial from './pages/Editorial'
import EditorialPost from './pages/EditorialPost'
import Resources from './pages/Resources'
import Team from './pages/Team'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="events" element={<Events />} />
        <Route path="editorial" element={<Editorial />} />
        <Route path="editorial/:slug" element={<EditorialPost />} />
        <Route path="what-is-ai-safety" element={<Resources />} />
        <Route path="resources" element={<Navigate to="/what-is-ai-safety" replace />} />
        <Route path="team" element={<Team />} />
      </Route>
    </Routes>
  )
}
