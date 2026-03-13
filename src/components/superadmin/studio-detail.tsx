"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  Users,
  DollarSign,
  Calendar,
  Loader2,
  Trash2,
  Settings,
  LogIn,
  Eye,
  type LucideIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StudioDetailProps {
  studioId: string;
  onBack: () => void;
  onDelete: (studioId: string, studioName: string) => void;
}

interface Account {
  id: string;
  first_name: string;
  email: string;
  role: string;
  cut_percentage?: number;
  is_active: boolean;
}

interface Earning {
  id: string;
  shift_date?: string;
  model_name?: string;
  total_gross_usd?: number;
  model_pay_usd?: number;
  operator_pay_usd?: number;
}

interface StudioData {
  studio: {
    name?: string;
    subdomain?: string;
    subscription_tier?: string;
    subscription_status?: string;
    model_limit?: number;
    current_model_count?: number;
    timezone?: string;
    payout_frequency?: string;
    created_at?: string;
    created_date?: string;
  };
  accounts: Account[];
  earnings: Earning[];
  shifts: unknown[];
  rooms: unknown[];
}

export default function StudioDetail({
  studioId,
  onBack,
  onDelete,
}: StudioDetailProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudioData | null>(null);
  const [error, setError] = useState("");
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    fetchStudioDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studioId]);

  const fetchStudioDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({

          action: "getStudioDetails",
          payload: { studio_id: studioId },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error);
      }
    } catch {
      setError("Failed to load studio details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#AA0608] animate-spin" />
      </div>
    );
  }

  const studio = data?.studio;
  const accounts = data?.accounts || [];
  const earnings = data?.earnings || [];
  const shifts = data?.shifts || [];
  const rooms = data?.rooms || [];

  const totalRevenue = earnings.reduce(
    (sum, e) => sum + (e.total_gross_usd || 0),
    0
  );
  const models = accounts.filter((a) => a.role === "model");
  const operators = accounts.filter((a) => a.role === "operator");

  const handleImpersonate = async (readOnly: boolean) => {
    setImpersonating(true);
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({

          action: "impersonateStudio",
          payload: { studio_id: studioId, read_only: readOnly },
        }),
      });
      const json = await res.json();
      if (json.success) {
        // Impersonation session is set via httpOnly cookie by the API
        localStorage.setItem("studioos_superadmin_return", "true");
        window.location.href =
          "/dashboard?studio=" + (studio?.subdomain || "");
      } else {
        alert(json.error || "Failed to access studio");
      }
    } catch {
      alert("Failed to access studio");
    } finally {
      setImpersonating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-[#AA0608]/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#AA0608]" />
            </div>
            <div>
              <h1 className="text-lg font-bold">
                {studio?.name || "Studio"}
              </h1>
              <p className="text-xs text-gray-500">
                {studio?.subdomain} &bull; {studio?.subscription_tier} (
                {studio?.subscription_status})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={impersonating}
              onClick={() => handleImpersonate(true)}
              className="text-blue-400 hover:text-blue-300"
            >
              {impersonating ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Eye className="w-4 h-4 mr-1" />
              )}
              View Only
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={impersonating}
              onClick={() => handleImpersonate(false)}
              className="text-[#C9A84C] hover:text-[#C9A84C]/80"
            >
              <LogIn className="w-4 h-4 mr-1" />
              Enter Studio
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(studioId, studio?.name || "")}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Delete Studio
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat icon={Users} label="Models" value={models.length} />
          <MiniStat
            icon={Users}
            label="Operators"
            value={operators.length}
          />
          <MiniStat
            icon={DollarSign}
            label="Total Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
          />
          <MiniStat
            icon={Calendar}
            label="Total Shifts"
            value={shifts.length}
          />
        </div>

        {/* Studio Config */}
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#AA0608]" /> Studio
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Subscription</p>
                <p className="text-white font-medium">
                  {studio?.subscription_tier} (
                  {studio?.subscription_status})
                </p>
              </div>
              <div>
                <p className="text-gray-500">Model Limit</p>
                <p className="text-white font-medium">
                  {studio?.current_model_count || 0} /{" "}
                  {studio?.model_limit || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Timezone</p>
                <p className="text-white font-medium">
                  {studio?.timezone || "UTC"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Payout Frequency</p>
                <p className="text-white font-medium capitalize">
                  {studio?.payout_frequency || "biweekly"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Rooms</p>
                <p className="text-white font-medium">{rooms.length}</p>
              </div>
              <div>
                <p className="text-gray-500">Created</p>
                <p className="text-white font-medium">
                  {(studio?.created_at || studio?.created_date)
                    ? new Date(studio.created_at || studio.created_date!).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accounts Table */}
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#AA0608]" /> Accounts (
              {accounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-400">Name</TableHead>
                    <TableHead className="text-gray-400">Email</TableHead>
                    <TableHead className="text-gray-400">Role</TableHead>
                    <TableHead className="text-gray-400">Cut %</TableHead>
                    <TableHead className="text-gray-400">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((acc) => (
                    <TableRow key={acc.id} className="border-white/5">
                      <TableCell className="text-white font-medium">
                        {acc.first_name}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {acc.email}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-white/10 text-gray-300 border-white/10 capitalize">
                          {acc.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {acc.cut_percentage || 0}%
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            acc.is_active
                              ? "bg-green-500/10 text-green-400"
                              : "bg-red-500/10 text-red-400"
                          }
                        >
                          {acc.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Earnings */}
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#AA0608]" /> Recent
              Earnings ({earnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-400">Date</TableHead>
                    <TableHead className="text-gray-400">Model</TableHead>
                    <TableHead className="text-gray-400">
                      Gross USD
                    </TableHead>
                    <TableHead className="text-gray-400">
                      Model Pay
                    </TableHead>
                    <TableHead className="text-gray-400">
                      Operator Pay
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.slice(0, 20).map((e) => (
                    <TableRow key={e.id} className="border-white/5">
                      <TableCell className="text-gray-400">
                        {e.shift_date || "N/A"}
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {e.model_name || "N/A"}
                      </TableCell>
                      <TableCell className="text-green-400">
                        ${(e.total_gross_usd || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        ${(e.model_pay_usd || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        ${(e.operator_pay_usd || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="bg-[#111] border-white/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-[#AA0608]" />
          <span className="text-xs text-gray-500">{label}</span>
        </div>
        <p className="text-xl font-bold text-white">{value}</p>
      </CardContent>
    </Card>
  );
}
