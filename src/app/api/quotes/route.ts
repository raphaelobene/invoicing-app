import type { NextRequest } from "next/server"
import { requireOrgContext } from "@/lib/session"
import { toResponse } from "@/lib/api-response"
import { err } from "@/lib/utils/result"
import type { QuoteStatus } from "@/app/generated/prisma/client"
import * as quoteService from "@/features/quotes/service"

export async function GET(request: NextRequest) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))

	const { searchParams } = request.nextUrl
	const result = await quoteService.listQuotes(ctxResult.value.organizationId, {
		status: (searchParams.get("status") as QuoteStatus) || undefined,
		clientId: searchParams.get("clientId") ?? undefined,
		search: searchParams.get("search") ?? undefined,
		cursor: searchParams.get("cursor") ?? undefined,
		take: searchParams.get("take") ? Number(searchParams.get("take")) : undefined,
	})
	return toResponse(result)
}

export async function POST(request: NextRequest) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))
	const ctx = ctxResult.value

	const body = await request.json()
	const result = await quoteService.createQuote(
		ctx.organizationId,
		ctx.userId,
		ctx.organizationDefaultCurrency,
		body
	)
	return toResponse(result, 201)
}
