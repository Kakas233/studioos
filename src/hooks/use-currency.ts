"use client";

import { useGlobalSettings } from "@/hooks/use-studio-data";
import { getCurrencyInfo } from "@/lib/currencies";

/**
 * Central hook for all currency formatting across the app.
 * Returns the studio's secondary currency info and formatting helpers.
 *
 * NOTE: Earning entity fields named `_secondary` store the secondary
 * currency value (whatever it is configured to be).
 */
export function useCurrency() {
  const { data: settings } = useGlobalSettings();

  const secondaryCurrencyCode = settings?.secondary_currency || "USD";
  const exchangeRate = settings?.exchange_rate || 1;
  const exchangeRateMode = settings?.exchange_rate_mode || "manual";
  const currencyInfo = getCurrencyInfo(secondaryCurrencyCode);

  const formatUsd = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  const formatUsdShort = (value: number) => {
    return (
      "$" +
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value || 0)
    );
  };

  const formatSecondary = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyInfo.code,
      minimumFractionDigits: currencyInfo.decimals,
      maximumFractionDigits: currencyInfo.decimals,
    }).format(value || 0);
  };

  return {
    secondaryCurrencyCode,
    exchangeRate,
    exchangeRateMode,
    currencyInfo,
    settings,
    formatUsd,
    formatUsdShort,
    formatSecondary,
  };
}
