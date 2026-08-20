import { useState } from 'react';

// Shared Google sign-in state, used independently by both SiteHeader (desktop
// account icon) and BottomNav (mobile My Projects/Profile tabs) — each keeps
// its own React state, kept in sync via the same localStorage key rather than
// lifting state up, since only one of the two triggers is ever visible at a
// time (responsive CSS), so real-time cross-component reactivity isn't needed.
const USER_KEY = 'pb_google_user';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5223';

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

  async function handleCredential(response) {
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
    } catch {
      // Backend unreachable — the customer sign-in above already succeeded,
      // this just means no staff/admin links this session.
    }
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    window.google?.accounts?.id?.disableAutoSelect?.();
  }

  return { user, handleCredential, signOut };
}
