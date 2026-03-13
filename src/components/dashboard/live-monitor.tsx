"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, User } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useCamAccounts, useStudioAccounts, useStreamingSessions, useModelCurrentActivity } from "@/hooks/use-studio-data";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { getShowType } from "@/lib/show-types";

export default function LiveMonitor() {
  const { account } = useAuth();

  const { data: camAccounts = [] } = useCamAccounts();
  const { data: allAccounts = [] } = useStudioAccounts();
  const models = allAccounts.filter((a) => a.role === "model");

  const activeModels = models.filter((m) => m.is_active !== false);
  const modelIds = new Set(activeModels.map((m) => m.id));
  const validCamAccounts = camAccounts.filter((ca) => modelIds.has(ca.model_id));
  const validCamIds = useMemo(() => validCamAccounts.map((ca) => ca.id), [validCamAccounts]);

  const { data: rawSessions = [] } = useStreamingSessions(validCamIds);
  const { data: realTimeActivity = {} } = useModelCurrentActivity();

  const validCamIdSet = new Set(validCamIds);

  const getModelName = (camAccount: typeof camAccounts[0] | undefined) => {
    const model = models.find((m) => m.id === camAccount?.model_id);
    return model?.first_name || "Unknown";
  };

  const getCamAccount = (session: typeof rawSessions[0]) => validCamAccounts.find((ca) => ca.id === session.cam_account_id);

  // Merge real-time activity into sessions: override is_currently_live and show_type
  const validSessions = useMemo(() => {
    return rawSessions
      .filter((s) => validCamIdSet.has(s.cam_account_id))
      .map((s) => {
        const rt = realTimeActivity[s.cam_account_id];
        if (rt) {
          return {
            ...s,
            is_currently_live: rt.is_live,
            show_type: rt.show_type as typeof s.show_type,
          };
        }
        return s;
      });
  }, [rawSessions, realTimeActivity, validCamIdSet]);

  const liveSessions = validSessions.filter((s) => s.is_currently_live);
  const offlineSessions = validSessions.filter((s) => !s.is_currently_live);

  return (
    <Card className="bg-[#111111]/80 border-white/[0.04]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-[#C9A84C]" />
          Live Monitor
          {liveSessions.length > 0 && <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
          <span className="text-sm font-normal text-[#A8A49A]/40 ml-auto">{liveSessions.length} online</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {validSessions.length === 0 ? (
          <div className="text-center py-8 text-[#A8A49A]/30">
            <Radio className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No cam accounts tracked yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {liveSessions.map((session) => {
              const ca = getCamAccount(session);
              const style = getShowType(session.show_type);
              const rt = realTimeActivity[session.cam_account_id];
              return (
                <div key={session.id} className="flex items-center justify-between p-3 bg-emerald-500/[0.06] rounded-lg border border-emerald-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-500/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">{getModelName(ca)}</p>
                      <p className="text-xs text-[#A8A49A]/40">{ca?.platform} {"\u00B7"} {ca?.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${style.dot} animate-pulse`} />
                    <Badge className={`${style.bg} ${style.color} text-xs border-0`}>{style.label}</Badge>
                  </div>
                </div>
              );
            })}
            {offlineSessions.map((session) => {
              const ca = getCamAccount(session);
              const rt = realTimeActivity[session.cam_account_id];
              const offlineSince = rt?.updated_at
                ? formatDistanceToNow(new Date(rt.updated_at.replace(" ", "T") + "Z"), { addSuffix: true })
                : session.scraped_at
                  ? formatDistanceToNow(new Date(session.scraped_at), { addSuffix: true })
                  : null;
              return (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border border-white/[0.04] opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/[0.04] rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-[#A8A49A]/30" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">{getModelName(ca)}</p>
                      <p className="text-xs text-[#A8A49A]/30">{ca?.platform} {"\u00B7"} {ca?.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/[0.04] text-[#A8A49A]/40 text-xs border-0">Offline</Badge>
                    {offlineSince && <span className="text-[10px] text-[#A8A49A]/30">{offlineSince}</span>}
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
