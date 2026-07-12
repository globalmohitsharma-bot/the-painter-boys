import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import LZString from 'lz-string';
import './CustomerView.css';

const PHONE     = '+91 78388 88509';
const WA_CORP   = 'https://wa.me/917838888509';
const WEBSITE   = 'https://www.thepainterboys.com';
const CSV_URL   = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRHqp1TWLyAEgydJ19b6vCJcTGCCxGrLcB1Mccw95xndfc9mbC1y5y3ev5T1njzE0evlvGIHA6OGH1/pub?gid=1417050744&single=true&output=csv';

function parseCSV(text) {
  const lines = [];
  let cur = '', inQ = false;
  const cells = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQ && text[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      cells.push(cur); cur = '';
    } else if ((c === '\n' || c === '\r') && !inQ) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      cells.push(cur); cur = '';
      lines.push([...cells]); cells.length = 0;
    } else { cur += c; }
  }
  if (cur || cells.length) { cells.push(cur); lines.push([...cells]); }
  if (!lines.length) return { headers: [], rows: [] };
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
function isAmountField(h) {
  const hl = h.toLowerCase().replace(/\s+/g,'');
  if (hl === 'tokenhistory') return false;
  const ht = h.toLowerCase().trim();
  return ht === 'pending' || ht === 'token received' || ht === 'token amount' ||
    (ht.includes('token') && !ht.includes('date'));
}
function isHistoryField(h) { return h.toLowerCase().replace(/\s+/g,'') === 'tokenhistory'; }
function isPainterField(h) {
  const hl = h.toLowerCase().replace(/\s+/g,'');
  return ['paintername', 'painter'].some(k => hl.includes(k));
}
function parseHistory(val) {
  if (!val) return [];
  return String(val).split('|').map(e => {
    const idx = e.lastIndexOf(':');
    return idx < 0 ? null : { date: e.slice(0, idx), amount: parseFloat(e.slice(idx + 1)) || 0 };
  }).filter(e => e && e.amount > 0);
}

// Short links (/job/r42) reference a live sheet row by number instead of encoding
// the whole record into the URL — always fetches current data, and the link
// itself stays short enough that customers aren't scared to tap it.
async function fetchByRowNumber(rowNum) {
  const res  = await fetch(`${CSV_URL}&_ts=${Date.now()}`, { cache: 'no-store' });
  const text = await res.text();
  const { headers, rows } = parseCSV(text);
  const row = rows.find(r => r.__row === rowNum);
  if (!row) return null;

  const societyK  = headers.find(h => h.toLowerCase().includes('society')) || '';
  const addressK  = headers.find(h => h.toLowerCase().trim() === 'address') || '';
  const progressK = headers.find(h => h.toLowerCase().includes('progress')) || '';
  const paintK    = headers.find(h => h.toLowerCase().includes('type of paint') || h.toLowerCase().includes('paint type')) || '';
  const painterK  = headers.find(isPainterField) || '';
  const dateK     = headers.find(h => h.toLowerCase().includes('date')) || '';
  const historyColHeader = headers.find(isHistoryField) || '';
  const history   = historyColHeader ? parseHistory(row[historyColHeader] || '') : [];
  const histSum   = history.reduce((s, e) => s + (e.amount || 0), 0);

  const tokens = headers.filter(isAmountField).map(h => {
    const colTotal = parseFloat(row[h]) || 0;
    const adjHist  = colTotal > histSum && colTotal > 0
      ? [{ date: 'Prior payment', amount: colTotal - histSum }, ...history]
      : history;
    const total = adjHist.reduce((s, e) => s + (e.amount || 0), 0);
    return { label: h, total, history: adjHist };
  });

  return {
    name:      row['Contact Name'] || row['Name'] || '',
    phone:     row['Phone'] || '',
    society:   societyK  ? row[societyK]  : '',
    address:   addressK  ? row[addressK]  : '',
    progress:  progressK ? row[progressK] : '',
    paintType: paintK    ? row[paintK]    : '',
    painters:  painterK  ? row[painterK]  : '',
    date:      dateK     ? row[dateK]     : '',
    tokens, sharedAt: null,
    _row: rowNum,
  };
}

