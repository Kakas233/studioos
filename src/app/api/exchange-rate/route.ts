import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { target_currency, session_token } = body;

    // Verify caller is authenticated
    if (session_token) {
      const { data: sessions } = await (getSupabase()
        .from("sessions") as any)
        .select("*")
        .eq("token", session_token);

      if (
        !sessions ||
        sessions.length === 0 ||
        new Date(sessions[0].expires_at) < new Date()
      ) {
        return NextResponse.json(
          { error: "Invalid session" },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!target_currency) {
      return NextResponse.json(
        { error: "target_currency is required" },
        { status: 400 }
      );
    }

    // If target is USD, rate is 1
    if (target_currency === "USD") {
      return NextResponse.json({
        rate: 1,
        source: "static",
        currency: "USD",
      });
    }

    // Use a free exchange rate API
    const response = await fetch(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
    );

    if (!response.ok) {
      console.error("Exchange rate API failed:", response.status);
      return NextResponse.json(
        { error: "Failed to fetch exchange rate" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const lowerCode = target_currency.toLowerCase();
    const rate = data?.usd?.[lowerCode];

    if (!rate) {
      console.error(
        `Currency ${target_currency} not found in API response`
      );
      return NextResponse.json(
        { error: `Currency ${target_currency} not found` },
        { status: 404 }
      );
    }

    console.log(`Exchange rate: 1 USD = ${rate} ${target_currency}`);

    return NextResponse.json({
      rate,
      source: "api",
      currency: target_currency,
      fetched_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("fetchExchangeRate error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
