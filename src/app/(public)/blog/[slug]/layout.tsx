import type { Metadata } from "next";
import { BLOG_POSTS } from "@/components/blog/blog-data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    keywords: post.keywords,
    openGraph: {
      title: `${post.metaTitle || post.title} | StudioOS`,
      description: post.metaDescription || post.excerpt,
      url: `https://getstudioos.com/blog/${slug}`,
      siteName: "StudioOS",
      type: "article",
      images: post.image ? [{ url: post.image }] : undefined,
    },
  };
}

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
