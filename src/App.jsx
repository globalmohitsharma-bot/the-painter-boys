import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './Home.jsx'
import PBDashboard from './PBDashboard.jsx'
import PainterBoard from './PainterBoard.jsx'
import CustomerView from './CustomerView.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pb" element={<PBDashboard />} />
        <Route path="/painter" element={<PainterBoard />} />
        <Route path="/customer" element={<CustomerView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
