import type { Page } from "@/features/clients/dal"
import { nextInvoiceNumber } from "@/features/organizations/numbering"
import type { Invoice, InvoiceStatus, Prisma } from "@/generated/prisma/client"
import {
	conflictError,
	notFoundError,
	unexpectedError,
	type AppError,
} from "@/lib/errors"
import prisma from "@/lib/prisma"
import { err, ok, type Result } from "@/lib/utils/result"

import type { InvoiceTotals } from "./lib/totals"

const PAGE_SIZE_DEFAULT = 25
const PAGE_SIZE_MAX = 100

const invoiceListSelect = {
	id: true,
	number: true,
	status: true,
	issueDate: true,
	dueDate: true,
	currency: true,
	total: true,
	amountPaid: true,
	client: { select: { id: true, name: true } },
} satisfies Prisma.InvoiceSelect

export type InvoiceListItem = Prisma.InvoiceGetPayload<{
	select: typeof invoiceListSelect
}>

const invoiceDetailInclude = {
	client: true,
	items: { orderBy: { sortOrder: "asc" } },
	payments: { orderBy: { paidAt: "desc" } },
	createdBy: { select: { id: true, name: true } },
} satisfies Prisma.InvoiceInclude

export type InvoiceDetail = Prisma.InvoiceGetPayload<{
	include: typeof invoiceDetailInclude
}>

