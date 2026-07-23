import { nextReceiptNumber } from "@/features/organizations/numbering"
import type { Prisma } from "@/generated/prisma/client"
import { notFoundError, unexpectedError, type AppError } from "@/lib/errors"
import prisma from "@/lib/prisma"
import { err, ok, type Result } from "@/lib/utils/result"

const receiptDetailInclude = {
	invoice: {
		include: {
			client: true,
			items: { orderBy: { sortOrder: "asc" } },
			payments: { orderBy: { paidAt: "desc" } },
		},
	},
	createdBy: { select: { id: true, name: true } },
} satisfies Prisma.ReceiptInclude

export type ReceiptDetail = Prisma.ReceiptGetPayload<{
	include: typeof receiptDetailInclude
}>

export async function findReceiptByInvoiceId(
	organizationId: string,
	invoiceId: string
): Promise<Result<ReceiptDetail | null, AppError>> {
	try {
		const receipt = await prisma.receipt.findFirst({
			where: { invoiceId, organizationId },
			include: receiptDetailInclude,
		})
		return ok(receipt)
	} catch (cause) {
		return err(unexpectedError("Failed to load receipt.", cause))
	}
}

export async function findReceiptById(
	organizationId: string,
	receiptId: string
): Promise<Result<ReceiptDetail, AppError>> {
	try {
		const receipt = await prisma.receipt.findFirst({
			where: { id: receiptId, organizationId },
			include: receiptDetailInclude,
		})
		if (!receipt) return err(notFoundError("Receipt not found."))
		return ok(receipt)
	} catch (cause) {
		return err(unexpectedError("Failed to load receipt.", cause))
	}
}

/**
 * Creates the receipt for an invoice inside one transaction: reserve the
 * next receipt number, then insert — same pattern as invoice/quote
 * numbering, so two people can't race their way into a duplicate number.
 * Guarded by the `invoiceId @unique` constraint too, as a last line of
 * defense against a double-click creating two receipts for one invoice.
 */
export async function createReceiptForInvoice(
	organizationId: string,
	invoiceId: string,
	data: { amount: Prisma.Decimal; createdById: string; notes?: string }
): Promise<Result<ReceiptDetail, AppError>> {
	try {
		const receipt = await prisma.$transaction(async (tx) => {
			const existing = await tx.receipt.findUnique({ where: { invoiceId } })
			if (existing) return { alreadyExists: true as const, id: existing.id }

			const number = await nextReceiptNumber(tx, organizationId)
			const created = await tx.receipt.create({
				data: {
					organizationId,
					invoiceId,
					createdById: data.createdById,
					number,
					amount: data.amount,
					notes: data.notes ?? null,
				},
			})
			return { alreadyExists: false as const, id: created.id }
		})

		const full = await prisma.receipt.findUniqueOrThrow({
			where: { id: receipt.id },
			include: receiptDetailInclude,
		})
		return ok(full)
	} catch (cause) {
		return err(unexpectedError("Failed to create receipt.", cause))
	}
}
