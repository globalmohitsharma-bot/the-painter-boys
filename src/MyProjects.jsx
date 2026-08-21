import { useState, useEffect, useRef, useCallback } from 'react';
import SiteHeader from './SiteHeader.jsx';
import SiteFooter from './SiteFooter.jsx';
import Icon from './Icon.jsx';
import { decodeIdToken } from './useGoogleAccount.js';
import { PHONE, WA_LINK_DEFAULT } from './siteConfig.js';
import './Home.css';
import './MyProjects.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5223';
const TOKEN_KEY = 'pb_mine_id_token';

async function api(path, idToken) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${idToken}` } });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

// Customer-facing dashboard — any signed-in Google account, not staff-only.
// Reads the same session token the header's sign-in writes (see
// useGoogleAccount.js) so signing in once there carries over here instead
// of prompting a second, separate Google sign-in for the same person.
export default function MyProjects() {
  const [idToken, setIdToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('projects'); // 'profile' | 'projects' | 'history'
  const buttonRef = useRef(null);
  const [gsiReady, setGsiReady] = useState(false);

  const profile = idToken ? decodeIdToken(idToken) : null;
  const allProjects = projects || [];
  const activeProjects = allProjects.filter(p => !['Completed', 'Cancelled'].includes(p.progress));
  const historyProjects = allProjects.filter(p => ['Completed', 'Cancelled'].includes(p.progress));

  const load = useCallback(async (token) => {
    setError('');
    try {
      const data = await api('/api/my-projects', token);
      setProjects(data);
    } catch (e) {
      setError('Could not load your projects — ' + e.message);
      setProjects([]);
    }
  }, []);

  const handleCredential = useCallback((response) => {
    sessionStorage.setItem(TOKEN_KEY, response.credential);
    setIdToken(response.credential);
    load(response.credential);
  }, [load]);

  useEffect(() => { if (idToken) load(idToken); }, [idToken, load]);

  useEffect(() => {
    if (idToken) return;
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

  function signOut() {
    sessionStorage.removeItem(TOKEN_KEY);
    setIdToken(null);
    setProjects(null);
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
                  <div ref={buttonRef} className="mp-gsi-btn" />
                  {!GOOGLE_CLIENT_ID && <p className="mp-warn">Sign-in isn't configured on this deployment yet.</p>}
                  {GOOGLE_CLIENT_ID && !gsiReady && <p className="mp-warn">Loading Google Sign-In…</p>}
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
        <a href="/" className="mp-app-brand">🎨 The Painter Boys</a>
        <a href="/" className="mp-app-back">← Back to site</a>
      </div>
      <div className="mp-app-body">
        <nav className="mp-sidebar">
          <button className={`mp-sidebar-btn ${view === 'profile' ? 'active' : ''}`} onClick={() => setView('profile')}>👤 Profile</button>
          <button className={`mp-sidebar-btn ${view === 'projects' ? 'active' : ''}`} onClick={() => setView('projects')}>🖌️ Active Projects</button>
          <button className={`mp-sidebar-btn ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}>📜 History</button>
          <div className="mp-sidebar-spacer" />
          <button className="mp-sidebar-btn mp-sidebar-logout" onClick={signOut}>🚪 Log Out</button>
        </nav>

        <main className="mp-app-main">
          {error && <div className="mp-error">{error}</div>}
          {projects === null ? (
            <p className="mp-loading">Loading…</p>
          ) : view === 'profile' ? (
            <>
              <h1 className="mp-page-title">Profile</h1>
              <div className="mp-profile-card">
                {profile?.picture
                  ? <img src={profile.picture} alt="" className="mp-profile-avatar" referrerPolicy="no-referrer" />
                  : <div className="mp-profile-avatar mp-profile-avatar-fallback"><Icon name="user" size={28} /></div>}
                <div>
                  <div className="mp-profile-name">{profile?.name || '—'}</div>
                  <div className="mp-profile-email">{profile?.email || '—'}</div>
                </div>
              </div>
              <div className="mp-contact-box">
                <h3>Need help with your project?</h3>
                <p>Reach out to us directly — we're happy to answer any questions.</p>
                <div className="mp-contact-actions">
                  <a className="mp-contact-btn mp-contact-whatsapp" href={WA_LINK_DEFAULT} target="_blank" rel="noopener noreferrer">
                    <Icon name="whatsapp" size={18} /> WhatsApp Us
                  </a>
                  <a className="mp-contact-btn mp-contact-call" href={`tel:${PHONE.replace(/\s+/g, '')}`}>
                    <Icon name="phone" size={18} /> Call Us
                  </a>
                </div>
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
              <div className="mp-contact-box">
                <h3>Need help with your project?</h3>
                <p>Reach out to us directly — we're happy to answer any questions.</p>
                <div className="mp-contact-actions">
                  <a className="mp-contact-btn mp-contact-whatsapp" href={WA_LINK_DEFAULT} target="_blank" rel="noopener noreferrer">
                    <Icon name="whatsapp" size={18} /> WhatsApp Us
                  </a>
                  <a className="mp-contact-btn mp-contact-call" href={`tel:${PHONE.replace(/\s+/g, '')}`}>
                    <Icon name="phone" size={18} /> Call Us
                  </a>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="mp-page-title">History</h1>
              {historyProjects.length === 0 ? (
                <div className="mp-empty mp-empty-inline">
                  <Icon name="folder" size={28} />
                  <p>History empty.</p>
                </div>
              ) : (
                <div className="mp-project-list">
                  {historyProjects.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
              )}
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
  return (
    <div className="mp-card">
      <div className="mp-card-head">
        <h3>{project.name || project.paintType || 'Painting Project'}</h3>
        <span className={`ap-progress-chip ap-progress-${project.progress.toLowerCase().replace(/\s+/g, '-')}`}>{project.progress}</span>
      </div>
      {(project.clientSociety || project.clientAddress) && (
        <p className="mp-card-address">{[project.clientSociety, project.clientAddress].filter(Boolean).join(', ')}</p>
      )}
      {project.paintType && <p className="mp-card-detail">🎨 {project.paintType}</p>}

      {images.length > 0 && (
        <div className="mp-photo-grid">
          {images.map(img => (
            <div key={img.url} className="mp-photo-item">
              <img src={img.url} alt={img.caption || ''} />
              {img.caption && <p className="mp-photo-caption">{img.caption}</p>}
            </div>
          ))}
        </div>
      )}

      {(project.amount > 0 || receivedTotal > 0) && (
        <div className="mp-payment">
          {project.amount > 0 && <div className="mp-payment-row"><span>Total Project Amount</span><span>₹{project.amount.toLocaleString('en-IN')}</span></div>}
          <div className="mp-payment-row"><span>Received</span><span>₹{receivedTotal.toLocaleString('en-IN')}</span></div>
          {pendingTotal > 0 && <div className="mp-payment-row mp-payment-pending"><span>Pending</span><span>₹{pendingTotal.toLocaleString('en-IN')}</span></div>}
        </div>
      )}
    </div>
  );
}
