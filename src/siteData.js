// Content for cards that link to their own detail page (services, team, paint
// types) — kept separate from Home.jsx so the grid views (Home.jsx) and the
// detail-page routes (ServiceDetail.jsx / TeamDetail.jsx / PaintDetail.jsx)
// share one source of truth instead of duplicating copy.

export const SERVICES = [
  { slug: 'interior-painting', bg: 'linear-gradient(135deg,#0d2137,#1c4068,#f2871f)', icon: 'home', accent: '#f2871f', title: 'Interior Painting',
    bullets: ['Premium emulsion, distemper & luxury finishes', 'Full furniture protection — zero mess guaranteed'],
    detail: [
      'A full interior repaint starts with covering every piece of furniture and the floor before a single tin is opened. We fill cracks, sand uneven patches, and apply primer before the finish coats go on — so the final colour goes down smooth and even, not over old imperfections.',
      'Which paint we recommend depends on the room and how it\'s actually used, not a one-size-fits-all default. Budget-conscious spaces like store rooms or a rental property usually make sense with distemper or Tractor Emulsion — both water-based, fast-drying, and easy to touch up. Living rooms and main bedrooms are where most homeowners step up to Asian Paints Royale or Royale Shyne: richer colour depth, better washability, and a finish that still looks good years later. Doors, window frames, and grills are a separate decision entirely — those need an oil-based enamel (see our Paint Types guide for why walls and woodwork use fundamentally different paint chemistry).',
      'Every interior job includes wall levelling with putty where needed, two coats minimum for even colour, and a final walkthrough before we consider it done — see our How It Works page for the full step-by-step process.',
    ] },
  { slug: 'exterior-painting', bg: 'linear-gradient(135deg,#081627,#163457,#2563c4)', icon: 'construction', accent: '#2563c4', title: 'Exterior Painting',
    bullets: ['Weather-resistant & UV-protective coatings', 'Surface prep, crack filling & primer included'],
    detail: [
      'Exterior walls take a real beating from Delhi NCR\'s sun, monsoon, and pollution — so we use weatherproof, UV-resistant exterior emulsions like Asian Paints Apex, formulated to resist algae and fungal growth in humid conditions rather than a standard interior emulsion that isn\'t built for outdoor exposure.',
      'Every job starts with a proper survey of the facade for cracks, dampness, and old flaking paint, then crack-filling, a coat of exterior primer, and two finish coats — not just a fresh colour painted directly over existing problems. Skipping prep is the single biggest reason exterior paint jobs fail early: a coat applied over a hairline crack or damp patch will bubble or peel within one monsoon regardless of how good the paint itself is.',
      'If the facade also has visible seepage or a history of damp patches appearing indoors, that\'s usually a separate underlying issue — see our Waterproofing service, since painting over an active leak point just delays the problem rather than fixing it.',
    ] },
  { slug: 'waterproofing', bg: 'linear-gradient(135deg,#072a2b,#0d4547,#0ea5a8)', icon: 'water', accent: '#0ea5a8', title: 'Waterproofing',
    bullets: ['Surface waterproof coatings for seepage, dampness & wall leakages', 'Crack sealing with quality waterproofing paint solutions'],
    detail: [
      'Seepage almost always starts as an exterior problem — a hairline crack, a terrace losing its protective coating, a gap around a window frame — that shows up as a damp patch somewhere else entirely, often a room or a floor away from the actual entry point. Water travels through the smallest opening and follows gravity, not a straight line, which is why guessing at the source from where the stain appears indoors is usually wrong.',
      'We inspect the likely entry points first — terrace surfaces, external wall cracks, and window/door frame joints — and treat them with crack-filling and a quality waterproof coating rather than just repainting over the visible damp patch, which is why painting alone over a seepage-affected wall usually resurfaces within one monsoon cycle. This is surface-level waterproofing treatment, not large-scale structural work (basement tanking, full membrane systems, or plumbing repairs) — for a major structural leak, we\'ll say so upfront rather than take on something outside what we do.',
      'Once the source is treated and fully dried, we repaint the affected area to match — so the fix is both practical and cosmetic, not one without the other.',
    ] },
  { slug: 'royale-emulsion', bg: 'linear-gradient(135deg,#1a0f2e,#3b1f5c,#7c3aed)', icon: 'crown', accent: '#7c3aed', title: 'Royale Emulsion',
    bullets: ['Smooth, washable, lasting premium finish', 'Asian Paints Royale — stays vibrant for years'],
    detail: [
      'Asian Paints Royale is our go-to premium finish for living rooms and feature walls — a smooth, non-reflective luxury emulsion that hides minor wall imperfections and tolerates a damp-cloth wipe. It\'s a water-based acrylic emulsion, meaning it dries faster than an oil-based paint, has far less odour during application, and won\'t yellow over time the way an oil-based finish can.',
      'For an even higher-sheen, more washable finish, Royale Shyne Luxury Emulsion is the step up — Teflon surface protection, an anti-bacterial and anti-fungal shield, and an 8-year performance warranty, at a noticeably higher sheen than standard Royale. Both are designed for interior walls specifically; neither is the right choice for doors, window frames, or metal grills, which need an oil-based enamel instead. See our full Paint Types guide for the complete comparison, including where oil-based paint is actually the better choice.',
    ] },
  { slug: 'texture-designer', bg: 'linear-gradient(135deg,#2a0f1e,#5c1f3f,#db2777)', icon: 'brush', accent: '#db2777', title: 'Texture & Designer',
    bullets: ['Unique 3D textures and designer wall finishes', 'Custom patterns for a premium luxury look'],
    detail: [
      'Decorative textured finishes turn a single wall into a statement — stone-effect, fabric-effect, and abstract 3D patterns applied by hand for a designer look that flat paint can\'t give you. These are typically applied with trowels, rollers, and stencils in multiple layers, so the timeline runs longer than a standard flat-colour wall — usually two to three days for one feature wall depending on the complexity of the pattern.',
      'Popular for living-room feature walls, entryways, and TV units where you want one wall to stand out rather than repainting the whole room in a bold colour. We show physical sample boards on-site before starting, since texture patterns photograph very differently from how they look and feel in person under real room lighting.',
    ] },
  { slug: 'putty-primer', bg: 'linear-gradient(135deg,#0f172a,#334155,#475569)', icon: 'layers', accent: '#475569', title: 'Putty & Primer',
    bullets: ['Crack filling and professional wall levelling', 'Perfect surface prep for a flawless paint job'],
    detail: [
      'The step most repaints skip — and the one that determines whether the final coat looks flawless or shows every bump underneath. We fill cracks, level uneven patches with wall putty (usually white cement-based putty for interiors), sand it smooth, and apply the right primer for the surface and paint type before any finish coat goes on.',
      'It adds roughly a day to the timeline for an average room, and it\'s the difference between an average repaint and one that actually looks premium — paint (however good the brand) only ever looks as smooth as the surface underneath it. Skipping primer specifically also means the finish coat absorbs unevenly into bare or previously-distempered walls, leading to patchy colour that needs an extra coat to fix anyway — so it rarely actually saves time in practice.',
    ] },
];

