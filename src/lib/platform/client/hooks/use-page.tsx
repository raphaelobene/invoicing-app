"use client"

import { createContext, use, useContext, type ReactNode } from "react"
import {
	useSearchParams as useNextSearchParams,
	usePathname,
	useRouter,
} from "next/navigation"
import type z from "zod"

import type {
	AnyPage,
	ExtractPageHasFallback,
	ExtractPageName,
	ExtractPagePath,
	ExtractPageSchema,
	NextSearchParams,
	SearchParamsError,
} from "@/lib/platform/server/safe-page"
import type { SearchParamsResultForSchema } from "@/lib/platform/server/search-params"
import type { Prettify } from "@/lib/shared/utils/prettify"

/**
 * Mode for combining search params during navigation.
 *
 * - `replace`: Replace the entire query string with the provided params.
 * - `merge`: Override existing keys with values from params; for repeated keys (arrays), the full set is replaced.
 * - `merge-arrays`: Append values for keys from params to any existing values (array-concat semantics).
 */
export type SearchParamsNavigationMode = "merge" | "merge-arrays" | "replace"

/**
 * Input params type for navigation functions.
 *
 * For pages with a schema, accepts `Partial<z.input<Schema>>` for type-safe navigation.
 * For pages without a schema, accepts the same loose types as URLSearchParams constructor.
 */
export type SearchParamsNavigationInput<
	Schema extends z.ZodTypeAny | undefined = undefined,
> = Schema extends z.ZodTypeAny
	? Partial<z.input<Schema>>
	: string[][] | Record<string, string> | string | URLSearchParams

/**
 * Navigation functions returned by page hooks for updating search params.
 */
export type SearchParamsNavigation<
	Schema extends z.ZodTypeAny | undefined = undefined,
> = {
	/**
	 * Build a URL string for the current pathname with updated search params.
	 * @param params Input params to apply.
	 * @param mode How to combine with existing params. Defaults to `merge`.
	 */
	buildSearchParamsUrl: (
		params: SearchParamsNavigationInput<Schema>,
		mode?: SearchParamsNavigationMode
	) => string
	/**
	 * Navigate using `router.push` with updated search params.
	 * @param params Input params to apply.
	 * @param mode How to combine with existing params. Defaults to `merge`.
	 */
	pushSearchParams: (
		params: SearchParamsNavigationInput<Schema>,
		mode?: SearchParamsNavigationMode
	) => void
	/**
	 * Navigate using `router.replace` with updated search params (no new history entry).
	 * @param params Input params to apply.
	 * @param mode How to combine with existing params. Defaults to `merge`.
	 */
	replaceSearchParams: (
		params: SearchParamsNavigationInput<Schema>,
		mode?: SearchParamsNavigationMode
	) => void
}

/**
 * Internal context value type for page context (without navigation functions).
 */
type InternalPageContextValue<
	Path extends string = string,
	Name extends string = string,
	Schema extends z.ZodTypeAny | undefined = undefined,
	HasFallback extends boolean = false,
> = {
	path: Path
	name: Name
} & (Schema extends undefined
	? {
			/** Raw unvalidated search params (no schema provided) */
			unsafeSearchParams: NextSearchParams
		}
	: HasFallback extends true
		? {
				/** Validated and parsed search params (schema + fallback provided) */
				searchParams: z.output<Schema>
			}
		: {
				/** Discriminated union result from parsing (schema provided, no fallback) */
				searchParamsResult: SearchParamsResultForSchema<Schema>
			})

/**
 * Internal context value type for the search params validation fallback (without navigation functions).
 */
type InternalPageFallbackContextValue<
	Path extends string = string,
	Name extends string = string,
	Schema extends z.ZodTypeAny = z.ZodTypeAny,
> = {
	path: Path
	name: Name
	/** The validation errors from the failed search params parsing */
	validationErrors: Prettify<SearchParamsError<Schema>>
}

/**
 * Context value type for page context with conditional types based on schema and fallback configuration.
 *
 * Three scenarios:
 * 1. Schema + Fallback: `searchParams` is the validated data
 * 2. Schema, no Fallback: `searchParamsResult` is the discriminated union result
 * 3. No Schema: `unsafeSearchParams` is the raw search params
 */
