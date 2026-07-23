import type { NextRequest } from "next/server"
import { requireOrgContext } from "@/lib/session"
import { toResponse } from "@/lib/api-response"
import { err } from "@/lib/utils/result"
import * as invoiceService from "@/features/invoices/service"

type RouteParams = { params: Promise<{ invoiceId: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))

	const { invoiceId } = await params
	const body = await request.json()
	const result = await invoiceService.recordPayment(ctxResult.value.organizationId, invoiceId, body)
	return toResponse(result, 201)
}
