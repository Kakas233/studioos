import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STATBATE_SITE_MAP, PLATFORMS } from "@/lib/platforms";

const STATBATE_BASE = "https://plus.statbate.com/api";
const CGF_BASE = "https://api.camgirlfinder.net";
const CGF_UA = "StudioOS/1.0 (cam studio management platform)";

// Use centralized maps — SITE_MAP for Statbate, CGF_MAP derived from PLATFORMS
const SITE_MAP = STATBATE_SITE_MAP;

const CGF_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(PLATFORMS)
    .map(([, config]) => [STATBATE_SITE_MAP[config.name.toLowerCase()] || config.name.toLowerCase(), config.cgfCode])
    .filter(([key]) => key)
);

async function statbateFetch(
  path: string,
  params: Record<string, string>,
  apiToken: string
) {
  const url = new URL(`${STATBATE_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Statbate error ${res.status}: ${text}`);
    return null;
  }
  return await res.json();
}

async function cgfFetch(path: string) {
  const url = `${CGF_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "User-Agent": CGF_UA },
  });
  if (!res.ok) return null;
  return await res.json();
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
      name,
      range,
      timezone,
      page,
      per_page,
      q,
      window: sessionWindow,
    } = body;

    if (!site || !name) {
      return NextResponse.json(
        { error: "site and name are required" },
        { status: 400 }
      );
    }

    const statbateSite = SITE_MAP[site];
    if (!statbateSite) {
      return NextResponse.json(
        { error: `Unsupported site: ${site}` },
        { status: 400 }
      );
    }

    const tz = timezone || "Europe/Bucharest";
    const params: Record<string, string> = {};
    if (range && range[0]) params["range[0]"] = range[0];
    if (range && range[1]) params["range[1]"] = range[1];
    params.timezone = tz;

    if (action === "info") {
      const [statData, rankData, cgfData] = await Promise.all([
        statbateFetch(`/model/${statbateSite}/${name}/info`, params, apiToken),
        statbateFetch(`/model/${statbateSite}/${name}/rank`, params, apiToken),
        cgfFetch(`/models/${CGF_MAP[site] || site}/${name}`),
      ]);

      const info = statData?.data || null;
      const rankInfo = rankData?.data || null;

      if (info && rankInfo?.summary) {
        info.rank = rankInfo.summary.last_rank;
      }

      const finalInfo =
        info ||
        (rankInfo
          ? {
              name: rankInfo.name || name,
              rank: rankInfo.summary?.last_rank,
              income: {
                tokens: rankInfo.summary?.total_tokens || 0,
                usd: rankInfo.summary?.total_usd || 0,
              },
              sessions: {
                count: 0,
                total_duration: 0,
                average_duration: 0,
              },
            }
          : null);

      return NextResponse.json({
        success: true,
        info: finalInfo,
        meta: statData?.meta || rankData?.meta || null,
        cgf: cgfData || null,
      });
    }

    if (action === "rank") {
      const data = await statbateFetch(
        `/model/${statbateSite}/${name}/rank`,
        params,
        apiToken
      );
      return NextResponse.json({
        success: true,
        rank: data?.data || null,
        meta: data?.meta || null,
      });
    }

    if (action === "activity") {
      const data = await statbateFetch(
        `/model/${statbateSite}/${name}/activity`,
        params,
        apiToken
      );
      return NextResponse.json({
        success: true,
        activity: data?.data || null,
        meta: data?.meta || null,
      });
    }

    if (action === "sessions") {
      if (per_page) params.per_page = String(per_page);
      if (sessionWindow) params.window = String(sessionWindow);
      const data = await statbateFetch(
        `/model/${statbateSite}/${name}/sessions`,
        params,
        apiToken
      );
      return NextResponse.json({
        success: true,
        sessions: data?.data || [],
        meta: data?.meta || null,
      });
    }

    if (action === "sessions-timeline") {
      if (page) params.page = String(page);
      if (per_page) params.per_page = String(per_page);
      const data = await statbateFetch(
        `/model/${statbateSite}/${name}/sessions-timeline`,
        params,
        apiToken
      );
      return NextResponse.json({
        success: true,
        timeline: data?.data || null,
        meta: data?.meta || null,
      });
    }

    if (action === "tips") {
      if (page) params.page = String(page);
      params.per_page = String(per_page || 50);
      const data = await statbateFetch(
        `/model/${statbateSite}/${name}/tips`,
        params,
        apiToken
      );
      return NextResponse.json({
        success: true,
        tips: data?.data || [],
        meta: data?.meta || null,
      });
    }

    if (action === "members") {
      const data = await statbateFetch(
        `/model/${statbateSite}/${name}/members`,
        params,
        apiToken
      );
      return NextResponse.json({
        success: true,
        members: data?.data || null,
        meta: data?.meta || null,
      });
    }

    if (action === "chat") {
      if (page !== undefined) params.page = String(page);
      params.per_page = String(per_page || 50);
      if (q) params.q = q;
      const data = await statbateFetch(
        `/model/${statbateSite}/${name}/chat`,
        params,
        apiToken
      );
      return NextResponse.json({
        success: true,
        chat: data?.data || [],
        meta: data?.meta || null,
      });
    }

    if (action === "cgf-profile") {
      const cgfCode = CGF_MAP[site] || site;
      const [profile, similar] = await Promise.all([
        cgfFetch(`/models/${cgfCode}/${name}`),
        cgfFetch(`/models/${cgfCode}/${name}/similar`),
      ]);
      return NextResponse.json({ success: true, profile, similar });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("modelLookup error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
