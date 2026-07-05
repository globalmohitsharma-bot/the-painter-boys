import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PBDashboard from './PBDashboard.jsx'
import PainterBoard from './PainterBoard.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/pb" element={<PBDashboard />} />
        <Route path="/painter" element={<PainterBoard />} />
        <Route path="*" element={<Navigate to="/pb" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
