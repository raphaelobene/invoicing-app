import { requireOrgContext } from "@/lib/session"
import { toResponse } from "@/lib/api-response"
import { err } from "@/lib/utils/result"
import { getDashboardSummary } from "@/features/dashboard/dal"

export async function GET() {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) return toResponse(err(ctxResult.error))

	const result = await getDashboardSummary(ctxResult.value.organizationId)
	return toResponse(result)
}
