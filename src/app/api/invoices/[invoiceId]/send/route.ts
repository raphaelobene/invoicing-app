import type { NextRequest } from "next/server"
import { requireOrgContext } from "@/lib/session"
import { toResponse } from "@/lib/api-response"
import { err } from "@/lib/utils/result"
import * as invoiceService from "@/features/invoices/service"

type RouteParams = { params: Promise<{ invoiceId: string }> }

export async function POST(_request: NextRequest, { params }: RouteParams) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))
	const ctx = ctxResult.value

	const { invoiceId } = await params
	const result = await invoiceService.sendInvoiceEmail(ctx.organizationId, invoiceId, {
		name: ctx.userName,
		email: ctx.userEmail,
	})
	return toResponse(result)
}
