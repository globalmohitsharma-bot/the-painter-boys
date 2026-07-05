import { useState, useEffect } from 'react';
import './Home.css';

const PHONE   = '+91 7838888509';
const WA_LINK = 'https://wa.me/917838888509';
const AREAS   = ['Ghaziabad', 'Noida', 'Delhi NCR', 'Haridwar', 'Dehradun'];

const SERVICES_PHOTO = [
  { bg:'linear-gradient(135deg,#fff3e0,#ffe082,#ff8a65)', icon:'🏠', title:'Interior Painting',    bullets:['Premium emulsion, distemper & luxury finishes','Full furniture protection — zero mess guaranteed'] },
  { bg:'linear-gradient(135deg,#e3f2fd,#90caf9,#1565c0)', icon:'🏗️', title:'Exterior Painting',   bullets:['Weather-resistant & UV-protective coatings','Surface prep, crack filling & primer included'] },
  { bg:'linear-gradient(135deg,#e8f5e9,#a5d6a7,#2e7d32)', icon:'💧', title:'Waterproofing',        bullets:['Eliminate seepage, dampness & wall leakages','Scientific solutions with quality materials'] },
  { bg:'linear-gradient(135deg,#fff8e1,#ffe082,#ff6f00)', icon:'👑', title:'Royal Emulsion',        bullets:['Smooth, washable, lasting premium finish','Asian Paints Royal — stays vibrant for years'] },
  { bg:'linear-gradient(135deg,#fce4ec,#f48fb1,#ad1457)', icon:'✨', title:'Texture & Designer',   bullets:['Unique 3D textures and designer wall finishes','Custom patterns for a premium luxury look'] },
  { bg:'linear-gradient(135deg,#efebe9,#d7ccc8,#8d6e63)', icon:'🔲', title:'Putty & Primer',        bullets:['Crack filling and professional wall levelling','Perfect surface prep for a flawless paint job'] },
];

const WHY = [
  { icon:'👷', label:'Trained Professionals' },
  { icon:'🔍', label:'Technical Site Evaluation' },
  { icon:'🎨', label:'Personalised Colour Consultation' },
  { icon:'🦺', label:'Stringent Safety Protocol' },
  { icon:'👁️', label:'Supervised Painting' },
  { icon:'⚙️', label:'Mechanized Tools' },
];

const REASONS = [
  { title:'Precision & Craftsmanship',        desc:'From surface prep to the final coat, every brushstroke is flawless — ensuring a stunning, lasting finish on houses, flats, villas and more.' },
  { title:'Skilled & Experienced Team',        desc:'With 10+ years serving homes, housing societies, hospitals, offices and temples — our painters bring expertise to every type of project.' },
  { title:'Hassle-Free, On-Time Service',      desc:'Clear communication, punctual arrival, and professional execution. We make the entire process smooth and completely stress-free.' },
  { title:'Free On-Site Estimates',            desc:'Know the full cost upfront with our free, no-obligation site inspection. Honest pricing — no hidden charges, ever.' },
  { title:'Premium Paints & Materials Only',   desc:'We use only Asian Paints, Berger, and top-grade materials. Premium products that look beautiful and last for years.' },
  { title:'All Property Types Covered',        desc:'Houses, flats, villas, societies, hospitals, offices, temples — our expert teams are fully equipped for every scale and type of project.' },
];

const TEAM = [
  { name:'Rajeev Kumar',    role:'Director — Delivery & Operations', img:null,                initials:'RK', color:'#f97316',
    bio:'With 10+ years leading painting and quality work, Rajeev heads customer relationships and operations. A passionate artist whose craftsmanship has made lasting impressions across Delhi NCR.' },
  { name:'Sonia Gupta',     role:'Marketing & Digital Growth',        img:'/images/sonia.webp', initials:'SG', color:'#8b5cf6',
    bio:'With 12+ years of marketing leadership, Sonia drives The Painter Boys\' digital transformation. Former consultant for Fortune 500 companies, now helping homeowners achieve their dream spaces.' },
  { name:'Dr. Susheel Rai', role:'Head of Operations',                img:'/images/susheel.jpg',initials:'SR', color:'#0ea5e9',
    bio:'Overseeing operations with decades of leadership experience. His philosophy — caring for people and putting their needs first — defines The Painter Boys\' service culture throughout.' },
];

