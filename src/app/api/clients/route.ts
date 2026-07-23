import type { NextRequest } from "next/server"
import { requireOrgContext } from "@/lib/session"
import { toResponse } from "@/lib/api-response"
import { err } from "@/lib/utils/result"
import * as clientService from "@/features/clients/service"

export async function GET(request: NextRequest) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))

	const { searchParams } = request.nextUrl
	const result = await clientService.listClients(ctxResult.value.organizationId, {
		search: searchParams.get("search") ?? undefined,
		cursor: searchParams.get("cursor") ?? undefined,
		take: searchParams.get("take") ? Number(searchParams.get("take")) : undefined,
	})
	return toResponse(result)
}

export async function POST(request: NextRequest) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))

	const body = await request.json()
	const result = await clientService.createClient(ctxResult.value.organizationId, body)
	return toResponse(result, 201)
}
