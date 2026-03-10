"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Loader2,
  MessageSquare,
  ArrowLeft,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import SupportHome from "./support-home";
import NewTicketForm from "./new-ticket-form";
import TicketConversation from "./ticket-conversation";

const AGENTS: Record<string, { name: string; title: string }> = {
  luke: { name: "Luke", title: "Support Specialist" },
  maria: { name: "Maria", title: "Customer Success" },
  peter: { name: "Peter", title: "Technical Support" },
};

interface Ticket {
  id: string;
  status: string;
  subject?: string;
  last_message?: string;
  assigned_agent?: string;
  agent_name?: string;
  updated_date?: string;
}

interface SupportChatPanelProps {
  onClose: () => void;
  agentImages?: Record<string, string>;
}

export default function SupportChatPanel({
  onClose,
  agentImages,
}: SupportChatPanelProps) {
  const { account } = useAuth();
  const [view, setView] = useState<
    "home" | "messages" | "new" | "conversation"
  >("home");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [isNewTicket, setIsNewTicket] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Get Supabase access token
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token || null;
      setAccessToken(token);
      return token;
    } catch {
      return null;
    }
  }, []);

  const loadTickets = async () => {
    if (!account) return;
    const token = await getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "list",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      getAccessToken().then(() => loadTickets());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const handleTicketCreated = (ticketId: string, message: string) => {
    setActiveTicketId(ticketId);
    setIsNewTicket(true);
    setInitialMessage(message || "");
    setView("conversation");
    loadTickets();
  };

  const handleOpenTicket = (ticketId: string) => {
    setActiveTicketId(ticketId);
    setIsNewTicket(false);
    setView("conversation");
  };

  const handleBack = () => {
    if (view === "conversation" || view === "new") {
      setView("messages");
      setActiveTicketId(null);
      loadTickets();
    } else {
      setView("home");
    }
  };

  const activeTickets = tickets.filter(
    (t) => t.status !== "resolved" && t.status !== "closed"
  );
  const resolvedTickets = tickets.filter(
    (t) => t.status === "resolved" || t.status === "closed"
  );

  // If not authenticated, show a simple contact form
  if (!account) {
    return (
      <NewTicketForm
        accessToken={null}
        onCreated={() => {}}
        onCancel={onClose}
        onClose={onClose}
        agentImages={agentImages}
        isPublic
      />
    );
  }

  if (view === "home") {
    return (
      <SupportHome
        onClose={onClose}
        onNewConversation={() => setView("new")}
        onViewMessages={() => {
          setView("messages");
          loadTickets();
        }}
        agentImages={agentImages || {}}
        unreadCount={activeTickets.length}
      />
    );
  }

  if (view === "new") {
    return (
      <NewTicketForm
        accessToken={accessToken}
        onCreated={handleTicketCreated}
        onCancel={handleBack}
        onClose={onClose}
        agentImages={agentImages}
      />
    );
  }

  if (view === "conversation" && activeTicketId) {
    return (
      <TicketConversation
        ticketId={activeTicketId}
        accessToken={accessToken}
        agents={AGENTS}
        agentImages={agentImages}
        onBack={handleBack}
        onClose={onClose}
        isNewTicket={isNewTicket}
        initialMessage={initialMessage}
      />
    );
  }

  // Messages list view
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => setView("home")}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-800 flex-1">
          Messages
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-[#B5964D]" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <MessageSquare className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-1">
              No conversations yet
            </p>
            <p className="text-xs text-gray-400">
              Start a new conversation to get help
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activeTickets.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">
                  Active
                </p>
                {activeTickets.map((t) => (
                  <TicketListItem
                    key={t.id}
                    ticket={t}
                    onClick={() => handleOpenTicket(t.id)}
                    agentImages={agentImages}
                  />
                ))}
              </>
            )}
            {resolvedTickets.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">
                  Resolved
                </p>
                {resolvedTickets.map((t) => (
                  <TicketListItem
                    key={t.id}
                    ticket={t}
                    onClick={() => handleOpenTicket(t.id)}
                    agentImages={agentImages}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* New conversation button */}
      <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-gray-100">
        <button
          onClick={() => setView("new")}
          className="w-full py-2.5 bg-[#B5964D] hover:bg-[#A3863F] text-white text-sm font-medium rounded-xl transition-colors"
        >
          New Conversation
        </button>
      </div>
    </div>
  );
}

function TicketListItem({
  ticket,
  onClick,
  agentImages,
}: {
  ticket: Ticket;
  onClick: () => void;
  agentImages?: Record<string, string>;
}) {
  const agentKey = ticket.assigned_agent;
  const agentImg = agentKey ? agentImages?.[agentKey] : undefined;

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  const isResolved =
    ticket.status === "resolved" || ticket.status === "closed";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
    >
      {agentImg ? (
        <img
          src={agentImg}
          alt=""
          className="w-9 h-9 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-gray-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p
            className={cn(
              "text-sm font-medium truncate",
              isResolved ? "text-gray-400" : "text-gray-800"
            )}
          >
            {ticket.agent_name || "Support"}
          </p>
          <span className="text-[10px] text-gray-400 shrink-0 ml-2">
            {timeAgo(ticket.updated_date)}
          </span>
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {ticket.last_message || ticket.subject}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
    </button>
  );
}
