import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SiteHeader from './SiteHeader.jsx';
import SiteFooter from './SiteFooter.jsx';
import Icon from './Icon.jsx';
import { decodeIdToken, USER_KEY } from './useGoogleAccount.js';
import { isNativeApp, nativeGoogleSignIn, nativeGoogleSignOut } from './nativeGoogleSignIn.js';
import { PHONE, WA_LINK_DEFAULT } from './siteConfig.js';
import './Home.css';
import './MyProjects.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5223';
const TOKEN_KEY = 'pb_mine_id_token';

// Linear happy-path order — Cancelled is a terminal state outside this flow,
// shown as its own banner instead of a step. Same colors as the Admin
// Portal's status icons/card borders (AdminPortal.css's --status-* values),
// repeated here as plain hex since this page has no .ap-root to scope those
// custom properties to.
const TIMELINE_STEPS = ['Inquiry', 'Pending Visit', 'Not Started', 'In Progress', 'Completed'];
const TIMELINE_COLORS = {
  Inquiry: '#ef4444', 'Pending Visit': '#a855f7', 'Not Started': '#64748b',
  'In Progress': '#f59e0b', Completed: '#16a34a',
};

function ProgressTimeline({ progress }) {
  if (progress === 'Cancelled') {
    return <div className="mp-timeline-cancelled">✕ This project was cancelled</div>;
  }
  const currentIndex = TIMELINE_STEPS.indexOf(progress);
  return (
    <div className="mp-timeline">
      {TIMELINE_STEPS.map((step, i) => {
        const done = currentIndex >= 0 && i < currentIndex;
        const current = i === currentIndex;
        const color = TIMELINE_COLORS[step];
        return (
          <div key={step} className="mp-timeline-step">
            <div className="mp-timeline-node">
              <span
                className={`mp-timeline-dot${current ? ' mp-timeline-dot-current' : ''}`}
                style={(done || current) ? { background: color, borderColor: color } : undefined}
              >
                {done ? '✓' : ''}
              </span>
              {i < TIMELINE_STEPS.length - 1 && (
                <span className="mp-timeline-line" style={done ? { background: color } : undefined} />
              )}
            </div>
            <span className={`mp-timeline-label${current ? ' mp-timeline-label-current' : ''}`}>{step}</span>
          </div>
        );
      })}
    </div>
  );
}

async function api(path, idToken) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${idToken}` } });
  if (!res.ok) {
    const err = new Error(`GET ${path} -> ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function apiPost(path, idToken, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(typeof data === 'string' ? data : (data?.title || `POST ${path} -> ${res.status}`));
    err.status = res.status;
    throw err;
  }
  return data;
}

