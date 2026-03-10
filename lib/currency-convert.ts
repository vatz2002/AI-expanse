/**
 * Multi-Currency → INR Live Conversion Utility
 * Auto-detects currency symbols & codes in input and converts to INR.
 * Uses free exchange rate API with 30-min caching.
 */

/* ──────────── Supported Currencies ──────────── */

export interface CurrencyInfo {
    code: string;
    symbol: string;
    name: string;
    flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', flag: '🇧🇩' },
    { code: 'NPR', symbol: 'रू', name: 'Nepalese Rupee', flag: '🇳🇵' },
    { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', flag: '🇱🇰' },
    { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal', flag: '🇶🇦' },
    { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', flag: '🇰🇼' },
    { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar', flag: '🇧🇭' },
];

/* ──────────── Exchange Rate Cache ──────────── */

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
let rateCache: { rates: Record<string, number>; timestamp: number } | null = null;

/**
 * Fetch live exchange rates (all currencies → INR).
 * Uses open.er-api.com (free, no key needed).
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
    if (rateCache && Date.now() - rateCache.timestamp < CACHE_DURATION) {
        return rateCache.rates;
    }

    try {
        const res = await fetch('https://open.er-api.com/v6/latest/INR');
        if (res.ok) {
            const data = await res.json();
            if (data?.rates) {
                // API gives INR→X rates, we need X→INR (invert them)
                const inrRates: Record<string, number> = {};
                for (const [code, rate] of Object.entries(data.rates)) {
                    if (typeof rate === 'number' && rate > 0) {
                        inrRates[code] = 1 / rate;
                    }
                }
                rateCache = { rates: inrRates, timestamp: Date.now() };
                return inrRates;
            }
        }
    } catch {
        // Network error — use fallback
    }

    // Fallback rates (approximate)
    return rateCache?.rates ?? {
        USD: 83.5, EUR: 91.0, GBP: 106.0, AED: 22.7, SAR: 22.3,
        JPY: 0.56, CNY: 11.5, CAD: 62.0, AUD: 55.0, SGD: 62.5,
        CHF: 95.0, THB: 2.35, MYR: 17.7, KRW: 0.063, BDT: 0.76,
        NPR: 0.52, LKR: 0.26, QAR: 22.9, KWD: 272.0, BHD: 221.0,
    };
}

/* ──────────── Detection ──────────── */

export interface DetectedCurrency {
    code: string;
    amount: number;
    info: CurrencyInfo;
}

/**
 * Detect if the input contains a foreign currency amount.
 * Handles symbols ($50, €30, £20) and codes (USD 50, 50 EUR).
 * Returns null if no foreign currency is detected (plain number = INR).
 */
export function detectForeignCurrency(input: string): DetectedCurrency | null {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Try each currency — check symbol prefix/suffix, then code prefix/suffix
    for (const currency of SUPPORTED_CURRENCIES) {
        // Skip single-char symbols that might be ambiguous (¥ is both JPY and CNY)
        // We handle ¥ specially below

        // 1. Symbol prefix: $50, €30, £20, C$50
        const escapedSymbol = currency.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const symbolPrefix = trimmed.match(
            new RegExp(`^${escapedSymbol}\\s*(\\d+(?:\\.\\d{0,2})?)$`)
        );
        if (symbolPrefix) {
            return { code: currency.code, amount: parseFloat(symbolPrefix[1]), info: currency };
        }

        // 2. Symbol suffix: 50$, 30€
        const symbolSuffix = trimmed.match(
            new RegExp(`^(\\d+(?:\\.\\d{0,2})?)\\s*${escapedSymbol}$`)
        );
        if (symbolSuffix) {
            return { code: currency.code, amount: parseFloat(symbolSuffix[1]), info: currency };
        }

        // 3. Code prefix: USD 50, EUR 30
        const codePrefix = trimmed.match(
            new RegExp(`^${currency.code}\\s+(\\d+(?:\\.\\d{0,2})?)$`, 'i')
        );
        if (codePrefix) {
            return { code: currency.code, amount: parseFloat(codePrefix[1]), info: currency };
        }

        // 4. Code suffix: 50 USD, 30 EUR
        const codeSuffix = trimmed.match(
            new RegExp(`^(\\d+(?:\\.\\d{0,2})?)\\s+${currency.code}$`, 'i')
        );
        if (codeSuffix) {
            return { code: currency.code, amount: parseFloat(codeSuffix[1]), info: currency };
        }
    }

    // Handle common text patterns: "50 dollars", "30 euros", "20 pounds"
    const textPatterns: [RegExp, string][] = [
        [/^(\d+(?:\.\d{0,2})?)\s+dollars?$/i, 'USD'],
        [/^(\d+(?:\.\d{0,2})?)\s+euros?$/i, 'EUR'],
        [/^(\d+(?:\.\d{0,2})?)\s+pounds?$/i, 'GBP'],
        [/^(\d+(?:\.\d{0,2})?)\s+dirhams?$/i, 'AED'],
        [/^(\d+(?:\.\d{0,2})?)\s+riyals?$/i, 'SAR'],
        [/^(\d+(?:\.\d{0,2})?)\s+yen$/i, 'JPY'],
        [/^(\d+(?:\.\d{0,2})?)\s+yuan$/i, 'CNY'],
        [/^(\d+(?:\.\d{0,2})?)\s+baht$/i, 'THB'],
        [/^(\d+(?:\.\d{0,2})?)\s+won$/i, 'KRW'],
        [/^(\d+(?:\.\d{0,2})?)\s+taka$/i, 'BDT'],
        [/^(\d+(?:\.\d{0,2})?)\s+francs?$/i, 'CHF'],
    ];

    for (const [regex, code] of textPatterns) {
        const match = trimmed.match(regex);
        if (match) {
            const info = SUPPORTED_CURRENCIES.find(c => c.code === code);
            if (info) return { code, amount: parseFloat(match[1]), info };
        }
    }

    return null;
}

/**
 * Convert a foreign currency amount to INR.
 */
export async function convertToInr(
    amount: number,
    fromCurrency: string
): Promise<{ inrAmount: number; rate: number }> {
    const rates = await getExchangeRates();
    const rate = rates[fromCurrency] ?? 1;
    return {
        inrAmount: Math.round(amount * rate * 100) / 100,
        rate: Math.round(rate * 100) / 100,
    };
}
