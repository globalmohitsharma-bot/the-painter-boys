import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import './PainterCard.css';

const DEFAULT_PAINTER_TOKENS = {
  'Fariyad': 'f8r2k9',
  'Jabbar':  'j4x7b1',
  'Rajeev':  'r9c3m6',
  'Raju':    'q5t8n2',
  'Sushant': 's2w6p4',
};
const LS_PID_MAP = 'pb_painter_token_map';

function getNameByToken(token) {
  const def = Object.entries(DEFAULT_PAINTER_TOKENS).find(([, v]) => v === token);
  if (def) return def[0];
  try {
    const m = JSON.parse(localStorage.getItem(LS_PID_MAP) || '{}');
    return m[token] || null;
  } catch { return null; }
}

const DESIGNATIONS = {
  'Rajeev':  'Director — Delivery & Operations',
  'Fariyad': 'Senior Expert Painter',
  'Jabbar':  'Senior Expert Painter',
  'Raju':    'Expert Painter',
  'Sushant': 'Expert Painter',
};

const TAGLINES = [
  'Making Every Wall Beautiful',
  'Excellence in Every Stroke',
  'Painting Homes with Pride',
];

export default function PainterCard() {
  const [name,    setName]    = useState('');
  const [sharing, setSharing] = useState(false);
  const [shared,  setShared]  = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid  = params.get('pid');
    const nameParam = params.get('name');
    if (pid) {
      const resolved = getNameByToken(pid);
      if (resolved) setName(resolved);
    } else if (nameParam) {
      setName(nameParam);
    }
  }, []);

  const designation = DESIGNATIONS[name] || 'Expert Painter';
  const tagline     = TAGLINES[(name.charCodeAt(0) || 0) % TAGLINES.length];

  const handleShare = async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      const waText = `Hi! I'm *${name}*, ${designation} at *The Painter Boys* 🎨\n\n📞 +91 78388 88509\n🌐 www.thepainterboys.com\n\n_${tagline}_\n\nFor premium home painting in Ghaziabad, Noida & Delhi NCR — call or WhatsApp us!`;

      canvas.toBlob(async (blob) => {
        const file = new File([blob], `${name}_ThePainterBoys.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: `${name} — The Painter Boys`,
            text: waText,
            files: [file],
          });
          setShared(true);
          setTimeout(() => setShared(false), 3000);
        } else {
          // Download the image then open WhatsApp
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${name}_ThePainterBoys.png`;
          link.click();
          setTimeout(() => {
            window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
          }, 800);
          setShared(true);
          setTimeout(() => setShared(false), 3000);
        }
        setSharing(false);
      }, 'image/png', 0.95);
    } catch {
      setSharing(false);
      const waText = `Hi! I'm *${name}*, ${designation} at *The Painter Boys* 🎨\n\n📞 +91 78388 88509\n🌐 www.thepainterboys.com\n\n${tagline}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
    }
  };

  if (!name) {
    return (
      <div className="pc-error-page">
        <div className="pc-error-icon">🎨</div>
        <div className="pc-error-brand">The Painter Boys</div>
        <div className="pc-error-msg">Card link is invalid.<br/>Please use your personal link.</div>
        <a href="/" className="pc-error-home">Go to Website</a>
      </div>
    );
  }

  return (
    <div className="pc-page">
      <div className="pc-preview-label">Your Business Card</div>

      {/* ── The Card ── */}
      <div className="pc-card" ref={cardRef}>
        <div className="pc-gold-stripe pc-gold-stripe-top" />

        <div className="pc-card-inner">
          <div className="pc-brand-row">
            <div className="pc-logo-icon">🎨</div>
            <div className="pc-brand-block">
              <div className="pc-the">THE PAINTER BOYS</div>
              <div className="pc-brand-sub">Professional Painting Services</div>
            </div>
          </div>

          <div className="pc-divider" />

          <div className="pc-name">{name}</div>
          <div className="pc-designation">{designation}</div>
          <div className="pc-tagline">✦ {tagline} ✦</div>

          <div className="pc-divider pc-divider-thin" />

          <div className="pc-contacts">
            <div className="pc-contact-row">
              <span className="pc-c-dot" />
              <span className="pc-c-label">Phone</span>
              <span className="pc-c-val">+91 78388 88509</span>
            </div>
            <div className="pc-contact-row">
              <span className="pc-c-dot" />
              <span className="pc-c-label">Web</span>
              <span className="pc-c-val">www.thepainterboys.com</span>
            </div>
            <div className="pc-contact-row">
              <span className="pc-c-dot" />
              <span className="pc-c-label">Areas</span>
              <span className="pc-c-val">Ghaziabad · Noida · Delhi NCR</span>
            </div>
          </div>
        </div>

        <div className="pc-card-footer">
          <span className="pc-footer-txt">Trusted Since 2010</span>
          <span className="pc-footer-sep">·</span>
          <span className="pc-footer-txt">500+ Homes Painted</span>
          <span className="pc-footer-sep">·</span>
          <span className="pc-footer-txt">⭐ 4.9 Rating</span>
        </div>

        <div className="pc-gold-stripe pc-gold-stripe-bot" />
      </div>

      {/* ── Share button ── */}
      <button className={`pc-share-btn${sharing ? ' pc-sharing' : ''}${shared ? ' pc-shared' : ''}`}
        onClick={handleShare} disabled={sharing}>
        {sharing ? '⏳ Preparing your card…'
          : shared ? '✓ Shared! Great job!'
          : '📤 Share My Card on WhatsApp'}
      </button>

      <div className="pc-hint">
        Tap the button above to share your card with clients instantly
      </div>

      <a href="/" className="pc-website-link">🌐 www.thepainterboys.com</a>
    </div>
  );
}
