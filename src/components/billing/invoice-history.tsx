"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, ExternalLink, Receipt } from "lucide-react";
import { format, parseISO } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-500/15 text-green-400 border-0",
  open: "bg-yellow-500/15 text-yellow-400 border-0",
  void: "bg-white/10 text-[#A8A49A]/50 border-0",
  uncollectible: "bg-red-500/15 text-red-400 border-0",
  draft: "bg-white/10 text-[#A8A49A]/50 border-0",
};

interface Invoice {
  id: string;
  created: string | number;
  number?: string;
  amount_paid: number;
  status: string;
  hosted_invoice_url?: string;
  invoice_pdf?: string;
}

export default function InvoiceHistory({ invoices }: { invoices: Invoice[] }) {
  if (!invoices || invoices.length === 0) {
    return (
      <Card className="bg-[#111111] border-white/[0.06]">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#A8A49A]/50 text-sm">No invoices yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#111111] border-white/[0.06]">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Invoice History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.04] hover:bg-transparent">
                <TableHead className="text-[#A8A49A]/40">Date</TableHead>
                <TableHead className="text-[#A8A49A]/40">Invoice</TableHead>
                <TableHead className="text-[#A8A49A]/40">Amount</TableHead>
                <TableHead className="text-[#A8A49A]/40">Status</TableHead>
                <TableHead className="text-[#A8A49A]/40 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow
                  key={inv.id}
                  className="border-white/[0.04] hover:bg-white/[0.02]"
                >
                  <TableCell className="text-white text-sm">
                    {format(
                      typeof inv.created === "number"
                        ? new Date(inv.created * 1000)
                        : parseISO(inv.created as string),
                      "MMM d, yyyy"
                    )}
                  </TableCell>
                  <TableCell className="text-[#A8A49A]/60 text-sm font-mono">
                    {inv.number || "\u2014"}
                  </TableCell>
                  <TableCell className="text-white text-sm">
                    ${(inv.amount_paid / 100).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        STATUS_STYLES[inv.status] ||
                        "bg-white/10 text-white border-0"
                      }
                    >
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {inv.hosted_invoice_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#A8A49A]/40 hover:text-white"
                          onClick={() =>
                            window.open(inv.hosted_invoice_url, "_blank")
                          }
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {inv.invoice_pdf && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#A8A49A]/40 hover:text-white"
                          onClick={() =>
                            window.open(inv.invoice_pdf, "_blank")
                          }
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
