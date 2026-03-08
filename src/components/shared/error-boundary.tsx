"use client";

/**
 * React Error Boundary — dark theme (fixes #19).
 * Reports errors to the error tracking system (fixes #6).
 */

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { reportCaughtError } from "@/lib/error-reporter";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report to error tracking (fix #6)
    reportCaughtError(error, errorInfo.componentStack ?? undefined);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-6">
          <div className="bg-[#111111] rounded-xl p-8 max-w-md w-full text-center border border-white/5">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-zinc-400 mb-6">
              {this.props.fallbackMessage ||
                "We're sorry for the inconvenience. Please try refreshing the page."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A84C] hover:bg-[#B8973B] text-black rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
