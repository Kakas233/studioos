"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useChatChannels } from "@/hooks/use-studio-data";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Send,
  Plus,
  Hash,
  Users,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import FeatureGate from "@/components/shared/feature-gate";

interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  message_text: string;
  is_hidden?: boolean;
  created_at: string;
}

interface ChatChannel {
  id: string;
  name: string;
  channel_type: string;
  studio_id: string;
}

const roleColors: Record<string, string> = {
  owner: "text-[#C9A84C]",
  admin: "text-[#C9A84C]/80",
  operator: "text-amber-600",
  model: "text-emerald-600",
  accountant: "text-blue-600",
};

export default function ChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { account, studio, loading: authLoading, isAdmin } = useAuth();
  const userRole = account?.role || "model";
  const studioId = account?.studio_id;

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showChannelList, setShowChannelList] = useState(true);

  const { data: channels = [] } = useChatChannels();

  // Auto-select first channel
  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      const accessible = channels.filter((ch) => canAccessChannel(ch as ChatChannel));
      if (accessible.length > 0) setSelectedChannelId(accessible[0].id);
    }
  }, [channels]);

  // Load messages when channel changes
  useEffect(() => {
    if (!selectedChannelId) return;

    const loadMessages = async () => {
      try {
        const res = await fetch(
          `/api/chat?channel_id=${selectedChannelId}&limit=100`
        );
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch {
        setMessages([]);
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

  useEffect(() => {
    if (!authLoading && !account) {
      router.push("/sign-in");
    }
  }, [authLoading, account, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!account) return null;

  function canAccessChannel(channel: ChatChannel) {
    if (isAdmin) return true;
    if (channel.channel_type === "general") return true;
    if (channel.channel_type === "models_only" && userRole === "model")
      return true;
    if (channel.channel_type === "operators_only" && userRole === "operator")
      return true;
    return false;
  }

  const accessibleChannels = channels.filter((ch) =>
    canAccessChannel(ch as ChatChannel)
  );
  const selectedChannel = channels.find(
    (c) => c.id === selectedChannelId
  ) as ChatChannel | undefined;

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChannelId || sending) return;
    const text = messageText.trim();
    setMessageText("");
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const sortedMessages = [...messages]
    .filter((m) => !m.is_hidden)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  const handleCreateChannel = async (data: {
    name: string;
    channel_type: string;
  }) => {
    setCreatingChannel(true);
    try {
      await fetch("/api/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      queryClient.invalidateQueries({ queryKey: ["chatChannels"] });
      setCreateChannelOpen(false);
      toast.success("Channel created");
    } catch {
      toast.error("Failed to create channel");
    } finally {
      setCreatingChannel(false);
    }
  };

  return (
    <FeatureGate requiredTier="pro">
      {/* Chat requires Pro tier */}
      <div className="flex h-[calc(100vh-7rem)] sm:h-[calc(100vh-8rem)] gap-0 sm:gap-4">
        {/* Channel Sidebar - hidden on mobile when a channel is selected */}
        <div
          className={cn(
            "shrink-0 w-full sm:w-64",
            selectedChannelId && !showChannelList
              ? "hidden sm:block"
              : "block"
          )}
        >
          <Card className="bg-[#111111]/80 border-white/[0.04] h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-white/[0.04]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white">
                  Channels
                </CardTitle>
                {isAdmin && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-[#A8A49A]/60 hover:text-[#e8e6e3] hover:bg-white/[0.06] h-7 w-7"
                    onClick={() => setCreateChannelOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-2 flex-1 overflow-auto">
              {accessibleChannels.length === 0 ? (
                <p className="text-sm text-white/50 p-3 text-center">
                  No channels yet
                </p>
              ) : (
                accessibleChannels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setSelectedChannelId(ch.id);
                      setShowChannelList(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                      selectedChannelId === ch.id
                        ? "bg-[#C9A84C]/10 text-[#C9A84C] font-medium"
                        : "text-white/70 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Hash className="w-4 h-4 shrink-0" />
                    <span className="truncate">{ch.name}</span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Area - hidden on mobile when channel list is shown */}
        <Card
          className={cn(
            "flex-1 bg-[#111111]/80 border-white/[0.04] flex flex-col",
            showChannelList && selectedChannelId
              ? "hidden sm:flex"
              : !selectedChannelId
                ? "hidden sm:flex"
                : "flex"
          )}
        >
          <CardHeader className="pb-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowChannelList(true)}
                className="sm:hidden text-[#A8A49A]/60 hover:text-white mr-1"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <Hash className="w-5 h-5 text-white/40" />
              <CardTitle className="text-base sm:text-lg font-semibold text-white">
                {selectedChannel?.name || "Select a channel"}
              </CardTitle>
              {selectedChannel?.channel_type !== "general" &&
                selectedChannel?.channel_type && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {selectedChannel?.channel_type?.replace("_", " ")}
                  </Badge>
                )}
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {sortedMessages.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                sortedMessages.map((msg) => {
                  const isOwn = msg.user_id === account.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          isOwn
                            ? "bg-[#C9A84C]/20 text-white"
                            : "bg-white/[0.06]"
                        } rounded-2xl px-4 py-2.5`}
                      >
                        {!isOwn && (
                          <p
                            className={`text-xs font-semibold ${
                              roleColors[msg.user_role] || "text-white"
                            } mb-0.5`}
                          >
                            {msg.user_name}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.message_text}
                        </p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isOwn ? "text-white/50" : "text-white/40"
                          }`}
                        >
                          {msg.created_at
                            ? format(new Date(msg.created_at), "HH:mm")
                            : ""}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {selectedChannelId && (
            <div className="p-4 border-t border-white/[0.04]">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-white/[0.03] text-white placeholder:text-white/40"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sending}
                  className="bg-[#C9A84C] hover:bg-[#B8973B] text-black"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Create Channel Dialog */}
        <CreateChannelDialog
          open={createChannelOpen}
          onClose={() => setCreateChannelOpen(false)}
          onCreate={(data) => handleCreateChannel(data)}
        />
      </div>
    </FeatureGate>
  );
}

function CreateChannelDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; channel_type: string }) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("general");

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Enter a channel name");
      return;
    }
    onCreate({ name: name.trim(), channel_type: type });
    setName("");
    setType("general");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-white/[0.03]">
        <DialogHeader>
          <DialogTitle className="text-white">Create Channel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Channel Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., announcements"
              className="bg-white/[0.04] border-white/[0.06] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label>Access</Label>
            <Select value={type} onValueChange={(v) => v !== null && setType(v)}>
              <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white">
                <SelectValue placeholder="Channel access" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General (everyone)</SelectItem>
                <SelectItem value="models_only">Models Only</SelectItem>
                <SelectItem value="operators_only">Operators Only</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-[#C9A84C] hover:bg-[#B8973B] text-black"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
