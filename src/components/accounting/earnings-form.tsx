"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calculator, DollarSign, Coins, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { getCurrencyInfo } from "@/lib/currencies";

const SITES = [
  { key: "myfreecams", name: "MyFreeCams", rateKey: "myfreecams_rate" as const, isSpecial: false },
  { key: "chaturbate", name: "Chaturbate", rateKey: "chaturbate_rate" as const, isSpecial: false },
  { key: "stripchat", name: "Stripchat", rateKey: "stripchat_rate" as const, isSpecial: false },
  { key: "bongacams", name: "BongaCams", rateKey: "bongacams_rate" as const, isSpecial: false },
  { key: "cam4", name: "Cam4", rateKey: "cam4_rate" as const, isSpecial: false },
  { key: "camsoda", name: "Camsoda", rateKey: "camsoda_rate" as const, isSpecial: false },
  { key: "flirt4free", name: "Flirt4Free", rateKey: "flirt4free_rate" as const, isSpecial: false },
  { key: "livejasmin", name: "LiveJasmin", rateKey: "livejasmin_rate" as const, isSpecial: false },
  { key: "onlyfans", name: "OnlyFans", rateKey: "onlyfans" as const, isSpecial: true },
] as const;

interface Shift {
  id: string;
  studio_id: string;
  model_id: string;
  operator_id: string | null;
  room_id: string | null;
  start_time: string;
  end_time: string;
  status: string;
}

interface Earning {
  [key: string]: unknown;
  onlyfans_gross_usd?: number;
  total_gross_usd?: number;
  total_gross_secondary?: number;
  model_pay_usd?: number;
  model_pay_secondary?: number;
  operator_pay_usd?: number;
  operator_pay_secondary?: number;
}

interface GlobalSettings {
  secondary_currency?: string;
  exchange_rate_mode?: string;
  exchange_rate?: number;
  myfreecams_rate?: number;
  chaturbate_rate?: number;
  stripchat_rate?: number;
  bongacams_rate?: number;
  cam4_rate?: number;
  camsoda_rate?: number;
  flirt4free_rate?: number;
  livejasmin_rate?: number;
  [key: string]: unknown;
}

interface User {
  id: string;
  first_name: string;
  cut_percentage?: number;
  [key: string]: unknown;
}

interface EarningsFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (earningData: Record<string, unknown>, requiresApproval: boolean) => void;
  shift: Shift;
  existingEarning: Earning | null;
  globalSettings: GlobalSettings;
  allUsers?: User[];
  operatorInfo: { id: string; name: string };
  isReadOnly?: boolean;
  userRole?: string;
  modelName?: string;
  roomName?: string;
}

