import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import './BottomNav.css';

// Google Identity Services client ID — not set yet. The sign-in button below
// is real (Google's own renderButton, not a mock), but Google will reject it
// until a real client ID registered for this domain is supplied at build
// time via VITE_GOOGLE_CLIENT_ID. See deployment.md for the one-time Google
// Cloud Console setup this needs before it can go live.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const USER_KEY = 'pb_google_user';

// Decodes the ID token's payload for display only (name/email/picture) — this
// is NOT a verified/secure auth check (that requires a backend to verify the
// token's signature), just enough to show a signed-in state client-side until
// the real customer-portal backend exists.
function decodeIdToken(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

function loadStoredUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}

export default function BottomNav() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('projects'); // 'projects' | 'profile' — just varies the modal copy
  const [user, setUser] = useState(loadStoredUser);
  const [gsiReady, setGsiReady] = useState(false);
  const buttonRef = useRef(null);

  function openModal(which) {
    setTab(which);
    setOpen(true);
  }

  function handleCredential(response) {
    const payload = decodeIdToken(response.credential);
    if (!payload) return;
    const nextUser = { name: payload.name, email: payload.email, picture: payload.picture };
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    window.google?.accounts?.id?.disableAutoSelect?.();
  }

  // Initialize + render Google's own button only once the modal is open, the
  // user isn't already signed in, and the GIS script has finished loading.
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
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredential });
      if (buttonRef.current) {
        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline', size: 'large', width: 260, text: 'signin_with',
        });
      }
    };
    tryInit();
    return () => { cancelled = true; };
  }, [open, user]);

  return (
    <>
      <nav className="bn-bar" aria-label="Portal navigation">
        <Link to="/" className="bn-item" onClick={() => setOpen(false)}>
          <Icon name="home" size={21} />
          <span>Home</span>
        </Link>
        <button type="button" className="bn-item" onClick={() => openModal('projects')}>
          <Icon name="folder" size={21} />
          <span>My Projects</span>
        </button>
        <button type="button" className="bn-item" onClick={() => openModal('profile')}>
          {user?.picture
            ? <img src={user.picture} alt="" className="bn-avatar" referrerPolicy="no-referrer" />
            : <Icon name="user" size={21} />}
          <span>Profile</span>
        </button>
      </nav>

      {open && (
        <div className="bn-modal-overlay" onClick={() => setOpen(false)}>
          <div className="bn-modal" onClick={e => e.stopPropagation()}>
            <button className="bn-modal-close" onClick={() => setOpen(false)} aria-label="Close"><Icon name="close" size={16} /></button>

            {user ? (
              <div className="bn-signed-in">
                {user.picture
                  ? <img src={user.picture} alt="" className="bn-modal-avatar" referrerPolicy="no-referrer" />
                  : <div className="bn-modal-avatar bn-modal-avatar-fallback"><Icon name="user" size={28} /></div>}
                <h3 className="bn-modal-title">Welcome, {user.name?.split(' ')[0]}</h3>
                <p className="bn-modal-sub">{user.email}</p>
                <p className="bn-modal-note">
                  {tab === 'projects'
                    ? 'Your project dashboard (photos, progress, past work) is coming soon — this account will be linked to your jobs automatically once it\'s live.'
                    : 'Full profile management is coming soon.'}
                </p>
                <button className="bn-signout" onClick={signOut}>Sign out</button>
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
      )}
    </>
  );
}
