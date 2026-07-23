import * as invoiceDal from "@/features/invoices/dal"
import * as orgDal from "@/features/organizations/dal"
import { formatMoney } from "@/lib/currency"
import { sendDocumentEmail } from "@/lib/email"
import { conflictError, validationError, type AppError } from "@/lib/errors"
import { ReceiptDocument } from "@/lib/pdf/receipt-document"
import {
	pdfFileName,
	renderPdfBuffer,
	type GeneratedPdf,
} from "@/lib/pdf/render"
import { err, ok, type Result } from "@/lib/utils/result"

import type { ReceiptDetail } from "./dal"
import * as receiptDal from "./dal"

/**
 * Get-or-create: the "Create receipt" button is idempotent from the
 * caller's point of view. First call issues the receipt; every call after
 * that (a second click, a page refresh) just returns the one that already
 * exists instead of erroring, because from a user's perspective "the
 * receipt" is a property of the invoice, not a one-shot action.
 */
export async function getOrCreateReceipt(
	organizationId: string,
	invoiceId: string,
	createdById: string
): Promise<Result<ReceiptDetail, AppError>> {
	const existingResult = await receiptDal.findReceiptByInvoiceId(
		organizationId,
		invoiceId
	)
	if (existingResult.isErr()) return err(existingResult.error)
	if (existingResult.value) return ok(existingResult.value)

	const invoiceResult = await invoiceDal.findInvoiceById(
		organizationId,
		invoiceId
	)
	if (invoiceResult.isErr()) return err(invoiceResult.error)
	const invoice = invoiceResult.value

	// A receipt certifies the invoice is settled in full — issuing one
	// against anything less would misrepresent what the client actually
	// paid. Partial payments still show on the invoice's own payment
	// history; they just don't get a receipt of their own here.
	if (invoice.status !== "PAID") {
		return err(
			conflictError(
				"A receipt can only be issued once an invoice is fully paid."
			)
		)
	}

	return receiptDal.createReceiptForInvoice(organizationId, invoiceId, {
		amount: invoice.total,
		createdById,
	})
}

export async function getReceiptForInvoice(
	organizationId: string,
	invoiceId: string
): Promise<Result<ReceiptDetail, AppError>> {
	const result = await receiptDal.findReceiptByInvoiceId(
		organizationId,
		invoiceId
	)
	if (result.isErr()) return err(result.error)
	if (!result.value)
		return err(
			conflictError("No receipt has been issued for this invoice yet.")
		)
	return ok(result.value)
}

export async function getReceiptPdf(
	organizationId: string,
	invoiceId: string
): Promise<Result<GeneratedPdf, AppError>> {
	const receiptResult = await getReceiptForInvoice(organizationId, invoiceId)
	if (receiptResult.isErr()) return err(receiptResult.error)

	const orgResult = await orgDal.getOrgBillingProfile(organizationId)
	if (orgResult.isErr()) return err(orgResult.error)

	const buffer = await renderPdfBuffer(
		ReceiptDocument({ receipt: receiptResult.value, org: orgResult.value })
	)
	return ok({
		buffer,
		filename: pdfFileName("receipt", receiptResult.value.number),
	})
}

export async function sendReceiptEmail(
	organizationId: string,
	invoiceId: string,
	sender: { name: string; email: string }
): Promise<Result<ReceiptDetail, AppError>> {
	const receiptResult = await getReceiptForInvoice(organizationId, invoiceId)
	if (receiptResult.isErr()) return err(receiptResult.error)
	const receipt = receiptResult.value
	const { invoice } = receipt

	if (!invoice.client.email) {
		return err(
			validationError("This client doesn't have an email address on file.", {
				clientEmail: ["Add an email address to the client before sending."],
			})
		)
	}

	const orgResult = await orgDal.getOrgBillingProfile(organizationId)
	if (orgResult.isErr()) return err(orgResult.error)
	const org = orgResult.value

	const buffer = await renderPdfBuffer(ReceiptDocument({ receipt, org }))

	const bodyText = [
		`Hi ${invoice.client.name},`,
		`Thanks for your payment. Attached is receipt ${receipt.number} confirming ${formatMoney(receipt.amount, invoice.currency)} received in full for invoice ${invoice.number}.`,
		`Thanks,\n${sender.name}\n${org.name}`,
	].join("\n\n")

	const sendResult = await sendDocumentEmail({
		to: invoice.client.email,
		fromName: org.name,
		replyTo: org.billingEmail ?? sender.email,
		subject: `Receipt ${receipt.number} from ${org.name}`,
		bodyText,
		attachment: {
			filename: pdfFileName("receipt", receipt.number),
			content: buffer,
		},
	})
	if (sendResult.isErr()) return err(sendResult.error)

	return ok(receipt)
}
