"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: LucideIcon }
> = {
  active: {
    label: "Active",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    icon: CheckCircle2,
  },
  trialing: {
    label: "Trialing",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: Clock,
  },
  grace_period: {
    label: "Grace Period",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    icon: AlertTriangle,
  },
  suspended: {
    label: "Suspended",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    icon: XCircle,
  },
};

const TIER_COLORS: Record<string, string> = {
  elite: "bg-purple-500/10 text-purple-400",
  pro: "bg-blue-500/10 text-blue-400",
  starter: "bg-yellow-500/10 text-yellow-400",
  free: "bg-gray-500/10 text-gray-400",
};

interface Studio {
  id: string;
  name: string;
  subdomain: string;
  subscription_tier: string;
  subscription_status: string;
  current_model_count?: number;
  model_limit?: number;
  created_date: string;
  last_payment_date?: string;
  next_payment_date?: string;
  grace_period_ends_at?: string;
  [key: string]: unknown;
}

export default function SubscriptionManager({
  studios,
}: {
  studios: Studio[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_date");
  const [sortDir, setSortDir] = useState(-1);

  const filtered = (studios || [])
    .filter((s) => {
      const matchSearch =
        !search ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.subdomain?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        s.subscription_status === statusFilter;
      const matchTier =
        tierFilter === "all" || s.subscription_tier === tierFilter;
      return matchSearch && matchStatus && matchTier;
    })
    .sort((a, b) => {
      const aVal = String(a[sortBy] || "");
      const bVal = String(b[sortBy] || "");
      return sortDir * (aVal > bVal ? 1 : aVal < bVal ? -1 : 0);
    });

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortDir((d) => d * -1);
    else {
      setSortBy(field);
      setSortDir(-1);
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortDir === 1 ? (
      <ChevronUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-1" />
    );
  };

  const daysSince = (dateStr?: string) => {
    if (!dateStr) return "\u2014";
    const d = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 86400000
    );
    return d === 0 ? "Today" : `${d}d ago`;
  };

  const billingCycles = (s: Studio) => {
    if (!s.last_payment_date || !s.created_date) return "\u2014";
    const months = Math.max(
      1,
      Math.round(
        (new Date(s.last_payment_date).getTime() -
          new Date(s.created_date).getTime()) /
          (30 * 86400000)
      )
    );
    return months;
  };

  return (
    <Card className="bg-[#0A0A0A] border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#AA0608]" /> Subscription
          Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search studios..."
              className="pl-9 bg-white/5 border-white/10 text-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => v !== null && setStatusFilter(v)}>
            <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/10">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trialing">Trialing</SelectItem>
              <SelectItem value="grace_period">Grace Period</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tierFilter} onValueChange={(v) => v !== null && setTierFilter(v)}>
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/10">
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="elite">Elite</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="free">Free</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead
                  className="text-gray-400 cursor-pointer"
                  onClick={() => toggleSort("name")}
                >
                  Studio <SortIcon field="name" />
                </TableHead>
                <TableHead
                  className="text-gray-400 cursor-pointer"
                  onClick={() => toggleSort("subscription_tier")}
                >
                  Plan <SortIcon field="subscription_tier" />
                </TableHead>
                <TableHead
                  className="text-gray-400 cursor-pointer"
                  onClick={() => toggleSort("subscription_status")}
                >
                  Status <SortIcon field="subscription_status" />
                </TableHead>
                <TableHead className="text-gray-400">Models</TableHead>
                <TableHead
                  className="text-gray-400 cursor-pointer"
                  onClick={() => toggleSort("created_date")}
                >
                  Created <SortIcon field="created_date" />
                </TableHead>
                <TableHead className="text-gray-400">Cycles</TableHead>
                <TableHead
                  className="text-gray-400 cursor-pointer"
                  onClick={() => toggleSort("last_payment_date")}
                >
                  Last Payment <SortIcon field="last_payment_date" />
                </TableHead>
                <TableHead className="text-gray-400">
                  Next Payment
                </TableHead>
                <TableHead className="text-gray-400">
                  Grace Ends
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const sc =
                  STATUS_CONFIG[s.subscription_status] ||
                  STATUS_CONFIG.suspended;
                const StatusIcon = sc.icon;
                return (
                  <TableRow key={s.id} className="border-white/5">
                    <TableCell>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {s.name}
                        </p>
                        <p className="text-gray-600 text-xs">
                          {s.subdomain}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          TIER_COLORS[s.subscription_tier] ||
                          TIER_COLORS.free
                        }
                      >
                        {(s.subscription_tier || "free").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={sc.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {s.current_model_count || 0}/{s.model_limit || 0}
                    </TableCell>
                    <TableCell className="text-gray-400 text-xs">
                      {s.created_date
                        ? new Date(s.created_date).toLocaleDateString()
                        : "\u2014"}
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {billingCycles(s)}
                    </TableCell>
                    <TableCell className="text-gray-400 text-xs">
                      {s.last_payment_date ? (
                        <span>
                          {new Date(
                            s.last_payment_date
                          ).toLocaleDateString()}
                          <br />
                          <span className="text-gray-600">
                            {daysSince(s.last_payment_date)}
                          </span>
                        </span>
                      ) : (
                        "\u2014"
                      )}
                    </TableCell>
                    <TableCell className="text-gray-400 text-xs">
                      {s.next_payment_date
                        ? new Date(
                            s.next_payment_date
                          ).toLocaleDateString()
                        : "\u2014"}
                    </TableCell>
                    <TableCell>
                      {s.grace_period_ends_at ? (
                        <span className="text-yellow-400 text-xs">
                          {new Date(
                            s.grace_period_ends_at
                          ).toLocaleDateString()}
                        </span>
                      ) : (
                        "\u2014"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-gray-500 py-8"
                  >
                    No studios match filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-gray-600">
          Showing {filtered.length} of {studios?.length || 0} studios
        </p>
      </CardContent>
    </Card>
  );
}
