import { useEffect, useSyncExternalStore } from 'react';

// Keeps the backend awake-and-ready from the UI's side. An App Service
// instance that has idled out (Free tier) or is mid-restart (any deploy)
// takes 10–30s to answer its first request — long enough that a plain
// fetch() can fail outright. Everything here exists so that a slow server
// only ever means "wait a bit", never "your change was lost":
//
// - Reads (GET) that fail or get a 502/503/504 wake the server and retry once.
// - Writes (anything else) never go out until /api/health has answered, and
//   are never retried automatically — a write that fails after that may
//   already have been applied server-side, so it surfaces as an error and
//   the form keeps what was typed for the user to send again.
// - Opening the Admin Portal or My Projects starts waking it straight away,
//   so it's usually ready by the time sign-in finishes.

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5223';

// Comfortably under App Service's ~20 min idle timeout — within this window
// a recent successful response is trusted without another health check.
const FRESH_MS = 5 * 60 * 1000;
const ATTEMPT_TIMEOUT_MS = 20000;
const MAX_WAIT_MS = 120000;
const RETRY_DELAY_MS = 3000;
const NOT_READY = new Set([502, 503, 504]);

let status = 'unknown'; // 'unknown' | 'waking' | 'ready' | 'unreachable'
let lastOkAt = 0;
let inFlight = null;
const listeners = new Set();

function setStatus(next) {
  if (status === next) return;
  status = next;
  listeners.forEach(l => l());
}

function markReady() {
  lastOkAt = Date.now();
  setStatus('ready');
}

function timeoutSignal(ms) {
  return typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined;
}

// Resolves true once the server answers its health check, false if it still
// hasn't after MAX_WAIT_MS. Concurrent callers share one wake attempt.
export function wakeApi({ force = false } = {}) {
  if (!force && status === 'ready' && Date.now() - lastOkAt < FRESH_MS) return Promise.resolve(true);
  if (inFlight) return inFlight;
  setStatus('waking');
  inFlight = (async () => {
    const deadline = Date.now() + MAX_WAIT_MS;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${API_BASE}/api/health`, { cache: 'no-store', signal: timeoutSignal(ATTEMPT_TIMEOUT_MS) });
        if (res.ok) { markReady(); return true; }
      } catch { /* still starting, or offline — keep trying until the deadline */ }
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    }
    setStatus('unreachable');
    return false;
  })().finally(() => { inFlight = null; });
  return inFlight;
}

export const NOT_SAVED_MESSAGE = 'The server is not responding right now — nothing was saved. Tap "Wake server" and try again.';

// Drop-in for fetch(`${API_BASE}${path}`, options) with the wait/retry rules above.
export async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const url = `${API_BASE}${path}`;

  if (method !== 'GET') {
    if (!(await wakeApi())) throw new Error(NOT_SAVED_MESSAGE);
    const res = await fetch(url, options);
    if (!NOT_READY.has(res.status)) markReady();
    return res;
  }

  try {
    const res = await fetch(url, options);
    if (!NOT_READY.has(res.status)) { markReady(); return res; }
  } catch { /* network-level failure — fall through to wake + retry */ }
  lastOkAt = 0;
  if (!(await wakeApi({ force: true }))) throw new Error('The server is not responding right now — showing your last saved copy.');
  const res = await fetch(url, options);
  if (!NOT_READY.has(res.status)) markReady();
  return res;
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useApiStatus() {
  return useSyncExternalStore(subscribe, () => status);
}

// Starts waking the server as soon as the calling page mounts, and again
// whenever the app comes back to the foreground after sitting in the
// background (phone locked, tab switched) long enough for it to idle out.
export function useWakeApiOnOpen() {
  useEffect(() => {
    wakeApi();
    const onVisible = () => { if (document.visibilityState === 'visible') wakeApi(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);
}
