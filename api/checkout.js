import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  : null;

// Price IDs from Vercel env vars — set these in Vercel Dashboard
const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual:  process.env.STRIPE_PRICE_ANNUAL,
  lifetime: process.env.STRIPE_PRICE_LIFETIME,
};

const APP_URL = 'https://watchfilament.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('checkout: missing STRIPE_SECRET_KEY');
    return res.status(500).json({ error: 'Payments not configured' });
  }

  const { plan } = req.body;
  if (!['monthly', 'annual', 'lifetime'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    console.error(`checkout: missing STRIPE_PRICE_${plan.toUpperCase()} env var`);
    return res.status(500).json({ error: 'Plan not configured' });
  }

  // Extract user from Authorization header (optional but needed for webhook→Pro activation)
  let userId = null;
  let userEmail = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ') && supabaseAdmin) {
    const token = authHeader.slice(7);
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
        userEmail = user.email || null;
      }
    } catch {
      // Invalid token — proceed as anonymous (Stripe still works, but webhook can't set is_pro)
    }
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const mode = plan === 'lifetime' ? 'payment' : 'subscription';

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/?checkout=success`,
      cancel_url: `${APP_URL}/`,
      client_reference_id: userId || undefined,
      customer_email: (!userId && userEmail) ? userEmail : undefined,
      ...(userId && userEmail ? { customer_email: userEmail } : {}),
    });

    console.log(`checkout: created ${plan} session for user ${userId || 'anonymous'}`);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('checkout: Stripe error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
