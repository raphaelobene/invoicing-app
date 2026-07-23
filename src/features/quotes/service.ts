import type { Page } from "@/features/clients/dal"
import * as clientDal from "@/features/clients/dal"
import type { InvoiceDetail } from "@/features/invoices/dal"
import { calculateInvoiceTotals } from "@/features/invoices/lib/totals"
import * as orgDal from "@/features/organizations/dal"
import type { QuoteStatus } from "@/generated/prisma/client"
import { formatMoney } from "@/lib/currency"
import { sendDocumentEmail } from "@/lib/email"
import { conflictError, validationError, type AppError } from "@/lib/errors"
import { QuoteDocument } from "@/lib/pdf/quote-document"
import {
	pdfFileName,
	renderPdfBuffer,
	type GeneratedPdf,
} from "@/lib/pdf/render"
import { format } from "@/lib/utils/formatter"
import { match } from "@/lib/utils/pattern-match"
import { err, ok, type Result } from "@/lib/utils/result"

import type { QuoteDetail, QuoteListItem } from "./dal"
import * as quoteDal from "./dal"
import { quoteInputSchema } from "./schema"

function parseQuoteInput(raw: unknown) {
	const parsed = quoteInputSchema.safeParse(raw)
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
	return quoteDal.listQuotes(organizationId, opts)
}

export async function getQuote(
	organizationId: string,
	quoteId: string
): Promise<Result<QuoteDetail, AppError>> {
	return quoteDal.findQuoteById(organizationId, quoteId)
}

export async function createQuote(
	organizationId: string,
	createdById: string,
	defaultCurrency: string,
	raw: unknown
): Promise<Result<QuoteDetail, AppError>> {
	const parsed = parseQuoteInput(raw)
	if (parsed.isErr()) return err(parsed.error)
	const input = parsed.value

	const clientResult = await clientDal.findClientById(
		organizationId,
		input.clientId
	)
	if (clientResult.isErr()) return err(clientResult.error)

	const totals = calculateInvoiceTotals(input.items, input.discountTotal)

	return quoteDal.createQuote(organizationId, {
		clientId: input.clientId,
		issueDate: new Date(input.issueDate),
		expiryDate: new Date(input.expiryDate),
		currency: input.currency ?? defaultCurrency,
		notes: input.notes,
		createdById,
		totals,
	})
}

export async function updateQuote(
	organizationId: string,
	quoteId: string,
	defaultCurrency: string,
	raw: unknown
): Promise<Result<QuoteDetail, AppError>> {
	const parsed = parseQuoteInput(raw)
	if (parsed.isErr()) return err(parsed.error)
	const input = parsed.value

	const clientResult = await clientDal.findClientById(
		organizationId,
		input.clientId
	)
	if (clientResult.isErr()) return err(clientResult.error)

	const totals = calculateInvoiceTotals(input.items, input.discountTotal)

	return quoteDal.updateDraftQuote(organizationId, quoteId, {
		clientId: input.clientId,
		issueDate: new Date(input.issueDate),
		expiryDate: new Date(input.expiryDate),
		currency: input.currency ?? defaultCurrency,
		notes: input.notes,
		totals,
	})
}

/** Same idea as invoices: CONVERTED is only reachable through convertQuoteToInvoice(). */
function allowedManualTransitions(current: QuoteStatus): QuoteStatus[] {
	return match(current)
		.with("DRAFT", () => ["SENT", "REJECTED"] as QuoteStatus[])
		.with("SENT", () => ["ACCEPTED", "REJECTED", "EXPIRED"] as QuoteStatus[])
		.with("ACCEPTED", () => ["REJECTED"] as QuoteStatus[])
		.with("REJECTED", () => [] as QuoteStatus[])
		.with("EXPIRED", () => [] as QuoteStatus[])
		.with("CONVERTED", () => [] as QuoteStatus[])
		.exhaustive()
}

export async function transitionQuoteStatus(
	organizationId: string,
	quoteId: string,
	nextStatus: QuoteStatus
): Promise<Result<QuoteDetail, AppError>> {
	const currentResult = await quoteDal.findQuoteById(organizationId, quoteId)
	if (currentResult.isErr()) return err(currentResult.error)

	const allowed = allowedManualTransitions(currentResult.value.status)
	if (!allowed.includes(nextStatus)) {
		return err(
			conflictError(
				`Can't move a quote from ${currentResult.value.status} to ${nextStatus}.`
			)
		)
	}

	const updateResult = await quoteDal.updateQuoteStatus(
		organizationId,
		quoteId,
		nextStatus
	)
	if (updateResult.isErr()) return err(updateResult.error)
	return quoteDal.findQuoteById(organizationId, quoteId)
}

export async function convertQuoteToInvoice(
	organizationId: string,
	quoteId: string,
	dueDate: Date
): Promise<Result<InvoiceDetail, AppError>> {
	return quoteDal.convertQuoteToInvoice(organizationId, quoteId, dueDate)
}

export async function getQuotePdf(
	organizationId: string,
	quoteId: string
): Promise<Result<GeneratedPdf, AppError>> {
	const quoteResult = await quoteDal.findQuoteById(organizationId, quoteId)
	if (quoteResult.isErr()) return err(quoteResult.error)

	const orgResult = await orgDal.getOrgBillingProfile(organizationId)
	if (orgResult.isErr()) return err(orgResult.error)

	const buffer = await renderPdfBuffer(
		QuoteDocument({ quote: quoteResult.value, org: orgResult.value })
	)
	return ok({
		buffer,
		filename: pdfFileName("quote", quoteResult.value.number),
	})
}

export async function sendQuoteEmail(
	organizationId: string,
	quoteId: string,
	sender: { name: string; email: string }
): Promise<Result<QuoteDetail, AppError>> {
	const quoteResult = await quoteDal.findQuoteById(organizationId, quoteId)
	if (quoteResult.isErr()) return err(quoteResult.error)
	const quote = quoteResult.value

	if (!quote.client.email) {
		return err(
			validationError("This client doesn't have an email address on file.", {
				clientEmail: ["Add an email address to the client before sending."],
			})
		)
	}

	const orgResult = await orgDal.getOrgBillingProfile(organizationId)
	if (orgResult.isErr()) return err(orgResult.error)
	const org = orgResult.value

	const buffer = await renderPdfBuffer(QuoteDocument({ quote, org }))

	const bodyText = [
		`Hi ${quote.client.name},`,
		`Please find attached quote ${quote.number} for ${formatMoney(quote.total, quote.currency)}, valid until ${format(quote.expiryDate).date({ dateStyle: "long" })}.`,
		`Let us know if you'd like to move forward.`,
		`Thanks,\n${sender.name}\n${org.name}`,
	].join("\n\n")

	const sendResult = await sendDocumentEmail({
		to: quote.client.email,
		fromName: org.name,
		replyTo: org.billingEmail ?? sender.email,
		subject: `Quote ${quote.number} from ${org.name}`,
		bodyText,
		attachment: {
			filename: pdfFileName("quote", quote.number),
			content: buffer,
		},
	})
	if (sendResult.isErr()) return err(sendResult.error)

	return ok(quote)
}