// Customer-facing dashboard — any signed-in Google account, not staff-only.
// Reads the same session token the header's sign-in writes (see
// useGoogleAccount.js) so signing in once there carries over here instead
// of prompting a second, separate Google sign-in for the same person.
export default function MyProjects() {
  const navigate = useNavigate();
  // An admin's "Log in as" link (see AdminPortal.jsx) lands here with
  // ?impersonate=TOKEN — that token isn't a Google ID token (decodeIdToken
  // can't read it), so treat it exactly like a normal session token but pull
  // the URL immediately after so it's never left sitting in history/bookmarks.
  const [idToken, setIdToken] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('impersonate');
    if (fromUrl) { sessionStorage.setItem(TOKEN_KEY, fromUrl); return fromUrl; }
    return sessionStorage.getItem(TOKEN_KEY);
  });
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('projects'); // 'profile' | 'projects' | 'history'
  const [isStaff, setIsStaff] = useState(false);
  const [whoami, setWhoami] = useState(null);
  const [linkCode, setLinkCode] = useState('');
  const [linkStatus, setLinkStatus] = useState(null); // { ok: bool, message: string }
  const [linking, setLinking] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null); // { ok: bool, message: string }
  const [requesting, setRequesting] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const buttonRef = useRef(null);
  const [gsiReady, setGsiReady] = useState(false);
  const [nativeSigningIn, setNativeSigningIn] = useState(false);
  const [nativeError, setNativeError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  const isImpersonating = !!idToken && idToken.startsWith('IMPERSONATE_');
  // Impersonation tokens carry no client-readable payload, so fall back to
  // the server-verified whoami response (fetched in load()) for name/email.
  const profile = (idToken ? decodeIdToken(idToken) : null)
    || (whoami ? { name: whoami.name, email: whoami.email, picture: null } : null);
  const allProjects = projects || [];
  const activeProjects = allProjects.filter(p => !['Completed', 'Cancelled'].includes(p.progress));
  const historyProjects = allProjects.filter(p => ['Completed', 'Cancelled'].includes(p.progress));

  const load = useCallback(async (token) => {
    setError('');
    try {
      const data = await api('/api/my-projects', token);
      setProjects(data);
    } catch (e) {
      if (e.status === 401) {
        // Google ID tokens expire in ~1 hour. On mobile, "closing" a tab
        // often just backgrounds it rather than clearing it, so a tab left
        // open overnight still decodes fine client-side (that's just
        // reading the JWT payload, no server round-trip) but the server
        // correctly rejects it — send back to a clean sign-in instead of
        // leaving a "Welcome, X" header up next to a raw error.
        sessionStorage.removeItem(TOKEN_KEY);
        setIdToken(null);
        setSessionExpired(true);
        return;
      }
      setError('Could not load your projects — ' + e.message);
      setProjects([]);
    }
    // This page is customer-facing by default and has no concept of role —
    // an admin/staff account landing here directly (bookmark, shared link,
    // etc.) would otherwise see a bare customer view with no way back to
    // the tools they actually need.
    try {
      const who = await api('/api/auth/whoami', token);
      setIsStaff(!!who.isStaff);
      setWhoami(who);
    } catch {
      // Not staff, or backend unreachable — either way just stay on the
      // regular customer view.
    }
  }, []);

  async function submitLinkCode() {
    if (!linkCode.trim()) return;
    setLinking(true);
    setLinkStatus(null);
    try {
      const result = await apiPost('/api/my-projects/link', idToken, { code: linkCode.trim() });
      setLinkCode('');
      const messages = {
        requested: "Request sent — you'll see the project on your dashboard once an admin approves it.",
        'already-pending': 'Already requested — waiting on admin approval.',
        'already-linked': "That project's already linked to your account.",
      };
      setLinkStatus({ ok: true, message: messages[result.status] || 'Request sent.' });
    } catch (e) {
      // A code that just doesn't match anything yet is an everyday typo/mixup,
      // not a failure — keep that one calm and informational rather than red.
      setLinkStatus({
        ok: false, info: e.status === 404,
        message: e.status === 404 ? "That code doesn't match a project yet — double-check it with your painter or admin." : e.message,
      });
    } finally {
      setLinking(false);
    }
  }

  // For a customer who doesn't have a link code handy — flags their own
  // account so it shows up in the Admin Portal's Requests queue, where an
  // admin can find and share the right project, then mark it resolved.
  async function requestProjectLink() {
    setRequesting(true);
    setRequestStatus(null);
    try {
      const result = await apiPost('/api/my-projects/request-link', idToken, {});
      setRequestStatus({
        ok: true,
        message: result.status === 'already-pending'
          ? "Already asked — an admin's been notified and will link your project soon."
          : "Request sent — an admin will link your project to this dashboard soon.",
      });
    } catch (e) {
      setRequestStatus({ ok: false, message: e.message });
    } finally {
      setRequesting(false);
    }
  }

  const handleCredential = useCallback(async (response) => {
    sessionStorage.setItem(TOKEN_KEY, response.credential);
    setIdToken(response.credential);
    // An invite link (?invite=... from an admin-shared WhatsApp message) auto-links
    // the project to whichever Google account signs in via it — that linking only
    // happens server-side in /api/auth/google, which this page otherwise never
    // calls (it only ever fetched /api/my-projects), so it'd silently do nothing
    // without this.
    const inviteToken = new URLSearchParams(window.location.search).get('invite');
    if (inviteToken) {
      try { await apiPost('/api/auth/google', response.credential, { idToken: response.credential, inviteToken }); }
      catch { /* Sign-in above already succeeded; worst case the invite just didn't apply. */ }
    }
    load(response.credential);
  }, [load]);

  useEffect(() => { if (idToken) load(idToken); }, [idToken, load]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('impersonate')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // An Admin account landing here directly (bookmark, stale link, the
  // sign-in flow's own redirect not having fired yet) gets sent straight to
  // the Admin Portal — no click-through needed. Deliberately scoped to the
  // Admin role only, not the broader isStaff group (Manager/Partner aren't
  // wired up to the Admin Portal and should stay on their own dashboard).
  // Never redirect while actively impersonating a customer, since that's a
  // deliberate "view as them" state.
  useEffect(() => {
    if (whoami?.role === 'Admin' && !isImpersonating) navigate('/admin');
  }, [whoami, isImpersonating, navigate]);

  useEffect(() => {
    if (idToken || isNativeApp()) return;
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
        window.google.accounts.id.renderButton(buttonRef.current, { theme: 'outline', size: 'large', width: 260, text: 'signin_with' });
      }
    };
    tryInit();
    return () => { cancelled = true; };
  }, [idToken, handleCredential]);

  async function handleNativeSignIn() {
    setNativeSigningIn(true);
    setNativeError('');
    try {
      const response = await nativeGoogleSignIn();
      await handleCredential(response);
    } catch (e) {
      if (e?.code !== 'SIGN_IN_CANCELED') setNativeError('Sign-in failed — please try again.');
    } finally {
      setNativeSigningIn(false);
    }
  }

  function signOut() {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.google?.accounts?.id?.disableAutoSelect?.();
    nativeGoogleSignOut();
    window.location.href = '/';
  }

  if (!idToken) {
    return (
      <div className="home">
        <SiteHeader />
        <main className="page-fade">
          <div className="inner-page">
            <div className="page-hero page-hero-blue">
              <div className="ph-content">
                <span className="sec-tag light">My Account</span>
                <h1 className="ph-title">My Dashboard</h1>
                <p className="ph-sub">Track progress, photos, and payments for your painting project.</p>
              </div>
            </div>
            <div className="page-content-white">
              <div className="container section">
                <div className="mp-gate">
                  <Icon name="folder" size={28} className="mp-gate-icon" />
                  <h3>Sign in to view your dashboard</h3>
                  <p>Use the same Google account you shared with The Painter Boys team.</p>
                  {sessionExpired && <p className="mp-warn">Your session expired — please sign in again.</p>}
                  {isNativeApp() ? (
                    <>
                      <button className="mp-native-gsi-btn" onClick={handleNativeSignIn} disabled={nativeSigningIn}>
                        {nativeSigningIn ? 'Signing in…' : 'Sign in with Google'}
                      </button>
                      {nativeError && <p className="mp-warn">{nativeError}</p>}
                    </>
                  ) : (
                    <>
                      <div ref={buttonRef} className="mp-gsi-btn" />
                      {!GOOGLE_CLIENT_ID && <p className="mp-warn">Sign-in isn't configured on this deployment yet.</p>}
                      {GOOGLE_CLIENT_ID && !gsiReady && <p className="mp-warn">Loading Google Sign-In…</p>}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="mp-app">
      <div className="mp-app-topbar">
        <a href="/" className="mp-app-brand">
          <img src="/logo-header.png" alt="" className="mp-app-brand-mark" />
          <span className="mp-app-brand-pb">PB</span>
          <span className="mp-app-brand-name">The Painter Boys</span>
        </a>
        <div className="mp-app-topbar-user">
          <span className="mp-app-topbar-greeting">Welcome, {(profile?.name || '').split(' ')[0] || 'there'}</span>
          {profile?.picture
            ? <img src={profile.picture} alt="" className="mp-app-topbar-avatar" referrerPolicy="no-referrer" />
            : <div className="mp-app-topbar-avatar mp-app-topbar-avatar-fallback">{(profile?.name || '?')[0]}</div>}
        </div>
      </div>
      <div className="mp-app-body">
        <nav className="mp-sidebar">
          <div className="mp-sidebar-label">Menu</div>
          <button className={`mp-sidebar-btn ${view === 'projects' ? 'active' : ''}`} onClick={() => setView('projects')}><Icon name="folder" size={16} /> Active Projects</button>
          <button className={`mp-sidebar-btn ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}><Icon name="clock" size={16} /> History</button>
          <div className="mp-sidebar-spacer" />
          <button className={`mp-sidebar-btn ${view === 'profile' ? 'active' : ''}`} onClick={() => setView('profile')}><Icon name="user" size={16} /> Profile</button>
          <div className="mp-sidebar-user">
            {profile?.picture
              ? <img src={profile.picture} alt="" className="mp-sidebar-user-avatar" referrerPolicy="no-referrer" />
              : <div className="mp-sidebar-user-avatar mp-sidebar-user-avatar-fallback">{(profile?.name || '?')[0]}</div>}
            <div className="mp-sidebar-user-info">
              <div className="mp-sidebar-user-name">{profile?.name || '—'}</div>
              <div className="mp-sidebar-user-email">{profile?.email || '—'}</div>
            </div>
          </div>
        </nav>

        <main className="mp-app-main">
          {isImpersonating && (
            <div className="mp-staff-banner mp-impersonate-banner">
              <span>👁️ Viewing as {profile?.name || profile?.email || 'this customer'} — admin impersonation.</span>
              <div className="mp-staff-banner-links">
                <button className="mp-impersonate-end" onClick={signOut}>End Session</button>
              </div>
            </div>
          )}
          {error && <div className="mp-error">{error}</div>}
          {projects === null ? (
            <p className="mp-loading">Loading…</p>
          ) : (
            <>
              {view === 'profile' ? (
                <>
                  <h1 className="mp-page-title">Welcome, {(profile?.name || '').split(' ')[0] || 'there'}</h1>
                  <div className="mp-profile-quicklinks">
                    <button onClick={() => setView('projects')}><Icon name="folder" size={16} /> Active Projects</button>
                    <button onClick={() => setView('history')}><Icon name="clock" size={16} /> History</button>
                  </div>
                  <div className="mp-field-grid">
                    <div className="mp-field-box">
                      <span className="mp-field-label">Name</span>
                      <span className="mp-field-value">{profile?.name?.split(' ')[0] || '—'}</span>
                    </div>
                    <div className="mp-field-box">
                      <span className="mp-field-label">Email</span>
                      <span className="mp-field-value">{profile?.email || '—'}</span>
                    </div>
                  </div>

                  <div className="mp-link-box mp-link-box-compact">
                    <div className="mp-request-row">
                      <span>Don't have a project yet?</span>
                      <button className="mp-btn-secondary" disabled={requesting} onClick={requestProjectLink}>
                        {requesting ? 'Sending…' : '📨 Ask Admin to Add My Project'}
                      </button>
                    </div>
                    {requestStatus && (
                      <p className={requestStatus.ok ? 'mp-link-success' : 'mp-link-error'}>{requestStatus.message}</p>
                    )}

                    {showCodeInput ? (
                      <>
                        <p className="mp-link-toggle-hint">Your painter or admin can give you a short code to link a project to your dashboard.</p>
                        <div className="mp-link-form">
                          <input
                            value={linkCode}
                            onChange={e => setLinkCode(e.target.value.toUpperCase())}
                            placeholder="e.g. AB3CD9"
                            maxLength={6}
                            onKeyDown={e => e.key === 'Enter' && submitLinkCode()}
                          />
                          <button className="mp-btn-primary" disabled={!linkCode.trim() || linking} onClick={submitLinkCode}>
                            {linking ? 'Sending…' : 'Link Project'}
                          </button>
                        </div>
                        {linkStatus && (
                          <p className={linkStatus.ok ? 'mp-link-success' : linkStatus.info ? 'mp-link-info' : 'mp-link-error'}>{linkStatus.message}</p>
                        )}
                      </>
                    ) : (
                      <button type="button" className="mp-link-toggle" onClick={() => setShowCodeInput(true)}>
                        Have a project code instead?
                      </button>
                    )}
                  </div>
                </>
              ) : view === 'projects' ? (
                <>
                  <h1 className="mp-page-title">Active Projects</h1>
                  {activeProjects.length === 0 ? (
                    <div className="mp-empty mp-empty-inline">
                      <Icon name="folder" size={28} />
                      <p>No active project right now.</p>
                    </div>
                  ) : (
                    <div className="mp-project-list">
                      {activeProjects.map(p => <ProjectCard key={p.id} project={p} />)}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h1 className="mp-page-title">History</h1>
                  {historyProjects.length === 0 ? (
                    <div className="mp-empty mp-empty-inline">
                      <Icon name="badgeCheck" size={28} />
                      <p>Nothing here yet — completed and cancelled projects will show up once you have some.</p>
                    </div>
                  ) : (
                    <div className="mp-project-list">
                      {historyProjects.map(p => <ProjectCard key={p.id} project={p} />)}
                    </div>
                  )}
                </>
              )}

              <div className="mp-bottom-bar">
                {view === 'profile' && (
                  <button className="mp-profile-logout" onClick={signOut}><Icon name="lock" size={12} /> Log out</button>
                )}
                <div className="mp-contact-box">
                  <h3>Need help?</h3>
                  <div className="mp-contact-actions">
                    <a className="mp-contact-btn mp-contact-whatsapp" href={WA_LINK_DEFAULT} target="_blank" rel="noopener noreferrer">
                      <Icon name="whatsapp" size={14} /> WhatsApp
                    </a>
                    <a className="mp-contact-btn mp-contact-call" href={`tel:${PHONE.replace(/\s+/g, '')}`}>
                      <Icon name="phone" size={14} /> Call
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function ProjectCard({ project }) {
  const images = [...(project.images || [])].reverse();
  const receivedTotal = project.tokenReceived || 0;
  const pendingTotal = project.pendingAmount || 0;
  const [lightboxIndex, setLightboxIndex] = useState(null);

  return (
    <>
      <div className={`mp-card ${images.length > 0 ? 'mp-card-clickable' : ''}`} onClick={() => images.length > 0 && setLightboxIndex(0)}>
        <div className="mp-card-head">
          <h3>{project.name || project.paintType || 'Painting Project'}</h3>
          <span className={`ap-progress-chip ap-progress-${project.progress.toLowerCase().replace(/\s+/g, '-')}`}>{project.progress}</span>
        </div>
        <ProgressTimeline progress={project.progress} />
        {(project.clientSociety || project.clientAddress) && (
          <p className="mp-card-address">{[project.clientSociety, project.clientAddress].filter(Boolean).join(', ')}</p>
        )}
        {project.paintType && <p className="mp-card-detail">🎨 {project.paintType}</p>}

        {images.length > 0 && (
          <div className="mp-photo-grid">
            {images.map((img, i) => (
              <div key={img.url} className="mp-photo-item" onClick={e => { e.stopPropagation(); setLightboxIndex(i); }}>
                <img src={img.url} alt={img.caption || ''} />
                {img.caption && <p className="mp-photo-caption">{img.caption}</p>}
              </div>
            ))}
          </div>
        )}

        {(project.amount > 0 || receivedTotal > 0) && (
          <div className="mp-payment" onClick={e => e.stopPropagation()}>
            {project.amount > 0 && <div className="mp-payment-row"><span>Total Project Amount</span><span>₹{project.amount.toLocaleString('en-IN')}</span></div>}
            <div className="mp-payment-row"><span>Received</span><span>₹{receivedTotal.toLocaleString('en-IN')}</span></div>
            {pendingTotal > 0 && <div className="mp-payment-row mp-payment-pending"><span>Pending</span><span>₹{pendingTotal.toLocaleString('en-IN')}</span></div>}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}

function ImageLightbox({ images, index, onClose, onNavigate }) {
  const img = images[index];
  return (
    <div className="mp-lightbox-overlay" onClick={onClose}>
      <a className="mp-lightbox-download" href={img.url} download target="_blank" rel="noopener noreferrer"
        onClick={e => e.stopPropagation()} title="Download full-size image">
        ⬇
      </a>
      <button className="mp-lightbox-close" onClick={onClose}><Icon name="close" size={20} /></button>
      {images.length > 1 && (
        <button className="mp-lightbox-nav mp-lightbox-prev" onClick={e => { e.stopPropagation(); onNavigate((index - 1 + images.length) % images.length); }}>‹</button>
      )}
      <div className="mp-lightbox-content" onClick={e => e.stopPropagation()}>
        <img src={img.url} alt={img.caption || ''} />
        {img.caption && <p className="mp-lightbox-caption">{img.caption}</p>}
      </div>
      {images.length > 1 && (
        <button className="mp-lightbox-nav mp-lightbox-next" onClick={e => { e.stopPropagation(); onNavigate((index + 1) % images.length); }}>›</button>
      )}
    </div>
  );
}