export const TEAM = [
  { slug: 'rajeev-kumar', name: 'Rajeev Kumar', role: 'Director — Delivery & Operations', img: null, initials: 'RK', color: '#163457',
    bio: 'With 10+ years leading painting and quality work, Rajeev heads customer relationships and operations. A passionate artist whose craftsmanship has made lasting impressions across Delhi NCR.' },
  { slug: 'sonia-gupta', name: 'Sonia Gupta', role: 'Marketing & Digital Growth', img: '/images/sonia.webp', initials: 'SG', color: '#2563c4',
    bio: 'With 12+ years of marketing leadership, Sonia drives The Painter Boys\' digital transformation. Former consultant for Fortune 500 companies, now helping homeowners achieve their dream spaces.' },
  { slug: 'susheel-rai', name: 'Dr. Susheel Rai', role: 'Head of Operations', img: '/images/susheel.jpg', initials: 'SR', color: '#0ea5a8',
    bio: 'Overseeing operations with decades of leadership experience. His philosophy — caring for people and putting their needs first — defines The Painter Boys\' service culture throughout.' },
];

// oilOrWater: 'Water-based' | 'Oil-based' — every paint on this site is one
// or the other; see PAINT_BASE_GUIDE below for what that distinction means
// and why it drives which paint goes where (walls vs. doors/metal).
export const PAINT_TYPES = [
  { slug: 'asian-paints-royale', name: 'Asian Paints Royale', tier: 'Luxury', finish: 'Smooth matt luxury emulsion',
    oilOrWater: 'Water-based', coverage: '~140-150 sq ft/litre (2 coats)', bestFor: 'Living rooms, bedrooms, feature walls',
    desc: 'A premium interior emulsion known for its rich, smooth, non-reflective finish that hides minor wall imperfections and tolerates a damp-cloth wipe. Being water-based, it dries within a few hours per coat, has minimal odour during application, and won\'t yellow with age the way an oil-based paint can. Popular for living rooms and feature walls where a luxury look matters, and it\'s the finish most homeowners upgrade to from a standard distemper repaint.' },
  { slug: 'tractor-emulsion', name: 'Tractor Emulsion', tier: 'Economy', finish: 'Matt emulsion',
    oilOrWater: 'Water-based', coverage: '~120-130 sq ft/litre (2 coats)', bestFor: 'Bedrooms, budget interior repaints',
    desc: 'Asian Paints\' value-for-money emulsion range — a practical, washable, water-based finish for bedrooms and interiors where budget matters without giving up a clean matt look. It doesn\'t have the depth of colour or the washability of Royale, but for a straightforward repaint of a less-used room, it\'s a genuinely sensible choice rather than a compromise — most of the visible difference between Tractor and Royale only shows up in high-traffic, high-visibility spaces.' },
  { slug: 'royale-shyne-luxury-emulsion', name: 'Royale Shyne Luxury Emulsion', tier: 'Luxury', finish: 'High-sheen luxury emulsion',
    oilOrWater: 'Water-based', coverage: '~100-120 sq ft/litre (2 coats)', bestFor: 'Statement walls, high-traffic living spaces',
    desc: 'Asian Paints\' top-tier luxury emulsion — one step above standard Royale, with a high-sheen, reflective finish, Teflon surface protection, an anti-bacterial and anti-fungal shield, and an 8-year performance warranty. Still water-based like Royale (fast-drying, low odour), but formulated for noticeably superior stain resistance and washability. The higher sheen shows off wall imperfections more than a matt finish does, so it works best on walls that have already had proper putty levelling — see our Putty & Primer service.' },
  { slug: 'apex-exterior-emulsion', name: 'Apex Exterior Emulsion', tier: 'Premium', finish: 'Weatherproof exterior',
    oilOrWater: 'Water-based', coverage: '~110-130 sq ft/litre (2 coats)', bestFor: 'Building facades, outer walls, boundary walls',
    desc: 'Built for exteriors — weather and UV resistant, formulated to resist algae/fungal growth and monsoon dampness on outer walls and building facades. It\'s a water-based acrylic exterior emulsion, not the same product as an interior emulsion with "exterior" on the label; the binder and additives are specifically engineered to flex with temperature swings and shed water rather than absorb it, which is what keeps a facade from blistering after its first proper monsoon.' },
  { slug: 'distemper', name: 'Distemper', tier: 'Budget', finish: 'Matt, basic',
    oilOrWater: 'Water-based', coverage: '~90-110 sq ft/litre (2 coats)', bestFor: 'Store rooms, rental properties, quick refreshes',
    desc: 'The most economical wall finish, suited for spaces needing a quick, affordable refresh — commonly used in budget-conscious interior projects, rental properties, or store rooms that don\'t need a premium finish. It\'s water-based and dries quickly, but it\'s also the least washable and least durable option on this list — expect to repaint sooner than with an emulsion, which is the trade-off for the lower upfront cost.' },
  { slug: 'texture-designer-finishes', name: 'Texture & Designer Finishes', tier: 'Luxury', finish: '3D texture / designer',
    oilOrWater: 'Water-based', coverage: 'Varies by pattern — quoted on-site', bestFor: 'Feature walls, entryways, TV units',
    desc: 'Decorative textured finishes for feature walls — stone, fabric and abstract patterns that add a designer touch to living rooms and entryways. These are water-based acrylic texture compounds applied in multiple layers by hand with trowels and tools rather than rolled on like a standard emulsion, which is why coverage and timeline are quoted per project instead of a flat sq ft/litre figure.' },
  { slug: 'apcolite-premium-enamel', name: 'Apcolite Premium Enamel', tier: 'Premium', finish: 'High-gloss oil-based enamel',
    oilOrWater: 'Oil-based', coverage: '~95-110 sq ft/litre (2 coats)', bestFor: 'Doors, windows, grills, gates, metal railings',
    desc: 'The paint every wall emulsion on this page is not built to replace: Apcolite Premium Enamel is oil-based, formulated for wood and metal rather than plaster walls. It cures into a hard, mirror-like glossy film that\'s significantly tougher and more stain-resistant than any water-based option — the right choice for doors, window frames, grills, gates, and railings, where surfaces get handled, knocked, and exposed to weather directly. The trade-off is a longer dry time between coats, a stronger odour during application (needs ventilation), and cleanup with thinner rather than water. Available in 1700+ shades across 1L, 4L, 10L and 20L packs.' },
];

// Referenced from the Paint Types listing page — the general distinction
// customers most often ask about, independent of any specific product above.
export const PAINT_BASE_GUIDE = {
  water: {
    title: 'Water-Based Paints (Emulsions)',
    points: [
      'Carrier is water, not a chemical solvent — low odour, low VOC, and cleans up with soap and water.',
      'Dries faster (typically 1-4 hours between coats), so interior jobs move quicker.',
      'Stays flexible as walls expand/contract with temperature, resisting cracking better over time.',
      'Doesn\'t yellow with age the way oil-based paint can, especially on white/light shades.',
      'Used for: interior wall emulsions, exterior wall emulsions, distemper, primers, texture finishes.',
    ],
  },
  oil: {
    title: 'Oil-Based Paints (Enamels)',
    points: [
      'Carrier is a solvent (thinner/turpentine) — stronger odour during application, needs good ventilation.',
      'Cures into a noticeably harder, glossier, more stain- and scratch-resistant film.',
      'Slower to dry (often 8-24 hours between coats) and cleans up with thinner, not water.',
      'Can yellow slightly over years, especially in low light or on pure white shades.',
      'Used for: doors, window frames, grills, gates, metal railings — surfaces that get handled or need a hard, glossy protective coat.',
    ],
  },
};
