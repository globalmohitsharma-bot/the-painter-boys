import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SiteHeader from './SiteHeader.jsx';
import SiteFooter from './SiteFooter.jsx';
import Icon from './Icon.jsx';
import { SITE_URL, PHONE, WA_LINK, AREAS, GHAZIABAD_AREAS, PAGE_META } from './siteConfig.js';
import './Home.css';

const PAINT_TYPES = [
  { name: 'Asian Paints Royale',        tier: 'Luxury',  finish: 'Smooth matt luxury emulsion',
    desc: 'A premium interior emulsion known for its rich, smooth, non-reflective finish that hides minor wall imperfections and tolerates a damp-cloth wipe. Popular for living rooms and feature walls where a luxury look matters.' },
  { name: 'Tractor Emulsion',           tier: 'Economy', finish: 'Matt emulsion',
    desc: 'Asian Paints\' value-for-money emulsion range — a practical, washable finish for bedrooms and interiors where budget matters without giving up a clean look.' },
  { name: 'Royale Shyne Luxury Emulsion', tier: 'Luxury', finish: 'High-sheen luxury emulsion',
    desc: 'Asian Paints\' top-tier luxury emulsion — one step above standard Royale, with a high-sheen, reflective finish, Teflon surface protection, anti-bacterial and anti-fungal shield, and an 8-year performance warranty. Superior stain resistance and washability, ideal for statement walls and high-traffic living spaces.' },
  { name: 'Apex Exterior Emulsion',     tier: 'Premium', finish: 'Weatherproof exterior',
    desc: 'Built for exteriors — weather and UV resistant, formulated to resist algae/fungal growth and monsoon dampness on outer walls and building facades.' },
  { name: 'Distemper',                  tier: 'Budget',  finish: 'Matt, basic',
    desc: 'The most economical wall finish, suited for spaces needing a quick, affordable refresh — commonly used in budget-conscious interior projects.' },
  { name: 'Texture & Designer Finishes',tier: 'Luxury',  finish: '3D texture / designer',
    desc: 'Decorative textured finishes for feature walls — stone, fabric and abstract patterns that add a designer touch to living rooms and entryways.' },
];

const QUICK_NAV = [
  { icon:'home',         label:'Interior Painting',       sub:'Homes, Flats & Villas',     accent:'#b8934a' },
  { icon:'construction', label:'Exterior Painting',       sub:'Buildings & Societies',     accent:'#4a6178' },
  { icon:'water',        label:'Waterproofing',            sub:'Leakage & Dampness',        accent:'#3f6b5f' },
  { icon:'crown',        label:'Premium Finishes',         sub:'Royale & Luxury Paints',    accent:'#D4AF37' },
  { icon:'office',       label:'Commercial Spaces',        sub:'Offices & Hospitals',       accent:'#5c5650' },
  { icon:'temple',       label:'Temples & Institutions',   sub:'All Property Types',        accent:'#6b3f52' },
];

const SERVICES_PHOTO = [
  { bg:'linear-gradient(135deg,#1c1a17,#4a3820,#b8934a)', icon:'home', accent:'#b8934a', title:'Interior Painting',
    bullets:['Premium emulsion, distemper & luxury finishes','Full furniture protection — zero mess guaranteed'] },
  { bg:'linear-gradient(135deg,#1a2128,#2d3d4a,#4a6178)', icon:'construction', accent:'#4a6178', title:'Exterior Painting',
    bullets:['Weather-resistant & UV-protective coatings','Surface prep, crack filling & primer included'] },
  { bg:'linear-gradient(135deg,#14201d,#24413a,#3f6b5f)', icon:'water', accent:'#3f6b5f', title:'Waterproofing',
    bullets:['Eliminate seepage, dampness & wall leakages','Scientific solutions with quality materials'] },
  { bg:'linear-gradient(135deg,#1c1a17,#6b4f22,#D4AF37)', icon:'crown', accent:'#D4AF37', title:'Royale Emulsion',
    bullets:['Smooth, washable, lasting premium finish','Asian Paints Royale — stays vibrant for years'] },
  { bg:'linear-gradient(135deg,#1e1620,#3d2a3d,#6b3f52)', icon:'brush', accent:'#6b3f52', title:'Texture & Designer',
    bullets:['Unique 3D textures and designer wall finishes','Custom patterns for a premium luxury look'] },
  { bg:'linear-gradient(135deg,#1a1a1a,#35322e,#5c5650)', icon:'layers', accent:'#5c5650', title:'Putty & Primer',
    bullets:['Crack filling and professional wall levelling','Perfect surface prep for a flawless paint job'] },
];

