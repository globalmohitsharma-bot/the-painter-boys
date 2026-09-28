// Shared site-wide config used by Home.jsx, Blog.jsx, and the shared
// SiteHeader/SiteFooter components — single source of truth for routes,
// nav links, and business contact details so nothing drifts out of sync.

export const SITE_URL = 'https://www.thepainterboys.com';
export const PHONE    = '+91 7838888509';
export const WA_LINK  = 'https://wa.me/917838888509';
// Pre-fills the chat box for plain "WhatsApp us" buttons — NOT used by LeadBot
// (which builds its own message from the user's actual answers) or by the
// JSON-LD sameAs field (a canonical profile URL shouldn't carry a query string).
export const WA_LINK_DEFAULT = `${WA_LINK}?text=${encodeURIComponent("Hi, I'm looking to get information about wall painting")}`;
export const AREAS    = ['Ghaziabad', 'Noida', 'Delhi NCR', 'Haridwar', 'Dehradun'];
// Specific Ghaziabad localities we actively target — used in visible copy and
// structured data so local searches (e.g. "painter in Raj Nagar Extension")
// have a matching, real on-page signal, not just a city-level mention.
export const GHAZIABAD_AREAS = ['Raj Nagar Extension', 'Raj Nagar', 'Kavi Nagar', 'RDC', 'Indirapuram', 'Vasundhara'];

// Real URL per page, plus a keyword-focused title/description for search results
// and social previews. Google's crawler executes JS and will pick these up per
// route; crawlers/link-preview bots that don't run JS still only see the default
// tags in index.html, since this is a client-rendered app (no server-side render).
export const PAGE_META = {
  home: {
    path: '/',
    title: 'The Painter Boys — Painting & Carpentry Services in Raj Nagar Extension, Indirapuram, Kavi Nagar, Ghaziabad',
    description: 'Expert home painting and carpentry in Raj Nagar Extension, Raj Nagar, Kavi Nagar, RDC, Indirapuram & Vasundhara (Ghaziabad), plus Noida & Delhi NCR. Interior, exterior, waterproofing & premium finishes — plus plywood work, modular kitchens & wardrobe making. Free on-site estimate — trusted since 2010.',
    keywords: 'painter in Ghaziabad, house painting Ghaziabad, carpenter in Ghaziabad, plywood work, modular kitchen, wardrobe making, home wood work, carpentry work, painting and carpentry services Delhi NCR',
  },
  services: {
    path: '/services',
    title: 'Painting, Carpentry, Modular Kitchen & Wardrobe Services | The Painter Boys',
    description: 'Interior painting, exterior painting, waterproofing, royal emulsion, texture & designer finishes, putty & primer, plus carpentry & woodwork — plywood work, modular kitchen making, wardrobe making & home wood work — across Ghaziabad, Noida & Delhi NCR.',
    keywords: 'carpenter work, plywood work, mica work, laminate sheet, wood kitchen making, modular kitchen, wardrobe making, home wood work, carpentry services, interior painting, exterior painting, waterproofing',
  },
  about: {
    path: '/about',
    title: 'About Us — 10+ Years of Trusted Painting Work | The Painter Boys',
    description: 'A decade of trust and craftsmanship painting homes, societies, hospitals, offices and temples across Delhi NCR. Zero-mess guarantee and a satisfaction promise on every job.',
  },
  how: {
    path: '/how-it-works',
    title: 'How It Works — Our Painting Process | The Painter Boys',
    description: 'From free site consultation to colour selection, preparation, execution and final walkthrough — see how The Painter Boys deliver a stress-free painting experience.',
  },
  team: {
    path: '/team',
    title: 'Our Team — Meet The Painter Boys Leadership | The Painter Boys',
    description: 'Meet the team behind The Painter Boys — experienced leaders in painting operations, delivery and customer service across Ghaziabad, Noida and Delhi NCR.',
  },
  'paint-types': {
    path: '/paint-types',
    title: 'Education Center — Paint Types, Benefits & Drawbacks | The Painter Boys',
    description: 'Our Education Center — in-depth guides to every paint type we work with (Asian Paints Royale, Tractor Emulsion, Apex exterior, Royale Shyne, distemper, textures, enamel), covering real benefits, honest drawbacks, and which suits your home.',
  },
  'carpentry-materials': {
    path: '/carpentry-materials',
    title: 'Carpentry Materials — Plywood, Laminate & Adhesive Guide | The Painter Boys',
    description: 'A real guide to the plywood, laminate and adhesive materials we use for carpentry work — Century Sainik 710 marine plywood, Century Club Prime, Greenply, Kitply, 0.7mm/0.8mm/1mm mica sheets, and Fevicol Marine & SR adhesive — what each is rated for and which job it suits.',
    keywords: 'Sainik 710, Century Club Prime, Greenply, Kitply, mica sheet thickness, laminate sheet 0.7mm 0.8mm 1mm, Fevicol Marine, marine plywood Ghaziabad, plywood carpenter Ghaziabad',
  },
  blog: {
    path: '/blog',
    title: 'Blog — Painting Tips & Guides | The Painter Boys',
    description: 'Painting tips, cost guides, and product comparisons from The Painter Boys — serving Ghaziabad, Noida and Delhi NCR.',
  },
  contact: {
    path: '/contact',
    title: 'Contact Us — Free Painting Estimate in Raj Nagar Ext, Indirapuram & Ghaziabad | The Painter Boys',
    description: 'Get a free, no-obligation painting estimate in Raj Nagar Extension, Raj Nagar, Kavi Nagar, RDC, Indirapuram, Vasundhara, Noida, Delhi NCR, Haridwar or Dehradun. Call, WhatsApp, or request a callback — we respond fast.',
    keywords: 'free painting estimate, carpenter quote, painter contact Ghaziabad, carpentry quote Delhi NCR',
  },
};

// "Blog" was replaced with "Education Center" pointing at /paint-types — that's
// where the real, in-depth benefits/drawbacks content actually lives, so the
// primary nav sends people there instead of to blog posts. /blog itself is
// untouched and still reachable (existing indexed URLs keep working), it's
// just no longer a top-level nav link.
export const NAV_PAGES = [
  ['services','Services'],['about','About Us'],['how','How It Works'],
  ['team','Our Team'],['paint-types','Education Center'],['contact','Contact'],
];
