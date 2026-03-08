"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { initErrorReporter } from "@/lib/error-reporter";

function ErrorReporterInit() {
  useEffect(() => {
    initErrorReporter();
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ErrorReporterInit />
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#111111",
                border: "1px solid rgba(255,255,255,0.05)",
                color: "#C9A84C",
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
