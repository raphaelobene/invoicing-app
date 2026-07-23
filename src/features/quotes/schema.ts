import { z } from "zod"

import { invoiceItemInputSchema } from "@/features/invoices/schema"
import { emptyToUndefined } from "@/lib/validation"

// Same reasoning as features/invoices/schema.ts: dates stay strings here
// (what a native <input type="date"> actually produces) and get turned
// into Date objects in the service layer, right before Prisma needs them.
export const quoteInputSchema = z
	.object({
		clientId: z.string().min(1, { error: "Select a client" }),
		issueDate: z.string().min(1, { error: "Enter an issue date" }),
		expiryDate: z.string().min(1, { error: "Enter an expiry date" }),
		currency: z.preprocess(emptyToUndefined, z.string().length(3).optional()),
		notes: z.preprocess(
			emptyToUndefined,
			z.string().trim().max(2000).optional()
		),
		discountTotal: z.coerce.number().nonnegative().default(0),
		items: z
			.array(invoiceItemInputSchema)
			.min(1, { error: "Add at least one line item" }),
	})
	.refine((data) => new Date(data.expiryDate) >= new Date(data.issueDate), {
		error: "Expiry date can't be before the issue date",
		path: ["expiryDate"],
	})

export type QuoteInput = z.infer<typeof quoteInputSchema>
export type QuoteFormValues = z.input<typeof quoteInputSchema>

export const quotesSearchParams = z.object({
	query: z.string().trim().default(""),
	status: z
		.enum([
			"ALL",
			"DRAFT",
			"SENT",
			"ACCEPTED",
			"REJECTED",
			"EXPIRED",
			"CONVERTED",
		])
		.default("ALL"),
})

export const defaultQuotesSearchParams = quotesSearchParams.parse({})

export type QuotesSearchParams = z.infer<typeof quotesSearchParams>

export type StatusType = QuotesSearchParams["status"]
