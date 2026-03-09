"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useChatChannels, useStudioAccounts } from "@/hooks/use-studio-data";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Loader2, MessageSquare, Hash, Send, Plus, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, parseISO } from "date-fns";

interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  message_text: string;
  created_at: string;
}

const ROLE_COLORS: Record<string, string> = {
  owner: "text-[#C9A84C]",
  admin: "text-purple-400",
  operator: "text-blue-400",
  model: "text-pink-400",
  accountant: "text-emerald-400",
};

export default function ChatPage() {
  const { account, isAdmin, studio } = useAuth();
  const { data: channels = [], isLoading: channelsLoading } = useChatChannels();
  const { data: accounts = [], isLoading: accountsLoading } = useStudioAccounts();
  const queryClient = useQueryClient();

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMembers = useMemo(
    () => accounts.filter((a) => a.is_active),
    [accounts]
  );

  const selectedChannel = channels.find((c) => c.id === selectedChannelId);

  // Auto-select first channel
  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  // Load messages when channel changes
  useEffect(() => {
    if (!selectedChannelId) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/chat?channel_id=${selectedChannelId}&limit=100`);
        const data = await res.json();
        setMessages(Array.isArray(data) ? data.reverse() : []);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessages();
  }, [selectedChannelId]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!selectedChannelId || !studio?.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${selectedChannelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${selectedChannelId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChannelId, studio?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChannelId || sending) return;

    const text = messageInput.trim();
    setMessageInput("");
    setSending(true);

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: selectedChannelId,
          message_text: text,
        }),
      });
    } finally {
      setSending(false);
    }
  }, [messageInput, selectedChannelId, sending]);

  const handleCreateChannel = useCallback(async () => {
    if (!newChannelName.trim()) return;
    await fetch("/api/chat/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newChannelName.trim() }),
    });
    setNewChannelName("");
    setShowCreateChannel(false);
    queryClient.invalidateQueries({ queryKey: ["chatChannels"] });
  }, [newChannelName, queryClient]);

  const isLoading = channelsLoading || accountsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="flex gap-3 h-[calc(100vh-8rem)]">
      {/* Channel Sidebar */}
      <div className="w-60 shrink-0 bg-[#111111] border border-white/[0.04] rounded-xl flex flex-col overflow-hidden hidden sm:flex">
        <div className="px-3 py-3 border-b border-white/[0.04] flex items-center justify-between">
          <p className="text-xs font-medium text-[#A8A49A]/40 uppercase tracking-wider">
            Channels
          </p>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCreateChannel(true)}
              className="h-6 w-6 text-[#A8A49A]/30 hover:text-white"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {showCreateChannel && (
          <div className="px-2 py-2 border-b border-white/[0.04]">
            <div className="flex gap-1">
              <Input
                placeholder="Channel name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateChannel()}
                className="h-7 text-xs bg-[#0A0A0A] border-white/[0.06] text-white"
                autoFocus
              />
              <Button
                size="icon"
                onClick={handleCreateChannel}
                className="h-7 w-7 bg-[#C9A84C] text-black shrink-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCreateChannel(false)}
                className="h-7 w-7 text-[#A8A49A]/30 shrink-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-1">
          {channels.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <p className="text-xs text-[#A8A49A]/30">No channels yet</p>
            </div>
          ) : (
            channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannelId(channel.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  selectedChannelId === channel.id
                    ? "bg-white/[0.06] text-white"
                    : "text-[#A8A49A]/50 hover:bg-white/[0.02] hover:text-[#e8e6e3]"
                )}
              >
                <Hash className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{channel.name}</span>
              </button>
            ))
          )}
        </div>
        <div className="px-3 py-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-2 text-[#A8A49A]/30">
            <Users className="w-3.5 h-3.5" />
            <span className="text-xs">{activeMembers.length} members</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-[#111111] border border-white/[0.04] rounded-xl flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2">
          {selectedChannel ? (
            <>
              <Hash className="w-4 h-4 text-[#A8A49A]/40" />
              <p className="text-sm font-medium text-white">
                {selectedChannel.name}
              </p>
            </>
          ) : (
            <p className="text-sm text-[#A8A49A]/40">
              {channels.length > 0 ? "Select a channel" : "Team Chat"}
            </p>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-[#A8A49A]/30" />
            </div>
          ) : !selectedChannel ? (
            <div className="flex flex-col items-center justify-center h-full">
              <MessageSquare className="w-12 h-12 text-[#A8A49A]/15 mb-3" />
              <p className="text-sm text-[#A8A49A]/40 mb-1">Team Chat</p>
              <p className="text-xs text-[#A8A49A]/25 text-center max-w-xs">
                Select or create a channel to start chatting with your team.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <MessageSquare className="w-10 h-10 text-[#A8A49A]/15 mb-3" />
              <p className="text-sm text-[#A8A49A]/40 mb-1">
                No messages in #{selectedChannel.name} yet
              </p>
              <p className="text-xs text-[#A8A49A]/25">
                Be the first to say something!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.user_id === account?.id;
                return (
                  <div key={msg.id} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-medium text-white shrink-0">
                      {(msg.user_name?.charAt(0) || "?").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn(
                          "text-xs font-medium",
                          isOwn ? "text-white" : ROLE_COLORS[msg.user_role] || "text-white"
                        )}>
                          {msg.user_name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[8px] capitalize border-transparent opacity-40"
                        >
                          {msg.user_role}
                        </Badge>
                        <span className="text-[10px] text-[#A8A49A]/20">
                          {msg.created_at
                            ? formatDistanceToNow(parseISO(msg.created_at), { addSuffix: true })
                            : ""}
                        </span>
                      </div>
                      <p className="text-sm text-[#e8e6e3] break-words">
                        {msg.message_text}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        {selectedChannel && (
          <div className="px-4 py-3 border-t border-white/[0.04]">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder={`Message #${selectedChannel.name}...`}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="bg-[#0A0A0A] border-white/[0.06] text-white placeholder:text-[#A8A49A]/25"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!messageInput.trim() || sending}
                className="bg-[#C9A84C] hover:bg-[#b8963f] text-black shrink-0"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