export type PageContextValue<
	Path extends string = string,
	Name extends string = string,
	Schema extends z.ZodTypeAny | undefined = undefined,
	HasFallback extends boolean = false,
> = InternalPageContextValue<Path, Name, Schema, HasFallback> &
	SearchParamsNavigation<Schema>

/**
 * Context value type for the search params validation fallback.
 *
 * This is available when a page has a schema with a fallback, and the fallback is being rendered
 * due to validation failure.
 */
export type PageFallbackContextValue<
	Path extends string = string,
	Name extends string = string,
	Schema extends z.ZodTypeAny = z.ZodTypeAny,
> = InternalPageFallbackContextValue<Path, Name, Schema> &
	SearchParamsNavigation<Schema>

/**
 * Result type for usePageContext hook.
 *
 * Returns a discriminated union based on whether the component is rendered
 * in the page context or the validation fallback context.
 */
export type UsePageContextResult<
	Path extends string = string,
	Name extends string = string,
	Schema extends z.ZodTypeAny = z.ZodTypeAny,
> = SearchParamsNavigation<Schema> &
	(
		| {
				/** Component is rendered in the page context (validation succeeded) */
				isValidationError: false
				path: Path
				name: Name
				/** Validated and parsed search params */
				searchParams: z.output<Schema>
				validationErrors?: undefined
		  }
		| {
				/** Component is rendered in the validation fallback context (validation failed) */
				isValidationError: true
				path: Path
				name: Name
				searchParams?: undefined
				/** The validation errors from the failed search params parsing */
				validationErrors: Prettify<SearchParamsError<Schema>>
		  }
	)

const PageContext = createContext<
	InternalPageContextValue<any, any, any, any> | undefined
>(undefined)

const PageFallbackContext = createContext<
	InternalPageFallbackContextValue<any, any, any> | undefined
>(undefined)

export const PageContextProvider = <
	Path extends string,
	Name extends string,
	Schema extends z.ZodTypeAny | undefined = undefined,
	HasFallback extends boolean = false,
>({
	value,
	children,
}: {
	value: InternalPageContextValue<Path, Name, Schema, HasFallback>
	children: ReactNode
}) => <PageContext.Provider value={value}>{children}</PageContext.Provider>

export const PageFallbackContextProvider = <
	Path extends string,
	Name extends string,
	Schema extends z.ZodTypeAny = z.ZodTypeAny,
>({
	value,
	children,
}: {
	value: InternalPageFallbackContextValue<Path, Name, Schema>
	children: ReactNode
}) => (
	<PageFallbackContext.Provider value={value}>
		{children}
	</PageFallbackContext.Provider>
)

type SearchParamsInput =
	string[][] | Record<string, string> | string | URLSearchParams

/**
 * Values coming from a schema-typed navigation call (e.g. `z.input<Schema>`)
 * can be numbers, booleans, or arrays - not just strings. `URLSearchParams`
 * only accepts strings at runtime, so passing it a non-string value either
 * throws or silently produces something wrong (e.g. `String(undefined)`).
 * This normalizes any input shape into something safe to hand to
 * `new URLSearchParams(...)`, dropping nullish values and stringifying
 * everything else. Arrays become repeated keys, matching how Next.js/URLSearchParams
 * represents multi-value params.
 */
const normalizeSearchParamsInput = (
	params: unknown
): string[][] | string | URLSearchParams => {
	if (
		typeof params === "string" ||
		params instanceof URLSearchParams ||
		Array.isArray(params)
	) {
		return params as string[][] | string | URLSearchParams
	}

	const entries: string[][] = []
	for (const [key, value] of Object.entries(
		params as Record<string, unknown>
	)) {
		if (value === undefined || value === null) {
			continue
		}
		if (Array.isArray(value)) {
			for (const item of value) {
				if (item !== undefined && item !== null) {
					entries.push([key, String(item)])
				}
			}
		} else {
			entries.push([key, String(value)])
		}
	}
	return entries
}

/**
 * Merge new params into current params with array-concat semantics.
 */
const mergeArrayParams = (
	currentParams: URLSearchParams,
	newParams: URLSearchParams
): void => {
	const keys = new Set<string>()
	for (const [key] of newParams) {
		keys.add(key)
	}
	for (const key of keys) {
		for (const value of newParams.getAll(key)) {
			if (value) {
				currentParams.append(key, value)
			}
		}
	}
}

