import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import './PainterBoard.css';

const CSV_URL  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRHqp1TWLyAEgydJ19b6vCJcTGCCxGrLcB1Mccw95xndfc9mbC1y5y3ev5T1njzE0evlvGIHA6OGH1/pub?gid=1417050744&single=true&output=csv';
const LS_PAINTER  = 'pb_painter_name';
const LS_KEY      = 'pb_script_url';
const LS_PAINTERS = 'pb_custom_painters';

const DEFAULT_PAINTERS = ['Fariyad','Jabbar','Rajeev','Raju','Sushant'];


const AVATAR_PALETTES = [
  'linear-gradient(135deg,#f59e0b,#ef4444)',  // amber→red
  'linear-gradient(135deg,#10b981,#059669)',  // emerald
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',  // purple
  'linear-gradient(135deg,#f97316,#dc2626)',  // orange→red
  'linear-gradient(135deg,#06b6d4,#0284c7)',  // cyan
  'linear-gradient(135deg,#ec4899,#be185d)',  // pink
  'linear-gradient(135deg,#84cc16,#16a34a)',  // lime→green
  'linear-gradient(135deg,#fb923c,#9333ea)',  // orange→purple
];
function avatarBg(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length];
};
const PAINTER_FIELDS   = ['paintername', 'painter name', 'painter'];
const PROGRESS_OPTIONS = ['Inquiry','Pending Visit','Not Started','In Progress','Completed','Cancelled'];

// ── Helpers ───────────────────────────────────────────────────────
function isPainterField(h) {
  return PAINTER_FIELDS.some(k => h.toLowerCase().replace(/\s+/g,'').includes(k.replace(/\s+/g,'')));
}
function parsePainters(val) {
  return val ? val.split(',').map(s => s.trim()).filter(Boolean) : [];
}
function formatDate(val) {
  if (!val) return '';
  const d = new Date(val + 'T00:00:00');
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}
function progressColor(val = '') {
  const v = val.toLowerCase();
  if (v.includes('compl'))  return { bg:'#0c1a2e', color:'#60a5fa', border:'#1d4ed8', cardBg:'linear-gradient(135deg,#dbeafe,#bfdbfe)', cardBorder:'#3b82f6' };
  if (v.includes('cancel')) return { bg:'#450a0a', color:'#fca5a5', border:'#991b1b', cardBg:'linear-gradient(135deg,#fee2e2,#fecaca)', cardBorder:'#ef4444' };
  if (v.includes('not s'))  return { bg:'#2d1f00', color:'#fbbf24', border:'#b45309', cardBg:'linear-gradient(135deg,#fef3c7,#fde68a)', cardBorder:'#f59e0b' };
  if (v.includes('progress') || v.includes('ongoing')) return { bg:'#052e16', color:'#4ade80', border:'#166534', cardBg:'linear-gradient(135deg,#d1fae5,#a7f3d0)', cardBorder:'#22c55e' };
  if (v.includes('inqu') || v.includes('pending'))    return { bg:'#1e0a3c', color:'#c084fc', border:'#7c3aed', cardBg:'linear-gradient(135deg,#ede9fe,#ddd6fe)', cardBorder:'#a855f7' };
  return { bg:'#2d1f00', color:'#fbbf24', border:'#b45309', cardBg:'linear-gradient(135deg,#fef3c7,#fde68a)', cardBorder:'#f59e0b' };
}
function withMr(name) {
  if (!name || name === '—') return name;
  return 'Mr. ' + name;
}
function getAllPainters() {
  try {
    const custom = JSON.parse(localStorage.getItem(LS_PAINTERS) || '[]');
    return [...new Set([...DEFAULT_PAINTERS, ...custom])].sort();
  } catch { return [...DEFAULT_PAINTERS]; }
}
function isTokenHistoryField(h) {
  const hl = h.toLowerCase().replace(/\s+/g,'');
  return hl === 'tokenhistory';
}
function isPainterAmountField(h) {
  if (isTokenHistoryField(h)) return false; // history column — not an amount input
  const hl = h.toLowerCase().trim();
  return hl === 'pending' || hl === 'token received' || hl === 'token amount' ||
    (hl.includes('token') && !hl.includes('date'));
}
function parseCSV(text) {
  const lines = [];
  let cur = '', inQ = false;
  const cells = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQ && text[i+1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      cells.push(cur); cur = '';
    } else if ((c === '\n' || c === '\r') && !inQ) {
      if (c === '\r' && text[i+1] === '\n') i++;
      cells.push(cur); cur = '';
      lines.push([...cells]); cells.length = 0;
    } else { cur += c; }
  }
  if (cur || cells.length) { cells.push(cur); lines.push([...cells]); }
  if (!lines.length) return { headers:[], rows:[] };
  const headers = lines[0].map(h => h.trim());
  const rows = lines.slice(1)
    .filter(r => r.some(c => c.trim()))
    .map((r, i) => {
      const obj = { __row: i + 2 };
      headers.forEach((h, j) => { obj[h] = (r[j] ?? '').trim(); });
      return obj;
    });
  return { headers, rows };
}
async function callScript(url, payload) {
  await fetch(url, {
    method:'POST', mode:'no-cors',
    headers:{ 'Content-Type':'text/plain' },
    body: JSON.stringify(payload),
  });
}

