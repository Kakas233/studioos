"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface MLChatTabProps {
  site: string;
  name: string;
  dateRange: { start: string; end: string };
}

export default function MLChatTab({ site, name, dateRange }: MLChatTabProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [meta, setMeta] = useState<any>(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => { setPage(0); }, [site, name, dateRange, searchQ]);
  useEffect(() => { loadChat(); }, [site, name, dateRange, page, searchQ]);

  const loadChat = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lookup/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          site,
          name,
          range: [dateRange.start, dateRange.end],
          page,
          per_page: 50,
          q: searchQ || undefined,
        }),
      });
      const data = await res.json();
      setMessages(data.chat || []);
      setMeta(data.meta || null);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchQ(searchInput);
  };

  return (
    <Card className="bg-[#111111] border-white/[0.04]">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-white">Chat Messages</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A49A]/30" />
              <Input
                placeholder="Search messages..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-8 h-8 w-48 text-xs bg-white/[0.03] border-white/[0.06] text-white rounded-lg"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-[#C9A84C] animate-spin" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider border-b border-white/[0.04]">
                    <th className="text-left pb-2 pr-4">Time</th>
                    <th className="text-left pb-2 pr-4">Sender</th>
                    <th className="text-left pb-2">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m: any, i: number) => (
                    <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                      <td className="py-2.5 pr-4 text-white/50 text-xs whitespace-nowrap">
                        {m.time ? format(new Date(m.time), "yyyy-MM-dd HH:mm:ss") : "-"}
                      </td>
                      <td className="py-2.5 pr-4 text-xs font-medium whitespace-nowrap">
                        {m.sender ? (
                          <Link
                            href={`/member-lookup?site=${site}&username=${encodeURIComponent(m.sender)}`}
                            className="text-emerald-400 hover:text-emerald-300 hover:underline"
                          >
                            {m.sender}
                          </Link>
                        ) : "-"}
                      </td>
                      <td className="py-2.5 text-white/80 text-xs break-all max-w-xs truncate">{m.message}</td>
                    </tr>
                  ))}
                  {messages.length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-[#A8A49A]/30 text-xs">No chat messages found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end gap-2 mt-3">
              <Button size="sm" variant="outline" disabled={page <= 0} onClick={() => setPage((p) => p - 1)} className="h-7 w-7 p-0 border-white/[0.06]">
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <span className="text-xs text-[#A8A49A]/40">Page {page + 1}</span>
              <Button size="sm" variant="outline" disabled={messages.length < 50} onClick={() => setPage((p) => p + 1)} className="h-7 w-7 p-0 border-white/[0.06]">
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
