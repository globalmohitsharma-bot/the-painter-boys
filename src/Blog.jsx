import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SiteHeader from './SiteHeader.jsx';
import SiteFooter from './SiteFooter.jsx';
import Icon from './Icon.jsx';
import { SITE_URL, WA_LINK_DEFAULT } from './siteConfig.js';
import './Blog.css';

// Real, useful content aimed at actual search queries customers type before
// hiring a painter — cost questions, product comparisons, and seasonal
// concerns — not thin/filler content. Each post links back to the relevant
// service/paint-type page so the internal link graph reinforces both.
export const BLOG_POSTS = [
  {
    slug: 'house-painting-cost-ghaziabad-guide',
    title: 'How Much Does House Painting Cost in Ghaziabad? A Complete Guide',
    date: '2026-06-15',
    excerpt: 'Painting costs vary a lot based on area, paint tier, and surface condition. Here\'s exactly what drives the price up or down, and how to get an accurate number for your home.',
    body: [
      'One of the first questions every homeowner asks is "what will this cost?" — and the honest answer is: it depends on a handful of specific factors, not a flat per-room rate. Here\'s what actually drives the price.',
      { h: 'Paintable area, not room count' },
      'Two "3BHK" homes can have very different wall areas depending on ceiling height, number of windows, and layout. Painters price by square footage of surface to be painted, not by counting rooms — which is why two similar-sized homes can get different quotes.',
      { h: 'Paint tier and brand' },
      'Budget distemper, mid-range Tractor Emulsion, and premium finishes like Asian Paints Royale or Royale Shyne sit at very different price points per litre — and coverage per litre also varies. See our ',
      { link: { to: '/paint-types', text: 'Paint Types & Brands Guide' } },
      ' for how these compare.',
      { h: 'Surface condition' },
      'Cracks, dampness, old flaking paint, and uneven putty all add prep work before a single coat goes on. A wall in good condition costs less to paint than one needing crack-filling, putty, and priming first — which is why an on-site visit matters more than a phone-quote.',
      { h: 'Number of coats and finish type' },
      'A single coat over a similar existing colour costs less than a full colour change requiring a primer coat plus two finish coats. Textured or designer finishes also take more labour time than a flat matt finish.',
      { h: 'The only way to get an accurate number' },
      'Because of all these variables, any quote given without seeing your walls is a rough guess at best. That\'s why we offer a completely free, no-obligation on-site evaluation — our team measures the actual area, checks surface condition, and gives you an honest, itemised estimate before any work starts.',
    ],
    metaDescription: 'What actually drives house painting costs in Ghaziabad — paintable area, paint tier, surface prep and coats. Get a free, accurate on-site estimate from The Painter Boys.',
  },
  {
    slug: 'asian-paints-royal-vs-tractor-emulsion',
    title: 'Asian Paints Royale vs Tractor Emulsion: Which Is Right for Your Home?',
    date: '2026-06-22',
    excerpt: 'Both are Asian Paints emulsions, but they serve very different budgets and use-cases. Here\'s a straight comparison to help you decide.',
    body: [
      'Asian Paints Royale and Tractor Emulsion are both popular choices, but they\'re built for different priorities — one for a luxury finish, one for value. Here\'s how they actually compare.',
      { h: 'Finish quality' },
      'Royal delivers a noticeably smoother, richer finish with better light reflection — the kind of look that shows well on feature walls and living rooms. Tractor Emulsion gives a clean, flat matt finish that looks good but doesn\'t have the same depth or sheen.',
      { h: 'Durability and washability' },
      'Royal is formulated to be more stain-resistant and washable over years of everyday use — useful in high-traffic areas and homes with kids. Tractor holds up reasonably well but isn\'t built to the same washability standard.',
      { h: 'Price point' },
      'Tractor Emulsion is Asian Paints\' value range — meaningfully cheaper per litre than Royal, which is positioned as a premium product. For a budget-conscious repaint of bedrooms or less-used rooms, Tractor is a sensible choice.',
      { h: 'Our recommendation' },
      'If budget is the primary constraint and the space isn\'t heavily used, Tractor Emulsion is genuinely good value. If you want your living room or entryway to look and feel premium — and plan to keep the colour for years — Royal is worth the difference. For something in between, ',
      { link: { to: '/paint-types', text: 'Royale Shyne Luxury Emulsion' } },
      ' offers a soft-sheen premium finish at a mid-point price.',
      'Not sure which fits your space and budget? Our team recommends the right option during your free on-site consultation, based on the actual room and how it\'s used.',
    ],
    metaDescription: 'Asian Paints Royale vs Tractor Emulsion compared — finish quality, durability, washability and price — so you know which fits your home and budget.',
  },
  {
    slug: 'monsoon-waterproofing-tips-delhi-ncr',
    title: 'Monsoon-Proofing Your Home: Waterproofing Tips for Delhi NCR Homeowners',
    date: '2026-07-01',
    excerpt: 'Seepage and dampness show up every monsoon in Ghaziabad, Noida and Delhi NCR homes. Here\'s what actually causes it, and when to act before it gets worse.',
    body: [
      'Every monsoon, we get calls about the same problem: damp patches, peeling paint, and musty smells that seem to appear overnight. In reality, the damage usually built up gradually — monsoon just reveals it.',
      { h: 'Where seepage actually starts' },
      'Most interior dampness traces back to an exterior issue — a hairline crack in the outer wall, a gap around a window frame, or a terrace/roof surface that\'s lost its waterproof layer. Water finds the smallest opening and travels, so the damp patch inside is often not directly behind the actual leak point outside.',
      { h: 'Signs to watch for before the monsoon' },
      'Bubbling or flaking paint, a faint musty smell in a closed room, and discoloured patches that darken when it rains are all early warnings. Acting on these before peak monsoon is far cheaper than dealing with a fully soaked wall later.',
      { h: 'Why a fresh coat of paint alone doesn\'t fix it' },
      'Painting over a seepage-affected wall without addressing the underlying crack or waterproofing layer just hides the problem temporarily — it typically resurfaces within one monsoon cycle. Proper waterproofing treats the actual entry point, not just the visible symptom.',
      { h: 'What we check during a waterproofing visit' },
      'Our team inspects likely entry points — terrace surfaces, external wall cracks, window/door frame joints, and plumbing penetrations — before recommending a treatment. See our ',
      { link: { to: '/services', text: 'Waterproofing service' } },
      ' for what a proper treatment includes.',
      'If you\'ve noticed early signs already, it\'s worth getting it checked before the next heavy spell — a free on-site evaluation costs nothing and can save a much larger repair later.',
    ],
    metaDescription: 'What causes seepage and dampness in Ghaziabad, Noida and Delhi NCR homes each monsoon, early warning signs, and why waterproofing (not just paint) fixes it.',
  },
  {
    slug: 'signs-your-home-needs-repainting',
    title: '5 Signs Your Home Needs a Fresh Coat of Paint',
    date: '2026-07-10',
    excerpt: 'It\'s not always obvious when it\'s time to repaint. Here are five clear signs worth acting on before they get more expensive to fix.',
    body: [
      { h: '1. Fading or chalking colour' },
      'If a wall looks noticeably lighter than it used to, or leaves a chalky residue when you run a hand across it, the paint\'s protective layer has broken down — usually from UV exposure on exterior walls.',
      { h: '2. Hairline cracks appearing' },
      'Small cracks in the paint film (not necessarily the wall itself) often show up first near corners, above doors, and around windows — these are worth addressing before they let moisture in.',
      { h: '3. Peeling or bubbling in specific spots' },
      'Localised peeling, especially near bathrooms, kitchens, or exterior-facing walls, usually points to moisture getting underneath the paint layer — a sign to check for the underlying cause, not just repaint over it.',
      { h: '4. It\'s been 5+ years since the last paint job' },
      'Even without visible damage, most paint finishes have a practical lifespan of around 4-7 years depending on quality and exposure. A scheduled repaint before visible failure keeps walls protected rather than reactive.',
      { h: '5. You\'re planning to sell or rent the property' },
      'Fresh, even-toned walls are one of the highest-impact, lowest-cost improvements for how a home is perceived by buyers or tenants — often worth doing even if the existing paint isn\'t damaged.',
      'If any of these sound familiar, our team can take a look and tell you honestly whether it\'s time, or whether it can wait. See our ',
      { link: { to: '/services', text: 'full range of services' } },
      ' or get in touch for a free assessment.',
    ],
    metaDescription: 'Five clear signs your home needs repainting — fading, cracks, peeling, paint age, and resale prep — before small issues get more expensive to fix.',
  },
  {
    slug: 'interior-vs-exterior-paint-difference',
    title: 'Interior vs Exterior Paint: What\'s the Difference and Why It Matters',
    date: '2026-07-18',
    excerpt: 'Using the wrong paint in the wrong place is a common, costly mistake. Here\'s what actually separates interior and exterior paint formulations.',
    body: [
      'It might look like the same can of paint, but interior and exterior formulations are engineered for very different conditions — and using one where the other belongs leads to problems sooner than expected.',
      { h: 'What exterior paint is built for' },
      'Exterior paints like Apex are formulated to withstand direct sun (UV degradation), rain, temperature swings, and airborne pollution — with additives that resist algae and fungal growth in humid conditions common across Delhi NCR.',
      { h: 'What interior paint is built for' },
      'Interior emulsions prioritise a smoother finish, better washability for everyday marks, and lower odour — but they aren\'t formulated to handle UV exposure or driving rain, so they degrade fast if used outside.',
      { h: 'What goes wrong when they\'re swapped' },
      'Interior paint used outdoors typically fades, chalks, or peels within a single season of sun and rain exposure — far sooner than its interior lifespan would suggest. Exterior paint used indoors can feel rougher, show a flatter finish than expected, and sometimes carries a stronger odour than interior-grade products.',
      { h: 'Getting it right' },
      'This is a standard part of any professional painting job — matching the right product to interior vs exterior surfaces, and to specific conditions like bathrooms, kitchens, or terraces. See our ',
      { link: { to: '/services', text: 'Interior and Exterior Painting services' } },
      ' or ',
      { link: { to: '/paint-types', text: 'Paint Types Guide' } },
      ' for more on which finish suits which space.',
    ],
    metaDescription: 'Why interior and exterior paint aren\'t interchangeable — UV resistance, washability, and what goes wrong when the wrong one is used in the wrong place.',
  },
  {
    slug: 'wall-putty-guide-why-it-matters',
    title: 'Wall Putty: The Step That Determines Everything Else',
    date: '2026-07-25',
    excerpt: 'It\'s invisible once the job is done, but wall putty is the single biggest factor in whether a paint job looks flawless or shows every flaw underneath.',
    body: [
      'Ask any painter what separates an average repaint from a genuinely premium-looking one, and most will say the same thing: it was decided before the first coat of paint ever went on, at the putty stage.',
      { h: 'What wall putty actually does' },
      'Putty is a cement- or polymer-based filler applied to raw or previously painted walls to level out unevenness, fill hairline cracks, and create a smooth, uniform base. Paint is not designed to hide surface imperfections — it\'s designed to colour a surface. A wall with dents, uneven patches, or old cracks will show every one of them through the paint, sometimes more obviously once a glossier finish reflects light across the surface.',
      { h: 'White cement putty vs acrylic wall putty' },
      'White cement-based putty is the standard choice for interior walls — it\'s durable, cost-effective, and has been the industry default for decades. Acrylic wall putty (polymer-based) is more flexible, resists cracking slightly better over time, and is often used in areas with more temperature/humidity movement, but comes at a higher price. For most interior rooms, cement-based putty done properly is more than sufficient.',
      { h: 'How many coats of putty are actually needed' },
      'Two coats is the standard for a wall being properly levelled — a first coat to fill the bulk of the unevenness, sanded smooth, followed by a second thinner coat to catch anything the first missed, sanded again before primer. Skipping the second coat to save a day on the timeline is one of the most common corners cut on budget jobs, and it shows.',
      { h: 'What happens if putty is skipped or rushed' },
      'On a wall that\'s already in decent condition, skipping putty entirely might look fine at first — but any existing imperfections will telegraph through, especially under angled light (a common complaint homeowners raise weeks after a rushed job: "the wall looks fine until the evening light hits it"). Rushed sanding leaves visible ridges that no amount of paint will fully hide.',
      { h: 'Where putty fits in the overall process' },
      'The full sequence is: surface cleaning and crack repair, putty (typically two coats with sanding between), primer, then two finish coats of paint. See our ',
      { link: { to: '/services/putty-primer', text: 'Putty & Primer service' } },
      ' for how we handle this step, or our ',
      { link: { to: '/how-it-works', text: 'full process walkthrough' } },
      ' for the complete job sequence.',
    ],
    metaDescription: 'What wall putty actually does, cement vs acrylic putty, how many coats are needed, and why skipping or rushing this step is the most common cause of a paint job that doesn\'t look premium.',
  },
  {
    slug: 'enamel-vs-emulsion-paint-comparison',
    title: 'Enamel vs Emulsion Paint: Complete Comparison Guide',
    date: '2026-08-01',
    excerpt: 'These two paint families aren\'t interchangeable — one is built for walls, the other for doors, metal and wood. Here\'s what actually separates them.',
    body: [
      'Emulsion and enamel are the two broad paint families used in almost every Indian home, and confusing which goes where is one of the most common — and most expensive — mistakes homeowners make when trying to save on a painter.',
      { h: 'Emulsion: the wall paint' },
      'Emulsion is a water-based paint used almost exclusively on plaster walls and ceilings — distemper, Tractor Emulsion, and Asian Paints Royale are all emulsions at different quality tiers. It dries fast, has low odour, and is formulated to flex slightly with a wall\'s natural expansion and contraction rather than crack.',
      { h: 'Enamel: the door, metal and wood paint' },
      'Enamel is typically oil- or solvent-based, formulated for hard, non-porous surfaces like wood and metal — doors, window frames, grills, gates, and railings. It cures into a noticeably harder, glossier film that resists scratches, handling, and weather far better than any emulsion, which is exactly what a door or gate needs.',
      { h: 'Why you can\'t swap one for the other' },
      'Emulsion applied to metal doesn\'t bond or protect properly and wears off quickly under handling. Enamel applied to a wall gives an overly glossy, plasticky look that shows every surface imperfection and doesn\'t breathe the way plaster needs to — it can even trap moisture and cause peeling over time.',
      { h: 'Drying time and application differences' },
      'Emulsion typically dries to touch in 1-4 hours, making same-day multiple coats realistic. Enamel is much slower — often 8-24 hours between coats — and needs proper ventilation due to a stronger solvent odour during application. This is worth planning around if doors or grills are being repainted alongside interior walls.',
      { h: 'Getting it right' },
      'A typical full home repaint uses both — emulsion on every wall and ceiling, enamel on every door, window frame, grill, and metal railing. See our ',
      { link: { to: '/paint-types/apcolite-premium-enamel', text: 'Apcolite Premium Enamel' } },
      ' page for our go-to enamel product, or the full ',
      { link: { to: '/paint-types', text: 'Paint Types Guide' } },
      ' for the complete comparison.',
    ],
    metaDescription: 'Emulsion vs enamel paint compared — what each is actually formulated for, why they can\'t be swapped, and how drying time and application differ.',
  },
  {
    slug: 'matt-satin-glossy-paint-sheen-guide',
    title: 'Matt vs Satin vs Glossy: Understanding Paint Sheen',
    date: '2026-08-08',
    excerpt: 'Sheen level changes more than just shine — it affects washability, how forgiving the finish is on imperfect walls, and the overall mood of a room.',
    body: [
      'Beyond colour, the single biggest decision in choosing a paint is its sheen level — how much light the dried surface reflects. It\'s an easy detail to overlook, but it changes how a room actually looks and performs day to day.',
      { h: 'Matt (flat) finish' },
      'Matt finishes reflect almost no light, giving a soft, non-reflective look that\'s forgiving of minor wall imperfections — dents and unevenness are far less visible under a matt finish than a glossy one. The trade-off is washability: matt surfaces mark more easily and are harder to wipe clean without leaving a duller patch.',
      { h: 'Satin (soft sheen) finish' },
      'Satin sits in the middle — a gentle, low-key glow rather than a flat or shiny look. It\'s noticeably more washable than matt, making it a common choice for living rooms and high-traffic areas where some durability matters but a glossy look isn\'t wanted. Royale Shyne Luxury Emulsion sits in this higher-sheen, more washable category.',
      { h: 'Glossy (high-sheen) finish' },
      'High-gloss finishes reflect the most light and are the most durable and washable, but they also show every surface flaw — bumps, uneven putty work, brush marks — far more obviously than a matt finish would. This is why gloss is typically reserved for enamel work on doors and trim rather than large wall areas, where any imperfection in the putty/prep stage becomes very visible.',
      { h: 'Choosing sheen by room, not just preference' },
      'Bedrooms and ceilings usually suit matt — low traffic, imperfection-forgiving. Living rooms, hallways, and kids\' rooms benefit from satin\'s better washability. Kitchens and bathrooms, where walls get wiped down often, lean toward higher-sheen or specifically washable emulsions.',
      { h: 'Our recommendation' },
      'Sheen choice should factor in both the room\'s use and the wall\'s actual condition — a wall with visible imperfections is a strong reason to lean matt regardless of room type. See our ',
      { link: { to: '/paint-types', text: 'Paint Types Guide' } },
      ' for sheen levels across our full product range.',
    ],
    metaDescription: 'Matt vs satin vs glossy paint sheen explained — how each affects washability, how forgiving it is of wall imperfections, and which suits which room.',
  },
  {
    slug: 'how-many-coats-of-paint-does-a-wall-need',
    title: 'How Many Coats of Paint Does a Wall Actually Need?',
    date: '2026-08-15',
    excerpt: 'The honest answer is "it depends" — but here\'s exactly what it depends on, so you know what to expect and why a painter recommends what they do.',
    body: [
      'It\'s one of the most common questions we get, and the honest answer isn\'t a fixed number — it depends on a few specific, checkable factors rather than being a flat rule.',
      { h: 'The baseline: two coats' },
      'For a standard repaint over a similar or lighter existing colour, two coats of emulsion over a primed surface is the standard for even, professional-looking coverage. A single coat, even from a good paint, tends to show patchiness and roller/brush marks once dry.',
      { h: 'When a third coat is needed' },
      'Major colour changes — especially going from a dark colour to a light one, or vice versa — often need a third coat to fully cover the previous colour without it showing through, particularly under bright light. Bold reds, deep blues, and other saturated colours are especially prone to needing an extra coat.',
      { h: 'Why primer isn\'t optional' },
      'Primer isn\'t a coat of paint — it\'s a preparatory layer that seals the surface (especially bare or previously distempered walls) so the finish coats absorb evenly. Skipping primer often means the first "real" coat absorbs unevenly into the wall, effectively wasting a coat that should have gone toward visible coverage.',
      { h: 'Surface condition changes the math' },
      'A freshly puttied and sanded wall takes paint more evenly and may need fewer touch-ups than an older wall with variable porosity across patched and unpatched areas — where extra coats sometimes go toward evening out absorption rather than colour.',
      { h: 'What we actually do' },
      'We assess coat count during the on-site visit rather than quoting a fixed number blind — factoring in existing colour, surface condition, and the new colour chosen. See our ',
      { link: { to: '/services/interior-painting', text: 'Interior Painting service' } },
      ' for the full process, including where coat count fits into timeline and cost.',
    ],
    metaDescription: 'How many coats of paint a wall actually needs — the two-coat baseline, when a third coat is necessary, and why primer isn\'t an optional step.',
  },
  {
    slug: 'best-paint-colours-indian-homes-by-room',
    title: 'Best Paint Colours for Indian Homes, Room by Room',
    date: '2026-08-22',
    excerpt: 'Colour choice is personal, but some general principles genuinely help — especially around light, room size, and how a space is actually used.',
    body: [
      'Colour is the most personal choice in any repaint, but a few practical principles consistently help homeowners avoid regretting a bold choice six months later.',
      { h: 'Living rooms' },
      'Living rooms tend to work well with warm neutrals (beige, warm greys, soft off-whites) as a base, with a single accent wall in a deeper tone if a bolder look is wanted — this gives personality without overwhelming a room that needs to feel open and welcoming to guests.',
      { h: 'Bedrooms' },
      'Cooler, muted tones — soft blues, sage greens, gentle lavenders — are popular for bedrooms because they\'re associated with calm rather than energy. Very dark or highly saturated colours can make a bedroom feel smaller, especially with limited natural light.',
      { h: 'Kitchens' },
      'Lighter, brighter tones (whites, light yellows, soft greens) tend to suit kitchens well, partly for practicality — lighter colours in a washable, higher-sheen finish show grease/stains less than they show cleanliness, and reflect available light better in a room that\'s often smaller and more enclosed.',
      { h: 'Small rooms and low-light spaces' },
      'Lighter colours genuinely do make a small or dim room feel larger and brighter — this isn\'t just a decorating myth, it\'s about how much available light gets reflected rather than absorbed. If a smaller room needs colour, doing it on one wall rather than all four keeps the open feeling.',
      { h: 'Testing before committing' },
      'Paint colour looks meaningfully different under a room\'s actual lighting than on a swatch or screen — natural daylight, warm bulbs, and cool LED lighting all shift how a colour reads. We recommend testing a small patch on the actual wall before committing to a full room.',
      'Not sure what will work for your space? Our team can advise during your free on-site visit, based on the room\'s actual light and layout — see our ',
      { link: { to: '/how-it-works', text: 'How It Works' } },
      ' page for how colour selection fits into the process.',
    ],
    metaDescription: 'Practical paint colour guidance for Indian homes by room — living rooms, bedrooms, kitchens, and small/low-light spaces — plus why testing a colour on the actual wall matters.',
  },
  {
    slug: 'distemper-vs-emulsion-beginners-guide',
    title: 'Distemper vs Emulsion: A Beginner\'s Guide',
    date: '2026-08-29',
    excerpt: 'Both are water-based wall paints, but they sit at very different points on price, durability and finish quality. Here\'s the straightforward comparison.',
    body: [
      'For anyone repainting on a budget, distemper and Tractor Emulsion (the entry point of the emulsion family) are usually the two options being weighed against each other — and the difference matters more than the small price gap suggests.',
      { h: 'What distemper is' },
      'Distemper is the most economical wall finish available — a basic, chalky water-based paint that\'s been used in Indian homes for generations. It\'s quick-drying and low-cost, but has the shortest lifespan and lowest washability of any wall paint option.',
      { h: 'What emulsion is' },
      'Emulsion is a broader, more advanced category of water-based paint — even at its cheapest tier (Tractor Emulsion), it offers noticeably better washability, colour retention, and durability than distemper, at a moderate step up in price per litre.',
      { h: 'Where distemper still makes sense' },
      'Distemper remains a reasonable choice for genuinely low-priority spaces — store rooms, rarely-used areas, or a rental property being refreshed on a tight budget where a 2-3 year repaint cycle is acceptable. It\'s not a "bad" product, just a short-lifespan one.',
      { h: 'Why most homeowners choose emulsion instead' },
      'For any regularly used living space, the gap in washability and durability means emulsion typically works out better value over time — fewer repaints needed, and a finish that tolerates everyday marks and a damp-cloth wipe far better than distemper can.',
      { h: 'Our recommendation' },
      'Reserve distemper for genuinely low-use spaces, and choose at least Tractor Emulsion for any room used daily. See our ',
      { link: { to: '/paint-types/distemper', text: 'Distemper' } },
      ' and ',
      { link: { to: '/paint-types/tractor-emulsion', text: 'Tractor Emulsion' } },
      ' pages for the full spec comparison.',
    ],
    metaDescription: 'Distemper vs Tractor Emulsion compared for budget-conscious repaints — where distemper still makes sense, and why most living spaces are better served by emulsion.',
  },
  {
    slug: 'paint-drying-time-water-based-vs-oil-based',
    title: 'How Long Does Paint Take to Dry? Water-Based vs Oil-Based',
    date: '2026-09-05',
    excerpt: 'Drying time affects your whole project timeline — and the difference between paint families is bigger than most people expect.',
    body: [
      'Drying time is one of the most practical things to understand before a paint job starts, since it directly determines how many days a room (or the whole home) will realistically be usable.',
      { h: 'Water-based (emulsion) drying time' },
      'Emulsions typically dry to the touch within 1-4 hours and can usually take a second coat the same day. This is why interior wall painting can often be completed faster than homeowners expect, even with two coats.',
      { h: 'Oil-based (enamel) drying time' },
      'Enamel is significantly slower — often 8-24 hours between coats, sometimes longer in humid conditions. Doors, grills, and gates being repainted need to be planned around this longer timeline, especially if a household relies on that door for regular access.',
      { h: 'Why humidity and season matter' },
      'Both paint families dry slower in high humidity — a real factor during Delhi NCR\'s monsoon months, when even emulsion can take noticeably longer to fully cure (not just surface-dry) than it would in drier winter conditions.',
      { h: '"Dry to touch" isn\'t the same as fully cured' },
      'A wall can feel dry within hours but isn\'t at full hardness/durability for days to weeks (curing continues gradually). This is why we recommend avoiding heavy scrubbing or hanging anything on freshly painted walls for at least a few days, even once they look and feel finished.',
      { h: 'Planning around drying time' },
      'For a full home repaint mixing walls and doors/grills, we sequence the work so oil-based enamel items (which take longest) are scheduled with enough buffer, rather than becoming the bottleneck at the end. See our ',
      { link: { to: '/how-it-works', text: 'How It Works' } },
      ' page for how we plan a realistic project timeline.',
    ],
    metaDescription: 'How long paint actually takes to dry — water-based emulsion vs oil-based enamel, how humidity affects drying, and the difference between dry-to-touch and fully cured.',
  },
  {
    slug: 'textured-wall-finishes-types-cost-guide',
    title: 'Textured Wall Finishes: Types, Cost, and When to Choose Them',
    date: '2026-09-12',
    excerpt: 'A textured feature wall can transform a room — but it\'s a different kind of job than flat paint, with its own timeline and cost considerations.',
    body: [
      'Textured finishes are one of the most requested upgrades for a single statement wall, but they work differently from a standard paint job in almost every way — technique, timeline, and pricing.',
      { h: 'Common texture types' },
      'Stone-effect and fabric-effect textures mimic natural materials at a fraction of the cost and weight of the real thing. Abstract 3D patterns, applied by hand with trowels and tools in layers, create a more artistic, one-of-a-kind look. All are water-based acrylic compounds, not standard emulsion.',
      { h: 'Why texture takes longer than flat paint' },
      'Textured finishes are applied in multiple hand-worked layers rather than rolled on, and each layer typically needs to dry before the next is added — a single feature wall commonly takes two to three days depending on pattern complexity, compared to a few hours for a flat-painted wall of the same size.',
      { h: 'Why it\'s priced differently' },
      'Because coverage and labour time vary so much by pattern complexity, texture work is typically quoted per project rather than a flat per-square-foot rate the way standard emulsion is — a simple stone-effect pattern costs meaningfully less than an intricate custom abstract design.',
      { h: 'Where texture works best' },
      'Living room feature walls, entryways, and TV units are the most common (and most effective) placements — a single accent wall rather than a full room keeps the visual impact high without overwhelming the space or the budget.',
      { h: 'Seeing it before committing' },
      'Because texture patterns photograph very differently from how they look and feel in person under real room lighting, we show physical sample boards on-site before starting. See our ',
      { link: { to: '/services/texture-designer', text: 'Texture & Designer Finishes service' } },
      ' for examples of what we offer.',
    ],
    metaDescription: 'Textured wall finish types (stone-effect, fabric-effect, 3D abstract), why they take longer and cost differently than flat paint, and where a single feature wall works best.',
  },
  {
    slug: 'low-voc-eco-friendly-paints-guide',
    title: 'Low-VOC & Eco-Friendly Paints: What Homeowners Should Know',
    date: '2026-09-19',
    excerpt: 'VOC content affects indoor air quality and odour during and after painting — here\'s what it actually means and why it matters more in some spaces than others.',
    body: [
      'VOCs (volatile organic compounds) are chemicals released as paint dries, responsible for the "fresh paint smell" — and understanding VOC content helps make a more informed choice, especially for bedrooms, children\'s rooms, and poorly ventilated spaces.',
      { h: 'What VOCs actually are' },
      'VOCs are compounds that evaporate at room temperature as paint cures, and higher-VOC paints (typically oil-based/enamel products) release more of them over a longer period than low-VOC water-based emulsions.',
      { h: 'Why water-based emulsions are inherently lower-VOC' },
      'Because emulsions use water rather than chemical solvents as their carrier, they generally have significantly lower VOC content and odour than oil-based enamels by default — one more reason emulsion is the standard choice for walls in living spaces.',
      { h: 'Where VOC content matters most' },
      'Bedrooms, nurseries, and any room with limited ventilation are where lower-VOC choices matter most, since occupants spend extended, close-proximity time there, including overnight. Well-ventilated areas and less-occupied spaces are more forgiving.',
      { h: 'Ventilation still matters regardless of paint choice' },
      'Even with low-VOC emulsion, proper ventilation (open windows, fans) during and for a day or two after painting is good practice — it speeds up both drying and off-gassing, getting a room back to normal comfortable air quality faster.',
      { h: 'Our approach' },
      'We use water-based emulsions for the vast majority of wall work by default, reserving oil-based enamel specifically for doors, metal and wood, where its durability is genuinely needed. See our ',
      { link: { to: '/paint-types', text: 'Paint Types Guide' } },
      ' for the water-based vs oil-based breakdown across our full product range.',
    ],
    metaDescription: 'What VOC content in paint means for indoor air quality, why water-based emulsions are inherently lower-VOC than oil-based enamel, and where low-VOC choices matter most.',
  },
  {
    slug: 'painting-doors-grills-gates-enamel-guide',
    title: 'Painting Doors, Grills & Gates: A Guide to Enamel on Metal and Wood',
    date: '2026-09-26',
    excerpt: 'Doors, grills and gates take the most physical wear of anything in a home — and they need a completely different paint approach from your walls.',
    body: [
      'Doors, window grills, and gates are handled, knocked, and weather-exposed daily — which is exactly why they need enamel rather than the emulsion used on walls, and why the prep and application process looks quite different.',
      { h: 'Why metal and wood need enamel, not emulsion' },
      'Enamel cures into a hard, glossy, scratch- and stain-resistant film built to handle constant physical contact and, for gates and grills, direct weather exposure — protection that wall-formulated emulsion simply isn\'t built to provide.',
      { h: 'Rust treatment for metal surfaces' },
      'Metal grills and gates often have existing rust or corrosion that needs to be treated (wire-brushed and primed with a rust-inhibiting primer) before enamel goes on — painting directly over active rust just traps it under the new coat, where it continues to spread and eventually bubbles the paint.',
      { h: 'Sanding and prep for wood doors' },
      'Wood surfaces need old flaking paint removed and the surface sanded smooth before priming — skipping this step is one of the most common reasons a "fresh" coat on an old door still looks uneven, since it\'s sitting on an inconsistent base underneath.',
      { h: 'Why enamel takes longer' },
      'Enamel\'s 8-24 hour drying window between coats (versus emulsion\'s 1-4 hours) means doors and gates need to be planned for reduced access during the job — worth factoring in if a specific door is a household\'s primary entry point.',
      { h: 'Getting a durable finish' },
      'Done properly — rust treatment, sanding, primer, then two enamel coats — a metal or wood surface should hold up for years against daily handling and weather. See our ',
      { link: { to: '/paint-types/apcolite-premium-enamel', text: 'Apcolite Premium Enamel' } },
      ' page or get in touch for a free assessment of your doors, grills, and gates.',
    ],
    metaDescription: 'How to properly paint doors, grills and gates — why enamel (not emulsion) is required, rust treatment for metal, wood prep, and why the process takes longer than wall painting.',
  },
];

