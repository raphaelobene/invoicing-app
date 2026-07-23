import type { NextRequest } from "next/server"

import * as invoiceService from "@/features/invoices/service"
import { toResponse } from "@/lib/api-response"
import { validationError } from "@/lib/errors"
import { requireOrgContext } from "@/lib/session"
import { err } from "@/lib/utils/result"

const VALID_STATUSES = [
	"DRAFT",
	"SENT",
	"PARTIALLY_PAID",
	"PAID",
	"OVERDUE",
	"VOID",
] as const

type RouteParams = { params: Promise<{ invoiceId: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))

	const { invoiceId } = await params
	const body = (await request.json()) as { status?: unknown }
	const status = body.status

	if (
		typeof status !== "string" ||
		!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
	) {
		return toResponse(err(validationError("Invalid status value.")))
	}

	const result = await invoiceService.transitionInvoiceStatus(
		ctxResult.value.organizationId,
		invoiceId,
		status as (typeof VALID_STATUSES)[number]
	)
	return toResponse(result)
}
