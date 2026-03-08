/**
 * Currency reference data and formatting utilities.
 * Ported from Base44 app, typed for TypeScript.
 */

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "US Dollar", symbol: "$", decimals: 2 },
  { code: "EUR", name: "Euro", symbol: "€", decimals: 2 },
  { code: "GBP", name: "British Pound", symbol: "£", decimals: 2 },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", decimals: 0 },
  { code: "RON", name: "Romanian Leu", symbol: "lei", decimals: 2 },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", decimals: 0 },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", decimals: 2 },
  { code: "COP", name: "Colombian Peso", symbol: "$", decimals: 0 },
  { code: "THB", name: "Thai Baht", symbol: "฿", decimals: 0 },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴", decimals: 0 },
  { code: "BGN", name: "Bulgarian Lev", symbol: "лв", decimals: 2 },
  { code: "HRK", name: "Croatian Kuna", symbol: "kn", decimals: 2 },
  { code: "RSD", name: "Serbian Dinar", symbol: "din", decimals: 0 },
  { code: "MXN", name: "Mexican Peso", symbol: "$", decimals: 2 },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", decimals: 2 },
  { code: "ARS", name: "Argentine Peso", symbol: "$", decimals: 0 },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", decimals: 0 },
  { code: "INR", name: "Indian Rupee", symbol: "₹", decimals: 0 },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", decimals: 0 },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", decimals: 2 },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", decimals: 2 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", decimals: 2 },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", decimals: 2 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", decimals: 0 },
  { code: "KRW", name: "South Korean Won", symbol: "₩", decimals: 0 },
  { code: "ZAR", name: "South African Rand", symbol: "R", decimals: 2 },
];

const currencyMap = new Map(CURRENCIES.map((c) => [c.code, c]));

/** Get currency info by code, with fallback */
export function getCurrencyInfo(code: string): CurrencyInfo {
  return (
    currencyMap.get(code) ?? {
      code,
      name: code,
      symbol: code,
      decimals: 2,
    }
  );
}

/** Format an amount in a specific currency */
export function formatCurrency(
  amount: number,
  currencyCode: string
): string {
  const info = getCurrencyInfo(currencyCode);
  const formatted = amount.toFixed(info.decimals);

  // Put symbol before or after based on convention
  const symbolAfter = ["Ft", "Kč", "zł", "лв", "kn", "din"].includes(
    info.symbol
  );
  return symbolAfter
    ? `${formatted} ${info.symbol}`
    : `${info.symbol}${formatted}`;
}

/** Format as USD with 2 decimals */
export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

/** Format as USD with no decimals */
export function formatUsdShort(value: number): string {
  return `$${Math.round(value)}`;
}
