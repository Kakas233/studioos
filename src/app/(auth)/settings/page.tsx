"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useGlobalSettings } from "@/hooks/use-studio-data";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Coins,
  RefreshCw,
  Save,
  Calculator,
  AlertCircle,
  CalendarClock,
  Loader2,
  Upload,
  Image,
  X,
  Crown,
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
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      {/* Studio Logo - Elite only */}
      {isElite && (
        <Card className="bg-[#111111]/80 border-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Image className="w-5 h-5 text-[#C9A84C]" />
              Studio Logo
              <span className="ml-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 rounded-full flex items-center gap-1">
                <Crown className="w-2.5 h-2.5" /> Elite
              </span>
            </CardTitle>
            <CardDescription className="text-[#A8A49A]/60">
              Upload a custom logo for your studio. Visible to all team members
              in the sidebar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              {/* Logo preview */}
              <div className="w-20 h-20 rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center overflow-hidden shrink-0">
                {studio?.logo_url ? (
                  <img
                    src={studio.logo_url}
                    alt="Studio Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-2xl font-bold text-[#C9A84C]">
                    {studio?.name?.charAt(0) || "S"}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-lg text-sm text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-colors">
                      {logoUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {logoUploading ? "Uploading..." : "Upload Logo"}
                    </div>
                  </label>
                  {studio?.logo_url && (
                    <button
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-red-400/60 hover:text-red-400 border border-white/[0.06] rounded-lg hover:bg-red-500/5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#A8A49A]/40">
                  Recommended: Square image, at least 128x128px. Max 2MB. PNG or
                  JPG.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Currency & Exchange Rate */}
      <Card className="bg-[#111111]/80 border-white/[0.04]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#C9A84C]" />
            Currency & Exchange Rate
          </CardTitle>
          <CardDescription className="text-[#A8A49A]/60">
            Configure your primary and secondary currencies and exchange rate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-white/80">Primary Currency</Label>
              <Input
                value="USD (US Dollar)"
                readOnly
                className="bg-white/[0.04] border-white/[0.06] text-white/50 cursor-not-allowed"
              />
              <p className="text-xs text-[#A8A49A]/40">
                All earnings are calculated in USD
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-white/80">
                Secondary Currency
              </Label>
              <Select
                value={secondaryCurrency}
                onValueChange={(v) => v !== null && handleChange(setSecondaryCurrency, v)}
              >
                <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white">
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
              <p className="text-xs text-[#A8A49A]/40">
                Used for local currency display
              </p>
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Exchange Rate */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-white/80">
              <Calculator className="w-4 h-4 text-[#C9A84C]" />
              USD &rarr; {secondaryCurrency} Exchange Rate
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
                className="flex-1 bg-white/[0.04] border-white/[0.06] text-white text-lg font-mono"
              />
              <Button
                variant="outline"
                onClick={fetchLiveExchangeRate}
                disabled={fetchingLiveRate}
                className="text-[#C9A84C] border-[#C9A84C]/20 hover:bg-[#C9A84C]/10 shrink-0"
              >
                {fetchingLiveRate ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                {fetchingLiveRate ? "Fetching..." : "Fetch Live Rate"}
              </Button>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <label className="flex items-center gap-2 text-sm text-[#A8A49A]/60 cursor-pointer">
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
              <label className="flex items-center gap-2 text-sm text-[#A8A49A]/60 cursor-pointer">
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
            <p className="text-xs text-[#A8A49A]/50">
              1 USD = {Number(exchangeRate || 0).toLocaleString()}{" "}
              {secondaryCurrency}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payout Structure */}
      <Card className="bg-[#111111]/80 border-white/[0.04]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-[#C9A84C]" />
            Payout Structure
          </CardTitle>
          <CardDescription className="text-[#A8A49A]/60">
            Configure how often payouts are calculated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-white/80">Payout Frequency</Label>
            <Select
              value={payoutFrequency}
              onValueChange={(v) => v !== null && handleChange(setPayoutFrequency, v)}
            >
              <SelectTrigger className="w-[220px] bg-white/[0.04] border-white/[0.06] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/[0.06] text-white">
                <SelectItem
                  value="weekly"
                  className="text-white hover:bg-white/[0.06] focus:bg-white/[0.06] focus:text-white"
                >
                  Weekly
                </SelectItem>
                <SelectItem
                  value="biweekly"
                  className="text-white hover:bg-white/[0.06] focus:bg-white/[0.06] focus:text-white"
                >
                  Bi-Weekly
                </SelectItem>
                <SelectItem
                  value="monthly"
                  className="text-white hover:bg-white/[0.06] focus:bg-white/[0.06] focus:text-white"
                >
                  Monthly
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[#A8A49A]/40">
              How often payouts are calculated for models and operators
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Token Rates */}
      <Card className="bg-[#111111]/80 border-white/[0.04]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#C9A84C]" />
            Site-Specific Token Rates
          </CardTitle>
          <CardDescription className="text-[#A8A49A]/60">
            USD value per token for each platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div key={key} className="space-y-2">
                <Label className="text-sm text-[#A8A49A]/60">{label}</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                  value={siteRates[key]}
                  onChange={(e) => handleSiteRateChange(key, e.target.value)}
                  className="bg-white/[0.04] border-white/[0.06] text-white"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-[#A8A49A]/50 mt-2">
            OnlyFans is separate: input is in USD, system automatically applies
            20% commission
          </p>
        </CardContent>
      </Card>

      {/* Save / Reset */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={resetAll}
          disabled={!hasChanges}
          className="bg-background text-zinc-700 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm h-9 border-white/[0.06] hover:bg-white/[0.04] hover:text-white"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="bg-[#C9A84C] hover:bg-[#B8973B] text-black"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-1" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-[#C9A84C]/[0.06] border-[#C9A84C]/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#C9A84C]/70 mt-0.5" />
            <div>
              <p className="font-medium text-[#C9A84C]/80">Important Note</p>
              <p className="text-sm text-[#A8A49A]/50 mt-1">
                Changes to these values will affect all future earnings
                calculations. Existing earnings records will retain their
                original calculated values.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
