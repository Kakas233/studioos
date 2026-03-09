"use client";

import { useGlobalSettings } from "@/hooks/use-studio-data";
import { formatUsd, formatUsdShort, formatCurrency, getCurrencyInfo } from "@/lib/currencies";

export function useCurrency() {
  const { data: settings } = useGlobalSettings();

  const secondaryCurrencyCode = settings?.secondary_currency || "EUR";
  const exchangeRate = settings?.exchange_rate || 1;
  const currencyInfo = getCurrencyInfo(secondaryCurrencyCode);

  const fmtSecondary = (amount: number) => {
    const converted = amount * exchangeRate;
    return formatCurrency(converted, secondaryCurrencyCode);
  };

  return {
    formatUsd: (amount: number) => formatUsd(amount),
    formatUsdShort: (amount: number) => formatUsdShort(amount),
    formatSecondary: fmtSecondary,
    secondaryCurrencyCode,
    exchangeRate,
    currencyInfo,
  };
}
