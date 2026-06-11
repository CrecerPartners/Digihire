import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // NOTE: the client-supplied `amount` is intentionally ignored. The charge
    // amount is recomputed server-side from authoritative product prices so a
    // tampered cart total cannot lower what the buyer is charged.
    const { orderId, email } = await req.json();

    if (!orderId || !email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) {
      return new Response(JSON.stringify({ error: "Payment not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authoritative total from products (never trust order_items.price / cart total)
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("quantity, products(price)")
      .eq("order_id", orderId);

    if (!orderItems || orderItems.length === 0) {
      return new Response(JSON.stringify({ error: "Order has no items" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amountKobo = Math.round(
      orderItems.reduce(
        (sum: number, item: any) => sum + Number(item.products?.price ?? 0) * Number(item.quantity ?? 0),
        0
      ) * 100
    );

    if (amountKobo <= 0) {
      return new Response(JSON.stringify({ error: "Invalid order total" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callbackUrl = `${req.headers.get("origin") || "https://voltafrica.lovable.app"}/order-confirmation`;

    // Initialize Paystack transaction
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountKobo, // Paystack expects kobo
        reference: `VOLT-${orderId.slice(0, 8)}-${Date.now()}`,
        callback_url: callbackUrl,
        metadata: {
          order_id: orderId,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return new Response(JSON.stringify({ error: paystackData.message || "Paystack error" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update order with paystack reference (supabase client created above)
    await supabase
      .from("orders")
      .update({ paystack_reference: paystackData.data.reference })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
