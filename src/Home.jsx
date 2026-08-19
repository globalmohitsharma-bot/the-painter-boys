import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SiteHeader from './SiteHeader.jsx';
import SiteFooter from './SiteFooter.jsx';
import Icon from './Icon.jsx';
import { SITE_URL, PHONE, WA_LINK, AREAS, GHAZIABAD_AREAS, PAGE_META } from './siteConfig.js';
import { SERVICES, TEAM, PAINT_TYPES, PAINT_BASE_GUIDE } from './siteData.js';
import './Home.css';

const QUICK_NAV = [
  { icon:'home',         label:'Interior Painting',       sub:'Homes, Flats & Villas',     accent:'#f2871f', to:'/services/interior-painting' },
  { icon:'construction', label:'Exterior Painting',       sub:'Buildings & Societies',     accent:'#2563c4', to:'/services/exterior-painting' },
  { icon:'water',        label:'Waterproofing',            sub:'Leakage & Dampness',        accent:'#0ea5a8', to:'/services/waterproofing' },
  { icon:'crown',        label:'Premium Finishes',         sub:'Royale & Luxury Paints',    accent:'#7c3aed', to:'/services/royale-emulsion' },
  { icon:'office',       label:'Commercial Spaces',        sub:'Offices & Hospitals',       accent:'#475569', to:'/services' },
  { icon:'temple',       label:'Temples & Institutions',   sub:'All Property Types',        accent:'#b91c1c', to:'/services' },
];

const WHY = [
  { icon:'worker',    label:'Trained Professionals',         bg:'rgba(22,52,87,.08)',  ic:'#163457' },
  { icon:'magnifier', label:'Technical Site Evaluation',     bg:'rgba(37,99,196,.08)', ic:'#2563c4' },
  { icon:'palette',   label:'Personalised Colour Consultation', bg:'rgba(124,58,237,.08)', ic:'#7c3aed' },
  { icon:'shield',    label:'Stringent Safety Protocol',     bg:'rgba(14,165,168,.08)', ic:'#0ea5a8' },
  { icon:'eye',       label:'Supervised Painting',          bg:'rgba(71,85,105,.06)',  ic:'#475569' },
  { icon:'gear',      label:'Mechanized Tools',              bg:'rgba(242,135,31,.1)', ic:'#f2871f' },
];

const TRUST_BADGES = [
  { icon:'medal',  title:'Asian Paints Royale Trained Experts', desc:'Premium Asian Paints Royale trained resources for a flawless application.' },
  { icon:'broom',  title:'Zero-Mess Guarantee',          desc:'Full furniture & floor protection on every job — no splatters, no exceptions.' },
  { icon:'trophy', title:'Years Trusted',                desc:'10+ years serving Ghaziabad, Noida & Delhi NCR homeowners.' },
];

const REASONS = [
  { icon:'target', title:'Precision & Craftsmanship',    desc:'Every brushstroke flawless — stunning, lasting finish on houses, flats, villas, societies and more.' },
  { icon:'worker', title:'Skilled & Experienced Team',   desc:'10+ years serving homes, societies, hospitals, offices and temples. Expertise for every project.' },
  { icon:'clock',  title:'Hassle-Free, On-Time Service', desc:'Clear communication, punctual arrival, professional execution. Completely stress-free.' },
  { icon:'coins',  title:'Free On-Site Estimates',        desc:'Know the full cost upfront. Free no-obligation inspection. Honest pricing — no hidden charges.' },
  { icon:'trophy', title:'Premium Paints & Materials',   desc:'Asian Paints, Berger, and top-grade materials. Beautiful results that last for years.' },
  { icon:'office', title:'All Property Types',            desc:'Houses, flats, villas, societies, hospitals, offices, temples — equipped for every scale.' },
];

