"use client"

import { useSyncExternalStore, type ComponentProps } from "react"
import Link from "next/link"
import { AppRoutes, ParamMap } from "next/types/routes"

// --- Helpers ---

type StripPrefix<
	Path extends string,
	Prefix extends string,
> = Path extends Prefix
	? "/"
	: Path extends `${Prefix}/${infer Rest}`
		? `/${Rest}`
		: never

type FirstPathSegment<Path extends string> = Path extends `/${infer Rest}`
	? Rest extends `${infer Segment}/${string}`
		? Segment
		: Rest
	: never

// --- Subdomain Identification ---

type AllSubdomains = FirstPathSegment<AppRoutes>
type DynamicSubdomain = Extract<AllSubdomains, `[${string}]`>
type StaticSubdomains = Exclude<AllSubdomains, DynamicSubdomain | "root">

// --- Route Identification ---

type RootRoutes = StripPrefix<
	Extract<AppRoutes, `/root` | `/root/${string}`>,
	"/root"
>
type StaticRoutes<Subdomain extends string> = StripPrefix<
	Extract<AppRoutes, `/${Subdomain}` | `/${Subdomain}/${string}`>,
	`/${Subdomain}`
>
type DynamicRoutes = StripPrefix<
	Extract<AppRoutes, `/${DynamicSubdomain}` | `/${DynamicSubdomain}/${string}`>,
	`/${DynamicSubdomain}`
>

type RoutesFor<Subdomain extends string | undefined> = Subdomain extends
	"root" | undefined
	? RootRoutes
	: Subdomain extends StaticSubdomains
		? StaticRoutes<Subdomain>
		: DynamicRoutes

// --- Param Identification ---

type ReconstructRoute<
	Subdomain extends string | undefined,
	Pathname extends string,
> = Subdomain extends "root" | undefined
	? Pathname extends "/"
		? "/root"
		: `/root${Pathname}`
	: Subdomain extends StaticSubdomains
		? Pathname extends "/"
			? `/${Subdomain}`
			: `/${Subdomain}${Pathname}`
		: Pathname extends "/"
			? `/${DynamicSubdomain}`
			: `/${DynamicSubdomain}${Pathname}`

type DynamicParam = DynamicSubdomain extends `[${infer P}]` ? P : never

type ParamsFor<Subdomain extends string | undefined, Pathname extends string> =
	ReconstructRoute<Subdomain, Pathname> extends keyof ParamMap
		? Subdomain extends StaticSubdomains | "root" | undefined
			? ParamMap[ReconstructRoute<Subdomain, Pathname> & keyof ParamMap]
			: Omit<
					ParamMap[ReconstructRoute<Subdomain, Pathname> & keyof ParamMap],
					DynamicParam
				>
		: never

// --- Component Props ---

type SubdomainLinkProps<
	Subdomain extends string | undefined,
	Pathname extends string,
> = Omit<ComponentProps<typeof Link>, "href"> & {
	/** The subdomain to link to. Use "root" for the root domain. If not provided, uses the current domain. */
	subdomain?: Subdomain | StaticSubdomains | (string & {})
	/** The pathname to append to the subdomain URL. Defaults to "/". */
	pathname?: Pathname extends RoutesFor<Subdomain>
		? Pathname
		: RoutesFor<Subdomain>
	/**
	 * The current request host (e.g. from `headers().get("host")` in a server
	 * layout), used to resolve the correct href on the server render and for
	 * clients without JS. Without this, the href resolves to "/" until the
	 * browser hydrates and `window.location` becomes available.
	 */
	currentHost?: string
} & (Pathname extends RoutesFor<Subdomain>
		? keyof ParamsFor<Subdomain, Pathname> extends never
			? { params?: undefined }
			: { params: ParamsFor<Subdomain, Pathname> }
		: { params?: undefined })

function subscribe() {
	// hostname/protocol/port don't change without a full page load,
	// so there's nothing to actually subscribe to
	return () => {}
}

function getSnapshot() {
	return window.location.href
}

function getServerSnapshot() {
	return null
}

function buildHref({
	locationHref,
	currentHost,
	subdomain,
	pathname,
	params,
}: {
	locationHref: string | null
	currentHost: string | undefined
	subdomain: string | undefined
	pathname: string | undefined
	params: Record<string, unknown> | undefined
}) {
	// Prefer the live browser location; fall back to a host passed down from
	// the server (e.g. from `headers().get("host")` in a layout) so the first
	// server-rendered paint - and any client without JS - resolves the real
	// subdomain URL instead of always pointing at "/".
	const resolvedHref =
		locationHref ?? (currentHost ? `https://${currentHost}` : null)
	if (!resolvedHref) return "/"

	const { hostname, protocol, port } = new URL(resolvedHref)
	const parts = hostname.split(".")
	const rootDomain = parts.length > 2 ? parts.slice(-2).join(".") : hostname
	const portSegment = port ? `:${port}` : ""

	let resolvedPathname = pathname ?? "/"
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			// Encode so a param value containing "/", "?", "#", or spaces can't
			// reshape the URL structure or get misread as extra path segments.
			resolvedPathname = resolvedPathname.replace(
				`[${key}]`,
				encodeURIComponent(String(value))
			)
		}
	}

	// Subdomain accepts an arbitrary string (for subdomains not known at the
	// type level), so it isn't validated by the type system. Restrict it at
	// runtime to characters that are valid in a DNS label - this is what
	// actually stops a bad value (containing "/", "@", another host, etc.)
	// from producing a malformed or misleading URL.
	const validSubdomainPattern = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i
	if (!subdomain || subdomain === "root") {
		return `${protocol}//${rootDomain}${portSegment}${resolvedPathname}`
	}
	if (!validSubdomainPattern.test(subdomain)) {
		throw new Error(
			`SubdomainLink received an invalid subdomain "${subdomain}". Subdomains must be a valid DNS label (letters, numbers, and hyphens, not starting or ending with a hyphen).`
		)
	}
	return `${protocol}//${subdomain}.${rootDomain}${portSegment}${resolvedPathname}`
}

/**
 * A client-side Link component that navigates to different subdomains.
 *
 * @example
 * ```tsx
 * <SubdomainLink subdomain="blog" pathname="/posts/[postId]" params={{ postId: "1" }}>
 *   View Post
 * </SubdomainLink>
 * ```
 *
 * @param subdomain - The subdomain to link to (omit or use "root" for root domain)
 * @param pathname - The path on the subdomain (defaults to "/")
 * @param params - The parameters for the path (required if path has params)
 * @param children - The link content
 * @param props - Additional Next.js Link props
 */

export function SubdomainLink<
	Subdomain extends string | undefined = undefined,
	Pathname extends string = "/",
>({
	subdomain,
	pathname,
	params,
	currentHost,
	children,
	prefetch,
	...props
}: SubdomainLinkProps<Subdomain, Pathname>) {
	const locationHref = useSyncExternalStore(
		subscribe,
		getSnapshot,
		getServerSnapshot
	)

	const computedHref = buildHref({
		locationHref,
		currentHost,
		subdomain,
		pathname,
		params,
	})

	return (
		<Link
			href={computedHref as ComponentProps<typeof Link>["href"]}
			prefetch={locationHref ? (prefetch ?? null) : null}
			{...(props as Omit<ComponentProps<typeof Link>, "href" | "prefetch">)}
		>
			{children}
		</Link>
	)
}
