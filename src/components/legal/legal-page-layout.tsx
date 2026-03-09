import { ReactNode } from "react";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated?: string;
  children: ReactNode;
}

export default function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="pt-4 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl md:text-4xl font-light text-white tracking-tight mb-3">
          {title}
        </h1>
        {lastUpdated && (
          <p className="text-[#A8A49A]/40 text-sm mb-12">
            Last Updated: {lastUpdated}
          </p>
        )}
        <div
          className="prose prose-invert prose-sm max-w-none
            prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-white
            prose-h2:text-xl prose-h2:mt-12 prose-h2:mb-5
            prose-h3:text-base prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-[#A8A49A]/60 prose-p:leading-[1.8] prose-p:text-sm prose-p:mb-5
            prose-li:text-[#A8A49A]/60 prose-li:text-sm prose-li:leading-[1.8] prose-li:mb-1.5
            prose-ul:mb-6 prose-ol:mb-6
            prose-strong:text-white/80
            prose-a:text-[#C9A84C]/70 prose-a:no-underline hover:prose-a:text-[#C9A84C]
            [&_ul]:list-disc [&_ol]:list-decimal
            [&_h2+p]:mt-0 [&_h3+p]:mt-0
          "
        >
          {children}
        </div>
      </div>
    </div>
  );
}