const NAV_PAGES = [
  ['services',  'Services'],
  ['about',     'About Us'],
  ['how',       'How It Works'],
  ['team',      'Our Team'],
  ['contact',   'Contact'],
];

export default function Home() {
  const [menuOpen,        setMenuOpen]        = useState(false);
  const [scrolled,        setScrolled]        = useState(false);
  const [currentPage,     setCurrentPage]     = useState('home');
  const [selectedMember,  setSelectedMember]  = useState(null);
  const [form,            setForm]            = useState({ name:'', phone:'', area:'Ghaziabad', msg:'' });

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const navigate = (page) => {
    setCurrentPage(page);
    setMenuOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = `Hi! I'd like a free estimate.\nName: ${form.name}\nPhone: ${form.phone}\nArea: ${form.area}${form.msg ? '\nMessage: '+form.msg : ''}`;
    window.open(`${WA_LINK}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="home">

      {/* ── Topbar ── */}
      <div className={`topbar${scrolled ? ' topbar-sm' : ''}`}>
        <div className="topbar-inner">
          <div className="topbar-brand" onClick={() => navigate('home')} style={{cursor:'pointer'}}>
            <div className="pb-badge-nav">PB</div>
            <span className="topbar-name">
              <span className="tn-the">The </span>
              <span className="tn-p">P</span><span className="tn-a">a</span><span className="tn-i">i</span><span className="tn-n">n</span><span className="tn-t">t</span><span className="tn-e">e</span><span className="tn-r">r</span>
              <span className="tn-sp"> </span>
              <span className="tn-b">B</span><span className="tn-o">o</span><span className="tn-y">y</span><span className="tn-s">s</span>
            </span>
          </div>
          <a className="topbar-phone" href={`tel:${PHONE}`}>📞 +91 78388 88509</a>
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
            <button key={id}
              className={`nav-link${currentPage === id ? ' nav-link-active' : ''}`}
              onClick={() => navigate(id)}>
              {label}
            </button>
          ))}
          <a className="nav-portal" href="/pb">🔐 Staff Portal</a>
        </div>
      </nav>

      {/* ── Mobile overlay ── */}
      <div className={`mobile-overlay${menuOpen ? ' open' : ''}`}>
        <button className="mo-link mo-home" onClick={() => navigate('home')}>🏠 Home</button>
        {NAV_PAGES.map(([id, label]) => (
          <button key={id} className={`mo-link${currentPage === id ? ' mo-active' : ''}`} onClick={() => navigate(id)}>{label}</button>
        ))}
        <a className="mo-link mo-portal" href="/pb" onClick={() => setMenuOpen(false)}>🔐 Staff Portal</a>
        <a className="mo-link mo-wa" href={WA_LINK} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>💬 WhatsApp Us</a>
      </div>

      {/* ══════════════════════════════════════════════
          PAGE CONTENT — key triggers fade on change
      ══════════════════════════════════════════════ */}
      <div key={currentPage} className="page-fade">

        {/* ── HOME ── */}
        {currentPage === 'home' && (
          <>
            <section className="hero">
              <div className="hero-bg-pattern" />
              <div className="hero-content">
                <div className="hero-badge">⭐ Trusted Since 2010 · 10+ Years of Excellence</div>
                <h1 className="hero-title">
                  Home Painting Professionals<br />
                  <span className="hero-accent">With Decades of Experience</span>
                </h1>
                <p className="hero-cities">Ghaziabad · Noida · Delhi · Haridwar · Dehradun</p>
                <p className="hero-desc">
                  Get expert painting with colour advice, advanced tools and a hassle-free experience from start to finish.
                </p>
                <div className="hero-stats">
                  <div className="hero-stat"><strong>500+</strong><span>Homes Painted</span></div>
                  <div className="hero-stat-sep" />
                  <div className="hero-stat"><strong>10+</strong><span>Years Experience</span></div>
                  <div className="hero-stat-sep" />
                  <div className="hero-stat"><strong>5</strong><span>Cities Covered</span></div>
                </div>
                <div className="hero-home-btns">
                  <button className="btn-primary" onClick={() => navigate('services')}>Our Services →</button>
                  <a className="btn-outline" href={WA_LINK} target="_blank" rel="noopener noreferrer">💬 WhatsApp Us</a>
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
                  <button type="submit" className="hfc-submit">Submit →</button>
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
                {[
                  {icon:'🏠',label:'Interior Painting',    sub:'Homes, Flats & Villas'},
                  {icon:'🏗️',label:'Exterior Painting',   sub:'Buildings & Societies'},
                  {icon:'💧',label:'Waterproofing',        sub:'Leakage & Dampness'},
                  {icon:'👑',label:'Premium Finishes',     sub:'Royal & Luxury Paints'},
                  {icon:'🏢',label:'Commercial Spaces',    sub:'Offices & Hospitals'},
                  {icon:'🕌',label:'Temples & Institutions',sub:'All Property Types'},
                ].map(c => (
                  <div key={c.label} className="hqn-card" onClick={() => navigate('services')}>
                    <div className="hqn-icon">{c.icon}</div>
                    <div className="hqn-label">{c.label}</div>
                    <div className="hqn-sub">{c.sub}</div>
                  </div>
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
                <h1 className="ph-title">Our Painting Services</h1>
                <p className="ph-sub">Premium products. Expert hands. Guaranteed results across all property types.</p>
              </div>
            </div>
            <div className="container section">
              <div className="svc-grid">
                {SERVICES_PHOTO.map(s => (
                  <div key={s.title} className="svc-card">
                    <div className="svc-photo" style={{ background: s.bg }}>
                      <div className="svc-photo-icon">{s.icon}</div>
                    </div>
                    <div className="svc-body">
                      <h3 className="svc-title">{s.title}</h3>
                      <ul className="svc-bullets">
                        {s.bullets.map(b => <li key={b}>{b}</li>)}
                      </ul>
                      <div className="svc-badge">{s.icon}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="sec-cta">
                <a className="btn-primary" href={WA_LINK} target="_blank" rel="noopener noreferrer">💬 Discuss Your Project</a>
                <button className="btn-outline-dark" onClick={() => navigate('contact')}>Get Free Quote →</button>
              </div>

              {/* Why Us circles */}
              <div className="sec-head" style={{marginTop:72}}>
                <span className="sec-tag">Why Choose Us</span>
                <h2 className="sec-title">The Painter Boys Difference</h2>
                <p className="sec-sub">Professional standards you can see and feel — on every job, every time.</p>
              </div>
              <div className="why-grid">
                {WHY.map(w => (
                  <div key={w.label} className="why-card">
                    <div className="why-circle"><div className="why-icon">{w.icon}</div></div>
                    <div className="why-label">{w.label}</div>
                  </div>
                ))}
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

            {/* Great Reasons */}
            <div style={{background:'#f8fafc', padding:'72px 24px'}}>
              <div className="container">
                <div className="reasons-intro">
                  <span className="sec-tag">Why The Painter Boys</span>
                  <h2 className="sec-title">Great Reasons to Choose The Painter Boys</h2>
                  <p>They say "Finding good help is hard to do!" — we're on a mission to prove them wrong. When you choose The Painter Boys for your house, flat, villa, society, hospital or commercial property, you hire the best in the business.</p>
                </div>
                <div className="reasons-body">
                  <div className="reasons-grid">
                    {REASONS.map(r => (
                      <div key={r.title} className="reason-card">
                        <div className="rc-star">⭐</div>
                        <div><div className="rc-title">{r.title}</div><div className="rc-desc">{r.desc}</div></div>
                      </div>
                    ))}
                  </div>
                  <div className="reasons-photo">
                    <div className="rp-img-crop">
                      <img src="/images/painter-boy.png" alt="Expert Painter" className="rp-img"
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
            <div className="container section">
              <div className="how-grid">
                {[
                  {n:'01',icon:'📅',title:'Schedule an Appointment',    desc:'Fill a quick form or WhatsApp us. Our team books a convenient time for a site visit.'},
                  {n:'02',icon:'🔍',title:'Product & Site Consultation', desc:'Our associate visits your home, answers all questions, and provides a full consultation.'},
                  {n:'03',icon:'🎨',title:'Colour Selection',            desc:'Choose from our curated palette. Our expert helps you finalise the perfect shades.'},
                  {n:'04',icon:'🛡️',title:'Work Preparation',           desc:'We cover floors and furniture, then begin the painting process with zero disruption.'},
                  {n:'05',icon:'⚙️',title:'Site Execution',             desc:'Using a structured project management framework, we ensure high-quality, on-time execution.'},
                  {n:'06',icon:'🏠',title:'Handover & Walkthrough',      desc:'Post-painting clean-up done. We walk you through and share tips for keeping walls beautiful.'},
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
                <button className="btn-outline-dark" onClick={() => navigate('contact')}>Contact Us →</button>
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
            <div className="container section">
              <div className="team-grid">
                {TEAM.map(t => (
                  <div key={t.name} className="team-card" onClick={() => setSelectedMember(t)}>
                    {t.img && <img src={t.img} alt={t.name} className="team-photo"
                      onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />}
                    <div className="team-avatar" style={{ background: t.color, display: t.img ? 'none' : 'flex' }}>{t.initials}</div>
                    <h3 className="team-name">{t.name}</h3>
                    <div className="team-role">{t.role}</div>
                    <p className="team-bio">{t.bio}</p>
                    <div className="team-click-hint">Tap to know more →</div>
                  </div>
                ))}
              </div>
            </div>

            {selectedMember && (
              <div className="team-modal-overlay" onClick={() => setSelectedMember(null)}>
                <div className="team-modal" onClick={e => e.stopPropagation()}>
                  <button className="team-modal-close" onClick={() => setSelectedMember(null)}>✕</button>
                  {selectedMember.img
                    ? <img src={selectedMember.img} alt={selectedMember.name} className="team-modal-photo"
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

        {/* ── CONTACT ── */}
        {currentPage === 'contact' && (
          <div className="inner-page">
            <div className="page-hero page-hero-blue">
              <div className="ph-content">
                <span className="sec-tag light">Contact Us</span>
                <h1 className="ph-title">Let's Transform Your Space</h1>
                <p className="ph-sub">Reach out for a free quote — we're always happy to help.</p>
              </div>
            </div>
            <div className="contact-sec">
              <div className="container">
                <div className="contact-body">
                  <div className="contact-mascot">
                    <img src="/images/mascot.png" alt="The Painter Boys"
                      onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                    <div className="mascot-fallback" style={{display:'none'}}>
                      <div className="mascot-fallback-icon">🎨</div>
                      <div style={{color:'#fff',fontWeight:800,fontSize:'1.1rem'}}>The Painter Boys</div>
                    </div>
                    <div className="mascot-tagline">Home Painting Professionals<br/>Ghaziabad · Noida · Delhi · Haridwar · Dehradun</div>
                  </div>
                  <div className="contact-right">
                    <div className="contact-cards">
                      <a className="contact-card" href={`tel:${PHONE}`}>
                        <div className="cc-icon">📞</div>
                        <div><div className="cc-label">Call Us</div><div className="cc-val">{PHONE}</div></div>
                      </a>
                      <a className="contact-card wa" href={WA_LINK} target="_blank" rel="noopener noreferrer">
                        <div className="cc-icon">💬</div>
                        <div><div className="cc-label">WhatsApp</div><div className="cc-val">Chat with us instantly</div></div>
                      </a>
                      <div className="contact-card">
                        <div className="cc-icon">📍</div>
                        <div><div className="cc-label">We Serve</div><div className="cc-val">Ghaziabad · Noida · Delhi<br/>Haridwar · Dehradun</div></div>
                      </div>
                      <div className="contact-card">
                        <div className="cc-icon">🏗️</div>
                        <div><div className="cc-label">We Paint</div><div className="cc-val">Houses · Flats · Villas · Societies<br/>Hospitals · Offices · Temples</div></div>
                      </div>
                    </div>
                    <div className="contact-cta">
                      <a className="btn-primary btn-lg" href={WA_LINK} target="_blank" rel="noopener noreferrer">💬 Get Free Quote on WhatsApp</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>{/* end page-fade */}

      {/* ── Footer (always visible) ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-nav">
            <span className="footer-brand-text" onClick={() => navigate('home')}>
              <div className="pb-badge-footer">PB</div> The Painter Boys
            </span>
            <div className="footer-links">
              {NAV_PAGES.map(([id,label]) => (
                <button key={id} className="footer-link" onClick={() => navigate(id)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="footer-tag">Do it right, Do it once.</div>
          <div className="footer-copy">© The Painter Boys · Ghaziabad · Noida · Delhi · Haridwar · Dehradun</div>
        </div>
      </footer>

      <a className="wa-fab" href={WA_LINK} target="_blank" rel="noopener noreferrer" title="Chat on WhatsApp">💬</a>
    </div>
  );
}
