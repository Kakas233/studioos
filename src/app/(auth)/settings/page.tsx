"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useGlobalSettings } from "@/hooks/use-studio-data";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CURRENCIES } from "@/lib/currencies";

export default function AdminSettings() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { account, studio, loading: authLoading, isAdmin, refreshStudio } = useAuth();

  const [secondaryCurrency, setSecondaryCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState<number | string>(1);
  const [exchangeRateMode, setExchangeRateMode] = useState("manual");
  const [payoutFrequency, setPayoutFrequency] = useState(
    studio?.payout_frequency || "biweekly"
  );
  const [fetchingLiveRate, setFetchingLiveRate] = useState(false);
  const [siteRates, setSiteRates] = useState<Record<string, number | string>>({
    myfreecams_rate: 0.05,
    chaturbate_rate: 0.05,
    stripchat_rate: 0.05,
    bongacams_rate: 0.02,
    cam4_rate: 0.1,
    camsoda_rate: 0.05,
    flirt4free_rate: 0.03,
    livejasmin_rate: 1.0,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useGlobalSettings();

  useEffect(() => {
    if (!authLoading && !account) {
      router.push("/sign-in");
    } else if (!authLoading && account && !isAdmin) {
      router.push("/dashboard");
    }
  }, [authLoading, account, isAdmin, router]);

  useEffect(() => {
    if (settings) {
      const s = settings;
      setSecondaryCurrency(s.secondary_currency || "USD");
      setExchangeRate(s.exchange_rate || 1);
      setExchangeRateMode(s.exchange_rate_mode || "manual");
      setPayoutFrequency(
        studio?.payout_frequency || s.payout_frequency || "biweekly"
      );
      setSiteRates({
        myfreecams_rate: s.myfreecams_rate || 0.05,
        chaturbate_rate: s.chaturbate_rate || 0.05,
        stripchat_rate: s.stripchat_rate || 0.05,
        bongacams_rate: s.bongacams_rate || 0.02,
        cam4_rate: s.cam4_rate || 0.1,
        camsoda_rate: s.camsoda_rate || 0.05,
        flirt4free_rate: s.flirt4free_rate || 0.03,
        livejasmin_rate: s.livejasmin_rate || 1.0,
      });
    }
  }, [settings, studio?.payout_frequency]);

  if (authLoading || !account || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    const settingsData: Record<string, unknown> = {
      studio_id: account.studio_id,
      secondary_currency: secondaryCurrency,
      exchange_rate: Number(exchangeRate),
      exchange_rate_mode: exchangeRateMode,
      ...Object.fromEntries(
        Object.entries(siteRates).map(([key, val]) => [key, Number(val)])
      ),
    };

    try {
      if (settings?.id) {
        await supabase
          .from("global_settings")
          .update(settingsData)
          .eq("id", settings.id);
      } else {
        await supabase.from("global_settings").insert(settingsData);
      }

      // Also sync payout frequency and currency to Studio entity
      if (studio?.id) {
        await supabase
          .from("studios")
          .update({
            payout_frequency: payoutFrequency,
            secondary_currency: secondaryCurrency,
            exchange_rate_mode: exchangeRateMode,
            manual_exchange_rate: Number(exchangeRate),
          })
          .eq("id", studio.id);
      }

      queryClient.invalidateQueries({ queryKey: ["globalSettings"] });
      queryClient.invalidateQueries({ queryKey: ["studio"] });
      setHasChanges(false);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setHasChanges(true);
  };

  const handleSiteRateChange = (site: string, value: string) => {
    setSiteRates({ ...siteRates, [site]: value });
    setHasChanges(true);
  };

  const fetchLiveExchangeRate = async () => {
    setFetchingLiveRate(true);
    try {
      const res = await fetch(
        `/api/exchange-rate?target_currency=${secondaryCurrency}`
      );
      const data = await res.json();
      if (data?.rate) {
        setExchangeRate(data.rate);
        setHasChanges(true);
        toast.success(
          `Live rate: 1 USD = ${Number(data.rate).toFixed(4)} ${secondaryCurrency}`
        );
      } else {
        toast.error("Failed to fetch live exchange rate");
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      toast.error("Error fetching exchange rate");
    } finally {
      setFetchingLiveRate(false);
    }
  };

  // Auto-fetch exchange rate on page load when mode is "auto"
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (exchangeRateMode === "auto" && secondaryCurrency && secondaryCurrency !== "USD") {
      fetchLiveExchangeRate();
    }
  }, [exchangeRateMode, secondaryCurrency]);

  const resetAll = () => {
    if (settings) {
      const s = settings;
      setSecondaryCurrency(s.secondary_currency || "USD");
      setExchangeRate(s.exchange_rate || 1);
      setExchangeRateMode(s.exchange_rate_mode || "manual");
      setPayoutFrequency(
        studio?.payout_frequency || s.payout_frequency || "biweekly"
      );
      setSiteRates({
        myfreecams_rate: s.myfreecams_rate || 0.05,
        chaturbate_rate: s.chaturbate_rate || 0.05,
        stripchat_rate: s.stripchat_rate || 0.05,
        bongacams_rate: s.bongacams_rate || 0.02,
        cam4_rate: s.cam4_rate || 0.1,
        camsoda_rate: s.camsoda_rate || 0.05,
        flirt4free_rate: s.flirt4free_rate || 0.03,
        livejasmin_rate: s.livejasmin_rate || 1.0,
      });
    }
    setHasChanges(false);
  };

  const isElite = studio?.subscription_tier === "elite";

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }
    setLogoUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const filePath = `studio-logos/${studio?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("uploads").getPublicUrl(filePath);

      await supabase
        .from("studios")
        .update({ logo_url: publicUrl })
        .eq("id", studio!.id);

      queryClient.invalidateQueries({ queryKey: ["studio"] });
      await refreshStudio();
      toast.success("Studio logo updated");
    } catch (err) {
      toast.error("Failed to upload logo");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    const supabase = createClient();
    await supabase
      .from("studios")
      .update({ logo_url: "" })
      .eq("id", studio!.id);
    queryClient.invalidateQueries({ queryKey: ["studio"] });
    await refreshStudio();
    toast.success("Logo removed");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Studio Logo - Elite only */}
      {isElite && (
        <section className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-white">Studio Logo</h3>
            <span className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider">Elite</span>
          </div>
          <p className="text-xs text-[#A8A49A]/40 mb-4">Visible to all team members in the sidebar.</p>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-lg border border-white/[0.06] bg-white/[0.03] flex items-center justify-center overflow-hidden shrink-0">
              {studio?.logo_url ? (
                <img
                  src={studio.logo_url}
                  alt="Studio Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold text-white/30">
                  {studio?.name?.charAt(0) || "S"}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/70 border border-white/[0.06] rounded-md hover:bg-white/[0.04] transition-colors">
                    {logoUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {logoUploading ? "Uploading..." : "Upload"}
                  </span>
                </label>
                {studio?.logo_url && (
                  <button
                    onClick={handleRemoveLogo}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-400/50 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#A8A49A]/30">
                Square, 128x128px+, max 2MB
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Currency & Exchange Rate */}
      <section className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-5 space-y-5">
        <div>
          <h3 className="text-sm font-medium text-white">Currency & Exchange Rate</h3>
          <p className="text-xs text-[#A8A49A]/40 mt-0.5">Primary and secondary currencies for your studio.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-[#A8A49A]/50">Primary Currency</Label>
            <Input
              value="USD (US Dollar)"
              readOnly
              className="bg-white/[0.04] border-white/[0.06] text-white/40 cursor-not-allowed h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-[#A8A49A]/50">Secondary Currency</Label>
            <Select
              value={secondaryCurrency}
              onValueChange={(v) => v !== null && handleChange(setSecondaryCurrency, v)}
            >
              <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/[0.06] text-white">
                {CURRENCIES.map((c) => (
                  <SelectItem
                    key={c.code}
                    value={c.code}
                    className="text-white hover:bg-white/[0.06] focus:bg-white/[0.06] focus:text-white"
                  >
                    {c.name} ({c.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t border-white/[0.04] pt-4 space-y-3">
          <Label className="text-xs text-[#A8A49A]/50">
            USD → {secondaryCurrency} Exchange Rate
          </Label>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              step="0.01"
              min="0.001"
              value={exchangeRate}
              onChange={(e) => {
                setExchangeRate(e.target.value);
                setHasChanges(true);
              }}
              className="flex-1 bg-white/[0.04] border-white/[0.06] text-white font-mono h-9"
            />
            <button
              onClick={fetchLiveExchangeRate}
              disabled={fetchingLiveRate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-white/50 hover:text-white border border-white/[0.06] rounded-md hover:bg-white/[0.04] transition-colors disabled:opacity-40 shrink-0"
            >
              {fetchingLiveRate ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {fetchingLiveRate ? "Fetching..." : "Fetch Live"}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-[#A8A49A]/50 cursor-pointer">
              <input
                type="radio"
                checked={exchangeRateMode === "manual"}
                onChange={() => {
                  setExchangeRateMode("manual");
                  setHasChanges(true);
                }}
                className="accent-[#C9A84C]"
              />
              Manual
            </label>
            <label className="flex items-center gap-2 text-xs text-[#A8A49A]/50 cursor-pointer">
              <input
                type="radio"
                checked={exchangeRateMode === "auto"}
                onChange={() => {
                  setExchangeRateMode("auto");
                  setHasChanges(true);
                }}
                className="accent-[#C9A84C]"
              />
              Auto (fetched daily)
            </label>
          </div>
          <p className="text-[11px] text-[#A8A49A]/30">
            1 USD = {Number(exchangeRate || 0).toLocaleString()} {secondaryCurrency}
          </p>
        </div>
      </section>

      {/* Payout Frequency */}
      <section className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-5 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-white">Payout Frequency</h3>
          <p className="text-xs text-[#A8A49A]/40 mt-0.5">How often payouts are calculated for models and operators.</p>
        </div>
        <Select
          value={payoutFrequency}
          onValueChange={(v) => v !== null && handleChange(setPayoutFrequency, v)}
        >
          <SelectTrigger className="w-[200px] bg-white/[0.04] border-white/[0.06] text-white h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/[0.06] text-white">
            <SelectItem value="weekly" className="text-white hover:bg-white/[0.06] focus:bg-white/[0.06] focus:text-white">Weekly</SelectItem>
            <SelectItem value="biweekly" className="text-white hover:bg-white/[0.06] focus:bg-white/[0.06] focus:text-white">Bi-Weekly</SelectItem>
            <SelectItem value="monthly" className="text-white hover:bg-white/[0.06] focus:bg-white/[0.06] focus:text-white">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {/* Token Rates */}
      <section className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-5 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-white">Token Rates</h3>
          <p className="text-xs text-[#A8A49A]/40 mt-0.5">USD value per token for each platform.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "myfreecams_rate", label: "MyFreeCams" },
            { key: "chaturbate_rate", label: "Chaturbate" },
            { key: "stripchat_rate", label: "Stripchat" },
            { key: "bongacams_rate", label: "BongaCams" },
            { key: "cam4_rate", label: "Cam4" },
            { key: "camsoda_rate", label: "Camsoda" },
            { key: "flirt4free_rate", label: "Flirt4Free" },
            { key: "livejasmin_rate", label: "LiveJasmin" },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-[11px] text-[#A8A49A]/40">{label}</Label>
              <Input
                type="number"
                step="0.001"
                min="0"
                max="1"
                value={siteRates[key]}
                onChange={(e) => handleSiteRateChange(key, e.target.value)}
                className="bg-white/[0.04] border-white/[0.06] text-white h-9 font-mono text-sm"
              />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#A8A49A]/30">
          OnlyFans earnings are entered in USD directly — 20% platform commission is applied automatically.
        </p>
      </section>

      {/* Save / Reset */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[#A8A49A]/30">
          Changes affect future calculations only. Existing records keep their original values.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={resetAll}
            disabled={!hasChanges}
            className="px-3 py-1.5 text-xs text-white/40 hover:text-white/70 disabled:opacity-30 transition-colors"
          >
            Reset
          </button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-[#C9A84C] hover:bg-[#B8973B] text-black h-8 px-4 text-xs"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
