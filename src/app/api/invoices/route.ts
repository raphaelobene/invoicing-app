import type { NextRequest } from "next/server"

import * as invoiceService from "@/features/invoices/service"
import type { InvoiceStatus } from "@/generated/prisma/client"
import { toResponse } from "@/lib/api-response"
import { requireOrgContext } from "@/lib/session"
import { err } from "@/lib/utils/result"

export async function GET(request: NextRequest) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))

	const { searchParams } = request.nextUrl
	const status = searchParams.get("status") as InvoiceStatus | null
	const clientId = searchParams.get("clientId")
	const search = searchParams.get("search")
	const cursor = searchParams.get("cursor")
	const take = searchParams.get("take")
		? Number(searchParams.get("take"))
		: undefined
	const result = await invoiceService.listInvoices(
		ctxResult.value.organizationId,
		{
			...(status !== null ? { status } : {}),
			...(clientId !== null ? { clientId } : {}),
			...(search !== null ? { search } : {}),
			...(cursor !== null ? { cursor } : {}),
			...(take !== undefined ? { take } : {}),
		}
	)
	return toResponse(result)
}

export async function POST(request: NextRequest) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))
	const ctx = ctxResult.value

	const body = await request.json()
	const result = await invoiceService.createInvoice(
		ctx.organizationId,
		ctx.userId,
		ctx.organizationDefaultCurrency ?? "",
		body
	)
	return toResponse(result, 201)
}
