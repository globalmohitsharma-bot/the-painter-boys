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

const EMPTY_CLIENT = { contactName: '', phone: '', email: '', address: '', society: '', otherDetails: '', isActive: true };
const EMPTY_PROJECT = {
  name: '', progress: 'Inquiry', paintType: '', dateContacted: '', dateStarted: '', dateCompleted: '',
  remarks: '', noOfDays: '', amount: 0, otherDetails: '', painterNames: [], tokenReceived: 0,
  pendingAmount: 0, tokenHistory: [], additionalWork: '', workProcess: '', isActive: true,
};
const PROGRESS_OPTIONS = ['Inquiry', 'Pending Visit', 'Not Started', 'In Progress', 'Completed', 'Cancelled'];
// A short, real product list — not restrictive: this is a datalist (like Society),
// so typing anything else (the "Others" case) still works, just without a suggestion.
const PAINT_TYPES = ['Distemper', 'Emulsion', 'Tractor Emulsion', 'Royale', 'Royale Shyne', 'Apex', 'Deco Paint', 'PU Paint'];
// The step-by-step scope committed to the customer — kept separate from
// PaintType so "what product" and "what process" can both be tracked.
const WORK_PROCESS_STEPS = [
  '1 Coat Putty', '2 Coat Putty', 'Primer', 'Chalk Mitti', 'Wall Repair', 'Crack Filling',
  'Texture', '1 Coat Paint', '2 Coat Paint', 'Waterproofing', 'Polish',
];
const NO_OF_DAYS_OPTIONS = ['2', '3', '5', '7', '10', '12', '15', '20', '30'];
const PAINTER_AVATAR_COLORS = ['#c96a0f', '#7c3aed', '#16a34a', '#2563eb', '#dc2626', '#0891b2', '#be185d', '#65a30d'];
function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PAINTER_AVATAR_COLORS[Math.abs(hash) % PAINTER_AVATAR_COLORS.length];
}
// Order in painterNames carries meaning — first is Primary — so the display
// string flags it rather than listing everyone identically.
function formatPainters(names) {
  if (!names || names.length === 0) return '';
  if (names.length === 1) return names[0];
  return `★ ${names[0]}, ${names.slice(1).join(', ')}`;
}
// Same built-in lists the Staff Portal ships with, for the same "select or
// type a new one" behavior on Society/Painter fields.
const DEFAULT_SOCIETIES = [
  'Aashiyana', 'Addela Palm Resort', 'Ajnara Fragrance', 'Ajnara Grace', 'Ajnara Integrity',
  'Anthem Kingdom Homes', 'Charms Castle', 'Charms The Gateway Towers',
  'Devika Skypers', 'Emenox Brave Hearts', 'Gaur Cascades', 'GAV Green View Heights',
  'Jyoti Super Village', 'KDP Grand Savanna', 'KDP Grand Savannah', 'KW Srishti', 'Landcraft River Heights',
  'MCC Signature Heights', 'Migsun Atharva', 'Migsun Roof', 'Nilaya Greens',
  'Officer City', 'Officer City 1', 'Officer City 2', 'Raj Nagar Residency', 'Royce Sentosa Parc', 'Sangwan Heights',
  'SCC Blossom', 'SCC Heights', 'SCC Sapphire', 'SG Impression', 'SG Impression Plus',
  'SG Impressions 58', 'SG Vista', 'Star Rameshwaram', 'SVP Gulmohur Garden',
  'T and T Atlas', 'Uninav Eden', 'Uninav Residena', 'Uninav Utopia', 'Vasundhara',
  'VVIP Addresses', 'VVIP Homes', 'Windsor Majesty', 'Windsor Paradise 2',
].sort();
const DEFAULT_PAINTERS = ['Fariyad', 'Jabbar', 'Rajeev', 'Raju', 'Sushant'];
const SPACE_TYPES = ['Wall', 'Room', 'Full Home', 'Commercial', 'Shop'];
const EMPTY_QUOTATION = {
  society: '', customerName: '', mobile: '', bhk: '', paintType: '', spaceType: '',
  // Process is a tile-picker (same convention as ProjectForm's Process
  // section) — no per-item price, just what's included. One manually-entered
  // totalAmount covers the whole job, since customers are quoted a single
  // project price, not itemized line costs.
  workProcess: '', totalAmount: '',
};
// Rule-of-thumb multiplier painting contractors commonly use to go from
// built-up area to total paintable (wall + ceiling) area — real ratio varies
// by layout, so it's editable rather than baked in as an exact constant.
const DEFAULT_AREA_MULTIPLIER = 2.5;

// html2canvas renders a scrollable ancestor at its CURRENT scroll clip —
// these receipt/quotation cards sit inside a `.aq-wrap` with overflow-y:auto
// (so the modal itself fits the screen), which meant anything below the
// visible scroll position silently never made it into the captured image.
// Temporarily lifting that clip for the capture, then restoring it, gets
// the full card regardless of scroll position.
async function captureCard(cardEl, backgroundColor) {
  const wrap = cardEl.parentElement;
  const prevOverflow = wrap.style.overflowY;
  const prevMaxHeight = wrap.style.maxHeight;
  wrap.style.overflowY = 'visible';
  wrap.style.maxHeight = 'none';
  try {
    return await html2canvas(cardEl, { scale: 2, useCORS: true, backgroundColor, logging: false });
  } finally {
    wrap.style.overflowY = prevOverflow;
    wrap.style.maxHeight = prevMaxHeight;
  }
}

