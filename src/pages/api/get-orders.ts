import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500 },
    );
  }

  const supabaseTemp = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error: userError,
  } = await supabaseTemp.auth.getUser(token);

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from("orders")
    .select(
      `
      *,
      order_items (
        product_name,
        price,
        quantity
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (ordersError) {
    return new Response(JSON.stringify({ error: "Failed to fetch orders" }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ orders }), { status: 200 });
};
