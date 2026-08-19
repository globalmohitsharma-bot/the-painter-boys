import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SiteHeader from './SiteHeader.jsx';
import SiteFooter from './SiteFooter.jsx';
import Icon from './Icon.jsx';
import { SITE_URL, WA_LINK } from './siteConfig.js';
import { PAINT_TYPES } from './siteData.js';
import './Home.css';
import './Blog.css';

export default function PaintDetail() {
  const { slug } = useParams();
  const paint = PAINT_TYPES.find(p => p.slug === slug);

  if (!paint) {
    return (
      <div className="home">
        <SiteHeader />
        <main className="page-fade">
          <div className="inner-page">
            <div className="page-content-white">
              <div className="container section" style={{ textAlign: 'center' }}>
                <h1>Paint type not found</h1>
                <Link to="/paint-types" className="btn-primary">← Back to Paint Types</Link>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const title = `${paint.name} — Paint Guide | The Painter Boys`;

  return (
    <div className="home">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={paint.desc.slice(0, 155)} />
        <link rel="canonical" href={`${SITE_URL}/paint-types/${paint.slug}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={paint.desc.slice(0, 155)} />
        <meta property="og:type" content="website" />
      </Helmet>
      <SiteHeader />
      <main className="page-fade">
        <div className="inner-page">
          <div className="page-hero page-hero-blue">
            <div className="ph-content">
              <Link to="/paint-types" className="blog-back-link">← All Paint Types</Link>
              <span className="sec-tag light" style={{ marginTop: 14 }}>Paint Guide</span>
              <h1 className="ph-title">{paint.name}</h1>
              <p className="ph-sub">{paint.finish}</p>
            </div>
          </div>
          <div className="page-content-white">
            <div className="container section">
              <article className="paint-card paint-detail-card">
                <div className="paint-card-top">
                  <h2 className="paint-name">{paint.name}</h2>
                  <span className={`paint-tier paint-tier-${paint.tier.toLowerCase()}`}>{paint.tier}</span>
                </div>
                <div className="paint-finish">{paint.finish}</div>
                <p className="paint-desc">{paint.desc}</p>
              </article>
              <div className="sec-cta">
                <a className="btn-primary" href={WA_LINK} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={17} />Ask About {paint.name}
                </a>
                <Link to="/paint-types" className="btn-secondary">← All Paint Types</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
