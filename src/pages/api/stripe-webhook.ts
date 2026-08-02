import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-07-29.dahlia",
});

type WebhookOrderItem = {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
};

export const POST: APIRoute = async ({ request }) => {
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!webhookSecret) {
    return new Response(
      JSON.stringify({ error: "Missing Stripe webhook secret" }),
      {
        status: 500,
      },
    );
  }

  if (!serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase service role key" }),
      {
        status: 500,
      },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing Stripe signature" }), {
      status: 400,
    });
  }

  const payload = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error: any) {
    console.error(
      "Stripe webhook signature verification failed:",
      error.message,
    );
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
    });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (session.payment_status !== "paid") {
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const userId = session.metadata?.userId;
  const rawItems = session.metadata?.cartItems;
  const stripeCheckoutId = session.id;
  const amountTotal = session.amount_total ? session.amount_total / 100 : 0;

  if (!userId || !rawItems) {
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  let items: WebhookOrderItem[];

  try {
    items = JSON.parse(rawItems) as WebhookOrderItem[];
  } catch (error) {
    console.error(
      "Unable to parse cart items from Stripe session metadata:",
      error,
    );
    return new Response(JSON.stringify({ error: "Invalid cart metadata" }), {
      status: 400,
    });
  }

  const supabaseAdmin = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    serviceRoleKey,
  );

  const { data: existingOrder, error: existingOrderError } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("stripe_checkout_id", stripeCheckoutId)
    .maybeSingle();

  if (existingOrderError) {
    console.error("Error checking existing order:", existingOrderError);
    return new Response(JSON.stringify({ error: "Failed to check order" }), {
      status: 500,
    });
  }

  if (existingOrder) {
    return new Response(JSON.stringify({ received: true, duplicated: true }), {
      status: 200,
    });
  }

  const { data: orderData, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: userId,
      stripe_checkout_id: stripeCheckoutId,
      amount: amountTotal,
      status: "completed",
    })
    .select()
    .single();

  if (orderError || !orderData) {
    console.error("Error inserting order:", orderError);
    return new Response(JSON.stringify({ error: "Failed to insert order" }), {
      status: 500,
    });
  }

  const orderItemsToInsert = items.map((item) => ({
    order_id: orderData.id,
    product_id: String(item.id),
    product_name: item.name,
    price: item.price,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabaseAdmin
    .from("order_items")
    .insert(orderItemsToInsert);

  if (itemsError) {
    console.error("Error inserting order items:", itemsError);
    return new Response(
      JSON.stringify({ error: "Failed to insert order items" }),
      {
        status: 500,
      },
    );
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};
