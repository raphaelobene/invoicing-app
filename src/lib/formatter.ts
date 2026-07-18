/**
 * formatter.ts
 * A type-safe, dependency-free numeral.js-style formatting utility built
 * entirely on the native Intl API — including parse() counterparts that
 * turn formatted strings back into numbers/objects.
 *
 * No third-party dependencies. Works in any modern browser or Node 18+.
 * Duration formatting uses Intl.DurationFormat where available (Chrome/Node
 * 21+) and transparently falls back to a manual implementation elsewhere.
 */

/** Same shape as Intl.DurationFormat's `format()` argument. */
export interface DurationInput {
	years?: number
	months?: number
	weeks?: number
	days?: number
	hours?: number
	minutes?: number
	seconds?: number
	milliseconds?: number
	microseconds?: number
	nanoseconds?: number
}

/** Unit display width used by this library's manual (non-Intl.DurationFormat) fallback. */
export type DurationUnitDisplay = "long" | "short" | "narrow"

/** BCP 47 locale tag(s), e.g. 'en-US', 'de-DE', ['fr-FR', 'en'] */
export type LocaleTag = string | string[]

export interface LocaleOption {
	locale?: LocaleTag
}

export interface NumberOptions extends LocaleOption {
	/** Exact number of decimal places (sets both min and max). */
	decimals?: number
	minDecimals?: number
	maxDecimals?: number
	/** Group digits with locale separators. Default true. */
	useGrouping?: boolean
}

export interface CurrencyOptions extends LocaleOption {
	decimals?: number
	/** 'symbol' ($1,234), 'code' (USD 1,234), or 'name' (1,234 US dollars). */
	display?: "symbol" | "code" | "name"
}

export interface PercentOptions extends LocaleOption {
	decimals?: number
}

export interface CompactOptions extends LocaleOption {
	decimals?: number
	display?: "short" | "long"
}

export interface BytesOptions extends LocaleOption {
	decimals?: number
	/** Use 1024-based (KiB/MiB) instead of 1000-based (KB/MB) units. */
	binary?: boolean
}

export type OrdinalOptions = LocaleOption

export type RelativeTimeUnit =
	"second" | "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year"

export interface RelativeTimeOptions extends LocaleOption {
	numeric?: "always" | "auto"
}

export interface DateOptions extends LocaleOption {
	dateStyle?: "full" | "long" | "medium" | "short"
	timeStyle?: "full" | "long" | "medium" | "short"
	timeZone?: string
}

export interface ListOptions extends LocaleOption {
	type?: "conjunction" | "disjunction" | "unit"
	style?: "long" | "short" | "narrow"
}

export interface DurationOptions extends LocaleOption {
	style?: Intl.DurationFormatStyle
}

/** Any unit accepted by Intl.NumberFormat's `unit` style, e.g. 'kilometer', 'celsius'. */
export type MeasurementUnit = string

export interface UnitOptions extends LocaleOption {
	decimals?: number
	unitDisplay?: "long" | "short" | "narrow"
}

export interface PluralOptions extends LocaleOption {
	type?: "cardinal" | "ordinal"
}

const formatterCache = new Map<string, unknown>()

function cached<T, O extends object | undefined>(
	ctorName: string,
	Ctor: new (locale?: LocaleTag, options?: O) => T,
	locale: LocaleTag,
	options?: O
): T {
	const key = `${ctorName}|${JSON.stringify(locale)}|${JSON.stringify(options)}`
	let inst = formatterCache.get(key) as T | undefined
	if (!inst) {
		inst = new Ctor(locale, options)
		formatterCache.set(key, inst)
	}
	return inst
}

/** Discover the group and decimal separator characters for a locale. */
function localeSeparators(locale: LocaleTag = "en-US"): {
	group: string
	decimal: string
} {
	const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
	const group = parts.find((p) => p.type === "group")?.value ?? ","
	const decimal = parts.find((p) => p.type === "decimal")?.value ?? "."
	return { group, decimal }
}

