import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-07-29.dahlia",
});

type CheckoutOrderItem = {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const sessionId = body?.sessionId as string | undefined;
    const userId = (body?.userId as string | undefined) || "";

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing session id" }), {
        status: 400,
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Checkout has not been paid" }),
        {
          status: 400,
        },
      );
    }

    const effectiveUserId = userId || session.metadata?.userId || "";
    const rawItems = session.metadata?.cartItems;
    const stripeCheckoutId = session.id;
    const amountTotal = session.amount_total ? session.amount_total / 100 : 0;

    if (!rawItems) {
      return new Response(JSON.stringify({ error: "No cart items found" }), {
        status: 400,
      });
    }

    let items: CheckoutOrderItem[];

    try {
      items = JSON.parse(rawItems) as CheckoutOrderItem[];
    } catch (error) {
      console.error("Unable to parse cart metadata:", error);
      return new Response(JSON.stringify({ error: "Invalid cart metadata" }), {
        status: 400,
      });
    }

    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase service role key" }),
        {
          status: 500,
        },
      );
    }

    const supabaseAdmin = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      serviceRoleKey,
    );

    const { data: existingOrder, error: existingOrderError } =
      await supabaseAdmin
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
      return new Response(
        JSON.stringify({ received: true, duplicated: true }),
        {
          status: 200,
        },
      );
    }

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: effectiveUserId,
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

    return new Response(JSON.stringify({ received: true, saved: true }), {
      status: 200,
    });
  } catch (error: any) {
    console.error("Error saving order after checkout:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
