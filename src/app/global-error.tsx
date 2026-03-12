"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Report critical error
  if (typeof window !== "undefined") {
    fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error_type: "global_error",
        message: error?.message || "Unknown global error",
        stack_trace: error?.stack || "",
        url: window.location.href,
        user_agent: navigator.userAgent,
      }),
    }).catch(() => {});
  }

  return (
    <html>
      <body style={{ backgroundColor: "#0A0A0A", margin: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              background: "#111111",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "400px",
              width: "100%",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <h2 style={{ color: "white", fontSize: "20px", marginBottom: "8px" }}>
              Something went wrong
            </h2>
            <p style={{ color: "#A8A49A", fontSize: "14px", marginBottom: "24px" }}>
              A critical error occurred. Please refresh the page.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "8px 16px",
                backgroundColor: "#C9A84C",
                color: "black",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
