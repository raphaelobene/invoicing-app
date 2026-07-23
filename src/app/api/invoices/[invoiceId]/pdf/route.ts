import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import * as invoiceService from "@/features/invoices/service"
import { toResponse } from "@/lib/api-response"
import { requireOrgContext } from "@/lib/session"
import { err } from "@/lib/utils/result"

type RouteParams = { params: Promise<{ invoiceId: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))

	const { invoiceId } = await params
	const result = await invoiceService.getInvoicePdf(
		ctxResult.value.organizationId,
		invoiceId
	)

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
