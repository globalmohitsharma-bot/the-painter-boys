import { useState } from 'react';

// Shared Google sign-in state, used independently by both SiteHeader (desktop
// account icon) and BottomNav (mobile My Projects/Profile tabs) — each keeps
// its own React state, kept in sync via the same localStorage key rather than
// lifting state up, since only one of the two triggers is ever visible at a
// time (responsive CSS), so real-time cross-component reactivity isn't needed.
const USER_KEY = 'pb_google_user';

function loadStoredUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}

// Decodes the ID token's payload for display only (name/email/picture) — this
// is NOT a verified/secure auth check (verifying the signature needs a
// backend, which doesn't exist yet), just enough to show a signed-in state.
export function decodeIdToken(token) {
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

  return { user, handleCredential, signOut };
}