/**
 * Merge new params into current params, replacing existing keys.
 */
const mergeParams = (
	currentParams: URLSearchParams,
	newParams: URLSearchParams
): void => {
	for (const [key, value] of newParams) {
		if (value) {
			currentParams.set(key, value)
		} else {
			currentParams.delete(key)
		}
	}
}

/**
 * Internal hook for building and navigating to URLs with updated search parameters.
 *
 * Modes:
 * - `replace`: replace the entire query string with the provided `params`.
 * - `merge`: override existing keys with values from `params`; for repeated keys (arrays), the full set is replaced.
 * - `merge-arrays`: append values for keys from `params` to any existing values (array-concat semantics).
 */
const useSearchParamsNavigation = (): SearchParamsNavigation<any> => {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useNextSearchParams()

	const buildSearchParamsUrl = (
		params: SearchParamsInput,
		mode: SearchParamsNavigationMode = "merge"
	) => {
		const newParams = new URLSearchParams(normalizeSearchParamsInput(params))

		if (mode === "replace") {
			return `${pathname}?${newParams.toString()}`
		}

		// Clone ReadonlyURLSearchParams safely via its string representation.
		const currentParams = new URLSearchParams(searchParams.toString())

		if (mode === "merge-arrays") {
			mergeArrayParams(currentParams, newParams)
		} else {
			mergeParams(currentParams, newParams)
		}

		return `${pathname}?${currentParams.toString()}`
	}

	const pushSearchParams = (
		params: SearchParamsInput,
		mode: SearchParamsNavigationMode = "merge"
	) => {
		const url = buildSearchParamsUrl(params, mode)
		router.push(url as Parameters<typeof router.push>[0])
	}

	const replaceSearchParams = (
		params: SearchParamsInput,
		mode: SearchParamsNavigationMode = "merge"
	) => {
		const url = buildSearchParamsUrl(params, mode)
		router.replace(url as Parameters<typeof router.replace>[0])
	}

	return {
		buildSearchParamsUrl,
		pushSearchParams,
		replaceSearchParams,
	}
}

/**
 * Hook to access page context within a page component.
 *
 * @param expectedName - Optional page name for runtime validation. If provided, throws if the context's page name doesn't match.
 *
 * @example
 * ```tsx
 * // Without runtime validation
 * const { searchParams } = usePage<typeof DemoPage>();
 *
 * // With runtime validation
 * const { searchParams } = usePage<typeof DemoPage>('demo');
 * ```
 */
export const usePage = <Page extends AnyPage>(
	expectedName?: ExtractPageName<Page>
) => {
	const context = use(PageContext)
	const navigation = useSearchParamsNavigation()
	if (context === undefined) {
		throw new Error(
			"`usePage` must be used within a `PageContextProvider`. If you are in a validation error fallback, use `usePageFallback` or `usePageContext` instead."
		)
	}
	if (expectedName !== undefined && context.name !== expectedName) {
		throw new Error(
			`\`usePage\` expected page '${expectedName}' but was used in page '${context.name}'.`
		)
	}
	return { ...context, ...navigation } as unknown as Prettify<
		PageContextValue<
			ExtractPagePath<Page>,
			ExtractPageName<Page>,
			ExtractPageSchema<Page>,
			ExtractPageHasFallback<Page>
		>
	>
}

/**
 * Hook to access page fallback context within a validation error fallback.
 *
 * @param expectedName - Optional page name for runtime validation. If provided, throws if the context's page name doesn't match.
 *
 * @example
 * ```tsx
 * // Without runtime validation
 * const { validationErrors } = usePageFallback<typeof DemoPage>();
 *
 * // With runtime validation
 * const { validationErrors } = usePageFallback<typeof DemoPage>('demo');
 * ```
 */
export const usePageFallback = <Page extends AnyPage>(
	expectedName?: ExtractPageName<Page>
) => {
	const context = use(PageFallbackContext)
	const navigation = useSearchParamsNavigation()
	if (context === undefined) {
		throw new Error(
			"`usePageFallback` must be used within a `PageFallbackContextProvider`. If you are in a page component, use `usePage` or `usePageContext` instead."
		)
	}
	if (expectedName !== undefined && context.name !== expectedName) {
		throw new Error(
			`\`usePageFallback\` expected page '${expectedName}' but was used in page '${context.name}'.`
		)
	}
	return { ...context, ...navigation } as unknown as Prettify<
		PageFallbackContextValue<
			ExtractPagePath<Page>,
			ExtractPageName<Page>,
			NonNullable<ExtractPageSchema<Page>>
		>
	>
}

