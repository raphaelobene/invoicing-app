import type { Page } from "@/features/clients/dal"
import * as clientDal from "@/features/clients/dal"
import * as orgDal from "@/features/organizations/dal"
import { Prisma, type InvoiceStatus } from "@/generated/prisma/client"
import { formatMoney } from "@/lib/currency"
import { sendDocumentEmail } from "@/lib/email"
import { conflictError, validationError, type AppError } from "@/lib/errors"
import { InvoiceDocument } from "@/lib/pdf/invoice-document"
import { GeneratedPdf, pdfFileName, renderPdfBuffer } from "@/lib/pdf/render"
import { format } from "@/lib/utils/formatter"
import { match } from "@/lib/utils/pattern-match"
import { err, ok, type Result } from "@/lib/utils/result"

import type { InvoiceDetail, InvoiceListItem } from "./dal"
import * as invoiceDal from "./dal"
import { calculateInvoiceTotals } from "./lib/totals"
import { invoiceInputSchema, recordPaymentSchema } from "./schema"

function parseInvoiceInput(raw: unknown) {
	const parsed = invoiceInputSchema.safeParse(raw)
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
	return invoiceDal.listInvoices(organizationId, opts)
}

export async function getInvoice(
	organizationId: string,
	invoiceId: string
): Promise<Result<InvoiceDetail, AppError>> {
	return invoiceDal.findInvoiceById(organizationId, invoiceId)
}

export async function createInvoice(
	organizationId: string,
	createdById: string,
	defaultCurrency: string,
	raw: unknown
): Promise<Result<InvoiceDetail, AppError>> {
	const parsed = parseInvoiceInput(raw)
	if (parsed.isErr()) return err(parsed.error)
	const input = parsed.value

	// Defense in depth: the client's own foreign key only proves the row
	// exists *somewhere* — it doesn't prove it belongs to this org. Without
	// this check, one tenant could attach an invoice to another tenant's
	// client by guessing/leaking an id.
	const clientResult = await clientDal.findClientById(
		organizationId,
		input.clientId
	)
	if (clientResult.isErr()) return err(clientResult.error)

	const totals = calculateInvoiceTotals(input.items, input.discountTotal)

	return invoiceDal.createInvoice(organizationId, {
		clientId: input.clientId,
		issueDate: new Date(input.issueDate),
		dueDate: new Date(input.dueDate),
		currency: input.currency ?? defaultCurrency,
		notes: input.notes,
		createdById,
		totals,
	})
}

export async function updateInvoice(
	organizationId: string,
	invoiceId: string,
	defaultCurrency: string,
	raw: unknown
): Promise<Result<InvoiceDetail, AppError>> {
	const parsed = parseInvoiceInput(raw)
	if (parsed.isErr()) return err(parsed.error)
	const input = parsed.value

	const clientResult = await clientDal.findClientById(
		organizationId,
		input.clientId
	)
	if (clientResult.isErr()) return err(clientResult.error)

	const totals = calculateInvoiceTotals(input.items, input.discountTotal)

	return invoiceDal.updateDraftInvoice(organizationId, invoiceId, {
		clientId: input.clientId,
		issueDate: new Date(input.issueDate),
		dueDate: new Date(input.dueDate),
		currency: input.currency ?? defaultCurrency,
		notes: input.notes,
		totals,
	})
}

/**
 * The set of statuses a person can move an invoice to *by hand*. PAID and
 * PARTIALLY_PAID are reached only through recordPayment() below — you
 * don't get to declare an invoice paid, the ledger does. Kept intentionally
 * conservative for v1; loosen per-status as real workflows demand it.
 *
 * This is the pattern-match library doing real work: add a 7th InvoiceStatus
 * to the Prisma enum and this switch-equivalent stops compiling until you
 * decide what it means here.
 */
function allowedManualTransitions(current: InvoiceStatus): InvoiceStatus[] {
	return match(current)
		.with("DRAFT", () => ["SENT", "VOID"] as InvoiceStatus[])
		.with("SENT", () => ["OVERDUE", "VOID"] as InvoiceStatus[])
		.with("PARTIALLY_PAID", () => ["OVERDUE", "VOID"] as InvoiceStatus[])
		.with("OVERDUE", () => ["SENT", "VOID"] as InvoiceStatus[])
		.with("PAID", () => [] as InvoiceStatus[])
		.with("VOID", () => [] as InvoiceStatus[])
		.exhaustive()
}

