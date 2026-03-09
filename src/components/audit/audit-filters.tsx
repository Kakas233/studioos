"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

const ENTITY_TYPES = [
  { value: "all", label: "All Entities" },
  { value: "Earning", label: "Earnings" },
  { value: "Shift", label: "Shifts" },
  { value: "Account", label: "Accounts" },
  { value: "Assignment", label: "Assignments" },
  { value: "Room", label: "Rooms" },
  { value: "CamAccount", label: "Cam Accounts" },
  { value: "Payout", label: "Payouts" },
  { value: "Studio", label: "Studio" },
  { value: "GlobalSettings", label: "Settings" },
  { value: "WeeklyGoal", label: "Weekly Goals" },
];

const EVENT_TYPES = [
  { value: "all", label: "All Events" },
  { value: "create", label: "Creates" },
  { value: "update", label: "Updates" },
  { value: "delete", label: "Deletes" },
];

interface Filters {
  search: string;
  entityType: string;
  eventType: string;
  dateFrom: string;
  dateTo: string;
}

interface AuditFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClear: () => void;
}

export default function AuditFilters({
  filters,
  onChange,
  onClear,
}: AuditFiltersProps) {
  const hasFilters =
    filters.search ||
    filters.entityType !== "all" ||
    filters.eventType !== "all" ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            placeholder="Search logs..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="bg-white/[0.04] border-white/[0.06] text-white pl-10 h-9"
          />
        </div>
      </div>
      <Select
        value={filters.entityType}
        onValueChange={(v) => v !== null && onChange({ ...filters, entityType: v })}
      >
        <SelectTrigger className="w-[150px] bg-white/[0.04] border-white/[0.06] text-white h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ENTITY_TYPES.map((e) => (
            <SelectItem key={e.value} value={e.value}>
              {e.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.eventType}
        onValueChange={(v) => v !== null && onChange({ ...filters, eventType: v })}
      >
        <SelectTrigger className="w-[130px] bg-white/[0.04] border-white/[0.06] text-white h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {EVENT_TYPES.map((e) => (
            <SelectItem key={e.value} value={e.value}>
              {e.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
        className="bg-white/[0.04] border-white/[0.06] text-white h-9 w-[145px]"
        style={{ colorScheme: "dark" }}
        placeholder="From"
      />
      <Input
        type="date"
        value={filters.dateTo}
        onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
        className="bg-white/[0.04] border-white/[0.06] text-white h-9 w-[145px]"
        style={{ colorScheme: "dark" }}
        placeholder="To"
      />
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-white/50 hover:text-white h-9"
        >
          <X className="w-4 h-4 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}
