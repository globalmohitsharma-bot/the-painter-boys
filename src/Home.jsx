import { useState, useEffect } from 'react';
import './Home.css';

const PHONE     = '+91 7838888509';
const WA_LINK   = 'https://wa.me/917838888509';
const AREAS     = ['Ghaziabad', 'Noida', 'Delhi NCR', 'Haridwar', 'Dehradun'];

const SERVICES = [
  { icon: '👑', title: 'Royal Emulsion',    desc: 'Smooth, washable, long-lasting finish. Premium interior walls that stay fresh for years.' },
  { icon: '✨', title: 'Royal Shyne',        desc: 'High-gloss luxury finish with deep sheen — perfect for feature walls and premium spaces.' },
  { icon: '🏠', title: 'Interior Painting', desc: 'Full room protection, furniture moved, floors covered — paint goes only on your walls.' },
  { icon: '🏗️', title: 'Exterior Painting', desc: 'Weather-resistant coatings that protect and beautify your building through every season.' },
  { icon: '🔲', title: 'Putty & Primer',    desc: 'Crack filling, wall levelling, and quality primer — the perfect base for a flawless finish.' },
  { icon: '🎨', title: 'Tractor Emulsion',  desc: 'Durable, affordable emulsion for large surfaces. Excellent coverage with smooth results.' },
  { icon: '🖌️', title: 'Distemper',         desc: 'Cost-effective, clean coating for walls and ceilings. Fresh look at a great price.' },
  { icon: '💧', title: 'Waterproofing',     desc: 'Protect walls from seepage and dampness with professional waterproofing solutions.' },
];

const WHY = [
  { icon: '👷', label: 'Trained Professional',          desc: 'Our painters are professionally trained with years of hands-on experience in every type of painting work.' },
  { icon: '🔍', label: 'Technical Site Evaluation',     desc: 'We conduct a thorough on-site inspection before starting — surface condition, prep needs, and material planning.' },
  { icon: '🎨', label: 'Personalised Colour Consultation', desc: 'Our experts help you choose the perfect colours and finishes to match your vision, style, and lighting.' },
  { icon: '🦺', label: 'Stringent Safety Protocol',    desc: 'We follow strict safety standards to protect your home, furniture, and our team throughout every job.' },
  { icon: '👁️', label: 'Supervised Painting',          desc: 'Every project is supervised by an experienced crew leader — quality checked at every single step.' },
  { icon: '⚙️', label: 'Mechanized Tools',             desc: 'We use modern professional equipment for a smoother, faster, and more precise finish every time.' },
];

