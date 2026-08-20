import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Home from './Home.jsx'
import { BlogList, BlogPost } from './Blog.jsx'
import ServiceDetail from './ServiceDetail.jsx'
import TeamDetail from './TeamDetail.jsx'
import PaintDetail from './PaintDetail.jsx'
import PBDashboard from './PBDashboard.jsx'
import PainterBoard from './PainterBoard.jsx'
import CustomerView from './CustomerView.jsx'
import PainterCard from './PainterCard.jsx'
import AdminPortal from './AdminPortal.jsx'
import MyProjects from './MyProjects.jsx'

// React Router doesn't reset scroll position on navigation by default —
// without this, clicking a link while scrolled down a long page (e.g. the
// blog list) lands on the new page still scrolled to that same position.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Instantly-checkable proof of which actual build a browser has loaded —
// no DevTools needed. Click it to also log the GIS client ID state, for
// tracking down "stale cache vs real bug" reports without back-and-forth.
function BuildBadge() {
  return (
    <div
      onClick={() => {
        const id = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
        alert(`Build: ${typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'unknown'}\nOrigin: ${window.location.origin}\nGoogle Client ID set: ${id ? 'yes (' + id.length + ' chars)' : 'NO — empty'}`);
      }}
      style={{
        position: 'fixed', bottom: 4, left: 4, zIndex: 99999,
        background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 9,
        padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace',
        cursor: 'pointer', userSelect: 'none',
      }}
      title="Tap for build/config info"
    >
      {typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__.slice(11, 19) : '?'}
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <BuildBadge />
        <Routes>
          {/* Each of these renders <Home/>, which reads the path to pick which
              section to show — real distinct URLs instead of client-only state,
              so each page can be crawled, indexed, and linked to individually. */}
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Home />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/about" element={<Home />} />
          <Route path="/how-it-works" element={<Home />} />
          <Route path="/team" element={<Home />} />
          <Route path="/team/:slug" element={<TeamDetail />} />
          <Route path="/paint-types" element={<Home />} />
          <Route path="/paint-types/:slug" element={<PaintDetail />} />
          <Route path="/contact" element={<Home />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/pb" element={<PBDashboard />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/my-projects" element={<MyProjects />} />
          <Route path="/painter" element={<PainterBoard />} />
          <Route path="/job/:code" element={<CustomerView />} />
          <Route path="/customer" element={<CustomerView />} />
          <Route path="/card" element={<PainterCard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  )
}
