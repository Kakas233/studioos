import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAccount(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabaseAdmin
    .from("accounts")
    .select("id, studio_id, role, first_name, last_name")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .single();
  return data;
}

export async function GET(req: NextRequest) {
  const account = await getAccount(req);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = 20;

  let query = supabaseAdmin
    .from("news_posts")
    .select("id, title, content, author_name, created_at")
    .eq("studio_id", account.studio_id)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: posts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hasMore = (posts?.length || 0) > limit;
  const items = hasMore ? posts!.slice(0, limit) : (posts || []);
  const nextCursor = hasMore ? items[items.length - 1].created_at : null;

  // Fetch reactions for these posts
  const postIds = items.map((p) => p.id);
  let reactions: Record<string, Record<string, { count: number; reacted: boolean }>> = {};

  if (postIds.length > 0) {
    const { data: allReactions } = await supabaseAdmin
      .from("news_reactions")
      .select("post_id, account_id, emoji")
      .in("post_id", postIds);

    for (const r of allReactions || []) {
      if (!reactions[r.post_id]) reactions[r.post_id] = {};
      if (!reactions[r.post_id][r.emoji]) reactions[r.post_id][r.emoji] = { count: 0, reacted: false };
      reactions[r.post_id][r.emoji].count++;
      if (r.account_id === account.id) reactions[r.post_id][r.emoji].reacted = true;
    }
  }

  return NextResponse.json({
    posts: items.map((p) => ({ ...p, reactions: reactions[p.id] || {} })),
    nextCursor,
  });
}

export async function POST(req: NextRequest) {
  const account = await getAccount(req);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  // Create post (admin/owner only)
  if (action === "create") {
    if (account.role !== "owner" && account.role !== "admin") {
      return NextResponse.json({ error: "Only admins can create news" }, { status: 403 });
    }
    const { title, content } = body;
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content required" }, { status: 400 });
    }
    const authorName = [account.first_name, account.last_name].filter(Boolean).join(" ") || "Admin";
    const { data, error } = await supabaseAdmin.from("news_posts").insert({
      studio_id: account.studio_id,
      author_id: account.id,
      author_name: authorName,
      title: title.trim(),
      content: content.trim(),
    }).select("id").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: data.id });
  }

  // Delete post (admin/owner only)
  if (action === "delete") {
    if (account.role !== "owner" && account.role !== "admin") {
      return NextResponse.json({ error: "Only admins can delete news" }, { status: 403 });
    }
    const { post_id } = body;
    const { error } = await supabaseAdmin.from("news_posts").delete().eq("id", post_id).eq("studio_id", account.studio_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Toggle reaction
  if (action === "react") {
    const { post_id, emoji } = body;
    if (!post_id || !emoji) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Verify the post belongs to this studio
    const { data: post } = await supabaseAdmin
      .from("news_posts")
      .select("id")
      .eq("id", post_id)
      .eq("studio_id", account.studio_id)
      .single();

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    // Check if already reacted
    const { data: existing } = await supabaseAdmin
      .from("news_reactions")
      .select("id")
      .eq("post_id", post_id)
      .eq("account_id", account.id)
      .eq("emoji", emoji)
      .single();

    if (existing) {
      await supabaseAdmin.from("news_reactions").delete().eq("id", existing.id);
      return NextResponse.json({ success: true, added: false });
    } else {
      await supabaseAdmin.from("news_reactions").insert({
        post_id,
        account_id: account.id,
        emoji,
      });
      return NextResponse.json({ success: true, added: true });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
