import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const API_BASE = "https://plus.statbate.com/api";

async function statbateFetch(
  path: string,
  params: URLSearchParams,
  apiToken: string
) {
  const url = params.toString()
    ? `${API_BASE}${path}?${params.toString()}`
    : `${API_BASE}${path}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(
      `Statbate API error ${response.status} for ${path}: ${text}`
    );
    return null;
  }

  return await response.json();
}

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

    const apiToken = process.env.STATBATE_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json(
        { error: "STATBATE_API_TOKEN not set" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      action,
      site,
      username,
      range_start,
      range_end,
      page,
      per_page,
      model,
    } = body;

    if (!action) {
      return NextResponse.json(
        { error: "action is required" },
        { status: 400 }
      );
    }

    if (action === "search") {
      if (!site)
        return NextResponse.json(
          { error: "site is required" },
          { status: 400 }
        );
      const params = new URLSearchParams();
      params.set("site", site);
      if (range_start) params.set("range[0]", range_start);
      if (range_end) params.set("range[1]", range_end);
      params.set("page", String(page || 1));
      params.set("per_page", String(per_page || 50));
      const result = await statbateFetch("/members", params, apiToken);
      return NextResponse.json({
        success: true,
        data: result?.data || [],
        meta: result?.meta || {},
      });
    }

    if (action === "info") {
      if (!site || !username)
        return NextResponse.json(
          { error: "site and username required" },
          { status: 400 }
        );
      const params = new URLSearchParams();
      params.set("timezone", "UTC");
      const result = await statbateFetch(
        `/members/${site}/${username}/info`,
        params,
        apiToken
      );
      if (!result)
        return NextResponse.json(
          { error: "Member not found" },
          { status: 404 }
        );
      return NextResponse.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    }

    if (action === "top_models") {
      if (!site || !username)
        return NextResponse.json(
          { error: "site and username required" },
          { status: 400 }
        );
      const params = new URLSearchParams();
      params.set("timezone", "UTC");
      if (range_start) params.set("range[0]", range_start);
      if (range_end) params.set("range[1]", range_end);
      const result = await statbateFetch(
        `/members/${site}/${username}/top-models`,
        params,
        apiToken
      );
      if (!result)
        return NextResponse.json(
          { error: "Member not found" },
          { status: 404 }
        );
      return NextResponse.json({
        success: true,
        data: result.data || [],
        meta: result.meta,
      });
    }

    if (action === "tips") {
      if (!site || !username)
        return NextResponse.json(
          { error: "site and username required" },
          { status: 400 }
        );
      const params = new URLSearchParams();
      params.set("timezone", "UTC");
      if (range_start) params.set("range[0]", range_start);
      if (range_end) params.set("range[1]", range_end);
      params.set("page", String(page || 1));
      params.set("per_page", String(per_page || 50));
      const result = await statbateFetch(
        `/members/${site}/${username}/tips`,
        params,
        apiToken
      );
      return NextResponse.json({
        success: true,
        data: result?.data || [],
        meta: result?.meta || {},
      });
    }

    if (action === "activity") {
      if (!site || !username)
        return NextResponse.json(
          { error: "site and username required" },
          { status: 400 }
        );
      const params = new URLSearchParams();
      params.set("timezone", "UTC");
      if (range_start) params.set("range[0]", range_start);
      if (range_end) params.set("range[1]", range_end);
      const result = await statbateFetch(
        `/members/${site}/${username}/activity`,
        params,
        apiToken
      );
      return NextResponse.json({
        success: true,
        data: result?.data || {},
        meta: result?.meta || {},
      });
    }

    if (action === "sessions") {
      if (!site || !username)
        return NextResponse.json(
          { error: "site and username required" },
          { status: 400 }
        );
      const params = new URLSearchParams();
      params.set("timezone", "UTC");
      if (range_start) params.set("range[0]", range_start);
      if (range_end) params.set("range[1]", range_end);
      params.set("window", "1");
      const result = await statbateFetch(
        `/members/${site}/${username}/sessions`,
        params,
        apiToken
      );
      return NextResponse.json({
        success: true,
        data: result?.data || [],
        meta: result?.meta || {},
      });
    }

    if (action === "model_spending") {
      if (!site || !username || !model)
        return NextResponse.json(
          { error: "site, username and model required" },
          { status: 400 }
        );
      const params = new URLSearchParams();
      params.set("timezone", "UTC");
      if (range_start) params.set("range[0]", range_start);
      if (range_end) params.set("range[1]", range_end);
      const result = await statbateFetch(
        `/members/${site}/${username}/model/${model}`,
        params,
        apiToken
      );
      return NextResponse.json({
        success: true,
        data: result?.data || {},
        meta: result?.meta || {},
      });
    }

    if (action === "chat") {
      if (!site || !username)
        return NextResponse.json(
          { error: "site and username required" },
          { status: 400 }
        );
      const params = new URLSearchParams();
      params.set("timezone", "UTC");
      if (range_start) params.set("range[0]", range_start);
      if (range_end) params.set("range[1]", range_end);
      if (model) params.set("model", model);
      params.set("page", String(page || 1));
      params.set("per_page", String(per_page || 50));
      const result = await statbateFetch(
        `/members/${site}/${username}/chat`,
        params,
        apiToken
      );
      return NextResponse.json({
        success: true,
        data: result?.data || [],
        meta: result?.meta || {},
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("memberLookup error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
