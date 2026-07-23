import z from "zod"

/**  better-auth's inferred Organization type doesn't know about the custom
 * `additionalFields` we've added at the DB level. Rather than casting on
 * every field access (as the previous version did), we cast once at the
 * boundary where we read the org, right here. Runtime shape is correct
 * as long as the org table migration has run.
 */
export interface OrganizationBillingFields {
	defaultCurrency?: string
	invoicePrefix?: string
	quotePrefix?: string
	billingEmail?: string
	billingAddress?: string
	taxId?: string
}

export const organizationSettingsSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Business name is required")
		.max(200, "Keep it under 200 characters"),
	defaultCurrency: z
		.string()
		.trim()
		.toUpperCase()
		.regex(/^[A-Z]{3}$/, "Use a 3-letter ISO code, e.g. USD"),
	invoicePrefix: z.string().trim().max(10, "Keep it under 10 characters"),
	quotePrefix: z.string().trim().max(10, "Keep it under 10 characters"),
	taxId: z.string().trim().max(50, "Keep it under 50 characters"),
	billingAddress: z.string().trim().max(500, "Keep it under 500 characters"),
	billingEmail: z.email({ error: "Enter a valid email" }),
})

export type OrgSettingsFormValues = z.input<typeof organizationSettingsSchema>
export type OrgSettingsInput = z.output<typeof organizationSettingsSchema>
