import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

// Google Identity Services client ID — not set yet. The sign-in button below
// is real (Google's own renderButton, not a mock), but Google will reject it
// until a real client ID registered for this domain is supplied at build
// time via VITE_GOOGLE_CLIENT_ID. See deployment.md for the setup this needs.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// google.accounts.id.initialize() configures GIS globally for the whole page
// (not per-component) — calling it more than once makes GIS log a warning
// and silently keep only the *last* call's config. Two AccountModal instances
// exist at once (SiteHeader's + BottomNav's, one just CSS-hidden), and an
// unstable onCredential reference used to make this effect re-run on every
// unrelated parent re-render, so initialize() kept firing repeatedly — and
// with two live instances, whichever one re-rendered *last* silently won,
// which is how the button ended up wired to a config that could go stale.
// Fix: call initialize() at most once, ever, with a stable wrapper callback
// that always delegates to whichever instance most recently ran its effect
// (i.e. whichever modal is actually open) — so the real per-instance
// onCredential still gets used correctly without re-initializing GIS itself.
let gisInitialized = false;
let currentCredentialHandler = null;

// Shared sign-in panel used by both the desktop header account icon
// (SiteHeader.jsx) and the mobile bottom nav (BottomNav.jsx) — same modal,
// same Google button, just triggered from two different places.
export default function AccountModal({ open, tab, onClose, user, onCredential, onSignOut }) {
  const buttonRef = useRef(null);
  const [gsiReady, setGsiReady] = useState(false);

  useEffect(() => {
    if (!open || user) return;
    let cancelled = false;
    let attempts = 0;
    const tryInit = () => {
      if (cancelled) return;
      if (!window.google?.accounts?.id) {
        attempts += 1;
        if (attempts < 40) { setTimeout(tryInit, 150); }
        return;
      }
      setGsiReady(true);
      currentCredentialHandler = onCredential;
      if (!gisInitialized) {
        gisInitialized = true;
        // Temporary diagnostic — remove once root-caused.
        console.log('[PB-DIAG3]', JSON.stringify({
          origin: window.location.origin,
          href: window.location.href,
          clientIdType: typeof GOOGLE_CLIENT_ID,
          clientIdValue: GOOGLE_CLIENT_ID,
          clientIdLen: GOOGLE_CLIENT_ID.length,
        }));
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => currentCredentialHandler?.(response),
        });
      }
      if (buttonRef.current) {
        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline', size: 'large', width: 260, text: 'signin_with',
        });
      }
    };
    tryInit();
    return () => { cancelled = true; };
  }, [open, user, onCredential]);

  if (!open) return null;

  return (
    <div className="bn-modal-overlay" onClick={onClose}>
      <div className="bn-modal" onClick={e => e.stopPropagation()}>
        <button className="bn-modal-close" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button>

        {user ? (
          <div className="bn-signed-in">
            {user.picture
              ? <img src={user.picture} alt="" className="bn-modal-avatar" referrerPolicy="no-referrer" />
              : <div className="bn-modal-avatar bn-modal-avatar-fallback"><Icon name="user" size={28} /></div>}
            <h3 className="bn-modal-title">Welcome, {user.name?.split(' ')[0]}</h3>
            <p className="bn-modal-sub">{user.email}</p>
            {user.isStaff ? (
              <div className="bn-staff-links">
                <p className="bn-modal-note">You have staff access on this account.</p>
                <a className="bn-staff-link" href="/admin">Admin Portal</a>
                <a className="bn-staff-link" href="/pb">Staff Portal</a>
              </div>
            ) : tab === 'projects' ? (
              <div className="bn-staff-links">
                <p className="bn-modal-note">See your painting project's progress, photos, and payments.</p>
                <a className="bn-staff-link" href="/my-projects">View My Projects</a>
              </div>
            ) : (
              <p className="bn-modal-note">Full profile management is coming soon.</p>
            )}
            <button className="bn-signout" onClick={onSignOut}>Sign out</button>
          </div>
        ) : (
          <div className="bn-signin">
            <div className="bn-modal-icon"><Icon name={tab === 'projects' ? 'folder' : 'user'} size={26} /></div>
            <h3 className="bn-modal-title">{tab === 'projects' ? 'My Projects' : 'My Profile'}</h3>
            <p className="bn-modal-sub">Sign in with Google to see your painting projects, photos, and progress here.</p>
            <div ref={buttonRef} className="bn-gsi-btn" />
            {!GOOGLE_CLIENT_ID && (
              <p className="bn-modal-warn">Sign-in isn't fully configured on this deployment yet — the button above won't complete until a Google Client ID is added.</p>
            )}
            {GOOGLE_CLIENT_ID && !gsiReady && (
              <p className="bn-modal-warn">Loading Google Sign-In…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