// Shows the generated card image before it goes anywhere, with the actual
// share/download action gated behind a second click — previously the image
// was captured and immediately shared/downloaded in one step, so there was
// no chance to confirm it looked right first.
function SharePreviewModal({ blob, filename, shareTitle, onClose }) {
  const [url] = useState(() => URL.createObjectURL(blob));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  function downloadFallback() {
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    alert('This browser can\'t hand the image straight to WhatsApp — image downloaded instead. On a phone, this button opens the share sheet with WhatsApp as an option directly.');
  }

  async function handleShare() {
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: shareTitle }); }
      catch (err) { if (err?.name !== 'AbortError') downloadFallback(); }
    } else {
      downloadFallback();
    }
  }

  return (
    <div className="ap-lightbox-overlay" onClick={onClose}>
      <div className="ap-share-preview" onClick={e => e.stopPropagation()}>
        <img src={url} alt="Generated preview" />
        <div className="ap-share-preview-actions">
          <button className="ap-act ap-act-share" onClick={handleShare}>📤 Share via WhatsApp</button>
          <button className="ap-act ap-act-deactivate" onClick={onClose}>✕ Close</button>
        </div>
      </div>
    </div>
  );
}

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
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null); // { ok, message } | null
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null); // { ok, message } | null
  const [previewing, setPreviewing] = useState(false);
  const [pushPreview, setPushPreview] = useState(null); // { toAppend, toUpdate, skipped } | null
  const [toast, setToast] = useState(null); // string | null
  const toastTimerRef = useRef(null);
  // Every create/update/delete action routes through this so the admin gets
  // the same clear "it worked" signal regardless of which action they took —
  // previously most actions just silently closed a modal with no confirmation.
  function showToast(message) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  }

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

  // One-way pull from the legacy Staff Portal's Google Sheet — never writes
  // back to it. Compares each sheet row's "#" against SheetRef already in
  // Cosmos and only imports rows that aren't here yet.
  async function syncSheet() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await api('/api/admin/sheet-sync', idToken, { method: 'POST' });
      setSyncResult({
        ok: true,
        message: result.imported === 0
          ? 'Already up to date — no new entries in the sheet.'
          : `Imported ${result.imported} new ${result.imported === 1 ? 'entry' : 'entries'}: ${result.entries.map(e => e.name).join(', ')}`,
      });
      if (result.imported > 0) await load();
    } catch (e) {
      setSyncResult({ ok: false, message: e.message });
    } finally {
      setSyncing(false);
    }
  }

  // The other direction — pushes Admin Portal clients/projects into the same
  // sheet. See SheetPushSyncService for the known limitation: a portal-created
  // entry only gets pushed once (appended), since the Apps Script doesn't hand
  // back a row number to target for later updates.
  //
  // Always preview before pushing — a live push once wrote unwanted rows into
  // the real sheet with no review step first (2026-08-30), so nothing here
  // writes anything until an admin has actually seen the plan and confirmed it.
  async function loadPushPreview() {
    setPreviewing(true);
    setPushResult(null);
    try {
      const result = await api('/api/admin/sheet-sync/push/preview', idToken);
      setPushPreview(result);
    } catch (e) {
      setPushResult({ ok: false, message: e.message });
    } finally {
      setPreviewing(false);
    }
  }

  async function confirmPushSheet() {
    setPushing(true);
    setPushResult(null);
    try {
      const result = await api('/api/admin/sheet-sync/push', idToken, { method: 'POST' });
      setPushResult({
        ok: true,
        message: (result.appended === 0 && result.updated === 0)
          ? 'Already up to date — nothing new to push.'
          : `Pushed to the sheet: ${result.appended} new row${result.appended === 1 ? '' : 's'} added, ${result.updated} existing row${result.updated === 1 ? '' : 's'} updated.`,
      });
      setPushPreview(null);
    } catch (e) {
      setPushResult({ ok: false, message: e.message });
    } finally {
      setPushing(false);
    }
  }

  // Plain fetch (not the api() helper) — the response here is a file blob,
  // not JSON, and needs the Authorization header a plain <a href> download
  // link couldn't send. Triggers a save via a throwaway <a download> element.
  async function exportCsv() {
    const res = await fetch(`${API_BASE}/api/admin/export/csv`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) throw new Error(`Export failed (${res.status})`);
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const fileName = match ? match[1] : `painterboys-export-${new Date().toISOString().slice(0, 10)}.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('✓ Export downloaded');
  }

  async function saveClient(client) {
    const isNew = !client.id;
    const saved = isNew
      ? await api('/api/clients', idToken, { method: 'POST', body: JSON.stringify(client) })
      : await api(`/api/clients/${client.id}`, idToken, { method: 'PUT', body: JSON.stringify(client) });
    setClients(cs => isNew ? [saved, ...cs] : cs.map(c => c.id === saved.id ? saved : c));
    setEditingClient(null);

    // A client with no project is invisible in Grid View (it only ever
    // lists projects, never clients directly) — a brand new client would
    // otherwise sit in All Clients with no way to notice or work on them
    // day to day. Give every new client a starting Inquiry project so
    // they show up immediately where an admin actually looks.
    if (isNew) {
      const newProject = await api('/api/projects', idToken, {
        method: 'POST',
        body: JSON.stringify({ ...EMPTY_PROJECT, clientId: saved.id, dateContacted: new Date().toISOString().slice(0, 10) }),
      });
      setProjects(ps => [newProject, ...ps]);
      // Land the admin right where the new entry is, rather than just
      // toasting and leaving them wherever they happened to be — Grid
      // View filtered to Inquiry, new project prepended so it's on top.
      setProjectFilter('Inquiry');
      goto('grid');
      showToast(`✓ Client "${saved.contactName}" added — showing under Inquiry`);
    } else {
      showToast(`✓ Client "${saved.contactName}" updated`);
    }
  }

  async function deleteClient(id) {
    if (!confirm('Delete this client and keep their projects orphaned? This cannot be undone.')) return;
    await api(`/api/clients/${id}`, idToken, { method: 'DELETE' });
    setClients(cs => cs.filter(c => c.id !== id));
    showToast('✓ Client deleted');
  }

  async function saveProject(project, clientUpdates) {
    const isNew = !project.id;
    const payload = { ...project, clientId: project.clientId || selectedClientId };
    const saved = isNew
      ? await api('/api/projects', idToken, { method: 'POST', body: JSON.stringify(payload) })
      : await api(`/api/projects/${project.id}`, idToken, { method: 'PUT', body: JSON.stringify(payload) });
    setProjects(ps => isNew ? [saved, ...ps] : ps.map(p => p.id === saved.id ? saved : p));
    setEditingProject(null);

    // ProjectForm also surfaces the client's Name/Phone (editing a project
    // is where an admin most often notices a client detail needs fixing) —
    // only fire a second request when something actually changed.
    if (clientUpdates) {
      const client = clients.find(c => c.id === payload.clientId);
      if (client && (client.contactName !== clientUpdates.contactName || client.phone !== clientUpdates.phone)) {
        const savedClient = await api(`/api/clients/${client.id}`, idToken, {
          method: 'PUT', body: JSON.stringify({ ...client, ...clientUpdates }),
        });
        setClients(cs => cs.map(c => c.id === savedClient.id ? savedClient : c));
      }
    }
    showToast(isNew ? '✓ Project added' : '✓ Project updated');
  }

  async function generateLinkCode(projectId) {
    const saved = await api(`/api/projects/${projectId}/generate-link-code`, idToken, { method: 'POST' });
    setProjects(ps => ps.map(p => p.id === saved.id ? saved : p));
    showToast(`✓ Link code generated: ${saved.linkCode}`);
  }

  async function deleteProject(id) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await api(`/api/projects/${id}`, idToken, { method: 'DELETE' });
    setProjects(ps => ps.filter(p => p.id !== id));
    showToast('✓ Project deleted');
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
    showToast(`✓ Payment of ₹${amount.toLocaleString('en-IN')} recorded`);
  }

  // Removes one payment history entry entirely — the amount only comes back
  // out of the running total if the entry wasn't already archived (an
  // archived entry is already excluded from tokenReceived/pendingAmount).
  async function deletePaymentEntry(projectId, index) {
    const project = projects.find(p => p.id === projectId);
    const entry = project?.tokenHistory?.[index];
    if (!entry) return;
    if (!confirm(`Delete the ₹${(entry.amount || 0).toLocaleString('en-IN')} entry from ${entry.date}? This cannot be undone.`)) return;
    const newHistory = project.tokenHistory.filter((_, i) => i !== index);
    const amt = entry.archived ? 0 : (entry.amount || 0);
    const newReceived = Math.max(0, (project.tokenReceived || 0) - amt);
    const newPending = project.amount > 0 ? Math.max(0, project.amount - newReceived) : Math.max(0, (project.pendingAmount || 0) + amt);
    const payload = { ...project, tokenHistory: newHistory, tokenReceived: newReceived, pendingAmount: newPending };
    const saved = await api(`/api/projects/${projectId}`, idToken, { method: 'PUT', body: JSON.stringify(payload) });
    setProjects(ps => ps.map(p => p.id === saved.id ? saved : p));
    showToast('✓ Payment entry deleted');
  }

  // Archiving hides an entry from the receipt/WhatsApp text and pulls it out
  // of tokenReceived/pendingAmount, without permanently deleting it — the
  // admin can restore it later. Same toggle handles both directions.
  async function toggleArchivePaymentEntry(projectId, index) {
    const project = projects.find(p => p.id === projectId);
    const entry = project?.tokenHistory?.[index];
    if (!entry) return;
    const nowArchived = !entry.archived;
    const newHistory = project.tokenHistory.map((e, i) => i === index ? { ...e, archived: nowArchived } : e);
    const delta = nowArchived ? -(entry.amount || 0) : (entry.amount || 0);
    const newReceived = Math.max(0, (project.tokenReceived || 0) + delta);
    const newPending = project.amount > 0 ? Math.max(0, project.amount - newReceived) : Math.max(0, (project.pendingAmount || 0) - delta);
    const payload = { ...project, tokenHistory: newHistory, tokenReceived: newReceived, pendingAmount: newPending };
    const saved = await api(`/api/projects/${projectId}`, idToken, { method: 'PUT', body: JSON.stringify(payload) });
    setProjects(ps => ps.map(p => p.id === saved.id ? saved : p));
    showToast(nowArchived ? '✓ Payment entry archived' : '✓ Payment entry restored');
  }

  // Quick WhatsApp status update — client-side only, no backend involved.
  // Lighter-weight than the Staff Portal's job-link share, since Admin Portal
  // doesn't have a customer-facing job page yet (separate, bigger piece of work).
  function shareProjectUpdate(project, client) {
    const name = client?.contactName || 'Customer';
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
    showToast('✓ Account linked');
  }

  async function unlinkUser(clientId) {
    const saved = await api(`/api/clients/${clientId}/unlink-user`, idToken, { method: 'POST' });
    setClients(cs => cs.map(c => c.id === saved.id ? saved : c));
    setUsers(us => us.map(u => u.linkedClientId === clientId ? { ...u, linkedClientId: null } : u));
    showToast('✓ Account unlinked');
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
    showToast('✓ Photo uploaded');
  }
  async function deleteProjectImage(projectId, url) {
    const saved = await api(`/api/projects/${projectId}/images`, idToken, { method: 'DELETE', body: JSON.stringify({ url }) });
    updateProjectInState(saved);
    showToast('✓ Photo removed');
  }
  async function shareProject(projectId, userId) {
    const saved = await api(`/api/projects/${projectId}/share`, idToken, { method: 'POST', body: JSON.stringify({ userId }) });
    updateProjectInState(saved);
    showToast('✓ Project shared with customer');
  }
  async function toggleProjectShare(projectId, userId) {
    const saved = await api(`/api/projects/${projectId}/share/${userId}/toggle`, idToken, { method: 'POST' });
    updateProjectInState(saved);
    showToast('✓ Sharing updated');
  }
  async function unshareProject(projectId, userId) {
    const saved = await api(`/api/projects/${projectId}/share/${userId}`, idToken, { method: 'DELETE' });
    updateProjectInState(saved);
    showToast('✓ Sharing removed');
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
    if (!showInactive && (pc.isActive === false || pc.client?.isActive === false)) return false;
    const q = search.toLowerCase();
    const matchesSearch = !q || (pc.client?.contactName || '').toLowerCase().includes(q)
      || (pc.client?.phone || '').includes(q) || (pc.client?.society || '').toLowerCase().includes(q);
    const matchesFilter = projectFilter === 'All' || pc.progress === projectFilter;
    return matchesSearch && matchesFilter;
  });

  // Dashboard counts (stats, statusCounts, the "Newest Inquiries" list) are
  // meant to reflect real, live work — an archived client (test data or a
  // genuinely inactive one) and its projects shouldn't inflate them just
  // because the records still exist. Grid View's own "Showing Archived Too"
  // toggle is a separate, deliberate opt-in and stays unaffected by this.
  const activeClientIds = new Set(clients.filter(c => c.isActive !== false).map(c => c.id));
  const countedProjects = projects.filter(p => p.isActive !== false && activeClientIds.has(p.clientId));
  const stats = {
    clients: clients.filter(c => c.isActive !== false).length,
    inProgress: countedProjects.filter(p => p.progress === 'In Progress').length,
    inquiries: countedProjects.filter(p => p.progress === 'Inquiry').length,
    pendingTotal: countedProjects.reduce((s, p) => s + (p.pendingAmount || 0), 0),
  };
  const statusCounts = PROGRESS_OPTIONS.reduce((acc, opt) => {
    acc[opt] = countedProjects.filter(p => p.progress === opt).length;
    return acc;
  }, {});
  const pendingLinkCount = projects.reduce((n, p) => n + (p.sharedWith || []).filter(s => !s.visible).length, 0);
  const projectRequestCount = users.filter(u => u.projectRequestPending).length;

  function goto(v) { setSelectedClientId(null); setView(v); }

  return (
    <div className="ap-root">
      <header className="ap-header">
        <button className="ap-header-brand ap-header-brand-btn" onClick={() => goto('dashboard')} title="Go to Dashboard">
          <img src="/logo-header.png" alt="" className="ap-header-logo" />
          <span>Admin Portal</span>
        </button>
        <div className="ap-header-user">
          <span>{whoami.name}</span>
          <button className="ap-signout-icon" onClick={onSignOut} title="Sign out" aria-label="Sign out">!</button>
        </div>
      </header>

      <div className="ap-body">
        <nav className="ap-sidebar">
          <button className={`ap-sidebar-btn ${view === 'dashboard' && !selectedClientId ? 'active' : ''}`} onClick={() => goto('dashboard')}>📊 Dashboard</button>
          <button className={`ap-sidebar-btn ${view === 'grid' && !selectedClientId ? 'active' : ''}`} onClick={() => goto('grid')}>🗂️ Grid View</button>
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
                <button className="ap-btn-primary" onClick={() => setEditingProject({ ...EMPTY_PROJECT, clientId: selectedClientId, dateContacted: new Date().toISOString().slice(0, 10) })}>+ New Project</button>
              </div>
            </div>
            <table className="ap-table">
              <thead>
                <tr><th>Name</th><th>Progress</th><th>Paint Type</th><th>Process</th><th>Amount</th><th>Pending</th><th>Painters</th><th>Link Code</th><th></th></tr>
              </thead>
              <tbody>
                {clientProjects.map(p => (
                  <tr key={p.id}>
                    <td data-label="Name">{p.name || '—'}</td>
                    <td data-label="Progress">
                      <select
                        className={`ap-progress-select ap-progress-${p.progress.toLowerCase().replace(/\s+/g, '-')}`}
                        value={p.progress}
                        onChange={e => saveProject({ ...p, progress: e.target.value })}
                      >
                        {PROGRESS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td data-label="Paint Type">{p.paintType || '—'}</td>
                    <td data-label="Process">{p.workProcess || '—'}</td>
                    <td data-label="Amount">₹{p.amount?.toLocaleString()}</td>
                    <td data-label="Pending">₹{p.pendingAmount?.toLocaleString()}</td>
                    <td data-label="Painters">{formatPainters(p.painterNames) || '—'}</td>
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
                      <button className="ap-act ap-act-edit" onClick={() => setEditingProject(p)}>✏️ Edit</button>
                      <button className="ap-act ap-act-photos" onClick={() => setMediaProjectId(p.id)}>📷 Photos & Sharing</button>
                      <button className="ap-act ap-act-receipt" onClick={() => setReceiptProjectId(p.id)}>🧾 Payment Receipt</button>
                      <button className="ap-act ap-act-share" onClick={() => shareProjectUpdate(p, selectedClient)}>💬 Share Update</button>
                      {p.progress === 'Inquiry' && (
                        <button className="ap-act ap-act-thankyou" onClick={() => setThankYouProjectId(p.id)}>💌 Thank You Card</button>
                      )}
                      {p.isActive === false ? (
                        <button className="ap-act ap-act-activate" title="Bring this project back into the normal lists — it's currently hidden" onClick={() => saveProject({ ...p, isActive: true })}>↩️ Restore</button>
                      ) : (
                        <button className="ap-act ap-act-deactivate" title="Hide this project from the normal lists — doesn't delete it, doesn't change its status" onClick={() => saveProject({ ...p, isActive: false })}>🗄️ Archive (Hide)</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <LinkedAccountBox client={selectedClient} users={users} onLink={linkUser} onUnlink={unlinkUser} onGenerateInvite={generateInvite} />
          </>
        ) : view === 'quotation' ? (
          <QuotationTool />
        ) : view === 'utilities-menu' ? (
          <UtilitiesMenu onNavigate={goto} pendingLinkCount={pendingLinkCount} projectRequestCount={projectRequestCount}
            showInactive={showInactive} onToggleShowInactive={() => setShowInactive(s => !s)} onExportCsv={exportCsv} />
        ) : view === 'sync' ? (
          <>
            <div className="ap-sync-box">
              <div>
                <strong>Pull from Google Sheet</strong>
                <p>Checks the Staff Portal's sheet for new entries and imports them into the Admin Portal. Also runs automatically once a week in the background.</p>
              </div>
              <button className="ap-btn-primary" onClick={syncSheet} disabled={syncing}>
                {syncing ? '⏳ Checking sheet…' : '🔄 Sync from Google Sheet'}
              </button>
            </div>
            {syncResult && <p className={syncResult.ok ? 'ap-add-payment-ok' : 'ap-warn ap-warn-error'}>{syncResult.message}</p>}

            <div className="ap-sync-box" style={{ marginTop: 16 }}>
              <div>
                <strong>Push to Google Sheet</strong>
                <p>
                  Writes Admin Portal clients/projects into the same sheet — new ones get added as a row,
                  entries that originally came from the sheet get their row updated. Archived clients/projects
                  are never pushed. Always shows exactly what will change first — nothing is written until you
                  confirm. A project created directly in the Admin Portal is only ever added to the sheet once;
                  later edits to it won't re-sync back, since the sheet has no way to tell us which row it landed on.
                </p>
              </div>
              <button className="ap-btn-primary" onClick={loadPushPreview} disabled={previewing || pushing}>
                {previewing ? '⏳ Checking what would change…' : '👁 Preview Push to Google Sheet'}
              </button>
            </div>
            {pushPreview && (
              <div className="ap-calc-box" style={{ marginTop: 12 }}>
                <div className="ap-calc-hint" style={{ marginBottom: 8 }}>
                  {pushPreview.toAppend.length === 0 && pushPreview.toUpdate.length === 0
                    ? 'Nothing to push — already up to date.'
                    : `This will add ${pushPreview.toAppend.length} new row${pushPreview.toAppend.length === 1 ? '' : 's'} and update ${pushPreview.toUpdate.length} existing row${pushPreview.toUpdate.length === 1 ? '' : 's'}.`}
                </div>
                {pushPreview.toAppend.length > 0 && (
                  <>
                    <strong style={{ fontSize: '.85rem' }}>New rows to add:</strong>
                    <ul style={{ margin: '6px 0 12px', paddingLeft: 20, fontSize: '.85rem' }}>
                      {pushPreview.toAppend.map(e => <li key={e.projectId}>{e.clientName}</li>)}
                    </ul>
                  </>
                )}
                {pushPreview.toUpdate.length > 0 && (
                  <>
                    <strong style={{ fontSize: '.85rem' }}>Existing rows to update:</strong>
                    <ul style={{ margin: '6px 0 12px', paddingLeft: 20, fontSize: '.85rem' }}>
                      {pushPreview.toUpdate.map(e => <li key={e.projectId}>{e.clientName}</li>)}
                    </ul>
                  </>
                )}
                <div className="ap-modal-actions">
                  <button onClick={() => setPushPreview(null)}>Cancel</button>
                  {(pushPreview.toAppend.length > 0 || pushPreview.toUpdate.length > 0) && (
                    <button className="ap-btn-primary" onClick={confirmPushSheet} disabled={pushing}>
                      {pushing ? '⏳ Pushing…' : '🔼 Confirm & Push to Google Sheet'}
                    </button>
                  )}
                </div>
              </div>
            )}
            {pushResult && <p className={pushResult.ok ? 'ap-add-payment-ok' : 'ap-warn ap-warn-error'}>{pushResult.message}</p>}
          </>
        ) : view === 'dashboard' ? (
          <DashboardOverview stats={stats} statusCounts={statusCounts} projects={projects} clients={clients} onSelectClient={setSelectedClientId}
            onFilterStatus={(status) => { setProjectFilter(status); goto('grid'); }}
            pendingLinkCount={pendingLinkCount} projectRequestCount={projectRequestCount}
            onNavigate={goto} />
        ) : view === 'linked' ? (
          <LinkedAccountsView clients={clients} users={users} onUnlink={unlinkUser} onSelectClient={setSelectedClientId} />
        ) : view === 'pending-links' ? (
          <PendingLinksView projects={projects} clients={clients} users={users}
            onApprove={toggleProjectShare} onReject={unshareProject} onSelectClient={setSelectedClientId} />
        ) : view === 'requests' ? (
          <ProjectRequestsView users={users} clients={clients} onResolve={resolveRequest} onSelectClient={setSelectedClientId} onLinkUser={linkUser} />
        ) : view === 'users' ? (
          <UsersView users={users} clients={clients} onImpersonate={impersonateUser} onSelectClient={setSelectedClientId} />
        ) : view === 'clients' ? (
          <>
            <div className="ap-toolbar">
              <input className="ap-search" placeholder="Search by name, phone, society…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {loading ? <p className="ap-loading">Loading…</p> : (
              <table className="ap-table">
                <thead>
                  <tr><th>Name</th><th>Phone</th><th>Society</th><th>Projects</th></tr>
                </thead>
                <tbody>
                  {clients.filter(c => {
                    if (!showInactive && c.isActive === false) return false;
                    const q = search.toLowerCase();
                    return !q || c.contactName.toLowerCase().includes(q) || c.phone.includes(q) || c.society.toLowerCase().includes(q);
                  }).map(c => (
                    <tr key={c.id}>
                      <td className="ap-link" data-label="Name" onClick={() => setSelectedClientId(c.id)}>
                        {c.contactName || '—'}{c.isActive === false && <span className="ap-progress-chip ap-progress-inactive" style={{ marginLeft: 6 }}>🗄️ Archived</span>}
                      </td>
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
            <div className="ap-toolbar">
              <input className="ap-search" placeholder="Search by name, phone, society…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="ap-filter-row">
              <button className={`ap-filter-chip ${projectFilter === 'All' ? 'active' : ''}`} onClick={() => setProjectFilter('All')}>
                All <span className="ap-filter-count">{countedProjects.length}</span>
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

      {toast && <div className="ap-toast">{toast}</div>}

      <button
        className="ap-fab"
        title="Create Client"
        aria-label="Create Client"
        onClick={() => setEditingClient(EMPTY_CLIENT)}
      >
        +
      </button>

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
          client={clients.find(c => c.id === editingProject.clientId)}
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
          onDeletePayment={deletePaymentEntry}
          onToggleArchivePayment={toggleArchivePaymentEntry}
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

// Icon meanings, all pulled from the same --status-* variables the project
// cards themselves use — so "green" always means Completed everywhere in
// the Admin Portal, never a different status depending on which screen.
const STATUS_ICONS = [
  { status: 'Completed', icon: '✅', color: 'var(--status-completed)' },
  { status: 'In Progress', icon: '🔄', color: 'var(--status-in-progress)' },
  { status: 'Inquiry', icon: '❓', color: 'var(--status-inquiry)' },
  { status: 'Pending Visit', icon: '🗓️', color: 'var(--status-pending-visit)' },
  { status: 'Not Started', icon: '⏳', color: 'var(--status-not-started)' },
  { status: 'Cancelled', icon: '✕', color: 'var(--status-cancelled)' },
];

// Everything that isn't a day-to-day client/project action lives behind
// this one menu — reached via the Dashboard's "Utility" icon — so the
// sidebar itself can stay down to just Dashboard + Grid View.
function UtilitiesMenu({ onNavigate, pendingLinkCount, projectRequestCount, showInactive, onToggleShowInactive, onExportCsv }) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const items = [
    { key: 'quotation', icon: '🧾', label: 'Quotation & Calculator' },
    { key: 'users', icon: '👥', label: 'Users' },
    { key: 'pending-links', icon: '⏳', label: 'Pending Links', badge: pendingLinkCount },
    { key: 'requests', icon: '📨', label: 'Requests', badge: projectRequestCount },
    { key: 'sync', icon: '🔄', label: 'Google Sheet Sync' },
  ];
  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      await onExportCsv();
    } catch (e) {
      setExportError(e.message);
    } finally {
      setExporting(false);
    }
  }
  return (
    <div className="ap-dashboard">
      <h3 className="ap-dashboard-subhead">🔧 Utility</h3>
      <div className="ap-icon-row">
        {items.map(u => (
          <button key={u.key} className="ap-icon-btn" onClick={() => onNavigate(u.key)}>
            <span className="ap-icon-circle ap-icon-circle-utility">
              {u.icon}
              {u.badge > 0 && <span className="ap-icon-badge">{u.badge}</span>}
            </span>
            <span className="ap-icon-label">{u.label}</span>
          </button>
        ))}
      </div>
      <h3 className="ap-dashboard-subhead">⚙️ Settings</h3>
      <div className="ap-calc-box">
        <div className="ap-card-row" style={{ padding: '6px 0' }}>
          <span>
            Show Archived Clients
            <span className="ap-calc-hint" style={{ display: 'block', marginTop: 2 }}>
              Off by default — archived clients and their projects stay hidden from Grid View and All Clients until turned on here.
            </span>
          </span>
          <button
            className={showInactive ? 'ap-act ap-act-activate' : 'ap-act ap-act-deactivate'}
            onClick={onToggleShowInactive}
          >
            {showInactive ? '🙈 Hide Archived Clients' : '👁 View Archived Clients'}
          </button>
        </div>
      </div>
      <h3 className="ap-dashboard-subhead">📤 Export</h3>
      <div className="ap-calc-box">
        <div className="ap-card-row" style={{ padding: '6px 0' }}>
          <span>
            Export All Clients &amp; Projects
            <span className="ap-calc-hint" style={{ display: 'block', marginTop: 2 }}>
              Downloads a CSV of every client and project — same columns as the Google Sheet. Includes archived records too, unlike Sheet Sync.
            </span>
          </span>
          <button className="ap-btn-primary" onClick={handleExport} disabled={exporting}>
            {exporting ? '⏳ Preparing…' : '⬇️ Export CSV'}
          </button>
        </div>
        {exportError && <p className="ap-warn ap-warn-error">Could not export — {exportError}</p>}
      </div>
    </div>
  );
}

// Overview landing page — big-picture status counts plus a quick-glance list
// of the newest inquiries, so triage doesn't require opening Grid View first.
function DashboardOverview({ stats, statusCounts, projects, clients, onSelectClient, onFilterStatus, onNavigate, pendingLinkCount, projectRequestCount }) {
  // Same "archived clients don't count" rule as the stats/statusCounts above
  // — an archived client's inquiry shouldn't show up in the triage list either.
  const activeClientIds = new Set(clients.filter(c => c.isActive !== false).map(c => c.id));
  const recentInquiries = projects
    .filter(p => p.progress === 'Inquiry' && p.isActive !== false && activeClientIds.has(p.clientId))
    .slice(0, 5);
  const utilityIcons = [
    { key: 'clients', icon: '👤', label: 'All Clients', badge: stats.clients, title: 'Every client on file' },
    { key: 'linked', icon: '🔗', label: "Client Email Links", title: "Which clients have their email ID associated with a customer-dashboard account" },
    { key: 'utilities-menu', icon: '🔧', label: 'Utility', badge: pendingLinkCount + projectRequestCount, title: 'Users, sheet sync, pending links, requests' },
    { key: 'quotation', icon: '🧾', label: 'Tools', title: 'Quotation generator & area calculator' },
  ];
  return (
    <div className="ap-dashboard">
      <div className="ap-icon-row ap-icon-row-status">
        {STATUS_ICONS.map(s => (
          <button key={s.status} className="ap-icon-btn" onClick={() => onFilterStatus(s.status)} title={`See all ${s.status} projects`}>
            <span className="ap-icon-circle" style={{ background: s.color }}>
              {s.icon}
              {(statusCounts[s.status] || 0) > 0 && <span className="ap-icon-badge">{statusCounts[s.status]}</span>}
            </span>
            <span className="ap-icon-label">{s.status}</span>
          </button>
        ))}
      </div>

      <div className="ap-icon-row">
        {utilityIcons.map(u => (
          <button key={u.key} className="ap-icon-btn" onClick={() => onNavigate(u.key)} title={u.title}>
            <span className="ap-icon-circle ap-icon-circle-utility">
              {u.icon}
              {u.badge > 0 && <span className="ap-icon-badge">{u.badge}</span>}
            </span>
            <span className="ap-icon-label">{u.label}</span>
          </button>
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
  if (linked.length === 0) return <p className="ap-loading">No clients have their email ID associated with a dashboard account yet.</p>;
  return (
    <table className="ap-table">
      <thead>
        <tr><th>Client</th><th>Phone</th><th>Client's Email ID</th><th></th></tr>
      </thead>
      <tbody>
        {linked.map(({ client, user }) => (
          <tr key={client.id}>
            <td className="ap-link" data-label="Client" onClick={() => onSelectClient(client.id)}>{client.contactName || '—'}</td>
            <td data-label="Phone">{client.phone}</td>
            <td data-label="Client's Email ID">{user ? `${user.name} (${user.email})` : '—'}</td>
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
function ProjectRequestsView({ users, clients, onResolve, onSelectClient, onLinkUser }) {
  const [busyId, setBusyId] = useState(null);
  const [pickerFor, setPickerFor] = useState(null);
  const [pickedClientId, setPickedClientId] = useState('');
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

  async function handleLink(userId) {
    if (!pickedClientId) return;
    setBusyId(userId);
    try {
      await onLinkUser(pickedClientId, userId);
      setPickerFor(null);
      setPickedClientId('');
    } catch (e) {
      alert('Could not link — ' + e.message);
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
                {client ? (
                  <span className="ap-link" onClick={() => onSelectClient(client.id)}>{client.contactName || '—'}</span>
                ) : pickerFor === u.id ? (
                  <span className="ap-request-picker">
                    <select value={pickedClientId} onChange={e => setPickedClientId(e.target.value)}>
                      <option value="">Pick the matching client…</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.contactName} — {c.phone}</option>
                      ))}
                    </select>
                    <button className="ap-act ap-act-activate" disabled={!pickedClientId || busyId === u.id}
                      onClick={() => handleLink(u.id)}>{busyId === u.id ? 'Linking…' : 'Confirm'}</button>
                    <button className="ap-act ap-act-deactivate" onClick={() => { setPickerFor(null); setPickedClientId(''); }}>Cancel</button>
                  </span>
                ) : (
                  <span className="ap-warn">Not linked yet</span>
                )}
              </td>
              <td data-label="Requested">{u.projectRequestedAt ? new Date(u.projectRequestedAt).toLocaleDateString('en-IN') : '—'}</td>
              <td className="ap-row-actions" data-label="Actions">
                {client ? (
                  <button className="ap-act ap-act-photos" onClick={() => onSelectClient(client.id)}>🔗 Go Link a Project</button>
                ) : pickerFor !== u.id && (
                  <button className="ap-act ap-act-edit" onClick={() => setPickerFor(u.id)}>🔗 Link to Client</button>
                )}
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
          {project.isActive === false && <span className="ap-progress-chip ap-progress-inactive" title="Hidden from normal lists">🗄️ Archived</span>}
          <span className={`ap-progress-chip ap-progress-${(project.progress || '').toLowerCase().replace(/\s+/g, '-')}`}>{project.progress}</span>
          <button className="ap-card-wa-btn" onClick={e => { e.stopPropagation(); onShare(); }} title="Share status on WhatsApp">💬</button>
        </div>
      </div>
      {client?.phone && <div className="ap-card-row">📞 <span>{client.phone}</span></div>}
      {client?.society && <div className="ap-card-row">🏘️ <span>{client.society}</span></div>}
      {client?.address && <div className="ap-card-row ap-card-addr">📍 <span>{client.address}</span></div>}
      {project.paintType && <div className="ap-card-row">🎨 <span>{project.paintType}</span></div>}
      {project.workProcess && <div className="ap-card-row">📋 <span>{project.workProcess}</span></div>}
      {startDate && <div className="ap-card-row">📅 <span>{new Date(startDate).toLocaleDateString('en-IN')}</span></div>}
      {project.amount > 0 && <div className="ap-card-row">💰 <span>Amount: ₹{project.amount.toLocaleString('en-IN')}</span></div>}
      {project.pendingAmount > 0 && <div className="ap-card-row">⏳ <span>Pending: ₹{project.pendingAmount.toLocaleString('en-IN')}</span></div>}
      {(project.painterNames || []).length > 0 && <div className="ap-card-row">👷 <span>{formatPainters(project.painterNames)}</span></div>}
      {project.remarks && <div className="ap-card-remarks">{project.remarks}</div>}
      {project.tokenReceived > 0 && (
        <button className="ap-card-receipt-btn" onClick={e => { e.stopPropagation(); onViewReceipt(); }}>
          🧾 View Receipt · ₹{project.tokenReceived.toLocaleString('en-IN')}
        </button>
      )}
    </div>
  );
}

const REQUIRED_CLIENT_FIELDS = ['contactName', 'phone'];

function ClientForm({ client, onCancel, onSave, societies = [] }) {
  const [form, setForm] = useState(client);
  const canSave = REQUIRED_CLIENT_FIELDS.every(f => (form[f] || '').trim());
  return (
    <div className="ap-modal-overlay" onClick={onCancel}>
      <div className="ap-modal" onClick={e => e.stopPropagation()}>
        <h3>{form.id ? 'Edit Client' : 'New Client'}</h3>
        {['contactName', 'phone', 'email', 'address', 'society'].map(field => (
          <label key={field} className="ap-field">
            <span>{field}{REQUIRED_CLIENT_FIELDS.includes(field) ? ' *' : ''}</span>
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
        <label className="ap-field">
          <span>Other Details — notes about the customer</span>
          <textarea rows={2} value={form.otherDetails || ''} onChange={e => setForm(f => ({ ...f, otherDetails: e.target.value }))} />
        </label>
        {form.id && (
          <label className="ap-field">
            <span>Status</span>
            <button
              type="button"
              className={form.isActive === false ? 'ap-act ap-act-activate' : 'ap-act ap-act-deactivate'}
              onClick={() => setForm(f => ({ ...f, isActive: f.isActive === false }))}
            >
              {form.isActive === false ? '↩️ Restore this client' : '🗄️ Archive (Hide) this client'}
            </button>
          </label>
        )}
        {!canSave && <p className="ap-warn">Name and Phone are required — everything else can be filled in later.</p>}
        <div className="ap-modal-actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="ap-btn-primary" onClick={() => onSave(form)} disabled={!canSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

function ProjectForm({ project, client, onCancel, onSave, knownPainters = [] }) {
  const [form, setForm] = useState({ ...project });
  const [clientName, setClientName] = useState(client?.contactName || '');
  const [clientPhone, setClientPhone] = useState(client?.phone || '');
  const [newPainter, setNewPainter] = useState('');
  const [newPaintType, setNewPaintType] = useState('');
  function field(key, value) { setForm(f => ({ ...f, [key]: value })); }
  // Total Amount and Token Received drive Pending Amount automatically —
  // still a plain number field underneath, so a manual override still works
  // if the auto-calculated figure isn't what's actually owed.
  function setAmount(value) {
    const amount = Number(value);
    setForm(f => ({ ...f, amount, pendingAmount: Math.max(0, amount - (f.tokenReceived || 0)) }));
  }
  function setTokenReceived(value) {
    const tokenReceived = Number(value);
    setForm(f => ({ ...f, tokenReceived, pendingAmount: Math.max(0, (f.amount || 0) - tokenReceived) }));
  }
  function submit() { onSave(form, { contactName: clientName, phone: clientPhone }); }
  const painterOptions = [...new Set([...DEFAULT_PAINTERS, ...knownPainters])].sort();
  const selectedPainters = form.painterNames || [];
  // paintType stays a plain string on the backend (no schema change) — tiles
  // just read/write it as a comma-joined list, same as the old free-text field did.
  const selectedPaintTypes = (form.paintType || '').split(',').map(s => s.trim()).filter(Boolean);
  function togglePaintType(name) {
    const next = selectedPaintTypes.includes(name)
      ? selectedPaintTypes.filter(p => p !== name)
      : [...selectedPaintTypes, name];
    field('paintType', next.join(', '));
  }
  function addNewPaintType() {
    const name = newPaintType.trim();
    if (!name || selectedPaintTypes.includes(name)) return;
    field('paintType', [...selectedPaintTypes, name].join(', '));
    setNewPaintType('');
  }
  const selectedSteps = (form.workProcess || '').split(',').map(s => s.trim()).filter(Boolean);
  function toggleStep(name) {
    field('workProcess', (selectedSteps.includes(name)
      ? selectedSteps.filter(s => s !== name)
      : [...selectedSteps, name]).join(', '));
  }
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
  // Order carries the meaning — first selected is Primary, the rest Secondary
  // (matches how painterNames is already stored, so no schema change needed).
  function makePrimary(name) {
    field('painterNames', [name, ...selectedPainters.filter(p => p !== name)]);
  }
  return (
    <div className="ap-modal-overlay" onClick={onCancel}>
      <div className="ap-modal ap-modal-wide" onClick={e => e.stopPropagation()}>
        <h3>{form.id ? 'Edit Project' : 'New Project'}</h3>
        <div className="ap-form-grid">
          <label className="ap-field"><span>Client Name</span><input value={clientName} onChange={e => setClientName(e.target.value)} /></label>
          <label className="ap-field"><span>Client Mobile</span><input value={clientPhone} onChange={e => setClientPhone(e.target.value)} /></label>
          <label className="ap-field"><span>Project Name</span><input value={form.name} onChange={e => field('name', e.target.value)} placeholder="e.g. 3BHK Interior Repaint" /></label>
          <label className="ap-field">
            <span>Progress</span>
            <select value={form.progress} onChange={e => field('progress', e.target.value)}>
              {PROGRESS_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label className="ap-field"><span>Date Contacted</span><input type="date" value={form.dateContacted} onChange={e => field('dateContacted', e.target.value)} /></label>
          <label className="ap-field"><span>Date Started</span><input type="date" value={form.dateStarted} onChange={e => field('dateStarted', e.target.value)} /></label>
          <label className="ap-field"><span>Date Completed</span><input type="date" value={form.dateCompleted} onChange={e => field('dateCompleted', e.target.value)} /></label>
          <label className="ap-field">
            <span>No Of Days</span>
            <input value={form.noOfDays} onChange={e => field('noOfDays', e.target.value)} list="ap-no-of-days-options" />
            <datalist id="ap-no-of-days-options">
              {NO_OF_DAYS_OPTIONS.map(n => <option key={n} value={n} />)}
            </datalist>
          </label>
          <label className="ap-field"><span>Total Amount (₹)</span><input type="number" value={form.amount} onFocus={e => e.target.select()} onChange={e => setAmount(e.target.value)} /></label>
          <label className="ap-field"><span>Token Received (₹)</span><input type="number" value={form.tokenReceived} onFocus={e => e.target.select()} onChange={e => setTokenReceived(e.target.value)} /></label>
          <label className="ap-field"><span>Pending Amount (₹) — auto-filled, editable if it needs an override</span><input type="number" value={form.pendingAmount} onFocus={e => e.target.select()} onChange={e => field('pendingAmount', Number(e.target.value))} /></label>
        </div>
        <label className="ap-field"><span>Paint Type — tap all used on this job</span></label>
        <div className="ap-paint-type-tiles">
          {PAINT_TYPES.map(name => (
            <button
              key={name}
              type="button"
              className={`ap-paint-type-tile${selectedPaintTypes.includes(name) ? ' selected' : ''}`}
              onClick={() => togglePaintType(name)}
            >
              {selectedPaintTypes.includes(name) && <span className="ap-paint-type-check">✓</span>}
              {name}
            </button>
          ))}
        </div>
        <div className="ap-quote-item-row">
          <input placeholder="Add another paint type…" value={newPaintType} onChange={e => setNewPaintType(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNewPaintType())} />
          <button type="button" className="ap-add-item-btn" onClick={addNewPaintType} disabled={!newPaintType.trim()}>+ Add</button>
        </div>
        <label className="ap-field"><span>Process — what's committed to the customer</span></label>
        <div className="ap-paint-type-tiles">
          {WORK_PROCESS_STEPS.map(name => (
            <button
              key={name}
              type="button"
              className={`ap-paint-type-tile${selectedSteps.includes(name) ? ' selected' : ''}`}
              onClick={() => toggleStep(name)}
            >
              {selectedSteps.includes(name) && <span className="ap-paint-type-check">✓</span>}
              {name}
            </button>
          ))}
        </div>
        <label className="ap-field"><span>Painters — tap all who worked this job</span></label>
        <div className="ap-painter-icon-grid">
          {painterOptions.map(name => {
            const selected = selectedPainters.includes(name);
            return (
              <button
                key={name}
                type="button"
                className={`ap-painter-icon-btn${selected ? ' selected' : ''}`}
                onClick={() => togglePainter(name)}
                title={name}
              >
                <span className="ap-painter-avatar" style={{ background: avatarColor(name) }}>
                  {name.trim().charAt(0).toUpperCase() || '?'}
                  {selected && <span className="ap-painter-check">✓</span>}
                </span>
                <span className="ap-painter-icon-name">{name}</span>
              </button>
            );
          })}
        </div>
        <div className="ap-quote-item-row">
          <input placeholder="Add a new painter…" value={newPainter} onChange={e => setNewPainter(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNewPainter())} />
          <button type="button" className="ap-add-item-btn" onClick={addNewPainter} disabled={!newPainter.trim()}>+ Add</button>
        </div>
        {selectedPainters.length > 1 && (
          <div className="ap-primary-painter-list">
            {selectedPainters.map((name, i) => (
              <div key={name} className="ap-primary-painter-row">
                <span className={i === 0 ? 'ap-primary-badge' : 'ap-secondary-badge'}>{i === 0 ? '★ Primary' : 'Secondary'}</span>
                <span>{name}</span>
                {i !== 0 && <button type="button" className="ap-link" onClick={() => makePrimary(name)}>Make Primary</button>}
              </div>
            ))}
          </div>
        )}
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
function PaymentReceiptModal({ project, client, onClose, onAddPayment, onDeletePayment, onToggleArchivePayment }) {
  const cardRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [previewBlob, setPreviewBlob] = useState(null);
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [addingPayment, setAddingPayment] = useState(false);
  const [addStatus, setAddStatus] = useState(null); // { ok: bool, text: string } | null
  if (!project) return null;

  async function handleAddPayment() {
    const amount = Number(newAmount);
    if (!amount || amount <= 0) return;
    setAddingPayment(true);
    setAddStatus(null);
    try {
      await onAddPayment(project.id, newDate, amount);
      setNewAmount('');
      // Payment History sits above this form, off-screen once you've
      // scrolled down to add one — without this, a successful add looked
      // identical to a silently failed one.
      setAddStatus({ ok: true, text: `✓ Added ₹${amount.toLocaleString('en-IN')} — see updated totals above` });
      setTimeout(() => setAddStatus(null), 5000);
    } catch (e) {
      setAddStatus({ ok: false, text: `Could not add payment — ${e.message}` });
    } finally {
      setAddingPayment(false);
    }
  }

  const allHistory = project.tokenHistory || [];
  // Archived entries are pulled out of every customer-visible surface —
  // the shareable card, the WhatsApp text, and the totals above — while
  // still existing in allHistory so the admin can find and restore them.
  const history = allHistory.filter(e => !e.archived);
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
      const canvas = await captureCard(cardRef.current, '#0d2137');
      canvas.toBlob(blob => { setPreviewBlob(blob); setCapturing(false); }, 'image/png');
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
            <img className="aq-card-logo-img" src="/logo-header.png" alt="" />
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
          {addStatus && (
            <p className={addStatus.ok ? 'ap-add-payment-ok' : 'ap-warn ap-warn-error'} style={{ marginTop: 8 }}>{addStatus.text}</p>
          )}
        </div>

        {allHistory.length > 0 && (
          <div className="ap-calc-box" style={{ padding: 16 }}>
            <div className="ap-calc-hint" style={{ marginBottom: 8 }}>
              Manage entries — archived ones drop out of the receipt, WhatsApp text, and totals above, but stay here to undo. Delete removes an entry for good.
            </div>
            {allHistory.map((e, i) => (
              <div key={i} className="ap-card-row" style={{ padding: '6px 0' }}>
                <span>
                  📅 {e.date} — ₹{(e.amount || 0).toLocaleString('en-IN')}
                  {e.archived && <span className="ap-progress-chip ap-progress-inactive" style={{ marginLeft: 8 }}>🗄️ Archived</span>}
                </span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <button
                    className={e.archived ? 'ap-act ap-act-activate' : 'ap-act ap-act-deactivate'}
                    onClick={() => onToggleArchivePayment(project.id, i)}
                  >
                    {e.archived ? '↩️ Restore' : '🗄️ Archive'}
                  </button>
                  <button className="ap-danger" onClick={() => onDeletePayment(project.id, i)}>🗑️ Delete</button>
                </span>
              </div>
            ))}
          </div>
        )}

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
      {previewBlob && (
        <SharePreviewModal blob={previewBlob} filename="receipt-thepainterboys.png"
          shareTitle="Payment Summary — The Painter Boys" onClose={() => setPreviewBlob(null)} />
      )}
    </div>
  );
}

// ── Thank You card (new inquiries) ─────────────────────────────────
function ThankYouCardModal({ client, onClose }) {
  const cardRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [previewBlob, setPreviewBlob] = useState(null);
  const name = client?.contactName || 'Customer';

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
      const canvas = await captureCard(cardRef.current, null);
      canvas.toBlob(blob => { setPreviewBlob(blob); setCapturing(false); }, 'image/png');
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
            <img className="aq-card-logo-img" src="/logo-header.png" alt="" />
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
      {previewBlob && (
        <SharePreviewModal blob={previewBlob} filename="thankyou-thepainterboys.png"
          shareTitle="The Painter Boys" onClose={() => setPreviewBlob(null)} />
      )}
    </div>
  );
}

// ── Manual client↔user link (fallback for when auto-link-by-email
// on sign-in didn't happen, e.g. missing/wrong email at intake) ────
function LinkedAccountBox({ client, users, onLink, onUnlink, onGenerateInvite }) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [busy, setBusy] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [showManual, setShowManual] = useState(false);
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
      const name = client.contactName || 'there';
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
      <h3>🔗 Associate Project with Client's Email ID</h3>
      {linkedUser ? (
        <div className="ap-card-row" style={{ padding: '6px 0' }}>
          <span>✅ {linkedUser.name} <span className="ap-calc-formula">({linkedUser.email})</span></span>
          <button className="ap-danger" disabled={busy} onClick={handleUnlink}>Unlink</button>
        </div>
      ) : (
        <>
          <p className="ap-calc-hint">Not linked yet — the customer won't see this project on their dashboard until it is.</p>

          <button className="ap-btn-primary ap-upload-btn" disabled={sendingInvite || !client.phone} onClick={handleSendInvite}>
            {sendingInvite ? '⏳ Preparing…' : '💬 Send Sign-In Link via WhatsApp'}
          </button>
          <p className="ap-calc-hint">They tap the link, sign in with Google, and it connects automatically — no code needed.</p>
          {!client.phone && <p className="ap-calc-hint">Add a phone number for this client to send it.</p>}

          {!showManual ? (
            <button type="button" className="ap-link" onClick={() => setShowManual(true)} style={{ marginTop: 10, fontSize: '.85rem' }}>
              Already signed in on their own? Link their account manually
            </button>
          ) : (
            <div className="ap-quote-item-row" style={{ marginTop: 10 }}>
              <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} style={{ flex: 1, padding: '9px 12px', border: '1.5px solid var(--hairline)', borderRadius: 6 }}>
                <option value="">Select a signed-in user…</option>
                {emailMatch && <option value={emailMatch.id}>⭐ {emailMatch.name} ({emailMatch.email}) — email matches</option>}
                {candidates.filter(u => u !== emailMatch).map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email}){u.linkedClientId ? ' — already linked elsewhere' : ''}</option>
                ))}
              </select>
              <button className="ap-btn-primary" disabled={!selectedUserId || busy} onClick={handleLink}>Link</button>
            </div>
          )}
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
  const selectedPaintTypes = (form.paintType || '').split(',').map(s => s.trim()).filter(Boolean);
  function togglePaintType(name) {
    const next = selectedPaintTypes.includes(name)
      ? selectedPaintTypes.filter(p => p !== name)
      : [...selectedPaintTypes, name];
    field('paintType', next.join(', '));
  }
  const selectedSteps = (form.workProcess || '').split(',').map(s => s.trim()).filter(Boolean);
  function toggleStep(name) {
    field('workProcess', (selectedSteps.includes(name)
      ? selectedSteps.filter(s => s !== name)
      : [...selectedSteps, name]).join(', '));
  }
  const amount = Number(form.totalAmount) || 0;
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
          <label className="ap-field">
            <span>Society</span>
            <input value={form.society} onChange={e => field('society', e.target.value)} list="ap-quote-society-options" />
            <datalist id="ap-quote-society-options">
              {DEFAULT_SOCIETIES.map(s => <option key={s} value={s} />)}
            </datalist>
          </label>
          <label className="ap-field"><span>BHK</span><input value={form.bhk} onChange={e => field('bhk', e.target.value)} placeholder="e.g. 3 BHK" /></label>
        </div>
        <label className="ap-field"><span>Space Type</span></label>
        <div className="ap-paint-type-tiles">
          {SPACE_TYPES.map(name => (
            <button
              key={name}
              type="button"
              className={`ap-paint-type-tile${form.spaceType === name ? ' selected' : ''}`}
              onClick={() => field('spaceType', form.spaceType === name ? '' : name)}
            >
              {form.spaceType === name && <span className="ap-paint-type-check">✓</span>}
              {name}
            </button>
          ))}
        </div>
        <label className="ap-field">
          <span>Or describe it yourself</span>
          <input value={SPACE_TYPES.includes(form.spaceType) ? '' : form.spaceType} onChange={e => field('spaceType', e.target.value)} placeholder="e.g. Basement, Terrace, Office lobby" />
        </label>
        <label className="ap-field"><span>Paint Type — tap all that apply</span></label>
        <div className="ap-paint-type-tiles">
          {PAINT_TYPES.map(name => (
            <button
              key={name}
              type="button"
              className={`ap-paint-type-tile${selectedPaintTypes.includes(name) ? ' selected' : ''}`}
              onClick={() => togglePaintType(name)}
            >
              {selectedPaintTypes.includes(name) && <span className="ap-paint-type-check">✓</span>}
              {name}
            </button>
          ))}
        </div>
        <label className="ap-field"><span>Scope of Work — tap all that apply</span></label>
        <div className="ap-paint-type-tiles">
          {WORK_PROCESS_STEPS.map(name => (
            <button
              key={name}
              type="button"
              className={`ap-paint-type-tile${selectedSteps.includes(name) ? ' selected' : ''}`}
              onClick={() => toggleStep(name)}
            >
              {selectedSteps.includes(name) && <span className="ap-paint-type-check">✓</span>}
              {name}
            </button>
          ))}
        </div>
        <label className="ap-field">
          <span>Total Project Amount (₹)</span>
          <input type="number" value={form.totalAmount} onFocus={e => e.target.select()} onChange={e => field('totalAmount', e.target.value)} />
        </label>
        {amount > 0 && <div className="ap-calc-result">Total Quotation: <strong>₹{amount.toLocaleString('en-IN')}</strong></div>}
        <div className="ap-modal-actions">
          <button className="ap-btn-primary" disabled={!canGenerate} onClick={() => setShowPreview(true)}>Generate Quotation</button>
        </div>
        {!canGenerate && <p className="ap-calc-hint">Customer name and a total project amount are required.</p>}
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
  const [previewBlob, setPreviewBlob] = useState(null);
  const { society, customerName, mobile, bhk, paintType, spaceType, workProcess, amount, areaSqFt, ratePerSqFt } = quotation;
  const steps = (workProcess || '').split(',').map(s => s.trim()).filter(Boolean);
  const quoteDate = new Date();
  const quoteDateStr = quoteDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const validUntil = new Date(quoteDate.getTime() + 3 * 24 * 60 * 60 * 1000)
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
    ...steps.map(s => `✔️ ${s}`),
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
      const canvas = await captureCard(cardRef.current, '#0d2137');
      canvas.toBlob(blob => { setPreviewBlob(blob); setCapturing(false); }, 'image/png');
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
            <img className="aq-card-logo-img" src="/logo-header.png" alt="" />
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
            {spaceType && <div className="aq-card-row"><span>Space Type</span><span>{spaceType}</span></div>}
            {paintType && <div className="aq-card-row"><span>Paint Type</span><span>{paintType}</span></div>}
            {areaSqFt && <div className="aq-card-row"><span>Est. Painting Area</span><span>{areaSqFt.toLocaleString('en-IN')} sq ft</span></div>}
          </div>
          <div className="aq-card-section">
            <div className="aq-card-section-title">Scope of Work</div>
            <div className="aq-card-item-table">
              {steps.map((s, i) => (
                <div key={i} className="aq-card-item-row">
                  <span>✔️ {s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="aq-card-total">
            <span>Total Quotation{ratePerSqFt ? ` (₹${ratePerSqFt.toLocaleString('en-IN')}/sq ft)` : ''}</span>
            <span>₹{amount.toLocaleString('en-IN')}</span>
          </div>
          <div className="aq-card-terms">
            <div>📌 Valid until <strong>{validUntil}</strong> (3 days from issue)</div>
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
      {previewBlob && (
        <SharePreviewModal blob={previewBlob} filename="quotation-thepainterboys.png"
          shareTitle="Quotation — The Painter Boys" onClose={() => setPreviewBlob(null)} />
      )}
    </div>
  );
}
