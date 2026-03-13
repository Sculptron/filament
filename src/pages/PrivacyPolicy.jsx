import { Link } from 'react-router-dom';

const s = {
  page: {
    background: '#0a0a0f',
    minHeight: '100vh',
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 300,
  },
  inner: {
    maxWidth: 760,
    margin: '0 auto',
    padding: '48px 24px',
  },
  back: {
    display: 'inline-block',
    color: '#C77DFF',
    textDecoration: 'none',
    fontSize: 13,
    letterSpacing: 0.3,
    marginBottom: 40,
  },
  h1: {
    fontSize: 28,
    fontWeight: 300,
    color: '#fff',
    margin: '0 0 8px',
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    margin: '0 0 40px',
  },
  hr: {
    border: 'none',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    margin: '32px 0',
  },
  h2: {
    fontSize: 17,
    fontWeight: 400,
    color: '#fff',
    margin: '36px 0 12px',
    letterSpacing: 0.1,
  },
  h3: {
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.7)',
    margin: '20px 0 8px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  p: {
    fontSize: 15,
    lineHeight: 1.7,
    margin: '0 0 16px',
    color: 'rgba(255,255,255,0.8)',
  },
  ul: {
    fontSize: 15,
    lineHeight: 1.7,
    margin: '0 0 16px',
    paddingLeft: 24,
    color: 'rgba(255,255,255,0.8)',
  },
  li: {
    marginBottom: 6,
  },
  a: {
    color: '#C77DFF',
    textDecoration: 'none',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
    margin: '0 0 20px',
    color: 'rgba(255,255,255,0.75)',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 400,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    verticalAlign: 'top',
  },
  em: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    display: 'block',
    marginTop: 40,
  },
};

