import type { Client, Prisma } from "@/generated/prisma/client"
import { notFoundError, unexpectedError, type AppError } from "@/lib/errors"
import prisma from "@/lib/prisma"
import { err, ok, type Result } from "@/lib/utils/result"

import type { ClientInput } from "./schema"

const PAGE_SIZE_DEFAULT = 25
const PAGE_SIZE_MAX = 100

export interface Page<T> {
	items: T[]
	nextCursor: string | null
}

export async function listClients(
	organizationId: string,
	opts: { search?: string; cursor?: string; take?: number } = {}
): Promise<Result<Page<Client>, AppError>> {
	const take = Math.min(opts.take ?? PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX)
	try {
		const where: Prisma.ClientWhereInput = {
			organizationId,
			deletedAt: null,
			...(opts.search
				? { name: { contains: opts.search, mode: "insensitive" as const } }
				: {}),
		}

		const rows = await prisma.client.findMany({
			where,
			orderBy: { name: "asc" },
			take: take + 1,
			...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
		})

		const hasMore = rows.length > take
		const items = hasMore ? rows.slice(0, take) : rows
		return ok({
			items,
			nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
		})
	} catch (cause) {
		return err(unexpectedError("Failed to list clients.", cause))
	}
}

export async function findClientById(
	organizationId: string,
	clientId: string
): Promise<Result<Client, AppError>> {
	try {
		const client = await prisma.client.findFirst({
			where: { id: clientId, organizationId, deletedAt: null },
		})
		if (!client) return err(notFoundError("Client not found."))
		return ok(client)
	} catch (cause) {
		return err(unexpectedError("Failed to load client.", cause))
	}
}

export async function createClient(
	organizationId: string,
	input: ClientInput
): Promise<Result<Client, AppError>> {
	try {
		const client = await prisma.client.create({
			data: {
				organizationId,
				name: input.name,
				email: input.email ?? null,
				phone: input.phone ?? null,
				billingAddress: input.billingAddress ?? null,
				taxId: input.taxId ?? null,
				notes: input.notes ?? null,
			},
		})
		return ok(client)
	} catch (cause) {
		return err(unexpectedError("Failed to create client.", cause))
	}
}

export async function updateClient(
	organizationId: string,
	clientId: string,
	input: ClientInput
): Promise<Result<Client, AppError>> {
	try {
		const { count } = await prisma.client.updateMany({
			where: { id: clientId, organizationId, deletedAt: null },
			data: {
				name: input.name,
				email: input.email ?? null,
				phone: input.phone ?? null,
				billingAddress: input.billingAddress ?? null,
				taxId: input.taxId ?? null,
				notes: input.notes ?? null,
			},
		})
		if (count === 0) return err(notFoundError("Client not found."))

		const client = await prisma.client.findUniqueOrThrow({
			where: { id: clientId },
		})
		return ok(client)
	} catch (cause) {
		return err(unexpectedError("Failed to update client.", cause))
	}
}

/**
 * Soft delete only. A client can be attached to years of invoice history —
 * hard-deleting it would either cascade-orphan those records or (as we've
 * configured via onDelete: Restrict) just fail. Hiding it from lists while
 * keeping the row intact is what lets old invoices keep rendering a client
 * name years later.
 */
export async function softDeleteClient(
	organizationId: string,
	clientId: string
): Promise<Result<void, AppError>> {
	try {
		const { count } = await prisma.client.updateMany({
			where: { id: clientId, organizationId, deletedAt: null },
			data: { deletedAt: new Date() },
		})
		if (count === 0) return err(notFoundError("Client not found."))
		return ok(undefined)
	} catch (cause) {
		return err(unexpectedError("Failed to delete client.", cause))
	}
}
