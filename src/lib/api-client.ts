export class ApiError extends Error {
	status: number
	fieldErrors: Record<string, string[]> | undefined

	constructor(
		message: string,
		status: number,
		fieldErrors?: Record<string, string[]>
	) {
		super(message)
		this.name = "ApiError"
		this.status = status
		this.fieldErrors = fieldErrors
	}
}

interface ApiEnvelope<T> {
	data?: T
	error?: {
		kind: string
		message: string
		fieldErrors?: Record<string, string[]>
	}
}

export async function apiFetch<T>(
	input: string,
	init?: RequestInit
): Promise<T> {
	const res = await fetch(input, {
		...init,
		headers: { "Content-Type": "application/json", ...init?.headers },
	})

	if (res.status === 204) return undefined as T

	const body = (await res.json()) as ApiEnvelope<T>

	if (!res.ok) {
		throw new ApiError(
			body.error?.message ?? "Something went wrong.",
			res.status,
			body.error?.fieldErrors
		)
	}

	return body.data as T
}
