import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { requireOrgContext } from "@/lib/session"
import { toResponse } from "@/lib/api-response"
import { err } from "@/lib/utils/result"
import * as quoteService from "@/features/quotes/service"

type RouteParams = { params: Promise<{ quoteId: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))

	const { quoteId } = await params
	const result = await quoteService.getQuotePdf(ctxResult.value.organizationId, quoteId)
	if (result.isErr()) return toResponse(err(result.error))

	const { buffer, filename } = result.value
	return new NextResponse(new Uint8Array(buffer), {
		status: 200,
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": `inline; filename="${filename}"`,
			"Content-Length": String(buffer.length),
		},
	})
}
