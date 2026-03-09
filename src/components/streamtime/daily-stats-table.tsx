"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Eye, Lock, Users, Coffee, WifiOff } from "lucide-react";
import { format, parseISO } from "date-fns";

/* eslint-disable @typescript-eslint/no-explicit-any */

function formatMinutes(mins: number | null | undefined): string {
  if (!mins || mins === 0) return "\u2014";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

interface DailyStatsTableProps {
  stats: any[];
  camAccounts: any[];
  models: any[];
}

export default function DailyStatsTable({
  stats,
  camAccounts,
  models,
}: DailyStatsTableProps) {
  const getModelName = (stat: any) => {
    const model = models.find((m: any) => m.id === stat.model_id);
    return model?.first_name || "Unknown";
  };

  const getCamAccount = (stat: any) =>
    camAccounts.find((ca: any) => ca.id === stat.cam_account_id);

  const sorted = [...stats].sort((a, b) => {
    const dateCompare = (b.date || "").localeCompare(a.date || "");
    if (dateCompare !== 0) return dateCompare;
    return (getModelName(a) || "").localeCompare(getModelName(b) || "");
  });

  return (
    <Card className="bg-[#111111]/80 border-white/[0.04]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#C9A84C]" />
          Daily Stream Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <div className="text-center py-8 text-[#A8A49A]/30">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No streaming data collected yet</p>
            <p className="text-xs mt-1">
              Stats will appear after the scraper runs
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.04]">
                  <TableHead className="text-xs text-[#A8A49A]/40">
                    Date
                  </TableHead>
                  <TableHead className="text-xs text-[#A8A49A]/40">
                    Model
                  </TableHead>
                  <TableHead className="text-xs text-[#A8A49A]/40">
                    Platform
                  </TableHead>
                  <TableHead className="text-xs text-center text-[#A8A49A]/40">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      Online
                    </div>
                  </TableHead>
                  <TableHead className="text-xs text-center text-[#A8A49A]/40">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3" />
                      Public
                    </div>
                  </TableHead>
                  <TableHead className="text-xs text-center text-[#A8A49A]/40">
                    <div className="flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3" />
                      Private
                    </div>
                  </TableHead>
                  <TableHead className="text-xs text-center text-[#A8A49A]/40">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="w-3 h-3" />
                      Group
                    </div>
                  </TableHead>
                  <TableHead className="text-xs text-center text-[#A8A49A]/40">
                    <div className="flex items-center justify-center gap-1">
                      <Coffee className="w-3 h-3" />
                      Away
                    </div>
                  </TableHead>
                  <TableHead className="text-xs text-center text-[#A8A49A]/40">
                    <div className="flex items-center justify-center gap-1">
                      <WifiOff className="w-3 h-3" />
                      Offline
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((stat: any) => {
                  const ca = getCamAccount(stat);
                  return (
                    <TableRow key={stat.id} className="border-white/[0.04]">
                      <TableCell className="text-sm font-medium text-white">
                        {format(parseISO(stat.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm text-white">
                        {getModelName(stat)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs border-white/[0.06] text-[#A8A49A]/60"
                        >
                          {ca?.platform || "\u2014"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm font-semibold text-[#C9A84C]">
                        {formatMinutes(stat.total_minutes)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-emerald-400">
                        {formatMinutes(stat.public_minutes)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-purple-400">
                        {formatMinutes(stat.private_minutes)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-blue-400">
                        {formatMinutes(stat.group_minutes)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-yellow-400">
                        {formatMinutes(stat.break_minutes)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-[#A8A49A]/40">
                        {formatMinutes(stat.offline_minutes)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