export default function EarningsForm({
  open,
  onClose,
  onSave,
  shift,
  existingEarning,
  globalSettings,
  allUsers = [],
  operatorInfo,
  isReadOnly = false,
  userRole = "admin",
  modelName,
  roomName,
}: EarningsFormProps) {
  const [values, setValues] = useState<Record<string, number | string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingEarning) {
      const newValues: Record<string, number | string> = {};
      SITES.forEach((site) => {
        if (site.isSpecial) {
          newValues[site.key] = (existingEarning.onlyfans_gross_usd as number) || 0;
        } else {
          newValues[site.key] = (existingEarning[`${site.key}_tokens`] as number) || 0;
        }
      });
      setValues(newValues);
    } else {
      const newValues: Record<string, number | string> = {};
      SITES.forEach((site) => {
        newValues[site.key] = 0;
      });
      setValues(newValues);
    }
  }, [existingEarning, open]);

  const secondaryCurrency = globalSettings?.secondary_currency || "USD";
  const exchangeRateMode = globalSettings?.exchange_rate_mode || "manual";
  const savedExchangeRate = globalSettings?.exchange_rate || 1;
  const [liveRate, setLiveRate] = useState<number | null>(null);
  const usdSecondaryRate = liveRate || savedExchangeRate;
  const currencyInfo = getCurrencyInfo(secondaryCurrency);

  // Get FRESH user data to use latest cut percentages
  const freshModel = allUsers.find((u) => u.id === shift?.model_id);
  const freshOperator = allUsers.find((u) => u.id === shift?.operator_id);

  const modelCutPercentage = freshModel?.cut_percentage || 33;
  const operatorCutPercentage = freshOperator?.cut_percentage || 33;

  // Calculate earnings
  const calculations = SITES.map((site) => {
    const input = Number(values[site.key]) || 0;
    let usd = 0;
    let tokens = 0;

    if (site.isSpecial) {
      // OnlyFans: input is USD, apply 80% (20% commission)
      usd = input * 0.8;
      tokens = 0;
    } else {
      tokens = input;
      const rate = (globalSettings?.[site.rateKey] as number) || 0.05;
      usd = tokens * rate;
    }

    return {
      site: site.key,
      name: site.name,
      tokens,
      usd,
      isSpecial: !!site.isSpecial,
    };
  });

  const totalGrossUsd = calculations.reduce((sum, c) => sum + c.usd, 0);
  const totalGrossSecondary = totalGrossUsd * usdSecondaryRate;
  const modelPayUsd = totalGrossUsd * (modelCutPercentage / 100);
  const modelPaySecondary = totalGrossSecondary * (modelCutPercentage / 100);
  const operatorPayUsd = totalGrossUsd * (operatorCutPercentage / 100);
  const operatorPaySecondary = totalGrossSecondary * (operatorCutPercentage / 100);

  const fmtSecondary = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyInfo.code,
      minimumFractionDigits: currencyInfo.decimals,
      maximumFractionDigits: currencyInfo.decimals,
    }).format(value);
  };

  const formatUsd = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalRate = usdSecondaryRate;
      // Auto exchange rate fetch removed (no Base44 functions) - use saved rate

      const finalGrossSecondary = totalGrossUsd * finalRate;
      const finalModelPaySecondary = finalGrossSecondary * (modelCutPercentage / 100);
      const finalOperatorPaySecondary = finalGrossSecondary * (operatorCutPercentage / 100);

      const earningData: Record<string, unknown> = {
        studio_id: shift.studio_id,
        shift_id: shift.id,
        model_id: shift.model_id,
        operator_id: shift.operator_id,
        shift_date: format(parseISO(shift.start_time), "yyyy-MM-dd"),
        total_gross_usd: totalGrossUsd,
        total_gross_secondary: finalGrossSecondary,
        model_pay_usd: modelPayUsd,
        model_pay_secondary: finalModelPaySecondary,
        operator_pay_usd: operatorPayUsd,
        operator_pay_secondary: finalOperatorPaySecondary,
        model_cut_percentage: modelCutPercentage,
        operator_cut_percentage: operatorCutPercentage,
        secondary_currency_code: secondaryCurrency,
        exchange_rate_used: finalRate,
      };

      // Add site-specific data
      calculations.forEach((calc) => {
        if (calc.isSpecial) {
          earningData.onlyfans_gross_usd = Number(values[calc.site]) || 0;
          earningData.onlyfans_net_usd = calc.usd;
        } else {
          earningData[`${calc.site}_tokens`] = calc.tokens;
          earningData[`${calc.site}_usd`] = calc.usd;
        }
      });

      onSave(earningData, shift.status === "completed" && !!existingEarning && userRole === "operator");
    } finally {
      setSaving(false);
    }
  };

  if (!shift) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-[#111111] border-white/[0.06] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            Report Earnings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Shift Info */}
          <Card className="bg-white/[0.03] border-white/[0.04]">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#A8A49A]/40">Model</p>
                  <p className="font-medium text-white">{modelName || freshModel?.first_name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-[#A8A49A]/40">Date</p>
                  <p className="font-medium text-white">
                    {format(parseISO(shift.start_time), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-[#A8A49A]/40">Time</p>
                  <p className="font-medium text-white">
                    {format(parseISO(shift.start_time), "HH:mm")} - {format(parseISO(shift.end_time), "HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-[#A8A49A]/40">Room</p>
                  <p className="font-medium text-white">{roomName || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Site Inputs */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-white">Earnings by Site</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SITES.map((site) => (
                <div key={site.key} className="flex items-center gap-3">
                  <Label className="w-32 text-sm text-[#A8A49A]/60 flex items-center gap-1">
                    {site.name}
                    {site.isSpecial ? (
                      <span className="text-xs font-semibold text-emerald-400">($)</span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-400">(tokens)</span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step={site.isSpecial ? "0.01" : "1"}
                    value={values[site.key]}
                    onChange={(e) => setValues({ ...values, [site.key]: e.target.value })}
                    className="bg-white/[0.04] border-white/[0.06] text-white"
                    placeholder={site.isSpecial ? "Dollars" : "Tokens"}
                    disabled={isReadOnly}
                  />
                </div>
              ))}
            </div>
            {Number(values.onlyfans) > 0 && (
              <div className="flex items-start gap-2 p-2 bg-amber-500/[0.06] border border-amber-500/10 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
                <p className="text-xs text-amber-300">
                  OnlyFans: ${values.onlyfans} → ${(Number(values.onlyfans) * 0.8).toFixed(2)} (after 20% commission)
                </p>
              </div>
            )}
          </div>

          <Separator className="bg-white/[0.04]" />

          {/* Calculations - Role-based display */}
          <div className="space-y-4">
            <Label className="text-base font-medium text-white flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Calculated Payouts
              <span className="text-xs text-[#A8A49A]/40 font-normal ml-2">
                (Model: {modelCutPercentage}%, Operator: {operatorCutPercentage}%)
              </span>
            </Label>

            {(userRole === "admin" || userRole === "accountant") && (
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white/[0.03] border-white/[0.04]">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-6 h-6 mx-auto text-blue-400 mb-2" />
                    <p className="text-xl font-bold text-white">{formatUsd(totalGrossUsd)}</p>
                    <p className="text-lg font-semibold text-[#A8A49A]/50">{fmtSecondary(totalGrossSecondary)}</p>
                    <p className="text-xs text-[#A8A49A]/40 mt-1">Total Gross</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#C9A84C]/[0.06] border-[#C9A84C]/10">
                  <CardContent className="p-4 text-center">
                    <div className="w-7 h-7 mx-auto bg-[#C9A84C] rounded-full flex items-center justify-center mb-2">
                      <span className="text-black text-[10px] font-bold">{modelCutPercentage}%</span>
                    </div>
                    <p className="text-xl font-bold text-[#C9A84C]">{formatUsd(modelPayUsd)}</p>
                    <p className="text-lg font-semibold text-[#C9A84C]/70">{fmtSecondary(modelPaySecondary)}</p>
                    <p className="text-xs text-[#A8A49A]/40 mt-1">Model Pay</p>
                  </CardContent>
                </Card>

                <Card className="bg-amber-500/[0.06] border-amber-500/10">
                  <CardContent className="p-4 text-center">
                    <div className="w-7 h-7 mx-auto bg-amber-500 rounded-full flex items-center justify-center mb-2">
                      <span className="text-black text-[10px] font-bold">{operatorCutPercentage}%</span>
                    </div>
                    <p className="text-xl font-bold text-amber-400">{formatUsd(operatorPayUsd)}</p>
                    <p className="text-lg font-semibold text-amber-400/70">{fmtSecondary(operatorPaySecondary)}</p>
                    <p className="text-xs text-[#A8A49A]/40 mt-1">Operator Pay</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/[0.03] border-white/[0.04]">
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-6 h-6 mx-auto text-emerald-400 mb-2" />
                    <p className="text-xl font-bold text-white">1 USD</p>
                    <p className="text-lg font-semibold text-[#A8A49A]/50">{usdSecondaryRate} {secondaryCurrency}</p>
                    <p className="text-xs text-[#A8A49A]/40 mt-1">Exchange Rate{exchangeRateMode === "auto" ? " (Live)" : ""}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {userRole === "operator" && (
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white/[0.03] border-white/[0.04]">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-6 h-6 mx-auto text-blue-400 mb-2" />
                    <p className="text-xl font-bold text-white">{formatUsd(totalGrossUsd)}</p>
                    <p className="text-lg font-semibold text-[#A8A49A]/50">{fmtSecondary(totalGrossSecondary)}</p>
                    <p className="text-xs text-[#A8A49A]/40 mt-1">Total Gross</p>
                  </CardContent>
                </Card>

                <Card className="bg-amber-500/[0.06] border-amber-500/10">
                  <CardContent className="p-4 text-center">
                    <div className="w-7 h-7 mx-auto bg-amber-500 rounded-full flex items-center justify-center mb-2">
                      <span className="text-black text-[10px] font-bold">{operatorCutPercentage}%</span>
                    </div>
                    <p className="text-xl font-bold text-amber-400">{formatUsd(operatorPayUsd)}</p>
                    <p className="text-lg font-semibold text-amber-400/70">{fmtSecondary(operatorPaySecondary)}</p>
                    <p className="text-xs text-[#A8A49A]/40 mt-1">My Pay</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {userRole === "model" && (
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white/[0.03] border-white/[0.04]">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-6 h-6 mx-auto text-blue-400 mb-2" />
                    <p className="text-xl font-bold text-white">{formatUsd(totalGrossUsd)}</p>
                    <p className="text-lg font-semibold text-[#A8A49A]/50">{fmtSecondary(totalGrossSecondary)}</p>
                    <p className="text-xs text-[#A8A49A]/40 mt-1">Total Gross</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#C9A84C]/[0.06] border-[#C9A84C]/10">
                  <CardContent className="p-4 text-center">
                    <div className="w-7 h-7 mx-auto bg-[#C9A84C] rounded-full flex items-center justify-center mb-2">
                      <span className="text-black text-[10px] font-bold">{modelCutPercentage}%</span>
                    </div>
                    <p className="text-xl font-bold text-[#C9A84C]">{formatUsd(modelPayUsd)}</p>
                    <p className="text-lg font-semibold text-[#C9A84C]/70">{fmtSecondary(modelPaySecondary)}</p>
                    <p className="text-xs text-[#A8A49A]/40 mt-1">My Pay</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isReadOnly ? "Close" : "Cancel"}
          </Button>
          {!isReadOnly && (
            <Button
              onClick={handleSave}
              className="bg-[#C9A84C] hover:bg-[#B8973B] text-black"
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Save & Complete Shift
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