export async function listInvoices(
	organizationId: string,
	opts: {
		status?: InvoiceStatus
		clientId?: string
		search?: string
		cursor?: string
		take?: number
	} = {}
): Promise<Result<Page<InvoiceListItem>, AppError>> {
	const take = Math.min(opts.take ?? PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX)
	try {
		const where: Prisma.InvoiceWhereInput = {
			organizationId,
			...(opts.status ? { status: opts.status } : {}),
			...(opts.clientId ? { clientId: opts.clientId } : {}),
			...(opts.search
				? {
						OR: [
							{
								number: { contains: opts.search, mode: "insensitive" as const },
							},
							{
								client: {
									name: { contains: opts.search, mode: "insensitive" as const },
								},
							},
						],
					}
				: {}),
		}

		const rows = await prisma.invoice.findMany({
			where,
			select: invoiceListSelect,
			orderBy: { issueDate: "desc" },
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
		return err(unexpectedError("Failed to list invoices.", cause))
	}
}

export async function findInvoiceById(
	organizationId: string,
	invoiceId: string
): Promise<Result<InvoiceDetail, AppError>> {
	try {
		const invoice = await prisma.invoice.findFirst({
			where: { id: invoiceId, organizationId },
			include: invoiceDetailInclude,
		})
		if (!invoice) return err(notFoundError("Invoice not found."))
		return ok(invoice)
	} catch (cause) {
		return err(unexpectedError("Failed to load invoice.", cause))
	}
}

export interface CreateInvoiceData {
	clientId: string
	issueDate: Date
	dueDate: Date
	currency: string
	notes?: string | undefined
	createdById: string
	totals: InvoiceTotals
}

export async function createInvoice(
	organizationId: string,
	data: CreateInvoiceData
): Promise<Result<InvoiceDetail, AppError>> {
	try {
		const invoice = await prisma.$transaction(async (tx) => {
			const number = await nextInvoiceNumber(tx, organizationId)
			return tx.invoice.create({
				data: {
					organizationId,
					clientId: data.clientId,
					createdById: data.createdById,
					number,
					issueDate: data.issueDate,
					dueDate: data.dueDate,
					currency: data.currency,
					notes: data.notes ?? null,
					subtotal: data.totals.subtotal,
					taxTotal: data.totals.taxTotal,
					discountTotal: data.totals.discountTotal,
					total: data.totals.total,
					items: {
						create: data.totals.items.map((item) => ({
							description: item.description,
							quantity: item.quantity,
							unitPrice: item.unitPrice,
							taxRate: item.taxRate,
							sortOrder: item.sortOrder,
						})),
					},
				},
				include: invoiceDetailInclude,
			})
		})
		return ok(invoice as unknown as InvoiceDetail)
	} catch (cause) {
		return err(unexpectedError("Failed to create invoice.", cause))
	}
}

export interface UpdateInvoiceData {
	clientId: string
	issueDate: Date
	dueDate: Date
	currency: string
	notes?: string | undefined
	totals: InvoiceTotals
}

/**
 * Only touches invoices still in DRAFT — enforced with a where clause, not
 * a separate read-then-write, so a status change racing this update loses
 * cleanly (updateMany just matches zero rows) instead of clobbering data
 * on a since-sent invoice.
 */
export async function updateDraftInvoice(
	organizationId: string,
	invoiceId: string,
	data: UpdateInvoiceData
): Promise<Result<InvoiceDetail, AppError>> {
	try {
		const invoice = await prisma.$transaction(async (tx) => {
			const existing = await tx.invoice.findFirst({
				where: { id: invoiceId, organizationId, status: "DRAFT" },
				select: { id: true },
			})
			if (!existing) return null

			await tx.invoiceItem.deleteMany({ where: { invoiceId } })
			return tx.invoice.update({
				where: { id: invoiceId },
				data: {
					clientId: data.clientId,
					issueDate: data.issueDate,
					dueDate: data.dueDate,
					currency: data.currency,
					notes: data.notes ?? null,
					subtotal: data.totals.subtotal,
					taxTotal: data.totals.taxTotal,
					discountTotal: data.totals.discountTotal,
					total: data.totals.total,
					items: {
						create: data.totals.items.map((item) => ({
							description: item.description,
							quantity: item.quantity,
							unitPrice: item.unitPrice,
							taxRate: item.taxRate,
							sortOrder: item.sortOrder,
						})),
					},
				},
				include: invoiceDetailInclude,
			})
		})

		if (!invoice) {
			return err(conflictError("Only draft invoices can be edited."))
		}
		return ok(invoice as InvoiceDetail)
	} catch (cause) {
		return err(unexpectedError("Failed to update invoice.", cause))
	}
}

export async function updateInvoiceStatus(
	organizationId: string,
	invoiceId: string,
	status: InvoiceStatus
): Promise<Result<Invoice, AppError>> {
	try {
		const { count } = await prisma.invoice.updateMany({
			where: { id: invoiceId, organizationId },
			data: { status },
		})
		if (count === 0) return err(notFoundError("Invoice not found."))
		const invoice = await prisma.invoice.findUniqueOrThrow({
			where: { id: invoiceId },
		})
		return ok(invoice)
	} catch (cause) {
		return err(unexpectedError("Failed to update invoice status.", cause))
	}
}

export async function recordPayment(
	organizationId: string,
	invoiceId: string,
	payment: {
		amount: Prisma.Decimal
		paidAt: Date
		method?: string | undefined
		note?: string | undefined
	}
): Promise<Result<InvoiceDetail, AppError>> {
	try {
		const invoice = await prisma.$transaction(async (tx) => {
			const existing = await tx.invoice.findFirst({
				where: { id: invoiceId, organizationId },
			})
			if (!existing) return null

			await tx.payment.create({
				data: {
					invoiceId,
					amount: payment.amount,
					paidAt: payment.paidAt,
					method: payment.method ?? null,
					note: payment.note ?? null,
				},
			})

			const newAmountPaid = existing.amountPaid.add(payment.amount)
			const nextStatus: InvoiceStatus = newAmountPaid.greaterThanOrEqualTo(
				existing.total
			)
				? "PAID"
				: newAmountPaid.greaterThan(0)
					? "PARTIALLY_PAID"
					: existing.status

			return tx.invoice.update({
				where: { id: invoiceId },
				data: { amountPaid: newAmountPaid, status: nextStatus },
				include: invoiceDetailInclude,
			})
		})

		if (!invoice) return err(notFoundError("Invoice not found."))
		return ok(invoice)
	} catch (cause) {
		return err(unexpectedError("Failed to record payment.", cause))
	}
}
