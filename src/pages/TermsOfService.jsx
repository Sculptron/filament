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
  em: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    display: 'block',
    marginTop: 40,
  },
};

export default function TermsOfService() {
  return (
    <div style={s.page}>
      <div style={s.inner}>
        <Link to="/" style={s.back}>← Back to Filament</Link>

        <h1 style={s.h1}>Terms of Service</h1>
        <p style={s.meta}>Last updated: March 13, 2026</p>

        <p style={s.p}>Welcome to Filament. By using this service, you agree to these Terms of Service. Please read them — they're written in plain English.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>1. Who We Are</h2>
        <p style={s.p}>Filament is an AI-powered film and TV discovery tool operated by <strong>Firoz Inc.</strong>, a company based in Canada. The service is available at <a href="https://watchfilament.com" style={s.a}>watchfilament.com</a>.</p>
        <p style={s.p}>When these terms say "Filament," "we," "us," or "our," we mean Firoz Inc.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>2. Accepting These Terms</h2>
        <p style={s.p}>By creating an account or using Filament in any way, you agree to these Terms of Service. If you don't agree, please don't use the service.</p>
        <p style={s.p}>We may update these terms from time to time. If we make significant changes, we'll let you know — either by email or by posting a notice on the site. Continued use of Filament after changes take effect means you accept the updated terms.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>3. The Service</h2>
        <p style={s.p}>Filament lets you discover films and TV shows through thematic connections. You can search a title or answer a short questionnaire, and Filament generates an interactive constellation of related works.</p>
        <p style={s.p}><strong>Free tier:</strong> Up to 3 searches per 24-hour period (tracked by IP address or account).</p>
        <p style={s.p}><strong>Pro tier:</strong> Unlimited searches. Available as a monthly subscription, annual subscription, or lifetime access (while seats are available).</p>
        <p style={s.p}>We reserve the right to adjust features, limits, and pricing over time. We'll give reasonable notice for any changes that materially affect your paid subscription.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>4. Your Account</h2>
        <p style={s.p}>To access certain features, you'll need to create an account using an email address and password, or by signing in with Google.</p>
        <p style={s.p}>You're responsible for:</p>
        <ul style={s.ul}>
          <li style={s.li}>Keeping your login credentials secure</li>
          <li style={s.li}>Any activity that happens under your account</li>
          <li style={s.li}>Making sure the information you provide is accurate</li>
        </ul>
        <p style={s.p}>If you think your account has been compromised, contact us immediately at <a href="mailto:watchfilament@gmail.com" style={s.a}>watchfilament@gmail.com</a>.</p>
        <p style={s.p}>You must be at least 13 years old to use Filament. If you're under 18, you should have a parent or guardian's permission.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>5. Payment and Subscriptions</h2>
        <p style={s.p}><strong>Subscriptions (Monthly and Annual)</strong></p>
        <p style={s.p}>Pro subscriptions are billed in advance on a recurring basis. By subscribing, you authorize us (via Stripe, our payment processor) to charge your payment method at the start of each billing period.</p>
        <p style={s.p}>You can cancel your subscription at any time. Cancellation takes effect at the end of the current billing period — you'll keep Pro access until then.</p>
        <p style={s.p}><strong>Lifetime Access</strong></p>
        <p style={s.p}>The Pro Lifetime tier is a one-time purchase granting permanent unlimited access. Lifetime seats are capped at 100 and are sold on a first-come, first-served basis. Once the cap is reached, this tier will be closed.</p>
        <p style={s.p}><strong>Refund Policy</strong></p>
        <ul style={s.ul}>
          <li style={s.li}><strong>Monthly subscriptions:</strong> No refunds once a billing period has started. You may cancel at any time to prevent future charges.</li>
          <li style={s.li}><strong>Annual subscriptions:</strong> If you cancel within 7 days of your initial purchase or renewal, we'll issue a full refund. After 7 days, no refund is issued, but your access continues until the end of the annual period.</li>
          <li style={s.li}><strong>Lifetime access:</strong> All sales are final. Refunds are not available for one-time lifetime purchases.</li>
        </ul>
        <p style={s.p}>If you believe you were charged in error, contact us at <a href="mailto:watchfilament@gmail.com" style={s.a}>watchfilament@gmail.com</a> and we'll sort it out.</p>
        <p style={s.p}><strong>Payment Processing</strong></p>
        <p style={s.p}>All payments are handled by Stripe. Filament never sees or stores your credit card information. Stripe's own terms and privacy policy apply to payment processing.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>6. Acceptable Use</h2>
        <p style={s.p}>Filament is for personal, non-commercial use. You agree not to:</p>
        <ul style={s.ul}>
          <li style={s.li}>Use automated tools, bots, or scrapers to access the service</li>
          <li style={s.li}>Attempt to circumvent rate limits or access controls</li>
          <li style={s.li}>Use the service in any way that could harm, disrupt, or overload our infrastructure</li>
          <li style={s.li}>Reverse engineer, copy, or redistribute the service or its underlying technology</li>
          <li style={s.li}>Use Filament for any unlawful purpose</li>
        </ul>
        <p style={s.p}>We reserve the right to suspend or terminate accounts that violate these rules.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>7. AI-Generated Content</h2>
        <p style={s.p}>Filament uses the Anthropic Claude API to generate thematic constellations. The results are AI-generated and are provided for discovery and entertainment purposes. We don't guarantee the accuracy, completeness, or fitness of any AI-generated content for any particular purpose.</p>
        <p style={s.p}><strong>Ownership of results:</strong> The constellation outputs generated during your session are made available to you for personal use. Firoz Inc. retains rights to the underlying system, prompts, and technology. You own any content you independently create based on your use of Filament.</p>
        <p style={s.p}>Shareable constellation links (e.g., <code style={{fontFamily:'monospace',fontSize:13,color:'rgba(255,255,255,0.6)'}}>/c/[id]</code>) are public by default. Anyone with the link can view that constellation.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>8. Our Intellectual Property</h2>
        <p style={s.p}>Everything that makes Filament work — the code, design, branding, visual identity, prompts, and methodology — belongs to Firoz Inc. Nothing in these terms grants you ownership of any of that.</p>
        <p style={s.p}>"Filament" and associated branding are the property of Firoz Inc. Please don't use them without our permission.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>9. Limitation of Liability</h2>
        <p style={s.p}>Filament is provided "as is." We make no warranties — express or implied — about the reliability, accuracy, or fitness of the service for any particular purpose.</p>
        <p style={s.p}>To the fullest extent permitted by law, Firoz Inc.'s liability for any claim arising from your use of Filament is limited to the amount you paid us in the 12 months preceding the claim. If you're on the free tier, that limit is $0.</p>
        <p style={s.p}>We are not liable for indirect, incidental, or consequential damages of any kind.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>10. Termination</h2>
        <p style={s.p}>You can close your account at any time by contacting us at <a href="mailto:watchfilament@gmail.com" style={s.a}>watchfilament@gmail.com</a>.</p>
        <p style={s.p}>We may suspend or terminate your account if you violate these terms, if we have reason to believe your use is harmful, or if we discontinue the service. If we terminate your paid account without cause, we'll issue a pro-rata refund for any unused paid period.</p>
        <p style={s.p}>If we shut down Filament entirely, we'll give at least 30 days' notice.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>11. Governing Law</h2>
        <p style={s.p}>These terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein. Any disputes will be resolved in the courts of Ontario, Canada.</p>

        <hr style={s.hr} />

        <h2 style={s.h2}>12. Contact</h2>
        <p style={s.p}>Questions about these terms? Reach out at:</p>
        <p style={s.p}><strong>Firoz Inc.</strong><br /><a href="mailto:watchfilament@gmail.com" style={s.a}>watchfilament@gmail.com</a></p>

        <em style={s.em}>These Terms of Service were last updated on March 13, 2026.</em>
      </div>
    </div>
  );
}