/** Strip everything except digits, sign, decimal point, and exponent marker. */
function toPlainNumericString(value: string, locale: LocaleTag): string {
	const { group, decimal } = localeSeparators(locale)
	const isNegativeAccounting = /^\s*\(.*\)\s*$/.test(value)
	let s = value.split(group).join("").split(decimal).join(".")
	s = s.replace(/[^\d.\-+eE]/g, "")
	if (isNegativeAccounting && !s.startsWith("-")) s = `-${s}`
	return s
}

class ParseError extends Error {
	constructor(fn: string, input: string) {
		super(`formatter.${fn}: could not parse "${input}"`)
		this.name = "ParseError"
	}
}

/** Build a magnitude -> suffix table by asking Intl how it renders 10^n. */
function compactSuffixTable(
	locale: LocaleTag
): Array<{ suffix: string; multiplier: number }> {
	const magnitudes = [1e15, 1e12, 1e9, 1e6, 1e3]
	const fmt = new Intl.NumberFormat(locale, {
		notation: "compact",
		maximumFractionDigits: 0,
	})
	return magnitudes
		.map((multiplier) => {
			const rendered = fmt.format(multiplier)
			const suffix = rendered.replace(/^[\d.,\s]+/, "")
			return { suffix, multiplier }
		})
		.filter((entry) => entry.suffix.length > 0)
		.sort((a, b) => b.suffix.length - a.suffix.length)
}

/** Build a unit-label -> multiplier table for decimal (SI) byte units in a given locale. */
function byteUnitTable(
	locale: LocaleTag
): Array<{ label: string; multiplier: number }> {
	const units = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"]
	const fallback = ["B", "KB", "MB", "GB", "TB"]

	return units
		.map((unit, i) => {
			let label: string = fallback[i]!
			try {
				const parts = new Intl.NumberFormat(locale, {
					style: "unit",
					unit,
					unitDisplay: "short",
				}).formatToParts(1)
				const unitPart = parts
					.filter((p) => p.type === "unit")
					.map((p) => p.value)
					.join("")
				if (unitPart) label = unitPart
			} catch {
				// Engine doesn't support this unit; keep fallback label.
			}
			return { label, multiplier: Math.pow(1000, i) }
		})
		.sort((a, b) => b.label.length - a.label.length)
}

