import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SiteHeader from './SiteHeader.jsx';
import SiteFooter from './SiteFooter.jsx';
import Icon from './Icon.jsx';
import { SITE_URL, WA_LINK_DEFAULT } from './siteConfig.js';
import { CARPENTRY_MATERIALS } from './siteData.js';
import './Home.css';
import './Blog.css';

export default function CarpentryMaterialDetail() {
  const { slug } = useParams();
  const material = CARPENTRY_MATERIALS.find(m => m.slug === slug);

  if (!material) {
    return (
      <div className="home">
        <SiteHeader />
        <main className="page-fade">
          <div className="inner-page">
            <div className="page-content-white">
              <div className="container section" style={{ textAlign: 'center' }}>
                <h1>Material not found</h1>
                <Link to="/carpentry-materials" className="btn-primary">← Back to Carpentry Materials</Link>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const title = `${material.name} — Carpentry Material Guide | The Painter Boys`;

  return (
    <div className="home">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={material.desc.slice(0, 155)} />
        <link rel="canonical" href={`${SITE_URL}/carpentry-materials/${material.slug}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={material.desc.slice(0, 155)} />
        <meta property="og:url" content={`${SITE_URL}/carpentry-materials/${material.slug}`} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: material.name,
          description: material.desc,
          brand: { '@type': 'Brand', name: material.name.split(' ')[0] },
        })}</script>
      </Helmet>
      <SiteHeader />
      <main className="page-fade">
        <div className="inner-page">
          <div className="page-hero page-hero-blue">
            <div className="ph-content">
              <Link to="/carpentry-materials" className="blog-back-link">← All Carpentry Materials</Link>
              <span className="sec-tag light" style={{ marginTop: 14 }}>Material Guide</span>
              <h1 className="ph-title">{material.name}</h1>
              <p className="ph-sub">{material.grade}</p>
            </div>
          </div>
          <div className="page-content-white">
            <div className="container section">
              <article className="paint-card paint-detail-card">
                <div className="paint-card-top">
                  <h2 className="paint-name">{material.name}</h2>
                  <span className={`paint-tier paint-tier-${material.tier.toLowerCase()}`}>{material.tier}</span>
                </div>
                <div className="paint-finish">{material.grade}</div>
                <p className="paint-desc">{material.desc}</p>
                <div className="paint-facts">
                  <div className="paint-fact"><span className="paint-fact-label">Rating</span><span className="paint-fact-val">{material.badgeLabel}</span></div>
                  <div className="paint-fact"><span className="paint-fact-label">Best for</span><span className="paint-fact-val">{material.bestFor}</span></div>
                </div>
              </article>
              {material.longRead && (
                <article className="paint-longread">
                  {material.longRead.map((section, i) => (
                    <section key={i} className="paint-longread-section">
                      <h2 className="paint-longread-heading">{section.heading}</h2>
                      {section.paragraphs.map((para, j) => <p key={j} className="svc-detail-text">{para}</p>)}
                    </section>
                  ))}
                </article>
              )}
              <div className="sec-cta">
                <a className="btn-primary" href={WA_LINK_DEFAULT} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={17} />Ask About {material.name}
                </a>
                <Link to="/services/carpentry-woodwork" className="btn-secondary">← Carpentry & Woodwork Service</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
