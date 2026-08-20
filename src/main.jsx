import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'

// onNeedRefresh used to be a no-op, with updates only ever applied via a
// manual trigger wired to the Staff Portal's own Refresh button — meaning
// every other page on the site (home, blog, the profile sign-in modal, etc.)
// had no update path at all: a new deployment sat detected-but-inert until
// every tab for the site was closed, which is how a real fix could go out
// and still not reach a visitor's already-open browser. Auto-apply instead —
// for a marketing site a background refresh is the right tradeoff over
// visitors silently running stale code indefinitely.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() { updateSW(true) },
  onOfflineReady() {},
})
window.__pbCheckForUpdate = () => updateSW(true)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
