"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const EMOJIS = ["👍", "❤️", "🔥", "👏", "💪", "🎉"];

interface Reaction {
  count: number;
  reacted: boolean;
}

interface NewsPost {
  id: string;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
  reactions: Record<string, Reaction>;
}

export default function NewsPage() {
  const { account } = useAuth();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [publishing, setPublishing] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const isAdmin = account?.role === "owner" || account?.role === "admin";

  const fetchPosts = useCallback(async (cursorParam?: string | null) => {
    const isLoadMore = !!cursorParam;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const url = cursorParam
        ? `/api/news?cursor=${encodeURIComponent(cursorParam)}`
        : "/api/news";
      const res = await fetch(url);
      const data = await res.json();
      if (data.posts) {
        setPosts((prev) => isLoadMore ? [...prev, ...data.posts] : data.posts);
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      }
    } catch {
      toast.error("Failed to load news");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchPosts(cursor);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, cursor, fetchPosts]);

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Add a title and content");
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", title: title.trim(), content: content.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setTitle("");
        setContent("");
        setShowCompose(false);
        fetchPosts();
      } else {
        toast.error(data.error || "Failed to publish");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", post_id: postId }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleReact = async (postId: string, emoji: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const reactions = { ...p.reactions };
        const current = reactions[emoji] || { count: 0, reacted: false };
        if (current.reacted) {
          reactions[emoji] = { count: Math.max(0, current.count - 1), reacted: false };
          if (reactions[emoji].count === 0) delete reactions[emoji];
        } else {
          reactions[emoji] = { count: current.count + 1, reacted: true };
        }
        return { ...p, reactions };
      })
    );

    try {
      await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "react", post_id: postId, emoji }),
      });
    } catch {
      // Revert on failure
      fetchPosts();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Compose button for admins */}
      {isAdmin && !showCompose && (
        <button
          onClick={() => setShowCompose(true)}
          className="w-full mb-6 py-3 border border-dashed border-white/[0.08] rounded-xl text-sm text-[#A8A49A]/50 hover:text-white hover:border-white/[0.15] transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Write an update
        </button>
      )}

      {/* Compose form */}
      {isAdmin && showCompose && (
        <div className="mb-6 border border-white/[0.08] rounded-xl bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white">New update</p>
            <button
              onClick={() => { setShowCompose(false); setTitle(""); setContent(""); }}
              className="text-[#A8A49A]/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full text-sm text-white bg-transparent border-b border-white/[0.06] pb-2 mb-3 outline-none placeholder:text-[#A8A49A]/30 font-medium"
            autoFocus
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your update..."
            rows={4}
            className="w-full text-sm text-white/80 bg-transparent outline-none resize-none placeholder:text-[#A8A49A]/30 leading-relaxed"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handlePublish}
              disabled={publishing || !title.trim() || !content.trim()}
              className="px-4 py-2 bg-[#C9A84C] hover:bg-[#B8973B] disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {publishing && <Loader2 className="w-3 h-3 animate-spin" />}
              Publish
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm text-[#A8A49A]/40">No updates yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post.id}
              className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-medium text-white leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-[11px] text-[#A8A49A]/40 mt-1">
                    {post.author_name} &middot;{" "}
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-[#A8A49A]/20 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className="text-sm text-[#A8A49A]/70 leading-relaxed whitespace-pre-wrap mt-3">
                {post.content}
              </p>

              {/* Reactions */}
              <div className="flex flex-wrap items-center gap-1.5 mt-4">
                {Object.entries(post.reactions).map(([emoji, data]) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(post.id, emoji)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                      data.reacted
                        ? "bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-white"
                        : "bg-white/[0.04] border border-white/[0.06] text-[#A8A49A]/60 hover:border-white/[0.12]"
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{data.count}</span>
                  </button>
                ))}
                {/* Add reaction picker */}
                <EmojiPicker
                  existing={Object.keys(post.reactions)}
                  onSelect={(emoji) => handleReact(post.id, emoji)}
                />
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={observerRef} className="h-8" />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 text-[#C9A84C] animate-spin" />
        </div>
      )}
    </div>
  );
}

function EmojiPicker({
  existing,
  onSelect,
}: {
  existing: string[];
  onSelect: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-7 h-7 rounded-full bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] flex items-center justify-center text-[#A8A49A]/40 hover:text-white transition-colors text-xs"
      >
        +
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 flex gap-0.5 bg-[#151515] border border-white/[0.08] rounded-lg p-1.5 shadow-xl z-10">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => { onSelect(e); setOpen(false); }}
              className="w-8 h-8 rounded-md hover:bg-white/[0.08] flex items-center justify-center text-base transition-colors"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
