import { z } from "zod"

import { emptyToUndefined } from "@/lib/validation"

export const clientInputSchema = z.object({
	name: z.string().trim().min(1, { error: "Name is required" }).max(200),
	email: z.preprocess(
		emptyToUndefined,
		z.email({ error: "Enter a valid email" }).optional()
	),
	phone: z.preprocess(emptyToUndefined, z.string().trim().max(50).optional()),
	billingAddress: z.preprocess(
		emptyToUndefined,
		z.string().trim().max(1000).optional()
	),
	taxId: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
	notes: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
})

export type ClientFormValues = z.input<typeof clientInputSchema>
export type ClientInput = z.output<typeof clientInputSchema>

export const clientSearchParams = z.object({
	query: z.string().trim().default(""),
	new: z.number().int().default(1),
	page: z.number().int().min(1).catch(1).default(1),
})

export const defaultClientSearchParams = clientSearchParams.parse({})

export type ClientSearchParams = z.infer<typeof clientSearchParams>
