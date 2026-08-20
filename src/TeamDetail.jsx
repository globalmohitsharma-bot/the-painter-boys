import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SiteHeader from './SiteHeader.jsx';
import SiteFooter from './SiteFooter.jsx';
import Icon from './Icon.jsx';
import { SITE_URL, WA_LINK_DEFAULT } from './siteConfig.js';
import { TEAM } from './siteData.js';
import './Home.css';
import './Blog.css';

export default function TeamDetail() {
  const { slug } = useParams();
  const member = TEAM.find(t => t.slug === slug);

  if (!member) {
    return (
      <div className="home">
        <SiteHeader />
        <main className="page-fade">
          <div className="inner-page">
            <div className="page-content-white">
              <div className="container section" style={{ textAlign: 'center' }}>
                <h1>Team member not found</h1>
                <Link to="/team" className="btn-primary">← Back to Our Team</Link>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const title = `${member.name} — ${member.role} | The Painter Boys`;

  return (
    <div className="home">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={member.bio.slice(0, 155)} />
        <link rel="canonical" href={`${SITE_URL}/team/${member.slug}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={member.bio.slice(0, 155)} />
        <meta property="og:url" content={`${SITE_URL}/team/${member.slug}`} />
        <meta property="og:type" content="profile" />
      </Helmet>
      <SiteHeader />
      <main className="page-fade">
        <div className="inner-page">
          <div className="page-hero page-hero-dark">
            <div className="ph-content">
              <Link to="/team" className="blog-back-link">← Our Team</Link>
            </div>
          </div>
          <div className="page-content-white">
            <div className="container section team-detail-body">
              {member.img
                ? <img src={member.img} alt={`${member.name}, ${member.role} at The Painter Boys`} className="team-modal-photo"
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                : null}
              <div className="team-modal-avatar" style={{ background: member.color, display: member.img ? 'none' : 'flex' }}>
                {member.initials}
              </div>
              <h1 className="team-modal-name">{member.name}</h1>
              <div className="team-modal-role">{member.role}</div>
              <p className="team-modal-bio">{member.bio}</p>
              <div className="sec-cta">
                <a className="btn-primary" href={WA_LINK_DEFAULT} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={17} />Get in Touch
                </a>
                <Link to="/team" className="btn-secondary">← All Team Members</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