export const Formatter = {
	number(value: number, opts: NumberOptions = {}): string {
		const {
			locale = "en-US",
			decimals,
			minDecimals,
			maxDecimals,
			useGrouping = true,
		} = opts
		return cached("Number", Intl.NumberFormat, locale, {
			minimumFractionDigits: minDecimals ?? decimals ?? 0,
			maximumFractionDigits: maxDecimals ?? decimals ?? 3,
			useGrouping,
		}).format(value)
	},

	parseNumber(value: string, opts: NumberOptions = {}): number {
		const { locale = "en-US" } = opts
		const cleaned = toPlainNumericString(value, locale)
		const result = parseFloat(cleaned)
		if (Number.isNaN(result)) throw new ParseError("parseNumber", value)
		return result
	},

	currency(
		value: number,
		currencyCode = "USD",
		opts: CurrencyOptions = {}
	): string {
		const { locale = "en-US", decimals, display = "symbol" } = opts
		return cached("Currency", Intl.NumberFormat, locale, {
			style: "currency",
			currency: currencyCode,
			currencyDisplay: display,
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		}).format(value)
	},

	parseCurrency(value: string, opts: CurrencyOptions = {}): number {
		const { locale = "en-US" } = opts
		const cleaned = toPlainNumericString(value, locale)
		const result = parseFloat(cleaned)
		if (Number.isNaN(result)) throw new ParseError("parseCurrency", value)
		return result
	},

	/** Pass the raw fraction: percent(0.4321) -> "43.21%" */
	percent(value: number, opts: PercentOptions = {}): string {
		const { locale = "en-US", decimals = 2 } = opts
		return cached("Percent", Intl.NumberFormat, locale, {
			style: "percent",
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		}).format(value)
	},

	/** Returns the fraction: parsePercent("43.21%") -> 0.4321 */
	parsePercent(value: string, opts: PercentOptions = {}): number {
		const { locale = "en-US" } = opts
		const cleaned = toPlainNumericString(value, locale)
		const result = parseFloat(cleaned)
		if (Number.isNaN(result)) throw new ParseError("parsePercent", value)
		return result / 100
	},

	compact(value: number, opts: CompactOptions = {}): string {
		const { locale = "en-US", decimals = 1, display = "short" } = opts
		return cached("Compact", Intl.NumberFormat, locale, {
			notation: "compact",
			compactDisplay: display,
			maximumFractionDigits: decimals,
		}).format(value)
	},

	parseCompact(value: string, opts: CompactOptions = {}): number {
		const { locale = "en-US" } = opts
		const trimmed = value.trim()
		const table = compactSuffixTable(locale)
		const match = table.find((e) => trimmed.endsWith(e.suffix))
		if (match) {
			const numPart = trimmed.slice(0, trimmed.length - match.suffix.length)
			return this.parseNumber(numPart, { locale }) * match.multiplier
		}
		return this.parseNumber(trimmed, { locale })
	},

	bytes(value: number, opts: BytesOptions = {}): string {
		const { locale = "en-US", decimals = 1, binary = false } = opts
		const base = binary ? 1024 : 1000
		const binaryLabels = ["B", "KiB", "MiB", "GiB", "TiB"]
		const decimalUnits = [
			"byte",
			"kilobyte",
			"megabyte",
			"gigabyte",
			"terabyte",
		]

		if (value === 0) {
			return binary
				? `0 ${binaryLabels[0]}`
				: this.unit(0, "byte", { locale, unitDisplay: "short" })
		}

		const exp = Math.min(
			Math.floor(Math.log(Math.abs(value)) / Math.log(base)),
			decimalUnits.length - 1
		)
		const scaled = value / Math.pow(base, exp)

		if (binary) {
			return `${this.number(scaled, { locale, decimals })} ${binaryLabels[exp]}`
		}

		try {
			return cached("Bytes", Intl.NumberFormat, locale, {
				style: "unit",
				unit: decimalUnits[exp],
				unitDisplay: "short",
				maximumFractionDigits: decimals,
			}).format(scaled)
		} catch {
			const fallback = ["B", "KB", "MB", "GB", "TB"]
			return `${this.number(scaled, { locale, decimals })} ${fallback[exp]}`
		}
	},

	parseBytes(value: string, opts: BytesOptions = {}): number {
		const { locale = "en-US", binary = false } = opts
		const trimmed = value.trim()

		if (binary) {
			const labels = ["TiB", "GiB", "MiB", "KiB", "B"]
			const match = labels.find((label) => trimmed.endsWith(label))
			if (!match) throw new ParseError("parseBytes", value)
			const exp = match === "B" ? 0 : 4 - labels.indexOf(match)
			const numPart = trimmed.slice(0, trimmed.length - match.length)
			return this.parseNumber(numPart, { locale }) * Math.pow(1024, exp)
		}

		const table = byteUnitTable(locale)
		const match = table.find((e) => trimmed.endsWith(e.label))
		if (!match) throw new ParseError("parseBytes", value)
		const numPart = trimmed.slice(0, trimmed.length - match.label.length)
		return this.parseNumber(numPart, { locale }) * match.multiplier
	},

	ordinal(value: number, opts: OrdinalOptions = {}): string {
		const { locale = "en-US" } = opts
		const pr = cached("PluralRulesOrdinal", Intl.PluralRules, locale, {
			type: "ordinal",
		})
		const suffixes: Record<string, string> = {
			one: "st",
			two: "nd",
			few: "rd",
			other: "th",
		}
		const suffix = suffixes[pr.select(value)] ?? "th"
		return `${value}${suffix}`
	},

	/** Only reliable for the English suffix scheme this library generates. */
	parseOrdinal(value: string): number {
		const match = value.match(/-?\d+/)
		if (!match) throw new ParseError("parseOrdinal", value)
		return parseInt(match[0], 10)
	},

	relativeTime(
		value: number,
		unit: RelativeTimeUnit = "day",
		opts: RelativeTimeOptions = {}
	): string {
		const { locale = "en-US", numeric = "auto" } = opts
		return cached("RelativeTime", Intl.RelativeTimeFormat, locale, {
			numeric,
		}).format(value, unit)
	},

	date(value: Date | number | string, opts: DateOptions = {}): string {
		const { locale = "en-US", dateStyle = "medium", timeStyle, timeZone } = opts
		return cached("Date", Intl.DateTimeFormat, locale, {
			dateStyle,
			timeStyle,
			timeZone,
		}).format(new Date(value))
	},

	/** Formats a range, e.g. dateRange(start, end) -> "Jul 1 – 4, 2026" */
	dateRange(
		start: Date | number | string,
		end: Date | number | string,
		opts: DateOptions = {}
	): string {
		const { locale = "en-US", dateStyle = "medium", timeZone } = opts
		const fmt = cached("DateRange", Intl.DateTimeFormat, locale, {
			dateStyle,
			timeZone,
		})

		return (
			fmt as Intl.DateTimeFormat & { formatRange: (a: Date, b: Date) => string }
		).formatRange(new Date(start), new Date(end))
	},

	/**
	 * Best-effort parse. Intl has no official parser, so this relies on
	 * Date.parse, which handles common English formats reliably but is not
	 * guaranteed for every locale/dateStyle combination.
	 */
	parseDate(value: string): Date {
		const ms = Date.parse(value)
		if (Number.isNaN(ms)) throw new ParseError("parseDate", value)
		return new Date(ms)
	},

	list(items: string[], opts: ListOptions = {}): string {
		const { locale = "en-US", type = "conjunction", style = "long" } = opts
		return cached("List", Intl.ListFormat, locale, { type, style }).format(
			items
		)
	},

	/** Any Intl unit style unit, e.g. unit(12, 'kilometer') -> "12 km" */
	unit(
		value: number,
		measurementUnit: MeasurementUnit,
		opts: UnitOptions = {}
	): string {
		const { locale = "en-US", decimals, unitDisplay = "short" } = opts
		return cached("Unit", Intl.NumberFormat, locale, {
			style: "unit",
			unit: measurementUnit,
			unitDisplay,
			maximumFractionDigits: decimals,
		}).format(value)
	},

	parseUnit(
		value: string,
		measurementUnit: MeasurementUnit,
		opts: UnitOptions = {}
	): number {
		const { locale = "en-US", unitDisplay = "short" } = opts
		const parts = new Intl.NumberFormat(locale, {
			style: "unit",
			unit: measurementUnit,
			unitDisplay,
		}).formatToParts(1)
		const label = parts
			.filter((p) => p.type === "unit")
			.map((p) => p.value)
			.join("")
		const trimmed = value.trim()
		const withoutLabel =
			label && trimmed.endsWith(label)
				? trimmed.slice(0, -label.length)
				: trimmed
		return this.parseNumber(withoutLabel, { locale })
	},

	/**
	 * Picks the right word form for a count, e.g.:
	 * plural(1, { one: 'item', other: 'items' }) -> "item"
	 * plural(3, { one: 'item', other: 'items' }) -> "items"
	 */
	plural(
		value: number,
		forms: Partial<Record<Intl.LDMLPluralRule, string>>,
		opts: PluralOptions = {}
	): string {
		const { locale = "en-US", type = "cardinal" } = opts
		const category = cached("PluralRules", Intl.PluralRules, locale, {
			type,
		}).select(value)
		return forms[category] ?? forms.other ?? ""
	},

	duration(input: DurationInput, opts: DurationOptions = {}): string {
		const { locale = "en-US", style = "short" } = opts

		if (
			typeof (Intl as unknown as { DurationFormat?: unknown })
				.DurationFormat === "function"
		) {
			return cached("DurationFormat", Intl.DurationFormat, locale, {
				style,
			}).format(input)
		}

		const order: Array<keyof DurationInput> = [
			"years",
			"months",
			"weeks",
			"days",
			"hours",
			"minutes",
			"seconds",
		]
		const unitNames: Record<string, string> = {
			years: "year",
			months: "month",
			weeks: "week",
			days: "day",
			hours: "hour",
			minutes: "minute",
			seconds: "second",
		}
		const unitDisplay: DurationUnitDisplay =
			style === "digital" ? "short" : style

		const parts = order
			.filter((key) => input[key])
			.map((key) =>
				new Intl.NumberFormat(locale, {
					style: "unit",
					unit: unitNames[key],
					unitDisplay,
				}).format(input[key] as number)
			)

		if (parts.length === 0) {
			return new Intl.NumberFormat(locale, {
				style: "unit",
				unit: "second",
				unitDisplay,
			}).format(0)
		}
		return cached("ListDurationFallback", Intl.ListFormat, locale, {
			type: "conjunction",
			style: "narrow",
		}).format(parts)
	},

	/**
	 * Best-effort reverse of duration(): scans the string for "<number> <unit
	 * label>" pairs using the same unit labels this library produces. Works
	 * reliably for the library's own short/long output; arbitrary
	 * externally-produced strings (e.g. "digital" HH:MM:SS style) are not
	 * covered and should be parsed manually.
	 */
	parseDuration(value: string, opts: DurationOptions = {}): DurationInput {
		const { locale = "en-US", style = "short" } = opts
		const unitDisplay: DurationUnitDisplay =
			style === "digital" ? "short" : style
		const fields: Array<keyof DurationInput> = [
			"years",
			"months",
			"weeks",
			"days",
			"hours",
			"minutes",
			"seconds",
		]
		const unitNames: Record<string, string> = {
			years: "year",
			months: "month",
			weeks: "week",
			days: "day",
			hours: "hour",
			minutes: "minute",
			seconds: "second",
		}

		const result: DurationInput = {}
		for (const field of fields) {
			const parts = new Intl.NumberFormat(locale, {
				style: "unit",
				unit: unitNames[field],
				unitDisplay,
			}).formatToParts(2) // plural probe
			const label = parts
				.filter((p) => p.type === "unit")
				.map((p) => p.value)
				.join("")
				.trim()
			if (!label) continue
			const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
			const re = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${escaped}\\b`, "i")
			const match = value.match(re)
			if (match && match[1]) result[field] = parseFloat(match[1])
		}
		if (Object.keys(result).length === 0)
			throw new ParseError("parseDuration", value)
		return result
	},
}

export interface FluentFormat {
	number(opts?: NumberOptions): string
	currency(currencyCode?: string, opts?: CurrencyOptions): string
	percent(opts?: PercentOptions): string
	compact(opts?: CompactOptions): string
	bytes(opts?: BytesOptions): string
	ordinal(opts?: OrdinalOptions): string
	relativeTime(unit?: RelativeTimeUnit, opts?: RelativeTimeOptions): string
	date(opts?: DateOptions): string
	unit(measurementUnit: MeasurementUnit, opts?: UnitOptions): string
}

export function format(
	value: number | Date | string,
	defaultUnit?: RelativeTimeUnit
): FluentFormat {
	return {
		number: (opts) => Formatter.number(value as number, opts),
		currency: (currencyCode, opts) =>
			Formatter.currency(value as number, currencyCode, opts),
		percent: (opts) => Formatter.percent(value as number, opts),
		compact: (opts) => Formatter.compact(value as number, opts),
		bytes: (opts) => Formatter.bytes(value as number, opts),
		ordinal: (opts) => Formatter.ordinal(value as number, opts),
		relativeTime: (unit = defaultUnit ?? "day", opts) =>
			Formatter.relativeTime(value as number, unit, opts),
		date: (opts) => Formatter.date(value as Date | number | string, opts),
		unit: (measurementUnit, opts) =>
			Formatter.unit(value as number, measurementUnit, opts),
	}
}

export default format
