"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { BLOG_POSTS, BLOG_TAGS } from "@/components/blog/blog-data";
import { format } from "date-fns";

export default function Blog() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("all");

  const filtered = BLOG_POSTS.filter((post) => {
    const matchesSearch =
      !search ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesTag = activeTag === "all" || post.tag === activeTag;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="pt-8 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <h1 className="text-2xl md:text-4xl font-semibold text-white text-center tracking-tight mb-6">
          Insights, guides, & resources for webcam studio operators
        </h1>

        {/* Search */}
        <div className="max-w-lg mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A49A]/40" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#141414] border border-white/[0.06] rounded-full pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-[#A8A49A]/30 focus:outline-none focus:border-[#C9A84C]/30"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="flex justify-center gap-2 flex-wrap mb-12">
          {BLOG_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                activeTag === tag
                  ? "bg-[#C9A84C] text-black"
                  : "bg-white/[0.04] text-[#A8A49A]/60 hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-xl overflow-hidden border border-white/[0.06] hover:border-white/[0.12] transition-all"
            >
              <div className="aspect-[16/10] overflow-hidden bg-[#111]">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-white/[0.06] text-[#A8A49A]/60 mb-3">
                  {post.tag}
                </span>
                <h2 className="text-[15px] font-medium text-white group-hover:text-[#C9A84C] transition-colors leading-snug mb-2 line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-[#A8A49A]/40 text-xs">
                  StudioOS Team — {format(new Date(post.date), "MMM d, yyyy")}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-[#A8A49A]/30 text-sm mt-12">
            No articles found.
          </p>
        )}
      </div>
    </div>
  );
}
