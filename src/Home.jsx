import { useState, useEffect } from 'react';
import './Home.css';

const PHONE   = '+91 7838888509';
const WA_LINK = 'https://wa.me/917838888509';
const AREAS   = ['Ghaziabad', 'Noida', 'Delhi NCR', 'Haridwar', 'Dehradun'];

const SERVICES_PHOTO = [
  { bg: 'linear-gradient(135deg,#fff3e0,#ffe082,#ff8a65)', icon: '🏠', title: 'Interior Painting',
    bullets: ['Premium emulsion, distemper & luxury finishes', 'Full furniture protection — zero mess guaranteed'] },
  { bg: 'linear-gradient(135deg,#e3f2fd,#90caf9,#1565c0)', icon: '🏗️', title: 'Exterior Painting',
    bullets: ['Weather-resistant & UV-protective coatings', 'Surface prep, crack filling & primer included'] },
  { bg: 'linear-gradient(135deg,#e8f5e9,#a5d6a7,#2e7d32)', icon: '💧', title: 'Waterproofing',
    bullets: ['Eliminate seepage, dampness & wall leakages', 'Scientific solutions with quality materials'] },
  { bg: 'linear-gradient(135deg,#fff8e1,#ffe082,#ff6f00)', icon: '👑', title: 'Royal Emulsion',
    bullets: ['Smooth, washable, lasting premium finish', 'Asian Paints Royal — stays vibrant for years'] },
  { bg: 'linear-gradient(135deg,#fce4ec,#f48fb1,#ad1457)', icon: '✨', title: 'Texture & Designer',
    bullets: ['Unique 3D textures and designer wall finishes', 'Custom patterns for a premium luxury look'] },
  { bg: 'linear-gradient(135deg,#efebe9,#d7ccc8,#8d6e63)', icon: '🔲', title: 'Putty & Primer',
    bullets: ['Crack filling and professional wall levelling', 'Perfect surface prep for a flawless paint job'] },
];

const WHY = [
  { icon: '👷', label: 'Trained Professionals' },
  { icon: '🔍', label: 'Technical Site Evaluation' },
  { icon: '🎨', label: 'Personalised Colour Consultation' },
  { icon: '🦺', label: 'Stringent Safety Protocol' },
  { icon: '👁️', label: 'Supervised Painting' },
  { icon: '⚙️', label: 'Mechanized Tools' },
];

const TEAM = [
  { name: 'Rajeev Kumar',    role: 'Director — Delivery & Operations', img: null,                initials: 'RK', color: '#f97316',
    bio: 'With 10+ years leading painting and quality work, Rajeev heads customer relationships and operations across Delhi NCR.' },
  { name: 'Sonia Gupta',     role: 'Marketing & Digital Growth',        img: '/images/sonia.webp', initials: 'SG', color: '#8b5cf6',
    bio: 'With 12+ years of marketing leadership, Sonia drives The Painter Boys\' digital transformation and customer experience.' },
  { name: 'Dr. Susheel Rai', role: 'Head of Operations',                img: '/images/susheel.jpg',initials: 'SR', color: '#0ea5e9',
    bio: 'Overseeing operations with decades of leadership experience — his caring philosophy defines The Painter Boys\' service culture.' },
];

