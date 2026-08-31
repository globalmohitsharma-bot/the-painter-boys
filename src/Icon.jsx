// Shared line-icon set — replaces emoji across the site with a single,
// consistent, brand-coloured icon language (matches the obsidian/gold
// palette instead of relying on OS emoji rendering, which varies wildly
// across devices and clashes with the luxury aesthetic).
const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };

const ICONS = {
  home: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" /></>),
  },
  construction: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><rect x="4" y="7" width="16" height="13" rx="1" /><path d="M4 7 12 3l8 4" /><path d="M9 20v-5h6v5" /></>),
  },
  water: {
    vb: '0 0 24 24', mode: 'stroke',
    body: <path d="M12 3c3.5 4.5 6 7.9 6 11a6 6 0 1 1-12 0c0-3.1 2.5-6.5 6-11Z" />,
  },
  crown: {
    vb: '0 0 24 24', mode: 'stroke',
    body: <path d="m3 8 3.5 3L12 5l5.5 6L21 8l-2 10H5L3 8Z" />,
  },
  office: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><rect x="5" y="3" width="9" height="18" rx="1" /><rect x="14" y="9" width="6" height="12" rx="1" /><path d="M8 7h2M8 11h2M8 15h2M16 12h2M16 16h2" /></>),
  },
  temple: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><path d="M12 3 5 9h14L12 3Z" /><path d="M6 9v10M18 9v10M4 19h16M9.5 19v-6h5v6" /></>),
  },
  brush: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><path d="M14 3 21 10l-8.5 8.5a2.1 2.1 0 0 1-3-3L18 6" /><path d="M8 14c-3 0-5 2-5 5 0 .3 0 .7.1 1 2.9-.2 5.9-1.3 5.9-4a2 2 0 0 0-1-2Z" /></>),
  },
  layers: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>),
  },
  medal: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><circle cx="12" cy="14.5" r="5.5" /><path d="m9 9.5-3-6.5M15 9.5l3-6.5M9 3h6" /><path d="M12 12v5" /></>),
  },
  broom: {
    vb: '0 0 24 24', mode: 'stroke',
    body: <path d="m19 4-8.5 8.5M4 20l2.5-7 4.5 4.5L4 20ZM12.5 4.5l6 6" />,
  },
  trophy: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 5H4.5A2.5 2.5 0 0 0 7 9.5M17 5h2.5A2.5 2.5 0 0 1 17 9.5" /><path d="M12 14v3M9.5 20h5M10 17h4v3h-4Z" /></>),
  },
  target: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r=".6" fill="currentColor" /></>),
  },
  worker: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><circle cx="12" cy="7" r="3" /><path d="M5 21v-3a7 7 0 0 1 14 0v3" /></>),
  },
  magnifier: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.4-4.4" /></>),
  },
  palette: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-.9-.5-1.2-.3-.4-.5-.9-.5-1.4 0-1.1.9-2 2-2h2.3c1.5 0 2.7-1.2 2.7-2.7C20 6.5 16.4 3 12 3Z" /><circle cx="7.5" cy="10.5" r=".9" fill="currentColor" /><circle cx="9.7" cy="7" r=".9" fill="currentColor" /><circle cx="14.3" cy="6.6" r=".9" fill="currentColor" /><circle cx="17" cy="9.7" r=".9" fill="currentColor" /></>),
  },
  shield: {
    vb: '0 0 24 24', mode: 'stroke',
    body: <path d="M12 3 5 6v5c0 5 3 8.6 7 10 4-1.4 7-5 7-10V6l-7-3Z" />,
  },
  eye: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>),
  },
  gear: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M4.4 4.4l2.1 2.1M17.5 17.5l2.1 2.1M2.5 12h3M18.5 12h3M4.4 19.6l2.1-2.1M17.5 6.5l2.1-2.1" /></>),
  },
  calendar: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  },
  check: { vb: '0 0 24 24', mode: 'stroke', body: <path d="M5 13l4 4L19 7" /> },
  badgeCheck: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.3 2.3 2.3 4.7-4.7" /></>),
  },
  warning: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><path d="M12 3 22 20H2L12 3Z" /><path d="M12 9.5v4.5M12 17h.01" /></>),
  },
  coins: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><circle cx="9" cy="9" r="5.5" /><circle cx="15" cy="15" r="5.5" /></>),
  },
  medical: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M12 8.5v7M8.5 12h7" /></>),
  },
  star: { vb: '0 0 24 24', mode: 'fill', body: <path d="m12 3 2.7 5.9 6.3.6-4.8 4.3 1.4 6.2L12 16.9 6.4 20l1.4-6.2L3 9.5l6.3-.6L12 3Z" /> },
  quote: { vb: '0 0 24 24', mode: 'fill', body: <path d="M7 8c-2.2 0-4 1.8-4 4v5h5v-5H6c0-1.1.9-2 2-2V8Zm10 0c-2.2 0-4 1.8-4 4v5h5v-5h-2c0-1.1.9-2 2-2V8Z" /> },
  phone: {
    vb: '0 0 24 24', mode: 'stroke',
    body: <path d="M4.5 4.5c0-.8.7-1.5 1.5-1.5h2l1.8 4.5-2 1.3c1 2.8 3 4.8 5.8 5.8l1.3-2 4.5 1.8v2c0 .8-.7 1.5-1.5 1.5C9.5 18 4.5 13 4.5 4.5Z" />,
  },
  whatsapp: {
    vb: '0 0 448 512', mode: 'fill',
    body: <path d="M380.9 97.1C339 55.1 283.2 32 224.1 32c-122.5 0-222 99.5-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.5 0 222-99.5 222-222 0-59.1-23-114.6-65-156.4zM224.1 439.9c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.3-63.3-28.3-98.1 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.5-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.5-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.7z" />,
  },
  pin: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.3" /></>),
  },
  clock: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>),
  },
  lock: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
  },
  menu: { vb: '0 0 24 24', mode: 'stroke', body: <path d="M3 6h18M3 12h18M3 18h18" /> },
  close: { vb: '0 0 24 24', mode: 'stroke', body: <path d="M6 6l12 12M18 6 6 18" /> },
  folder: {
    vb: '0 0 24 24', mode: 'stroke',
    body: <path d="M3 6.5a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6.5Z" />,
  },
  user: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><circle cx="12" cy="8" r="3.5" /><path d="M5 20.5v-1a7 7 0 0 1 14 0v1" /></>),
  },
  chat: {
    vb: '0 0 24 24', mode: 'stroke',
    body: <path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H9.5L5 21v-4H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" />,
  },
  send: { vb: '0 0 24 24', mode: 'stroke', body: <path d="M21.5 2.5 11 13M21.5 2.5 14.8 21.5l-3.8-8.5-8.5-3.8 19-6.7Z" /> },
  download: {
    vb: '0 0 24 24', mode: 'stroke',
    body: (<><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>),
  },
};

export default function Icon({ name, size = 24, className, style }) {
  const cfg = ICONS[name];
  if (!cfg) return null;
  const attrs = cfg.mode === 'fill' ? { fill: 'currentColor' } : STROKE;
  return (
    <svg width={size} height={size} viewBox={cfg.vb} className={className} style={style} aria-hidden="true" focusable="false" {...attrs}>
      {cfg.body}
    </svg>
  );
}
