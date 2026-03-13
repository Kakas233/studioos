"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

// Human-readable entity labels
const ENTITY_LABELS: Record<string, string> = {
  accounts: "Team Member",
  shifts: "Shift",
  earnings: "Earnings",
  payouts: "Payout",
  cam_accounts: "Cam Account",
  rooms: "Room",
  global_settings: "Studio Settings",
  member_alerts: "Member Alert",
  studios: "Studio",
  assignments: "Assignment",
  chat_channels: "Chat Channel",
  chat_messages: "Chat Message",
  support_tickets: "Support Ticket",
};

// Friendly field labels for the diff view
const FIELD_LABELS: Record<string, string> = {
  first_name: "First Name",
  last_name: "Last Name",
  email: "Email",
  role: "Role",
  is_active: "Active",
  cut_percentage: "Cut %",
  operator_cut_percentage: "Operator Cut %",
  weekly_goal_hours: "Weekly Goal (hrs)",
  weekly_goal_enabled: "Weekly Goal",
  works_alone: "Works Alone",
  payout_method: "Payout Method",
  start_time: "Start Time",
  end_time: "End Time",
  status: "Status",
  total_gross_usd: "Gross (USD)",
  model_pay_usd: "Model Pay (USD)",
  operator_pay_usd: "Operator Pay (USD)",
  studio_cut_usd: "Studio Cut (USD)",
  amount_usd: "Amount (USD)",
  platform: "Platform",
  username: "Username",
  name: "Name",
  is_currently_live: "Currently Live",
  spending_threshold: "Spending Threshold",
  sites: "Sites",
  secondary_currency: "Secondary Currency",
  exchange_rate: "Exchange Rate",
  payout_frequency: "Payout Frequency",
  subscription_tier: "Plan",
  subscription_status: "Subscription",
  model_limit: "Model Limit",
  shift_date: "Shift Date",
  onboarding_dismissed: "Onboarding Dismissed",
  onboarding_completed_steps: "Onboarding Steps",
};

// Fields to skip in the diff view (internal/noisy fields)
const HIDDEN_FIELDS = new Set([
  "id", "studio_id", "account_id", "auth_user_id", "entity_id",
  "created_at", "updated_at", "created_date", "updated_date",
  "created_by", "is_super_admin", "cam_account_id", "model_id",
  "operator_id", "room_id", "channel_id", "shift_id",
]);

