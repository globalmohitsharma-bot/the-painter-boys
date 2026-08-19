import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';
import { PHONE, WA_LINK, PAGE_META, NAV_PAGES } from './siteConfig.js';

// Shared top bar + nav, used identically by Home.jsx and Blog.jsx so every
// page on the site (marketing pages and blog posts alike) has the same
// header, active-link highlighting, and mobile menu behavior.
export default function SiteHeader() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const currentPage = Object.keys(PAGE_META).find(k => PAGE_META[k].path === location.pathname) || 'home';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
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
              <div className="topbar-sub"><Icon name="star" size={10} style={{ marginRight: 3, verticalAlign: '-1px' }} />Trusted Since 2010</div>
            </div>
          </Link>
          <a className="topbar-phone" href={`tel:${PHONE}`}>
            <span className="tp-icon"><Icon name="phone" size={16} /></span>
            <span className="tp-num">+91 78388 88509</span>
          </a>
          <a className="topbar-cta" href={WA_LINK} target="_blank" rel="noopener noreferrer">BOOK FREE ESTIMATE</a>
          <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      <nav className={`nav${scrolled ? ' nav-scrolled' : ''}`} style={{ top: scrolled ? '50px' : '60px' }}>
        <div className="nav-inner">
          {NAV_PAGES.map(([id, label]) => (
            <Link key={id} to={PAGE_META[id].path} className={`nav-link${currentPage === id ? ' nav-link-active' : ''}`}>
              {label}
            </Link>
          ))}
          <a className="nav-portal" href="/pb"><Icon name="lock" size={13} style={{ marginRight: 5, verticalAlign: '-2px' }} />Staff Portal</a>
        </div>
      </nav>

      <div className={`mobile-overlay${menuOpen ? ' open' : ''}`}>
        <Link to="/" className="mo-link mo-home" onClick={() => setMenuOpen(false)}><Icon name="home" size={17} style={{ marginRight: 8, verticalAlign: '-3px' }} />Home</Link>
        {NAV_PAGES.map(([id, label]) => (
          <Link key={id} to={PAGE_META[id].path} className={`mo-link${currentPage === id ? ' mo-active' : ''}`}
            onClick={() => setMenuOpen(false)}>{label}</Link>
        ))}
        <a className="mo-link mo-portal" href="/pb" onClick={() => setMenuOpen(false)}><Icon name="lock" size={15} style={{ marginRight: 8, verticalAlign: '-2px' }} />Staff Portal</a>
        <a className="mo-link mo-wa" href={WA_LINK} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}><Icon name="whatsapp" size={17} style={{ marginRight: 8, verticalAlign: '-3px' }} />WhatsApp Us</a>
      </div>
    </header>
  );
}
