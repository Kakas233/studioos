"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getShowType } from "@/lib/show-types";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface LiveStatusCardProps {
  sessions: any[];
  camAccounts: any[];
  models: any[];
}

export default function LiveStatusCard({
  sessions,
  camAccounts,
  models,
}: LiveStatusCardProps) {
  const modelIds = new Set(models.map((m: any) => m.id));
  const validCamAccounts = camAccounts.filter((ca: any) =>
    modelIds.has(ca.model_id)
  );
  const validCamIds = new Set(validCamAccounts.map((ca: any) => ca.id));

  const getModelName = (camAccount: any) => {
    const model = models.find((m: any) => m.id === camAccount?.model_id);
    return model?.first_name || "Unknown";
  };

  const getCamAccount = (session: any) =>
    validCamAccounts.find((ca: any) => ca.id === session.cam_account_id);

  const validSessions = sessions.filter((s: any) =>
    validCamIds.has(s.cam_account_id)
  );
  const liveSessions = validSessions.filter((s: any) => s.is_currently_live);
  const offlineSessions = validSessions.filter(
    (s: any) => !s.is_currently_live
  );

  return (
    <Card className="bg-[#111111]/80 border-white/[0.04]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-[#C9A84C]" />
          Live Now
          {liveSessions.length > 0 && (
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          )}
          <span className="text-sm font-normal text-[#A8A49A]/40 ml-auto">
            {liveSessions.length} online
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {validSessions.length === 0 ? (
          <div className="text-center py-6 text-[#A8A49A]/30">
            <Radio className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No cam accounts tracked yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {liveSessions.map((session: any) => {
              const ca = getCamAccount(session);
              const style = getShowType(session.show_type);
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-emerald-500/[0.06] rounded-lg border border-emerald-500/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-500/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">
                        {getModelName(ca)}
                      </p>
                      <p className="text-xs text-[#A8A49A]/40">
                        {ca?.platform} &middot; {ca?.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${style.dot} animate-pulse`}
                    />
                    <Badge
                      className={`${style.bg} ${style.color} text-xs border-0`}
                    >
                      {style.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {offlineSessions.map((session: any) => {
              const ca = getCamAccount(session);
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-white/[0.04] opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/[0.04] rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-[#A8A49A]/30" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">
                        {getModelName(ca)}
                      </p>
                      <p className="text-xs text-[#A8A49A]/30">
                        {ca?.platform} &middot; {ca?.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/[0.04] text-[#A8A49A]/40 text-xs border-0">
                      Offline
                    </Badge>
                    {session.scraped_at && (
                      <span className="text-[10px] text-[#A8A49A]/30">
                        {formatDistanceToNow(new Date(session.scraped_at), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
