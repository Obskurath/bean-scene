import type { APIRoute } from "astro";
import Stripe from "stripe";

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-07-29.dahlia",
});

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const text = await request.text();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "El cuerpo de la petición está vacío" }),
        { status: 400 },
      );
    }

    const body = JSON.parse(text);
    const { items, userId } = body;

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: "El carrito está vacío" }), {
        status: 400,
      });
    }

    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Versión compacta para los metadata (solo id, precio y cantidad) para no pasar los 500 caracteres
    const simplifiedItems = items.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      metadata: {
        userId: userId || "",
        cartItems: JSON.stringify(simplifiedItems), // Mucho más corto y dentro del límite
      },
      success_url: `${url.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url.origin}/`,
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200 });
  } catch (error: any) {
    console.error("Error en Stripe:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
