/**
 * Every data-access and service function in this app returns
 * Result<T, AppError> instead of throwing. AppError is a closed,
 * discriminated union — that's what lets lib/api-response.ts use
 * match().exhaustive() to turn any error into the right HTTP response
 * without an `if` chain that can silently miss a case.
 *
 * Add a new "kind" here → the compiler will fail everywhere that
 * exhaustively matches on AppError until you handle it.
 */
export type AppError =
	| {
			kind: "VALIDATION"
			message: string
			fieldErrors?: Record<string, string[]> | undefined
	  }
	| { kind: "NOT_FOUND"; message: string }
	| { kind: "FORBIDDEN"; message: string }
	| { kind: "UNAUTHENTICATED"; message: string }
	| { kind: "CONFLICT"; message: string }
	| { kind: "UNEXPECTED"; message: string; cause?: unknown }

export function validationError(
	message: string,
	fieldErrors?: Record<string, string[]>
): AppError {
	return { kind: "VALIDATION", message, fieldErrors }
}

export function notFoundError(message: string): AppError {
	return { kind: "NOT_FOUND", message }
}

export function forbiddenError(
	message = "You don't have access to this."
): AppError {
	return { kind: "FORBIDDEN", message }
}

export function unauthenticatedError(
	message = "Please sign in to continue."
): AppError {
	return { kind: "UNAUTHENTICATED", message }
}

export function conflictError(message: string): AppError {
	return { kind: "CONFLICT", message }
}

export function unexpectedError(message: string, cause?: unknown): AppError {
	return { kind: "UNEXPECTED", message, cause }
}
