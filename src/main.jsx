import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'

// Don't force a reload the moment a new version is detected in the background —
// that can interrupt whatever the user is doing. Instead, just register the SW
// and expose a manual "apply update" trigger that the app's own Refresh button
// calls, so pulling fresh data and picking up a new app version happen together,
// only when the user actually asks for it.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {},
  onOfflineReady() {},
})
window.__pbCheckForUpdate = () => updateSW(true)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
