/**
 * Client-side error reporter.
 * Catches unhandled errors and posts them to /api/errors for super admin visibility.
 * Fixes issue #6: adds error tracking that was completely missing.
 */

interface ErrorReport {
  error_type: string;
  message: string;
  stack_trace?: string;
  url?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

async function reportError(report: ErrorReport) {
  try {
    await fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
  } catch {
    // Silently fail — we don't want error reporting to cause more errors
    console.error("[ErrorReporter] Failed to report error:", report.message);
  }
}

/** Initialize global error handlers. Call once in the root layout. */
export function initErrorReporter() {
  if (typeof window === "undefined") return;

  // Catch unhandled errors
  window.addEventListener("error", (event) => {
    reportError({
      error_type: "unhandled_error",
      message: event.message || "Unknown error",
      stack_trace: event.error?.stack,
      url: event.filename || window.location.href,
      user_agent: navigator.userAgent,
      metadata: {
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Catch unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason;
    reportError({
      error_type: "unhandled_rejection",
      message: error?.message || String(error) || "Unhandled promise rejection",
      stack_trace: error?.stack,
      url: window.location.href,
      user_agent: navigator.userAgent,
    });
  });
}

/** Report a caught error manually (e.g., from Error Boundary) */
export function reportCaughtError(error: Error, context?: string) {
  reportError({
    error_type: "caught_error",
    message: error.message,
    stack_trace: error.stack,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    user_agent:
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    metadata: context ? { context } : undefined,
  });
}
