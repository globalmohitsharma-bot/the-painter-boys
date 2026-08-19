// Content for cards that link to their own detail page (services, team, paint
// types) — kept separate from Home.jsx so the grid views (Home.jsx) and the
// detail-page routes (ServiceDetail.jsx / TeamDetail.jsx / PaintDetail.jsx)
// share one source of truth instead of duplicating copy.

export const SERVICES = [
  { slug: 'interior-painting', bg: 'linear-gradient(135deg,#0d2137,#1c4068,#f2871f)', icon: 'home', accent: '#f2871f', title: 'Interior Painting',
    bullets: ['Premium emulsion, distemper & luxury finishes', 'Full furniture protection — zero mess guaranteed'],
    detail: 'A full interior repaint starts with covering every piece of furniture and the floor before a single tin is opened. We fill cracks, sand uneven patches, and apply primer before the finish coats go on — so the final colour goes down smooth and even, not over old imperfections. Choose from budget-friendly distemper, mid-range Tractor Emulsion, or premium Asian Paints Royale and Royale Shyne finishes depending on the room and how it\'s used.' },
  { slug: 'exterior-painting', bg: 'linear-gradient(135deg,#081627,#163457,#2563c4)', icon: 'construction', accent: '#2563c4', title: 'Exterior Painting',
    bullets: ['Weather-resistant & UV-protective coatings', 'Surface prep, crack filling & primer included'],
    detail: 'Exterior walls take a real beating from Delhi NCR\'s sun, monsoon, and pollution — so we use weatherproof, UV-resistant exterior emulsions like Asian Paints Apex, formulated to resist algae and fungal growth in humid conditions. Every job starts with a proper survey of the facade for cracks and dampness, then crack-filling, primer, and finish coats — not just a fresh colour painted over existing problems.' },
  { slug: 'waterproofing', bg: 'linear-gradient(135deg,#072a2b,#0d4547,#0ea5a8)', icon: 'water', accent: '#0ea5a8', title: 'Waterproofing',
    bullets: ['Eliminate seepage, dampness & wall leakages', 'Scientific solutions with quality materials'],
    detail: 'Seepage almost always starts as an exterior problem — a hairline crack, a terrace losing its waterproof layer, a gap around a window frame — that shows up as a damp patch somewhere else entirely. We inspect the likely entry points (terrace surfaces, wall cracks, frame joints, plumbing penetrations) and treat the actual source, not just repaint over the symptom, which is why painting alone over a seepage-affected wall usually resurfaces within one monsoon.' },
  { slug: 'royale-emulsion', bg: 'linear-gradient(135deg,#1a0f2e,#3b1f5c,#7c3aed)', icon: 'crown', accent: '#7c3aed', title: 'Royale Emulsion',
    bullets: ['Smooth, washable, lasting premium finish', 'Asian Paints Royale — stays vibrant for years'],
    detail: 'Asian Paints Royale is our go-to premium finish for living rooms and feature walls — a smooth, non-reflective luxury emulsion that hides minor wall imperfections and tolerates a damp-cloth wipe. For an even higher-sheen, more washable finish with Teflon surface protection and an 8-year performance warranty, Royale Shyne Luxury Emulsion is the step up — see our full Paint Types guide for how the two compare.' },
  { slug: 'texture-designer', bg: 'linear-gradient(135deg,#2a0f1e,#5c1f3f,#db2777)', icon: 'brush', accent: '#db2777', title: 'Texture & Designer',
    bullets: ['Unique 3D textures and designer wall finishes', 'Custom patterns for a premium luxury look'],
    detail: 'Decorative textured finishes turn a single wall into a statement — stone-effect, fabric-effect, and abstract 3D patterns applied by hand for a designer look that flat paint can\'t give you. Popular for living-room feature walls and entryways where you want one wall to stand out rather than repainting the whole room in a bold colour.' },
  { slug: 'putty-primer', bg: 'linear-gradient(135deg,#0f172a,#334155,#475569)', icon: 'layers', accent: '#475569', title: 'Putty & Primer',
    bullets: ['Crack filling and professional wall levelling', 'Perfect surface prep for a flawless paint job'],
    detail: 'The step most repaints skip — and the one that determines whether the final coat looks flawless or shows every bump underneath. We fill cracks, level uneven patches with wall putty, and apply the right primer for the surface and paint type before any finish coat goes on. It adds a day to the timeline and makes the difference between an average repaint and one that actually looks premium.' },
];

export const TEAM = [
  { slug: 'rajeev-kumar', name: 'Rajeev Kumar', role: 'Director — Delivery & Operations', img: null, initials: 'RK', color: '#163457',
    bio: 'With 10+ years leading painting and quality work, Rajeev heads customer relationships and operations. A passionate artist whose craftsmanship has made lasting impressions across Delhi NCR.' },
  { slug: 'sonia-gupta', name: 'Sonia Gupta', role: 'Marketing & Digital Growth', img: '/images/sonia.webp', initials: 'SG', color: '#2563c4',
    bio: 'With 12+ years of marketing leadership, Sonia drives The Painter Boys\' digital transformation. Former consultant for Fortune 500 companies, now helping homeowners achieve their dream spaces.' },
  { slug: 'susheel-rai', name: 'Dr. Susheel Rai', role: 'Head of Operations', img: '/images/susheel.jpg', initials: 'SR', color: '#0ea5a8',
    bio: 'Overseeing operations with decades of leadership experience. His philosophy — caring for people and putting their needs first — defines The Painter Boys\' service culture throughout.' },
];

export const PAINT_TYPES = [
  { slug: 'asian-paints-royale', name: 'Asian Paints Royale', tier: 'Luxury', finish: 'Smooth matt luxury emulsion',
    desc: 'A premium interior emulsion known for its rich, smooth, non-reflective finish that hides minor wall imperfections and tolerates a damp-cloth wipe. Popular for living rooms and feature walls where a luxury look matters.' },
  { slug: 'tractor-emulsion', name: 'Tractor Emulsion', tier: 'Economy', finish: 'Matt emulsion',
    desc: 'Asian Paints\' value-for-money emulsion range — a practical, washable finish for bedrooms and interiors where budget matters without giving up a clean look.' },
  { slug: 'royale-shyne-luxury-emulsion', name: 'Royale Shyne Luxury Emulsion', tier: 'Luxury', finish: 'High-sheen luxury emulsion',
    desc: 'Asian Paints\' top-tier luxury emulsion — one step above standard Royale, with a high-sheen, reflective finish, Teflon surface protection, anti-bacterial and anti-fungal shield, and an 8-year performance warranty. Superior stain resistance and washability, ideal for statement walls and high-traffic living spaces.' },
  { slug: 'apex-exterior-emulsion', name: 'Apex Exterior Emulsion', tier: 'Premium', finish: 'Weatherproof exterior',
    desc: 'Built for exteriors — weather and UV resistant, formulated to resist algae/fungal growth and monsoon dampness on outer walls and building facades.' },
  { slug: 'distemper', name: 'Distemper', tier: 'Budget', finish: 'Matt, basic',
    desc: 'The most economical wall finish, suited for spaces needing a quick, affordable refresh — commonly used in budget-conscious interior projects.' },
  { slug: 'texture-designer-finishes', name: 'Texture & Designer Finishes', tier: 'Luxury', finish: '3D texture / designer',
    desc: 'Decorative textured finishes for feature walls — stone, fabric and abstract patterns that add a designer touch to living rooms and entryways.' },
];