function formatFieldLabel(key: string): string {
  return FIELD_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length === 0 ? "None" : value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Build a human-readable summary from the log data */
function buildSummary(log: AuditLog): string {
  const entity = ENTITY_LABELS[log.entity_type] || log.entity_type;
  const newData = log.new_values;
  const oldData = log.old_values;

  // Try to extract a name/identifier for the entity
  const data = newData || oldData;
  let identifier = "";
  if (data) {
    if (data.first_name) {
      identifier = `${data.first_name}${data.last_name ? " " + data.last_name : ""}`;
    } else if (data.name) {
      identifier = String(data.name);
    } else if (data.username) {
      identifier = String(data.username);
    } else if (data.model_username) {
      identifier = String(data.model_username);
    } else if (data.email) {
      identifier = String(data.email);
    } else if (data.subject) {
      identifier = String(data.subject);
    }
  }

  const name = identifier ? ` "${identifier}"` : "";

  switch (log.event_type) {
    case "create":
      if (log.entity_type === "earnings") {
        const date = newData?.shift_date || "";
        const platform = newData?.platform || "";
        return `Earnings recorded${platform ? ` on ${platform}` : ""}${date ? ` for ${date}` : ""}`;
      }
      if (log.entity_type === "shifts") {
        return `Shift scheduled${name ? ` for${name}` : ""}`;
      }
      return `${entity}${name} added`;

    case "update":
      if (log.entity_type === "accounts" && newData) {
        if (oldData?.is_active !== undefined && newData.is_active !== undefined && oldData.is_active !== newData.is_active) {
          return newData.is_active ? `${entity}${name} reactivated` : `${entity}${name} deactivated`;
        }
        if (oldData?.role !== undefined && newData.role !== undefined && oldData.role !== newData.role) {
          return `${entity}${name} role changed to ${newData.role}`;
        }
      }
      if (log.entity_type === "shifts" && newData?.status) {
        return `Shift${name} marked as ${newData.status}`;
      }
      if (log.entity_type === "global_settings") {
        return "Studio settings updated";
      }
      return `${entity}${name} updated`;

    case "delete":
      return `${entity}${name} removed`;

    default:
      return log.summary || `${log.event_type} on ${log.entity_type}`;
  }
}

function DiffView({
  oldValues,
  newValues,
}: {
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
}) {
  if (!oldValues && !newValues) return null;
  const allKeys = [
    ...new Set([
      ...Object.keys(oldValues || {}),
      ...Object.keys(newValues || {}),
    ]),
  ].filter(key => !HIDDEN_FIELDS.has(key));

  // For updates, only show changed fields
  const changedKeys = allKeys.filter(key => {
    if (!oldValues || !newValues) return true;
    return JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key]);
  });

  if (changedKeys.length === 0) return null;

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] uppercase tracking-wider text-[#A8A49A]/30 font-medium">
        Details
      </p>
      <div className="bg-black/30 rounded-lg border border-white/[0.04] overflow-hidden">
        {changedKeys.map((key) => (
          <div
            key={key}
            className="flex items-start text-xs border-b border-white/[0.03] last:border-0"
          >
            <div className="w-36 shrink-0 p-2 text-[#A8A49A]/40 bg-white/[0.02]">
              {formatFieldLabel(key)}
            </div>
            <div className="flex-1 p-2 flex gap-2">
              {oldValues?.[key] !== undefined && newValues?.[key] !== undefined ? (
                <>
                  <span className="text-red-400/70 line-through">
                    {formatValue(oldValues[key])}
                  </span>
                  <span className="text-[#A8A49A]/30">&rarr;</span>
                  <span className="text-emerald-400">
                    {formatValue(newValues[key])}
                  </span>
                </>
              ) : newValues?.[key] !== undefined ? (
                <span className="text-emerald-400">
                  {formatValue(newValues[key])}
                </span>
              ) : (
                <span className="text-red-400/70">
                  {formatValue(oldValues?.[key])}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface AuditLog {
  id: string;
  event_type: string;
  entity_type: string;
  summary?: string;
  actor_email?: string;
  created_at?: string;
  created_date?: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  synced_to_sheets?: boolean;
  studio_name?: string;
}

const EVENT_ICONS: Record<string, typeof Plus> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
};

const EVENT_ICON_COLORS: Record<string, string> = {
  create: "text-emerald-400/60",
  update: "text-[#C9A84C]/50",
  delete: "text-red-400/60",
};

const EVENT_BG_COLORS: Record<string, string> = {
  create: "bg-emerald-400/10",
  update: "bg-[#C9A84C]/10",
  delete: "bg-red-400/10",
};

export default function AuditLogItem({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = log.old_values || log.new_values;
  const dateField = log.created_at || log.created_date;

  const Icon = EVENT_ICONS[log.event_type] || Pencil;
  const iconColor = EVENT_ICON_COLORS[log.event_type] || EVENT_ICON_COLORS.update;
  const iconBg = EVENT_BG_COLORS[log.event_type] || EVENT_BG_COLORS.update;

  const friendlySummary = buildSummary(log);

  // Extract actor name (before @)
  const actorName = log.actor_email
    ? log.actor_email === "system"
      ? "System"
      : log.actor_email.split("@")[0]
    : null;

  return (
    <div className="group bg-white/[0.02] hover:bg-white/[0.04] rounded-lg border border-white/[0.04] transition-colors">
      <div
        className={`flex items-center gap-3 p-3 ${hasDetails ? "cursor-pointer" : ""}`}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/90 truncate">{friendlySummary}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-[#A8A49A]/30">
              {dateField
                ? format(new Date(dateField), "MMM d, h:mm a")
                : "\u2014"}
            </span>
            {actorName && (
              <>
                <span className="text-[10px] text-[#A8A49A]/15">&middot;</span>
                <span className="text-[10px] text-[#A8A49A]/25">
                  {actorName}
                </span>
              </>
            )}
          </div>
        </div>
        {hasDetails && (
          <div className="shrink-0">
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#A8A49A]/30" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#A8A49A]/30" />
            )}
          </div>
        )}
      </div>
      {expanded && hasDetails && (
        <div className="px-3 pb-3 pl-13">
          <DiffView oldValues={log.old_values} newValues={log.new_values} />
        </div>
      )}
    </div>
  );
}
