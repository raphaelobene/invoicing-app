import type { NextRequest } from "next/server"
import { requireOrgContext } from "@/lib/session"
import { toResponse } from "@/lib/api-response"
import { err } from "@/lib/utils/result"
import * as quoteService from "@/features/quotes/service"

type RouteParams = { params: Promise<{ quoteId: string }> }

export async function POST(_request: NextRequest, { params }: RouteParams) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))
	const ctx = ctxResult.value

	const { quoteId } = await params
	const result = await quoteService.sendQuoteEmail(ctx.organizationId, quoteId, {
		name: ctx.userName,
		email: ctx.userEmail,
	})
	return toResponse(result)
}