const TEAM = [
  {
    name:    'Rajeev Kumar',
    role:    'Director — Delivery & Operations',
    img:     null,
    initials:'RK',
    color:   '#f97316',
    bio:     'With 10+ years leading painting and quality work, Rajeev heads customer relationships and operations. A passionate artist whose craftsmanship made lasting impressions across Delhi NCR.',
  },
  {
    name:    'Sonia Gupta',
    role:    'Marketing & Digital Growth',
    img:     '/images/sonia.webp',
    initials:'SG',
    color:   '#8b5cf6',
    bio:     'With 12+ years of marketing leadership, Sonia drives The Painter Boys\' digital transformation. Former consultant for Fortune 500 companies, now helping homeowners achieve their dream spaces.',
  },
  {
    name:    'Dr. Susheel Rai',
    role:    'Head of Operations',
    img:     '/images/susheel.jpg',
    initials:'SR',
    color:   '#0ea5e9',
    bio:     'Overseeing operations with decades of leadership experience. His philosophy — caring for people and putting their needs first — defines The Painter Boys\' service culture.',
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled,  setScrolled]  = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const go = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div className="home">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className={`nav${scrolled ? ' nav-scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-brand" onClick={() => go('hero')}>
            <img src="/images/logo.png" alt="The Painter Boys" className="nav-logo-img" />
            <span className="nav-name">The Painter Boys</span>
          </div>
          <div className={`nav-links${menuOpen ? ' open' : ''}`}>
            {[['about','About'],['services','Services'],['howitworks','How It Works'],['team','Team'],['contact','Contact']].map(([id,label]) => (
              <button key={id} className="nav-link" onClick={() => go(id)}>{label}</button>
            ))}
            <a className="nav-portal" href="/pb">🔐 Staff Portal</a>
            <a className="nav-cta" href={`tel:${PHONE}`}>📞 Corporate: 7838888509</a>
          </div>
          <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section id="hero" className="hero">
        <div className="hero-bg-pattern" />
        <div className="hero-content">
          <div className="hero-badge">⭐ Trusted Since 2010 · 10+ Years of Excellence</div>
          <h1 className="hero-title">
            Transform Your Space<br />
            <span className="hero-accent">With Expert Painters</span>
          </h1>
          <p className="hero-cities">Ghaziabad · Noida · Delhi · Haridwar · Dehradun</p>
          <p className="hero-desc">
            Premium paints. Expert hands. Zero mess. Quality guaranteed on every single job — we don't leave until you're fully satisfied.
          </p>
          <div className="hero-btns">
            <a className="btn-primary" href={WA_LINK} target="_blank" rel="noopener noreferrer">
              💬 Get Free Quote on WhatsApp
            </a>
            <button className="btn-outline" onClick={() => go('services')}>Our Services ↓</button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><strong>500+</strong><span>Homes Painted</span></div>
            <div className="hero-stat-sep" />
            <div className="hero-stat"><strong>10+</strong><span>Years Experience</span></div>
            <div className="hero-stat-sep" />
            <div className="hero-stat"><strong>5</strong><span>Cities Covered</span></div>
          </div>
        </div>
        <div className="hero-mascot">
          <img src="/images/logo.png" alt="The Painter Boys mascot" className="mascot-img" />
        </div>
      </section>

      {/* ── Areas strip ────────────────────────────────────────── */}
      <div className="areas-strip">
        <span className="areas-label">📍 We serve:</span>
        {AREAS.map(a => <span key={a} className="area-chip">{a}</span>)}
      </div>

      {/* ── Services ───────────────────────────────────────────── */}
      <section id="services" className="section">
        <div className="container">
          <div className="sec-head">
            <span className="sec-tag">What We Do</span>
            <h2 className="sec-title">Our Painting Services</h2>
            <p className="sec-sub">Premium paints. Expert application. Guaranteed results.</p>
          </div>
          <div className="services-grid">
            {SERVICES.map(s => (
              <div key={s.title} className="svc-card">
                <div className="svc-icon">{s.icon}</div>
                <h3 className="svc-title">{s.title}</h3>
                <p className="svc-desc">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="sec-cta">
            <a className="btn-primary" href={WA_LINK} target="_blank" rel="noopener noreferrer">
              💬 Discuss Your Project
            </a>
          </div>
        </div>
      </section>

      {/* ── Why Us ─────────────────────────────────────────────── */}
      <section className="why-sec">
        <div className="container">
          <div className="sec-head">
            <span className="sec-tag">Why Choose Us</span>
            <h2 className="sec-title">The Painter Boys Difference</h2>
            <p className="sec-sub">Professional standards you can see and feel — on every job, every time.</p>
          </div>
          <div className="why-grid">
            {WHY.map(w => (
              <div key={w.label} className="why-card">
                <div className="why-circle">
                  <div className="why-icon">{w.icon}</div>
                </div>
                <div className="why-label">{w.label}</div>
                <p className="why-desc">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section id="howitworks" className="section section-alt">
        <div className="container">
          <div className="sec-head">
            <span className="sec-tag">Process</span>
            <h2 className="sec-title">How It Works</h2>
            <p className="sec-sub">Simple, transparent, and stress-free — from first call to final walkthrough.</p>
          </div>
          <div className="how-grid">
            {[
              { n:'01', icon:'📅', title:'Schedule an Appointment',      desc:'Fill a quick form or WhatsApp us. Our team will call you to book a convenient time for a site visit.' },
              { n:'02', icon:'🔍', title:'Product & Site Consultation',   desc:'Our associate visits your home, answers all questions, and provides a full product and site consultation.' },
              { n:'03', icon:'🎨', title:'Colour Selection',              desc:'Choose from our curated palette of premium colours. Our expert helps you finalise the perfect shades for every room.' },
              { n:'04', icon:'🛡️', title:'Work Preparation',             desc:'We cover floors and furniture with protective plastic, then begin the painting process with zero disruption.' },
              { n:'05', icon:'⚙️', title:'Site Execution',               desc:'Using a structured project management framework, we ensure high-quality, on-time execution of every room.' },
              { n:'06', icon:'🏠', title:'Handover & Walkthrough',        desc:'Post-painting clean-up done. We walk you through everything and share tips for keeping your walls beautiful.' },
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
            <a className="btn-primary" href={WA_LINK} target="_blank" rel="noopener noreferrer">
              💬 Book Your Free Consultation
            </a>
          </div>
        </div>
      </section>

      {/* ── About ──────────────────────────────────────────────── */}
      <section id="about" className="section">
        <div className="container">
          <div className="sec-head">
            <span className="sec-tag">About Us</span>
            <h2 className="sec-title">More Than Just Painters</h2>
          </div>
          <div className="about-grid">
            <div className="about-card">
              <div className="about-icon">🤝</div>
              <h3>Our Promise</h3>
              <p>We won't leave until you are fully satisfied. Every customer walks the job with our crew leader and signs a quality assurance form before we leave.</p>
            </div>
            <div className="about-card">
              <div className="about-icon">🏠</div>
              <h3>Zero Mess Guarantee</h3>
              <p>Before we start, we cover floors, move furniture, fill cracks, and repair caulking. Paint goes only on your wall — no splatters on floors or furniture. Ever.</p>
            </div>
            <div className="about-card">
              <div className="about-icon">🏆</div>
              <h3>Proven Reputation</h3>
              <p>Over a decade of trusted painting work across Delhi NCR — built on customer satisfaction, premium products, and never cutting corners.</p>
            </div>
          </div>
          <div className="notice-box">
            <span className="notice-icon">⚠️</span>
            <div>
              <strong>Important Notice</strong>
              <p>We do not have any other branches or representatives. To receive legitimate service, call only the numbers listed on this portal. Your trust is our priority.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ───────────────────────────────────────────────── */}
      <section id="team" className="section section-alt">
        <div className="container">
          <div className="sec-head">
            <span className="sec-tag">Our Team</span>
            <h2 className="sec-title">Meet the Visionaries</h2>
            <p className="sec-sub">The people who make every job exceptional.</p>
          </div>
          <div className="team-grid">
            {TEAM.map(t => (
              <div key={t.name} className="team-card">
                {t.img
                  ? <img src={t.img} alt={t.name} className="team-photo" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                  : null
                }
                <div className="team-avatar" style={{ background: t.color, display: t.img ? 'none' : 'flex' }}>{t.initials}</div>
                <h3 className="team-name">{t.name}</h3>
                <div className="team-role">{t.role}</div>
                <p className="team-bio">{t.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────────────────── */}
      <section id="contact" className="contact-sec">
        <div className="container">
          <div className="sec-head light">
            <span className="sec-tag light">Contact Us</span>
            <h2 className="sec-title light">Let's Transform Your Space</h2>
            <p className="sec-sub light">Reach out for a free quote — we're always happy to help.</p>
          </div>
          <div className="contact-cards">
            <a className="contact-card" href={`tel:${PHONE}`}>
              <div className="cc-icon">📞</div>
              <div className="cc-label">Call Us</div>
              <div className="cc-val">{PHONE}</div>
            </a>
            <a className="contact-card wa" href={WA_LINK} target="_blank" rel="noopener noreferrer">
              <div className="cc-icon">💬</div>
              <div className="cc-label">WhatsApp</div>
              <div className="cc-val">Chat instantly</div>
            </a>
            <div className="contact-card">
              <div className="cc-icon">📍</div>
              <div className="cc-label">We Serve</div>
              <div className="cc-val">Ghaziabad · Noida · Delhi<br />Haridwar · Dehradun</div>
            </div>
          </div>
          <div className="contact-cta">
            <a className="btn-primary btn-lg" href={WA_LINK} target="_blank" rel="noopener noreferrer">
              💬 Get Free Quote on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/images/logo.png" alt="" className="footer-logo" />
            <span>The Painter Boys</span>
          </div>
          <div className="footer-tag">Do it right, Do it once.</div>
          <div className="footer-copy">© The Painter Boys · Ghaziabad · Noida · Delhi · Haridwar · Dehradun</div>
        </div>
      </footer>

      {/* ── WhatsApp floating button ────────────────────────────── */}
      <a className="wa-fab" href={WA_LINK} target="_blank" rel="noopener noreferrer" title="Chat on WhatsApp">💬</a>

    </div>
  );
}
