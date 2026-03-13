"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpCircle,
  Star,
} from "lucide-react";

interface TicketMessage {
  role: string;
  content: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface SupportTicket {
  id: string;
  studio_id: string;
  account_id: string;
  subject: string;
  status: string;
  priority: string;
  is_escalated: boolean;
  rating: number | null;
  messages: TicketMessage[];
  created_at: string;
  updated_at: string;
  studio_name: string;
  account_name: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SupportTicketsTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [statuses, setStatuses] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchTickets = async (page = 1, status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (status && status !== "all") {
        params.set("status", status);
      }
      const res = await fetch(`/api/admin/tickets?${params}`);
      const data = await res.json();
      if (!data.error) {
        setTickets(data.tickets || []);
        setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
        if (data.statuses) setStatuses(data.statuses);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleStatusFilter = (status: string | null) => {
    const s = status || "all";
    setSelectedStatus(s);
    fetchTickets(1, s);
  };

  const handlePageChange = (newPage: number) => {
    fetchTickets(newPage, selectedStatus);
  };

  const handleUpdateTicket = async (
    ticketId: string,
    update: { status?: string; is_escalated?: boolean }
  ) => {
    setUpdating(ticketId);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: ticketId, ...update }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTickets(pagination.page, selectedStatus);
      }
    } catch {
      // silent
    } finally {
      setUpdating(null);
    }
  };

  const statusConfig: Record<string, { icon: typeof Clock; color: string }> = {
    open: { icon: AlertCircle, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    in_progress: { icon: Clock, color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    waiting: { icon: Clock, color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    resolved: { icon: CheckCircle2, color: "bg-green-500/10 text-green-400 border-green-500/20" },
    closed: { icon: CheckCircle2, color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  };

  const priorityColors: Record<string, string> = {
    low: "text-gray-400",
    medium: "text-yellow-400",
    high: "text-orange-400",
    urgent: "text-red-400",
  };

  // Stats
  const openCount = tickets.filter((t) => t.status === "open").length;
  const escalatedCount = tickets.filter((t) => t.is_escalated).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Support Tickets</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {pagination.total} total &bull; {openCount} open &bull;{" "}
            {escalatedCount} escalated
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedStatus} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white h-8 text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-white/10">
              <SelectItem value="all" className="text-white">All statuses</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s} className="text-white">
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchTickets(pagination.page, selectedStatus)}
            className="text-gray-400 hover:text-white h-8"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#AA0608] animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No support tickets found.</div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => {
            const isExpanded = expandedId === ticket.id;
            const conf = statusConfig[ticket.status] || statusConfig.open;
            const StatusIcon = conf.icon;
            const messageCount = Array.isArray(ticket.messages) ? ticket.messages.length : 0;

            return (
              <Card
                key={ticket.id}
                className="bg-[#0A0A0A] border-white/10 hover:border-white/20 transition-colors cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <StatusIcon className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge className={`${conf.color} text-[10px]`}>
                            {ticket.status.replace(/_/g, " ")}
                          </Badge>
                          {ticket.is_escalated && (
                            <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">
                              <ArrowUpCircle className="w-3 h-3 mr-0.5" />
                              Escalated
                            </Badge>
                          )}
                          <span className={`text-[10px] font-medium ${priorityColors[ticket.priority] || "text-gray-400"}`}>
                            {ticket.priority}
                          </span>
                          {ticket.rating !== null && (
                            <span className="text-[10px] text-yellow-400 flex items-center gap-0.5">
                              <Star className="w-3 h-3" /> {ticket.rating}/5
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white font-medium truncate">
                          {ticket.subject}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {ticket.studio_name} &bull; {ticket.account_name} &bull;{" "}
                          <MessageSquare className="w-3 h-3 inline" /> {messageCount} messages
                        </p>

                        {isExpanded && (
                          <div className="mt-3 space-y-3">
                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {ticket.status !== "closed" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateTicket(ticket.id, { status: "closed" });
                                  }}
                                  disabled={updating === ticket.id}
                                  className="text-gray-400 hover:text-white text-xs h-7"
                                >
                                  {updating === ticket.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                  )}
                                  Close
                                </Button>
                              )}
                              {ticket.status === "closed" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateTicket(ticket.id, { status: "open" });
                                  }}
                                  disabled={updating === ticket.id}
                                  className="text-blue-400 hover:text-blue-300 text-xs h-7"
                                >
                                  Reopen
                                </Button>
                              )}
                              {!ticket.is_escalated && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateTicket(ticket.id, { is_escalated: true });
                                  }}
                                  disabled={updating === ticket.id}
                                  className="text-red-400 hover:text-red-300 text-xs h-7"
                                >
                                  <ArrowUpCircle className="w-3 h-3 mr-1" /> Escalate
                                </Button>
                              )}
                            </div>

                            {/* Messages */}
                            {messageCount > 0 && (
                              <div className="space-y-2 max-h-80 overflow-y-auto">
                                {ticket.messages.map((msg, i) => (
                                  <div
                                    key={i}
                                    className={`p-2 rounded text-xs ${
                                      msg.role === "agent" || msg.role === "ai"
                                        ? "bg-blue-500/5 border border-blue-500/10 text-blue-200"
                                        : "bg-white/5 border border-white/10 text-gray-300"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-[10px] uppercase tracking-wider text-gray-500">
                                        {msg.role === "ai" ? "AI Assistant" : msg.role || "user"}
                                      </span>
                                      {msg.timestamp && (
                                        <span className="text-[10px] text-gray-600">
                                          {new Date(msg.timestamp).toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-600 whitespace-nowrap shrink-0">
                      {new Date(ticket.updated_at).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
              className="text-gray-400 hover:text-white h-7 w-7 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
              className="text-gray-400 hover:text-white h-7 w-7 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
