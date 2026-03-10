"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface TelegramStatus {
  connected: boolean;
  telegram_username?: string;
}

export default function TelegramTab() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({

          action: "getTelegramStatus",
        }),
      });
      const data = await res.json();
      if (data.success) setStatus(data.data);
    } catch (e) {
      console.error("Failed to fetch telegram status:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setLinkUrl("");
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({

          action: "connectTelegram",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLinkUrl(data.link_url);
      }
    } catch (e) {
      console.error("Failed to generate link:", e);
    } finally {
      setConnecting(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({

          action: "testTelegram",
        }),
      });
      const data = await res.json();
      setTestResult(data.success ? "success" : "failed");
    } catch {
      setTestResult("failed");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#AA0608] animate-spin" />
      </div>
    );
  }

  const isConnected = status?.connected;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="bg-[#0A0A0A] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-[#AA0608]" />
            Telegram Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${isConnected ? "bg-green-500/10" : "bg-red-500/10"}`}
            >
              {isConnected ? (
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400" />
              )}
            </div>
            <div>
              <p className="text-white font-medium">
                {isConnected ? "Connected" : "Not Connected"}
              </p>
              {isConnected && status?.telegram_username && (
                <p className="text-sm text-gray-400">
                  @{status.telegram_username}
                </p>
              )}
              {!isConnected && (
                <p className="text-sm text-gray-500">
                  Connect Telegram to receive registration alerts, daily
                  summaries, and subscription events.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {!isConnected && (
              <Button
                onClick={handleConnect}
                disabled={connecting}
                className="bg-[#AA0608] hover:bg-[#AA0608]/80"
              >
                {connecting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Generate Connect Link
              </Button>
            )}
            {isConnected && (
              <>
                <Button
                  onClick={handleTest}
                  disabled={testing}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  {testing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Test Message
                </Button>
                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                  variant="outline"
                  className="border-white/10 text-gray-400 hover:bg-white/5"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reconnect
                </Button>
              </>
            )}
            <Button
              onClick={fetchStatus}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg text-sm ${testResult === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}
            >
              {testResult === "success"
                ? "Test message sent! Check your Telegram."
                : "Failed to send test message. Try reconnecting."}
            </div>
          )}

          {linkUrl && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-400 mb-3">
                Click the link below to connect your Telegram account,
                then press <strong>/start</strong> in the bot:
              </p>
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Open Telegram Bot
              </a>
              <p className="text-xs text-gray-500 mt-3">
                After connecting, click &quot;Refresh Status&quot; above to
                confirm.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* What gets sent */}
      <Card className="bg-[#0A0A0A] border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-sm">
            What You&apos;ll Receive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                emoji: "\uD83C\uDD95",
                title: "New Registrations",
                desc: "Instant alert when a new studio signs up",
              },
              {
                emoji: "\uD83D\uDCCA",
                title: "Daily Summary",
                desc: "Every morning at 9am \u2014 studios, users, plans",
              },
              {
                emoji: "\uD83D\uDCB0",
                title: "Subscription Events",
                desc: "Payments, failures, cancellations",
              },
              {
                emoji: "\uD83D\uDCB8",
                title: "Payout Reminders",
                desc: "When studios have payouts due",
              },
              {
                emoji: "\u23F0",
                title: "Trial Expirations",
                desc: "When trials are about to expire",
              },
              {
                emoji: "\uD83D\uDED1",
                title: "Suspensions",
                desc: "When studios get suspended",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
              >
                <span className="text-xl">{item.emoji}</span>
                <div>
                  <p className="text-white text-sm font-medium">
                    {item.title}
                  </p>
                  <p className="text-gray-500 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
