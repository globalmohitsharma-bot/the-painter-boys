import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Helmet } from 'react-helmet-async';
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
  'Rajeev':  'Senior Manager : Delivery and Operations',
  'Fariyad': 'Senior Expert Painter',
  'Jabbar':  'Senior Expert Painter',
  'Raju':    'Expert Painter',
  'Sushant': 'Expert Painter',
};

// Personal numbers for painters who have one; others get corporate
const PAINTER_PHONES = {
  'Rajeev': { display: '+91 62022 40976', wa: '916202240976' },
  'Jabbar': { display: '+91 84489 37671', wa: '918448937671' },
};
const CORPORATE = { display: '+91 78388 88509', wa: '917838888509' };

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
    const pid       = params.get('pid');
    const nameParam = params.get('name');
    if (pid) {
      const resolved = getNameByToken(pid);
      if (resolved) setName(resolved);
    } else if (nameParam) {
      setName(nameParam);
    }
  }, []);

  if (!name) {
    return (
      <div className="pc-error-page">
        <div className="pc-error-icon">🎨</div>
        <div className="pc-error-brand">The Painter Boys</div>
        <div className="pc-error-msg">Card link is invalid.<br />Please use your personal link.</div>
        <a href="/" className="pc-error-home">Go to Website</a>
      </div>
    );
  }

  const designation  = DESIGNATIONS[name] || 'Expert Painter';
  const tagline      = TAGLINES[(name.charCodeAt(0) || 0) % TAGLINES.length];
  const personalPhone = PAINTER_PHONES[name] || null;
  const cardPhone    = personalPhone ? personalPhone.display : CORPORATE.display;

  const waShareText = personalPhone
    ? `*The Painter Boys* 🎨\n\n*${name}*\n${designation}\n\n📱 ${personalPhone.display}\n📞 ${CORPORATE.display}\n🌐 www.thepainterboys.com`
    : `*The Painter Boys* 🎨\n\n*${name}*\n${designation}\n\n📞 ${CORPORATE.display}\n🌐 www.thepainterboys.com`;

  const handleShare = async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, useCORS: true, backgroundColor: null, logging: false,
      });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `${name}_ThePainterBoys.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title: `${name} — The Painter Boys`, text: waShareText, files: [file] });
          setShared(true); setTimeout(() => setShared(false), 3000);
        } else {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${name}_ThePainterBoys.png`;
          link.click();
          setTimeout(() => window.open(`https://wa.me/?text=${encodeURIComponent(waShareText)}`, '_blank'), 800);
          setShared(true); setTimeout(() => setShared(false), 3000);
        }
        setSharing(false);
      }, 'image/png', 0.95);
    } catch {
      setSharing(false);
      window.open(`https://wa.me/?text=${encodeURIComponent(waShareText)}`, '_blank');
    }
  };

  return (
    <div className="pc-page">
      <Helmet>
        <title>{name} — {designation} | The Painter Boys</title>
        <meta name="description" content={`${name}, ${designation} at The Painter Boys. Contact: ${cardPhone}.`} />
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="pc-preview-label">Your Business Card</div>

      {/* ── Visual card (captured by html2canvas) ── */}
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
            {personalPhone && (
              <div className="pc-contact-row">
                <span className="pc-c-dot" />
                <span className="pc-c-label">Direct</span>
                <span className="pc-c-val">{personalPhone.display}</span>
              </div>
            )}
            <div className="pc-contact-row">
              <span className="pc-c-dot" />
              <span className="pc-c-label">{personalPhone ? 'Office' : 'Phone'}</span>
              <span className="pc-c-val">{CORPORATE.display}</span>
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
          <span className="pc-footer-txt">2000+ Homes Painted</span>
          <span className="pc-footer-sep">·</span>
          <span className="pc-footer-txt">⭐ 4.9 Rating</span>
        </div>

        <div className="pc-gold-stripe pc-gold-stripe-bot" />
      </div>

      {/* ── Share button ── */}
      <button
        className={`pc-share-btn${sharing ? ' pc-sharing' : ''}${shared ? ' pc-shared' : ''}`}
        onClick={handleShare} disabled={sharing}>
        {sharing ? '⏳ Preparing your card…'
          : shared  ? '✓ Shared! Great job!'
          : '📤 Share My Card on WhatsApp'}
      </button>

      <div className="pc-hint">Tap above to share your card with clients instantly</div>

      {/* ── Clickable action links (not captured in image) ── */}
      <div className="pc-actions">
        <a className="pc-action pc-action-wa"
          href={`https://wa.me/${CORPORATE.wa}?text=${encodeURIComponent('Hello, I want to know more about your painting services.')}`}
          target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="currentColor" className="pc-action-icon">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span>WhatsApp Corporate</span>
        </a>

        <a className="pc-action pc-action-web"
          href="https://www.thepainterboys.com"
          target="_blank" rel="noopener noreferrer">
          🌐 <span>Visit Website</span>
        </a>

        <a className="pc-action pc-action-portal" href="/pb">
          🔐 <span>Staff Portal</span>
        </a>
      </div>
    </div>
  );
}
