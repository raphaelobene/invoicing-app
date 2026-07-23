import { NextResponse, type NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

/**
 * This only checks whether a session cookie *exists*, so it can redirect
 * anonymous visitors away from /dashboard etc. before a single byte of the
 * page renders. It intentionally does NOT decide who can see what — cookie
 * presence isn't proof of a valid session, and per Next's own guidance
 * (CVE-2025-29927) auth should never be enforced solely in proxy/middleware.
 * The real check is requireOrgContext() in lib/session.ts, called from
 * every server component and API route that touches tenant data.
 */
const PUBLIC_ROUTES = ["/signin", "/signup"]

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl
	const hasSessionCookie = getSessionCookie(request)

	const isPublicRoute = PUBLIC_ROUTES.some((route) =>
		pathname.startsWith(route)
	)

	// Sound direction only: no cookie -> definitely not authenticated.
	// We deliberately do NOT redirect *away* from public routes based on
	// cookie presence — a cookie existing doesn't mean the session is
	// still valid, and doing so caused a redirect loop with the
	// downstream requireOrgContext() check. That decision belongs to
	// (auth)/layout.tsx, which can call auth.api.getSession() for real.
	if (!hasSessionCookie && !isPublicRoute && pathname !== "/") {
		const signinUrl = new URL("/signin", request.url)
		signinUrl.searchParams.set("redirectTo", pathname)
		return NextResponse.redirect(signinUrl)
	}

	return NextResponse.next()
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
