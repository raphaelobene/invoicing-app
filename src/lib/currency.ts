import { Decimal } from "@prisma/client/runtime/client"

// lib/currency.ts

import format from "./utils/formatter"

export interface CurrencyInfo {
	code: string
	name: string
	symbol: string
	locale: string
}

// `locale` here just controls Intl formatting conventions for that currency
// (decimal places, grouping, symbol placement) — it has nothing to do with
// any user's language preference.
export const CURRENCIES: CurrencyInfo[] = [
	{ code: "USD", name: "US Dollar", symbol: "$", locale: "en-US" },
	{ code: "EUR", name: "Euro", symbol: "€", locale: "de-DE" },
	{ code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB" },
	{ code: "NGN", name: "Nigerian Naira", symbol: "₦", locale: "en-NG" },
	{ code: "CAD", name: "Canadian Dollar", symbol: "$", locale: "en-CA" },
	{ code: "AUD", name: "Australian Dollar", symbol: "$", locale: "en-AU" },
	{ code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP" },
	{ code: "INR", name: "Indian Rupee", symbol: "₹", locale: "en-IN" },
	{ code: "ZAR", name: "South African Rand", symbol: "R", locale: "en-ZA" },
	{ code: "GHS", name: "Ghanaian Cedi", symbol: "₵", locale: "en-GH" },
	{ code: "KES", name: "Kenyan Shilling", symbol: "KSh", locale: "en-KE" },
	{ code: "AED", name: "UAE Dirham", symbol: "د.إ", locale: "ar-AE" },
	// add more as your customer base grows
]

const CURRENCY_MAP = new Map(CURRENCIES.map((c) => [c.code, c]))
const FALLBACK_LOCALE = "en-US"

export function getCurrencyInfo(code: string): CurrencyInfo {
	return (
		CURRENCY_MAP.get(code) ?? {
			code,
			name: code,
			symbol: code,
			locale: FALLBACK_LOCALE,
		}
	)
}

/**
 * Always pass the currency the money actually belongs to — invoice.currency,
 * quote.currency, etc. Never the org's *current* defaultCurrency for an
 * existing record, since that can change after the record was created and
 * this table has no idea what currency a historical row was issued in.
 */
export function formatMoney(
	amount: number | string | Decimal,
	currencyCode: string
) {
	const value = amount instanceof Decimal ? amount.toNumber() : Number(amount)
	const { locale } = getCurrencyInfo(currencyCode)

	return format(value).currency(currencyCode, { locale })
}
