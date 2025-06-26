import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const TIER_PRICE_IDS: Record<string, string> = {
  'foundation': process.env.PRICE_FOUNDATION_TIER!,
  'builder': process.env.PRICE_BUILDER_TIER!,
  'flagship': process.env.PRICE_FLAGSHIP_TIER!,
}

const ADDON_PRICE_IDS: Record<string, string> = {
  'job-event': process.env.PRICE_JOB_OR_EVENT!,
  'virtual-hiring': process.env.PRICE_VIRTUAL_HIRING_EVENT!,
  'hiring-event': process.env.PRICE_HIRING_EVENT!,
  'network-sponsorship': process.env.PRICE_NETWORK_SPONSORSHIP!,
}

export async function POST(req: NextRequest) {
  try {
    const { subscriptionTier, selectedAddons = [], email, mobileNumber, metadata = {} } = await req.json();

    // Build line items: allow add-on only, or subscription+add-ons
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (subscriptionTier && TIER_PRICE_IDS[subscriptionTier]) {
      lineItems.push({
        price: TIER_PRICE_IDS[subscriptionTier],
        quantity: 1,
      });
    }

    selectedAddons.forEach((id: string) => {
      const priceId = ADDON_PRICE_IDS[id];
      if (!priceId) throw new Error(`Invalid add-on ID: ${id}`);
      lineItems.push({
        price: priceId,
        quantity: 1,
      });
    });

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'No valid subscription or add-on selected.' }, { status: 400 });
    }

    // Attach email and mobile to metadata
    const session = await stripe.checkout.sessions.create({
      mode: subscriptionTier ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: email, // Show on checkout
      phone_number_collection: { enabled: true }, // Show phone on checkout
      metadata: {
        ...metadata,
        email,
        mobileNumber,
      },
      success_url: `${req.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/cancel`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}