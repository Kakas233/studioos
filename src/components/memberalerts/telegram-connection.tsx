"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, ExternalLink, Loader2, CheckCircle2, XCircle, TestTube2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface TelegramConnectionProps {
  accountId: string | undefined;
  studioId: string | undefined;
}

export default function TelegramConnection({ accountId, studioId }: TelegramConnectionProps) {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const checkStatus = useCallback(async (silent = false) => {
    if (!accountId) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_status", account_id: accountId }),
      });
      const data = await res.json();
      if (!mountedRef.current) return;
      const isConnected = data?.connected || false;
      setConnected(isConnected);
      setTelegramUsername(data?.telegram_username || null);
      if (isConnected && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setLinkUrl(null);
        toast.success("Telegram connected successfully!");
      }
    } catch (err) {
      console.error("Check status error:", err);
    } finally {
      if (mountedRef.current && !silent) setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleGenerateLink = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_link", account_id: accountId, studio_id: studioId }),
      });
      const data = await res.json();
      if (data?.link_url) {
        setLinkUrl(data.link_url);
        // Start polling every 4 seconds
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => checkStatus(true), 4000);
      } else {
        toast.error("Failed to generate link");
      }
    } catch {
      toast.error("Error generating Telegram link");
    } finally {
      setGenerating(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect", account_id: accountId }),
      });
      setConnected(false);
      setTelegramUsername(null);
      setLinkUrl(null);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      toast.success("Telegram disconnected");
    } catch {
      toast.error("Error disconnecting");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSendTest = async () => {
    setSendingTest(true);
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_test", account_id: accountId }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("Test message sent! Check your Telegram.");
      } else {
        toast.error("Failed to send test message");
      }
    } catch {
      toast.error("Error sending test message");
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-[#111111] border-white/[0.04]">
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#C9A84C]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#111111] border-white/[0.04]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-400" />
            Telegram Bot Connection
            {connected && (
              <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px] border-0 ml-2">Connected</Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#A8A49A]/30 hover:text-white"
            onClick={() => checkStatus()}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-emerald-500/[0.06] rounded-lg border border-emerald-500/10">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm text-white">Telegram connected</p>
                {telegramUsername && (
                  <p className="text-xs text-[#A8A49A]/50">@{telegramUsername}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                size="sm"
                onClick={handleSendTest}
                disabled={sendingTest}
                className="text-xs bg-white/[0.05] hover:bg-white/[0.08] text-[#A8A49A] hover:text-white border border-white/[0.08] hover:border-white/[0.12] rounded-lg h-8 px-3.5 transition-all"
              >
                {sendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <TestTube2 className="w-3.5 h-3.5 mr-1.5 text-[#C9A84C]" />}
                Send Test
              </Button>
              <Button
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-xs bg-red-500/[0.06] hover:bg-red-500/[0.12] text-red-400/70 hover:text-red-400 border border-red-500/[0.08] hover:border-red-500/[0.15] rounded-lg h-8 px-3.5 transition-all"
              >
                {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <XCircle className="w-3.5 h-3.5 mr-1.5" />}
                Disconnect
              </Button>
            </div>
          </div>
        ) : linkUrl ? (
          <div className="space-y-3">
            <p className="text-sm text-[#A8A49A]/50">
              Click the button below to open Telegram and connect your account:
            </p>
            <a href={linkUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-[#229ED9] hover:bg-[#1A8BC7] text-white">
                <Send className="w-4 h-4 mr-2" />
                Open Telegram Bot
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </a>
            <div className="flex items-center gap-2 text-xs text-[#A8A49A]/30">
              <Loader2 className="w-3 h-3 animate-spin" />
              Waiting for connection...
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#A8A49A]/30 hover:text-white"
              onClick={handleGenerateLink}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Generate new link
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[#A8A49A]/40">
              Connect your Telegram account to receive real-time alerts when tracked members come online or tip in your room.
            </p>
            <Button
              size="sm"
              className="bg-[#229ED9] hover:bg-[#1A8BC7] text-white"
              onClick={handleGenerateLink}
              disabled={generating}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Connect Telegram Bot
            </Button>
            <p className="text-[10px] text-[#A8A49A]/20">
              You&apos;ll be redirected to Telegram to start the bot
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
