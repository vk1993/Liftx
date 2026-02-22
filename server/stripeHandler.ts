import Stripe from "stripe";
import { Express, Request, Response } from "express";
import express from "express";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-01-28.clover",
});

export function registerStripeRoutes(app: Express) {
  // Webhook must use raw body BEFORE json middleware
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = parseInt(session.metadata?.user_id ?? "0");
            const tier = session.metadata?.tier as "pro" | "ultra_pro" | undefined;

            if (userId && tier) {
              const db = await getDb();
              if (db) {
                await db
                  .update(users)
                  .set({
                    subscriptionTier: tier,
                    stripeCustomerId: session.customer as string,
                    stripeSubscriptionId: session.subscription as string,
                    subscriptionStatus: "active",
                  })
                  .where(eq(users.id, userId));

                try {
                  await notifyOwner({
                    title: `💳 New Subscription: ${tier.toUpperCase()}`,
                    content: `User ID ${userId} subscribed to ${tier} via Stripe.`,
                  });
                } catch (_) {}
              }
            }
            break;
          }

          case "customer.subscription.updated": {
            const sub = event.data.object as Stripe.Subscription;
            const db = await getDb();
            if (db && sub.customer) {
              await db
                .update(users)
                .set({
                  subscriptionStatus: sub.status,
                  stripeSubscriptionId: sub.id,
                })
                .where(eq(users.stripeCustomerId, sub.customer as string));
            }
            break;
          }

          case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;
            const db = await getDb();
            if (db && sub.customer) {
              await db
                .update(users)
                .set({
                  subscriptionTier: "trial",
                  subscriptionStatus: "cancelled",
                  stripeSubscriptionId: null,
                })
                .where(eq(users.stripeCustomerId, sub.customer as string));
            }
            break;
          }

          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error("[Stripe Webhook] Error processing event:", err);
        return res.status(500).json({ error: "Webhook processing failed" });
      }

      res.json({ received: true });
    }
  );
}

// Create a checkout session for subscription upgrade
export async function createCheckoutSession(opts: {
  userId: number;
  userEmail: string;
  userName: string;
  tier: "pro" | "ultra_pro";
  billing: "monthly" | "yearly";
  origin: string;
}): Promise<string> {
  const PRICES: Record<string, Record<string, number>> = {
    pro: { monthly: 1900, yearly: 18000 },
    ultra_pro: { monthly: 4900, yearly: 47000 },
  };

  const amount = PRICES[opts.tier][opts.billing];
  const interval = opts.billing === "monthly" ? "month" : "year";
  const tierLabel = opts.tier === "pro" ? "Pro" : "Ultra Pro";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: opts.userEmail,
    allow_promotion_codes: true,
    client_reference_id: opts.userId.toString(),
    metadata: {
      user_id: opts.userId.toString(),
      customer_email: opts.userEmail,
      customer_name: opts.userName,
      tier: opts.tier,
      billing: opts.billing,
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Liftx ${tierLabel}`,
            description: `${tierLabel} subscription — billed ${opts.billing}`,
          },
          unit_amount: amount,
          recurring: { interval },
        },
        quantity: 1,
      },
    ],
    success_url: `${opts.origin}/subscription?success=true&tier=${opts.tier}`,
    cancel_url: `${opts.origin}/subscription?cancelled=true`,
  });

  return session.url ?? "";
}
