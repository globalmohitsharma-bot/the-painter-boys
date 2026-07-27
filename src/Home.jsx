import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './Home.css';

const SITE_URL = 'https://www.thepainterboys.com';
const PHONE   = '+91 7838888509';
const WA_LINK = 'https://wa.me/917838888509';
const AREAS   = ['Ghaziabad', 'Noida', 'Delhi NCR', 'Haridwar', 'Dehradun'];
// Specific Ghaziabad localities we actively target — used in visible copy and
// structured data so local searches (e.g. "painter in Raj Nagar Extension")
// have a matching, real on-page signal, not just a city-level mention.
const GHAZIABAD_AREAS = ['Raj Nagar Extension', 'Raj Nagar', 'Kavi Nagar', 'RDC', 'Indirapuram', 'Vasundhara'];

// Real URL per page, plus a keyword-focused title/description for search results
// and social previews. Google's crawler executes JS and will pick these up per
// route; crawlers/link-preview bots that don't run JS still only see the default
// tags in index.html, since this is a client-rendered app (no server-side render).
const PAGE_META = {
  home: {
    path: '/',
    title: 'The Painter Boys — Home Painting Services in Raj Nagar Extension, Indirapuram, Kavi Nagar, Ghaziabad',
    description: 'Expert home painting in Raj Nagar Extension, Raj Nagar, Kavi Nagar, RDC, Indirapuram & Vasundhara (Ghaziabad), plus Noida & Delhi NCR. Interior, exterior, waterproofing & premium finishes. Free on-site estimate — trusted since 2010.',
  },
  services: {
    path: '/services',
    title: 'Interior, Exterior & Waterproofing Painting Services | The Painter Boys',
    description: 'Interior painting, exterior painting, waterproofing, royal emulsion, texture & designer finishes, putty & primer — professional painting services across Ghaziabad, Noida & Delhi NCR.',
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
    title: 'Paint Types & Brands Guide — Asian Paints Royal, Tractor, Apex | The Painter Boys',
    description: 'A guide to popular paint types we work with — Asian Paints Royal, Tractor Emulsion, Apex exterior, Royal Shyne, distemper and premium textures — and which suits your home.',
  },
  contact: {
    path: '/contact',
    title: 'Contact Us — Free Painting Estimate in Raj Nagar Ext, Indirapuram & Ghaziabad | The Painter Boys',
    description: 'Get a free, no-obligation painting estimate in Raj Nagar Extension, Raj Nagar, Kavi Nagar, RDC, Indirapuram, Vasundhara, Noida, Delhi NCR, Haridwar or Dehradun. Call, WhatsApp, or request a callback — we respond fast.',
  },
};

const PAINT_TYPES = [
  { name: 'Asian Paints Royal',        tier: 'Luxury',  finish: 'Smooth matt / luxury emulsion',
    desc: 'A premium interior emulsion known for its rich, smooth finish and long-lasting colour. Popular for living rooms and feature walls where a luxury look matters.' },
  { name: 'Tractor Emulsion',           tier: 'Economy', finish: 'Matt emulsion',
    desc: 'Asian Paints\' value-for-money emulsion range — a practical, washable finish for bedrooms and interiors where budget matters without giving up a clean look.' },
  { name: 'Royal Shyne Emulsion',       tier: 'Premium', finish: 'Soft sheen luxury emulsion',
    desc: 'A soft-sheen premium emulsion that adds subtle luster to walls, offering better stain resistance and washability than standard matt finishes.' },
  { name: 'Apex Exterior Emulsion',     tier: 'Premium', finish: 'Weatherproof exterior',
    desc: 'Built for exteriors — weather and UV resistant, formulated to resist algae/fungal growth and monsoon dampness on outer walls and building facades.' },
  { name: 'Distemper',                  tier: 'Budget',  finish: 'Matt, basic',
    desc: 'The most economical wall finish, suited for spaces needing a quick, affordable refresh — commonly used in budget-conscious interior projects.' },
  { name: 'Texture & Designer Finishes',tier: 'Luxury',  finish: '3D texture / designer',
    desc: 'Decorative textured finishes for feature walls — stone, fabric and abstract patterns that add a designer touch to living rooms and entryways.' },
];

