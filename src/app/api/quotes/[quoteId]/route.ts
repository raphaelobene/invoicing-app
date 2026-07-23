import type { NextRequest } from "next/server"

import * as quoteService from "@/features/quotes/service"
import { toResponse } from "@/lib/api-response"
import { requireOrgContext } from "@/lib/session"
import { err } from "@/lib/utils/result"

type RouteParams = { params: Promise<{ quoteId: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))

	const { quoteId } = await params
	const result = await quoteService.getQuote(
		ctxResult.value.organizationId,
		quoteId
	)
	return toResponse(result)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))
	const ctx = ctxResult.value

	const { quoteId } = await params
	const body = await request.json()
	const result = await quoteService.updateQuote(
		ctx.organizationId,
		quoteId,
		ctx.organizationDefaultCurrency ?? "",
		body
	)
	return toResponse(result)
}
