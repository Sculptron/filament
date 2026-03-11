import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  : null;

// Read raw body from stream for Stripe signature verification.
// If Vercel has already consumed the stream (body already parsed), this returns
// an empty buffer and we fall back to event retrieval via the Stripe API.
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('webhook: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
    return res.status(500).end();
  }

  if (!supabaseAdmin) {
    console.error('webhook: missing Supabase env vars');
    return res.status(500).end();
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    const rawBody = await getRawBody(req);

    if (rawBody.length > 0) {
      // Stream was readable — verify signature (preferred, most secure)
      if (!sig) {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
      }
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      // Body already parsed by Vercel runtime — retrieve event from Stripe API instead.
      // This is safe: we authenticate via STRIPE_SECRET_KEY, so the event data is trustworthy.
      const eventId = req.body?.id;
      if (!eventId || typeof eventId !== 'string' || !eventId.startsWith('evt_')) {
        console.error('webhook: body already parsed and no valid event ID found');
        return res.status(400).json({ error: 'Could not process webhook' });
      }
      event = await stripe.events.retrieve(eventId);
    }
  } catch (err) {
    console.error('webhook: failed to construct/retrieve event:', err.message);
    return res.status(400).json({ error: err.message });
  }

  console.log('webhook: received event', event.type, event.id);

  // ============================================================
  // Handle checkout.session.completed → activate Pro
  // ============================================================
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;

    if (!userId) {
      // Guest checkout (no Supabase user linked) — log and acknowledge
      console.warn('webhook: checkout.session.completed with no client_reference_id — guest purchase, Pro not activated');
      return res.status(200).json({ received: true });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ is_pro: true })
      .eq('id', userId);

    if (error) {
      console.error('webhook: failed to activate Pro for', userId, error);
      return res.status(500).end();
    }

    console.log('webhook: Pro activated for user', userId, '| plan session', session.id);
  }

  // ============================================================
  // Handle customer.subscription.deleted → revoke Pro (cancellation)
  // ============================================================
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    // Find the user by Stripe customer ID
    const customerId = subscription.customer;
    if (customerId) {
      // Look up the Stripe customer to get their email, then match to Supabase user
      // For now: log this event — full revocation logic can be added when needed
      console.log('webhook: subscription.deleted for customer', customerId, '— Pro revocation not yet implemented');
    }
  }

  return res.status(200).json({ received: true });
}
