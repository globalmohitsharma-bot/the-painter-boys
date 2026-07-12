import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import PBDashboard from './PBDashboard.jsx'
import PainterBoard from './PainterBoard.jsx'
import CustomerView from './CustomerView.jsx'
import PainterCard from './PainterCard.jsx'
import './RoleChooser.css'

const LAST_ROLE_KEY = 'pb_last_role' // 'pb' | 'painter'

// This app has no marketing/landing page — "/" exists purely so the installed
// home-screen icon always opens to something useful. First visit: pick a role.
// After that: silently jump straight to whichever section was used last, so
// tapping the icon feels like opening a dedicated app instead of a website.
function RoleChooser() {
  const navigate = useNavigate()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const last = localStorage.getItem(LAST_ROLE_KEY)
    if (last === 'pb' || last === 'painter') {
      navigate(`/${last}`, { replace: true })
    } else {
      setChecked(true)
    }
  }, [navigate])

  const pick = (role) => {
    localStorage.setItem(LAST_ROLE_KEY, role)
    navigate(`/${role}`, { replace: true })
  }

  if (!checked) return null

  return (
    <div className="rc-wrap">
      <div className="rc-card">
        <div className="rc-logo">🎨</div>
        <div className="rc-title">The Painter Boys</div>
        <div className="rc-sub">Which do you want to open?</div>
        <button className="rc-btn rc-btn-admin" onClick={() => pick('pb')}>📊 Admin CRM</button>
        <button className="rc-btn rc-btn-painter" onClick={() => pick('painter')}>👷 Painter Portal</button>
      </div>
    </div>
  )
}

// Lets either page's own header offer a way back to the chooser (e.g. wrong role picked).
function RoleTrackedRoute({ role, children }) {
  useEffect(() => { localStorage.setItem(LAST_ROLE_KEY, role) }, [role])
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleChooser />} />
        <Route path="/pb" element={<RoleTrackedRoute role="pb"><PBDashboard /></RoleTrackedRoute>} />
        <Route path="/painter" element={<RoleTrackedRoute role="painter"><PainterBoard /></RoleTrackedRoute>} />
        <Route path="/job/:code" element={<CustomerView />} />
        <Route path="/customer" element={<CustomerView />} />
        <Route path="/card" element={<PainterCard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