export async function transitionInvoiceStatus(
	organizationId: string,
	invoiceId: string,
	nextStatus: InvoiceStatus
): Promise<Result<InvoiceDetail, AppError>> {
	const currentResult = await invoiceDal.findInvoiceById(
		organizationId,
		invoiceId
	)
	if (currentResult.isErr()) return err(currentResult.error)

	const allowed = allowedManualTransitions(currentResult.value.status)
	if (!allowed.includes(nextStatus)) {
		return err(
			conflictError(
				`Can't move an invoice from ${currentResult.value.status} to ${nextStatus}.`
			)
		)
	}

	const updateResult = await invoiceDal.updateInvoiceStatus(
		organizationId,
		invoiceId,
		nextStatus
	)
	if (updateResult.isErr()) return err(updateResult.error)
	return invoiceDal.findInvoiceById(organizationId, invoiceId)
}

export async function recordPayment(
	organizationId: string,
	invoiceId: string,
	raw: unknown
): Promise<Result<InvoiceDetail, AppError>> {
	const parsed = recordPaymentSchema.safeParse(raw)
	if (!parsed.success) {
		const fieldErrors: Record<string, string[]> = {}
		for (const issue of parsed.error.issues) {
			const key = issue.path.join(".") || "_root"
			;(fieldErrors[key] ??= []).push(issue.message)
		}
		return err(validationError("Check the highlighted fields.", fieldErrors))
	}

	const currentResult = await invoiceDal.findInvoiceById(
		organizationId,
		invoiceId
	)
	if (currentResult.isErr()) return err(currentResult.error)
	if (currentResult.value.status === "VOID") {
		return err(
			conflictError("Can't record a payment against a voided invoice.")
		)
	}

	return invoiceDal.recordPayment(organizationId, invoiceId, {
		amount: new Prisma.Decimal(parsed.data.amount),
		paidAt: new Date(parsed.data.paidAt),
		method: parsed.data.method,
		note: parsed.data.note,
	})
}

export async function getInvoicePdf(
	organizationId: string,
	invoiceId: string
): Promise<Result<GeneratedPdf, AppError>> {
	const invoiceResult = await invoiceDal.findInvoiceById(
		organizationId,
		invoiceId
	)
	if (invoiceResult.isErr()) return err(invoiceResult.error)

	const orgResult = await orgDal.getOrgBillingProfile(organizationId)
	if (orgResult.isErr()) return err(orgResult.error)

	const buffer = await renderPdfBuffer(
		InvoiceDocument({ invoice: invoiceResult.value, org: orgResult.value })
	)
	return ok({
		buffer,
		filename: pdfFileName("invoice", invoiceResult.value.number),
	})
}

export async function sendInvoiceEmail(
	organizationId: string,
	invoiceId: string,
	sender: { name: string; email: string }
): Promise<Result<InvoiceDetail, AppError>> {
	const invoiceResult = await invoiceDal.findInvoiceById(
		organizationId,
		invoiceId
	)
	if (invoiceResult.isErr()) return err(invoiceResult.error)
	const invoice = invoiceResult.value

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

	const buffer = await renderPdfBuffer(InvoiceDocument({ invoice, org }))
	const balanceDue = invoice.total.sub(invoice.amountPaid)
	const currency = invoice.currency

	const bodyText = [
		`Hi ${invoice.client.name},`,
		`Please find attached invoice ${invoice.number} for ${formatMoney(invoice.total, currency)}, due ${format(invoice.dueDate).date({ dateStyle: "long" })}.`,
		balanceDue.greaterThan(0)
			? `Balance due: ${formatMoney(balanceDue, currency)}.`
			: `This invoice has been paid in full — thank you.`,
		`Thanks,\n${sender.name}\n${org.name}`,
	].join("\n\n")

	const sendResult = await sendDocumentEmail({
		to: invoice.client.email,
		fromName: org.name,
		replyTo: org.billingEmail ?? sender.email,
		subject: `Invoice ${invoice.number} from ${org.name}`,
		bodyText,
		attachment: {
			filename: pdfFileName("invoice", invoice.number),
			content: buffer,
		},
	})
	if (sendResult.isErr()) return err(sendResult.error)

	return ok(invoice)
}
