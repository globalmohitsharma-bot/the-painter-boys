import { useState, useCallback } from 'react';

// Shared Google sign-in state, used independently by both SiteHeader (desktop
// account icon) and BottomNav (mobile My Projects/Profile tabs) — each keeps
// its own React state, kept in sync via the same localStorage key rather than
// lifting state up, since only one of the two triggers is ever visible at a
// time (responsive CSS), so real-time cross-component reactivity isn't needed.
const USER_KEY = 'pb_google_user';
// Same key MyProjects.jsx reads its session token from — writing it here too
// means signing in once from the header carries over to the dashboard
// instead of prompting a second, separate Google sign-in for the same user.
const DASHBOARD_TOKEN_KEY = 'pb_mine_id_token';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5223';

function loadStoredUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}

// Sentinel the backend's dev-only bypass recognizes (see
// GoogleTokenAuthenticationHandler.DevTestToken) — lets the whole sign-in
// flow, including real API calls, be exercised locally without a real
// Google account. Only ever reachable via the DEV-gated button below.
export const DEV_TEST_TOKEN = 'DEV_TEST_TOKEN';
const DEV_TEST_PAYLOAD = { name: 'Test User', email: 'testuser@test.com', picture: null };

// Decodes the ID token's payload for display only (name/email/picture) — this
// is NOT a verified/secure auth check (verifying the signature needs a
// backend, which doesn't exist yet), just enough to show a signed-in state.
export function decodeIdToken(token) {
  if (token === DEV_TEST_TOKEN) return DEV_TEST_PAYLOAD;
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export default function useGoogleAccount() {
  const [user, setUser] = useState(loadStoredUser);

  // Memoized so AccountModal's effect (which depends on this callback) doesn't
  // re-run — and re-call google.accounts.id.initialize() — on every parent
  // re-render. GIS explicitly logs a warning when initialize() is called more
  // than once and only keeps the *last* call's config, so an unstable callback
  // reference here was silently causing the sign-in button to lose its client
  // ID after any unrelated re-render (e.g. the header's scroll-position state).
  const handleCredential = useCallback(async (response) => {
    const payload = decodeIdToken(response.credential);
    if (!payload) return;
    // Show the sign-in immediately from the (unverified) token payload, then
    // upgrade in the background with the server-verified role — the profile
    // modal's staff/admin links only render once role/isStaff arrive, so a
    // slow or unreachable backend just means those links stay hidden rather
    // than blocking sign-in itself.
    const nextUser = { name: payload.name, email: payload.email, picture: payload.picture };
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    sessionStorage.setItem(DASHBOARD_TOKEN_KEY, response.credential);

    try {
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      });
      if (!res.ok) return;
      const whoami = await res.json();
      const verifiedUser = {
        name: whoami.name || payload.name,
        email: whoami.email,
        picture: payload.picture,
        role: whoami.role,
        isStaff: whoami.isStaff,
      };
      setUser(verifiedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(verifiedUser));
      // Staff still need the modal's choice between Admin Portal and Staff
      // Portal — only regular customers skip straight through, since for
      // them there's only ever one place to land anyway.
      if (!whoami.isStaff) window.location.href = '/my-projects';
    } catch {
      // Backend unreachable — the customer sign-in above already succeeded
      // (its raw token is already stored for the dashboard to use), so send
      // them there anyway rather than stranding them on this modal.
      window.location.href = '/my-projects';
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(DASHBOARD_TOKEN_KEY);
    window.google?.accounts?.id?.disableAutoSelect?.();
  }, []);

  return { user, handleCredential, signOut };
}