function renderBodyBlock(block, i) {
  if (typeof block === 'string') return <p key={i}>{block}</p>;
  if (block.h) return <h2 key={i} className="blog-h2">{block.h}</h2>;
  if (block.link) return <Link key={i} to={block.link.to} className="blog-inline-link">{block.link.text}</Link>;
  return null;
}

function BlogCard({ post }) {
  return (
    <article className="blog-card">
      <Link to={`/blog/${post.slug}`} className="blog-card-link">
        <div className="blog-card-date">{new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <h3 className="blog-card-title">{post.title}</h3>
        <p className="blog-card-excerpt">{post.excerpt}</p>
        <span className="blog-card-read">Read more →</span>
      </Link>
    </article>
  );
}

export function BlogList() {
  return (
    <div className="home">
      <Helmet>
        <title>Blog — Painting Tips & Guides | The Painter Boys</title>
        <meta name="description" content="Painting tips, cost guides, and product comparisons from The Painter Boys — serving Ghaziabad, Noida and Delhi NCR." />
        <link rel="canonical" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content="Blog — Painting Tips & Guides | The Painter Boys" />
        <meta property="og:description" content="Painting tips, cost guides, and product comparisons from The Painter Boys — serving Ghaziabad, Noida and Delhi NCR." />
        <meta property="og:url" content={`${SITE_URL}/blog`} />
        <meta property="og:type" content="website" />
      </Helmet>
      <SiteHeader />
      <main className="page-fade">
        <div className="inner-page">
          <div className="page-hero page-hero-blue">
            <div className="ph-content">
              <span className="sec-tag light">Blog</span>
              <h1 className="ph-title">Painting Tips & Guides</h1>
              <p className="ph-sub">Straight answers to the questions we get asked most — cost, paint choice, and seasonal care.</p>
            </div>
          </div>
          <div className="page-content-white">
            <div className="container section">
              <div className="blog-grid">
                {BLOG_POSTS.map(post => <BlogCard key={post.slug} post={post} />)}
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function BlogPost() {
  const { slug } = useParams();
  const post = BLOG_POSTS.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="home">
        <SiteHeader />
        <main className="page-fade">
          <div className="inner-page">
            <div className="page-content-white">
              <div className="container section" style={{ textAlign: 'center' }}>
                <h1>Post not found</h1>
                <Link to="/blog" className="btn-primary">← Back to Blog</Link>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const isoDate = new Date(post.date).toISOString();

  return (
    <div className="home">
      <Helmet>
        <title>{post.title} | The Painter Boys Blog</title>
        <meta name="description" content={post.metaDescription} />
        <link rel="canonical" href={`${SITE_URL}/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.metaDescription} />
        <meta property="og:url" content={`${SITE_URL}/blog/${post.slug}`} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.metaDescription,
          datePublished: isoDate,
          author: { '@type': 'Organization', name: 'The Painter Boys' },
          publisher: { '@type': 'Organization', name: 'The Painter Boys' },
          mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
        })}</script>
      </Helmet>
      <SiteHeader />
      <main className="page-fade">
        <div className="inner-page">
          <div className="page-hero page-hero-blue">
            <div className="ph-content">
              <Link to="/blog" className="blog-back-link">← All Posts</Link>
              <h1 className="ph-title">{post.title}</h1>
              <p className="ph-sub">{new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="page-content-white">
            <div className="container section blog-post-body">
              {post.body.map(renderBodyBlock)}
              <div className="sec-cta">
                <a className="btn-primary" href={WA_LINK_DEFAULT} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={17} />Get a Free Estimate</a>
                <Link to="/blog" className="btn-secondary">← More Articles</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