const WHY = [
  { icon:'worker',    label:'Trained Professionals',         bg:'rgba(184,147,74,.08)', ic:'#9c7a3c' },
  { icon:'magnifier', label:'Technical Site Evaluation',     bg:'rgba(74,97,120,.08)',  ic:'#4a6178' },
  { icon:'palette',   label:'Personalised Colour Consultation', bg:'rgba(107,63,82,.08)', ic:'#6b3f52' },
  { icon:'shield',    label:'Stringent Safety Protocol',     bg:'rgba(63,107,95,.08)',  ic:'#3f6b5f' },
  { icon:'eye',       label:'Supervised Painting',          bg:'rgba(28,26,23,.06)',   ic:'#4a453e' },
  { icon:'gear',      label:'Mechanized Tools',              bg:'rgba(212,175,55,.1)', ic:'#9c7a3c' },
];

const TRUST_BADGES = [
  { icon:'medal',  title:'Asian Paints Royale Partner', desc:'Certified application of premium Asian Paints Royale & Apex ranges.' },
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
// Swap these for actual customer feedback (WhatsApp/Google review text, with
// permission) before this goes live — publishing fabricated reviews as if
// genuine is misleading to visitors and risky under consumer-protection rules
// around fake reviews.
const TESTIMONIALS = [
  { name:'Priya S.',  area:'Indirapuram, Ghaziabad', rating:5,
    quote:'The team was punctual and kept the flat clean throughout the job. The finish in our living room came out just as we\'d discussed.' },
  { name:'Anil M.',   area:'Raj Nagar Extension',      rating:5,
    quote:'We\'d had a recurring seepage issue on one wall. Their team traced it to the actual source before repainting, instead of just covering it up.' },
  { name:'Kavita R.', area:'Sector 62, Noida',          rating:5,
    quote:'Got a full-home repaint done before moving in. The on-site estimate was clear upfront and there were no surprise charges at the end.' },
  { name:'Deepak B.', area:'Vasundhara, Ghaziabad',     rating:4,
    quote:'Appreciated the colour consultation — the associate helped us pick shades that actually suited our furniture rather than a generic recommendation.' },
];

const TEAM = [
  { name:'Rajeev Kumar',    role:'Director — Delivery & Operations', img:null,                 initials:'RK', color:'#9c7a3c',
    bio:'With 10+ years leading painting and quality work, Rajeev heads customer relationships and operations. A passionate artist whose craftsmanship has made lasting impressions across Delhi NCR.' },
  { name:'Sonia Gupta',     role:'Marketing & Digital Growth',        img:'/images/sonia.webp', initials:'SG', color:'#4a6178',
    bio:'With 12+ years of marketing leadership, Sonia drives The Painter Boys\' digital transformation. Former consultant for Fortune 500 companies, now helping homeowners achieve their dream spaces.' },
  { name:'Dr. Susheel Rai', role:'Head of Operations',                img:'/images/susheel.jpg',initials:'SR', color:'#6b3f52',
    bio:'Overseeing operations with decades of leadership experience. His philosophy — caring for people and putting their needs first — defines The Painter Boys\' service culture throughout.' },
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

function Testimonials() {
  return (
    <div className="testimonials-sec">
      <div className="container">
        <div className="sec-head">
          <span className="sec-tag">Customer Feedback</span>
          <h2 className="sec-title">What Homeowners Say</h2>
          <p className="sec-sub">A few notes from recent projects across Ghaziabad, Noida and Delhi NCR.</p>
        </div>
        <div className="tm-grid">
          {TESTIMONIALS.map(t => (
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
      </div>
    </div>
  );
}

export default function Home() {
  const location = useLocation();
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedSvc,    setSelectedSvc]    = useState(null);
  const [form,           setForm]           = useState({ name:'', phone:'', area:'Ghaziabad', msg:'' });
  const [submitted,      setSubmitted]      = useState(false);

  // The current "page" is derived from the real URL (not local-only state),
  // so each section has its own crawlable/shareable/bookmarkable address.
  const currentPage = Object.keys(PAGE_META).find(k => PAGE_META[k].path === location.pathname) || 'home';
  const meta = PAGE_META[currentPage] || PAGE_META.home;

  useEffect(() => { window.scrollTo(0, 0); }, [currentPage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = `Hi! I'd like a free estimate.\nName: ${form.name}\nPhone: ${form.phone}\nArea: ${form.area}${form.msg ? '\nMessage: '+form.msg : ''}`;
    window.open(`${WA_LINK}?text=${encodeURIComponent(msg)}`, '_blank');
    setSubmitted(true);
  };

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
                <div className="hero-badge">
                  <Icon name="star" size={13} style={{ marginRight: 6, verticalAlign: '-2px' }} />
                  4.9 Rating · 120+ Happy Homeowners
                </div>
                <h1 className="hero-title">
                  Home Painting Professionals<br />
                  <span className="hero-accent">With Decades of Experience</span>
                </h1>
                <p className="hero-cities">Ghaziabad · Noida · Delhi · Haridwar · Dehradun</p>
                <p className="hero-cities hero-cities-local">Serving {GHAZIABAD_AREAS.join(' · ')} in Ghaziabad</p>
                <p className="hero-desc">
                  Expert painting with colour advice, advanced tools and a hassle-free experience — from start to finish.
                </p>
                <div className="hero-stats">
                  <div className="hero-stat"><strong>2000+</strong><span>Homes Painted</span></div>
                  <div className="hero-stat-sep" />
                  <div className="hero-stat"><strong>10+</strong><span>Years Trusted</span></div>
                  <div className="hero-stat-sep" />
                  <div className="hero-stat"><strong>5</strong><span>Cities Covered</span></div>
                  <div className="hero-stat-sep" />
                  <div className="hero-stat"><strong><Icon name="star" size={16} style={{ marginRight: 3, verticalAlign: '-2px' }} />4.9</strong><span>Customer Rating</span></div>
                </div>
                <div className="hero-home-btns">
                  <Link to="/services" className="btn-primary">Our Services →</Link>
                  <a className="btn-wa" href={WA_LINK} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={17} />WhatsApp Us</a>
                </div>
              </div>

              <div className="hero-form-card">
                <div className="hfc-head">Let Our Experts Help You</div>
                {submitted ? (
                  <div className="hfc-success">
                    <div className="hfc-success-icon"><Icon name="badgeCheck" size={40} style={{ color: 'var(--gold-deep)' }} /></div>
                    <div className="hfc-success-title">Request Sent!</div>
                    <p className="hfc-success-sub">
                      We've opened WhatsApp with your details — send the message and our team will reply shortly.
                    </p>
                    <button type="button" className="hfc-submit" style={{marginTop:18}}
                      onClick={() => setSubmitted(false)}>Send Another Request</button>
                  </div>
                ) : (
                  <form className="hfc-form" onSubmit={handleSubmit}>
                    <input className="hfc-input" placeholder="Enter Your Name *" required
                      value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                    <input className="hfc-input" placeholder="Enter Your Phone No *" type="tel" required
                      value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
                    <select className="hfc-input" value={form.area}
                      onChange={e => setForm(f => ({...f, area: e.target.value}))}>
                      {AREAS.map(a => <option key={a}>{a}</option>)}
                    </select>
                    <textarea className="hfc-input hfc-ta" placeholder="Your message (optional)" rows={3}
                      value={form.msg} onChange={e => setForm(f => ({...f, msg: e.target.value}))} />
                    <label className="hfc-check"><input type="checkbox" defaultChecked /> Get updates on WhatsApp</label>
                    <button type="submit" className="hfc-submit">Get Free Estimate →</button>
                  </form>
                )}
              </div>
            </section>

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

            {/* Quick service nav cards */}
            <div className="home-quick-nav container">
              <h2 className="hqn-title">What Can We Do For You?</h2>
              <div className="hqn-grid">
                {QUICK_NAV.map(c => (
                  <Link key={c.label} to="/services" className="hqn-card" style={{'--card-accent': c.accent}}>
                    <div className="hqn-icon"><Icon name={c.icon} size={34} /></div>
                    <div className="hqn-label">{c.label}</div>
                    <div className="hqn-sub">{c.sub}</div>
                    <div className="hqn-arrow" aria-hidden="true">→</div>
                  </Link>
                ))}
              </div>
            </div>

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
                  {SERVICES_PHOTO.map(s => (
                    <article key={s.title} className="svc-card" style={{'--svc-accent': s.accent}}
                      onClick={() => setSelectedSvc(s)}>
                      <div className="svc-photo" style={{ background: s.bg }} role="img" aria-label={`${s.title} illustration`}>
                        <Icon name={s.icon} size={60} style={{ color: '#fffdf8' }} className="svc-photo-icon" />
                      </div>
                      <div className="svc-body">
                        <h3 className="svc-title">{s.title}</h3>
                        <ul className="svc-bullets">
                          {s.bullets.map(b => <li key={b}>{b}</li>)}
                        </ul>
                        <div className="svc-cta-row">
                          <span className="svc-learn">Learn more →</span>
                          <div className="svc-badge"><Icon name={s.icon} size={19} /></div>
                        </div>
                      </div>
                    </article>
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
                    <article key={t.name} className="team-card" onClick={() => setSelectedMember(t)}>
                      {t.img && <img src={t.img} alt={`${t.name}, ${t.role} at The Painter Boys`} className="team-photo" loading="lazy"
                        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />}
                      <div className="team-avatar" style={{ background: t.color, display: t.img ? 'none' : 'flex' }} aria-hidden="true">{t.initials}</div>
                      <h3 className="team-name">{t.name}</h3>
                      <div className="team-role">{t.role}</div>
                      <p className="team-bio">{t.bio}</p>
                      <div className="team-click-hint">Tap to know more →</div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            {selectedMember && (
              <div className="team-modal-overlay" onClick={() => setSelectedMember(null)}>
                <div className="team-modal" onClick={e => e.stopPropagation()}>
                  <button className="team-modal-close" onClick={() => setSelectedMember(null)}><Icon name="close" size={15} /></button>
                  {selectedMember.img
                    ? <img src={selectedMember.img} alt={`${selectedMember.name}, ${selectedMember.role} at The Painter Boys`} className="team-modal-photo"
                        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                    : null}
                  <div className="team-modal-avatar" style={{ background: selectedMember.color, display: selectedMember.img ? 'none' : 'flex' }}>
                    {selectedMember.initials}
                  </div>
                  <h3 className="team-modal-name">{selectedMember.name}</h3>
                  <div className="team-modal-role">{selectedMember.role}</div>
                  <p className="team-modal-bio">{selectedMember.bio}</p>
                </div>
              </div>
            )}
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
                    <article key={p.name} className="paint-card">
                      <div className="paint-card-top">
                        <h3 className="paint-name">{p.name}</h3>
                        <span className={`paint-tier paint-tier-${p.tier.toLowerCase()}`}>{p.tier}</span>
                      </div>
                      <div className="paint-finish">{p.finish}</div>
                      <p className="paint-desc">{p.desc}</p>
                    </article>
                  ))}
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

      {/* ── Service detail modal ── */}
      {selectedSvc && (
        <div className="svc-modal-overlay" onClick={() => setSelectedSvc(null)}>
          <div className="svc-modal" style={{'--svc-accent': selectedSvc.accent}} onClick={e => e.stopPropagation()}>
            <button className="team-modal-close" onClick={() => setSelectedSvc(null)}><Icon name="close" size={15} /></button>
            <div className="svc-modal-photo" style={{background: selectedSvc.bg}}>
              <Icon name={selectedSvc.icon} size={52} style={{ color: '#fffdf8' }} />
            </div>
            <div className="svc-modal-body">
              <h2 className="svc-modal-title">{selectedSvc.title}</h2>
              <ul className="svc-modal-bullets">
                {selectedSvc.bullets.map(b => <li key={b}>{b}</li>)}
              </ul>
              <div className="svc-modal-cta">
                <a className="btn-primary" href={WA_LINK} target="_blank" rel="noopener noreferrer"
                  onClick={() => setSelectedSvc(null)}><Icon name="whatsapp" size={17} />Get Quote for {selectedSvc.title}</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
