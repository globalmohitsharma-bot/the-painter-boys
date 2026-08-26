import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import LeadBot from './LeadBot.jsx';
import BottomNav from './BottomNav.jsx';
import { PHONE, WA_LINK_DEFAULT, PAGE_META, NAV_PAGES } from './siteConfig.js';

export default function SiteFooter() {
  return (
    <>
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
            <a className="footer-phone" href={`tel:${PHONE}`}><Icon name="phone" size={16} />+91 78388 88509</a>
            <a className="footer-wa-btn" href={WA_LINK_DEFAULT} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={15} />WhatsApp Us</a>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Our Services</div>
            <div className="footer-col-links">
              {['Interior Painting','Exterior Painting','Waterproofing','Royale Emulsion','Texture & Designer','Putty & Primer'].map(s => (
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
            <Link className="footer-link" to="/privacy">Privacy Policy</Link>
            <Link className="footer-link" to="/terms">Terms of Service</Link>
            <Link className="footer-link" to="/data-deletion">Data Deletion</Link>
            <a className="footer-link" href="/pb">Staff Portal</a>
          </div>
        </div>
      </div>
    </footer>

    <BottomNav />
    <LeadBot />
    </>
  );
}
