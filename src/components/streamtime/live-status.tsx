"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, User } from "lucide-react";
import { getShowType } from "@/lib/show-types";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/lib/supabase/types";
import type { ModelActivity } from "@/hooks/use-studio-data";

type StreamingSession = Database["public"]["Tables"]["streaming_sessions"]["Row"];
type CamAccount = Database["public"]["Tables"]["cam_accounts"]["Row"];
type Account = Database["public"]["Tables"]["accounts"]["Row"];

interface ModelGroup {
  model: Account | undefined;
  platforms: {
    camAccount: CamAccount;
    session: StreamingSession | undefined;
    isLive: boolean;
    showType: string;
    scrapedAt: string | undefined;
    activityUpdatedAt: string | null;
  }[];
}

interface LiveStatusProps {
  sessions: StreamingSession[];
  camAccounts: CamAccount[];
  models: Account[];
  realTimeActivity?: Record<string, ModelActivity>;
  compact?: boolean;
}

export default function LiveStatus({ sessions, camAccounts, models, realTimeActivity = {}, compact = false }: LiveStatusProps) {
  const modelIds = new Set(models.map((m) => m.id));
  const validCamAccounts = camAccounts.filter((ca) => modelIds.has(ca.model_id) && ca.is_active !== false);
  const validCamIds = new Set(validCamAccounts.map((ca) => ca.id));
  const validSessions = sessions.filter((s) => validCamIds.has(s.cam_account_id));

  const modelGroups = useMemo(() => {
    const groups: Record<string, ModelGroup> = {};
    validCamAccounts.forEach((ca) => {
      if (!groups[ca.model_id]) {
        const model = models.find((m) => m.id === ca.model_id);
        groups[ca.model_id] = { model, platforms: [] };
      }
      const session = validSessions.find((s) => s.cam_account_id === ca.id);
      const rt = realTimeActivity[ca.id];

      // Real-time activity overrides scraped session data
      const showType = rt ? rt.show_type : (session?.show_type || "offline");
      const isLive = rt ? rt.is_live : (session?.is_currently_live === true);

      groups[ca.model_id].platforms.push({
        camAccount: ca,
        session,
        isLive,
        showType,
        scrapedAt: session?.scraped_at,
        activityUpdatedAt: rt?.updated_at || null,
      });
    });
    return Object.values(groups).sort((a, b) => {
      const aLive = a.platforms.some((p) => p.isLive);
      const bLive = b.platforms.some((p) => p.isLive);
      if (aLive !== bLive) return bLive ? 1 : -1;
      return (a.model?.first_name || "").localeCompare(b.model?.first_name || "");
    });
  }, [validCamAccounts, validSessions, models, realTimeActivity]);

  const totalLive = modelGroups.filter((g) => g.platforms.some((p) => p.isLive)).length;

  return (
    <Card className="bg-[#111111]/80 border-white/[0.04]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-[#C9A84C]" />
          Live Now
          {totalLive > 0 && <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
          <span className="text-sm font-normal text-[#A8A49A]/40 ml-auto">{totalLive} online</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {modelGroups.length === 0 ? (
          <div className="text-center py-6 text-[#A8A49A]/30">
            <Radio className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No cam accounts tracked yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {modelGroups.map((group) => {
              const isLive = group.platforms.some((p) => p.isLive);
              const latestUpdate = group.platforms
                .map((p) => p.activityUpdatedAt || p.scrapedAt)
                .filter(Boolean)
                .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

              return (
                <div
                  key={group.model?.id || "unknown"}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    isLive ? "bg-emerald-500/[0.06] border-emerald-500/10" : "border-white/[0.04] opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isLive ? "bg-emerald-500/10" : "bg-white/[0.04]"
                      }`}
                    >
                      <User className={`w-4 h-4 ${isLive ? "text-emerald-400" : "text-[#A8A49A]/30"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-white truncate">{group.model?.first_name || "Unknown"}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {group.platforms.map((p) => {
                          const style = getShowType(p.showType);
                          return (
                            <Badge
                              key={p.camAccount.id}
                              className={`text-[9px] px-1.5 py-0 border-0 ${
                                p.isLive ? `${style.bg} ${style.color}` : "bg-white/[0.03] text-[#A8A49A]/30"
                              }`}
                            >
                              {p.camAccount.platform}
                              {p.isLive && ` · ${style.label}`}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isLive ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    ) : (
                      latestUpdate && (
                        <span className="text-[10px] text-[#A8A49A]/25">
                          {formatDistanceToNow(new Date(latestUpdate.includes("T") ? latestUpdate : latestUpdate.replace(" ", "T") + "Z"), { addSuffix: true })}
                        </span>
                      )
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
