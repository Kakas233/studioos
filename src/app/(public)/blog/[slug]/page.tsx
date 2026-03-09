"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { BLOG_POSTS } from "@/components/blog/blog-data";
import { BLOG_CONTENT } from "@/components/blog/blog-content";
import { SimpleMarkdown } from "@/components/blog/simple-markdown";
import { format } from "date-fns";

export default function BlogPost() {
  const params = useParams();
  const slug = params.slug as string;

  const postMeta = BLOG_POSTS.find((p) => p.slug === slug);
  const postContent = slug ? BLOG_CONTENT[slug] : undefined;
  const currentIndex = BLOG_POSTS.findIndex((p) => p.slug === slug);

  if (!postMeta || !postContent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light mb-4">Post not found</h1>
          <Link href="/blog" className="text-[#C9A84C] hover:underline">
            &larr; Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const prevPost = currentIndex > 0 ? BLOG_POSTS[currentIndex - 1] : null;
  const nextPost =
    currentIndex < BLOG_POSTS.length - 1
      ? BLOG_POSTS[currentIndex + 1]
      : null;

  return (
    <article className="pt-8 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        {/* Breadcrumb */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-[#A8A49A]/40 hover:text-white transition-colors text-sm mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {/* Hero image */}
        <div className="rounded-xl overflow-hidden mb-8 aspect-[2/1] bg-[#111]">
          <img
            src={postMeta.image}
            alt={postMeta.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Tag */}
        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider bg-[#C9A84C]/10 text-[#C9A84C] mb-4">
          {postMeta.tag}
        </span>

        {/* Header */}
        <h1 className="text-2xl md:text-4xl font-semibold text-white tracking-tight mb-4 leading-tight">
          {postMeta.title}
        </h1>
        <div className="flex items-center gap-3 text-[#A8A49A]/40 text-sm mb-10 pb-8 border-b border-white/[0.06]">
          <Calendar className="w-4 h-4" />
          <time dateTime={postMeta.date}>
            {format(new Date(postMeta.date), "MMMM d, yyyy")}
          </time>
          <span>&middot;</span>
          <span>StudioOS Team</span>
        </div>

        {/* Content */}
        <div
          className="prose prose-invert prose-base max-w-none
            prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-white
            prose-h2:text-xl prose-h2:mt-12 prose-h2:mb-5
            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-[#A8A49A]/70 prose-p:leading-[1.9] prose-p:text-[15px] prose-p:mb-6
            prose-li:text-[#A8A49A]/70 prose-li:text-[15px] prose-li:leading-[1.8]
            prose-ul:mb-6 prose-ol:mb-6
            prose-strong:text-white/90
            prose-a:text-[#C9A84C]/70 prose-a:no-underline hover:prose-a:text-[#C9A84C]
          "
        >
          {postContent.sections.map((section, i) => (
            <div key={i} className={i > 0 ? "mt-8" : ""}>
              {section.heading &&
                (section.subheading ? (
                  <h3>{section.heading}</h3>
                ) : (
                  <h2>{section.heading}</h2>
                ))}
              <SimpleMarkdown>{section.text}</SimpleMarkdown>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 rounded-xl border border-[#C9A84C]/20 bg-[#C9A84C]/[0.03] text-center">
          <h2 className="text-xl font-medium text-white mb-3">
            Ready to Manage Your Studio Smarter?
          </h2>
          <p className="text-[#A8A49A]/50 text-sm mb-6">
            StudioOS gives you real-time earnings tracking, performance
            analytics, and cross-platform viewer intelligence in one dashboard.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-[#C9A84C] hover:bg-[#B8973B] text-black font-medium rounded-full px-8 py-3 text-sm transition-colors"
          >
            Start Free Trial
          </Link>
        </div>

        {/* Prev/Next */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {prevPost && (
            <Link
              href={`/blog/${prevPost.slug}`}
              className="border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-colors group"
            >
              <span className="text-[#A8A49A]/30 text-xs">
                &larr; Previous
              </span>
              <p className="text-sm text-white/80 mt-1 group-hover:text-[#C9A84C] transition-colors">
                {prevPost.title}
              </p>
            </Link>
          )}
          {nextPost && (
            <Link
              href={`/blog/${nextPost.slug}`}
              className="border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-colors group md:text-right md:ml-auto"
            >
              <span className="text-[#A8A49A]/30 text-xs">
                Next &rarr;
              </span>
              <p className="text-sm text-white/80 mt-1 group-hover:text-[#C9A84C] transition-colors">
                {nextPost.title}
              </p>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
