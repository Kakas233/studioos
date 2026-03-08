/**
 * Financial calculation utilities using exact decimal precision.
 * All _huf references removed — uses _secondary naming (fixes #7).
 */

import Decimal from "decimal.js";
import { getCurrencyInfo, formatCurrency } from "./currencies";

export interface EarningsSplit {
  gross: number;
  studioCut: number;
  modelNet: number;
}

/** Calculate earnings split between studio and model */
export function calculateEarningsSplit(
  grossEarnings: number,
  studioPercentage: number
): EarningsSplit {
  const gross = new Decimal(grossEarnings);
  const studioCut = gross.mul(studioPercentage).div(100).toDecimalPlaces(2);
  const modelNet = gross.minus(studioCut).toDecimalPlaces(2);

  return {
    gross: gross.toNumber(),
    studioCut: studioCut.toNumber(),
    modelNet: modelNet.toNumber(),
  };
}

/** Convert USD to secondary currency */
export function convertCurrency(
  usdAmount: number,
  exchangeRate: number
): number {
  return new Decimal(usdAmount)
    .mul(exchangeRate)
    .toDecimalPlaces(2)
    .toNumber();
}

/** Token-to-minute rates by show type */
const TOKENS_PER_MINUTE: Record<string, number> = {
  public: 10,
  private: 60,
  group: 30,
  ticket: 40,
};

/** Estimate token earnings from stream minutes */
export function estimateTokenEarnings(
  minutes: number,
  showType: string,
  tokenRate: number = 0.05
): { tokens: number; usd: number } {
  const tokensPerMin = TOKENS_PER_MINUTE[showType] ?? 10;
  const tokens = new Decimal(minutes).mul(tokensPerMin).toNumber();
  const usd = new Decimal(tokens)
    .mul(tokenRate)
    .toDecimalPlaces(2)
    .toNumber();
  return { tokens, usd };
}

/** Format amount in a secondary currency */
export function formatSecondaryCurrency(
  amount: number,
  currencyCode: string
): string {
  return formatCurrency(amount, currencyCode);
}

/** Format as USD */
export function formatUsd(value: number): string {
  return `$${new Decimal(value).toDecimalPlaces(2).toFixed(2)}`;
}
