import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SiteHeader from './SiteHeader.jsx';
import SiteFooter from './SiteFooter.jsx';
import Icon from './Icon.jsx';
import { SITE_URL, WA_LINK_DEFAULT } from './siteConfig.js';
import { SERVICES } from './siteData.js';
import './Home.css';
import './Blog.css';

export default function ServiceDetail() {
  const { slug } = useParams();
  const service = SERVICES.find(s => s.slug === slug);

  if (!service) {
    return (
      <div className="home">
        <SiteHeader />
        <main className="page-fade">
          <div className="inner-page">
            <div className="page-content-white">
              <div className="container section" style={{ textAlign: 'center' }}>
                <h1>Service not found</h1>
                <Link to="/services" className="btn-primary">← Back to Services</Link>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const title = `${service.title} — The Painter Boys`;
  const description = service.detail[0].slice(0, 155);

  return (
    <div className="home">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${SITE_URL}/services/${service.slug}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${SITE_URL}/services/${service.slug}`} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: service.title,
          description,
          provider: { '@type': 'LocalBusiness', name: 'The Painter Boys', url: SITE_URL, telephone: '+917838888509' },
          areaServed: ['Ghaziabad', 'Noida', 'Delhi NCR', 'Haridwar', 'Dehradun'],
        })}</script>
      </Helmet>
      <SiteHeader />
      <main className="page-fade">
        <div className="inner-page">
          <div className="page-hero page-hero-blue">
            <div className="ph-content">
              <Link to="/services" className="blog-back-link">← All Services</Link>
              <span className="sec-tag light" style={{ marginTop: 14 }}>What We Do</span>
              <h1 className="ph-title">{service.title}</h1>
              <p className="ph-sub">{service.bullets.join(' · ')}</p>
            </div>
          </div>
          <div className="page-content-white">
            <div className="container section svc-detail-grid">
              <aside className="svc-detail-media">
                <div className="svc-detail-photo" style={{ background: service.bg }}>
                  <Icon name={service.icon} size={56} style={{ color: '#fffdf8' }} />
                </div>
                <ul className="svc-modal-bullets">
                  {service.bullets.map(b => <li key={b}>{b}</li>)}
                </ul>
                <a className="btn-primary svc-detail-cta" href={WA_LINK_DEFAULT} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={17} />Get a Quote for {service.title}
                </a>
              </aside>
              <div className="svc-detail-main">
                {service.detail.map((para, i) => <p key={i} className="svc-detail-text">{para}</p>)}
                <div className="sec-cta" style={{ justifyContent: 'flex-start' }}>
                  <Link to="/services" className="btn-secondary">← All Services</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
