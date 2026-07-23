import type { NextRequest } from "next/server"
import { requireOrgContext } from "@/lib/session"
import { toResponse } from "@/lib/api-response"
import { err } from "@/lib/utils/result"
import * as receiptService from "@/features/receipts/service"

type RouteParams = { params: Promise<{ invoiceId: string }> }

/** Fetch the receipt for this invoice, if one has been issued. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))

	const { invoiceId } = await params
	const result = await receiptService.getReceiptForInvoice(ctxResult.value.organizationId, invoiceId)
	return toResponse(result)
}

/**
 * Idempotent "create receipt" action: issues the receipt the first time,
 * returns the existing one on every call after that. See
 * features/receipts/service.ts for why this is safe to call more than once.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))
	const ctx = ctxResult.value

	const { invoiceId } = await params
	const result = await receiptService.getOrCreateReceipt(ctx.organizationId, invoiceId, ctx.userId)
	return toResponse(result, 201)
}
