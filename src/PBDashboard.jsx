import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import LZString from 'lz-string';
import './PBDashboard.css';

const CSV_URL  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRHqp1TWLyAEgydJ19b6vCJcTGCCxGrLcB1Mccw95xndfc9mbC1y5y3ev5T1njzE0evlvGIHA6OGH1/pub?gid=1417050744&single=true&output=csv';
const LS_KEY          = 'pb_script_url';
const LS_SOCIETIES    = 'pb_custom_societies';
const LS_PAINTERS     = 'pb_custom_painters';

// Fields that get a combo-dropdown (type-or-pick from existing values)
const COMBO_FIELDS   = ['society', 'progress', 'type of paint', 'paint type'];
const PROGRESS_OPTIONS = ['Inquiry', 'Pending Visit', 'Not Started', 'In Progress', 'Completed', 'Cancelled'];
const PAINTER_FIELDS = ['paintername', 'painter name', 'painter'];
// Fields that get a date picker
const DATE_FIELDS  = ['date'];

function isPainterField(h) {
  return PAINTER_FIELDS.some(k => h.toLowerCase().replace(/\s+/g,'').includes(k.replace(/\s+/g,'')));
}
function displayLabel(h) {
  if (isPainterField(h)) return 'Service Partner';
  return h;
}

// ── Raj Nagar Extension, Ghaziabad — built-in society list ────────
const DEFAULT_SOCIETIES = [
  'Addela Palm Resort','Ajnara Fragrance','Ajnara Grace','Ajnara Integrity',
  'Anthem Kingdom Homes','Charms Castle','Charms The Gateway Towers',
  'Devika Skypers','Emenox Brave Hearts','Gaur Cascades','GAV Green View Heights',
  'Jyoti Super Village','KDP Grand Savanna','KW Srishti','Landcraft River Heights',
  'MCC Signature Heights','Migsun Atharva','Migsun Roof','Nilaya Greens',
  'Officer City','Raj Nagar Residency','Royce Sentosa Parc','Sangwan Heights',
  'SCC Blossom','SCC Heights','SCC Sapphire','SG Impression Plus',
  'SG Impressions 58','SG Vista','Star Rameshwaram','SVP Gulmohur Garden',
  'T and T Atlas','Uninav Eden','Uninav Residena','Uninav Utopia',
  'VVIP Addresses','VVIP Homes','Windsor Majesty','Windsor Paradise 2',
].sort();

function getCustomSocieties() {
  try { return JSON.parse(localStorage.getItem(LS_SOCIETIES) || '[]'); } catch { return []; }
}
function saveCustomSocieties(arr) { localStorage.setItem(LS_SOCIETIES, JSON.stringify(arr)); }
function allSocietyOptions(rows, header) {
  const custom    = getCustomSocieties();
  const fromSheet = rows.map(r => r[header]).filter(Boolean);
  return [...new Set([...DEFAULT_SOCIETIES, ...custom, ...fromSheet])].sort();
}

// ── Painter helpers ───────────────────────────────────────────────
const DEFAULT_PAINTERS = ['Fariyad','Jabbar','Rajeev','Raju','Sushant'];
function getCustomPainters() {
  try { return JSON.parse(localStorage.getItem(LS_PAINTERS) || '[]'); } catch { return []; }
}
function saveCustomPainters(arr) { localStorage.setItem(LS_PAINTERS, JSON.stringify(arr)); }
function allPainterOptions() {
  return [...new Set([...DEFAULT_PAINTERS, ...getCustomPainters()])].sort();
}
// Parse comma-separated painter string → array
function parsePainters(val) {
  return val ? val.split(',').map(s => s.trim()).filter(Boolean) : [];
}

// ── Date display formatting ───────────────────────────────────────
function formatDate(val) {
  if (!val) return '';
  const d = new Date(val + 'T00:00:00');
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Relative time ─────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ── Required field detection for Add form validation ──────────────
const REQUIRED_KEYWORDS = ['phone'];
function isRequiredField(h) {
  return REQUIRED_KEYWORDS.some(k => h.toLowerCase().includes(k));
}

// ── CSV parser ────────────────────────────────────────────────────
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

// ── Progress colour ───────────────────────────────────────────────
// Inquiry/Pending Visit → purple  |  Not Started → amber  |  In Progress → green
// Completed → blue  |  Cancelled → red
function progressClass(val = '') {
  const v = val.toLowerCase();
  if (v.includes('compl'))                            return 'badge-blue';
  if (v.includes('cancel'))                           return 'badge-red';
  if (v.includes('not st') || v.includes('not s'))    return 'badge-amber';
  if (v.includes('progress') || v.includes('ongoing'))return 'badge-green';
  if (v.includes('inqu') || v.includes('pending'))    return 'badge-purple';
  return 'badge-amber';
}
function cardAccent(val = '') {
  const v = val.toLowerCase();
  if (v.includes('compl'))                            return 'card-accent-blue';
  if (v.includes('cancel'))                           return 'card-accent-red';
  if (v.includes('not st') || v.includes('not s'))    return 'card-accent-amber';
  if (v.includes('progress') || v.includes('ongoing'))return 'card-accent-green';
  if (v.includes('inqu') || v.includes('pending'))    return 'card-accent-purple';
  return 'card-accent-amber';
}

// ── Apps Script write ─────────────────────────────────────────────
async function callScript(url, payload) {
  await fetch(url, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });
}

// ── Customer link encoder ─────────────────────────────────────────
function encodeCustomerData(data) {
  // Compact keys + lz-string compression → much shorter URL
  const compact = {
    n:  data.name,      p:  data.phone,
    s:  data.society,   a:  data.address,
    pr: data.progress,  pt: data.paintType,
    pn: data.painters,  d:  data.date,
    t:  (data.tokens || []).map(t => ({
      l: t.label, a: t.total,
      h: (t.history || []).map(e => ({ d: e.date, a: e.amount })),
    })),
    sa: data.sharedAt,
    r:  data._row,
  };
  return LZString.compressToEncodedURIComponent(JSON.stringify(compact));
}
function buildCustomerUrl(row, headers, tokenData) {
  const name       = row['Contact Name'] || row['Name'] || row['name'] || '';
  const phone      = row['Phone'] || row['phone'] || '';
  const societyK   = headers.find(h => h.toLowerCase().includes('society')) || '';
  const addressK   = headers.find(h => h.toLowerCase().trim() === 'address') || '';
  const progressK  = headers.find(h => h.toLowerCase().includes('progress')) || '';
  const paintK     = headers.find(h => h.toLowerCase().includes('type of paint') || h.toLowerCase().includes('paint type')) || '';
  const painterK   = headers.find(h => isPainterField(h)) || '';
  const dateK      = headers.find(h => h.toLowerCase().includes('date')) || '';
  const tokens = headers.filter(pbIsAmountField).map(h => {
    const td = tokenData[h] || { total:0, history:[] };
    return { label: h, total: td.total, history: td.history };
  });
  const data = {
    name, phone,
    society:   societyK  ? row[societyK]  : '',
    address:   addressK  ? row[addressK]  : '',
    progress:  progressK ? row[progressK] : '',
    paintType: paintK    ? row[paintK]    : '',
    painters:  painterK  ? row[painterK]  : '',
    date:      dateK     ? row[dateK]     : '',
    tokens, sharedAt: new Date().toISOString(),
    _row: row.__row,
  };
  return `${window.location.origin}/job/${encodeCustomerData(data)}`;
}

