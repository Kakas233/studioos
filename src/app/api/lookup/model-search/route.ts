import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const USER_AGENT = "StudioOS/1.0 (cam studio management platform)";

export async function POST(request: Request) {
  try {
    // Authenticate via Supabase
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, platform, model, searchText } = body;

    if (action === "search") {
      if (!searchText || searchText.length < 3) {
        return NextResponse.json(
          { error: "Search text must be at least 3 characters" },
          { status: 400 }
        );
      }

      const params = new URLSearchParams({ model: searchText });
      if (platform) params.set("platform", platform);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(
        `https://api.camgirlfinder.net/models/search?${params.toString()}`,
        {
          headers: { "User-Agent": USER_AGENT },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: { message: res.statusText } }));
        console.error("CamGirlFinder search error:", JSON.stringify(err));
        return NextResponse.json(
          { error: err.error?.message || "Search failed" },
          { status: res.status }
        );
      }

      const results = await res.json();
      return NextResponse.json({ success: true, results });
    }

    if (action === "profile") {
      if (!platform || !model) {
        return NextResponse.json(
          { error: "Platform and model are required" },
          { status: 400 }
        );
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(
        `https://api.camgirlfinder.net/models/${platform}/${model}`,
        {
          headers: { "User-Agent": USER_AGENT },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!res.ok) {
        if (res.status === 404) {
          return NextResponse.json({
            success: true,
            profile: null,
            notFound: true,
          });
        }
        const err = await res
          .json()
          .catch(() => ({ error: { message: res.statusText } }));
        console.error("CamGirlFinder profile error:", JSON.stringify(err));
        return NextResponse.json(
          { error: err.error?.message || "Profile fetch failed" },
          { status: res.status }
        );
      }

      const profile = await res.json();
      return NextResponse.json({ success: true, profile });
    }

    if (action === "similar") {
      if (!platform || !model) {
        return NextResponse.json(
          { error: "Platform and model are required" },
          { status: 400 }
        );
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(
        `https://api.camgirlfinder.net/models/${platform}/${model}/similar`,
        {
          headers: { "User-Agent": USER_AGENT },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!res.ok) {
        console.error("CamGirlFinder similar error:", res.status);
        return NextResponse.json({ success: true, similar: {} });
      }

      const similar = await res.json();
      return NextResponse.json({ success: true, similar });
    }

    return NextResponse.json(
      { error: "Invalid action. Use: search, profile, similar" },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("modelSearch error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