export default function PrivacyPolicy() {
  return (
    <div style={s.page}>
      <div style={s.inner}>
        <Link to="/" style={s.back}>← Back to Filament</Link>

        <h1 style={s.h1}>Privacy Policy</h1>
        <p style={s.meta}>Last updated: March 13, 2026</p>

        <p style={s.p}>Your privacy matters. This policy explains what data Filament collects, why we collect it, and how we handle it. We've written it in plain language — no legalese.</p>
        <p style={s.p}>Filament is operated by <strong>Firoz Inc.</strong>, based in Canada. This policy applies to the service at <a href="https://watchfilament.com" style={s.a}>watchfilament.com</a>.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>1. What Data We Collect</h2>

        <h3 style={s.h3}>If you create an account</h3>
        <p style={s.p}><strong>Email/password sign-up:</strong> Your email address and a hashed (encrypted) password.</p>
        <p style={s.p}><strong>Google sign-in:</strong> Your name, email address, and Google profile image, as shared by Google OAuth.</p>
        <p style={s.p}>We use this to identify you, manage your account, and communicate with you about the service.</p>

        <h3 style={s.h3}>When you use Filament</h3>
        <ul style={s.ul}>
          <li style={s.li}><strong>Search queries:</strong> The film titles you search and questionnaire answers you provide. These are sent to the Anthropic Claude API to generate your constellation.</li>
          <li style={s.li}><strong>IP address:</strong> Used to enforce the free-tier rate limit. We do not build profiles from IP addresses.</li>
          <li style={s.li}><strong>Constellation results:</strong> Your generated constellations are stored in our database with a unique shareable ID. Public share links are accessible to anyone with the URL.</li>
          <li style={s.li}><strong>Pro status:</strong> A simple flag indicating whether you have an active Pro subscription.</li>
        </ul>

        <h3 style={s.h3}>Payment information</h3>
        <p style={s.p}>Payments are processed by Stripe. Filament <strong>never sees or stores your credit card number</strong> or other payment card data. Stripe handles all of that. We only store the outcome: whether your account has Pro access.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>2. Why We Collect It</h2>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Data</th>
              <th style={s.th}>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={s.td}>Email / account credentials</td><td style={s.td}>Authentication and account management</td></tr>
            <tr><td style={s.td}>Google profile data</td><td style={s.td}>OAuth sign-in</td></tr>
            <tr><td style={s.td}>Search queries</td><td style={s.td}>Generating your constellation via the AI</td></tr>
            <tr><td style={s.td}>IP address</td><td style={s.td}>Rate limiting (free tier enforcement)</td></tr>
            <tr><td style={s.td}>Constellation results</td><td style={s.td}>Storing and sharing your constellations</td></tr>
            <tr><td style={s.td}>Pro status flag</td><td style={s.td}>Granting or restricting access to Pro features</td></tr>
          </tbody>
        </table>
        <p style={s.p}>We do not sell your data. We do not use your data for advertising. We do not build behavioural profiles.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>3. Third-Party Services</h2>
        <p style={s.p}><strong>Supabase</strong> — Our database and authentication infrastructure. Your account data and constellation results are stored on Supabase servers (hosted in the US and/or EU). Supabase's privacy policy applies to data stored on their platform.</p>
        <p style={s.p}><strong>Stripe</strong> — Our payment processor. When you purchase a subscription or lifetime access, your payment information is handled directly by Stripe. We share only what's necessary to initiate the transaction. Stripe's privacy policy applies.</p>
        <p style={s.p}><strong>Anthropic (Claude API)</strong> — Your search queries and questionnaire answers are sent to Anthropic's API to generate constellations. Anthropic's data handling practices apply to this data. We do not send your name, email, or account information to Anthropic — only your search input.</p>
        <p style={s.p}><strong>Vercel</strong> — Our hosting provider. Vercel may process request metadata (including IP addresses) as part of serving the site. Vercel's privacy policy applies.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>4. Cookies</h2>
        <p style={s.p}>Filament uses session cookies to keep you logged in. These are strictly necessary for the service to function.</p>
        <p style={s.p}>We do <strong>not</strong> use:</p>
        <ul style={s.ul}>
          <li style={s.li}>Advertising cookies</li>
          <li style={s.li}>Third-party tracking cookies</li>
          <li style={s.li}>Analytics cookies that identify you personally</li>
        </ul>
        <p style={s.p}>You can clear cookies via your browser settings, but doing so will log you out.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>5. Data Retention</h2>
        <ul style={s.ul}>
          <li style={s.li}><strong>Account data:</strong> Retained for as long as your account is active. If you delete your account, we will delete your personal data within 30 days.</li>
          <li style={s.li}><strong>Constellations:</strong> Stored indefinitely while your account is active and for a reasonable period after deletion. If you want a specific constellation deleted, contact us.</li>
          <li style={s.li}><strong>IP rate limit data:</strong> Cleared automatically after 24 hours.</li>
          <li style={s.li}><strong>Payment records:</strong> Stripe retains transaction records per their own retention policy. We retain your Pro status flag for as long as your account exists.</li>
        </ul>

        <hr style={s.hr} />

        <h2 style={s.h2}>6. Your Rights</h2>
        <p style={s.p}>Regardless of where you're located, you can:</p>
        <ul style={s.ul}>
          <li style={s.li}><strong>Access</strong> the personal data we hold about you</li>
          <li style={s.li}><strong>Correct</strong> inaccurate information</li>
          <li style={s.li}><strong>Request deletion</strong> of your account and associated data</li>
          <li style={s.li}><strong>Ask what third parties</strong> have received your data</li>
        </ul>
        <p style={s.p}>To exercise any of these rights, email us at <a href="mailto:watchfilament@gmail.com" style={s.a}>watchfilament@gmail.com</a>. We'll respond within 30 days.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>7. PIPEDA (Canadian Privacy Law)</h2>
        <p style={s.p}>Filament is operated from Canada and complies with the <strong>Personal Information Protection and Electronic Documents Act (PIPEDA)</strong>. Under PIPEDA:</p>
        <ul style={s.ul}>
          <li style={s.li}>We only collect data that is necessary for identified purposes</li>
          <li style={s.li}>We obtain consent by your use of the service (implied consent for standard operations; express consent for anything additional)</li>
          <li style={s.li}>You have the right to access and correct your personal information</li>
          <li style={s.li}>You can withdraw consent by closing your account</li>
        </ul>
        <p style={s.p}>For questions or complaints under PIPEDA, contact us at <a href="mailto:watchfilament@gmail.com" style={s.a}>watchfilament@gmail.com</a>. If you're not satisfied with our response, you may contact the <strong>Office of the Privacy Commissioner of Canada</strong> at <a href="https://priv.gc.ca" style={s.a} target="_blank" rel="noopener noreferrer">priv.gc.ca</a>.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>8. GDPR (For Users in the European Union)</h2>
        <p style={s.p}>If you're accessing Filament from the EU or EEA, you have additional rights under the <strong>General Data Protection Regulation (GDPR)</strong>:</p>
        <ul style={s.ul}>
          <li style={s.li}><strong>Right to erasure</strong> ("right to be forgotten")</li>
          <li style={s.li}><strong>Right to data portability</strong></li>
          <li style={s.li}><strong>Right to object</strong> to processing</li>
          <li style={s.li}><strong>Right to restrict processing</strong></li>
          <li style={s.li}><strong>Right to lodge a complaint</strong> with your local supervisory authority</li>
        </ul>
        <p style={s.p}>Our legal basis for processing your data is <strong>contract performance</strong> (we need it to provide the service you signed up for) and <strong>legitimate interests</strong> (rate limiting, security, abuse prevention).</p>
        <p style={s.p}>We do not rely on your data for automated decision-making or profiling.</p>
        <p style={s.p}>To exercise GDPR rights, contact <a href="mailto:watchfilament@gmail.com" style={s.a}>watchfilament@gmail.com</a>.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>9. Data Security</h2>
        <p style={s.p}>We take reasonable measures to protect your data:</p>
        <ul style={s.ul}>
          <li style={s.li}>Passwords are hashed and never stored in plain text</li>
          <li style={s.li}>Data is transmitted over HTTPS</li>
          <li style={s.li}>Access to production systems is restricted</li>
          <li style={s.li}>We rely on Supabase's security infrastructure, which includes encryption at rest</li>
        </ul>
        <p style={s.p}>No system is perfectly secure. If we become aware of a data breach that affects you, we will notify you as required by law.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>10. Children's Privacy</h2>
        <p style={s.p}>Filament is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such data, contact us at <a href="mailto:watchfilament@gmail.com" style={s.a}>watchfilament@gmail.com</a> and we will delete it promptly.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>11. Changes to This Policy</h2>
        <p style={s.p}>We may update this Privacy Policy from time to time. We'll post the updated version here with a new "Last updated" date. For significant changes, we'll notify you by email or via a notice on the site.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>12. Contact</h2>
        <p style={s.p}>Questions, requests, or concerns about your privacy:</p>
        <p style={s.p}><strong>Firoz Inc.</strong><br /><a href="mailto:watchfilament@gmail.com" style={s.a}>watchfilament@gmail.com</a></p>

        <em style={s.em}>This Privacy Policy was last updated on March 13, 2026.</em>
      </div>
    </div>
  );
}
