import { z } from "zod"

import { emptyToUndefined } from "@/lib/validation"

export const invoiceItemInputSchema = z.object({
	description: z
		.string()
		.trim()
		.min(1, { error: "Description is required" })
		.max(500),
	quantity: z.coerce.number().positive({ error: "Must be greater than 0" }),
	unitPrice: z.coerce.number().nonnegative({ error: "Can't be negative" }),
	taxRate: z.coerce.number().min(0).max(100).default(0),
})

/**
 * issueDate/dueDate are plain strings here, not z.coerce.date(). A native
 * <input type="date"> always hands React Hook Form a "YYYY-MM-DD" string —
 * if this schema's output type were Date, useForm<InvoiceInput> would
 * claim the field holds a Date while the DOM is actually writing a string
 * into it. The service layer converts to Date right before it hits Prisma
 * (see features/invoices/service.ts); nothing in between needs a real Date.
 */
export const invoiceInputSchema = z
	.object({
		clientId: z.string().min(1, { error: "Select a client" }),
		issueDate: z.string().min(1, { error: "Enter an issue date" }),
		dueDate: z.string().min(1, { error: "Enter a due date" }),
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
	.refine((data) => new Date(data.dueDate) >= new Date(data.issueDate), {
		error: "Due date can't be before the issue date",
		path: ["dueDate"],
	})

export type InvoiceFormValues = z.input<typeof invoiceInputSchema>
export type InvoiceInput = z.output<typeof invoiceInputSchema>

export type InvoiceItemInput = z.infer<typeof invoiceItemInputSchema>

export const recordPaymentSchema = z.object({
	amount: z.coerce
		.number()
		.positive({ error: "Enter an amount greater than 0" }),
	paidAt: z.string().min(1, { error: "Enter a date" }),
	method: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
	note: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
})

export type RecordPaymentFormValues = z.input<typeof recordPaymentSchema>
export type RecordPaymentInput = z.output<typeof recordPaymentSchema>

export const invoiceSearchParams = z.object({
	query: z.string().trim().default(""),
	status: z
		.enum(["ALL", "DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "VOID"])
		.default("ALL"),
})

export const defaultInvoiceSearchParams = invoiceSearchParams.parse({})

export type InvoiceSearchParams = z.infer<typeof invoiceSearchParams>

export type StatusType = InvoiceSearchParams["status"]
