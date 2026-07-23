import type { NextRequest } from "next/server"
import { requireOrgContext } from "@/lib/session"
import { toResponse } from "@/lib/api-response"
import { err } from "@/lib/utils/result"
import { validationError } from "@/lib/errors"
import * as quoteService from "@/features/quotes/service"

const VALID_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED"] as const

type RouteParams = { params: Promise<{ quoteId: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))

	const { quoteId } = await params
	const body = (await request.json()) as { status?: unknown }
	const status = body?.status

	if (typeof status !== "string" || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
		return toResponse(err(validationError("Invalid status value.")))
	}

	const result = await quoteService.transitionQuoteStatus(
		ctxResult.value.organizationId,
		quoteId,
		status as (typeof VALID_STATUSES)[number]
	)
	return toResponse(result)
}
