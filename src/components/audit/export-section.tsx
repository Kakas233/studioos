"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth/auth-context";

interface ExportSectionProps {
  shifts: Record<string, unknown>[];
  earnings: Record<string, unknown>[];
  accounts: Record<string, unknown>[];
}

export default function ExportSection({
  shifts,
  earnings,
  accounts,
}: ExportSectionProps) {
  const [exporting, setExporting] = useState(false);
  const { studio } = useAuth();
  const sheetId = (studio as Record<string, unknown>)?.audit_spreadsheet_id as
    | string
    | undefined;
  const sheetUrl = sheetId
    ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
    : null;

  const convertToCSV = (data: Record<string, unknown>[], headers: string[]) => {
    if (!data || data.length === 0) return "";
    const csvHeaders = headers.join(",");
    const csvRows = data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return "";
          if (typeof value === "object")
            return JSON.stringify(value).replace(/,/g, ";");
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    return [csvHeaders, ...csvRows].join("\n");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const shiftHeaders = [
        "id",
        "model_name",
        "operator_name",
        "room_name",
        "start_time",
        "end_time",
        "status",
        "created_at",
      ];
      const earningHeaders = [
        "id",
        "shift_date",
        "model_name",
        "operator_name",
        "total_gross_usd",
        "total_gross_secondary",
        "model_pay_usd",
        "model_pay_secondary",
        "operator_pay_usd",
        "operator_pay_secondary",
        "created_at",
      ];
      const accountHeaders = [
        "id",
        "email",
        "first_name",
        "role",
        "cut_percentage",
        "payout_method",
        "created_at",
      ];

      const studioName = studio?.name || "Studio";
      const combinedCSV = [
        `=== ${studioName} SHIFTS ===`,
        convertToCSV(shifts, shiftHeaders),
        "",
        `=== ${studioName} EARNINGS ===`,
        convertToCSV(earnings, earningHeaders),
        "",
        `=== ${studioName} ACCOUNTS ===`,
        convertToCSV(accounts, accountHeaders),
      ].join("\n");

      const blob = new Blob([combinedCSV], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.setAttribute("href", URL.createObjectURL(blob));
      link.setAttribute(
        "download",
        `${studioName}_Backup_${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Database exported successfully");
    } catch {
      toast.error("Failed to export database");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-[#111111]/80 border-white/[0.04]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white">
            Export CSV Backup
          </CardTitle>
          <CardDescription className="text-xs">
            Download your studio&apos;s shifts, earnings and accounts as CSV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-[#C9A84C] hover:bg-[#B8973B] text-black w-full"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {exporting ? "Exporting..." : "Export to CSV"}
          </Button>
        </CardContent>
      </Card>
      <Card className="bg-[#111111]/80 border-white/[0.04]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white">
            Google Sheets Audit Log
          </CardTitle>
          <CardDescription className="text-xs">
            {sheetUrl
              ? "Live synced \u2014 every change auto-logged to your studio's sheet"
              : "A Google Sheet will be created automatically when the first audit event occurs"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sheetUrl ? (
            <Button
              variant="outline"
              className="w-full border-white/[0.08] text-white/80 hover:text-white hover:bg-white/[0.04]"
              onClick={() => window.open(sheetUrl, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" /> Open Google Sheet
            </Button>
          ) : (
            <p className="text-xs text-white/30 text-center py-2">
              No audit sheet created yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