const COLORS = {
  Reds:          [{ name:'Tomato Bliss',hex:'#e53935'},{name:'Cherry Dream',hex:'#e57373'},{name:'Crimson Silk',hex:'#c62828'},{name:'Coral Glow',hex:'#ef9a9a'},{name:'Rose Petal',hex:'#f48fb1'},{name:'Berry Rush',hex:'#ad1457'},{name:'Blush Pink',hex:'#fce4ec'},{name:'Flamingo',hex:'#ff80ab'},{name:'Passion Red',hex:'#b71c1c'},{name:'Pink Aroma',hex:'#f8bbd0'}],
  Oranges:       [{ name:'Sunset Blaze',hex:'#ff7043'},{name:'Mango Splash',hex:'#ffa000'},{name:'Saffron Gold',hex:'#ff8f00'},{name:'Peach Parfait',hex:'#ffccbc'},{name:'Burnt Sienna',hex:'#bf360c'},{name:'Amber Haze',hex:'#ff6f00'},{name:'Papaya Cream',hex:'#ffb74d'},{name:'Tangerine Pop',hex:'#ff8a65'},{name:'Apricot Bliss',hex:'#ffab40'},{name:'Marigold',hex:'#ff6d00'}],
  Yellows:       [{ name:'Lemon Fizz',hex:'#f9a825'},{name:'Banana Cream',hex:'#fff9c4'},{name:'Golden Hour',hex:'#f57f17'},{name:'Sunshine Burst',hex:'#ffee58'},{name:'Cream Delight',hex:'#fff8e1'},{name:'Butter Toffee',hex:'#ffe57f'},{name:'Canary Soft',hex:'#fff176'},{name:'Saffron Mist',hex:'#ffe082'},{name:'Goldenrod',hex:'#ffc107'},{name:'Corn Silk',hex:'#fffde7'}],
  Greens:        [{ name:'Sage Garden',hex:'#81c784'},{name:'Forest Fern',hex:'#2e7d32'},{name:'Mint Fresh',hex:'#b2dfdb'},{name:'Emerald Isle',hex:'#1b5e20'},{name:'Olive Grove',hex:'#558b2f'},{name:'Lime Splash',hex:'#c5e1a5'},{name:'Teal Mist',hex:'#4db6ac'},{name:'Sea Glass',hex:'#80cbc4'},{name:'Fern Green',hex:'#43a047'},{name:'Pistachio',hex:'#dcedc8'}],
  Blues:         [{ name:'Sky Whisper',hex:'#b3e5fc'},{name:'Ocean Deep',hex:'#0277bd'},{name:'Navy Anchor',hex:'#0d47a1'},{name:'Cobalt Dream',hex:'#1565c0'},{name:'Powder Blue',hex:'#e1f5fe'},{name:'Cornflower',hex:'#64b5f6'},{name:'Aqua Mist',hex:'#80deea'},{name:'Denim Wash',hex:'#1976d2'},{name:'Periwinkle',hex:'#90caf9'},{name:'Steel Blue',hex:'#455a64'}],
  Violets:       [{ name:'Lavender Mist',hex:'#e1bee7'},{name:'Purple Haze',hex:'#7b1fa2'},{name:'Lilac Field',hex:'#ce93d8'},{name:'Plum Rich',hex:'#4a148c'},{name:'Grape Crush',hex:'#6a1b9a'},{name:'Mauve Elegance',hex:'#ab47bc'},{name:'Orchid',hex:'#ba68c8'},{name:'Wisteria',hex:'#9c27b0'},{name:'Soft Iris',hex:'#f3e5f5'},{name:'Amethyst',hex:'#8e24aa'}],
  'Earth Tones': [{ name:'Sandy Beige',hex:'#d7ccc8'},{name:'Walnut Brown',hex:'#5d4037'},{name:'Terracotta',hex:'#bf360c'},{name:'Desert Sand',hex:'#ffe0b2'},{name:'Clay Pot',hex:'#8d6e63'},{name:'Warm Mocha',hex:'#6d4c41'},{name:'Hazelnut',hex:'#a1887f'},{name:'Coffee Bean',hex:'#4e342e'},{name:'Almond Silk',hex:'#efebe9'},{name:'Copper Dust',hex:'#bf6c25'}],
  Neutrals:      [{ name:'Pristine White',hex:'#fafafa'},{name:'Warm Ivory',hex:'#fffff0'},{name:'Cream Canvas',hex:'#fffde7'},{name:'Misty Gray',hex:'#9e9e9e'},{name:'Silver Lining',hex:'#e0e0e0'},{name:'Cloud Nine',hex:'#f5f5f5'},{name:'Oyster White',hex:'#f0ede4'},{name:'Linen Soft',hex:'#fdf6ec'},{name:'Pale Ash',hex:'#d0d0d0'},{name:'Dove Gray',hex:'#bdbdbd'}],
  'Dark Accents':[{ name:'Midnight Black',hex:'#212121'},{name:'Charcoal Storm',hex:'#424242'},{name:'Dark Forest',hex:'#1b5e20'},{name:'Deep Navy',hex:'#0d47a1'},{name:'Espresso',hex:'#3e2723'},{name:'Graphite',hex:'#546e7a'},{name:'Iron Gate',hex:'#37474f'},{name:'Onyx Black',hex:'#1a1a1a'},{name:'Slate Dark',hex:'#455a64'},{name:'Obsidian',hex:'#263238'}],
};
const COLOR_TABS = Object.keys(COLORS);

const REASONS = [
  { title: 'Precision & Craftsmanship',        desc: 'From surface prep to the final coat, every brushstroke is flawless — ensuring a stunning, lasting finish on houses, flats, villas and more.' },
  { title: 'Skilled & Experienced Team',        desc: 'With 10+ years serving homes, housing societies, hospitals, offices and temples — our painters bring expertise to every type of project.' },
  { title: 'Hassle-Free, On-Time Service',      desc: 'Clear communication, punctual arrival, and professional execution. We make the entire process smooth and completely stress-free.' },
  { title: 'Free On-Site Estimates',            desc: 'Know the full cost upfront with our free, no-obligation site inspection. Honest pricing — no hidden charges, ever.' },
  { title: 'Premium Paints & Materials Only',   desc: 'We use only Asian Paints, Berger, and top-grade materials. Premium products that look beautiful and last for years.' },
  { title: 'All Property Types Covered',        desc: 'Houses, flats, villas, societies, hospitals, offices, temples — our expert teams are fully equipped for every scale and type of project.' },
];