// PLACEHOLDER — illustrative sample quotes only, not real customer reviews.
// Deliberately generic first-name + initial (no real customer names pulled
// from the operations sheet — attaching invented quotes to real, identifiable
// people without their consent is a defamation/privacy risk, not just a
// "looks fake" problem). Swap for actual customer feedback (WhatsApp/Google
// review text, collected with permission) before this goes live.
const TESTIMONIALS = [
  { name:'Priya S.',   area:'Indirapuram, Ghaziabad', rating:5,
    quote:'The team was punctual and kept the flat clean throughout the job. The finish in our living room came out just as we\'d discussed.' },
  { name:'Anil M.',    area:'Raj Nagar Extension',     rating:5,
    quote:'We\'d had a recurring seepage issue on one wall. Their team traced it to the actual source before repainting, instead of just covering it up.' },
  { name:'Kavita R.',  area:'Sector 62, Noida',        rating:5,
    quote:'Got a full-home repaint done before moving in. The on-site estimate was clear upfront and there were no surprise charges at the end.' },
  { name:'Deepak B.',  area:'Vasundhara, Ghaziabad',   rating:4,
    quote:'Appreciated the colour consultation — the associate helped us pick shades that actually suited our furniture rather than a generic recommendation.' },
  { name:'Manisha T.', area:'Raj Nagar, Ghaziabad',    rating:5,
    quote:'Exterior of our house hadn\'t been touched in years. They pressure-washed, filled every crack, and the Apex coat has handled two monsoons fine so far.' },
  { name:'Rohit V.',   area:'Kavi Nagar, Ghaziabad',   rating:5,
    quote:'Went with Royale Shyne for the living room on their recommendation. The sheen genuinely looks premium, and it wipes clean easily with the kids around.' },
  { name:'Sunita A.',  area:'RDC, Ghaziabad',          rating:4,
    quote:'Good work overall. Took a day longer than the original estimate because of extra putty work, but they explained why before doing it.' },
  { name:'Vikram J.',  area:'Sector 50, Noida',        rating:5,
    quote:'Booked them for a 3BHK repaint. Furniture protection was thorough — genuinely not a single splatter anywhere when they finished.' },
  { name:'Neha K.',    area:'Dwarka, Delhi',           rating:5,
    quote:'Called for a free estimate expecting the usual sales pressure. Got a straightforward on-site visit and an honest quote instead. Booked the same week.' },
  { name:'Arjun P.',   area:'Vasant Kunj, Delhi',      rating:5,
    quote:'Textured feature wall in the hall turned out better than the reference photos we showed them. Neighbours have already asked who did it.' },
  { name:'Ritu S.',    area:'Rohini, Delhi',           rating:4,
    quote:'Solid job on the exterior. Only feedback is the crew arrived later than scheduled on day one, but they made up the time by the end.' },
  { name:'Sandeep G.', area:'Indirapuram, Ghaziabad',  rating:5,
    quote:'Waterproofed the terrace before this year\'s monsoon after two years of ceiling stains. Zero leakage this season — first time in a while.' },
  { name:'Pooja M.',   area:'Raj Nagar Extension',     rating:5,
    quote:'Distemper touch-up for a rental property, quick and budget-friendly as promised. Didn\'t try to upsell us to a premium finish we didn\'t need.' },
  { name:'Karan D.',   area:'Sector 137, Noida',       rating:5,
    quote:'Repainted our office space over a weekend so there was zero disruption to work. Professional crew, cleaned up fully before Monday.' },
  { name:'Shalini N.', area:'Vasundhara, Ghaziabad',   rating:4,
    quote:'Happy with the final result. Would\'ve liked a bit more notice before the crew showed up, but the actual painting work was excellent.' },
  { name:'Amit R.',    area:'Kavi Nagar, Ghaziabad',   rating:5,
    quote:'Our society\'s common areas needed a repaint — they handled the scale without a hitch and coordinated timing around residents\' schedules.' },
  { name:'Divya C.',   area:'RDC, Ghaziabad',          rating:5,
    quote:'Putty and primer work before painting made a real difference — walls that used to look patchy are now completely even. Worth the extra day.' },
  { name:'Nikhil B.',  area:'Sector 62, Noida',        rating:5,
    quote:'Asked a lot of questions before booking and every answer matched what actually happened on site. Refreshingly straightforward company to deal with.' },
  { name:'Anjali W.',  area:'Raj Nagar, Ghaziabad',    rating:4,
    quote:'Good quality Royale finish in the bedrooms. Pricing was a little higher than one other quote we got, but the finish justified it.' },
  { name:'Rajesh L.',  area:'Indirapuram, Ghaziabad',  rating:5,
    quote:'Temple committee hired them for a full repaint ahead of a festival. Finished on the promised date, which mattered a lot given the deadline.' },
  { name:'Meera H.',   area:'Dehradun',                rating:5,
    quote:'Wasn\'t sure they\'d travel out this far but they did the full exterior job with the same attention to detail as the city jobs we\'d heard about.' },
  { name:'Suresh O.',  area:'Haridwar',                rating:5,
    quote:'Hospital wing repaint had to work around patient areas — they scheduled it in phases and kept noise/mess to a minimum throughout.' },
  { name:'Tanvi I.',   area:'Vasundhara, Ghaziabad',   rating:4,
    quote:'Overall a smooth experience. One coat needed touching up after it dried unevenly near a window, but they came back and fixed it free of charge.' },
  { name:'Gaurav F.',  area:'Raj Nagar Extension',     rating:5,
    quote:'Compared three painting companies before deciding. This was the only one that gave a written, itemised quote instead of a vague lump sum.' },
  { name:'Preeti Y.',  area:'Sector 50, Noida',        rating:5,
    quote:'Colour consultation actually helped — brought sample boards to match against our flooring instead of just showing a catalogue on a phone screen.' },
  { name:'Manoj E.',   area:'Kavi Nagar, Ghaziabad',   rating:5,
    quote:'Villa exterior needed serious crack repair before painting. They flagged the structural issue honestly instead of just painting over it.' },
  { name:'Bhavna U.',  area:'RDC, Ghaziabad',          rating:4,
    quote:'Texture work on the accent wall came out well. Communication could\'ve been a bit faster between booking and the actual visit date.' },
  { name:'Yash Q.',    area:'Raj Nagar, Ghaziabad',    rating:5,
    quote:'Second time using them, this time for a full flat repaint after the first waterproofing job held up perfectly for over a year.' },
];

