import { useState, useEffect, useCallback } from 'react';
import { isNativeApp } from './nativeGoogleSignIn.js';

// Shared "Add to Home Screen" logic — used by both the public site
// (SiteHeader/BottomNav, for customers) and the Admin Portal header, so an
// admin checking client updates on their phone gets the same one-tap
// install as a customer checking their project.
//
// Android/Chrome/Edge fire `beforeinstallprompt`, which we capture and
// replay later via .prompt() — the browser only allows that once per
// captured event, and never fires it again once the app is installed.
// iOS Safari has no such event at all; there's no programmatic install API,
// only the manual Share -> Add to Home Screen flow, so canInstall stays
// true there (until already installed) and the caller shows instructions
// instead of calling promptInstall().
export default function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setInstalled(standalone);

    function onBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
  const canPromptDirectly = !!deferredPrompt;
  // Already running inside the Capacitor-wrapped Android app — it's already
  // "installed" by definition, and display-mode:standalone doesn't reliably
  // reflect that inside a native WebView the way it does in a real browser.
  const canInstall = !installed && !isNativeApp() && (canPromptDirectly || isIOS);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return 'manual'; // caller shows iOS Share instructions
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return choice.outcome === 'accepted' ? 'accepted' : 'dismissed';
  }, [deferredPrompt]);

  return { canInstall, isIOS, installed, canPromptDirectly, promptInstall };
}
