import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SiteHeader from './SiteHeader.jsx';
import SiteFooter from './SiteFooter.jsx';
import Icon from './Icon.jsx';
import { SITE_URL, WA_LINK } from './siteConfig.js';
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
                <a className="btn-primary" href={WA_LINK} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={17} />Get a Free Estimate</a>
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
