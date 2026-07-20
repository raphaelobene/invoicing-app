const WILDCARD: unique symbol = Symbol("P._")
type Wildcard = typeof WILDCARD

const STRING_WILDCARD: unique symbol = Symbol("P.string")
type StringWildcard = typeof STRING_WILDCARD

const NUMBER_WILDCARD: unique symbol = Symbol("P.number")
type NumberWildcard = typeof NUMBER_WILDCARD

const BOOLEAN_WILDCARD: unique symbol = Symbol("P.boolean")
type BooleanWildcard = typeof BOOLEAN_WILDCARD

type TypedWildcard = StringWildcard | NumberWildcard | BooleanWildcard

interface SelectMarker<Name extends string = string> {
	readonly __select: true
	readonly name: Name
}

function select<Name extends string>(name: Name): SelectMarker<Name> {
	return { __select: true, name }
}

function isSelectMarker(value: unknown): value is SelectMarker {
	return (
		typeof value === "object" &&
		value !== null &&
		(value as any).__select === true
	)
}

type Pattern<T> =
	| Wildcard
	| TypedWildcard
	| SelectMarker
	| (T extends readonly unknown[]
			? { readonly [K in keyof T]: Pattern<T[K]> }
			: T extends object
				? { readonly [K in keyof T]?: Pattern<T[K]> }
				: T)

type Probe<P> = P extends Wildcard
	? unknown
	: P extends StringWildcard
		? string
		: P extends NumberWildcard
			? number
			: P extends BooleanWildcard
				? boolean
				: P extends SelectMarker
					? unknown
					: P extends readonly unknown[]
						? { [K in keyof P]: Probe<P[K]> }
						: P extends object
							? { [K in keyof P]: Probe<P[K]> }
							: P

type Matched<T, P> = Extract<T, Probe<P>>

type UnionToIntersection<U> = (
	U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
	? I
	: never

type Selections<M, P> =
	P extends SelectMarker<infer Name>
		? { [K in Name]: M }
		: P extends readonly unknown[]
			? M extends readonly unknown[]
				? UnionToIntersection<
						{
							[K in keyof P]: K extends keyof M ? Selections<M[K], P[K]> : {}
						}[number & keyof P]
					>
				: {}
			: P extends object
				? M extends object
					? UnionToIntersection<
							{
								[K in keyof P]: K extends keyof M ? Selections<M[K], P[K]> : {}
							}[keyof P]
						>
					: {}
				: {}

function structuralMatch(
	value: unknown,
	pattern: unknown,
	selections: Record<string, unknown>
): boolean {
	if (pattern === WILDCARD) return true
	if (pattern === STRING_WILDCARD) return typeof value === "string"
	if (pattern === NUMBER_WILDCARD) return typeof value === "number"
	if (pattern === BOOLEAN_WILDCARD) return typeof value === "boolean"

	if (isSelectMarker(pattern)) {
		selections[pattern.name] = value
		return true
	}

	if (Array.isArray(pattern)) {
		if (!Array.isArray(value) || value.length !== pattern.length) return false
		return pattern.every((p, i) => structuralMatch(value[i], p, selections))
	}

	if (pattern !== null && typeof pattern === "object") {
		if (value === null || typeof value !== "object") return false
		return Object.keys(pattern).every((key) =>
			structuralMatch(
				(value as Record<string, unknown>)[key],
				(pattern as Record<string, unknown>)[key],
				selections
			)
		)
	}

	return value === pattern
}

type CaseEntry = {
	test: (value: unknown) => Record<string, unknown> | null
	handler: (value: unknown, selections: Record<string, unknown>) => unknown
}

class MatchBuilder<T, R> {
	private constructor(
		private readonly value: T,
		private readonly cases: readonly CaseEntry[]
	) {}

	static start<T>(value: T): MatchBuilder<T, never> {
		return new MatchBuilder<T, never>(value, [])
	}

	with<P extends Pattern<T>, HR>(
		pattern: P,
		handler: (
			value: Matched<T, P>,
			selections: Selections<Matched<T, P>, P>
		) => HR
	): MatchBuilder<Exclude<T, Matched<T, P>>, R | HR>

	with<P extends Pattern<T>, HR>(
		pattern: P,
		guard: (
			value: Matched<T, P>,
			selections: Selections<Matched<T, P>, P>
		) => boolean,
		handler: (
			value: Matched<T, P>,
			selections: Selections<Matched<T, P>, P>
		) => HR
	): MatchBuilder<T, R | HR>

	with(pattern: any, second: any, third?: any): any {
		const hasGuard = typeof third === "function"
		const guard = hasGuard
			? (second as (value: unknown, selections: unknown) => boolean)
			: undefined
		const handler = (hasGuard ? third : second) as (
			value: unknown,
			selections: unknown
		) => unknown

		const test = (v: unknown): Record<string, unknown> | null => {
			const selections: Record<string, unknown> = {}
			if (!structuralMatch(v, pattern, selections)) return null
			if (guard && !guard(v, selections)) return null
			return selections
		}

		const cases = [...this.cases, { test, handler }]
		return new MatchBuilder(this.value, cases)
	}

	exhaustive(this: MatchBuilder<never, R>): R {
		const self = this as unknown as MatchBuilder<T, R>
		for (const c of self.cases) {
			const selections = c.test(self.value)
			if (selections) return c.handler(self.value, selections) as R
		}
		throw new Error(
			"match: no pattern matched. This should be unreachable if the types checked out."
		)
	}

	otherwise<HR>(handler: (value: T) => HR): R | HR {
		for (const c of this.cases) {
			const selections = c.test(this.value)
			if (selections) return c.handler(this.value, selections) as R
		}
		return handler(this.value)
	}
}

function match<T>(value: T): MatchBuilder<T, never> {
	return MatchBuilder.start(value)
}

const P: {
	readonly _: Wildcard
	readonly string: StringWildcard
	readonly number: NumberWildcard
	readonly boolean: BooleanWildcard
	readonly select: typeof select
} = {
	_: WILDCARD,
	string: STRING_WILDCARD,
	number: NUMBER_WILDCARD,
	boolean: BOOLEAN_WILDCARD,
	select,
}

export { match, P }
export type { Pattern }
