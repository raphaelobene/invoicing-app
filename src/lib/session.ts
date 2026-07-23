import { headers as nextHeaders } from "next/headers"

import { auth } from "@/lib/auth"
import {
	forbiddenError,
	unauthenticatedError,
	type AppError,
} from "@/lib/errors"
import prisma from "@/lib/prisma"
import { err, ok, type Result } from "@/lib/utils/result"

export type OrgRole = "owner" | "admin" | "member"

export interface OrgContext {
	userId: string
	userName: string
	userEmail: string
	organizationId: string
	organizationName: string
	organizationSlug: string
	organizationDefaultCurrency: string | null
	role: OrgRole
}

/**
 * Resolves "who is this, and which tenant are they acting as" for a server
 * component or API route. Deliberately re-checks membership against the
 * `member` table instead of trusting the session cookie's
 * activeOrganizationId on its own — the cookie says which org the user was
 * last in, not that they still belong to it. Cheap query, real guarantee.
 */
export async function requireOrgContext(): Promise<
	Result<OrgContext, AppError>
> {
	const headerList = await nextHeaders()
	const session = await auth.api.getSession({ headers: headerList })

	if (!session) {
		return err(unauthenticatedError())
	}

	// `activeOrganizationId` is added to the session row by the organization
	// plugin. Cast defensively rather than lean on generic inference here —
	// it's one field, and being explicit is cheaper than debugging a plugin
	// typing edge case.
	const activeOrganizationId = (
		session.session as { activeOrganizationId?: string | null }
	).activeOrganizationId

	if (!activeOrganizationId) {
		return err(forbiddenError("No active organization selected."))
	}

	const membership = await prisma.member.findFirst({
		where: {
			organizationId: activeOrganizationId,
			userId: session.user.id,
		},
		include: {
			organization: {
				select: { name: true, slug: true, defaultCurrency: true },
			},
		},
	})

	if (!membership) {
		return err(forbiddenError("You're not a member of this organization."))
	}

	return ok({
		userId: session.user.id,
		userName: session.user.name,
		userEmail: session.user.email,
		organizationId: activeOrganizationId,
		organizationName: membership.organization.name,
		organizationSlug: membership.organization.slug,
		organizationDefaultCurrency: membership.organization.defaultCurrency,
		role: membership.role as OrgRole,
	})
}

/** Narrow a role check into the same Result pipeline as everything else. */
export function requireRole(
	ctx: OrgContext,
	allowed: OrgRole[]
): Result<OrgContext, AppError> {
	if (!allowed.includes(ctx.role)) {
		return err(forbiddenError("Your role doesn't allow this action."))
	}
	return ok(ctx)
}
