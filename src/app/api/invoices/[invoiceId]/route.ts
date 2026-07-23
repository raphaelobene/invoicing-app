import type { NextRequest } from "next/server"

import * as invoiceService from "@/features/invoices/service"
import { toResponse } from "@/lib/api-response"
import { requireOrgContext } from "@/lib/session"
import { err } from "@/lib/utils/result"

type RouteParams = { params: Promise<{ invoiceId: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))

	const { invoiceId } = await params
	const result = await invoiceService.getInvoice(
		ctxResult.value.organizationId,
		invoiceId
	)
	return toResponse(result)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))
	const ctx = ctxResult.value

	const { invoiceId } = await params
	const body = await request.json()
	const result = await invoiceService.updateInvoice(
		ctx.organizationId,
		invoiceId,
		ctx.organizationDefaultCurrency ?? "",
		body
	)
	return toResponse(result)
}
