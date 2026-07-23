import type { Prisma } from "@/generated/prisma/client"

type Tx = Prisma.TransactionClient

/**
 * `increment: 1` compiles to `SET next_seq = next_seq + 1` at the SQL
 * level, so two people creating invoices for the same org at the same
 * instant still get two distinct numbers — Postgres serializes the row
 * lock, not our application code. Call this from inside the same
 * transaction as the invoice/quote insert; if the insert fails and rolls
 * back, the sequence bump rolls back with it.
 */
export async function nextInvoiceNumber(
	tx: Tx,
	organizationId: string
): Promise<string> {
	const org = await tx.organization.update({
		where: { id: organizationId },
		data: { nextInvoiceSeq: { increment: 1 } },
		select: { invoicePrefix: true, nextInvoiceSeq: true },
	})

	if (org.invoicePrefix === null) {
		throw new Error("Invoice prefix must not be null")
	}

	if (org.nextInvoiceSeq === null) {
		throw new Error("Invoice quote sequence must not be null")
	}

	return formatSequence(org.invoicePrefix, org.nextInvoiceSeq - 1)
}

export async function nextQuoteNumber(
	tx: Tx,
	organizationId: string
): Promise<string> {
	const org = await tx.organization.update({
		where: { id: organizationId },
		data: { nextQuoteSeq: { increment: 1 } },
		select: { quotePrefix: true, nextQuoteSeq: true },
	})

	if (org.quotePrefix === null) {
		throw new Error("Organization quote prefix must not be null")
	}

	if (org.nextQuoteSeq === null) {
		throw new Error("Organization quote sequence must not be null")
	}

	return formatSequence(org.quotePrefix, org.nextQuoteSeq - 1)
}

export async function nextReceiptNumber(
	tx: Tx,
	organizationId: string
): Promise<string> {
	const org = await tx.organization.update({
		where: { id: organizationId },
		data: { nextReceiptSeq: { increment: 1 } },
		select: { receiptPrefix: true, nextReceiptSeq: true },
	})

	if (org.receiptPrefix === null) {
		throw new Error("Organization receipt prefix must not be null")
	}

	if (org.nextReceiptSeq === null) {
		throw new Error("Organization receipt sequence must not be null")
	}

	return formatSequence(org.receiptPrefix, org.nextReceiptSeq - 1)
}

function formatSequence(prefix: string, seq: number): string {
	return `${prefix}-${String(seq).padStart(4, "0")}`
}