const QUICK_NAV = [
  { icon:'🏠', label:'Interior Painting',       sub:'Homes, Flats & Villas',     accent:'#f97316' },
  { icon:'🏗️', label:'Exterior Painting',       sub:'Buildings & Societies',     accent:'#0ea5e9' },
  { icon:'💧', label:'Waterproofing',            sub:'Leakage & Dampness',        accent:'#10b981' },
  { icon:'👑', label:'Premium Finishes',         sub:'Royal & Luxury Paints',     accent:'#8b5cf6' },
  { icon:'🏢', label:'Commercial Spaces',        sub:'Offices & Hospitals',       accent:'#f59e0b' },
  { icon:'🕌', label:'Temples & Institutions',   sub:'All Property Types',        accent:'#ef4444' },
];

const SERVICES_PHOTO = [
  { bg:'linear-gradient(135deg,#fff3e0,#ffe082,#ff8a65)', icon:'🏠', accent:'#f97316', title:'Interior Painting',
    bullets:['Premium emulsion, distemper & luxury finishes','Full furniture protection — zero mess guaranteed'] },
  { bg:'linear-gradient(135deg,#e3f2fd,#90caf9,#1565c0)', icon:'🏗️', accent:'#0ea5e9', title:'Exterior Painting',
    bullets:['Weather-resistant & UV-protective coatings','Surface prep, crack filling & primer included'] },
  { bg:'linear-gradient(135deg,#e8f5e9,#a5d6a7,#2e7d32)', icon:'💧', accent:'#10b981', title:'Waterproofing',
    bullets:['Eliminate seepage, dampness & wall leakages','Scientific solutions with quality materials'] },
  { bg:'linear-gradient(135deg,#fff8e1,#ffe082,#ff6f00)', icon:'👑', accent:'#f59e0b', title:'Royal Emulsion',
    bullets:['Smooth, washable, lasting premium finish','Asian Paints Royal — stays vibrant for years'] },
  { bg:'linear-gradient(135deg,#fce4ec,#f48fb1,#ad1457)', icon:'✨', accent:'#e91e7a', title:'Texture & Designer',
    bullets:['Unique 3D textures and designer wall finishes','Custom patterns for a premium luxury look'] },
  { bg:'linear-gradient(135deg,#efebe9,#d7ccc8,#8d6e63)', icon:'🔲', accent:'#8d6e63', title:'Putty & Primer',
    bullets:['Crack filling and professional wall levelling','Perfect surface prep for a flawless paint job'] },
];

const WHY = [
  { icon:'👷', label:'Trained Professionals',         bg:'#fff3e0', ic:'#f97316' },
  { icon:'🔍', label:'Technical Site Evaluation',     bg:'#e3f2fd', ic:'#0ea5e9' },
  { icon:'🎨', label:'Personalised Colour Consultation', bg:'#fce4ec', ic:'#e91e7a' },
  { icon:'🦺', label:'Stringent Safety Protocol',     bg:'#e8f5e9', ic:'#10b981' },
  { icon:'👁️', label:'Supervised Painting',          bg:'#f3e5f5', ic:'#8b5cf6' },
  { icon:'⚙️', label:'Mechanized Tools',              bg:'#fff8e1', ic:'#f59e0b' },
];

const REASONS = [
  { icon:'🎯', title:'Precision & Craftsmanship',    desc:'Every brushstroke flawless — stunning, lasting finish on houses, flats, villas, societies and more.' },
  { icon:'👷', title:'Skilled & Experienced Team',   desc:'10+ years serving homes, societies, hospitals, offices and temples. Expertise for every project.' },
  { icon:'⏱️', title:'Hassle-Free, On-Time Service', desc:'Clear communication, punctual arrival, professional execution. Completely stress-free.' },
  { icon:'💰', title:'Free On-Site Estimates',        desc:'Know the full cost upfront. Free no-obligation inspection. Honest pricing — no hidden charges.' },
  { icon:'🏆', title:'Premium Paints & Materials',   desc:'Asian Paints, Berger, and top-grade materials. Beautiful results that last for years.' },
  { icon:'🏢', title:'All Property Types',            desc:'Houses, flats, villas, societies, hospitals, offices, temples — equipped for every scale.' },
];