function decodeData(str) {
  if (!str) return null;
  // Try new format: lz-string compressed with compact keys
  try {
    const json = LZString.decompressFromEncodedURIComponent(str);
    if (json) {
      const c = JSON.parse(json);
      // Expand compact keys back to full field names
      if (c.n !== undefined) {
        return {
          name:      c.n,  phone:    c.p,
          society:   c.s,  address:  c.a,
          progress:  c.pr, paintType:c.pt,
          painters:  c.pn, date:     c.d,
          tokens: (c.t || []).map(t => ({
            label: t.l, total: t.a,
            history: (t.h || []).map(e => ({ date: e.d, amount: e.a })),
          })),
          sharedAt: c.sa,
          _row: c.r,
        };
      }
      return JSON.parse(json); // already full keys
    }
  } catch {}
  // Fall back to old base64 format (backward compat for existing shared links)
  try {
    const binary = atob(str);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {}
  return null;
}

function progressStyle(p = '') {
  const v = p.toLowerCase();
  if (v.includes('compl'))                          return { bg:'#dbeafe', color:'#1d4ed8', border:'#3b82f6' };
  if (v.includes('cancel'))                         return { bg:'#fee2e2', color:'#dc2626', border:'#ef4444' };
  if (v.includes('not s'))                          return { bg:'#fef3c7', color:'#b45309', border:'#f59e0b' };
  if (v.includes('progress') || v.includes('ongoing')) return { bg:'#d1fae5', color:'#065f46', border:'#22c55e' };
  if (v.includes('inqu') || v.includes('pending')) return { bg:'#ede9fe', color:'#6d28d9', border:'#a855f7' };
  return { bg:'#f1f5f9', color:'#475569', border:'#94a3b8' };
}

export default function CustomerView() {
  const { code }  = useParams();           // new: /job/:code
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);
  const [qrUrl,   setQrUrl]   = useState('');

  useEffect(() => {
    let cancelled = false;
    // New short format: /job/r42 (live row lookup)
    // New long format: /job/:code (compressed JSON, still supported)
    // Old format: /customer?r=... (query param, still supported)
    const shortMatch = code && /^r(\d+)$/.exec(code);
    if (shortMatch) {
      fetchByRowNumber(parseInt(shortMatch[1], 10))
        .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
        .catch(() => { if (!cancelled) { setLoading(false); } });
      return () => { cancelled = true; };
    }
    const str = code || new URLSearchParams(window.location.search).get('r');
    if (str) setData(decodeData(str));
    setLoading(false);
  }, [code]);

  useEffect(() => {
    if (!data) return;
    QRCode.toDataURL(window.location.href, {
      width: 200, margin: 2,
      color: { dark: '#0d2137', light: '#ffffff' },
    }).then(setQrUrl).catch(() => {});
  }, [data]);

  if (loading) {
    return (
      <div className="cv-error">
        <div className="cv-error-icon">🎨</div>
        <div className="cv-error-brand">
          <span className="cv-the">The </span>
          <span className="cv-pb">Painter Boys</span>
        </div>
        <div className="cv-error-msg">Loading your job details…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="cv-error">
        <div className="cv-error-icon">🎨</div>
        <div className="cv-error-brand">
          <span className="cv-the">The </span>
          <span className="cv-pb">Painter Boys</span>
        </div>
        <div className="cv-error-msg">
          This link is invalid or has expired.<br />
          Please contact us for assistance.
        </div>
        <a className="cv-wa-btn" href={WA_CORP} target="_blank" rel="noopener noreferrer">
          💬 WhatsApp The Painter Boys
        </a>
        <a className="cv-website-link" href={WEBSITE} target="_blank" rel="noopener noreferrer">
          🌐 www.thepainterboys.com
        </a>
      </div>
    );
  }

  const isPBUser = sessionStorage.getItem('pb_auth') === '1';
  const { name, phone, society, address, progress, paintType, painters, date, tokens = [], sharedAt, _row } = data;
  const ps          = progressStyle(progress);
  const fullAddress = [society, address].filter(Boolean).join(', ');
  const painterList = painters ? painters.split(',').map(s => s.trim()).filter(Boolean) : [];
  const sharedDate  = sharedAt
    ? new Date(sharedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
    : '';

  // Separate "received" tokens from "pending" tokens
  const receivedTokens = tokens.filter(t =>
    !t.label.toLowerCase().includes('pending')
  );
  const pendingTokens  = tokens.filter(t =>
    t.label.toLowerCase().includes('pending')
  );
  const totalPaid    = receivedTokens.reduce((s, t) => s + (t.total || 0), 0);
  const totalPending = pendingTokens.reduce((s, t)  => s + (t.total || 0), 0);
  const hasPaymentData = tokens.some(t => t.total > 0 || t.history?.length > 0);

  const copyPage = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }).catch(() => {
      window.prompt('Copy this link:', window.location.href);
    });
  };

  return (
    <div className="cv-root">
      {/* ── Header ── */}
      <div className="cv-header">
        <div className="cv-header-inner">
          <div className="cv-logo-row">
            <div className="cv-logo-icon">🎨</div>
            <div>
              <div className="cv-brand-name">
                <span className="cv-the">The </span>
                <span className="cv-pb">Painter Boys</span>
              </div>
              <div className="cv-brand-sub">Professional Painting Services</div>
            </div>
          </div>
          <a className="cv-header-phone" href="tel:+917838888509">
            📞 {PHONE}
          </a>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="cv-body">

        {/* Status badge */}
        {progress && (
          <div className="cv-status-pill"
            style={{ background: ps.bg, color: ps.color, borderColor: ps.border }}>
            {progress}
          </div>
        )}

        {/* Job details card */}
        <div className="cv-card">
          <div className="cv-card-hd">📋 Job Details</div>
          {name         && <Row label="Customer"   value={name} />}
          {phone        && <Row label="Phone"      value={<a href={`tel:${phone}`}>{phone}</a>} />}
          {fullAddress  && <Row label="Address"    value={fullAddress} />}
          {date         && <Row label="Date"       value={date} />}
          {paintType    && <Row label="Paint Type" value={paintType} />}
          {painterList.length > 0 && (
            <Row label="On Site" value={
              <span className="cv-chips">
                {painterList.map(p => <span key={p} className="cv-chip">{p}</span>)}
              </span>
            } />
          )}
        </div>

        {/* Payment card — only if data exists */}
        {hasPaymentData && (
          <div className="cv-card">
            <div className="cv-card-hd">💰 Payment Summary</div>

            {/* Payment history rows */}
            {receivedTokens.map((t, i) => (
              t.history?.length > 0 ? (
                <div key={i} className="cv-token-block">
                  {receivedTokens.length > 1 && <div className="cv-token-lbl">{t.label}</div>}
                  <div className="cv-history">
                    {t.history.map((e, j) => (
                      <div key={j} className="cv-hist-row">
                        <span className="cv-hist-date">📅 {e.date}</span>
                        <span className="cv-hist-amt">₹{(e.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            ))}

            {/* Total paid */}
            {totalPaid > 0 && (
              <div className="cv-total-row">
                <span>✅ Total Paid</span>
                <strong>₹{totalPaid.toLocaleString()}</strong>
              </div>
            )}

            {/* Pending amount */}
            {totalPending > 0 && (
              <div className="cv-pending-row">
                <span>⏳ Pending Amount</span>
                <strong>₹{totalPending.toLocaleString()}</strong>
              </div>
            )}
          </div>
        )}

        {/* QR Code */}
        {qrUrl && (
          <div className="cv-card cv-qr-card">
            <div className="cv-card-hd">📲 Scan to Open This Page</div>
            <div className="cv-qr-wrap">
              <img src={qrUrl} alt="QR code for this page" className="cv-qr-img" />
              <p className="cv-qr-hint">Scan with any camera app to open your job details instantly</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="cv-actions">
          {isPBUser && (
            <a className="cv-btn cv-btn-edit"
              href={_row ? `/pb?edit=${_row}` : '/pb'}>
              ✏️ Edit This Job in Portal
            </a>
          )}
          <a className="cv-btn cv-btn-wa"
            href={`${WA_CORP}?text=${encodeURIComponent('Hello, I have a query about my painting job.')}`}
            target="_blank" rel="noopener noreferrer">
            💬 WhatsApp The Painter Boys
          </a>
          <a className="cv-btn cv-btn-call" href="tel:+917838888509">
            📞 Call Corporate
          </a>
          <button className="cv-btn cv-btn-copy" onClick={copyPage}>
            {copied ? '✓ Copied!' : '🔗 Copy This Page Link'}
          </button>
        </div>

        {sharedDate && (
          <div className="cv-shared-at">Shared on {sharedDate}</div>
        )}

        <a className="cv-site-link" href={WEBSITE} target="_blank" rel="noopener noreferrer">
          🌐 www.thepainterboys.com
        </a>
      </div>

      {/* Floating WhatsApp widget */}
      <a className="cv-wa-float"
        href={`${WA_CORP}?text=${encodeURIComponent(`Hello, I'm ${name}. I have a query about my painting job at ${fullAddress || 'my address'}.`)}`}
        target="_blank" rel="noopener noreferrer"
        title="Chat with The Painter Boys on WhatsApp">
        <span className="cv-wa-float-bubble">
          <svg viewBox="0 0 24 24" fill="currentColor" className="cv-wa-float-svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </span>
        <span className="cv-wa-float-label">Chat</span>
      </a>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="cv-row">
      <span className="cv-lbl">{label}</span>
      <span className="cv-val">{value}</span>
    </div>
  );
}
