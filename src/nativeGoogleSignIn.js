import { Capacitor } from '@capacitor/core';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';

// Google blocks its web Sign-In SDK (accounts.google.com/gsi/client) inside
// any embedded app WebView, by policy — it just fails with a generic "origin
// not allowed" error there, no matter how the app is configured. Inside the
// Capacitor-wrapped app we use the native Credential Manager flow instead,
// still against the *same* Web OAuth Client ID our backend already verifies
// tokens against (see GoogleTokenAuthenticationHandler), so nothing else
// about sign-in needs to change once we have the idToken back.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const isNativeApp = () => Capacitor.isNativePlatform();

let initialized = false;

// Shaped like the GIS web callback's `response` object ({ credential }) so
// it can be handed straight to any existing onCredential(response) handler.
export async function nativeGoogleSignIn() {
  if (!initialized) {
    await GoogleSignIn.initialize({ clientId: GOOGLE_CLIENT_ID });
    initialized = true;
  }
  const result = await GoogleSignIn.signIn();
  return { credential: result.idToken };
}

// Clears the native credential state so the account picker shows again next
// time, instead of silently re-selecting whoever just signed out.
export async function nativeGoogleSignOut() {
  if (!isNativeApp()) return;
  try { await GoogleSignIn.signOut(); } catch { /* nothing stored yet — fine */ }
}