const TEAM = [
  { name:'Rajeev Kumar',    role:'Director — Delivery & Operations', img:null,                 initials:'RK', color:'#f97316',
    bio:'With 10+ years leading painting and quality work, Rajeev heads customer relationships and operations. A passionate artist whose craftsmanship has made lasting impressions across Delhi NCR.' },
  { name:'Sonia Gupta',     role:'Marketing & Digital Growth',        img:'/images/sonia.webp', initials:'SG', color:'#8b5cf6',
    bio:'With 12+ years of marketing leadership, Sonia drives The Painter Boys\' digital transformation. Former consultant for Fortune 500 companies, now helping homeowners achieve their dream spaces.' },
  { name:'Dr. Susheel Rai', role:'Head of Operations',                img:'/images/susheel.jpg',initials:'SR', color:'#0ea5e9',
    bio:'Overseeing operations with decades of leadership experience. His philosophy — caring for people and putting their needs first — defines The Painter Boys\' service culture throughout.' },
];

const NAV_PAGES = [
  ['services','Services'],['about','About Us'],['how','How It Works'],
  ['team','Our Team'],['paint-types','Paint Types'],['contact','Contact'],
];

export default function Home() {
  const location = useLocation();
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [scrolled,       setScrolled]       = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedSvc,    setSelectedSvc]    = useState(null);
  const [form,           setForm]           = useState({ name:'', phone:'', area:'Ghaziabad', msg:'' });

  // The current "page" is derived from the real URL (not local-only state),
  // so each section has its own crawlable/shareable/bookmarkable address.
  const currentPage = Object.keys(PAGE_META).find(k => PAGE_META[k].path === location.pathname) || 'home';
  const meta = PAGE_META[currentPage] || PAGE_META.home;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [currentPage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = `Hi! I'd like a free estimate.\nName: ${form.name}\nPhone: ${form.phone}\nArea: ${form.area}${form.msg ? '\nMessage: '+form.msg : ''}`;
    window.open(`${WA_LINK}?text=${encodeURIComponent(msg)}`, '_blank');
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
            address: { '@type': 'PostalAddress', addressRegion: 'Delhi NCR', addressCountry: 'IN' },
            geo: { '@type': 'GeoCoordinates', latitude: 28.6692, longitude: 77.4538 },
            sameAs: [WA_LINK],
          })}</script>
        )}
      </Helmet>

      {/* ── Topbar + Nav (site header) ── */}
      <header>
      <div className={`topbar${scrolled ? ' topbar-sm' : ''}`}>
        <div className="topbar-inner">
          <Link to="/" className="topbar-brand" aria-label="The Painter Boys — Home">
            <div className="topbar-brand-text">
              <div className="topbar-name">
                <span className="tn-the">The </span>
                <span className="tn-p">P</span><span className="tn-a">a</span><span className="tn-i">i</span>
                <span className="tn-n">n</span><span className="tn-t">t</span><span className="tn-e">e</span>
                <span className="tn-r">r</span><span className="tn-sp"> </span>
                <span className="tn-b">B</span><span className="tn-o">o</span><span className="tn-y">y</span>
                <span className="tn-s">s</span>
              </div>
              <div className="topbar-sub">⭐ Trusted Since 2010</div>
            </div>
          </Link>
          <a className="topbar-phone" href={`tel:${PHONE}`}>
            <span className="tp-icon">📞</span>
            <span className="tp-num">+91 78388 88509</span>
          </a>
          <a className="topbar-cta" href={WA_LINK} target="_blank" rel="noopener noreferrer">BOOK FREE ESTIMATE</a>
          <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* ── Nav bar ── */}
      <nav className={`nav${scrolled ? ' nav-scrolled' : ''}`} style={{ top: scrolled ? '50px' : '60px' }}>
        <div className="nav-inner">
          {NAV_PAGES.map(([id, label]) => (
            <Link key={id} to={PAGE_META[id].path} className={`nav-link${currentPage === id ? ' nav-link-active' : ''}`}>
              {label}
            </Link>
          ))}
          <a className="nav-portal" href="/pb">🔐 Staff Portal</a>
        </div>
      </nav>

      {/* ── Mobile overlay ── */}
      <div className={`mobile-overlay${menuOpen ? ' open' : ''}`}>
        <Link to="/" className="mo-link mo-home" onClick={() => setMenuOpen(false)}>🏠 Home</Link>
        {NAV_PAGES.map(([id, label]) => (
          <Link key={id} to={PAGE_META[id].path} className={`mo-link${currentPage === id ? ' mo-active' : ''}`}
            onClick={() => setMenuOpen(false)}>{label}</Link>
        ))}
        <a className="mo-link mo-portal" href="/pb" onClick={() => setMenuOpen(false)}>🔐 Staff Portal</a>
        <a className="mo-link mo-wa" href={WA_LINK} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>💬 WhatsApp Us</a>
      </div>
      </header>

      {/* ── PAGE CONTENT ── */}
      <main key={currentPage} className="page-fade">

        {/* ── HOME ── */}
        {currentPage === 'home' && (
          <>
            <section className="hero">
              <div className="hero-bg-pattern" />
              <div className="hero-content">
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
                  <div className="hero-stat"><strong>500+</strong><span>Homes Painted</span></div>
                  <div className="hero-stat-sep" />
                  <div className="hero-stat"><strong>10+</strong><span>Years Trusted</span></div>
                  <div className="hero-stat-sep" />
                  <div className="hero-stat"><strong>5</strong><span>Cities Covered</span></div>
                  <div className="hero-stat-sep" />
                  <div className="hero-stat"><strong>⭐ 4.9</strong><span>Customer Rating</span></div>
                </div>
                <div className="hero-home-btns">
                  <Link to="/services" className="btn-primary">Our Services →</Link>
                  <a className="btn-wa" href={WA_LINK} target="_blank" rel="noopener noreferrer">💬 WhatsApp Us</a>
                </div>
              </div>

              <div className="hero-form-card">
                <div className="hfc-head">Let Our Experts Help You</div>
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
              </div>
            </section>

            {/* Trust banner */}
            <div className="trust-banner">
              <span className="tb-text">Service You Can Trust!</span>
              <span className="tb-sub">Let us know how we can help you today.</span>
              <a className="tb-btn" href={WA_LINK} target="_blank" rel="noopener noreferrer">💬 Schedule Free Estimate</a>
            </div>

            {/* Feature strip */}
            <div className="feature-strip">
              {[{icon:'🔍',label:'On-Site Consultation'},{icon:'🛡️',label:'Furniture Protection'},{icon:'👑',label:'Premium Products'},{icon:'👷',label:'Certified Painters'},{icon:'✅',label:'Post-Painting Clean-up'}]
                .map(f => (
                  <div key={f.label} className="fi">
                    <span className="fi-icon">{f.icon}</span>
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
                    <div className="hqn-icon" aria-hidden="true">{c.icon}</div>
                    <div className="hqn-label">{c.label}</div>
                    <div className="hqn-sub">{c.sub}</div>
                    <div className="hqn-arrow" aria-hidden="true">→</div>
                  </Link>
                ))}
              </div>
            </div>
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
                        <div className="svc-photo-icon" aria-hidden="true">{s.icon}</div>
                      </div>
                      <div className="svc-body">
                        <h3 className="svc-title">{s.title}</h3>
                        <ul className="svc-bullets">
                          {s.bullets.map(b => <li key={b}>{b}</li>)}
                        </ul>
                        <div className="svc-cta-row">
                          <span className="svc-learn">Learn more →</span>
                          <div className="svc-badge" aria-hidden="true">{s.icon}</div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="sec-cta">
                  <a className="btn-primary" href={WA_LINK} target="_blank" rel="noopener noreferrer">💬 Discuss Your Project</a>
                  <Link to="/contact" className="btn-secondary">Get Free Quote →</Link>
                </div>
              </div>

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
                          <div className="why-icon">{w.icon}</div>
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
                  <div className="about-card"><div className="about-icon">🤝</div><h3>Our Promise</h3><p>We won't leave until you are fully satisfied. Every customer walks the job with our crew leader and signs a quality assurance form before we leave.</p></div>
                  <div className="about-card"><div className="about-icon">🏠</div><h3>Zero Mess Guarantee</h3><p>Before we start, we cover floors, move furniture, fill cracks, and repair caulking. Paint goes only on your wall — no splatters. Ever.</p></div>
                  <div className="about-card"><div className="about-icon">🏆</div><h3>Proven Reputation</h3><p>Over a decade of trusted painting work — built on customer satisfaction, premium products, and never cutting corners.</p></div>
                  <div className="about-card"><div className="about-icon">🕌</div><h3>All Properties</h3><p>Houses, flats, villas, housing societies, hospitals, offices, temples — our expert teams are equipped for every scale and type.</p></div>
                </div>
                <div className="notice-box">
                  <span className="notice-icon">⚠️</span>
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
                        <div className="rc-star" aria-hidden="true">{r.icon}</div>
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
                      <div className="rp-fallback-icon">🎨</div>
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
                    {n:'01',icon:'📅',title:'Schedule an Appointment',     desc:'Fill a quick form or WhatsApp us. Our team books a convenient time for a site visit.'},
                    {n:'02',icon:'🔍',title:'Product & Site Consultation',  desc:'Our associate visits your home, answers all questions, and provides a full consultation.'},
                    {n:'03',icon:'🎨',title:'Colour Selection',             desc:'Choose from our curated palette. Our expert helps you finalise the perfect shades.'},
                    {n:'04',icon:'🛡️',title:'Work Preparation',            desc:'We cover floors and furniture, then begin the painting process with zero disruption.'},
                    {n:'05',icon:'⚙️',title:'Site Execution',              desc:'Using a structured project management framework, we ensure high-quality, on-time execution.'},
                    {n:'06',icon:'🏠',title:'Handover & Walkthrough',       desc:'Post-painting clean-up done. We walk you through and share tips for keeping walls beautiful.'},
                  ].map(s => (
                    <div key={s.n} className="how-card">
                      <div className="how-num">{s.n}</div>
                      <div className="how-icon">{s.icon}</div>
                      <h3 className="how-title">{s.title}</h3>
                      <p className="how-desc">{s.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="sec-cta">
                  <a className="btn-primary" href={WA_LINK} target="_blank" rel="noopener noreferrer">💬 Book Your Free Consultation</a>
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
                  <button className="team-modal-close" onClick={() => setSelectedMember(null)}>✕</button>
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
                <p className="ph-sub">Asian Paints Royal, Tractor Emulsion, Apex, Royal Shyne and more — which finish suits your home?</p>
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
                  <a className="btn-primary" href={WA_LINK} target="_blank" rel="noopener noreferrer">💬 Ask Us Which Paint Is Right For You</a>
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
                        <div className="cfsc-icon">📞</div>
                        <div>
                          <div className="cfsc-label">Call Us Now</div>
                          <div className="cfsc-val">+91 78388 88509</div>
                        </div>
                      </a>
                      <a className="cfs-card cfs-wa" href={WA_LINK} target="_blank" rel="noopener noreferrer">
                        <div className="cfsc-icon">💬</div>
                        <div>
                          <div className="cfsc-label">WhatsApp</div>
                          <div className="cfsc-val">Chat Instantly</div>
                        </div>
                      </a>
                      <div className="cfs-card">
                        <div className="cfsc-icon">📍</div>
                        <div>
                          <div className="cfsc-label">Areas We Serve</div>
                          <div className="cfsc-val">Ghaziabad · Noida · Delhi · Haridwar · Dehradun</div>
                          <div className="cfsc-val cfsc-val-sub">Ghaziabad: {GHAZIABAD_AREAS.join(' · ')}</div>
                        </div>
                      </div>
                      <div className="cfs-card">
                        <div className="cfsc-icon">🕐</div>
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
                        <a className="btn-wa btn-lg" href={WA_LINK} target="_blank" rel="noopener noreferrer">💬 Get Free Quote on WhatsApp</a>
                        <a className="btn-call" href={`tel:${PHONE}`}>📞 Call Now</a>
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
                    {['🏠 Houses & Flats','🏙️ Villas','🏘️ Societies','🏥 Hospitals','🏢 Offices','🕌 Temples'].map(s => (
                      <div key={s} className="css-chip">{s}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>{/* end page-fade */}

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-col footer-brand-col">
              <Link to="/" className="footer-brand-name">
                <span className="tn-the">The </span>
                <span className="tn-p">P</span><span className="tn-a">a</span><span className="tn-i">i</span>
                <span className="tn-n">n</span><span className="tn-t">t</span><span className="tn-e">e</span>
                <span className="tn-r">r</span><span className="tn-sp"> </span>
                <span className="tn-b">B</span><span className="tn-o">o</span><span className="tn-y">y</span>
                <span className="tn-s">s</span>
              </Link>
              <p className="footer-tagline">Home Painting Professionals<br/>Do it right, Do it once.</p>
              <a className="footer-phone" href={`tel:${PHONE}`}>📞 +91 78388 88509</a>
              <a className="footer-wa-btn" href={WA_LINK} target="_blank" rel="noopener noreferrer">💬 WhatsApp Us</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Our Services</div>
              <div className="footer-col-links">
                {['Interior Painting','Exterior Painting','Waterproofing','Royal Emulsion','Texture & Designer','Putty & Primer'].map(s => (
                  <Link key={s} to="/services" className="footer-link">{s}</Link>
                ))}
              </div>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Company</div>
              <div className="footer-col-links">
                {NAV_PAGES.map(([id,label]) => (
                  <Link key={id} to={PAGE_META[id].path} className="footer-link">{label}</Link>
                ))}
              </div>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Areas Served</div>
              <div className="footer-col-links">
                {['Ghaziabad','Noida','Delhi NCR','Haridwar','Dehradun'].map(a => (
                  <span key={a} className="footer-area">{a}</span>
                ))}
              </div>
              <div className="footer-col-title" style={{marginTop:20}}>We Paint</div>
              <div className="footer-prop-types">
                Houses · Flats · Villas · Societies · Hospitals · Offices · Temples
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">© 2026 The Painter Boys · All Rights Reserved</div>
            <div className="footer-bottom-links">
              <a className="footer-link" href="/pb">Staff Portal</a>
            </div>
          </div>
        </div>
      </footer>

      <a className="wa-fab" href={WA_LINK} target="_blank" rel="noopener noreferrer" title="Chat on WhatsApp">💬</a>

      {/* ── Service detail modal ── */}
      {selectedSvc && (
        <div className="svc-modal-overlay" onClick={() => setSelectedSvc(null)}>
          <div className="svc-modal" style={{'--svc-accent': selectedSvc.accent}} onClick={e => e.stopPropagation()}>
            <button className="team-modal-close" onClick={() => setSelectedSvc(null)}>✕</button>
            <div className="svc-modal-photo" style={{background: selectedSvc.bg}}>
              <span className="svc-modal-icon">{selectedSvc.icon}</span>
            </div>
            <div className="svc-modal-body">
              <h2 className="svc-modal-title">{selectedSvc.title}</h2>
              <ul className="svc-modal-bullets">
                {selectedSvc.bullets.map(b => <li key={b}>{b}</li>)}
              </ul>
              <div className="svc-modal-cta">
                <a className="btn-primary" href={WA_LINK} target="_blank" rel="noopener noreferrer"
                  onClick={() => setSelectedSvc(null)}>💬 Get Quote for {selectedSvc.title}</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
