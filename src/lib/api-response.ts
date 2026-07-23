import { NextResponse } from "next/server"

import type { AppError } from "@/lib/errors"
import { match } from "@/lib/utils/pattern-match"
import type { Result } from "@/lib/utils/result"

// Statuses that must not carry a body, per the HTTP spec.
// Passing a body with any of these throws at the Response constructor level.
const NO_BODY_STATUSES = new Set([204, 205, 304])

/**
 * Every API route ends with `return toResponse(result)`. The match().exhaustive()
 * below is doing real work: if someone adds a new AppError variant in
 * lib/errors.ts and forgets to teach this function about it, this file stops
 * compiling. That's a much better failure mode than a route silently
 * returning a 500 for a case nobody thought about.
 */

export function toResponse<T>(
	result: Result<T, AppError>,
	successStatus = 200
): NextResponse {
	return result.match(
		(data) => {
			if (NO_BODY_STATUSES.has(successStatus)) {
				return new NextResponse(null, { status: successStatus })
			}
			return NextResponse.json({ data }, { status: successStatus })
		},
		(error) => {
			const status = match(error)
				.with({ kind: "VALIDATION" }, () => 422)
				.with({ kind: "UNAUTHENTICATED" }, () => 401)
				.with({ kind: "FORBIDDEN" }, () => 403)
				.with({ kind: "NOT_FOUND" }, () => 404)
				.with({ kind: "CONFLICT" }, () => 409)
				.with({ kind: "UNEXPECTED" }, () => 500)
				.exhaustive()

			if (error.kind === "UNEXPECTED") {
				console.error("[api]", error.message, error.cause)
			}

			return NextResponse.json(
				{
					error: {
						kind: error.kind,
						message: error.message,
						fieldErrors: "fieldErrors" in error ? error.fieldErrors : undefined,
					},
				},
				{ status }
			)
		}
	)
}
