import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import SiteHeader from './SiteHeader.jsx';
import SiteFooter from './SiteFooter.jsx';
import { SITE_URL, PHONE, WA_LINK_DEFAULT } from './siteConfig.js';

// Shared wrapper for the legal/policy pages — same shell BlogPost.jsx uses,
// just with plain prose instead of the block-rendered blog content model
// (these are static, one-off documents, not a content collection).
function LegalPage({ title, path, children }) {
  return (
    <div className="home">
      <Helmet>
        <title>{title} | The Painter Boys</title>
        <meta name="robots" content="noindex" />
        <link rel="canonical" href={`${SITE_URL}${path}`} />
      </Helmet>
      <SiteHeader />
      <main className="page-fade">
        <div className="inner-page">
          <div className="page-hero page-hero-blue">
            <div className="ph-content">
              <h1 className="ph-title">{title}</h1>
            </div>
          </div>
          <div className="page-content-white">
            <div className="container section blog-post-body">
              {children}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" path="/privacy">
      <p><em>Last updated: 27 August 2026</em></p>

      <h2 className="blog-h2">What this covers</h2>
      <p>This policy explains what information The Painter Boys collects through our website, customer dashboard, admin portal, and Android app, and how it's used. "We", "us" and "The Painter Boys" refer to this business; "you" refers to anyone using these services.</p>

      <h2 className="blog-h2">Information we collect</h2>
      <p><strong>Account information:</strong> When you sign in with Google (on the customer dashboard, admin portal, or app), we receive your name, email address, and profile picture from Google. We don't see or store your Google password.</p>
      <p><strong>Project information:</strong> If you're a customer, we store details about your painting project — address, society/locality, paint type, project status, photos of the work, and payment records — so you can track progress on your dashboard.</p>
      <p><strong>Contact details:</strong> Phone number and address, collected when you request a quote or become a customer, used to coordinate the work and share updates.</p>

      <h2 className="blog-h2">How we use it</h2>
      <ul>
        <li>To run your customer dashboard — showing your active and past projects, photos, and payment history.</li>
        <li>To let our team (admins) manage projects, share updates, and respond to requests.</li>
        <li>To send project updates and links via WhatsApp, when you've provided a phone number for that purpose.</li>
      </ul>
      <p>We do not sell your information to third parties.</p>

      <h2 className="blog-h2">Where it's stored</h2>
      <p>Data is stored on Microsoft Azure (Cosmos DB and Blob Storage), in line with Azure's standard security practices. Sign-in is handled by Google — we never see your Google account password.</p>

      <h2 className="blog-h2">Your choices</h2>
      <p>You can sign out of the dashboard or app at any time. To request that your account and associated project data be deleted, see our <Link to="/data-deletion" className="blog-inline-link">Data Deletion</Link> page.</p>

      <h2 className="blog-h2">Contact us</h2>
      <p>Questions about this policy? Reach us at <a href={`tel:${PHONE}`} className="blog-inline-link">{PHONE}</a> or <a href={WA_LINK_DEFAULT} target="_blank" rel="noopener noreferrer" className="blog-inline-link">WhatsApp</a>.</p>
    </LegalPage>
  );
}

export function TermsOfService() {
  return (
    <LegalPage title="Terms of Service" path="/terms">
      <p><em>Last updated: 27 August 2026</em></p>

      <h2 className="blog-h2">Using our services</h2>
      <p>These terms apply to the thepainterboys.com website, customer dashboard, admin portal, and the ThePainterBoys Android app. By using any of these, you agree to these terms.</p>

      <h2 className="blog-h2">Accounts</h2>
      <p>Signing in uses Google Sign-In. You're responsible for keeping your Google account secure — anyone with access to it can access your dashboard.</p>

      <h2 className="blog-h2">Project information accuracy</h2>
      <p>Project status, photos, and payment records shown on the dashboard are entered and maintained by our team. If something looks incorrect, please contact us directly rather than relying solely on the app for financial records.</p>

      <h2 className="blog-h2">No warranty on the app/dashboard itself</h2>
      <p>The website, dashboard, and app are provided "as is" to help track your painting project — they are a convenience tool, not a substitute for your written quotation or invoice from The Painter Boys.</p>

      <h2 className="blog-h2">Changes</h2>
      <p>We may update these terms from time to time; continued use after a change means you accept the update.</p>

      <h2 className="blog-h2">Contact us</h2>
      <p>Questions? Reach us at <a href={`tel:${PHONE}`} className="blog-inline-link">{PHONE}</a> or <a href={WA_LINK_DEFAULT} target="_blank" rel="noopener noreferrer" className="blog-inline-link">WhatsApp</a>.</p>
    </LegalPage>
  );
}

export function DataDeletion() {
  return (
    <LegalPage title="Data Deletion" path="/data-deletion">
      <p>If you'd like your account and associated project data deleted from The Painter Boys' systems, you can request this at any time.</p>

      <h2 className="blog-h2">How to request deletion</h2>
      <p>Message us on <a href={WA_LINK_DEFAULT} target="_blank" rel="noopener noreferrer" className="blog-inline-link">WhatsApp</a> or call <a href={`tel:${PHONE}`} className="blog-inline-link">{PHONE}</a>, and let us know you'd like your account deleted. Please include the email address you signed in with.</p>

      <h2 className="blog-h2">What gets deleted</h2>
      <p>Your user account (name, email, sign-in link) and its connection to any project records. Project and payment history tied to a completed or in-progress job may be retained as our business record, with your personal account unlinked from it, unless you specifically request full removal.</p>

      <h2 className="blog-h2">Timeline</h2>
      <p>We'll confirm and process deletion requests within 7 business days.</p>
    </LegalPage>
  );
}
