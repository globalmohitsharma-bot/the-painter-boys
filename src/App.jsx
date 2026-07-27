import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Home from './Home.jsx'
import PBDashboard from './PBDashboard.jsx'
import PainterBoard from './PainterBoard.jsx'
import CustomerView from './CustomerView.jsx'
import PainterCard from './PainterCard.jsx'

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          {/* Each of these renders <Home/>, which reads the path to pick which
              section to show — real distinct URLs instead of client-only state,
              so each page can be crawled, indexed, and linked to individually. */}
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Home />} />
          <Route path="/about" element={<Home />} />
          <Route path="/how-it-works" element={<Home />} />
          <Route path="/team" element={<Home />} />
          <Route path="/paint-types" element={<Home />} />
          <Route path="/contact" element={<Home />} />
          <Route path="/pb" element={<PBDashboard />} />
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
