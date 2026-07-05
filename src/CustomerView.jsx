import { useState, useEffect } from 'react';
import './CustomerView.css';

const PHONE     = '+91 78388 88509';
const WA_CORP   = 'https://wa.me/917838888509';
const WEBSITE   = 'https://www.thepainterboys.com';

function decodeData(str) {
  try {
    const binary = atob(str);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch { return null; }
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
  const [data,   setData]   = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get('r');
    if (r) setData(decodeData(r));
  }, []);

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

  const { name, phone, society, address, progress, paintType, painters, date, tokens = [], sharedAt } = data;
  const ps          = progressStyle(progress);
  const fullAddress = [society, address].filter(Boolean).join(', ');
  const painterList = painters ? painters.split(',').map(s => s.trim()).filter(Boolean) : [];
  const sharedDate  = sharedAt
    ? new Date(sharedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
    : '';

  const totalPaid = tokens.reduce((sum, t) => sum + (t.total || 0), 0);

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
        {tokens.length > 0 && tokens.some(t => t.total > 0 || t.history?.length > 0) && (
          <div className="cv-card">
            <div className="cv-card-hd">💰 Payment Summary</div>
            {tokens.map((t, i) => (
              t.total > 0 || t.history?.length > 0 ? (
                <div key={i} className="cv-token-block">
                  {tokens.length > 1 && <div className="cv-token-lbl">{t.label}</div>}
                  {t.history?.length > 0 && (
                    <div className="cv-history">
                      {t.history.map((e, j) => (
                        <div key={j} className="cv-hist-row">
                          <span className="cv-hist-date">📅 {e.date}</span>
                          <span className="cv-hist-amt">₹{(e.amount || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {t.total > 0 && (
                    <div className="cv-total-row">
                      <span>Total Received</span>
                      <strong>₹{(t.total || 0).toLocaleString()}</strong>
                    </div>
                  )}
                </div>
              ) : null
            ))}
            {tokens.length > 1 && totalPaid > 0 && (
              <div className="cv-grand-total">
                <span>Grand Total Received</span>
                <strong>₹{totalPaid.toLocaleString()}</strong>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="cv-actions">
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
