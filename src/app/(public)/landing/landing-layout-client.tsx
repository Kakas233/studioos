"use client";

import { useEffect } from "react";

export default function LandingLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hide the parent (public) layout's header and footer so the landing page
  // can render its own PublicNav, Footer, and AnimatedBackground without duplication.
  useEffect(() => {
    const parent = document.getElementById("public-layout");
    if (parent) {
      const header = parent.querySelector(":scope > header");
      const footer = parent.querySelector(":scope > footer");
      const main = parent.querySelector(":scope > main");
      if (header) (header as HTMLElement).style.display = "none";
      if (footer) (footer as HTMLElement).style.display = "none";
      // Remove flex-col constraint so landing page fills viewport
      if (main) {
        (main as HTMLElement).style.flex = "1";
      }
    }
    return () => {
      if (parent) {
        const header = parent.querySelector(":scope > header");
        const footer = parent.querySelector(":scope > footer");
        if (header) (header as HTMLElement).style.display = "";
        if (footer) (footer as HTMLElement).style.display = "";
      }
    };
  }, []);

  return <>{children}</>;
}
