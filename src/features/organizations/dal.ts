import { notFoundError, unexpectedError, type AppError } from "@/lib/errors"
import prisma from "@/lib/prisma"
import { err, ok, type Result } from "@/lib/utils/result"

/**
 * requireOrgContext() only resolves the fields needed for auth/routing
 * (name, slug, defaultCurrency). PDFs and outgoing emails need the rest of
 * the billing profile — address, tax id, sender email — so that's kept as
 * a separate, deliberately small query rather than growing OrgContext for
 * something most requests never touch.
 */
export interface OrgBillingProfile {
	name: string
	billingAddress: string | null
	taxId: string | null
	billingEmail: string | null
}

export async function getOrgBillingProfile(
	organizationId: string
): Promise<Result<OrgBillingProfile, AppError>> {
	try {
		const org = await prisma.organization.findUnique({
			where: { id: organizationId },
			select: {
				name: true,
				billingAddress: true,
				taxId: true,
				billingEmail: true,
			},
		})
		if (!org) return err(notFoundError("Organization not found."))
		return ok(org)
	} catch (cause) {
		return err(
			unexpectedError("Failed to load organization billing profile.", cause)
		)
	}
}