const NAV_LINKS = [['about','About'],['services','Services'],['colors','Colours'],['howitworks','How It Works'],['team','Team'],['contact','Contact']];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled,  setScrolled]  = useState(false);
  const [activeTab, setActiveTab] = useState('Reds');
  const [form, setForm] = useState({ name:'', phone:'', area:'Ghaziabad', msg:'' });

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const go = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 112;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = `Hi! I'd like a free estimate.\nName: ${form.name}\nPhone: ${form.phone}\nArea: ${form.area}${form.msg ? '\nMessage: '+form.msg : ''}`;
    window.open(`${WA_LINK}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="home">

      {/* ── Top Bar (CertaPro style) ── */}
      <div className={`topbar${scrolled ? ' topbar-sm' : ''}`}>
        <div className="topbar-inner">
          <div className="topbar-brand">
            <div className="pb-badge-nav">PB</div>
            <span className="topbar-name">The Painter Boys</span>
          </div>
          <a className="topbar-phone" href={`tel:${PHONE}`}>📞 +91 78388 88509</a>
          <a className="topbar-cta" href={WA_LINK} target="_blank" rel="noopener noreferrer">BOOK FREE ESTIMATE</a>
          <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* ── Nav Bar (desktop) ── */}
      <nav className={`nav${scrolled ? ' nav-scrolled' : ''}`} style={{ top: scrolled ? '50px' : '60px' }}>
        <div className="nav-inner">
          {NAV_LINKS.map(([id, label]) => (
            <button key={id} className="nav-link" onClick={() => go(id)}>{label}</button>
          ))}
          <a className="nav-portal" href="/pb">🔐 Staff Portal</a>
        </div>
      </nav>

      {/* ── Mobile overlay menu ── */}
      <div className={`mobile-overlay${menuOpen ? ' open' : ''}`}>
        {NAV_LINKS.map(([id, label]) => (
          <button key={id} className="mo-link" onClick={() => go(id)}>{label}</button>
        ))}
        <a className="mo-link mo-portal" href="/pb" onClick={() => setMenuOpen(false)}>🔐 Staff Portal</a>
        <a className="mo-link mo-wa" href={WA_LINK} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>💬 WhatsApp Us</a>
      </div>

      {/* ── Hero ── */}
      <section id="hero" className="hero">
        <div className="hero-bg-pattern" />
        <div className="hero-content">
          <div className="hero-badge">⭐ Trusted Since 2010 · 10+ Years of Excellence</div>
          <h1 className="hero-title">
            Paint Your Home<br /><span className="hero-accent">The Smart Way</span>
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
        </div>

        {/* Lead capture form */}
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

      {/* ── Trust banner ── */}
      <div className="trust-banner">
        <span className="tb-text">Service You Can Trust!</span>
        <span className="tb-sub">Let us know how we can help you today.</span>
        <a className="tb-btn" href={WA_LINK} target="_blank" rel="noopener noreferrer">💬 Schedule Free Estimate</a>
      </div>

      {/* ── Feature strip ── */}
      <div className="feature-strip">
        {[{icon:'🔍',label:'On-Site Consultation'},{icon:'🛡️',label:'Furniture Protection'},{icon:'👑',label:'Premium Products'},{icon:'👷',label:'Certified Painters'},{icon:'✅',label:'Post-Painting Clean-up'}]
          .map(f => (
            <div key={f.label} className="fi">
              <span className="fi-icon">{f.icon}</span>
              <span className="fi-label">{f.label}</span>
            </div>
          ))}
      </div>

      {/* ── Services ── */}
      <section id="services" className="section">
        <div className="container">
          <div className="sec-head">
            <span className="sec-tag">What We Do</span>
            <h2 className="sec-title">Our Painting Services</h2>
            <p className="sec-sub">Premium products. Expert hands. Guaranteed results.</p>
          </div>
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
          </div>
        </div>
      </section>

      {/* ── Colour Catalog ── */}
      <section id="colors" className="color-sec">
        <div className="container">
          <div className="sec-head">
            <span className="sec-tag">Colour Palette</span>
            <h2 className="sec-title">Explore Our Colours</h2>
            <p className="sec-sub">2500+ shades to transform your space. Our experts help you choose the perfect one.</p>
          </div>
          <div className="color-tabs">
            {COLOR_TABS.map(tab => (
              <button key={tab} className={`ctab${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}>{tab}</button>
            ))}
          </div>
          <div className="color-grid">
            {COLORS[activeTab].map(c => (
              <div key={c.name} className="cswatch">
                <div className="cs-rect" style={{ background: c.hex }} />
                <div className="cs-name">{c.name}</div>
              </div>
            ))}
          </div>
          <div className="sec-cta">
            <a className="btn-primary" href={WA_LINK} target="_blank" rel="noopener noreferrer">🎨 Get Colour Consultation</a>
          </div>
        </div>
      </section>

      {/* ── Why Us ── */}
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
                <div className="why-circle"><div className="why-icon">{w.icon}</div></div>
                <div className="why-label">{w.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Great Reasons ── */}
      <section className="reasons-sec">
        <div className="container">
          <div className="reasons-intro">
            <span className="sec-tag">Why The Painter Boys</span>
            <h2 className="sec-title">Great Reasons to Choose The Painter Boys</h2>
            <p>They say "Finding good help is hard to do!" — we're on a mission to prove them wrong. When you choose The Painter Boys for your house, flat, villa, society, hospital or commercial property, you hire the best in the business. Serving clients across Delhi NCR since 2010.</p>
          </div>
          <div className="reasons-body">
            <div className="reasons-grid">
              {REASONS.map(r => (
                <div key={r.title} className="reason-card">
                  <div className="rc-star">⭐</div>
                  <div>
                    <div className="rc-title">{r.title}</div>
                    <div className="rc-desc">{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="reasons-photo">
              <img src="/images/mascot.png" alt="The Painter Boys" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'20px'}}
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
              <div className="rp-fallback" style={{display:'none'}}>
                <div className="rp-fallback-icon">🎨</div>
                <div className="rp-fallback-text">The Painter Boys<br/>Home Painting Professionals<br/>Delhi NCR Since 2010</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="howitworks" className="section section-alt">
        <div className="container">
          <div className="sec-head">
            <span className="sec-tag">Process</span>
            <h2 className="sec-title">How It Works</h2>
            <p className="sec-sub">Simple, transparent, and stress-free — from first call to final walkthrough.</p>
          </div>
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
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="section">
        <div className="container">
          <div className="sec-head">
            <span className="sec-tag">About Us</span>
            <h2 className="sec-title">More Than Just Painters</h2>
          </div>
          <div className="about-grid">
            <div className="about-card"><div className="about-icon">🤝</div><h3>Our Promise</h3><p>We won't leave until you are fully satisfied. Every customer walks the job with our crew leader and signs a quality assurance form before we leave.</p></div>
            <div className="about-card"><div className="about-icon">🏠</div><h3>Zero Mess Guarantee</h3><p>Before we start, we cover floors, move furniture, fill cracks, and repair caulking. Paint goes only on your wall — no splatters. Ever.</p></div>
            <div className="about-card"><div className="about-icon">🏆</div><h3>Proven Reputation</h3><p>Over a decade of trusted painting work across Delhi NCR — built on customer satisfaction, premium products, and never cutting corners.</p></div>
          </div>
          <div className="notice-box">
            <span className="notice-icon">⚠️</span>
            <div><strong>Important Notice</strong><p>We do not have any other branches or representatives. To receive legitimate service, call only the numbers listed on this portal.</p></div>
          </div>
        </div>
      </section>

      {/* ── Team ── */}
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
                {t.img && <img src={t.img} alt={t.name} className="team-photo" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />}
                <div className="team-avatar" style={{ background: t.color, display: t.img ? 'none' : 'flex' }}>{t.initials}</div>
                <h3 className="team-name">{t.name}</h3>
                <div className="team-role">{t.role}</div>
                <p className="team-bio">{t.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="contact-sec">
        <div className="container">
          <div className="sec-head light">
            <span className="sec-tag light">Contact Us</span>
            <h2 className="sec-title light">Let's Transform Your Space</h2>
            <p className="sec-sub light">Reach out for a free quote — we're always happy to help.</p>
          </div>
          <div className="contact-body">
            <div className="contact-mascot">
              <img src="/images/mascot-studio.png" alt="The Painter Boys Mascot"
                onError={e => {
                  e.target.style.display='none';
                  e.target.nextSibling.style.display='flex';
                }} />
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
                  <div><div className="cc-label">We Serve</div><div className="cc-val">Ghaziabad · Noida · Delhi<br />Haridwar · Dehradun</div></div>
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
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand"><div className="pb-badge-footer">PB</div><span>The Painter Boys</span></div>
          <div className="footer-tag">Do it right, Do it once.</div>
          <div className="footer-copy">© The Painter Boys · Ghaziabad · Noida · Delhi · Haridwar · Dehradun</div>
        </div>
      </footer>

      <a className="wa-fab" href={WA_LINK} target="_blank" rel="noopener noreferrer" title="Chat on WhatsApp">💬</a>
    </div>
  );
}
