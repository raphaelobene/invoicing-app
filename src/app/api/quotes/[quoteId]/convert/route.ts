import type { NextRequest } from "next/server"

import * as quoteService from "@/features/quotes/service"
import { toResponse } from "@/lib/api-response"
import { validationError } from "@/lib/errors"
import { requireOrgContext } from "@/lib/session"
import { err } from "@/lib/utils/result"

type RouteParams = { params: Promise<{ quoteId: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))

	const { quoteId } = await params
	const body = (await request.json().catch(() => ({}))) as { dueDate?: string }
	const dueDateRaw = body.dueDate

	// Default: 30 days out if the caller doesn't specify net terms.
	const dueDate = dueDateRaw
		? new Date(dueDateRaw)
		: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
	if (Number.isNaN(dueDate.getTime())) {
		return toResponse(err(validationError("Invalid due date.")))
	}

	const result = await quoteService.convertQuoteToInvoice(
		ctxResult.value.organizationId,
		quoteId,
		dueDate
	)
	return toResponse(result, 201)
}
