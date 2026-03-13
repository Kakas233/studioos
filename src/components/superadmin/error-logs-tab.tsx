"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";

interface ErrorLog {
  id: string;
  studio_id: string | null;
  error_type: string;
  message: string;
  stack_trace: string | null;
  url: string | null;
  user_agent: string | null;
  account_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ErrorLogsTab() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [errorTypes, setErrorTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchErrors = async (page = 1, errorType?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (errorType && errorType !== "all") {
        params.set("error_type", errorType);
      }
      const res = await fetch(`/api/admin/errors?${params}`);
      const data = await res.json();
      if (!data.error) {
        setErrors(data.errors || []);
        setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
        if (data.errorTypes) setErrorTypes(data.errorTypes);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, []);

  const handleTypeChange = (type: string | null) => {
    const t = type || "all";
    setSelectedType(t);
    fetchErrors(1, t);
  };

  const handlePageChange = (newPage: number) => {
    fetchErrors(newPage, selectedType);
  };

  const filteredErrors = searchQuery
    ? errors.filter(
        (e) =>
          e.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.error_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.studio_id?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : errors;

  const typeColors: Record<string, string> = {
    stripe_webhook: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    stripe_webhook_processed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    client_error: "bg-red-500/10 text-red-400 border-red-500/20",
    api_error: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    rate_limit_login: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    rate_limit_2fa: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Error Logs</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {pagination.total} total entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search errors..."
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-8 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Select value={selectedType} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white h-8 text-sm">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-white/10">
              <SelectItem value="all" className="text-white">All types</SelectItem>
              {errorTypes.map((type) => (
                <SelectItem key={type} value={type} className="text-white">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchErrors(pagination.page, selectedType)}
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
      ) : filteredErrors.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No error logs found.</div>
      ) : (
        <div className="space-y-2">
          {filteredErrors.map((err) => {
            const isExpanded = expandedId === err.id;
            const typeClass =
              typeColors[err.error_type] ||
              "bg-gray-500/10 text-gray-400 border-gray-500/20";

            return (
              <Card
                key={err.id}
                className="bg-[#0A0A0A] border-white/10 hover:border-white/20 transition-colors cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : err.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${typeClass} text-[10px] shrink-0`}>
                            {err.error_type}
                          </Badge>
                          {err.studio_id && (
                            <span className="text-[10px] text-gray-600 truncate">
                              Studio: {err.studio_id.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white truncate">
                          {err.message}
                        </p>
                        {isExpanded && (
                          <div className="mt-3 space-y-2">
                            <div className="text-xs text-gray-400 space-y-1">
                              <p><span className="text-gray-600">ID:</span> {err.id}</p>
                              {err.studio_id && (
                                <p><span className="text-gray-600">Studio ID:</span> {err.studio_id}</p>
                              )}
                              {err.account_id && (
                                <p><span className="text-gray-600">Account ID:</span> {err.account_id}</p>
                              )}
                              {err.url && (
                                <p><span className="text-gray-600">URL:</span> {err.url}</p>
                              )}
                              {err.user_agent && (
                                <p className="truncate"><span className="text-gray-600">User Agent:</span> {err.user_agent}</p>
                              )}
                              <p><span className="text-gray-600">Message:</span> {err.message}</p>
                            </div>
                            {err.stack_trace && (
                              <pre className="text-[10px] text-red-300/60 bg-red-500/5 border border-red-500/10 rounded p-2 overflow-x-auto max-h-40 whitespace-pre-wrap">
                                {err.stack_trace}
                              </pre>
                            )}
                            {err.metadata && Object.keys(err.metadata).length > 0 && (
                              <pre className="text-[10px] text-gray-400 bg-white/5 border border-white/10 rounded p-2 overflow-x-auto max-h-32 whitespace-pre-wrap">
                                {JSON.stringify(err.metadata, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-600 whitespace-nowrap shrink-0">
                      {new Date(err.created_at).toLocaleString()}
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
