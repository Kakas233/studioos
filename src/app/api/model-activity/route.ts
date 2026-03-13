import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ACTIVITY_TO_SHOW_TYPE: Record<number, string> = {
  0: "unknown", 1: "free_chat", 2: "private_chat", 3: "nude_chat",
  4: "member_chat", 5: "away", 6: "on_break", 7: "group_chat",
  8: "semiprivate", 9: "vip_chat", 10: "happy_hour", 11: "party_chat",
  12: "pre_gold_show", 13: "gold_show", 22: "true_private",
  40: "paid_chat", 100: "offline",
};

const ONLINE_SHOW_TYPES = new Set([
  "free_chat", "private_chat", "nude_chat", "member_chat",
  "group_chat", "semiprivate", "vip_chat", "happy_hour",
  "party_chat", "pre_gold_show", "gold_show", "true_private", "paid_chat",
]);

const PLATFORM_SLUG_MAP: Record<string, string> = {
  MyFreeCams: "MyFreeCams", Chaturbate: "Chaturbate",
  StripChat: "StripChat", BongaCams: "BongaCams",
  Cam4: "Cam4", CamSoda: "CamSoda",
  Flirt4Free: "Flirt4Free", LiveJasmin: "LiveJasmin",
};

// Simple in-memory cache per studio (30-second TTL)
const cache = new Map<string, { data: Record<string, ActivityResult>; ts: number }>();
const CACHE_TTL = 30_000;

export interface ActivityResult {
  cam_account_id: string;
  is_live: boolean;
  show_type: string;
  display_name: string;
  updated_at: string | null;
}

async function fetchModelStats(platform: string, username: string): Promise<{
  activity_status_id: number;
  activity_name: string;
  display_name: string;
  updated_at: string;
} | null> {
  const slug = PLATFORM_SLUG_MAP[platform] || platform;
  const url = `https://api.mycamgirl.net/stats/${slug}/${username}?with[]=last_activity.activity_status`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const la = data?.last_activity;
    if (!la) return null;

    return {
      activity_status_id: la.activity_status_id,
      activity_name: la.activity_status?.name || "unknown",
      display_name: la.activity_status?.display_name || "Unknown",
      updated_at: la.updated_at || null,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminDb = createAdminClient();
    const { data: account } = await adminDb
      .from("accounts")
      .select("studio_id")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();
    if (!account) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const studioId = account.studio_id;

    // Check cache
    const cached = cache.get(studioId);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Fetch active cam accounts for this studio
    const { data: camAccounts } = await adminDb
      .from("cam_accounts")
      .select("id, platform, username, model_id")
      .eq("studio_id", studioId)
      .eq("is_active", true);

    if (!camAccounts || camAccounts.length === 0) {
      return NextResponse.json({});
    }

    const results: Record<string, ActivityResult> = {};

    // Fetch in parallel batches of 5 to avoid overwhelming the API
    const BATCH_SIZE = 5;
    for (let i = 0; i < camAccounts.length; i += BATCH_SIZE) {
      const batch = camAccounts.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async (ca) => {
        const stats = await fetchModelStats(ca.platform, ca.username);
        if (!stats) return;

        const showType = ACTIVITY_TO_SHOW_TYPE[stats.activity_status_id] ?? "unknown";
        const isLive = ONLINE_SHOW_TYPES.has(showType);

        results[ca.id] = {
          cam_account_id: ca.id,
          is_live: isLive,
          show_type: showType,
          display_name: stats.display_name,
          updated_at: stats.updated_at,
        };
      });
      await Promise.all(promises);

      // Small delay between batches
      if (i + BATCH_SIZE < camAccounts.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // Also update streaming_sessions in the background so the DB stays current
    for (const [caId, result] of Object.entries(results)) {
      adminDb
        .from("streaming_sessions")
        .upsert(
          {
            studio_id: studioId,
            cam_account_id: caId,
            is_currently_live: result.is_live,
            show_type: result.show_type as "free_chat" | "offline",
            scraped_at: new Date().toISOString(),
          } as Record<string, unknown>,
          { onConflict: "cam_account_id" }
        )
        .then(() => {}, () => {});
    }

    // Cache results
    cache.set(studioId, { data: results, ts: Date.now() });

    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
