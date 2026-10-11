import { useEffect, useState } from 'react';
import { useApiStatus, wakeApi } from './apiWake.js';
import './ServerStatus.css';

// Small pill showing whether the backend is ready, with a manual "Wake
// server" button for when it isn't — see apiWake.js for why this exists.
// `quiet` (customer-facing pages) hides it while all is well and only shows
// "waking" once it's taken long enough to notice, so a fast, already-awake
// server never flashes a status pill on every visit.
export default function ServerStatus({ className = '', quiet = false }) {
  const status = useApiStatus();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (status !== 'waking') { setSlow(false); return; }
    const t = setTimeout(() => setSlow(true), 1500);
    return () => clearTimeout(t);
  }, [status]);

  const cls = `srv-status srv-status-${status} ${className}`.trim();

  if (quiet && (status === 'ready' || status === 'unknown' || (status === 'waking' && !slow))) return null;
  if (status === 'ready') {
    return <span className={cls} title="Server is awake — changes save straight away"><span className="srv-dot" />Server ready</span>;
  }
  if (status === 'waking') {
    return <span className={cls} role="status"><span className="srv-dot" />Waking server… can take up to 30s</span>;
  }
  return (
    <span className={cls} role="status">
      <span className="srv-dot" />
      {status === 'unreachable' ? 'Server not responding' : 'Server status unknown'}
      <button type="button" className="srv-wake-btn" onClick={() => wakeApi({ force: true })}>Wake server</button>
    </span>
  );
}