/**
 * Hook that works in both the page context and the validation fallback context.
 *
 * Returns a discriminated union with an `isValidationError` flag to distinguish which context
 * the component is rendered in.
 *
 * @param expectedName - Optional page name for runtime validation. If provided, throws if the context's page name doesn't match.
 *
 * @example
 * ```tsx
 * const result = usePageContext<typeof MyPage>();
 *
 * if (result.isValidationError) {
 *   // Handle validation errors
 *   console.log(result.validationErrors);
 * } else {
 *   // Use parsed search params
 *   console.log(result.searchParams);
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With runtime validation
 * const { searchParams, validationErrors } = usePageContext<typeof MyPage>('my-page');
 * ```
 *
 * @example
 * ```tsx
 * // Destructure with optional properties
 * const { name, isValidationError, searchParams, validationErrors } = usePageContext<typeof MyPage>();
 *
 * if (searchParams) {
 *   // TypeScript knows searchParams is defined here
 * }
 * ```
 */
export const usePageContext = <Page extends AnyPage>(
	expectedName?: ExtractPageName<Page>
): UsePageContextResult<
	ExtractPagePath<Page>,
	ExtractPageName<Page>,
	NonNullable<ExtractPageSchema<Page>>
> & {} => {
	const pageContext = useContext(PageContext)
	const fallbackContext = useContext(PageFallbackContext)
	const navigation = useSearchParamsNavigation()

	if (pageContext !== undefined) {
		if (expectedName !== undefined && pageContext.name !== expectedName) {
			throw new Error(
				`\`usePageContext\` expected page '${expectedName}' but was used in page '${pageContext.name}'.`
			)
		}

		// A page's context stores its parsed data under one of two keys depending
		// on whether `.searchParamsSchema()` was given a validation error fallback:
		// - with a fallback: `searchParams` (already guaranteed valid - the
		//   fallback context handles the failure case separately)
		// - without a fallback: `searchParamsResult` (a success/failure union
		//   that this hook must branch on itself, since there's no separate
		//   fallback context rendered for it)
		if ("searchParams" in pageContext) {
			return {
				isValidationError: false as const,
				path: pageContext.path,
				name: pageContext.name,
				searchParams: pageContext.searchParams as z.output<
					NonNullable<ExtractPageSchema<Page>>
				>,
				validationErrors: undefined,
				...navigation,
			}
		}

		if ("searchParamsResult" in pageContext) {
			const result =
				pageContext.searchParamsResult as SearchParamsResultForSchema<
					NonNullable<ExtractPageSchema<Page>>
				>
			if (result.success) {
				return {
					isValidationError: false as const,
					path: pageContext.path,
					name: pageContext.name,
					searchParams: result.searchParams,
					validationErrors: undefined,
					...navigation,
				}
			}
			return {
				isValidationError: true as const,
				path: pageContext.path,
				name: pageContext.name,
				searchParams: undefined,
				validationErrors: result.errors as SearchParamsError<
					NonNullable<ExtractPageSchema<Page>>
				>,
				...navigation,
			}
		}

		throw new Error(
			"`usePageContext` requires a page defined with `.searchParamsSchema()`. This page has no search params schema, so use `usePage` with `unsafeSearchParams` instead."
		)
	}

	if (fallbackContext !== undefined) {
		if (expectedName !== undefined && fallbackContext.name !== expectedName) {
			throw new Error(
				`\`usePageContext\` expected page '${expectedName}' but was used in page '${fallbackContext.name}'.`
			)
		}
		return {
			isValidationError: true as const,
			path: fallbackContext.path,
			name: fallbackContext.name,
			searchParams: undefined,
			validationErrors: fallbackContext.validationErrors as SearchParamsError<
				NonNullable<ExtractPageSchema<Page>>
			>,
			...navigation,
		}
	}

	throw new Error(
		"`usePageContext` must be used within a page component or its validation error fallback."
	)
}