// ── Combo field — custom filtered dropdown ────────────────────────
function ComboField({ fieldName, value, onChange, options }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');  // separate search string, cleared on open

  const q = query.toLowerCase();
  const filtered = q.length >= 3
    ? options.filter(o => o.toLowerCase().includes(q))
    : options;

  const pick = (opt) => { onChange(opt); setQuery(''); setOpen(false); };
  const handleFocus = () => { setQuery(''); setOpen(true); };
  const handleBlur  = () => setTimeout(() => { setQuery(''); setOpen(false); }, 180);

  return (
    <div className="pb-combo-wrap">
      <input
        className="pb-edit-input"
        value={open ? query : value}
        placeholder="Select or type…"
        autoComplete="off"
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      <span className="pb-combo-arrow" onMouseDown={e => { e.preventDefault(); setQuery(''); setOpen(o => !o); }}>▾</span>
      {open && filtered.length > 0 && (
        <div className="pb-combo-drop">
          {filtered.map(opt => (
            <div key={opt} className={`pb-combo-opt${opt === value ? ' pb-combo-opt-sel' : ''}`}
              onMouseDown={e => { e.preventDefault(); pick(opt); }}>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function isComboField(header) {
  return COMBO_FIELDS.some(k => header.toLowerCase().includes(k));
}
function isDateField(header) {
  return DATE_FIELDS.some(k => header.toLowerCase().includes(k));
}
const LONG_TEXT_KEYWORDS = ['other', 'detail', 'remark', 'note', 'description', 'address', 'comment', 'info'];
function isLongTextField(header) {
  return LONG_TEXT_KEYWORDS.some(k => header.toLowerCase().includes(k));
}

// Sheet stores dates as YYYY-MM-DD; input[type=date] uses the same format
function toInputDate(val) {
  if (!val) return '';
  // Handle DD-MM-YYYY or D/M/YYYY → YYYY-MM-DD
  const dmY = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmY) return `${dmY[3]}-${dmY[2].padStart(2,'0')}-${dmY[1].padStart(2,'0')}`;
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0,10);
  return '';
}
function fromInputDate(val) { return val; } // keep YYYY-MM-DD as-is for sheet

// ── Painter multi-select ──────────────────────────────────────────
function PainterField({ value, onChange }) {
  const [open, setOpen]       = useState(false);
  const [newName, setNewName] = useState('');
  const wrapRef = useRef(null);
  const selected = parsePainters(value);
  const options  = allPainterOptions();

  // Close on outside click/touch
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const toggle = (name) => {
    const s = new Set(selected);
    s.has(name) ? s.delete(name) : s.add(name);
    onChange([...s].join(', '));
    setOpen(false); // auto-close after each tap — re-open to add more
  };

  const addNew = () => {
    const name = newName.trim();
    if (!name) return;
    if (![...DEFAULT_PAINTERS, ...getCustomPainters()].includes(name)) {
      saveCustomPainters([...getCustomPainters(), name].sort());
    }
    if (!selected.includes(name)) onChange([...selected, name].join(', '));
    setNewName('');
  };

  return (
    <div className="pb-painter-wrap" ref={wrapRef}>
      <div className="pb-painter-trigger" onClick={() => setOpen(o => !o)}>
        {selected.length === 0
          ? <span className="pb-painter-ph">Select painters…</span>
          : selected.map(s => (
              <span key={s} className="pb-painter-chip">
                {s}
                <button className="pb-painter-chip-x"
                  onClick={e => { e.stopPropagation(); toggle(s); }}>✕</button>
              </span>
            ))
        }
        <span className="pb-combo-arrow">▾</span>
      </div>
      {open && (
        <div className="pb-combo-drop">
          {options.map(opt => (
            <div key={opt}
              className={`pb-combo-opt pb-painter-opt${selected.includes(opt) ? ' pb-combo-opt-sel' : ''}`}
              onClick={() => toggle(opt)}>
              <span className="pb-painter-check">{selected.includes(opt) ? '✓' : ''}</span>
              {opt}
            </div>
          ))}
          <div className="pb-painter-add-row">
            <input className="pb-painter-new-input" placeholder="Add new painter…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNew()} />
            <button className="pb-btn pb-primary pb-painter-add-btn"
              onClick={addNew} disabled={!newName.trim()}>+</button>
          </div>
          <div style={{padding:'6px 8px', textAlign:'right'}}>
            <button className="pb-btn pb-ghost" style={{fontSize:'.8rem',padding:'4px 14px'}}
              onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared form field renderer ────────────────────────────────────
function FormField({ header, value, onChange, rows }) {
  const uniq = (col) => [...new Set(rows.map(r => r[col]).filter(Boolean))].sort();

  if (isPainterField(header)) {
    return <PainterField value={value} onChange={onChange} />;
  }
  if (isDateField(header)) {
    return (
      <input
        type="date"
        className="pb-edit-input pb-date-input"
        value={toInputDate(value)}
        onChange={e => onChange(fromInputDate(e.target.value))}
      />
    );
  }
  if (isComboField(header)) {
    const h = header.toLowerCase();
    const options = h.includes('society')
      ? allSocietyOptions(rows, header)
      : h.includes('progress')
        ? [...new Set([...PROGRESS_OPTIONS, ...uniq(header)])].sort((a,b) => PROGRESS_OPTIONS.indexOf(a) - PROGRESS_OPTIONS.indexOf(b) || a.localeCompare(b))
        : uniq(header);
    return (
      <ComboField
        fieldName={header}
        value={value}
        onChange={onChange}
        options={options}
      />
    );
  }
  if (isLongTextField(header)) {
    return (
      <textarea
        className="pb-edit-input pb-textarea"
        value={value}
        rows={4}
        onChange={e => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      className="pb-edit-input"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

// ── Setup sheet ───────────────────────────────────────────────────
function SetupSheet({ onSave }) {
  const [url, setUrl]   = useState('');
  const [tab, setTab]         = useState('painters');
  const [custom, setCustom]   = useState(getCustomSocieties);
  const [newSoc, setNewSoc]   = useState('');
  const [customP, setCustomP] = useState(getCustomPainters);
  const [newPainter, setNewPainter] = useState('');

  const addSoc = () => {
    const name = newSoc.trim();
    if (!name) return;
    if ([...DEFAULT_SOCIETIES, ...custom].includes(name)) { setNewSoc(''); return; }
    const updated = [...custom, name].sort();
    setCustom(updated); saveCustomSocieties(updated); setNewSoc('');
  };
  const delSoc = (name) => {
    const updated = custom.filter(s => s !== name);
    setCustom(updated); saveCustomSocieties(updated);
  };

  const SCRIPT =
`function doPost(e){
  var sheet=SpreadsheetApp
    .openById('1e729W4MXvlGXGLpmIrQugkCuCIVWWm9QqJtxONxFGo8')
    .getSheets().filter(function(s){return s.getSheetId()==1417050744;})[0];
  var d=JSON.parse(e.postData.contents);
  if(d.action==='append') sheet.appendRow(d.values);
  else if(d.action==='update')
    sheet.getRange(d.rowIndex,1,1,d.values.length).setValues([d.values]);
  else if(d.action==='delete') sheet.deleteRow(d.rowIndex);
  return ContentService.createTextOutput(JSON.stringify({ok:true}))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  return (
    <div className="pb-sheet-overlay" onClick={() => onSave(null)}>
      <div className="pb-bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="pb-sheet-handle" />
        <div className="pb-setup-tabs">
          <button className={`pb-setup-tab${tab==='painters'?' pb-setup-tab-active':''}`} onClick={()=>setTab('painters')}>👷 Painters</button>
          <button className={`pb-setup-tab${tab==='societies'?' pb-setup-tab-active':''}`} onClick={()=>setTab('societies')}>🏘️ Societies</button>
          <button className={`pb-setup-tab${tab==='script'?' pb-setup-tab-active':''}`} onClick={()=>setTab('script')}>⚙️ Script</button>
        </div>

        {tab === 'script' && <>
          <h2 className="pb-sheet-title">⚙️ Enable Adding / Editing</h2>
          <p className="pb-setup-sub">Paste this Apps Script into your sheet to enable writes:</p>
          <ol className="pb-steps">
            <li>Google Sheet → <b>Extensions → Apps Script</b></li>
            <li>Replace all code with the script below</li>
            <li><b>Deploy → New deployment → Web app</b></li>
            <li>Execute as: <b>Me</b> · Access: <b>Anyone</b></li>
            <li>Copy the URL and paste it here</li>
          </ol>
          <pre className="pb-script">{SCRIPT}</pre>
          <input className="pb-url-input" placeholder="Paste Web App URL…"
            value={url} onChange={e => setUrl(e.target.value)} />
          <div className="pb-sheet-actions">
            <button className="pb-btn pb-ghost" onClick={() => onSave(null)}>Skip (read-only)</button>
            <button className="pb-btn pb-primary" disabled={!url.trim()}
              onClick={() => {
                const trimmed = url.trim();
                localStorage.setItem(LS_KEY, trimmed);
                onSave(trimmed);
              }}>
              Save
            </button>
          </div>
        </>}

        {tab === 'painters' && <>
          <h2 className="pb-sheet-title">👷 Manage Painters</h2>
          <p className="pb-setup-sub">{DEFAULT_PAINTERS.length} built-in · {customP.length} custom</p>
          <div className="pb-soc-add-row">
            <input className="pb-url-input" placeholder="Add new painter name…"
              value={newPainter} onChange={e=>setNewPainter(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&(()=>{
                const n=newPainter.trim();
                if(!n||[...DEFAULT_PAINTERS,...customP].includes(n)){setNewPainter('');return;}
                const u=[...customP,n].sort(); setCustomP(u); saveCustomPainters(u); setNewPainter('');
              })()} />
            <button className="pb-btn pb-primary" disabled={!newPainter.trim()} onClick={()=>{
              const n=newPainter.trim();
              if(!n||[...DEFAULT_PAINTERS,...customP].includes(n)){setNewPainter('');return;}
              const u=[...customP,n].sort(); setCustomP(u); saveCustomPainters(u); setNewPainter('');
            }}>Add</button>
          </div>
          {customP.length > 0 && <>
            <p className="pb-setup-sub" style={{marginTop:12}}>Your custom painters:</p>
            <div className="pb-soc-list">
              {customP.map(s => (
                <div key={s} className="pb-soc-item">
                  <span>{s}</span>
                  <button className="pb-soc-del" onClick={()=>{
                    const u=customP.filter(x=>x!==s); setCustomP(u); saveCustomPainters(u);
                  }}>✕</button>
                </div>
              ))}
            </div>
          </>}
          <p className="pb-setup-sub" style={{marginTop:12}}>Built-in painters:</p>
          <div className="pb-soc-list pb-soc-builtin">
            {DEFAULT_PAINTERS.map(s=><div key={s} className="pb-soc-item"><span>{s}</span></div>)}
          </div>
          <div className="pb-sheet-actions">
            <button className="pb-btn pb-primary" onClick={()=>onSave(null)}>Done</button>
          </div>
        </>}

        {tab === 'societies' && <>
          <h2 className="pb-sheet-title">🏘️ Manage Societies</h2>
          <p className="pb-setup-sub">{DEFAULT_SOCIETIES.length} built-in · {custom.length} custom</p>
          <div className="pb-soc-add-row">
            <input className="pb-url-input" placeholder="Type new society name…"
              value={newSoc} onChange={e=>setNewSoc(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&addSoc()} />
            <button className="pb-btn pb-primary" onClick={addSoc} disabled={!newSoc.trim()}>Add</button>
          </div>
          {custom.length > 0 && <>
            <p className="pb-setup-sub" style={{marginTop:12}}>Your custom societies:</p>
            <div className="pb-soc-list">
              {custom.map(s => (
                <div key={s} className="pb-soc-item">
                  <span>{s}</span>
                  <button className="pb-soc-del" onClick={()=>delSoc(s)}>✕</button>
                </div>
              ))}
            </div>
          </>}
          <p className="pb-setup-sub" style={{marginTop:12}}>Built-in ({DEFAULT_SOCIETIES.length}):</p>
          <div className="pb-soc-list pb-soc-builtin">
            {DEFAULT_SOCIETIES.map(s => <div key={s} className="pb-soc-item"><span>{s}</span></div>)}
          </div>
          <div className="pb-sheet-actions">
            <button className="pb-btn pb-primary" onClick={() => onSave(null)}>Done</button>
          </div>
        </>}
      </div>
    </div>
  );
}

// ── Filter sheet ──────────────────────────────────────────────────
function FilterSheet({ headers, rows, filters, onApply, onClose }) {
  const [local, setLocal] = useState({ ...filters });
  const uniq = (col) => {
    if (col.toLowerCase().includes('progress')) {
      const fromData = rows.map(r => r[col]).filter(Boolean);
      return [...new Set([...PROGRESS_OPTIONS, ...fromData])];
    }
    if (isPainterField(col)) {
      // Painter cells are comma-separated — flatten into individual names
      const names = rows.flatMap(r => parsePainters(r[col] || ''));
      return [...new Set([...allPainterOptions(), ...names])].sort();
    }
    if (col.toLowerCase().includes('society')) {
      return allSocietyOptions(rows, col);
    }
    return [...new Set(rows.map(r => r[col]).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  };
  return (
    <div className="pb-sheet-overlay" onClick={onClose}>
      <div className="pb-bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="pb-sheet-handle" />
        <h2 className="pb-sheet-title">🔽 Filter</h2>
        <div className="pb-filter-list">
          {headers.filter(h => h && h !== '#').map(h => (
            <div key={h} className="pb-filter-item">
              <label className="pb-filter-label">{h}</label>
              <select className="pb-filter-select"
                value={local[h] ?? ''}
                onChange={e => setLocal(f => ({ ...f, [h]: e.target.value }))}>
                <option value="">All</option>
                {uniq(h).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="pb-sheet-actions">
          <button className="pb-btn pb-ghost"
            onClick={() => { setLocal({}); onApply({}); onClose(); }}>Clear all</button>
          <button className="pb-btn pb-primary"
            onClick={() => { onApply(local); onClose(); }}>Apply</button>
        </div>
      </div>
    </div>
  );
}

// ── Expandable detail field ───────────────────────────────────────
function DetailField({ label, value }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = isLongTextField(label) || String(value).length > 80;
  const isProg = label.toLowerCase().includes('progress');
  const isPainter = isPainterField(label);
  const truncated = !expanded && isLong && String(value).length > 100;

  return (
    <div className="pb-detail-row">
      <span className="pb-detail-key">{displayLabel(label)}</span>
      <span className={`pb-detail-val ${isProg ? progressClass(value) + ' badge' : ''}`}>
        {isPainter
          ? parsePainters(value).map(p => <span key={p} className="pb-painter-tag" style={{marginRight:4}}>{p}</span>)
          : truncated
            ? <>{String(value).slice(0, 100)}… <button className="pb-expand-btn" onClick={() => setExpanded(true)}>Show more</button></>
            : expanded
              ? <>{value} <button className="pb-expand-btn" onClick={() => setExpanded(false)}>Show less</button></>
              : value
        }
      </span>
    </div>
  );
}

// ── Token helpers (shared with painter portal) ────────────────────
function pbIsAmountField(h) {
  const hl = h.toLowerCase().replace(/\s+/g,'');
  if (hl === 'tokenhistory') return false;
  const ht = h.toLowerCase().trim();
  return ht === 'pending' || ht === 'token received' || ht === 'token amount' ||
    (ht.includes('token') && !ht.includes('date'));
}
function pbIsHistoryField(h) { return h.toLowerCase().replace(/\s+/g,'') === 'tokenhistory'; }
function pbParseHistory(val) {
  if (!val) return [];
  return String(val).split('|').map(e => {
    const idx = e.lastIndexOf(':');
    return idx < 0 ? null : { date: e.slice(0, idx), amount: parseFloat(e.slice(idx+1)) || 0 };
  }).filter(e => e && e.amount > 0);
}
function pbFmtHistory(history) { return history.map(e => `${e.date}:${e.amount}`).join('|'); }
function pbParseLegacy(val) {
  if (!val) return { total:0, history:[] };
  const p = String(val).split('||');
  return { total: parseFloat(p[0])||0, history: p[1] ? pbParseHistory(p[1]) : [] };
}
function pbToday() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear().toString().slice(-2)}`;
}
function pbWithMr(n) { return n && n !== '—' ? 'Mr. ' + n : n; }

// ── Thank You Modal ──────────────────────────────────────────────
function PBThankYouModal({ name, phone, customerUrl, onClose }) {
  const cardRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [copied,    setCopied]    = useState(false);

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
          const a = document.createElement('a'); a.href = url;
          a.download = 'thankyou-thepainterboys.png'; a.click();
          URL.revokeObjectURL(url);
        }
        setCapturing(false);
      }, 'image/png');
    } catch { setCapturing(false); }
  }

  const shareCustomer = () => {
    if (!customerUrl) return;
    const msg = [
      `🎨 *The Painter Boys*`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `Dear ${(name && name !== '—') ? pbWithMr(name) : 'Customer'},`,
      ``,
      `Thank you for reaching out to *The Painter Boys*.`,
      `Our team will contact you shortly.`,
      ``,
      `📋 View your job details here:`,
      customerUrl,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `🌐 www.thepainterboys.com`,
      `📞 Corporate: 7838888509`,
    ].join('\n');
    const waUrl = `https://wa.me/${phone ? phone.replace(/\D/g,'') : ''}?text=${encodeURIComponent(msg)}`;
    window.open(phone ? waUrl : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const copyLink = () => {
    if (!customerUrl) return;
    navigator.clipboard?.writeText(customerUrl).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2200);
    }).catch(() => window.prompt('Copy customer link:', customerUrl));
  };

  return (
    <div className="pr-overlay" onClick={onClose}>
      <div className="pr-wrap" onClick={e => e.stopPropagation()}>
        <div className="ty-card" ref={cardRef}>
          <div className="ty-top-strip" />
          <div className="ty-header">
            <div className="ty-brush">🎨</div>
            <div className="ty-brand">The Painter Boys</div>
            <div className="ty-tagline">Professional Painting Services</div>
          </div>
          <div className="ty-divider" />
          <div className="ty-body">
            <div className="ty-star-row">✦ &nbsp; ✦ &nbsp; ✦</div>
            <div className="ty-thankyou">Thank You!</div>
            <div className="ty-dear">Dear {(name && name !== '—') ? pbWithMr(name) : 'Customer'},</div>
            <div className="ty-message">Thank you for reaching out to<br /><strong>The Painter Boys.</strong></div>
            <div className="ty-highlight">Our representative will contact<br />you shortly.</div>
            <div className="ty-promise">We look forward to transforming<br />your space with our expert<br />painting services.</div>
          </div>
          <div className="ty-divider" />
          <div className="ty-footer">
            <div className="ty-footer-url">🌐 www.thepainterboys.com</div>
            <div className="ty-footer-phone">📞 Corporate: 7838888509</div>
          </div>
          <div className="ty-bottom-strip" />
        </div>

        <div className="pr-actions">
          <button className="pr-wa-btn pr-wa-share" onClick={shareCard} disabled={capturing}>
            {capturing ? '⏳ Preparing…' : '📤 Share Thank You Card'}
          </button>
          {customerUrl && (
            <>
              <button className="pr-wa-btn" style={{background:'#25d366'}} onClick={shareCustomer}>
                💬 Send Job Link on WhatsApp
              </button>
              <button className="pr-wa-btn" style={{background:'#334155'}} onClick={copyLink}>
                {copied ? '✓ Copied!' : '🔗 Copy Customer Link'}
              </button>
            </>
          )}
          <button className="pr-close-btn" onClick={onClose}>✕ Close</button>
        </div>
      </div>
    </div>
  );
}

// ── PB Receipt Modal ──────────────────────────────────────────────
function PBReceiptModal({ name, phone, society, address, fieldName, td, allTokenData = {}, totalJobAmount = 0, onClose }) {
  const cardRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const fullAddress = [society, address].filter(Boolean).join(', ');

  const entries       = Object.entries(allTokenData);
  const receivedTotal = entries.filter(([k]) => !k.toLowerCase().includes('pending'))
    .reduce((s, [, v]) => s + (v.total || 0), 0) || td.total;
  const pendingFromCol= entries.filter(([k]) => k.toLowerCase().includes('pending'))
    .reduce((s, [, v]) => s + (v.total || 0), 0);
  // Use Pending column if set; otherwise derive from Amount column
  const pendingTotal  = pendingFromCol > 0 ? pendingFromCol
    : (totalJobAmount > receivedTotal ? totalJobAmount - receivedTotal : 0);
  const grandTotal    = totalJobAmount > 0 ? totalJobAmount : receivedTotal + pendingTotal;

  const waText = [
    `🎨 *The Painter Boys*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `👤 *Customer:* ${pbWithMr(name)}`,
    fullAddress ? `🏘️ *Address:* ${fullAddress}` : '',
    phone   ? `📞 *Phone:* ${phone}` : '',
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `💰 *PAYMENT HISTORY*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    ...td.history.map(e => `📅 ${e.date}   ₹${e.amount.toLocaleString()}`),
    ``,
    `✅ *Total Received = ₹${receivedTotal.toLocaleString()}*`,
    pendingTotal > 0 ? `⏳ *Pending Amount = ₹${pendingTotal.toLocaleString()}*` : '',
    grandTotal > 0 ? `📋 *Total Amount = ₹${grandTotal.toLocaleString()}*` : '',
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
        scale: 2, useCORS: true, backgroundColor: '#1a1a2e', logging: false,
      });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'receipt-thepainterboys.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: 'Payment Summary — The Painter Boys' }); } catch {}
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
          <div className="pr-header">
            <div className="pr-logo">🎨</div>
            <div className="pr-company">The Painter Boys</div>
            <div className="pr-tagline">Professional Painting Services</div>
          </div>
          <div className="pr-badge">PAYMENT SUMMARY</div>
          <div className="pr-section">
            <div className="pr-section-title">CUSTOMER DETAILS</div>
            <div className="pr-row"><span className="pr-label">Name</span><span>{pbWithMr(name)}</span></div>
            {society && <div className="pr-row"><span className="pr-label">Society</span><span>{society}</span></div>}
            {address && <div className="pr-row"><span className="pr-label">Address</span><span>{address}</span></div>}
            {phone   && <div className="pr-row"><span className="pr-label">Phone</span><span>{phone}</span></div>}
          </div>
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
          {grandTotal > 0 && (
            <div className="pr-total pr-total-grand">
              <span>📋 Total Amount</span>
              <span>₹{grandTotal.toLocaleString()}</span>
            </div>
          )}
          <div className="pr-total pr-total-received">
            <span>✅ Total Received</span>
            <span>₹{receivedTotal.toLocaleString()}</span>
          </div>
          {pendingTotal > 0 && (
            <div className="pr-total pr-total-pending">
              <span>⏳ Pending Amount</span>
              <span>₹{pendingTotal.toLocaleString()}</span>
            </div>
          )}
          <div className="pr-footer">
            <div className="pr-footer-url">🌐 www.thepainterboys.com</div>
            <div className="pr-footer-phone">📞 Corporate: 7838888509</div>
          </div>
        </div>
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

// ── Detail / Edit sheet ───────────────────────────────────────────
function DetailSheet({ row, headers, rows, onClose, onSave, onDelete, saving, scriptUrl }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState(() => {
    const f = {};
    headers.forEach(h => { f[h] = row[h] ?? ''; });
    return f;
  });
  const phone = row['Phone'] || row['phone'] || '';
  const name  = row['Contact Name'] || row['Name'] || row['name'] || Object.values(row).find(v => v && v !== row.__row) || '';
  const societyKey = headers.find(h => h.toLowerCase().includes('society')) || '';
  const society    = societyKey ? row[societyKey] : '';
  const addressKey = headers.find(h => h.toLowerCase().trim() === 'address') || '';
  const address    = addressKey ? row[addressKey] : '';

  // ── Token state ──────────────────────────────────────────────────
  const amountHeaders    = headers.filter(pbIsAmountField);
  const historyColHeader = headers.find(pbIsHistoryField) || '';
  const LS_HIST_KEY      = `pb_hist_${row.__row}`;

  const [tokenData, setTokenData] = useState(() => {
    const init = {};
    let history = [];
    try {
      const lh = localStorage.getItem(LS_HIST_KEY);
      if (lh) history = pbParseHistory(lh);
    } catch {}
    if (!history.length && historyColHeader) history = pbParseHistory(row[historyColHeader] || '');
    if (!history.length) amountHeaders.forEach(h => {
      const leg = pbParseLegacy(row[h] || '');
      if (leg.history.length > history.length) history = leg.history;
    });
    amountHeaders.forEach(h => { init[h] = { total: parseFloat(row[h]) || 0, history }; });
    return init;
  });
  const [addAmounts,    setAddAmounts]    = useState(() => { const i={}; amountHeaders.forEach(h=>{i[h]=''}); return i; });
  const [tokSaving,     setTokSaving]     = useState(false);
  const [tokSaved,      setTokSaved]      = useState(false);
  const [receiptFor,    setReceiptFor]    = useState(null);
  const [showThankYou,  setShowThankYou]  = useState(false);
  const [shareCustomer, setShareCustomer] = useState(false);
  const [custCopied,    setCustCopied]    = useState(false);

  const progressKey = headers.find(h => h.toLowerCase().includes('progress')) || '';
  const progress    = row[progressKey] || '';
  const isInquiry   = progress.toLowerCase().includes('inqu');

  const saveTokenToSheet = async (cellValues) => {
    if (!scriptUrl) return;
    const values = headers.map(h => (h in cellValues ? cellValues[h] : (row[h] ?? '')));
    await callScript(scriptUrl, { action: 'update', rowIndex: row.__row, values });
  };

  const urlSavedRef = useRef(false);
  useEffect(() => {
    if (!shareCustomer || urlSavedRef.current || !scriptUrl) return;
    const urlHeader = headers.find(h => h.toLowerCase().replace(/\s+/g, '') === 'customerurl');
    if (!urlHeader) return;
    urlSavedRef.current = true;
    const url = buildCustomerUrl(row, headers, tokenData);
    saveTokenToSheet({ [urlHeader]: url });
  }, [shareCustomer]);

  const handleSaveToken = async () => {
    if (!amountHeaders.some(h => parseFloat(addAmounts[h]) > 0)) return;
    setTokSaving(true);
    const newTd = {}, cv = {};
    amountHeaders.forEach(h => {
      const v = parseFloat(addAmounts[h]) || 0;
      if (!v) { newTd[h] = tokenData[h]; return; }
      const ex = tokenData[h] || { total:0, history:[] };
      const newTotal   = ex.total + v;
      const newHistory = [...ex.history, { date: pbToday(), amount: v }];
      newTd[h] = { total: newTotal, history: newHistory };
      cv[h]    = String(newTotal);
      if (historyColHeader) cv[historyColHeader] = pbFmtHistory(newHistory);
      try { localStorage.setItem(LS_HIST_KEY, pbFmtHistory(newHistory)); } catch {}
    });
    try { await saveTokenToSheet(cv); } catch {}
    setTokenData(p => ({ ...p, ...newTd }));
    setAddAmounts(p => { const r={...p}; amountHeaders.forEach(h=>{r[h]=''}); return r; });
    setTokSaved(true); setTimeout(()=>setTokSaved(false), 3000);
    setTokSaving(false);
  };

  const handleDelLastToken = async (h) => {
    const td = tokenData[h];
    if (!td || !td.history.length) return;
    const newHistory = td.history.slice(0,-1);
    const newTotal   = Math.max(0, td.total - td.history[td.history.length-1].amount);
    const cv = { [h]: String(newTotal) };
    if (historyColHeader) cv[historyColHeader] = pbFmtHistory(newHistory);
    try { localStorage.setItem(LS_HIST_KEY, pbFmtHistory(newHistory)); } catch {}
    setTokSaving(true);
    try { await saveTokenToSheet(cv); } catch {}
    setTokenData(p => ({ ...p, [h]: { total: newTotal, history: newHistory } }));
    setTokSaving(false);
  };

  return (
    <>
    <div className="pb-sheet-overlay" onClick={onClose}>
      <div className="pb-bottom-sheet pb-detail-sheet" onClick={e => e.stopPropagation()}>
        <div className="pb-sheet-handle" />
        <div className="pb-detail-header">
          <div>
            <div className="pb-detail-name">{name}</div>
            {phone && <a className="pb-detail-phone" href={`tel:${phone}`}>📞 {phone}</a>}
          </div>
          <div className="pb-detail-header-btns">
            {scriptUrl && !editing && (
              <button className="pb-icon-action" onClick={() => setEditing(true)}>✏️</button>
            )}
            {scriptUrl && !editing && (
              <button className="pb-icon-action pb-icon-del" disabled title="Delete disabled">🗑️</button>
            )}
            <button className="pb-icon-action" onClick={onClose}>✕</button>
          </div>
        </div>

        {!editing ? (
          <div className="pb-detail-fields">
            {headers.filter(h => h && h !== '#').map(h => row[h] ? (
              <DetailField key={h} label={h} value={row[h]} />
            ) : null)}
          </div>
        ) : (
          <div className="pb-edit-fields">
            {headers.filter(h => h && h !== '#').map(h => (
              <div key={h} className="pb-edit-field">
                <label className="pb-edit-label">
                  {displayLabel(h)}
                  {isComboField(h) && <span className="pb-combo-hint"> — select or type new</span>}
                </label>
                <FormField header={h} value={form[h]} rows={rows}
                  onChange={val => setForm(f => ({ ...f, [h]: val }))} />
              </div>
            ))}
          </div>
        )}

        {/* ── Token / Amount section ── */}
        {!editing && amountHeaders.length > 0 && (
          <div className="pb-token-section">
            <div className="pb-token-title">💰 Token / Amount</div>
            {amountHeaders.map(h => {
              const td     = tokenData[h] || { total:0, history:[] };
              const addVal = parseFloat(addAmounts[h]) || 0;
              return (
                <div key={h} className="pb-token-block">
                  <div className="pb-token-field-label">{h}</div>
                  {td.history.length > 0 && (
                    <div className="pb-token-history">
                      {td.history.map((e, i) => (
                        <div key={i} className="pb-token-hist-row">
                          <span className="pb-token-hist-date">📅 {e.date}</span>
                          <span className="pb-token-hist-amt">₹{e.amount.toLocaleString()}</span>
                          {i === td.history.length-1 && (
                            <button className="pb-token-del" onClick={() => handleDelLastToken(h)} disabled={tokSaving}>🗑️</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {td.total > 0 && (
                    <div className="pb-token-total-row">
                      <span className="pb-token-total">Total received: <strong>₹{td.total.toLocaleString()}</strong></span>
                      {td.history.length > 0 && (
                        <button className="pb-token-receipt-btn" onClick={() => {
                          const amtKey = headers.find(hh => hh.toLowerCase().trim() === 'amount') || '';
                          setReceiptFor({ h, td, allTokenData: tokenData, totalJobAmount: amtKey ? parseFloat(row[amtKey]) || 0 : 0 });
                        }}>🧾 Receipt</button>
                      )}
                    </div>
                  )}
                  <div className="pb-token-add-row">
                    <span className="pb-token-add-label">Add now</span>
                    <div className="pb-token-input-wrap">
                      <span className="pb-token-rupee">₹</span>
                      <input className="pb-token-input" type="text" inputMode="numeric"
                        value={addAmounts[h]} placeholder="0"
                        onChange={e => { const v=e.target.value.replace(/[^0-9]/g,''); setAddAmounts(a=>({...a,[h]:v})); }} />
                    </div>
                  </div>
                  {addVal > 0 && (
                    <div className="pb-token-preview">New total: <strong>₹{(td.total+addVal).toLocaleString()}</strong></div>
                  )}
                </div>
              );
            })}
            <button className={`pb-token-save-btn${tokSaved?' pb-token-saved':''}`}
              onClick={handleSaveToken} disabled={tokSaving}>
              {tokSaving ? 'Saving…' : tokSaved ? '✓ Saved!' : 'Save Amount'}
            </button>
          </div>
        )}

        {/* Thank You — inquiry only */}
        {!editing && isInquiry && (
          <button className="pp-ty-btn" onClick={() => setShowThankYou(true)}>
            💌 Share Thank You Card
          </button>
        )}

        {/* Share job link with customer — always available */}
        {!editing && (
          <div className="pb-share-customer-wrap">
            {!shareCustomer ? (
              <button className="pb-share-customer-btn"
                onClick={() => setShareCustomer(true)}>
                📤 Share Job Details with Customer
              </button>
            ) : (
              <div className="pb-share-customer-panel">
                <div className="pb-share-customer-hd">Share job link</div>
                {(() => {
                  const url = buildCustomerUrl(row, headers, tokenData);
                  const societyK  = headers.find(h => h.toLowerCase().includes('society')) || '';
                  const progressK = headers.find(h => h.toLowerCase().includes('progress')) || '';
                  const soc = societyK  ? row[societyK]  : '';
                  const prg = progressK ? row[progressK] : '';
                  const msg = [
                    `🎨 *The Painter Boys*`,
                    `_Professional Painting Services_`,
                    `━━━━━━━━━━━━━━━━━━━━━━`,
                    ``,
                    `Dear ${name ? pbWithMr(name) : 'Customer'},`,
                    ``,
                    `Thank you for choosing *The Painter Boys*! 🙏`,
                    ``,
                    soc ? `🏘️ *Society:* ${soc}` : '',
                    prg ? `📊 *Status:* ${prg}` : '',
                    ``,
                    `📋 *View your complete job details & payment summary here:*`,
                    url,
                    ``,
                    `For any queries, feel free to reach us:`,
                    `📞 *Corporate:* +91 7838888509`,
                    `🌐 www.thepainterboys.com`,
                    `━━━━━━━━━━━━━━━━━━━━━━`,
                    `_The Painter Boys — Trusted Since 2010_`,
                  ].filter(l => l !== '').join('\n');
                  const waUrl = phone
                    ? `https://wa.me/${phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`
                    : `https://wa.me/?text=${encodeURIComponent(msg)}`;
                  return (
                    <div className="pb-share-customer-btns">
                      <a className="pb-share-wa" href={waUrl} target="_blank" rel="noopener noreferrer">
                        💬 Send on WhatsApp
                      </a>
                      <button className="pb-share-copy"
                        onClick={() => {
                          navigator.clipboard?.writeText(url).then(() => {
                            setCustCopied(true); setTimeout(() => setCustCopied(false), 2200);
                          }).catch(() => window.prompt('Copy link:', url));
                        }}>
                        {custCopied ? '✓ Copied!' : '🔗 Copy Link'}
                      </button>
                      <button className="pb-share-cancel" onClick={() => setShareCustomer(false)}>✕</button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {editing && (
          <div className="pb-sheet-actions">
            <button className="pb-btn pb-ghost" onClick={() => setEditing(false)}>Cancel</button>
            <button className="pb-btn pb-primary" disabled={saving}
              onClick={() => onSave(form)}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>

    {receiptFor && (
      <PBReceiptModal
        name={name} phone={phone} society={society} address={address}
        fieldName={receiptFor.h} td={receiptFor.td} allTokenData={receiptFor.allTokenData}
        totalJobAmount={receiptFor.totalJobAmount || 0}
        onClose={() => setReceiptFor(null)}
      />
    )}
    {showThankYou && (
      <PBThankYouModal
        name={name} phone={phone}
        customerUrl={buildCustomerUrl(row, headers, tokenData)}
        onClose={() => setShowThankYou(false)}
      />
    )}
    </>
  );
}

// ── Add sheet ─────────────────────────────────────────────────────
function AddSheet({ headers, rows, onClose, onSave, saving }) {
  const addHeaders = headers.filter(h => h && h !== '#' && !pbIsAmountField(h) && !pbIsHistoryField(h));
  const [form, setForm] = useState(() => {
    const f = {};
    addHeaders.forEach(h => { f[h] = ''; });
    return f;
  });
  const [errors, setErrors] = useState({});

  const handleSave = () => {
    const errs = {};
    addHeaders.filter(h => isRequiredField(h)).forEach(h => {
      if (!form[h]?.trim()) errs[h] = true;
    });
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSave(form);
  };

  return (
    <div className="pb-sheet-overlay" onClick={onClose}>
      <div className="pb-bottom-sheet pb-detail-sheet" onClick={e => e.stopPropagation()}>
        <div className="pb-sheet-handle" />
        <h2 className="pb-sheet-title">➕ Add New Record</h2>
        <div className="pb-edit-fields">
          {addHeaders.map(h => (
            <div key={h} className="pb-edit-field">
              <label className="pb-edit-label">
                {displayLabel(h)}
                {isRequiredField(h) && <span className="pb-required-star"> *</span>}
                {isComboField(h) && <span className="pb-combo-hint"> — select or type new</span>}
              </label>
              <FormField header={h} value={form[h]} rows={rows}
                onChange={val => { setForm(f => ({ ...f, [h]: val })); setErrors(e => ({...e, [h]: false})); }} />
              {errors[h] && <span className="pb-field-error">This field is required</span>}
            </div>
          ))}
        </div>
        <div className="pb-sheet-actions">
          <button className="pb-btn pb-ghost" onClick={onClose}>Cancel</button>
          <button className="pb-btn pb-primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Adding…' : 'Add Record'}
          </button>
        </div>
      </div>
    </div>
  );
}



// ── Card ──────────────────────────────────────────────────────────
function RecordCard({ row, headers, onClick }) {
  const [cardReceipt, setCardReceipt] = useState(null);

  const name     = row['Contact Name'] || row['Name'] || row['name'] || '—';
  const phone    = row['Phone'] || row['phone'] || '';
  const societyKey = headers.find(h => h.toLowerCase().includes('society')) || '';
  const society  = societyKey ? row[societyKey] : '';
  const address  = row['Address'] || row['address'] || '';
  const progress = row['Progress'] || row['progress'] || '';
  const paint    = row['Type of Paint'] || row['Type of paint'] || '';
  const date     = row['Date Contacted'] || row['Date Started'] || '';
  const remarks  = row['Remarks'] || row['remarks'] || '';
  const painterKey = Object.keys(row).find(k => isPainterField(k)) || '';
  const painter  = painterKey ? row[painterKey] : '';

  // Token history for receipt button
  const historyColHeader = headers.find(pbIsHistoryField) || '';
  const amountHeaders    = headers.filter(pbIsAmountField);
  const LS_HIST_KEY      = `pb_hist_${row.__row}`;
  const cardTokenData    = useMemo(() => {
    let history = [];
    try {
      const lh = localStorage.getItem(LS_HIST_KEY);
      if (lh) history = pbParseHistory(lh);
    } catch {}
    if (!history.length && historyColHeader) history = pbParseHistory(row[historyColHeader] || '');
    if (!history.length) {
      amountHeaders.forEach(h => {
        const leg = pbParseLegacy(row[h] || '');
        if (leg.history.length > history.length) history = leg.history;
      });
    }
    const amtHeader = amountHeaders[0] || '';
    const total = history.reduce((s, e) => s + e.amount, 0) || (amtHeader ? parseFloat(row[amtHeader]) || 0 : 0);
    return { total, history, fieldName: amtHeader };
  }, [row, historyColHeader, amountHeaders, LS_HIST_KEY]);

  const waLines = [
    `*${name}*`,
    phone    ? `📞 ${phone}` : '',
    society  ? `🏘️ ${society}` : '',
    address  ? `📍 ${address}` : '',
    progress ? `📊 ${progress}` : '',
    painter  ? `👷 ${painter}` : '',
    date     ? `📅 ${formatDate(date)}` : '',
    remarks  ? `💬 ${remarks}` : '',
  ].filter(Boolean).join('\n');
  const waHref = `https://wa.me/?text=${encodeURIComponent(waLines)}`;

  return (
    <>
    <div className={`pb-card ${cardAccent(progress)}`} onClick={onClick}>
      <div className="pb-card-top">
        <div className="pb-card-name">{name}</div>
        <div className="pb-card-top-right">
          {progress && <span className={`pb-badge ${progressClass(progress)}`}>{progress}</span>}
          <a className="pb-wa-btn" href={waHref} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()} title="Share on WhatsApp">💬</a>
        </div>
      </div>
      {phone   && <div className="pb-card-row">📞 <span>{phone}</span></div>}
      {society && <div className="pb-card-row">🏘️ <span>{society}</span></div>}
      {address && <div className="pb-card-row pb-card-addr">📍 <span>{address}</span></div>}
      {paint   && <div className="pb-card-row">🎨 <span>{paint}</span></div>}
      {painter && (
        <div className="pb-card-row pb-card-painters">
          👷 {parsePainters(painter).map(p => (
            <span key={p} className="pb-painter-tag">{p}</span>
          ))}
        </div>
      )}
      {date    && <div className="pb-card-row">📅 <span>{formatDate(date)}</span></div>}
      {remarks && <div className="pb-card-remarks">{remarks}</div>}
      {cardTokenData.total > 0 && (
        <button className="pb-card-receipt-btn"
          onClick={e => { e.stopPropagation(); setCardReceipt(cardTokenData); }}>
          🧾 View Receipt · ₹{cardTokenData.total.toLocaleString()}
        </button>
      )}
    </div>
    {cardReceipt && (
      <PBReceiptModal
        name={name} phone={phone} society={society} address={address}
        fieldName={cardReceipt.fieldName} td={cardReceipt}
        onClose={() => setCardReceipt(null)} />
    )}
    </>
  );
}

// ── Password gate ─────────────────────────────────────────────────
function PBPasswordGate({ onSuccess }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (value === 'PB2026') {
      sessionStorage.setItem('pb_auth', '1');
      onSuccess();
    } else {
      setError(true); setShake(true); setValue('');
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="pb-gate-overlay">
      <div className={`pb-gate-card ${shake ? 'pb-gate-shake' : ''}`}>
        <div className="pb-gate-icon">🔒</div>
        <h2 className="pb-gate-title">The Painter Boys CRM</h2>
        <p className="pb-gate-sub">Enter password to continue</p>
        <form onSubmit={submit} className="pb-gate-form">
          <input
            className={`pb-gate-input ${error ? 'pb-gate-input-err' : ''}`}
            type="password"
            placeholder="Password"
            value={value}
            autoFocus
            onChange={e => { setValue(e.target.value); setError(false); }}
          />
          {error && <p className="pb-gate-error">Incorrect password</p>}
          <button type="submit" className="pb-btn pb-primary pb-gate-btn">Enter →</button>
        </form>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function PBDashboard() {
  // All hooks must be at the top — no early returns before this block
  const [authed,     setAuthed]    = useState(() => sessionStorage.getItem('pb_auth') === '1');
  const [headers,    setHeaders]   = useState([]);
  const [rows,       setRows]      = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState(null);
  const [search,     setSearch]    = useState('');
  const [filters,    setFilters]   = useState({});
  const [sheet,      setSheet]     = useState(null);
  const [scriptUrl,  setScriptUrl] = useState(() => localStorage.getItem(LS_KEY) || null);
  const [saving,     setSaving]    = useState(false);
  const [toast,      setToast]     = useState(null);
  const [showDone,   setShowDone]  = useState(false);
  const [lastSynced, setLastSynced]= useState(null);
  const [sortBy,     setSortBy]    = useState('default');
  const [refreshing, setRefreshing]= useState(false);
  const mainRef    = useRef(null);
  const touchStartY= useRef(0);

  const showToast = useCallback((msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true); setRefreshing(true); setError(null);
    try {
      const res  = await fetch(CSV_URL);
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      const { headers: h, rows: r } = parseCSV(text);
      setHeaders(h);
      setRows(r);
      setLastSynced(Date.now());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-open detail sheet when coming from customer page edit button (?edit=ROW)
  useEffect(() => {
    if (!authed) return;
    const editRow = new URLSearchParams(window.location.search).get('edit');
    if (!editRow || rows.length === 0) return;
    const target = rows.find(r => String(r.__row) === editRow);
    if (target) {
      setSheet({ type: 'detail', row: target });
      window.history.replaceState({}, '', '/pb'); // clean URL
    }
  }, [rows, authed]);

  const filtered = useMemo(() => {
    let r = rows;
    // Skip active-only filter if user has explicitly set a Progress column filter
    const hasProgressFilter = Object.entries(filters).some(
      ([col, val]) => col.toLowerCase().includes('progress') && val
    );
    if (!showDone && !hasProgressFilter) {
      r = r.filter(row => {
        const p = (row['Progress'] || row['progress'] || '').toLowerCase();
        return !p.includes('compl') && !p.includes('cancel');
      });
    }
    const q = search.toLowerCase();
    if (q) r = r.filter(row => headers.some(h => (row[h] ?? '').toLowerCase().includes(q)));
    Object.entries(filters).forEach(([col, val]) => {
      if (!val) return;
      if (isPainterField(col)) {
        // Painter cell is comma-separated; filter to rows containing this painter
        r = r.filter(row => parsePainters(row[col] || '').includes(val));
      } else {
        r = r.filter(row => row[col] === val);
      }
    });
    return r;
  }, [rows, headers, search, filters, showDone]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Stats across ALL rows (not filtered)
  const statusCounts = useMemo(() => {
    const c = { inquiry:0, pending:0, notStarted:0, inProgress:0, completed:0, cancelled:0 };
    rows.forEach(row => {
      const p = (row['Progress'] || row['progress'] || '').toLowerCase();
      if (p.includes('inqu'))                               c.inquiry++;
      else if (p.includes('pending'))                       c.pending++;
      else if (p.includes('not s'))                         c.notStarted++;
      else if (p.includes('progress') || p.includes('ongoing')) c.inProgress++;
      else if (p.includes('compl'))                         c.completed++;
      else if (p.includes('cancel'))                        c.cancelled++;
    });
    return c;
  }, [rows]);

  // Sorted view of filtered rows
  const displayed = useMemo(() => {
    if (sortBy === 'default') return filtered;
    const dateKey     = headers.find(h => DATE_FIELDS.some(k => h.toLowerCase().includes(k))) || '';
    const progressKey = headers.find(h => h.toLowerCase().includes('progress')) || '';
    const societyKey  = headers.find(h => h.toLowerCase().includes('society'))  || '';
    const arr = [...filtered];
    if (sortBy === 'date-desc') arr.sort((a, b) => (b[dateKey]||'').localeCompare(a[dateKey]||''));
    else if (sortBy === 'date-asc')  arr.sort((a, b) => (a[dateKey]||'').localeCompare(b[dateKey]||''));
    else if (sortBy === 'status')    arr.sort((a, b) => {
      const ia = PROGRESS_OPTIONS.findIndex(o => o.toLowerCase() === (a[progressKey]||'').toLowerCase());
      const ib = PROGRESS_OPTIONS.findIndex(o => o.toLowerCase() === (b[progressKey]||'').toLowerCase());
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    else if (sortBy === 'society')   arr.sort((a, b) => (a[societyKey]||'').localeCompare(b[societyKey]||''));
    return arr;
  }, [filtered, sortBy, headers]);

  const requireScript = (fn) => {
    if (!scriptUrl) { setSheet('setup'); return; }
    fn();
  };

  const handleAdd = async (form) => {
    if (!scriptUrl) {
      showToast('⚙️ Apps Script URL not set — tap Settings to configure', false);
      return; // keep AddSheet open, don't navigate away
    }
    setSaving(true);
    const values = headers.map(h => form[h] ?? '');
    await callScript(scriptUrl, { action: 'append', values });
    setSaving(false); setSheet(null);
    showToast('Record added — refreshing…');
    setTimeout(fetchData, 1800);
  };

  const handleEdit = async (form) => {
    if (!scriptUrl) { setSheet('setup'); return; }
    setSaving(true);
    const values = headers.map(h => form[h] ?? '');
    await callScript(scriptUrl, { action: 'update', rowIndex: sheet.row.__row, values });
    setSaving(false); setSheet(null);
    showToast('Record updated — refreshing…');
    setTimeout(fetchData, 1800);
  };

  const handleDelete = async () => {
    if (!scriptUrl) { setSheet('setup'); return; }
    if (!window.confirm('Delete this record?')) return;
    setSaving(true);
    await callScript(scriptUrl, { action: 'delete', rowIndex: sheet.row.__row });
    setSaving(false); setSheet(null);
    showToast('Deleted — refreshing…');
    setTimeout(fetchData, 1800);
  };

  if (!authed) return <PBPasswordGate onSuccess={() => setAuthed(true)} />;

  return (
    <div className="pb-root">

      {/* ── Header ──────────────────────────────── */}
      <header className="pb-header">
        <div className="pb-header-top">
          <div className="pb-header-brand">
            <span className="pb-logo-icon">📊</span>
            <span className="pb-brand-name">The Painter Boys CRM</span>
            {!loading && <span className="pb-count">{filtered.length} of {rows.length}</span>}
          </div>
          <div className="pb-header-actions">
            {lastSynced && <span className="pb-synced">{timeAgo(lastSynced)}</span>}
            <button className={`pb-icon-btn${refreshing ? ' pb-spin' : ''}`} onClick={fetchData} title="Refresh">↻</button>
            <button className="pb-icon-btn" onClick={() => setSheet('setup')} title="Settings">⚙</button>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && rows.length > 0 && (
          <div className="pb-stats-bar">
            {statusCounts.inquiry    > 0 && <span className="pb-stat pb-stat-purple">💡 {statusCounts.inquiry} Inquiry</span>}
            {statusCounts.pending    > 0 && <span className="pb-stat pb-stat-purple">🕐 {statusCounts.pending} Pending</span>}
            {statusCounts.notStarted > 0 && <span className="pb-stat pb-stat-amber">⏳ {statusCounts.notStarted} Not Started</span>}
            {statusCounts.inProgress > 0 && <span className="pb-stat pb-stat-green">🔨 {statusCounts.inProgress} In Progress</span>}
            {statusCounts.completed  > 0 && <span className="pb-stat pb-stat-blue">✅ {statusCounts.completed} Done</span>}
            {statusCounts.cancelled  > 0 && <span className="pb-stat pb-stat-red">❌ {statusCounts.cancelled} Cancelled</span>}
          </div>
        )}

        <div className="pb-search-row">
          <div className="pb-search-wrap">
            <span className="pb-search-icon">🔍</span>
            <input className="pb-search" placeholder="Search name, phone, address…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="pb-search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>
          <button
            className={`pb-filter-btn ${showDone ? 'pb-filter-active' : ''}`}
            onClick={() => setShowDone(s => !s)}>
            {showDone ? '👁 All' : '⚡ Active'}
          </button>
          <button
            className={`pb-filter-btn ${activeFilterCount ? 'pb-filter-active' : ''}`}
            onClick={() => setSheet('filter')}>
            🔽 {activeFilterCount > 0 ? `Filter (${activeFilterCount})` : 'Filter'}
          </button>
        </div>

        {/* Sort row */}
        {!loading && rows.length > 0 && (
          <div className="pb-sort-row">
            <span className="pb-sort-label">Sort:</span>
            {[
              { v:'default',   l:'Default' },
              { v:'date-desc', l:'Newest' },
              { v:'date-asc',  l:'Oldest' },
              { v:'status',    l:'Status' },
              { v:'society',   l:'Society' },
            ].map(({v, l}) => (
              <button key={v}
                className={`pb-sort-chip${sortBy === v ? ' pb-sort-chip-active' : ''}`}
                onClick={() => setSortBy(v)}>{l}</button>
            ))}
          </div>
        )}

        {activeFilterCount > 0 && (
          <div className="pb-active-filters">
            {Object.entries(filters).filter(([,v]) => v).map(([k, v]) => (
              <span key={k} className="pb-chip">
                {k}: {v}
                <button onClick={() => setFilters(f => { const n = {...f}; delete n[k]; return n; })}>✕</button>
              </span>
            ))}
            <button className="pb-chip-clear" onClick={() => setFilters({})}>Clear all</button>
          </div>
        )}
      </header>

      {/* ── Content ──────────────────────────────── */}
      <main className="pb-main" ref={mainRef}
        onTouchStart={e => { touchStartY.current = e.touches[0].clientY; }}
        onTouchEnd={e => {
          const dy = e.changedTouches[0].clientY - touchStartY.current;
          if (dy > 70 && mainRef.current?.scrollTop === 0 && !loading) fetchData();
        }}>
        {loading && (
          <div className="pb-loading">
            <div className="pb-spinner-ring" />
            <span>Loading…</span>
          </div>
        )}
        {error && (
          <div className="pb-err-card">
            <div className="pb-err-title">⚠️ Cannot load data</div>
            <div className="pb-err-msg">{error}</div>
          </div>
        )}
        {!loading && !error && displayed.length === 0 && (
          <div className="pb-empty">
            <div style={{fontSize:'2.5rem'}}>🔍</div>
            <div>No records match your search</div>
          </div>
        )}
        {!loading && !error && displayed.map(row => (
          <RecordCard key={row.__row} row={row} headers={headers}
            onClick={() => setSheet({ type: 'detail', row })} />
        ))}
      </main>

      {/* ── FAB ──────────────────────────────────── */}
      <button className="pb-fab" onClick={() => setSheet('add')} title="Add record">
        +
      </button>

      {/* ── Toast ────────────────────────────────── */}
      {toast && <div className={`pb-toast ${toast.ok ? 'toast-ok' : 'toast-err'}`}>{toast.msg}</div>}

      {/* ── Bottom sheets ────────────────────────── */}
      {sheet === 'setup' && (
        <SetupSheet onSave={(url) => { setScriptUrl(url); setSheet(null); }} />
      )}
      {sheet === 'filter' && (
        <FilterSheet headers={headers} rows={rows} filters={filters}
          onApply={setFilters} onClose={() => setSheet(null)} />
      )}
      {sheet === 'add' && (
        <AddSheet headers={headers} rows={rows} saving={saving}
          onClose={() => setSheet(null)} onSave={handleAdd} />
      )}
      {sheet?.type === 'detail' && (
        <DetailSheet row={sheet.row} headers={headers} rows={rows} saving={saving}
          scriptUrl={scriptUrl}
          onClose={() => setSheet(null)}
          onSave={handleEdit}
          onDelete={handleDelete} />
      )}
    </div>
  );
}
