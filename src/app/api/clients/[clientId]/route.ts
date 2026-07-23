import type { NextRequest } from "next/server"
import { requireOrgContext } from "@/lib/session"
import { toResponse } from "@/lib/api-response"
import { err } from "@/lib/utils/result"
import * as clientService from "@/features/clients/service"

type RouteParams = { params: Promise<{ clientId: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))

	const { clientId } = await params
	const result = await clientService.getClient(ctxResult.value.organizationId, clientId)
	return toResponse(result)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))

	const { clientId } = await params
	const body = await request.json()
	const result = await clientService.updateClient(ctxResult.value.organizationId, clientId, body)
	return toResponse(result)
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))

	const { clientId } = await params
	const result = await clientService.deleteClient(ctxResult.value.organizationId, clientId)
	return toResponse(result, 204)
}
