import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import html2canvas from 'html2canvas';
import SiteHeader from './SiteHeader.jsx';
import SiteFooter from './SiteFooter.jsx';
import Icon from './Icon.jsx';
import { SITE_URL, PHONE, WA_LINK_DEFAULT } from './siteConfig.js';
import { TEAM } from './siteData.js';
import './Home.css';
import './Blog.css';

// Same lift-the-scroll-clip trick the Admin Portal's receipt/quotation cards
// use — html2canvas otherwise renders a scrollable ancestor at its current
// clipped viewport, silently cutting off anything below the fold.
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

const TC_THEME_BG = { blue: '#0d2137', black: '#050505', white: '#ffffff' };

function TeamShareCard({ member, onClose }) {
  const cardRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewBlob, setPreviewBlob] = useState(null);
  const [theme, setTheme] = useState('blue');
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function shareAsImage() {
    if (!cardRef.current || capturing) return;
    setCapturing(true);
    try {
      const canvas = await captureCard(cardRef.current, TC_THEME_BG[theme]);
      canvas.toBlob(blob => {
        setPreviewBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setCapturing(false);
      }, 'image/png');
    } catch { setCapturing(false); }
  }

  async function handleShareImage() {
    const file = new File([previewBlob], `${member.slug}-the-painter-boys.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: `${member.name} — The Painter Boys` }); }
      catch (err) { if (err?.name !== 'AbortError') downloadFallback(); }
    } else {
      downloadFallback();
    }
  }

  function downloadFallback() {
    const a = document.createElement('a');
    a.href = previewUrl; a.download = `${member.slug}-the-painter-boys.png`; a.click();
    alert('This browser can\'t hand the image straight to WhatsApp — image downloaded instead. On a phone, this button opens the share sheet with WhatsApp as an option directly.');
  }

  function shareAsText() {
    const text = [
      `🎨 *The Painter Boys*`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *${member.name}*`,
      member.role,
      ``,
      member.bio,
      ``,
      `📞 Corporate: ${PHONE}`,
      `🌐 www.thepainterboys.com`,
    ].join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  return (
    <div className="tc-overlay" onClick={onClose}>
      <div className="tc-wrap" onClick={e => e.stopPropagation()}>
        {previewUrl ? (
          <>
            <img src={previewUrl} alt={`${member.name} share card`} className="tc-preview-img" />
            <div className="tc-actions">
              <button className="tc-share-btn" onClick={handleShareImage}>📤 Share on WhatsApp</button>
              <button className="tc-close-btn" onClick={onClose}>✕ Close</button>
            </div>
          </>
        ) : (
          <>
            <div className="tc-theme-picker">
              {['blue', 'black', 'white'].map(t => (
                <button key={t} type="button"
                  className={`tc-theme-swatch tc-theme-swatch-${t}${theme === t ? ' active' : ''}`}
                  onClick={() => setTheme(t)} aria-label={`${t} card theme`} title={`${t[0].toUpperCase()}${t.slice(1)} card`} />
              ))}
            </div>
            <div className={`tc-card tc-card-${theme}`} ref={cardRef}>
              <div className="tc-card-frame">
                <div className="tc-card-header">
                  <img className="tc-card-logo-img" src="/logo-header.png" alt="" />
                  <div className="tc-card-company">The Painter Boys</div>
                  <div className="tc-card-tagline">Professional Painting Services</div>
                </div>
                {member.img
                  ? <img src={member.img} alt="" className="tc-card-photo" />
                  : <div className="tc-card-avatar" style={{ background: member.color }}>{member.initials}</div>}
                <div className="tc-card-name">{member.name}</div>
                <div className="tc-card-role">{member.role}</div>
                <div className="tc-card-divider" />
                <p className="tc-card-bio">{member.bio}</p>
                <div className="tc-card-footer">
                  <div style={{ fontSize: '.7rem', marginBottom: 2 }}>📱 Register at thepainterboys.com for the best service, full traceability & after-service support</div>
                  <div>📞 Corporate: {PHONE}</div>
                  <div>🌐 www.thepainterboys.com</div>
                </div>
              </div>
            </div>
            <div className="tc-actions">
              <button className="tc-share-btn" onClick={shareAsImage} disabled={capturing}>
                {capturing ? '⏳ Preparing…' : '📤 Share Image on WhatsApp'}
              </button>
              <button className="tc-share-btn tc-share-text" onClick={shareAsText}>💬 Send as WhatsApp Text</button>
              <button className="tc-close-btn" onClick={onClose}>✕ Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TeamDetail() {
  const { slug } = useParams();
  const member = TEAM.find(t => t.slug === slug);
  const [showCard, setShowCard] = useState(false);

  if (!member) {
    return (
      <div className="home">
        <SiteHeader />
        <main className="page-fade">
          <div className="inner-page">
            <div className="page-content-white">
              <div className="container section" style={{ textAlign: 'center' }}>
                <h1>Team member not found</h1>
                <Link to="/team" className="btn-primary">← Back to Our Team</Link>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const title = `${member.name} — ${member.role} | The Painter Boys`;

  return (
    <div className="home">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={member.bio.slice(0, 155)} />
        <link rel="canonical" href={`${SITE_URL}/team/${member.slug}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={member.bio.slice(0, 155)} />
        <meta property="og:url" content={`${SITE_URL}/team/${member.slug}`} />
        <meta property="og:type" content="profile" />
      </Helmet>
      <SiteHeader />
      <main className="page-fade">
        <div className="inner-page">
          <div className="page-hero page-hero-dark">
            <div className="ph-content">
              <Link to="/team" className="blog-back-link">← Our Team</Link>
            </div>
          </div>
          <div className="page-content-white">
            <div className="container section team-detail-body">
              {member.img
                ? <img src={member.img} alt={`${member.name}, ${member.role} at The Painter Boys`} className="team-modal-photo"
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                : null}
              <div className="team-modal-avatar" style={{ background: member.color, display: member.img ? 'none' : 'flex' }}>
                {member.initials}
              </div>
              <h1 className="team-modal-name">{member.name}</h1>
              <div className="team-modal-role">{member.role}</div>
              <p className="team-modal-bio">{member.bio}</p>
              <div className="sec-cta">
                <a className="btn-primary" href={WA_LINK_DEFAULT} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={17} />Get in Touch
                </a>
                <button type="button" className="btn-secondary" onClick={() => setShowCard(true)}>
                  📤 Share My Card
                </button>
                <Link to="/team" className="btn-secondary">← All Team Members</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
      {showCard && <TeamShareCard member={member} onClose={() => setShowCard(false)} />}
    </div>
  );
}