// ── Painter Select Screen ─────────────────────────────────────────
function PainterSelectScreen({ onSelect }) {
  const [query,  setQuery]  = useState('');
  const [copied, setCopied] = useState(null);
  const painters = getAllPainters();
  const filtered = query.trim()
    ? painters.filter(p => p.toLowerCase().includes(query.toLowerCase()))
    : painters;

  const copyLink = (name) => {
    const url = `${window.location.origin}/painter?name=${encodeURIComponent(name)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(name);
        setTimeout(() => setCopied(null), 2000);
      });
    } else {
      window.prompt('Copy this link for ' + name + ':', url);
    }
  };

  return (
    <div className="pp-select-root">
      <div className="pp-select-hero">
        <div className="pp-select-icon">👷</div>
        <h1 className="pp-select-title">Painter Portal</h1>
        <p className="pp-select-sub">Tap your name to see your jobs</p>
      </div>
      <div className="pp-select-search-wrap">
        <input
          className="pp-select-search"
          placeholder="Search your name…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="pp-select-grid">
        {filtered.map(p => (
          <div key={p} className="pp-name-card">
            <button className="pp-name-btn" onClick={() => onSelect(p)}>
              <span className="pp-name-avatar" style={{ background: avatarBg(p) }}>{p[0]}</span>
              <span className="pp-name-label">{p}</span>
            </button>
            <button className="pp-link-btn" onClick={() => copyLink(p)} title="Copy direct link">
              {copied === p ? '✓' : '🔗'}
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="pp-no-match">No painter named "{query}"</div>
        )}
      </div>
      <p className="pp-link-hint">🔗 tap the link icon to copy a personal link for each painter</p>
    </div>
  );
}

// ── Token field helpers ───────────────────────────────────────────
// History column format: "04/07/26:5000|05/07/26:3000"
function parseHistoryField(val) {
  if (!val) return [];
  return String(val).split('|').map(e => {
    const idx = e.lastIndexOf(':');
    if (idx < 0) return null;
    return { date: e.slice(0, idx), amount: parseFloat(e.slice(idx + 1)) || 0 };
  }).filter(e => e && e.amount > 0);
}
function formatHistoryField(history) {
  return history.map(e => `${e.date}:${e.amount}`).join('|');
}
// Backward-compat: parse old "8000||04/07/26:5000" localStorage format
function parseTokenField(val) {
  if (!val) return { total: 0, history: [] };
  const parts = String(val).split('||');
  const total = parseFloat(parts[0]) || 0;
  const history = parts[1] ? parseHistoryField(parts[1]) : [];
  return { total, history };
}
function todayLabel() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear().toString().slice(-2)}`;
}

// ── Thank You Card ────────────────────────────────────────────────
function ThankYouModal({ name, phone, onClose }) {
  const cardRef = useRef(null);
  const [capturing, setCapturing] = useState(false);

  async function shareCard() {
    if (!cardRef.current || capturing) return;
    setCapturing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, useCORS: true, backgroundColor: null, logging: false,
      });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'thankyou-thepainterboys.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: 'The Painter Boys' }); } catch {}
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'thankyou-thepainterboys.png'; a.click();
          URL.revokeObjectURL(url);
        }
        setCapturing(false);
      }, 'image/png');
    } catch { setCapturing(false); }
  }

  return (
    <div className="pr-overlay" onClick={onClose}>
      <div className="pr-wrap" onClick={e => e.stopPropagation()}>

        {/* Card rendered to image */}
        <div className="ty-card" ref={cardRef}>
          <div className="ty-top-strip" />
          <div className="ty-header">
            <img src="/images/mascot.png" alt="The Painter Boys" className="ty-logo-img"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
            <div className="ty-logo-fallback" style={{display:'none'}}>
              <div className="ty-brush">🎨</div>
              <div className="ty-brand">The Painter Boys</div>
            </div>
            <div className="ty-tagline">Professional Painting Services</div>
          </div>

          <div className="ty-divider" />

          <div className="ty-body">
            <div className="ty-star-row">✦ &nbsp; ✦ &nbsp; ✦</div>
            <div className="ty-thankyou">Thank You!</div>
            <div className="ty-dear">Dear {(name && name !== '—') ? withMr(name) : 'Customer'},</div>
            <div className="ty-message">
              Thank you for reaching out to<br />
              <strong>The Painter Boys.</strong>
            </div>
            <div className="ty-highlight">
              Our representative will contact<br />you shortly.
            </div>
            <div className="ty-promise">
              We look forward to transforming<br />
              your space with our expert<br />
              painting services.
            </div>
          </div>

          <div className="ty-divider" />

          <div className="ty-footer">
            <div className="ty-footer-url">🌐 www.thepainterboys.com</div>
            <div className="ty-footer-phone">📞 Corporate: 7838888509</div>
          </div>
          <div className="ty-bottom-strip" />
        </div>

        <div className="pr-actions">
          <a className="ty-visit-btn" href="https://www.thepainterboys.com" target="_blank" rel="noopener noreferrer">
            🌐 Visit www.thepainterboys.com
          </a>
          <button className="pr-wa-btn pr-wa-share" onClick={shareCard} disabled={capturing}>
            {capturing ? '⏳ Preparing…' : '📤 Share on WhatsApp'}
          </button>
          <button className="pr-close-btn" onClick={onClose}>✕ Close</button>
        </div>

      </div>
    </div>
  );
}

