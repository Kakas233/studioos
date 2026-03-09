"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, ChevronLeft, ChevronRight, Search } from "lucide-react";

interface MemberChatHistoryProps {
  site: string;
  username: string;
  rangeStart: string | null;
  rangeEnd: string | null;
}

export default function MemberChatHistory({ site, username, rangeStart, rangeEnd }: MemberChatHistoryProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [modelFilter, setModelFilter] = useState("");
  const [appliedModel, setAppliedModel] = useState("");

  useEffect(() => {
    setPage(1);
  }, [site, username, rangeStart, rangeEnd, appliedModel]);

  useEffect(() => {
    fetchChat();
  }, [site, username, rangeStart, rangeEnd, page, appliedModel]);

  const fetchChat = async () => {
    setLoading(true);
    try {
      const params: any = { action: "chat", site, username, page, per_page: 30 };
      if (rangeStart) params.range_start = rangeStart;
      if (rangeEnd) params.range_end = rangeEnd;
      if (appliedModel) params.model = appliedModel;
      const res = await fetch("/api/lookup/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const result = await res.json();
      setMessages(result.data || []);
      setMeta(result.meta || null);
    } catch (err) {
      console.error("Failed to fetch chat:", err);
    } finally {
      setLoading(false);
    }
  };

  const pagination = meta?.pagination;
  const totalPages = pagination?.last_page || 1;

  const handleModelSearch = () => {
    setAppliedModel(modelFilter.trim().toLowerCase());
  };

  return (
    <Card className="bg-[#111111] border-white/[0.04]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            Chat Messages
          </CardTitle>
          {pagination && (
            <span className="text-[10px] text-[#A8A49A]/40">
              {pagination.total?.toLocaleString()} messages
            </span>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A49A]/30" />
            <Input
              placeholder="Filter by model username..."
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleModelSearch()}
              className="pl-8 h-8 text-xs bg-white/[0.03] border-white/[0.06] text-white placeholder:text-[#A8A49A]/20 rounded-lg"
            />
          </div>
          <Button
            size="sm"
            onClick={handleModelSearch}
            className="h-8 text-xs bg-[#C9A84C] hover:bg-[#B8973B] text-black"
          >
            Filter
          </Button>
          {appliedModel && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setModelFilter(""); setAppliedModel(""); }}
              className="h-8 text-xs text-[#A8A49A]/40"
            >
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-blue-500/[0.04] border border-blue-500/10 rounded-lg px-3 py-2 mb-3">
          <p className="text-[11px] text-blue-400/60">
            Only messages sent in <strong className="text-blue-400/80">public chat rooms</strong> are shown here. Private messages (PMs), whispers, and messages from private/group shows are not tracked.
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#C9A84C]" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-[#A8A49A]/30 text-sm py-8">No chat messages found</p>
        ) : (
          <>
            <div className="space-y-0.5 max-h-[500px] overflow-y-auto pr-1">
              {messages.map((msg: any, i: number) => (
                <div
                  key={i}
                  className="px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Link
                      href={`/model-lookup?site=${site}&name=${encodeURIComponent(msg.room)}`}
                      className="text-xs text-blue-400/70 font-medium truncate hover:text-blue-300 hover:underline"
                    >
                      in {msg.room}&apos;s room
                    </Link>
                    <span className="text-[10px] text-[#A8A49A]/30 whitespace-nowrap">
                      {new Date(msg.time).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-white/80 break-words">{msg.message}</p>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-white/[0.04]">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-7 text-[#A8A49A]/40 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-[#A8A49A]/40">
                  Page {page} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-7 text-[#A8A49A]/40 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
