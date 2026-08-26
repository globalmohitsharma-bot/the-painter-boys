import { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import Icon from './Icon.jsx';
import { isNativeApp, nativeGoogleSignIn, nativeGoogleSignOut } from './nativeGoogleSignIn.js';
import { DEV_TEST_ADMIN_TOKEN } from './useGoogleAccount.js';
import './AdminPortal.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5223';
const TOKEN_KEY = 'pb_admin_id_token';
const WHOAMI_KEY = 'pb_admin_whoami';

async function api(path, idToken, options = {}) {
  // FormData sets its own multipart Content-Type (with boundary) — letting the
  // browser handle that, rather than forcing application/json, is required for
  // the image-upload endpoint to parse correctly.
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${idToken}`,
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`${options.method || 'GET'} ${path} -> ${res.status}`);
  return res.status === 204 ? null : res.json();
}

const EMPTY_CLIENT = { contactName: '', phone: '', email: '', address: '', society: '' };
const EMPTY_PROJECT = {
  name: '', progress: 'Inquiry', paintType: '', dateContacted: '', dateStarted: '', dateCompleted: '',
  remarks: '', noOfDays: '', amount: 0, otherDetails: '', painterNames: [], tokenReceived: 0,
  pendingAmount: 0, tokenHistory: [], additionalWork: '', isActive: true,
};
const PROGRESS_OPTIONS = ['Inquiry', 'Pending Visit', 'Not Started', 'In Progress', 'Completed', 'Cancelled'];
// Same built-in lists the Staff Portal ships with, for the same "select or
// type a new one" behavior on Society/Painter fields.
const DEFAULT_SOCIETIES = [
  'Addela Palm Resort', 'Ajnara Fragrance', 'Ajnara Grace', 'Ajnara Integrity',
  'Anthem Kingdom Homes', 'Charms Castle', 'Charms The Gateway Towers',
  'Devika Skypers', 'Emenox Brave Hearts', 'Gaur Cascades', 'GAV Green View Heights',
  'Jyoti Super Village', 'KDP Grand Savanna', 'KW Srishti', 'Landcraft River Heights',
  'MCC Signature Heights', 'Migsun Atharva', 'Migsun Roof', 'Nilaya Greens',
  'Officer City', 'Raj Nagar Residency', 'Royce Sentosa Parc', 'Sangwan Heights',
  'SCC Blossom', 'SCC Heights', 'SCC Sapphire', 'SG Impression Plus',
  'SG Impressions 58', 'SG Vista', 'Star Rameshwaram', 'SVP Gulmohur Garden',
  'T and T Atlas', 'Uninav Eden', 'Uninav Residena', 'Uninav Utopia',
  'VVIP Addresses', 'VVIP Homes', 'Windsor Majesty', 'Windsor Paradise 2',
].sort();
const DEFAULT_PAINTERS = ['Fariyad', 'Jabbar', 'Rajeev', 'Raju', 'Sushant'];
const EMPTY_QUOTATION = {
  society: '', customerName: '', mobile: '', bhk: '', paintType: '',
  workItems: [
    { name: 'Putty (2 Coat)', price: '' },
    { name: 'Primer', price: '' },
    { name: 'Chalk Mitti', price: '' },
    { name: 'Paint (2 Coat)', price: '' },
  ],
};
// Rule-of-thumb multiplier painting contractors commonly use to go from
// built-up area to total paintable (wall + ceiling) area — real ratio varies
// by layout, so it's editable rather than baked in as an exact constant.
const DEFAULT_AREA_MULTIPLIER = 2.5;

export default function AdminPortal() {
  const [idToken, setIdToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [whoami, setWhoami] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(WHOAMI_KEY) || 'null'); } catch { return null; }
  });
  const [checking, setChecking] = useState(!!idToken);
  const [authError, setAuthError] = useState('');
  const buttonRef = useRef(null);
  const [gsiReady, setGsiReady] = useState(false);
  const [nativeSigningIn, setNativeSigningIn] = useState(false);

  const handleCredential = useCallback(async (response) => {
    setChecking(true);
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      });
      if (!res.ok) throw new Error(`Sign-in failed (${res.status})`);
      const data = await res.json();
      sessionStorage.setItem(TOKEN_KEY, response.credential);
      sessionStorage.setItem(WHOAMI_KEY, JSON.stringify(data));
      setIdToken(response.credential);
      setWhoami(data);
    } catch (err) {
      // Surfaced instead of silently resetting to a blank sign-in screen —
      // a transient backend hiccup (e.g. mid-deploy restart) used to look
      // identical to nothing having happened at all when you clicked sign in.
      setAuthError(err.message === 'Failed to fetch'
        ? 'Could not reach the server — check your connection and try again.'
        : `${err.message} — try again in a moment.`);
    } finally {
      setChecking(false);
    }
  }, []);

  // Re-verify a stored token on load rather than trusting sessionStorage forever.
  useEffect(() => {
    if (!idToken || whoami) { setChecking(false); return; }
    api('/api/auth/whoami', idToken).then(data => {
      sessionStorage.setItem(WHOAMI_KEY, JSON.stringify(data));
      setWhoami(data);
    }).catch(() => {
      sessionStorage.removeItem(TOKEN_KEY);
      setIdToken(null);
    }).finally(() => setChecking(false));
  }, [idToken, whoami]);

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
        window.google.accounts.id.renderButton(buttonRef.current, { theme: 'filled_black', size: 'large', width: 280, text: 'signin_with' });
      }
    };
    tryInit();
    return () => { cancelled = true; };
  }, [idToken, handleCredential]);

  async function handleNativeSignIn() {
    setNativeSigningIn(true);
    try {
      const response = await nativeGoogleSignIn();
      await handleCredential(response);
    } catch (e) {
      if (e?.code !== 'SIGN_IN_CANCELED') setAuthError('Sign-in failed — please try again.');
    } finally {
      setNativeSigningIn(false);
    }
  }

  function signOut() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(WHOAMI_KEY);
    setIdToken(null);
    setWhoami(null);
    nativeGoogleSignOut();
  }

  if (checking) {
    return <div className="ap-gate"><p>Checking access…</p></div>;
  }

  if (!idToken || !whoami) {
    return (
      <div className="ap-gate">
        <div className="ap-gate-card">
          <img src="/logo.png" alt="" className="ap-gate-logo" />
          <h1>Admin Portal</h1>
          <p>Sign in with a Google account that's been granted admin access.</p>
          {isNativeApp() ? (
            <button className="ap-native-gsi-btn" onClick={handleNativeSignIn} disabled={nativeSigningIn}>
              {nativeSigningIn ? 'Signing in…' : 'Sign in with Google'}
            </button>
          ) : (
            <>
              <div ref={buttonRef} className="ap-gsi-btn" />
              {!GOOGLE_CLIENT_ID && <p className="ap-warn">Sign-in isn't configured on this deployment yet — no Google Client ID set.</p>}
              {GOOGLE_CLIENT_ID && !gsiReady && <p className="ap-warn">Loading Google Sign-In…</p>}
            </>
          )}
          {authError && <p className="ap-warn ap-warn-error">{authError}</p>}
          {import.meta.env.DEV && (
            <button type="button" className="ap-dev-login" onClick={() => handleCredential({ credential: DEV_TEST_ADMIN_TOKEN })}>
              🧪 Sign in as testadmin@test.com (local only)
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!whoami.isStaff) {
    return (
      <div className="ap-gate">
        <div className="ap-gate-card">
          <Icon name="warning" size={28} className="ap-gate-icon" />
          <h1>Access Denied</h1>
          <p>{whoami.email} isn't set up as an admin. If this should be a staff account, ask an existing admin to add you.</p>
          <button className="ap-signout" onClick={signOut}>Sign out</button>
        </div>
      </div>
    );
  }

  return <AdminDashboard idToken={idToken} whoami={whoami} onSignOut={signOut} />;
}

function AdminDashboard({ idToken, whoami, onSignOut }) {
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'grid' | 'clients' | 'quotation' | 'linked'
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [mediaProjectId, setMediaProjectId] = useState(null);
  const [receiptProjectId, setReceiptProjectId] = useState(null);
  const [thankYouProjectId, setThankYouProjectId] = useState(null);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('Inquiry');
  const [showInactive, setShowInactive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [c, p, u] = await Promise.all([
        api('/api/clients', idToken),
        api('/api/projects', idToken),
        api('/api/users', idToken),
      ]);
      setClients(c);
      setProjects(p);
      setUsers(u);
    } catch (e) {
      setError('Could not load data — ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [idToken]);

  useEffect(() => { load(); }, [load]);

  async function saveClient(client) {
    const isNew = !client.id;
    const saved = isNew
      ? await api('/api/clients', idToken, { method: 'POST', body: JSON.stringify(client) })
      : await api(`/api/clients/${client.id}`, idToken, { method: 'PUT', body: JSON.stringify(client) });
    setClients(cs => isNew ? [saved, ...cs] : cs.map(c => c.id === saved.id ? saved : c));
    setEditingClient(null);
  }

  async function deleteClient(id) {
    if (!confirm('Delete this client and keep their projects orphaned? This cannot be undone.')) return;
    await api(`/api/clients/${id}`, idToken, { method: 'DELETE' });
    setClients(cs => cs.filter(c => c.id !== id));
  }

  async function saveProject(project) {
    const isNew = !project.id;
    const payload = { ...project, clientId: project.clientId || selectedClientId };
    const saved = isNew
      ? await api('/api/projects', idToken, { method: 'POST', body: JSON.stringify(payload) })
      : await api(`/api/projects/${project.id}`, idToken, { method: 'PUT', body: JSON.stringify(payload) });
    setProjects(ps => isNew ? [saved, ...ps] : ps.map(p => p.id === saved.id ? saved : p));
    setEditingProject(null);
  }

  async function generateLinkCode(projectId) {
    const saved = await api(`/api/projects/${projectId}/generate-link-code`, idToken, { method: 'POST' });
    setProjects(ps => ps.map(p => p.id === saved.id ? saved : p));
  }

  async function deleteProject(id) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await api(`/api/projects/${id}`, idToken, { method: 'DELETE' });
    setProjects(ps => ps.filter(p => p.id !== id));
  }

  // Appends a payment to tokenHistory and recalculates received/pending —
  // the flat number fields in ProjectForm only support overwriting a total,
  // this is the "customer paid ₹X today" flow the Staff Portal has.
  async function addPayment(projectId, date, amount) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const newHistory = [...(project.tokenHistory || []), { date, amount }];
    const newReceived = (project.tokenReceived || 0) + amount;
    const newPending = project.amount > 0 ? Math.max(0, project.amount - newReceived) : Math.max(0, (project.pendingAmount || 0) - amount);
    const payload = { ...project, tokenHistory: newHistory, tokenReceived: newReceived, pendingAmount: newPending };
    const saved = await api(`/api/projects/${projectId}`, idToken, { method: 'PUT', body: JSON.stringify(payload) });
    setProjects(ps => ps.map(p => p.id === saved.id ? saved : p));
  }

  // Quick WhatsApp status update — client-side only, no backend involved.
  // Lighter-weight than the Staff Portal's job-link share, since Admin Portal
  // doesn't have a customer-facing job page yet (separate, bigger piece of work).
  function shareProjectUpdate(project, client) {
    const name = client?.contactName ? `Mr. ${client.contactName}` : 'Customer';
    const lines = [
      `🎨 *The Painter Boys*`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `Dear ${name},`,
      ``,
      `Thank you for choosing *The Painter Boys*! 🙏`,
      ``,
      client?.society ? `🏘️ *Society:* ${client.society}` : '',
      `📊 *Status:* ${project.progress}`,
      project.paintType ? `🎨 *Paint Type:* ${project.paintType}` : '',
      ``,
      `For any queries, feel free to reach us:`,
      `📞 *Corporate:* +91 7838888509`,
      `🌐 www.thepainterboys.com`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `_The Painter Boys — Trusted Since 2010_`,
    ].filter(Boolean).join('\n');
    const digits = (client?.phone || '').replace(/\D/g, '');
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(lines)}`, '_blank', 'noopener');
  }

  async function linkUser(clientId, userId) {
    const saved = await api(`/api/clients/${clientId}/link-user`, idToken, { method: 'POST', body: JSON.stringify({ userId }) });
    setClients(cs => cs.map(c => c.id === saved.id ? saved : c));
    setUsers(us => us.map(u => {
      if (u.id === userId) return { ...u, linkedClientId: clientId };
      if (u.linkedClientId === clientId) return { ...u, linkedClientId: null };
      return u;
    }));
  }

  async function unlinkUser(clientId) {
    const saved = await api(`/api/clients/${clientId}/unlink-user`, idToken, { method: 'POST' });
    setClients(cs => cs.map(c => c.id === saved.id ? saved : c));
    setUsers(us => us.map(u => u.linkedClientId === clientId ? { ...u, linkedClientId: null } : u));
  }

  async function generateInvite(clientId) {
    const saved = await api(`/api/clients/${clientId}/generate-invite`, idToken, { method: 'POST' });
    setClients(cs => cs.map(c => c.id === saved.id ? saved : c));
    return saved.inviteToken;
  }

  function updateProjectInState(saved) {
    setProjects(ps => ps.map(p => p.id === saved.id ? saved : p));
  }
  async function uploadProjectImage(projectId, file, caption) {
    const form = new FormData();
    form.append('file', file);
    form.append('caption', caption || '');
    const saved = await api(`/api/projects/${projectId}/images`, idToken, { method: 'POST', body: form });
    updateProjectInState(saved);
  }
  async function deleteProjectImage(projectId, url) {
    const saved = await api(`/api/projects/${projectId}/images`, idToken, { method: 'DELETE', body: JSON.stringify({ url }) });
    updateProjectInState(saved);
  }
  async function shareProject(projectId, userId) {
    const saved = await api(`/api/projects/${projectId}/share`, idToken, { method: 'POST', body: JSON.stringify({ userId }) });
    updateProjectInState(saved);
  }
  async function toggleProjectShare(projectId, userId) {
    const saved = await api(`/api/projects/${projectId}/share/${userId}/toggle`, idToken, { method: 'POST' });
    updateProjectInState(saved);
  }
  async function unshareProject(projectId, userId) {
    const saved = await api(`/api/projects/${projectId}/share/${userId}`, idToken, { method: 'DELETE' });
    updateProjectInState(saved);
  }

  // Opens the customer dashboard, signed in as that user, in a new tab —
  // lets an admin see exactly what a customer sees (and link/edit on their
  // behalf) without knowing or resetting their Google account.
  async function impersonateUser(userId) {
    const { token } = await api(`/api/users/${userId}/impersonate`, idToken, { method: 'POST' });
    window.open(`/my-projects?impersonate=${encodeURIComponent(token)}`, '_blank', 'noopener');
  }

  async function resolveRequest(userId) {
    const saved = await api(`/api/users/${userId}/resolve-request`, idToken, { method: 'POST' });
    setUsers(us => us.map(u => u.id === saved.id ? saved : u));
  }

  const clientProjects = selectedClientId ? projects.filter(p => p.clientId === selectedClientId) : [];
  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Cards are project-centric (status lives on the project, not the client),
  // each paired with its client for name/phone/society display and search.
  const projectCards = projects.map(p => ({ ...p, client: clients.find(c => c.id === p.clientId) }));
  const filteredProjectCards = projectCards.filter(pc => {
    if (!showInactive && pc.isActive === false) return false;
    const q = search.toLowerCase();
    const matchesSearch = !q || (pc.client?.contactName || '').toLowerCase().includes(q)
      || (pc.client?.phone || '').includes(q) || (pc.client?.society || '').toLowerCase().includes(q);
    const matchesFilter = projectFilter === 'All' || pc.progress === projectFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    clients: clients.length,
    inProgress: projects.filter(p => p.progress === 'In Progress').length,
    inquiries: projects.filter(p => p.progress === 'Inquiry').length,
    pendingTotal: projects.reduce((s, p) => s + (p.pendingAmount || 0), 0),
  };
  const statusCounts = PROGRESS_OPTIONS.reduce((acc, opt) => {
    acc[opt] = projects.filter(p => p.progress === opt).length;
    return acc;
  }, {});
  const pendingLinkCount = projects.reduce((n, p) => n + (p.sharedWith || []).filter(s => !s.visible).length, 0);
  const projectRequestCount = users.filter(u => u.projectRequestPending).length;

  function goto(v) { setSelectedClientId(null); setView(v); }

  return (
    <div className="ap-root">
      <header className="ap-header">
        <div className="ap-header-brand">
          <img src="/logo.png" alt="" className="ap-header-logo" />
          <span>Admin Portal</span>
        </div>
        <div className="ap-header-user">
          <span>{whoami.name}</span>
          <button className="ap-signout-icon" onClick={onSignOut} title="Sign out" aria-label="Sign out">!</button>
        </div>
      </header>

      <div className="ap-body">
        <nav className="ap-sidebar">
          <button className={`ap-sidebar-btn ${view === 'dashboard' && !selectedClientId ? 'active' : ''}`} onClick={() => goto('dashboard')}>📊 Dashboard</button>
          <button className={`ap-sidebar-btn ${view === 'grid' && !selectedClientId ? 'active' : ''}`} onClick={() => goto('grid')}>🗂️ Grid View</button>
          <button className={`ap-sidebar-btn ${view === 'clients' && !selectedClientId ? 'active' : ''}`} onClick={() => goto('clients')}>📋 All Clients</button>
          <button className="ap-sidebar-btn ap-sidebar-btn-accent" onClick={() => { goto('grid'); setEditingClient(EMPTY_CLIENT); }}>➕ Create Client</button>
          <button className={`ap-sidebar-btn ${view === 'quotation' ? 'active' : ''}`} onClick={() => goto('quotation')}>🧾 Quotation</button>
          <button className={`ap-sidebar-btn ${view === 'linked' && !selectedClientId ? 'active' : ''}`} onClick={() => goto('linked')}>🔗 Linked Accounts</button>
          <button className={`ap-sidebar-btn ${view === 'pending-links' && !selectedClientId ? 'active' : ''}`} onClick={() => goto('pending-links')}>
            ⏳ Pending Links{pendingLinkCount > 0 ? ` (${pendingLinkCount})` : ''}
          </button>
          <button className={`ap-sidebar-btn ${view === 'requests' && !selectedClientId ? 'active' : ''}`} onClick={() => goto('requests')}>
            📨 Requests{projectRequestCount > 0 ? ` (${projectRequestCount})` : ''}
          </button>
          <button className={`ap-sidebar-btn ${view === 'users' && !selectedClientId ? 'active' : ''}`} onClick={() => goto('users')}>👥 Users</button>
        </nav>

      <main className="ap-main">
        {error && <div className="ap-error">{error}</div>}

        {selectedClientId ? (
          <>
            <button className="ap-back" onClick={() => setSelectedClientId(null)}>← Back</button>
            <div className="ap-client-detail">
              <div>
                <h2>{selectedClient?.contactName}</h2>
                <p>{selectedClient?.phone} · {selectedClient?.address} {selectedClient?.society && `(${selectedClient.society})`}</p>
              </div>
              <div className="ap-client-detail-actions">
                <button onClick={() => setEditingClient(selectedClient)}>Edit Client</button>
                <button className="ap-btn-primary" onClick={() => setEditingProject({ ...EMPTY_PROJECT, clientId: selectedClientId })}>+ New Project</button>
              </div>
            </div>
            <LinkedAccountBox client={selectedClient} users={users} onLink={linkUser} onUnlink={unlinkUser} onGenerateInvite={generateInvite} />
            <table className="ap-table">
              <thead>
                <tr><th>Name</th><th>Progress</th><th>Paint Type</th><th>Amount</th><th>Pending</th><th>Painters</th><th>Link Code</th><th></th></tr>
              </thead>
              <tbody>
                {clientProjects.map(p => (
                  <tr key={p.id}>
                    <td data-label="Name">{p.name || '—'}</td>
                    <td data-label="Progress"><span className={`ap-progress-chip ap-progress-${p.progress.toLowerCase().replace(/\s+/g, '-')}`}>{p.progress}</span></td>
                    <td data-label="Paint Type">{p.paintType || '—'}</td>
                    <td data-label="Amount">₹{p.amount?.toLocaleString()}</td>
                    <td data-label="Pending">₹{p.pendingAmount?.toLocaleString()}</td>
                    <td data-label="Painters">{(p.painterNames || []).join(', ') || '—'}</td>
                    <td data-label="Link Code">
                      {p.linkCode ? (
                        <a
                          href={`https://wa.me/${(selectedClient?.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`🎨 *The Painter Boys*\n\nUse this code on your dashboard (thepainterboys.com) to link your project:\n\n*${p.linkCode}*`)}`}
                          target="_blank" rel="noopener noreferrer" className="ap-link-code" title="Share this code via WhatsApp"
                        >{p.linkCode}</a>
                      ) : (
                        <button onClick={() => generateLinkCode(p.id)}>Generate</button>
                      )}
                    </td>
                    <td className="ap-row-actions" data-label="Actions">
                      <button onClick={() => setEditingProject(p)}>Edit</button>
                      <button onClick={() => setMediaProjectId(p.id)}>Photos & Sharing</button>
                      <button onClick={() => setReceiptProjectId(p.id)}>Payment Receipt</button>
                      <button onClick={() => shareProjectUpdate(p, selectedClient)}>Share Update</button>
                      {p.progress === 'Inquiry' && (
                        <button onClick={() => setThankYouProjectId(p.id)}>💌 Thank You Card</button>
                      )}
                      {p.isActive === false ? (
                        <button onClick={() => saveProject({ ...p, isActive: true })}>Activate</button>
                      ) : (
                        <button className="ap-danger" onClick={() => saveProject({ ...p, isActive: false })}>Deactivate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : view === 'quotation' ? (
          <QuotationTool />
        ) : view === 'dashboard' ? (
          <DashboardOverview stats={stats} statusCounts={statusCounts} projects={projects} clients={clients} onSelectClient={setSelectedClientId}
            onFilterStatus={(status) => { setProjectFilter(status); goto('grid'); }} />
        ) : view === 'linked' ? (
          <LinkedAccountsView clients={clients} users={users} onUnlink={unlinkUser} onSelectClient={setSelectedClientId} />
        ) : view === 'pending-links' ? (
          <PendingLinksView projects={projects} clients={clients} users={users}
            onApprove={toggleProjectShare} onReject={unshareProject} onSelectClient={setSelectedClientId} />
        ) : view === 'requests' ? (
          <ProjectRequestsView users={users} clients={clients} onResolve={resolveRequest} onSelectClient={setSelectedClientId} />
        ) : view === 'users' ? (
          <UsersView users={users} clients={clients} onImpersonate={impersonateUser} onSelectClient={setSelectedClientId} />
        ) : view === 'clients' ? (
          <>
            <div className="ap-toolbar">
              <input className="ap-search" placeholder="Search by name, phone, society…" value={search} onChange={e => setSearch(e.target.value)} />
              <button className="ap-btn-primary" onClick={() => setEditingClient(EMPTY_CLIENT)}>+ New Client</button>
            </div>
            {loading ? <p className="ap-loading">Loading…</p> : (
              <table className="ap-table">
                <thead>
                  <tr><th>Name</th><th>Phone</th><th>Society</th><th>Projects</th></tr>
                </thead>
                <tbody>
                  {clients.filter(c => {
                    const q = search.toLowerCase();
                    return !q || c.contactName.toLowerCase().includes(q) || c.phone.includes(q) || c.society.toLowerCase().includes(q);
                  }).map(c => (
                    <tr key={c.id}>
                      <td className="ap-link" data-label="Name" onClick={() => setSelectedClientId(c.id)}>{c.contactName || '—'}</td>
                      <td data-label="Phone">{c.phone}</td>
                      <td data-label="Society">{c.society || '—'}</td>
                      <td data-label="Projects">{projects.filter(p => p.clientId === c.id).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : (
          <>
            {!loading && (
              <div className="ap-stats-bar">
                <span className="ap-stat">👤 {stats.clients} Clients</span>
                <span className="ap-stat ap-stat-amber">💰 ₹{stats.pendingTotal.toLocaleString('en-IN')} Pending</span>
              </div>
            )}
            <div className="ap-toolbar">
              <input className="ap-search" placeholder="Search by name, phone, society…" value={search} onChange={e => setSearch(e.target.value)} />
              <button className={`ap-filter-chip ${showInactive ? 'active' : ''}`} onClick={() => setShowInactive(s => !s)}>
                {showInactive ? '👁 Showing Inactive' : '⚡ Active Only'}
              </button>
              <button className="ap-btn-primary" onClick={() => setEditingClient(EMPTY_CLIENT)}>+ New Client</button>
            </div>
            <div className="ap-filter-row">
              <button className={`ap-filter-chip ${projectFilter === 'All' ? 'active' : ''}`} onClick={() => setProjectFilter('All')}>
                All <span className="ap-filter-count">{projects.length}</span>
              </button>
              {PROGRESS_OPTIONS.map(opt => (
                <button key={opt} className={`ap-filter-chip ap-filter-${opt.toLowerCase().replace(/\s+/g, '-')} ${projectFilter === opt ? 'active' : ''}`} onClick={() => setProjectFilter(opt)}>
                  {opt} <span className="ap-filter-count">{statusCounts[opt] || 0}</span>
                </button>
              ))}
            </div>
            {loading ? <p className="ap-loading">Loading…</p> : filteredProjectCards.length === 0 ? (
              <p className="ap-loading">No {projectFilter === 'All' ? '' : projectFilter.toLowerCase()} records match.</p>
            ) : (
              <div className="ap-cards-grid">
                {filteredProjectCards.map(pc => (
                  <ProjectCard key={pc.id} project={pc} client={pc.client}
                    onOpen={() => setSelectedClientId(pc.clientId)}
                    onShare={() => shareProjectUpdate(pc, pc.client)}
                    onViewReceipt={() => setReceiptProjectId(pc.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
      </div>

      {editingClient && (
        <ClientForm
          client={editingClient}
          onCancel={() => setEditingClient(null)}
          onSave={saveClient}
          societies={[...new Set([...DEFAULT_SOCIETIES, ...clients.map(c => c.society).filter(Boolean)])].sort()}
        />
      )}
      {editingProject && (
        <ProjectForm
          project={editingProject}
          onCancel={() => setEditingProject(null)}
          onSave={saveProject}
          knownPainters={[...new Set(projects.flatMap(p => p.painterNames || []))].sort()}
        />
      )}
      {mediaProjectId && (
        <ProjectMediaModal
          project={projects.find(p => p.id === mediaProjectId)}
          users={users}
          onClose={() => setMediaProjectId(null)}
          onUpload={uploadProjectImage}
          onDeleteImage={deleteProjectImage}
          onShare={shareProject}
          onToggleShare={toggleProjectShare}
          onUnshare={unshareProject}
        />
      )}
      {receiptProjectId && (
        <PaymentReceiptModal
          project={projects.find(p => p.id === receiptProjectId)}
          client={clients.find(c => c.id === projects.find(p => p.id === receiptProjectId)?.clientId)}
          onClose={() => setReceiptProjectId(null)}
          onAddPayment={addPayment}
        />
      )}
      {thankYouProjectId && (
        <ThankYouCardModal
          client={clients.find(c => c.id === projects.find(p => p.id === thankYouProjectId)?.clientId)}
          onClose={() => setThankYouProjectId(null)}
        />
      )}
    </div>
  );
}

// Overview landing page — big-picture status counts plus a quick-glance list
// of the newest inquiries, so triage doesn't require opening Grid View first.
function DashboardOverview({ stats, statusCounts, projects, clients, onSelectClient, onFilterStatus }) {
  const recentInquiries = projects.filter(p => p.progress === 'Inquiry').slice(0, 5);
  const tiles = [
    { label: 'Total Clients', value: stats.clients, cls: '' },
    { label: 'Inquiry', value: statusCounts['Inquiry'] || 0, cls: 'ap-tile-purple', status: 'Inquiry' },
    { label: 'Pending Visit', value: statusCounts['Pending Visit'] || 0, cls: 'ap-tile-purple', status: 'Pending Visit' },
    { label: 'Not Started', value: statusCounts['Not Started'] || 0, cls: 'ap-tile-amber', status: 'Not Started' },
    { label: 'In Progress', value: statusCounts['In Progress'] || 0, cls: 'ap-tile-green', status: 'In Progress' },
    { label: 'Completed', value: statusCounts['Completed'] || 0, cls: 'ap-tile-blue', status: 'Completed' },
    { label: 'Cancelled', value: statusCounts['Cancelled'] || 0, cls: 'ap-tile-red', status: 'Cancelled' },
    { label: 'Total Pending ₹', value: `₹${stats.pendingTotal.toLocaleString('en-IN')}`, cls: 'ap-tile-amber' },
  ];
  return (
    <div className="ap-dashboard">
      <div className="ap-tiles-grid">
        {tiles.map(t => (
          <div key={t.label} className={`ap-tile ${t.cls} ${t.status ? 'ap-tile-clickable' : ''}`}
            onClick={t.status ? () => onFilterStatus(t.status) : undefined}
            title={t.status ? `See all ${t.status} projects` : undefined}>
            <div className="ap-tile-value">{t.value}</div>
            <div className="ap-tile-label">{t.label}</div>
          </div>
        ))}
      </div>
      <h3 className="ap-dashboard-subhead">Newest Inquiries</h3>
      {recentInquiries.length === 0 ? <p className="ap-loading">No open inquiries right now.</p> : (
        <div className="ap-cards-grid">
          {recentInquiries.map(p => {
            const client = clients.find(c => c.id === p.clientId);
            return (
              <div key={p.id} className="ap-card ap-card-inquiry" onClick={() => onSelectClient(p.clientId)}>
                <div className="ap-card-top">
                  <div className="ap-card-name">{client?.contactName || '—'}</div>
                  <span className="ap-progress-chip ap-progress-inquiry">Inquiry</span>
                </div>
                {client?.phone && <div className="ap-card-row">📞 <span>{client.phone}</span></div>}
                {client?.society && <div className="ap-card-row">🏘️ <span>{client.society}</span></div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Every client with a linked customer Google account, in one place — the
// per-client LinkedAccountBox only shows one client at a time, this is the
// "see everything at once" version for auditing who has portal access.
function LinkedAccountsView({ clients, users, onUnlink, onSelectClient }) {
  const linked = clients.filter(c => c.linkedUserId).map(c => ({
    client: c, user: users.find(u => u.id === c.linkedUserId),
  }));
  if (linked.length === 0) return <p className="ap-loading">No clients have a linked account yet.</p>;
  return (
    <table className="ap-table">
      <thead>
        <tr><th>Client</th><th>Phone</th><th>Linked Account</th><th></th></tr>
      </thead>
      <tbody>
        {linked.map(({ client, user }) => (
          <tr key={client.id}>
            <td className="ap-link" data-label="Client" onClick={() => onSelectClient(client.id)}>{client.contactName || '—'}</td>
            <td data-label="Phone">{client.phone}</td>
            <td data-label="Linked Account">{user ? `${user.name} (${user.email})` : '—'}</td>
            <td className="ap-row-actions" data-label="Actions">
              <button className="ap-danger" onClick={() => onUnlink(client.id)}>Unlink</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Every project with at least one hidden (pending) share — i.e. a customer
// submitted a project's link code from their dashboard and is waiting on an
// admin to approve it. Approve/Reject just reuse the same show/hide-share and
// unshare endpoints admins already use for manual sharing.
function PendingLinksView({ projects, clients, users, onApprove, onReject, onSelectClient }) {
  const rows = projects.flatMap(p => (p.sharedWith || [])
    .filter(s => !s.visible)
    .map(s => ({ project: p, share: s, client: clients.find(c => c.id === p.clientId), user: users.find(u => u.id === s.userId) })));

  if (rows.length === 0) return <p className="ap-loading">No pending link requests right now.</p>;
  return (
    <table className="ap-table">
      <thead>
        <tr><th>Requested By</th><th>Project</th><th>Client</th><th></th></tr>
      </thead>
      <tbody>
        {rows.map(({ project, share, client, user }) => (
          <tr key={`${project.id}-${share.userId}`}>
            <td data-label="Requested By">{user ? `${user.name} (${user.email})` : share.userId}</td>
            <td className="ap-link" data-label="Project" onClick={() => onSelectClient(project.clientId)}>{project.name || project.paintType || 'Project'}</td>
            <td data-label="Client">{client?.contactName || '—'}</td>
            <td className="ap-row-actions" data-label="Actions">
              <button className="ap-btn-primary" onClick={() => onApprove(project.id, share.userId)}>Approve</button>
              <button className="ap-danger" onClick={() => onReject(project.id, share.userId)}>Reject</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Customers who clicked "Ask Admin to Add My Project" on the dashboard
// without a link code — no project is known yet, so this is a triage list:
// find/create the right project via the client's own detail page (or
// Photos & Sharing on any project) and share it, then mark resolved.
function ProjectRequestsView({ users, clients, onResolve, onSelectClient }) {
  const [busyId, setBusyId] = useState(null);
  const requests = users.filter(u => u.projectRequestPending);

  async function handleResolve(userId) {
    setBusyId(userId);
    try {
      await onResolve(userId);
    } catch (e) {
      alert('Could not mark resolved — ' + e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (requests.length === 0) return <p className="ap-loading">No open project requests.</p>;
  return (
    <table className="ap-table">
      <thead>
        <tr><th>Name</th><th>Email</th><th>Linked Client</th><th>Requested</th><th></th></tr>
      </thead>
      <tbody>
        {requests.map(u => {
          const client = clients.find(c => c.id === u.linkedClientId);
          return (
            <tr key={u.id}>
              <td data-label="Name">{u.name || '—'}</td>
              <td data-label="Email">{u.email}</td>
              <td data-label="Linked Client">
                {client
                  ? <span className="ap-link" onClick={() => onSelectClient(client.id)}>{client.contactName || '—'}</span>
                  : <span className="ap-warn">Not linked yet</span>}
              </td>
              <td data-label="Requested">{u.projectRequestedAt ? new Date(u.projectRequestedAt).toLocaleDateString('en-IN') : '—'}</td>
              <td className="ap-row-actions" data-label="Actions">
                <button className="ap-btn-primary" disabled={busyId === u.id} onClick={() => handleResolve(u.id)}>
                  {busyId === u.id ? 'Saving…' : 'Mark Resolved'}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Every account that's ever signed in to the customer dashboard, with its
// linked client (if any) and a one-click "Log in as" that opens the
// dashboard in a new tab under that user's own identity — see
// impersonateUser above for how the short-lived token is issued.
function UsersView({ users, clients, onImpersonate, onSelectClient }) {
  const [busyId, setBusyId] = useState(null);

  async function handleImpersonate(userId) {
    setBusyId(userId);
    try {
      await onImpersonate(userId);
    } catch (e) {
      alert('Could not start impersonation — ' + e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (users.length === 0) return <p className="ap-loading">No users have signed in yet.</p>;
  return (
    <table className="ap-table">
      <thead>
        <tr><th>Name</th><th>Email</th><th>Role</th><th>Linked Client</th><th></th></tr>
      </thead>
      <tbody>
        {users.map(u => {
          const client = clients.find(c => c.id === u.linkedClientId);
          return (
            <tr key={u.id}>
              <td data-label="Name">{u.name || '—'}</td>
              <td data-label="Email">{u.email}</td>
              <td data-label="Role">{u.role === 'Client' || !u.role ? 'Customer' : u.role}</td>
              <td data-label="Linked Client">
                {client
                  ? <span className="ap-link" onClick={() => onSelectClient(client.id)}>{client.contactName || '—'}</span>
                  : '—'}
              </td>
              <td className="ap-row-actions" data-label="Actions">
                <button className="ap-btn-primary" disabled={busyId === u.id} onClick={() => handleImpersonate(u.id)}>
                  {busyId === u.id ? 'Opening…' : '👁️ Log in as'}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Project-status card — same "Name / Mobile / Status / Date / Amount / Share"
// shape as the Staff Portal's RecordCard, adapted to the Cosmos client+project
// data model (status lives on the project, contact details on its client).
function ProjectCard({ project, client, onOpen, onShare, onViewReceipt }) {
  const startDate = project.dateStarted || project.dateContacted || '';
  return (
    <div className={`ap-card ap-card-${(project.progress || '').toLowerCase().replace(/\s+/g, '-')} ${project.isActive === false ? 'ap-card-inactive' : ''}`} onClick={onOpen}>
      <div className="ap-card-top">
        <div className="ap-card-name">{client?.contactName || '—'}</div>
        <div className="ap-card-top-right">
          {project.isActive === false && <span className="ap-progress-chip ap-progress-inactive">Inactive</span>}
          <span className={`ap-progress-chip ap-progress-${(project.progress || '').toLowerCase().replace(/\s+/g, '-')}`}>{project.progress}</span>
          <button className="ap-card-wa-btn" onClick={e => { e.stopPropagation(); onShare(); }} title="Share status on WhatsApp">💬</button>
        </div>
      </div>
      {client?.phone && <div className="ap-card-row">📞 <span>{client.phone}</span></div>}
      {client?.society && <div className="ap-card-row">🏘️ <span>{client.society}</span></div>}
      {client?.address && <div className="ap-card-row ap-card-addr">📍 <span>{client.address}</span></div>}
      {project.paintType && <div className="ap-card-row">🎨 <span>{project.paintType}</span></div>}
      {startDate && <div className="ap-card-row">📅 <span>{new Date(startDate).toLocaleDateString('en-IN')}</span></div>}
      {project.amount > 0 && <div className="ap-card-row">💰 <span>Amount: ₹{project.amount.toLocaleString('en-IN')}</span></div>}
      {project.pendingAmount > 0 && <div className="ap-card-row">⏳ <span>Pending: ₹{project.pendingAmount.toLocaleString('en-IN')}</span></div>}
      {(project.painterNames || []).length > 0 && <div className="ap-card-row">👷 <span>{project.painterNames.join(', ')}</span></div>}
      {project.remarks && <div className="ap-card-remarks">{project.remarks}</div>}
      {project.tokenReceived > 0 && (
        <button className="ap-card-receipt-btn" onClick={e => { e.stopPropagation(); onViewReceipt(); }}>
          🧾 View Receipt · ₹{project.tokenReceived.toLocaleString('en-IN')}
        </button>
      )}
    </div>
  );
}

function ClientForm({ client, onCancel, onSave, societies = [] }) {
  const [form, setForm] = useState(client);
  return (
    <div className="ap-modal-overlay" onClick={onCancel}>
      <div className="ap-modal" onClick={e => e.stopPropagation()}>
        <h3>{form.id ? 'Edit Client' : 'New Client'}</h3>
        {['contactName', 'phone', 'email', 'address', 'society'].map(field => (
          <label key={field} className="ap-field">
            <span>{field}</span>
            <input
              value={form[field] || ''}
              list={field === 'society' ? 'ap-society-options' : undefined}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            />
          </label>
        ))}
        <datalist id="ap-society-options">
          {societies.map(s => <option key={s} value={s} />)}
        </datalist>
        <div className="ap-modal-actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="ap-btn-primary" onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  );
}

function ProjectForm({ project, onCancel, onSave, knownPainters = [] }) {
  const [form, setForm] = useState({ ...project });
  const [newPainter, setNewPainter] = useState('');
  function field(key, value) { setForm(f => ({ ...f, [key]: value })); }
  function submit() { onSave(form); }
  const painterOptions = [...new Set([...DEFAULT_PAINTERS, ...knownPainters])].sort();
  const selectedPainters = form.painterNames || [];
  function togglePainter(name) {
    field('painterNames', selectedPainters.includes(name)
      ? selectedPainters.filter(p => p !== name)
      : [...selectedPainters, name]);
  }
  function addNewPainter() {
    const name = newPainter.trim();
    if (!name || selectedPainters.includes(name)) return;
    field('painterNames', [...selectedPainters, name]);
    setNewPainter('');
  }
  return (
    <div className="ap-modal-overlay" onClick={onCancel}>
      <div className="ap-modal ap-modal-wide" onClick={e => e.stopPropagation()}>
        <h3>{form.id ? 'Edit Project' : 'New Project'}</h3>
        <div className="ap-form-grid">
          <label className="ap-field"><span>Name</span><input value={form.name} onChange={e => field('name', e.target.value)} placeholder="e.g. 3BHK Interior Repaint" /></label>
          <label className="ap-field">
            <span>Progress</span>
            <select value={form.progress} onChange={e => field('progress', e.target.value)}>
              {PROGRESS_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label className="ap-field"><span>Paint Type</span><input value={form.paintType} onChange={e => field('paintType', e.target.value)} /></label>
          <label className="ap-field"><span>Date Contacted</span><input type="date" value={form.dateContacted} onChange={e => field('dateContacted', e.target.value)} /></label>
          <label className="ap-field"><span>Date Started</span><input type="date" value={form.dateStarted} onChange={e => field('dateStarted', e.target.value)} /></label>
          <label className="ap-field"><span>Date Completed</span><input type="date" value={form.dateCompleted} onChange={e => field('dateCompleted', e.target.value)} /></label>
          <label className="ap-field"><span>Amount (₹)</span><input type="number" value={form.amount} onChange={e => field('amount', Number(e.target.value))} /></label>
          <label className="ap-field"><span>Token Received (₹)</span><input type="number" value={form.tokenReceived} onChange={e => field('tokenReceived', Number(e.target.value))} /></label>
          <label className="ap-field"><span>Pending Amount (₹)</span><input type="number" value={form.pendingAmount} onChange={e => field('pendingAmount', Number(e.target.value))} /></label>
        </div>
        <label className="ap-field"><span>Painters</span></label>
        <div className="ap-painter-chips">
          {painterOptions.map(name => (
            <button
              key={name}
              type="button"
              className={`ap-painter-chip${selectedPainters.includes(name) ? ' ap-painter-chip-selected' : ''}`}
              onClick={() => togglePainter(name)}
            >
              {selectedPainters.includes(name) ? '✓ ' : ''}{name}
            </button>
          ))}
        </div>
        <div className="ap-quote-item-row">
          <input placeholder="Add a new painter…" value={newPainter} onChange={e => setNewPainter(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNewPainter())} />
          <button type="button" className="ap-add-item-btn" onClick={addNewPainter} disabled={!newPainter.trim()}>+ Add</button>
        </div>
        <label className="ap-field"><span>Remarks</span><textarea rows={2} value={form.remarks} onChange={e => field('remarks', e.target.value)} /></label>
        <div className="ap-modal-actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="ap-btn-primary" onClick={submit}>Save</button>
        </div>
      </div>
    </div>
  );
}

function ProjectMediaModal({ project, users, onClose, onUpload, onDeleteImage, onShare, onToggleShare, onUnshare }) {
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [shareUserId, setShareUserId] = useState('');
  const [busy, setBusy] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const fileRef = useRef(null);
  if (!project) return null;

  const shared = project.sharedWith || [];
  const shareable = users.filter(u => !shared.some(s => s.userId === u.id));

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { await onUpload(project.id, file, caption); setCaption(''); }
    catch (err) { alert('Upload failed: ' + err.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }
  async function handleShare() {
    if (!shareUserId) return;
    setBusy(true);
    try { await onShare(project.id, shareUserId); setShareUserId(''); }
    finally { setBusy(false); }
  }

  return (
    <div className="ap-modal-overlay" onClick={onClose}>
      <div className="ap-modal ap-modal-wide" onClick={e => e.stopPropagation()}>
        <h3>Photos & Sharing — {project.paintType || 'Project'}</h3>

        <div className="ap-media-section">
          <h4>Work-in-Progress Photos</h4>
          <div className="ap-media-grid">
            {[...(project.images || [])].reverse().map(img => (
              <div key={img.url} className="ap-media-item">
                <img src={img.url} alt={img.caption || ''} onClick={() => setLightboxUrl(img.url)} style={{ cursor: 'pointer' }} />
                {img.caption && <p className="ap-media-caption">{img.caption}</p>}
                <button className="ap-media-delete" onClick={() => onDeleteImage(project.id, img.url)}>✕ Remove</button>
              </div>
            ))}
            {(!project.images || project.images.length === 0) && <p className="ap-calc-hint">No photos uploaded yet.</p>}
          </div>
          <div className="ap-quote-item-row">
            <input placeholder="Caption (optional)" value={caption} onChange={e => setCaption(e.target.value)} style={{ flex: 1 }} />
          </div>
          <label className="ap-btn-primary ap-upload-btn">
            {uploading ? '⏳ Uploading…' : '+ Upload Photo'}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={handleFileChange} disabled={uploading} hidden />
          </label>
        </div>

        <div className="ap-media-section">
          <h4>Shared With</h4>
          {shared.length === 0 && <p className="ap-calc-hint">Not shared with any account yet — only visible in the Admin Portal.</p>}
          {shared.map(s => {
            const u = users.find(x => x.id === s.userId);
            return (
              <div key={s.userId} className="ap-card-row" style={{ padding: '6px 0' }}>
                <span>{u ? `${u.name} (${u.email})` : s.userId} {!s.visible && <span className="ap-calc-formula">(hidden)</span>}</span>
                <span className="ap-row-actions">
                  <button onClick={() => onToggleShare(project.id, s.userId)}>{s.visible ? 'Hide' : 'Show'}</button>
                  <button className="ap-danger" onClick={() => onUnshare(project.id, s.userId)}>Unshare</button>
                </span>
              </div>
            );
          })}
          <div className="ap-quote-item-row">
            <select value={shareUserId} onChange={e => setShareUserId(e.target.value)} style={{ flex: 1, padding: '9px 12px', border: '1.5px solid var(--hairline)', borderRadius: 6 }}>
              <option value="">Select a user to share with…</option>
              {shareable.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
            <button className="ap-btn-primary" disabled={!shareUserId || busy} onClick={handleShare}>Share</button>
          </div>
        </div>

        <div className="ap-modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>

      {lightboxUrl && (
        <div className="ap-lightbox-overlay" onClick={e => { e.stopPropagation(); setLightboxUrl(null); }}>
          <img src={lightboxUrl} alt="" />
        </div>
      )}
    </div>
  );
}

// ── Payment receipt (shareable summary of what's been paid vs pending) ──
// Mirrors the Staff Portal's (Sheet-based) receipt feature — same idea, but
// reading from this project's own tokenHistory/tokenReceived/pendingAmount
// fields instead of parsing multiple sheet columns.
function PaymentReceiptModal({ project, client, onClose, onAddPayment }) {
  const cardRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [addingPayment, setAddingPayment] = useState(false);
  if (!project) return null;

  async function handleAddPayment() {
    const amount = Number(newAmount);
    if (!amount || amount <= 0) return;
    setAddingPayment(true);
    try { await onAddPayment(project.id, newDate, amount); setNewAmount(''); }
    finally { setAddingPayment(false); }
  }

  const history = project.tokenHistory || [];
  const totalAmount = project.amount || 0;
  const receivedTotal = project.tokenReceived || 0;
  const pendingTotal = project.pendingAmount || (totalAmount > receivedTotal ? totalAmount - receivedTotal : 0);
  const fullAddress = [client?.society, client?.address].filter(Boolean).join(', ');

  const waText = [
    `🎨 *The Painter Boys*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `💰 *PAYMENT SUMMARY*`,
    ``,
    `👤 *Customer:* ${client?.contactName || '—'}`,
    fullAddress ? `🏘️ *Address:* ${fullAddress}` : '',
    client?.phone ? `📞 *Phone:* ${client.phone}` : '',
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `💰 *PAYMENT HISTORY*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ...(history.length ? history.map(e => `📅 ${e.date}   ₹${(e.amount || 0).toLocaleString('en-IN')}`) : ['No entries yet']),
    ``,
    totalAmount > 0
      ? `📋 *Total Project Amount = ₹${totalAmount.toLocaleString('en-IN')}*\n➖ *Total Received = ₹${receivedTotal.toLocaleString('en-IN')}*\n🟰 *Pending Payment = ₹${pendingTotal.toLocaleString('en-IN')}*`
      : `✅ *Total Received = ₹${receivedTotal.toLocaleString('en-IN')}*` + (pendingTotal > 0 ? `\n⏳ *Pending Payment = ₹${pendingTotal.toLocaleString('en-IN')}*` : ''),
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🌐 www.thepainterboys.com`,
    `📞 Corporate: 7838888509`,
  ].filter(Boolean).join('\n');

  async function shareAsImage() {
    if (!cardRef.current || capturing) return;
    setCapturing(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: '#0d2137', logging: false });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'receipt-thepainterboys.png', { type: 'image/png' });
        const downloadFallback = () => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'receipt-thepainterboys.png'; a.click();
          URL.revokeObjectURL(url);
          // Direct-to-WhatsApp sharing needs the OS share sheet (navigator.share
          // with files), which only real phone browsers support — desktop/this
          // preview just downloads instead, so say so rather than looking broken.
          alert('This browser can\'t hand the image straight to WhatsApp — image downloaded instead. On a phone, this button opens the share sheet with WhatsApp as an option directly.');
        };
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: 'Payment Summary — The Painter Boys' }); }
          catch (err) { if (err?.name !== 'AbortError') downloadFallback(); }
        } else {
          downloadFallback();
        }
        setCapturing(false);
      }, 'image/png');
    } catch { setCapturing(false); }
  }

  function shareOnWhatsApp() {
    const digits = (client?.phone || '').replace(/\D/g, '');
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(waText)}`;
    window.open(url, '_blank', 'noopener');
  }

  return (
    <div className="aq-overlay" onClick={onClose}>
      <div className="aq-wrap" onClick={e => e.stopPropagation()}>
        <div className="aq-card" ref={cardRef}>
          <div className="aq-card-header">
            <div className="aq-card-logo">🎨</div>
            <div className="aq-card-company">The Painter Boys</div>
            <div className="aq-card-tagline">Professional Painting Services</div>
          </div>
          <div className="aq-card-badge">PAYMENT SUMMARY</div>
          <div className="aq-card-section">
            <div className="aq-card-section-title">Customer Details</div>
            <div className="aq-card-row"><span>Name</span><span>{client?.contactName || '—'}</span></div>
            {client?.society && <div className="aq-card-row"><span>Society</span><span>{client.society}</span></div>}
            {client?.address && <div className="aq-card-row"><span>Address</span><span>{client.address}</span></div>}
            {client?.phone && <div className="aq-card-row"><span>Phone</span><span>{client.phone}</span></div>}
          </div>
          <div className="aq-card-section">
            <div className="aq-card-section-title">Payment History</div>
            {history.length === 0 && <p className="ap-calc-hint">No entries yet</p>}
            {history.map((e, i) => (
              <div key={i} className="aq-card-row"><span>📅 {e.date}</span><span>₹{(e.amount || 0).toLocaleString('en-IN')}</span></div>
            ))}
          </div>
          <div className="aq-card-total">
            <span>{totalAmount > 0 ? 'Pending Payment' : 'Total Received'}</span>
            <span>₹{(totalAmount > 0 ? pendingTotal : receivedTotal).toLocaleString('en-IN')}</span>
          </div>
          {totalAmount > 0 && (
            <div className="aq-card-section">
              <div className="aq-card-row"><span>Total Project Amount</span><span>₹{totalAmount.toLocaleString('en-IN')}</span></div>
              <div className="aq-card-row"><span>Total Received</span><span>₹{receivedTotal.toLocaleString('en-IN')}</span></div>
            </div>
          )}
          <div className="aq-card-footer">
            <div>🌐 www.thepainterboys.com</div>
            <div>📞 Corporate: 7838888509</div>
          </div>
        </div>

        <div className="ap-calc-box" style={{ padding: 16 }}>
          <div className="ap-calc-hint" style={{ marginBottom: 8 }}>Add a payment — appends to history and updates totals</div>
          <div className="ap-quote-item-row">
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ padding: '9px 12px', border: '1.5px solid var(--hairline)', borderRadius: 6 }} />
            <input type="number" placeholder="Amount (₹)" value={newAmount} onChange={e => setNewAmount(e.target.value)} style={{ flex: 1, padding: '9px 12px', border: '1.5px solid var(--hairline)', borderRadius: 6 }} />
            <button className="ap-btn-primary" disabled={!newAmount || addingPayment} onClick={handleAddPayment}>
              {addingPayment ? 'Saving…' : 'Add'}
            </button>
          </div>
        </div>

        <div className="aq-actions">
          <button className="aq-share-btn" onClick={shareAsImage} disabled={capturing}>
            {capturing ? '⏳ Preparing…' : '📤 Share Image on WhatsApp'}
          </button>
          {client?.phone && (
            <button className="aq-share-btn aq-share-text" onClick={shareOnWhatsApp}>💬 Send as WhatsApp Text</button>
          )}
          <button className="aq-close-btn" onClick={onClose}>✕ Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Thank You card (new inquiries) ─────────────────────────────────
function ThankYouCardModal({ client, onClose }) {
  const cardRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const name = client?.contactName ? `Mr. ${client.contactName}` : 'Customer';

  const waText = [
    `🎨 *The Painter Boys*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `Dear ${name},`,
    ``,
    `Thank you for reaching out to *The Painter Boys*.`,
    `Our team will contact you shortly.`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🌐 www.thepainterboys.com`,
    `📞 Corporate: 7838888509`,
  ].join('\n');

  async function shareAsImage() {
    if (!cardRef.current || capturing) return;
    setCapturing(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: null, logging: false });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'thankyou-thepainterboys.png', { type: 'image/png' });
        const downloadFallback = () => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = 'thankyou-thepainterboys.png'; a.click();
          URL.revokeObjectURL(url);
          alert('This browser can\'t hand the image straight to WhatsApp — image downloaded instead. On a phone, this button opens the share sheet with WhatsApp as an option directly.');
        };
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: 'The Painter Boys' }); }
          catch (err) { if (err?.name !== 'AbortError') downloadFallback(); }
        } else {
          downloadFallback();
        }
        setCapturing(false);
      }, 'image/png');
    } catch { setCapturing(false); }
  }

  function shareOnWhatsApp() {
    const digits = (client?.phone || '').replace(/\D/g, '');
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(waText)}`, '_blank', 'noopener');
  }

  return (
    <div className="aq-overlay" onClick={onClose}>
      <div className="aq-wrap" onClick={e => e.stopPropagation()}>
        <div className="aq-card ap-ty-card" ref={cardRef}>
          <div className="aq-card-header">
            <div className="aq-card-logo">🎨</div>
            <div className="aq-card-company">The Painter Boys</div>
            <div className="aq-card-tagline">Professional Painting Services</div>
          </div>
          <div className="ap-ty-body">
            <div className="ap-ty-stars">✦ &nbsp; ✦ &nbsp; ✦</div>
            <div className="ap-ty-title">Thank You!</div>
            <div className="ap-ty-dear">Dear {name},</div>
            <p>Thank you for reaching out to<br /><strong>The Painter Boys.</strong></p>
            <p>Our representative will contact<br />you shortly.</p>
            <p>We look forward to transforming<br />your space with our expert<br />painting services.</p>
          </div>
          <div className="aq-card-footer">
            <div>🌐 www.thepainterboys.com</div>
            <div>📞 Corporate: 7838888509</div>
          </div>
        </div>
        <div className="aq-actions">
          <button className="aq-share-btn" onClick={shareAsImage} disabled={capturing}>
            {capturing ? '⏳ Preparing…' : '📤 Share Thank You Card'}
          </button>
          {client?.phone && (
            <button className="aq-share-btn aq-share-text" onClick={shareOnWhatsApp}>💬 Send as WhatsApp Text</button>
          )}
          <button className="aq-close-btn" onClick={onClose}>✕ Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Manual client↔user link (fallback for when auto-link-by-email
// on sign-in didn't happen, e.g. missing/wrong email at intake) ────
function LinkedAccountBox({ client, users, onLink, onUnlink, onGenerateInvite }) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [busy, setBusy] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  if (!client) return null;

  const linkedUser = users.find(u => u.id === client.linkedUserId);
  const candidates = users.filter(u => u.id !== client.linkedUserId);
  const emailMatch = candidates.find(u => client.email && u.email?.toLowerCase() === client.email.toLowerCase());

  async function handleLink() {
    if (!selectedUserId) return;
    setBusy(true);
    try { await onLink(client.id, selectedUserId); setSelectedUserId(''); }
    finally { setBusy(false); }
  }
  async function handleUnlink() {
    if (!confirm('Unlink this account from the client? They will no longer see this client\'s projects if signed in.')) return;
    setBusy(true);
    try { await onUnlink(client.id); }
    finally { setBusy(false); }
  }
  async function handleSendInvite() {
    setSendingInvite(true);
    try {
      const token = await onGenerateInvite(client.id);
      const link = `https://www.thepainterboys.com/my-projects?invite=${token}`;
      const name = client.contactName ? `Mr./Ms. ${client.contactName}` : 'there';
      const lines = [
        `🎨 *The Painter Boys*`,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `Dear ${name},`,
        ``,
        `You can now track your painting project — progress updates, photos, and payments — right from your own dashboard.`,
        ``,
        `👉 Tap the link below and sign in with your Google account. It will connect automatically, no code needed:`,
        link,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        `📞 Corporate: +91 7838888509`,
        `🌐 www.thepainterboys.com`,
        `_The Painter Boys — Trusted Since 2010_`,
      ].join('\n');
      const digits = (client.phone || '').replace(/\D/g, '');
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(lines)}`, '_blank', 'noopener');
    } finally {
      setSendingInvite(false);
    }
  }

  return (
    <div className="ap-calc-box" style={{ marginBottom: 20 }}>
      <h3>Linked Account</h3>
      {linkedUser ? (
        <div className="ap-card-row" style={{ padding: '6px 0' }}>
          <span>{linkedUser.name} <span className="ap-calc-formula">({linkedUser.email})</span></span>
          <button className="ap-danger" disabled={busy} onClick={handleUnlink}>Unlink</button>
        </div>
      ) : (
        <>
          <p className="ap-calc-hint">
            No account linked yet — this happens automatically when someone signs in with an email matching
            {client.email ? ` "${client.email}"` : ' this client\'s email'}, or send them an invite link below.
          </p>
          <button className="ap-btn-primary" disabled={sendingInvite || !client.phone} onClick={handleSendInvite} style={{ marginBottom: 14 }}>
            {sendingInvite ? 'Preparing…' : '💬 Send Invite Link via WhatsApp'}
          </button>
          {!client.phone && <p className="ap-calc-hint">Add a phone number for this client to send an invite.</p>}
          <p className="ap-calc-hint">Or link a signed-in account manually:</p>
          <div className="ap-quote-item-row">
            <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} style={{ flex: 1, padding: '9px 12px', border: '1.5px solid var(--hairline)', borderRadius: 6 }}>
              <option value="">Select a signed-in user…</option>
              {emailMatch && <option value={emailMatch.id}>⭐ {emailMatch.name} ({emailMatch.email}) — email matches</option>}
              {candidates.filter(u => u !== emailMatch).map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email}){u.linkedClientId ? ' — already linked elsewhere' : ''}</option>
              ))}
            </select>
            <button className="ap-btn-primary" disabled={!selectedUserId || busy} onClick={handleLink}>Link</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Area calculator ───────────────────────────────────────────────
// No fixed company formula exists yet, so the multiplier is editable rather
// than hard-coded — this gives a quick estimate to sanity-check a quote
// against, not an exact room-by-room measurement.
function AreaCalculator({ area, onChange, ratePerSqFt }) {
  const builtUp = Number(area.builtUpArea) || 0;
  const estimate = builtUp > 0 ? Math.round(builtUp * area.multiplier) : null;
  function field(key, value) { onChange(a => ({ ...a, [key]: value })); }

  return (
    <div className="ap-calc-box">
      <h3>Painting Area Calculator</h3>
      <p className="ap-calc-hint">Rough estimate only — adjust the multiplier based on what you've seen actually hold true on site.</p>
      <div className="ap-form-grid">
        <label className="ap-field"><span>Built-up Area (sq ft)</span>
          <input type="number" value={area.builtUpArea} onChange={e => field('builtUpArea', e.target.value)} placeholder="e.g. 1550" />
        </label>
        <label className="ap-field"><span>BHK</span>
          <select value={area.bhk} onChange={e => field('bhk', e.target.value)}>
            <option value="">—</option>
            {['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK'].map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label className="ap-field"><span>Multiplier</span>
          <input type="number" step="0.1" value={area.multiplier} onChange={e => field('multiplier', Number(e.target.value) || 0)} />
        </label>
      </div>
      {estimate !== null && (
        <div className="ap-calc-result">
          Estimated Paintable Area: <strong>{estimate.toLocaleString('en-IN')} sq ft</strong>
          <span className="ap-calc-formula"> ({builtUp.toLocaleString('en-IN')} sq ft{area.bhk ? ` · ${area.bhk}` : ''} × {area.multiplier})</span>
          {ratePerSqFt !== null && (
            <div style={{ marginTop: 6 }}>Rate at current total: <strong>₹{ratePerSqFt.toLocaleString('en-IN')}/sq ft</strong></div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Quotation generator ───────────────────────────────────────────
function QuotationTool() {
  const [area, setArea] = useState({ builtUpArea: '', bhk: '', multiplier: DEFAULT_AREA_MULTIPLIER });
  const [form, setForm] = useState(EMPTY_QUOTATION);
  const [showPreview, setShowPreview] = useState(false);
  function field(key, value) { setForm(f => ({ ...f, [key]: value })); }
  function updateItem(i, key, value) { setForm(f => ({ ...f, workItems: f.workItems.map((w, idx) => idx === i ? { ...w, [key]: value } : w) })); }
  function addItem() { setForm(f => ({ ...f, workItems: [...f.workItems, { name: '', price: '' }] })); }
  function removeItem(i) { setForm(f => ({ ...f, workItems: f.workItems.filter((_, idx) => idx !== i) })); }
  const amount = form.workItems.reduce((s, w) => s + (Number(w.price) || 0), 0);
  const canGenerate = form.customerName.trim() && amount > 0;

  const builtUp = Number(area.builtUpArea) || 0;
  const estimatedArea = builtUp > 0 ? Math.round(builtUp * area.multiplier) : null;
  const ratePerSqFt = estimatedArea && amount > 0 ? Math.round(amount / estimatedArea) : null;

  return (
    <div className="ap-quote-tool">
      <AreaCalculator area={area} onChange={setArea} ratePerSqFt={ratePerSqFt} />

      <div className="ap-calc-box">
        <h3>Generate Quotation</h3>
        <div className="ap-form-grid">
          <label className="ap-field"><span>Customer Name</span><input value={form.customerName} onChange={e => field('customerName', e.target.value)} /></label>
          <label className="ap-field"><span>Mobile Number</span><input value={form.mobile} onChange={e => field('mobile', e.target.value)} /></label>
          <label className="ap-field"><span>Society</span><input value={form.society} onChange={e => field('society', e.target.value)} /></label>
          <label className="ap-field"><span>BHK</span><input value={form.bhk} onChange={e => field('bhk', e.target.value)} placeholder="e.g. 3 BHK" /></label>
          <label className="ap-field"><span>Paint Type</span><input value={form.paintType} onChange={e => field('paintType', e.target.value)} placeholder="e.g. Royale Shyne" /></label>
        </div>
        <label className="ap-field"><span>Scope of Work &amp; Pricing</span></label>
        {form.workItems.map((w, i) => (
          <div key={i} className="ap-quote-item-row">
            <input value={w.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="e.g. Putty" />
            <input type="number" className="ap-quote-item-price" value={w.price} onChange={e => updateItem(i, 'price', e.target.value)} placeholder="₹" />
            <button type="button" className="ap-danger" onClick={() => removeItem(i)}>✕</button>
          </div>
        ))}
        <button type="button" className="ap-add-item-btn" onClick={addItem}>+ Add Item</button>
        {amount > 0 && <div className="ap-calc-result">Total Quotation: <strong>₹{amount.toLocaleString('en-IN')}</strong></div>}
        <div className="ap-modal-actions">
          <button className="ap-btn-primary" disabled={!canGenerate} onClick={() => setShowPreview(true)}>Generate Quotation</button>
        </div>
        {!canGenerate && <p className="ap-calc-hint">Customer name and at least one priced item are required.</p>}
      </div>

      {showPreview && (
        <QuotationCard quotation={{ ...form, amount, areaSqFt: estimatedArea, ratePerSqFt }} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

function QuotationCard({ quotation, onClose }) {
  const cardRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const { society, customerName, mobile, bhk, paintType, workItems, amount, areaSqFt, ratePerSqFt } = quotation;
  const items = workItems.filter(w => w.name.trim() && Number(w.price) > 0);
  const quoteDate = new Date();
  const quoteDateStr = quoteDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const validUntil = new Date(quoteDate.getTime() + 15 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const waText = [
    `🎨 *The Painter Boys*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 *QUOTATION*  ·  ${quoteDateStr}`,
    ``,
    `👤 *Customer:* ${customerName}`,
    society ? `🏘️ *Society:* ${society}` : '',
    bhk ? `🛏️ *Configuration:* ${bhk}` : '',
    mobile ? `📞 *Phone:* ${mobile}` : '',
    paintType ? `🎨 *Paint Type:* ${paintType}` : '',
    areaSqFt ? `📐 *Est. Painting Area:* ${areaSqFt.toLocaleString('en-IN')} sq ft` : '',
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🛠️ *SCOPE OF WORK*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ...items.map(i => `✔️ ${i.name} — ₹${Number(i.price).toLocaleString('en-IN')}`),
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `💰 *Total Quotation = ₹${amount.toLocaleString('en-IN')}*`,
    ratePerSqFt ? `📊 *Rate = ₹${ratePerSqFt.toLocaleString('en-IN')}/sq ft*` : '',
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📌 Valid until ${validUntil} · 1-year workmanship warranty`,
    `🌐 www.thepainterboys.com`,
    `📞 Corporate: 7838888509`,
  ].filter(Boolean).join('\n');

  async function shareAsImage() {
    if (!cardRef.current || capturing) return;
    setCapturing(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: '#0d2137', logging: false });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'quotation-thepainterboys.png', { type: 'image/png' });
        const downloadFallback = () => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'quotation-thepainterboys.png'; a.click();
          URL.revokeObjectURL(url);
          alert('This browser can\'t hand the image straight to WhatsApp — image downloaded instead. On a phone, this button opens the share sheet with WhatsApp as an option directly.');
        };
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: 'Quotation — The Painter Boys' }); }
          catch (err) { if (err?.name !== 'AbortError') downloadFallback(); }
        } else {
          downloadFallback();
        }
        setCapturing(false);
      }, 'image/png');
    } catch { setCapturing(false); }
  }

  function shareOnWhatsApp() {
    const digits = mobile.replace(/\D/g, '');
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(waText)}`;
    window.open(url, '_blank', 'noopener');
  }

  return (
    <div className="aq-overlay" onClick={onClose}>
      <div className="aq-wrap" onClick={e => e.stopPropagation()}>
        <div className="aq-card" ref={cardRef}>
          <div className="aq-card-header">
            <img className="aq-card-logo-img" src="/icon.svg" alt="" />
            <div className="aq-card-company">The Painter Boys</div>
            <div className="aq-card-tagline">Professional Painting Services</div>
          </div>
          <div className="aq-card-badge">QUOTATION · {quoteDateStr}</div>
          <div className="aq-card-section">
            <div className="aq-card-section-title">Customer Details</div>
            <div className="aq-card-row"><span>Name</span><span>{customerName}</span></div>
            {society && <div className="aq-card-row"><span>Society</span><span>{society}</span></div>}
            {bhk && <div className="aq-card-row"><span>Configuration</span><span>{bhk}</span></div>}
            {mobile && <div className="aq-card-row"><span>Phone</span><span>{mobile}</span></div>}
            {paintType && <div className="aq-card-row"><span>Paint Type</span><span>{paintType}</span></div>}
            {areaSqFt && <div className="aq-card-row"><span>Est. Painting Area</span><span>{areaSqFt.toLocaleString('en-IN')} sq ft</span></div>}
          </div>
          <div className="aq-card-section">
            <div className="aq-card-section-title">Scope of Work</div>
            <div className="aq-card-item-table">
              {items.map((it, i) => (
                <div key={i} className="aq-card-item-row">
                  <span>✔️ {it.name}</span>
                  <span>₹{Number(it.price).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="aq-card-total">
            <span>Total Quotation{ratePerSqFt ? ` (₹${ratePerSqFt.toLocaleString('en-IN')}/sq ft)` : ''}</span>
            <span>₹{amount.toLocaleString('en-IN')}</span>
          </div>
          <div className="aq-card-terms">
            <div>📌 Valid until <strong>{validUntil}</strong> (15 days from issue)</div>
            <div>🛡️ 1-year workmanship warranty included</div>
          </div>
          <div className="aq-card-footer">
            <div>🌐 www.thepainterboys.com</div>
            <div>📞 Corporate: 7838888509</div>
          </div>
        </div>
        <div className="aq-actions">
          <button className="aq-share-btn" onClick={shareAsImage} disabled={capturing}>
            {capturing ? '⏳ Preparing…' : '📤 Share Image on WhatsApp'}
          </button>
          {mobile && (
            <button className="aq-share-btn aq-share-text" onClick={shareOnWhatsApp}>💬 Send as WhatsApp Text</button>
          )}
          <button className="aq-close-btn" onClick={onClose}>✕ Close</button>
        </div>
      </div>
    </div>
  );
}
