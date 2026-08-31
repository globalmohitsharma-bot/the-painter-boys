import { useState } from 'react';
import useInstallPrompt from './useInstallPrompt.js';

// Renders nothing once the app is already installed or the platform gives
// no way to install at all (desktop Firefox, etc.) — canInstall handles
// that. Styling is left entirely to the caller (className/children) since
// this gets dropped into two visually unrelated systems: the public site's
// Icon-based nav and the Admin Portal's emoji-based ap-* buttons. The iOS
// instructions modal uses inline styles for the same reason — portable
// without needing a shared stylesheet import in both places.
export default function InstallAppButton({ className, children }) {
  const { canInstall, promptInstall } = useInstallPrompt();
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  if (!canInstall) return null;

  async function handleClick() {
    const result = await promptInstall();
    if (result === 'manual') setShowIOSHelp(true);
  }

  return (
    <>
      <button type="button" className={className} onClick={handleClick}>{children}</button>
      {showIOSHelp && (
        <div
          onClick={() => setShowIOSHelp(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(8,22,39,.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fffdf8', borderRadius: 14, padding: 24, maxWidth: 340, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,.3)' }}
          >
            <h3 style={{ margin: '0 0 14px', fontFamily: 'Georgia, serif', color: '#0d2137', fontSize: '1.1rem' }}>Add to Home Screen</h3>
            <ol style={{ margin: 0, paddingLeft: 20, color: '#334155', fontSize: '.92rem', lineHeight: 1.7 }}>
              <li>Tap the <strong>Share</strong> icon (□↑) at the bottom of Safari</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong> — that's it</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSHelp(false)}
              style={{ marginTop: 18, width: '100%', padding: '10px 16px', borderRadius: 8, border: 'none', background: '#f2871f', color: '#fff', fontWeight: 700, fontSize: '.92rem', cursor: 'pointer' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