function TrustBadges() {
  return (
    <div className="trust-badges-sec">
      <div className="trust-badges-grid">
        {TRUST_BADGES.map(b => (
          <div key={b.title} className="trust-badge">
            <div className="trust-badge-icon"><Icon name={b.icon} size={24} /></div>
            <div>
              <div className="trust-badge-title">{b.title}</div>
              <div className="trust-badge-desc">{b.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stars({ count }) {
  return (
    <div className="tm-stars" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} name="star" size={15} className={i < count ? 'tm-star-on' : 'tm-star-off'} />
      ))}
    </div>
  );
}

const FEATURED_PAINT_SLUGS = ['asian-paints-royale', 'royale-shyne-luxury-emulsion', 'apex-exterior-emulsion', 'apcolite-premium-enamel'];
const FEATURED_PAINT_STYLE = {
  'asian-paints-royale':            { icon: 'crown', accent: '#f2871f', bg: 'linear-gradient(135deg,#0d2137,#1c4068,#f2871f)' },
  'royale-shyne-luxury-emulsion':   { icon: 'star',  accent: '#7c3aed', bg: 'linear-gradient(135deg,#1a0f2e,#3b1f5c,#7c3aed)' },
  'apex-exterior-emulsion':         { icon: 'construction', accent: '#2563c4', bg: 'linear-gradient(135deg,#081627,#163457,#2563c4)' },
  'apcolite-premium-enamel':        { icon: 'brush', accent: '#475569', bg: 'linear-gradient(135deg,#0f172a,#334155,#475569)' },
};

function FeaturedPaints() {
  const paints = FEATURED_PAINT_SLUGS.map(slug => PAINT_TYPES.find(p => p.slug === slug)).filter(Boolean);
  return (
    <div className="fp-sec container">
      <div className="sec-head">
        <span className="sec-tag">Premium Products</span>
        <h2 className="sec-title">Paints We Trust</h2>
        <p className="sec-sub">Asian Paints Royale, Royale Shyne and more — real products, real finishes, tap any card for the full picture.</p>
      </div>
      <div className="fp-grid">
        {paints.map(p => {
          const s = FEATURED_PAINT_STYLE[p.slug];
          return (
            <Link key={p.slug} to={`/paint-types/${p.slug}`} className="fp-card" style={{ '--fp-accent': s.accent }}>
              <div className="fp-photo" style={{ background: s.bg }}>
                <Icon name={s.icon} size={34} style={{ color: '#fffdf8' }} />
                <span className={`fp-base fp-base-${p.oilOrWater === 'Oil-based' ? 'oil' : 'water'}`}>{p.oilOrWater}</span>
              </div>
              <div className="fp-body">
                <div className="fp-top">
                  <h3 className="fp-name">{p.name}</h3>
                  <span className={`paint-tier paint-tier-${p.tier.toLowerCase()}`}>{p.tier}</span>
                </div>
                <p className="fp-finish">{p.finish}</p>
                <span className="fp-learn">See full details →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const TESTIMONIALS_PAGE_SIZE = 8;

function Testimonials() {
  const [visible, setVisible] = useState(TESTIMONIALS_PAGE_SIZE);
  const shown = TESTIMONIALS.slice(0, visible);
  const hasMore = visible < TESTIMONIALS.length;

  return (
    <div className="testimonials-sec">
      <div className="container">
        <div className="sec-head">
          <span className="sec-tag">Customer Feedback</span>
          <h2 className="sec-title">What Homeowners Say</h2>
          <p className="sec-sub">A few notes from recent projects across Ghaziabad, Noida and Delhi NCR.</p>
        </div>
        <div className="tm-grid">
          {shown.map(t => (
            <article key={t.name} className="tm-card">
              <Icon name="quote" size={26} className="tm-quote-icon" />
              <Stars count={t.rating} />
              <p className="tm-text">{t.quote}</p>
              <div className="tm-author">
                <span className="tm-name">{t.name}</span>
                <span className="tm-area">{t.area}</span>
              </div>
            </article>
          ))}
        </div>
        {hasMore && (
          <div className="tm-more-row">
            <button type="button" className="btn-secondary" onClick={() => setVisible(v => v + TESTIMONIALS_PAGE_SIZE)}>
              Show More Reviews ({TESTIMONIALS.length - visible} more)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const location = useLocation();

  // The current "page" is derived from the real URL (not local-only state),
  // so each section has its own crawlable/shareable/bookmarkable address.
  const currentPage = Object.keys(PAGE_META).find(k => PAGE_META[k].path === location.pathname) || 'home';
  const meta = PAGE_META[currentPage] || PAGE_META.home;

  useEffect(() => { window.scrollTo(0, 0); }, [currentPage]);

  return (
    <div className="home">
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={`${SITE_URL}${meta.path}`} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:url" content={`${SITE_URL}${meta.path}`} />
        <meta property="og:type" content="website" />
        {currentPage === 'home' && (
          <script type="application/ld+json">{JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'The Painter Boys',
            image: `${SITE_URL}/images/logo.png`,
            telephone: '+917838888509',
            priceRange: '$$',
            url: SITE_URL,
            areaServed: [
              ...GHAZIABAD_AREAS.map(a => ({ '@type': 'Place', name: `${a}, Ghaziabad` })),
              ...AREAS.map(a => ({ '@type': 'City', name: a })),
            ],
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'KDP Grand Savanna Inner Rd, Raj Nagar Extension',
              addressLocality: 'Ghaziabad',
              addressRegion: 'Uttar Pradesh',
              postalCode: '201003',
              addressCountry: 'IN',
            },
            geo: { '@type': 'GeoCoordinates', latitude: 28.6692, longitude: 77.4538 },
            aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '120', bestRating: '5' },
            sameAs: [WA_LINK],
          })}</script>
        )}
      </Helmet>

      <SiteHeader />

      {/* ── PAGE CONTENT ── */}
      <main key={currentPage} className="page-fade">

        {/* ── HOME ── */}
        {currentPage === 'home' && (
          <>
            <section className="hero">
              <div className="hero-bg-pattern" />
              <div className="hero-content">
                <h1 className="hero-title">
                  <span className="hero-title-colorful">Home Painting Professionals</span>
                  <span className="hero-accent">With Decades of Experience</span>
                </h1>
                <p className="hero-desc hero-desc-full">
                  Expert painting with colour advice, advanced tools and a hassle-free experience — from start to finish.
                </p>
                <p className="hero-desc hero-desc-short">Expert painting, honest advice, zero hassle.</p>
                <div className="hero-stats">
                  <div className="hero-stat"><strong>2000+</strong><span>Homes Painted</span></div>
                  <div className="hero-stat-sep" />
                  <div className="hero-stat"><strong>10+</strong><span>Years Trusted</span></div>
                  <div className="hero-stat-sep" />
                  <div className="hero-stat"><strong>5</strong><span>Cities Covered</span></div>
                  <div className="hero-stat-sep" />
                  <div className="hero-stat"><strong><Icon name="star" size={16} style={{ marginRight: 3, verticalAlign: '-2px' }} />4.9</strong><span>Customer Rating</span></div>
                </div>
                <div className="hero-badge">
                  <Icon name="star" size={13} style={{ marginRight: 6, verticalAlign: '-2px' }} />
                  4.9 Rating · 2000+ Happy Homeowners
                </div>
                <div className="hero-presence">
                  <div className="hero-presence-head"><Icon name="pin" size={14} />We Proudly Serve</div>
                  <div className="hero-presence-chips">
                    {['Ghaziabad', 'Noida', 'Delhi', 'Haridwar', 'Dehradun'].map(c => (
                      <span key={c} className="hero-presence-chip">{c}</span>
                    ))}
                  </div>
                  <p className="hero-cities-local">Ghaziabad: {GHAZIABAD_AREAS.join(' · ')}</p>
                </div>
                <div className="hero-home-btns">
                  <Link to="/services" className="btn-primary">
                    <span className="hero-btn-full">Our Services →</span>
                    <span className="hero-btn-short">Services</span>
                  </Link>
                  <a className="btn-wa" href={WA_LINK} target="_blank" rel="noopener noreferrer">
                    <Icon name="whatsapp" size={17} />
                    <span className="hero-btn-full">WhatsApp Us</span>
                    <span className="hero-btn-short">WhatsApp</span>
                  </a>
                  <a className="btn-call-hero" href={`tel:${PHONE}`}>
                    <Icon name="phone" size={17} />
                    <span className="hero-btn-full">{PHONE}</span>
                    <span className="hero-btn-short">Call</span>
                  </a>
                </div>
              </div>
            </section>

            {/* Quick service nav cards */}
            <div className="home-quick-nav container">
              <h2 className="hqn-title">What Can We Do For You?</h2>
              <div className="hqn-grid">
                {QUICK_NAV.map(c => (
                  <Link key={c.label} to={c.to} className="hqn-card" style={{'--card-accent': c.accent}}>
                    <div className="hqn-icon"><Icon name={c.icon} size={34} /></div>
                    <div className="hqn-label">{c.label}</div>
                    <div className="hqn-sub">{c.sub}</div>
                    <div className="hqn-arrow" aria-hidden="true">→</div>
                  </Link>
                ))}
              </div>
            </div>

            <TrustBadges />

            {/* Trust banner */}
            <div className="trust-banner">
              <span className="tb-text">Service You Can Trust!</span>
              <span className="tb-sub">Let us know how we can help you today.</span>
              <a className="tb-btn" href={WA_LINK} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={15} />Schedule Free Estimate</a>
            </div>

            {/* Feature strip */}
            <div className="feature-strip">
              {[{icon:'magnifier',label:'On-Site Consultation'},{icon:'shield',label:'Furniture Protection'},{icon:'crown',label:'Premium Products'},{icon:'worker',label:'Certified Painters'},{icon:'check',label:'Post-Painting Clean-up'}]
                .map(f => (
                  <div key={f.label} className="fi">
                    <span className="fi-icon"><Icon name={f.icon} size={22} /></span>
                    <span className="fi-label">{f.label}</span>
                  </div>
                ))}
            </div>

            <FeaturedPaints />

            <Testimonials />
          </>
        )}

        {/* ── SERVICES ── */}
        {currentPage === 'services' && (
          <div className="inner-page">
            <div className="page-hero page-hero-blue">
              <div className="ph-content">
                <span className="sec-tag light">What We Do</span>
                <h1 className="ph-title">Professional Home Painting Services</h1>
                <p className="ph-sub">Premium products. Expert hands. Guaranteed results across all property types.</p>
              </div>
            </div>
            <div className="page-content-white">
              <div className="container section">
                <div className="svc-grid">
                  {SERVICES.map(s => (
                    <Link key={s.slug} to={`/services/${s.slug}`} className="svc-card" style={{'--svc-accent': s.accent}}>
                      <div className="svc-photo" style={{ background: s.bg }} role="img" aria-label={`${s.title} illustration`}>
                        <Icon name={s.icon} size={36} style={{ color: '#fffdf8' }} className="svc-photo-icon" />
                      </div>
                      <div className="svc-body">
                        <h3 className="svc-title">{s.title}</h3>
                        <ul className="svc-bullets">
                          {s.bullets.map(b => <li key={b}>{b}</li>)}
                        </ul>
                        <div className="svc-cta-row">
                          <span className="svc-learn">Learn more →</span>
                          <div className="svc-badge"><Icon name={s.icon} size={16} /></div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="sec-cta">
                  <a className="btn-primary" href={WA_LINK} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={17} />Discuss Your Project</a>
                  <Link to="/contact" className="btn-secondary">Get Free Quote →</Link>
                </div>
              </div>

              <TrustBadges />

              {/* Why Us circles */}
              <div className="why-sec">
                <div className="container">
                  <div className="sec-head">
                    <span className="sec-tag">Why Choose Us</span>
                    <h2 className="sec-title">The Painter Boys Difference</h2>
                    <p className="sec-sub">Professional standards you can see and feel — on every job, every time.</p>
                  </div>
                  <div className="why-grid">
                    {WHY.map(w => (
                      <div key={w.label} className="why-card" style={{'--why-bg': w.bg, '--why-ic': w.ic}}>
                        <div className="why-circle">
                          <Icon name={w.icon} size={38} className="why-icon" />
                        </div>
                        <div className="why-label">{w.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ABOUT ── */}
        {currentPage === 'about' && (
          <div className="inner-page">
            <div className="page-hero page-hero-dark">
              <div className="ph-content">
                <span className="sec-tag light">About Us</span>
                <h1 className="ph-title">More Than Just Painters</h1>
                <p className="ph-sub">A decade of trust, craftsmanship, and zero-compromise service across Delhi NCR.</p>
              </div>
            </div>
            <div className="page-content-white">
              <div className="container section">
                <div className="about-grid">
                  <div className="about-card"><div className="about-icon"><Icon name="badgeCheck" size={28} /></div><h3>Our Promise</h3><p>We won't leave until you are fully satisfied. Every customer walks the job with our crew leader and signs a quality assurance form before we leave.</p></div>
                  <div className="about-card"><div className="about-icon"><Icon name="home" size={28} /></div><h3>Zero Mess Guarantee</h3><p>Before we start, we cover floors, move furniture, fill cracks, and repair caulking. Paint goes only on your wall — no splatters. Ever.</p></div>
                  <div className="about-card"><div className="about-icon"><Icon name="trophy" size={28} /></div><h3>Proven Reputation</h3><p>Over a decade of trusted painting work — built on customer satisfaction, premium products, and never cutting corners.</p></div>
                  <div className="about-card"><div className="about-icon"><Icon name="temple" size={28} /></div><h3>All Properties</h3><p>Houses, flats, villas, housing societies, hospitals, offices, temples — our expert teams are equipped for every scale and type.</p></div>
                </div>
                <div className="notice-box">
                  <Icon name="warning" size={22} className="notice-icon" />
                  <div><strong>Important Notice</strong><p>We do not have any other branches or representatives. To receive legitimate service, call only the numbers listed on this portal.</p></div>
                </div>
              </div>
            </div>

            {/* Great Reasons */}
            <div className="reasons-sec">
              <div className="container">
                <div className="reasons-intro">
                  <span className="sec-tag">Why The Painter Boys</span>
                  <h2 className="sec-title">Great Reasons to Choose The Painter Boys</h2>
                  <p>They say "Finding good help is hard to do!" — we're on a mission to prove them wrong. When you choose The Painter Boys, you hire the best in the business.</p>
                </div>
                <div className="reasons-body">
                  <div className="reasons-grid">
                    {REASONS.map(r => (
                      <article key={r.title} className="reason-card">
                        <div className="rc-star"><Icon name={r.icon} size={17} /></div>
                        <div><div className="rc-title">{r.title}</div><div className="rc-desc">{r.desc}</div></div>
                      </article>
                    ))}
                  </div>
                  <div className="reasons-photo">
                    <div className="rp-img-crop">
                      <img src="/images/painter-boy.png" alt="Professional house painter from The Painter Boys at work in Delhi NCR" className="rp-img" loading="lazy"
                        onError={e => { e.target.parentElement.style.display='none'; e.target.parentElement.nextSibling.style.display='flex'; }} />
                    </div>
                    <div className="rp-fallback" style={{display:'none'}}>
                      <Icon name="brush" size={48} className="rp-fallback-icon" />
                      <div className="rp-fallback-text">The Painter Boys<br/>Home Painting Professionals</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── HOW IT WORKS ── */}
        {currentPage === 'how' && (
          <div className="inner-page">
            <div className="page-hero page-hero-blue">
              <div className="ph-content">
                <span className="sec-tag light">Our Process</span>
                <h1 className="ph-title">How It Works</h1>
                <p className="ph-sub">Simple, transparent, and stress-free — from first call to final walkthrough.</p>
              </div>
            </div>
            <div className="page-content-white">
              <div className="container section">
                <div className="how-grid">
                  {[
                    {n:'01',icon:'calendar',   title:'Schedule an Appointment',     desc:'Fill a quick form or WhatsApp us. Our team books a convenient time for a site visit.'},
                    {n:'02',icon:'magnifier',  title:'Product & Site Consultation',  desc:'Our associate visits your home, answers all questions, and provides a full consultation.'},
                    {n:'03',icon:'palette',    title:'Colour Selection',             desc:'Choose from our curated palette. Our expert helps you finalise the perfect shades.'},
                    {n:'04',icon:'shield',     title:'Work Preparation',            desc:'We cover floors and furniture, then begin the painting process with zero disruption.'},
                    {n:'05',icon:'gear',       title:'Site Execution',              desc:'Using a structured project management framework, we ensure high-quality, on-time execution.'},
                    {n:'06',icon:'home',       title:'Handover & Walkthrough',       desc:'Post-painting clean-up done. We walk you through and share tips for keeping walls beautiful.'},
                  ].map(s => (
                    <div key={s.n} className="how-card">
                      <div className="how-num">{s.n}</div>
                      <Icon name={s.icon} size={26} className="how-icon" />
                      <h3 className="how-title">{s.title}</h3>
                      <p className="how-desc">{s.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="sec-cta">
                  <a className="btn-primary" href={WA_LINK} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={17} />Book Your Free Consultation</a>
                  <Link to="/contact" className="btn-secondary">Contact Us →</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TEAM ── */}
        {currentPage === 'team' && (
          <div className="inner-page">
            <div className="page-hero page-hero-dark">
              <div className="ph-content">
                <span className="sec-tag light">Our Team</span>
                <h1 className="ph-title">Meet the Visionaries</h1>
                <p className="ph-sub">The people who make every job exceptional.</p>
              </div>
            </div>
            <div className="page-content-white">
              <div className="container section">
                <div className="team-grid">
                  {TEAM.map(t => (
                    <Link key={t.slug} to={`/team/${t.slug}`} className="team-card">
                      {t.img && <img src={t.img} alt={`${t.name}, ${t.role} at The Painter Boys`} className="team-photo" loading="lazy"
                        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />}
                      <div className="team-avatar" style={{ background: t.color, display: t.img ? 'none' : 'flex' }} aria-hidden="true">{t.initials}</div>
                      <h3 className="team-name">{t.name}</h3>
                      <div className="team-role">{t.role}</div>
                      <p className="team-bio">{t.bio}</p>
                      <div className="team-click-hint">Read full profile →</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PAINT TYPES ── */}
        {currentPage === 'paint-types' && (
          <div className="inner-page">
            <div className="page-hero page-hero-blue">
              <div className="ph-content">
                <span className="sec-tag light">Paint Guide</span>
                <h1 className="ph-title">Paint Types & Brands We Work With</h1>
                <p className="ph-sub">Asian Paints Royale, Tractor Emulsion, Apex, Royale Shyne and more — which finish suits your home?</p>
              </div>
            </div>
            <div className="page-content-white">
              <div className="container section">
                <div className="paint-grid">
                  {PAINT_TYPES.map(p => (
                    <Link key={p.slug} to={`/paint-types/${p.slug}`} className="paint-card">
                      <div className="paint-card-top">
                        <h3 className="paint-name">{p.name}</h3>
                        <span className={`paint-tier paint-tier-${p.tier.toLowerCase()}`}>{p.tier}</span>
                      </div>
                      <div className="paint-finish">{p.finish}</div>
                      <p className="paint-desc">{p.desc}</p>
                      <span className={`paint-base-chip paint-base-chip-${p.oilOrWater === 'Oil-based' ? 'oil' : 'water'}`}>{p.oilOrWater}</span>
                      <span className="paint-learn">Learn more →</span>
                    </Link>
                  ))}
                </div>

                {/* Oil vs water-based guide */}
                <div className="pbg-sec">
                  <div className="sec-head">
                    <span className="sec-tag">The Basics</span>
                    <h2 className="sec-title">Oil-Based vs Water-Based Paint</h2>
                    <p className="sec-sub">Every paint on this page is one or the other — here's what that actually changes.</p>
                  </div>
                  <div className="pbg-grid">
                    {[PAINT_BASE_GUIDE.water, PAINT_BASE_GUIDE.oil].map(g => (
                      <div key={g.title} className="pbg-card">
                        <h3 className="pbg-title">{g.title}</h3>
                        <ul className="pbg-list">
                          {g.points.map(pt => <li key={pt}>{pt}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="paint-note">
                  Not sure which paint is right for your space? Our team recommends the best option for your
                  budget and finish preference during your free on-site consultation.
                </p>
                <div className="sec-cta">
                  <a className="btn-primary" href={WA_LINK} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={17} />Ask Us Which Paint Is Right For You</a>
                  <Link to="/contact" className="btn-secondary">Get Free Quote →</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CONTACT ── */}
        {currentPage === 'contact' && (
          <div className="inner-page">
            <div className="contact-full">
              <div className="contact-top-section">
                <div className="container">
                  <div className="cfs-head">
                    <span className="sec-tag light">Contact Us</span>
                    <h1 className="cfs-title">Let's Transform Your Space</h1>
                    <p className="cfs-sub">Free consultation — no pressure, no hidden charges</p>
                  </div>
                  <div className="cfs-body">
                    <div className="cfs-cards">
                      <a className="cfs-card cfs-phone" href={`tel:${PHONE}`}>
                        <div className="cfsc-icon"><Icon name="phone" size={22} /></div>
                        <div>
                          <div className="cfsc-label">Call Us Now</div>
                          <div className="cfsc-val">+91 78388 88509</div>
                        </div>
                      </a>
                      <a className="cfs-card cfs-wa" href={WA_LINK} target="_blank" rel="noopener noreferrer">
                        <div className="cfsc-icon"><Icon name="whatsapp" size={20} /></div>
                        <div>
                          <div className="cfsc-label">WhatsApp</div>
                          <div className="cfsc-val">Chat Instantly</div>
                        </div>
                      </a>
                      <div className="cfs-card">
                        <div className="cfsc-icon"><Icon name="pin" size={22} /></div>
                        <div>
                          <div className="cfsc-label">Areas We Serve</div>
                          <div className="cfsc-val">Ghaziabad · Noida · Delhi · Haridwar · Dehradun</div>
                          <div className="cfsc-val cfsc-val-sub">Ghaziabad: {GHAZIABAD_AREAS.join(' · ')}</div>
                        </div>
                      </div>
                      <div className="cfs-card">
                        <div className="cfsc-icon"><Icon name="clock" size={22} /></div>
                        <div>
                          <div className="cfsc-label">Working Hours</div>
                          <div className="cfsc-val">Mon – Sun · 8 AM to 8 PM</div>
                        </div>
                      </div>
                    </div>
                    <div className="cfs-cta-block">
                      <h2 className="cfs-cta-title">Ready to Transform Your Home?</h2>
                      <p className="cfs-cta-sub">We paint houses, flats, villas, societies, hospitals, offices and temples — with premium paints and zero-mess execution.</p>
                      <div className="cfs-cta-btns">
                        <a className="btn-wa btn-lg" href={WA_LINK} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={19} />Get Free Quote on WhatsApp</a>
                        <a className="btn-call" href={`tel:${PHONE}`}><Icon name="phone" size={17} />Call Now</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service types quick grid */}
              <div className="contact-service-strip">
                <div className="container">
                  <p className="css-label">We Paint Everything</p>
                  <div className="css-grid">
                    {[
                      { icon:'home', label:'Houses & Flats' },
                      { icon:'office', label:'Villas' },
                      { icon:'office', label:'Societies' },
                      { icon:'medical', label:'Hospitals' },
                      { icon:'office', label:'Offices' },
                      { icon:'temple', label:'Temples' },
                    ].map(s => (
                      <div key={s.label} className="css-chip"><Icon name={s.icon} size={15} />{s.label}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>{/* end page-fade */}

      <SiteFooter />

      <a className="wa-fab" href={WA_LINK} target="_blank" rel="noopener noreferrer" title="Chat on WhatsApp"><Icon name="whatsapp" size={26} /></a>
    </div>
  );
}