// ── Payment Receipt Card ──────────────────────────────────────────
function PaymentReceiptModal({ name, phone, society, address, fieldName, td, onClose }) {
  const cardRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const fullAddress = [society, address].filter(Boolean).join(', ');
  const waText = [
    `🎨 *The Painter Boys*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `👤 *Customer:* ${withMr(name)}`,
    fullAddress ? `🏘️ *Address:* ${fullAddress}` : '',
    phone   ? `📞 *Phone:* ${phone}` : '',
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `💰 *PAYMENT HISTORY*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    ...td.history.map(e => `📅 ${e.date}   ₹${e.amount.toLocaleString()}`),
    ``,
    `✅ *Total Received = ₹${td.total.toLocaleString()}*`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🌐 www.thepainterboys.com`,
    `📞 Corporate: 7838888509`,
  ].filter(Boolean).join('\n');

  async function shareAsImage() {
    if (!cardRef.current || capturing) return;
    setCapturing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#1a1a2e',
        logging: false,
      });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'receipt-thepainterboys.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'Payment Summary — The Painter Boys' });
          } catch (e) { /* user cancelled */ }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'receipt-thepainterboys.png'; a.click();
          URL.revokeObjectURL(url);
        }
        setCapturing(false);
      }, 'image/png');
    } catch { setCapturing(false); }
  }

  return (
    <div className="pr-overlay" onClick={onClose}>
      <div className="pr-wrap" onClick={e => e.stopPropagation()}>

        <div className="pr-card" ref={cardRef}>
          {/* Header */}
          <div className="pr-header">
            <div className="pr-logo">🎨</div>
            <div className="pr-company">The Painter Boys</div>
            <div className="pr-tagline">Professional Painting Services</div>
          </div>

          <div className="pr-badge">PAYMENT SUMMARY</div>

          {/* Customer details */}
          <div className="pr-section">
            <div className="pr-section-title">CUSTOMER DETAILS</div>
            <div className="pr-row"><span className="pr-label">Name</span><span>{withMr(name)}</span></div>
            {society && <div className="pr-row"><span className="pr-label">Society</span><span>{society}</span></div>}
            {address && <div className="pr-row"><span className="pr-label">Address</span><span>{address}</span></div>}
            {phone   && <div className="pr-row"><span className="pr-label">Phone</span><span>{phone}</span></div>}
          </div>

          {/* Payment history */}
          <div className="pr-section">
            <div className="pr-section-title">💰 PAYMENT HISTORY</div>
            {td.history.length === 0 && <div className="pr-no-hist">No entries yet</div>}
            {td.history.map((e, i) => (
              <div key={i} className="pr-hist-row">
                <span className="pr-hist-date">📅 {e.date}</span>
                <span className="pr-hist-amt">₹{e.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="pr-total">
            <span>Total Received</span>
            <span>₹{td.total.toLocaleString()}</span>
          </div>

          {/* Footer */}
          <div className="pr-footer">
            <div className="pr-footer-url">🌐 www.thepainterboys.com</div>
            <div className="pr-footer-phone">📞 Corporate: 7838888509</div>
          </div>
        </div>

        {/* Actions */}
        <div className="pr-actions">
          <button className="pr-wa-btn pr-wa-share" onClick={shareAsImage} disabled={capturing}>
            {capturing ? '⏳ Preparing…' : '📤 Share Receipt on WhatsApp'}
          </button>
          <button className="pr-close-btn" onClick={onClose}>✕ Close</button>
        </div>

      </div>
    </div>
  );
}

// ── Job Detail Sheet ──────────────────────────────────────────────
function JobDetailSheet({ row, headers, painter, onClose, onSaved, onRefresh }) {
  const progress   = row['Progress'] || row['progress'] || '';
  const phone = row['Phone'] || row['phone'] || '';
  const name  = row['Contact Name'] || row['Name'] || row['name'] || '';
  const societyKey = headers.find(h => h.toLowerCase().includes('society')) || '';
  const society    = societyKey ? row[societyKey] : '';
  const addressKey = headers.find(h => h.toLowerCase().trim() === 'address') || '';
  const address    = addressKey ? row[addressKey] : '';

  // Read payment history (read-only on painter portal — amounts added from PB page)
  const amountHeaders    = headers.filter(isPainterAmountField);
  const historyColHeader = headers.find(isTokenHistoryField) || '';
  const LS_HIST_KEY      = `pb_hist_${row.__row}`;
  const [receiptFor, setReceiptFor] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const isInquiry = progress.toLowerCase().includes('inqu');

  const tokenData = useMemo(() => {
    const init = {};
    let history = [];
    try {
      const localHist = localStorage.getItem(LS_HIST_KEY);
      if (localHist) history = parseHistoryField(localHist);
    } catch {}
    if (!history.length && historyColHeader)
      history = parseHistoryField(row[historyColHeader] || '');
    if (!history.length) {
      amountHeaders.forEach(h => {
        const legacy = parseTokenField(row[h] || '');
        if (legacy.history.length > history.length) history = legacy.history;
      });
    }
    amountHeaders.forEach(h => { init[h] = { total: parseFloat(row[h]) || 0, history }; });
    return init;
  }, [row, historyColHeader, amountHeaders, LS_HIST_KEY]);

  // Additional Work — read-only display on painter portal
  const addWorkHeader = headers.find(h => h.toLowerCase().includes('additional')) || '';

  // WhatsApp message — receipt-style format
  const fullAddr  = [society, address].filter(Boolean).join(', ');
  const waLines = [
    `🎨 *The Painter Boys*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `👤 *Customer:* ${withMr(name)}`,
    fullAddr  ? `🏘️ *Address:* ${fullAddr}` : '',
    phone     ? `📞 *Phone:* ${phone}` : '',
    progress  ? `📊 *Status:* ${progress}` : '',
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🌐 www.thepainterboys.com`,
    `📞 Corporate: 7838888509`,
  ].filter(Boolean).join('\n');

  return (
    <>
    <div className="pp-overlay" onClick={onClose}>
      <div className="pp-sheet" onClick={e => e.stopPropagation()}>
        <div className="pp-sheet-handle" />

        {/* Current status */}
        {progress && (() => {
          const s = progressColor(progress);
          return (
            <div className="pp-detail-status" style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
              {progress}
            </div>
          );
        })()}

        {/* Contact quick actions */}
        {(phone || society) && (
          <div className="pp-contact-row">
            {phone && <a className="pp-contact-btn pp-call-btn" href={`tel:${phone}`}>📞 Call {withMr(name) || 'Customer'}</a>}
            {phone && (
              <a className="pp-contact-btn pp-wa-btn"
                href={`https://wa.me/?text=${encodeURIComponent(waLines)}`}
                target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
            )}
          </div>
        )}

        {/* Thank You card — shown for Inquiry status */}
        {isInquiry && (
          <button className="pp-ty-btn" onClick={() => setShowThankYou(true)}>
            💌 Share Thank You Card
          </button>
        )}

        {/* Payment summary — read-only on painter portal */}
        {amountHeaders.map(h => {
          const td = tokenData[h] || { total: 0, history: [] };
          if (!td.total && !td.history.length) return null;
          return (
            <div key={h} className="pp-amount-section">
              <div className="pp-amount-title">💰 Payment Summary</div>
              {td.history.length > 0 && (
                <div className="pp-amount-history">
                  {td.history.map((e, i) => (
                    <div key={i} className="pp-amount-history-row">
                      <span className="pp-history-date">📅 {e.date}</span>
                      <span className="pp-history-amt">₹{e.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              {td.total > 0 && (
                <div className="pp-amount-existing-row">
                  <span className="pp-amount-existing">
                    Total: <strong>₹{td.total.toLocaleString()}</strong>
                  </span>
                  {td.history.length > 0 && (
                    <button className="pp-wa-share-btn"
                      onClick={() => setReceiptFor({ h, td })}>
                      🧾 Share Receipt
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Additional Work — read-only */}
        {addWorkHeader && row[addWorkHeader] && (
          <div className="pp-addwork-section">
            <div className="pp-addwork-title">🔧 Additional Work</div>
            <div className="pp-addwork-readonly">{row[addWorkHeader]}</div>
          </div>
        )}

        {/* All job details (skip amount fields — shown above) */}
        <div className="pp-detail-list">
          {headers.filter(h => h && h !== '#' && !isPainterAmountField(h) && !isTokenHistoryField(h) && !h.toLowerCase().includes('additional')).map(h => {
            const val = row[h];
            if (!val) return null;
            const isDate = h.toLowerCase().includes('date');
            const isPainter = isPainterField(h);
            return (
              <div key={h} className="pp-detail-row">
                <span className="pp-detail-key">{isPainterField(h) ? 'Service Partner' : h}</span>
                <span className="pp-detail-val">
                  {isPainter
                    ? parsePainters(val).map(p => (
                        <span key={p} className="pp-painter-chip">{p}</span>
                      ))
                    : isDate ? formatDate(val) : val
                  }
                </span>
              </div>
            );
          })}
        </div>

        <button className="pp-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>

    {receiptFor && (
      <PaymentReceiptModal
        name={name} phone={phone} society={society} address={address}
        fieldName={receiptFor.h} td={receiptFor.td}
        onClose={() => setReceiptFor(null)}
      />
    )}
    {showThankYou && (
      <ThankYouModal name={name} phone={phone} onClose={() => setShowThankYou(false)} />
    )}
    </>
  );
}

// ── Job Card ──────────────────────────────────────────────────────
function JobCard({ row, headers, onClick }) {
  const progress   = row['Progress'] || row['progress'] || '';
  const name       = row['Contact Name'] || row['Name'] || row['name'] || '—';
  const phone      = row['Phone'] || row['phone'] || '';
  const societyKey = headers.find(h => h.toLowerCase().includes('society')) || '';
  const society    = societyKey ? row[societyKey] : '';
  const paint      = row['Type of Paint'] || row['Type of paint'] || '';
  const dateKey    = headers.find(h => h.toLowerCase().includes('date')) || '';
  const date       = dateKey ? row[dateKey] : '';
  const remarks    = row['Remarks'] || row['remarks'] || '';
  const s          = progressColor(progress);

  return (
    <div className="pp-card" onClick={onClick}
      style={{ background: s.cardBg, borderLeft: `5px solid ${s.cardBorder}`, boxShadow: `0 4px 16px rgba(0,0,0,.12), -2px 0 0 ${s.cardBorder}` }}>
      <div className="pp-card-top">
        <div className="pp-card-society">{society || withMr(name)}</div>
        {progress && (
          <span className="pp-card-badge"
            style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
            {progress}
          </span>
        )}
      </div>
      {society && <div className="pp-card-sub">👤 {withMr(name)}</div>}
      {phone   && (
        <a className="pp-card-phone" href={`tel:${phone}`}
          onClick={e => e.stopPropagation()}>📞 {phone}</a>
      )}
      {paint   && <div className="pp-card-row">🎨 {paint}</div>}
      {date    && <div className="pp-card-row">📅 {formatDate(date)}</div>}
      {remarks && <div className="pp-card-remarks">{remarks}</div>}
    </div>
  );
}

// ── Main Painter Dashboard ────────────────────────────────────────
function PainterDashboard({ painter, onChangePainter }) {
  const [headers,    setHeaders]   = useState([]);
  const [rows,       setRows]      = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [detail,     setDetail]    = useState(null);
  const [lastSynced, setLastSynced]= useState(null);
  const [toast,      setToast]     = useState(null);
  const mainRef   = useRef(null);
  const touchY    = useRef(0);

  const showToast = useCallback((msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(CSV_URL);
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      const { headers: h, rows: r } = parseCSV(text);
      setHeaders(h);
      setRows(r);
      setLastSynced(Date.now());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter rows assigned to this painter; Inquiry cards visible to all painters
  const painterKey = useMemo(() => headers.find(h => isPainterField(h)) || '', [headers]);
  const progressKey = useMemo(() => headers.find(h => h.toLowerCase().includes('progress')) || '', [headers]);
  const myRows     = useMemo(() =>
    rows.filter(row => {
      const isInquiry = (row[progressKey] || '').toLowerCase().includes('inqu');
      return isInquiry || parsePainters(row[painterKey] || '').includes(painter);
    }),
    [rows, painterKey, progressKey, painter]
  );

  const displayed = useMemo(() => {
    return myRows.filter(row => {
      const p = (row[progressKey] || '').toLowerCase();
      if (p.includes('compl') || p.includes('cancel')) return false;
      if (statusFilter === 'notstart')   return p.includes('not s') || p.includes('inqu') || p.includes('pending');
      if (statusFilter === 'inprogress') return p.includes('progress') || p.includes('ongoing');
      return true;
    });
  }, [myRows, statusFilter, progressKey]);

  const counts = useMemo(() => {
    let active = 0, done = 0;
    myRows.forEach(row => {
      const p = (row[progressKey] || '').toLowerCase();
      if (!p.includes('compl') && !p.includes('cancel')) active++;
      else done++;
    });
    return { total: myRows.length, active, done };
  }, [myRows, progressKey]);


  const STATUS_FILTERS = [
    { v:'active',     l:'Active' },
    { v:'notstart',   l:'Not Started' },
    { v:'inprogress', l:'In Progress' },
  ];

  return (
    <div className="pp-root">
      <header className="pp-header">
        <div className="pp-brand-bar">🎨 The Painter Boys</div>
        <div className="pp-header-top">
          <div className="pp-header-left">
            <span className="pp-avatar" style={{ background: avatarBg(painter) }}>{painter[0]}</span>
            <div className="pp-header-info">
              <div className="pp-header-welcome">Welcome</div>
              <div className="pp-header-name">Mr. {painter}</div>
              <span className="pp-role-badge">{painter === 'Rajeev' ? '★ Director' : '✦ Specialist'}</span>
            </div>
          </div>
          <div className="pp-header-right">
            <button className="pp-icon-btn" onClick={fetchData} title="Refresh"
              style={loading ? {animation:'pp-spin .7s linear infinite'} : {}}>↻</button>
            <button className="pp-icon-btn pp-change-btn" onClick={onChangePainter} title="Change painter">👤</button>
          </div>
        </div>
        <div className="pp-header-meta">
          <span className="pp-header-count">
            {loading ? 'Loading…' : `${counts.active} active job${counts.active !== 1 ? 's' : ''}`}
          </span>
          {lastSynced && <span className="pp-synced">· synced {timeAgo(lastSynced)}</span>}
        </div>

        <div className="pp-filter-row">
          {STATUS_FILTERS.map(f => (
            <button key={f.v}
              className={`pp-filter-chip${statusFilter === f.v ? ' pp-filter-active' : ''}`}
              onClick={() => setStatusFilter(f.v)}>
              {f.l}
            </button>
          ))}
        </div>
      </header>

      <main className="pp-main" ref={mainRef}
        onTouchStart={e => { touchY.current = e.touches[0].clientY; }}
        onTouchEnd={e => {
          if (e.changedTouches[0].clientY - touchY.current > 70
            && mainRef.current?.scrollTop === 0 && !loading) fetchData();
        }}>

        {loading && (
          <div className="pp-loading">
            <div className="pp-spinner" />
            <span>Loading jobs…</span>
          </div>
        )}
        {error && (
          <div className="pp-error">⚠️ {error}</div>
        )}
        {!loading && !error && displayed.length === 0 && (
          <div className="pp-empty">
            <div style={{fontSize:'3rem'}}>🎉</div>
            <div>No active jobs right now</div>
          </div>
        )}
        {!loading && !error && displayed.map(row => (
          <JobCard key={row.__row} row={row} headers={headers} onClick={() => setDetail(row)} />
        ))}
      </main>

      {detail && (
        <JobDetailSheet
          row={detail} headers={headers} painter={painter}
          onClose={() => setDetail(null)}
          onRefresh={fetchData}
          onSaved={(rowNum, updates) => {
            setRows(prev => prev.map(r => r.__row === rowNum ? { ...r, ...updates } : r));
            setDetail(prev => prev ? { ...prev, ...updates } : null);
          }}
        />
      )}

      {toast && (
        <div className={`pp-toast ${toast.ok ? 'pp-toast-ok' : 'pp-toast-err'}`}>{toast.msg}</div>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────
export default function PainterBoard() {
  const urlName = new URLSearchParams(window.location.search).get('name');

  const [painter, setPainter] = useState(() => {
    if (urlName) {
      localStorage.setItem(LS_PAINTER, urlName);
      return urlName;
    }
    return localStorage.getItem(LS_PAINTER) || null;
  });

  const select = (name) => {
    localStorage.setItem(LS_PAINTER, name);
    setPainter(name);
  };
  const clear = () => {
    localStorage.removeItem(LS_PAINTER);
    setPainter(null);
    // Remove name param from URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.delete('name');
    window.history.replaceState({}, '', url.toString());
  };

  if (!painter) return <PainterSelectScreen onSelect={select} />;
  return <PainterDashboard painter={painter} onChangePainter={clear} />;
}
