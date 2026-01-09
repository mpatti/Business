const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./database');

const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
  business: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_business_monthly'
};

async function createCheckoutSession(userId, email, tier) {
  const priceId = PRICE_IDS[tier];

  if (!priceId) {
    throw new Error('Invalid subscription tier');
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    client_reference_id: userId.toString(),
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing`,
    metadata: {
      userId: userId.toString(),
      tier: tier
    }
  });

  return session;
}

async function createPortalSession(customerId) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`,
  });

  return session;
}

async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = parseInt(session.metadata.userId);
      const tier = session.metadata.tier;
      const customerId = session.customer;

      // Update user subscription
      db.prepare(
        'UPDATE users SET subscription_tier = ?, stripe_customer_id = ?, subscription_status = ? WHERE id = ?'
      ).run(tier, customerId, 'active', userId);

      console.log(`Subscription activated for user ${userId}: ${tier}`);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      // Get tier from price ID
      let tier = 'free';
      if (subscription.items.data[0].price.id === PRICE_IDS.pro) {
        tier = 'pro';
      } else if (subscription.items.data[0].price.id === PRICE_IDS.business) {
        tier = 'business';
      }

      const status = subscription.status;

      db.prepare(
        'UPDATE users SET subscription_tier = ?, subscription_status = ? WHERE stripe_customer_id = ?'
      ).run(tier, status, customerId);

      console.log(`Subscription updated for customer ${customerId}: ${tier} - ${status}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      // Downgrade to free tier
      db.prepare(
        'UPDATE users SET subscription_tier = ?, subscription_status = ? WHERE stripe_customer_id = ?'
      ).run('free', 'canceled', customerId);

      console.log(`Subscription canceled for customer ${customerId}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      db.prepare(
        'UPDATE users SET subscription_status = ? WHERE stripe_customer_id = ?'
      ).run('past_due', customerId);

      console.log(`Payment failed for customer ${customerId}`);
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}

module.exports = {
  createCheckoutSession,
  createPortalSession,
  handleWebhook
};
