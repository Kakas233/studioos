import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const targetCurrency = searchParams.get("target_currency")?.toLowerCase();

    if (!targetCurrency) {
      return NextResponse.json({ error: "target_currency parameter required" }, { status: 400 });
    }

    const response = await fetch(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch exchange rates" }, { status: 502 });
    }

    const data = await response.json();
    const rate = data?.usd?.[targetCurrency];

    if (!rate) {
      return NextResponse.json({ error: `Exchange rate not found for ${targetCurrency.toUpperCase()}` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      rate,
      currency: targetCurrency.toUpperCase(),
      source: "fawazahmed0/currency-api",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
