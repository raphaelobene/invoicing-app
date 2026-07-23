import type { Client } from "@/generated/prisma/client"
import { validationError, type AppError } from "@/lib/errors"
import { err, ok, type Result } from "@/lib/utils/result"

import type { Page } from "./dal"
import * as clientDal from "./dal"
import { clientInputSchema } from "./schema"

function parseClientInput(raw: unknown) {
	const parsed = clientInputSchema.safeParse(raw)
	if (!parsed.success) {
		const fieldErrors: Record<string, string[]> = {}
		for (const issue of parsed.error.issues) {
			const key = issue.path.join(".") || "_root"
			;(fieldErrors[key] ??= []).push(issue.message)
		}
		return err(validationError("Check the highlighted fields.", fieldErrors))
	}
	return ok(parsed.data)
}

export async function listClients(
	organizationId: string,
	opts: { search?: string; cursor?: string; take?: number } = {}
): Promise<Result<Page<Client>, AppError>> {
	return clientDal.listClients(organizationId, opts)
}

export async function getClient(
	organizationId: string,
	clientId: string
): Promise<Result<Client, AppError>> {
	return clientDal.findClientById(organizationId, clientId)
}

export async function createClient(
	organizationId: string,
	raw: unknown
): Promise<Result<Client, AppError>> {
	const parsed = parseClientInput(raw)
	if (parsed.isErr()) return err(parsed.error)
	return clientDal.createClient(organizationId, parsed.value)
}

export async function updateClient(
	organizationId: string,
	clientId: string,
	raw: unknown
): Promise<Result<Client, AppError>> {
	const parsed = parseClientInput(raw)
	if (parsed.isErr()) return err(parsed.error)
	return clientDal.updateClient(organizationId, clientId, parsed.value)
}

export async function deleteClient(
	organizationId: string,
	clientId: string
): Promise<Result<void, AppError>> {
	return clientDal.softDeleteClient(organizationId, clientId)
}
