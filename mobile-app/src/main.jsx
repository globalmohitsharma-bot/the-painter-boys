import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'

// Don't force a reload the moment a new version is detected in the background —
// that can interrupt whatever the user is doing. Instead, just register the SW
// and expose a manual "apply update" trigger that each page's own Refresh button
// calls, so pulling fresh data and picking up a new app version happen together,
// only when the user actually asks for it. (Only matters for the plain web/PWA
// build — the native Android app doesn't use a service worker at all.)
if (!window.Capacitor?.isNativePlatform?.()) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {},
    onOfflineReady() {},
  })
  window.__pbCheckForUpdate = () => updateSW(true)
} else {
  window.__pbCheckForUpdate = () => {}
}

// Native-only polish: match the status bar to the app's dark theme, hide the
// native splash as soon as React has mounted, and make the hardware/gesture
// back button navigate within the app instead of abruptly closing it.
if (window.Capacitor?.isNativePlatform?.()) {
  import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
    StatusBar.setBackgroundColor({ color: '#0d2137' }).catch(() => {})
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
  })
  import('@capacitor/splash-screen').then(({ SplashScreen }) => {
    SplashScreen.hide().catch(() => {})
  })
  import('@capacitor/app').then(({ App: CapApp }) => {
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back()
      else CapApp.exitApp()
    })
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
