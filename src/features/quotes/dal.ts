import type { Page } from "@/features/clients/dal"
import type { InvoiceDetail } from "@/features/invoices/dal"
import type { InvoiceTotals } from "@/features/invoices/lib/totals"
import {
	nextInvoiceNumber,
	nextQuoteNumber,
} from "@/features/organizations/numbering"
import type { Prisma, Quote, QuoteStatus } from "@/generated/prisma/client"
import {
	conflictError,
	notFoundError,
	unexpectedError,
	type AppError,
} from "@/lib/errors"
import prisma from "@/lib/prisma"
import { err, ok, type Result } from "@/lib/utils/result"

const PAGE_SIZE_DEFAULT = 25
const PAGE_SIZE_MAX = 100

const quoteListSelect = {
	id: true,
	number: true,
	status: true,
	issueDate: true,
	expiryDate: true,
	currency: true,
	total: true,
	client: { select: { id: true, name: true } },
} satisfies Prisma.QuoteSelect

export type QuoteListItem = Prisma.QuoteGetPayload<{
	select: typeof quoteListSelect
}>

const quoteDetailInclude = {
	client: true,
	items: { orderBy: { sortOrder: "asc" } },
	createdBy: { select: { id: true, name: true } },
} satisfies Prisma.QuoteInclude

export type QuoteDetail = Prisma.QuoteGetPayload<{
	include: typeof quoteDetailInclude
}>

const invoiceDetailInclude = {
	client: true,
	items: { orderBy: { sortOrder: "asc" } },
	payments: { orderBy: { paidAt: "desc" } },
	createdBy: { select: { id: true, name: true } },
} satisfies Prisma.InvoiceInclude

export async function listQuotes(
	organizationId: string,
	opts: {
		status?: QuoteStatus
		clientId?: string
		search?: string
		cursor?: string
		take?: number
	} = {}
): Promise<Result<Page<QuoteListItem>, AppError>> {
	const take = Math.min(opts.take ?? PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX)
	try {
		const where: Prisma.QuoteWhereInput = {
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
		const rows = await prisma.quote.findMany({
			where,
			select: quoteListSelect,
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
		return err(unexpectedError("Failed to list quotes.", cause))
	}
}

export async function findQuoteById(
	organizationId: string,
	quoteId: string
): Promise<Result<QuoteDetail, AppError>> {
	try {
		const quote = await prisma.quote.findFirst({
			where: { id: quoteId, organizationId },
			include: quoteDetailInclude,
		})
		if (!quote) return err(notFoundError("Quote not found."))
		return ok(quote)
	} catch (cause) {
		return err(unexpectedError("Failed to load quote.", cause))
	}
}

export interface CreateQuoteData {
	clientId: string
	issueDate: Date
	expiryDate: Date
	currency: string
	notes?: string | undefined
	createdById: string
	totals: InvoiceTotals
}

export async function createQuote(
	organizationId: string,
	data: CreateQuoteData
): Promise<Result<QuoteDetail, AppError>> {
	try {
		const quote = await prisma.$transaction(async (tx) => {
			const number = await nextQuoteNumber(tx, organizationId)
			return tx.quote.create({
				data: {
					organizationId,
					clientId: data.clientId,
					createdById: data.createdById,
					number,
					issueDate: data.issueDate,
					expiryDate: data.expiryDate,
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
				include: quoteDetailInclude,
			})
		})
		return ok(quote)
	} catch (cause) {
		return err(unexpectedError("Failed to create quote.", cause))
	}
}

export interface UpdateQuoteData extends CreateQuoteData {}

export async function updateDraftQuote(
	organizationId: string,
	quoteId: string,
	data: Omit<UpdateQuoteData, "createdById">
): Promise<Result<QuoteDetail, AppError>> {
	try {
		const quote = await prisma.$transaction(async (tx) => {
			const existing = await tx.quote.findFirst({
				where: { id: quoteId, organizationId, status: "DRAFT" },
				select: { id: true },
			})
			if (!existing) return null

			await tx.quoteItem.deleteMany({ where: { quoteId } })
			return tx.quote.update({
				where: { id: quoteId },
				data: {
					clientId: data.clientId,
					issueDate: data.issueDate,
					expiryDate: data.expiryDate,
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
				include: quoteDetailInclude,
			})
		})
		if (!quote) return err(conflictError("Only draft quotes can be edited."))
		return ok(quote)
	} catch (cause) {
		return err(unexpectedError("Failed to update quote.", cause))
	}
}

export async function updateQuoteStatus(
	organizationId: string,
	quoteId: string,
	status: QuoteStatus
): Promise<Result<Quote, AppError>> {
	try {
		const { count } = await prisma.quote.updateMany({
			where: { id: quoteId, organizationId },
			data: { status },
		})
		if (count === 0) return err(notFoundError("Quote not found."))
		const quote = await prisma.quote.findUniqueOrThrow({
			where: { id: quoteId },
		})
		return ok(quote)
	} catch (cause) {
		return err(unexpectedError("Failed to update quote status.", cause))
	}
}

/**
 * Copies the quote's line items into a brand-new invoice and marks the
 * quote CONVERTED, all inside one transaction — either both happen or
 * neither does. The invoice gets its own number from the invoice sequence;
 * it doesn't inherit the quote's number.
 */
export async function convertQuoteToInvoice(
	organizationId: string,
	quoteId: string,
	dueDate: Date
): Promise<Result<InvoiceDetail, AppError>> {
	try {
		const invoice = await prisma.$transaction(async (tx) => {
			const quote = await tx.quote.findFirst({
				where: {
					id: quoteId,
					organizationId,
					status: { in: ["SENT", "ACCEPTED"] },
				},
				include: { items: { orderBy: { sortOrder: "asc" } } },
			})
			if (!quote) return null

			const number = await nextInvoiceNumber(tx, organizationId)
			const invoice = await tx.invoice.create({
				data: {
					organizationId,
					clientId: quote.clientId,
					createdById: quote.createdById,
					number,
					issueDate: new Date(),
					dueDate,
					currency: quote.currency,
					notes: quote.notes,
					subtotal: quote.subtotal,
					taxTotal: quote.taxTotal,
					discountTotal: quote.discountTotal,
					total: quote.total,
					items: {
						create: quote.items.map((item) => ({
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

			await tx.quote.update({
				where: { id: quoteId },
				data: { status: "CONVERTED", convertedInvoiceId: invoice.id },
			})

			return invoice
		})

		if (!invoice) {
			return err(
				conflictError(
					"Only sent or accepted quotes can be converted to an invoice."
				)
			)
		}
		return ok(invoice)
	} catch (cause) {
		return err(unexpectedError("Failed to convert quote to invoice.", cause))
	}
}
