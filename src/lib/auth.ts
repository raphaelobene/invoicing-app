import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { organization } from "better-auth/plugins"

import prisma from "@/lib/prisma"

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60,
		},
	},
	plugins: [
		organization({
			allowUserToCreateOrganization: true,
			creatorRole: "owner",
			schema: {
				organization: {
					additionalFields: {
						defaultCurrency: {
							type: "string",
							required: false,
							defaultValue: "NGN",
						},
						invoicePrefix: {
							type: "string",
							required: false,
							defaultValue: "INV",
						},
						quotePrefix: {
							type: "string",
							required: false,
							defaultValue: "QUO",
						},
						receiptPrefix: {
							type: "string",
							required: false,
							defaultValue: "RCT",
						},
						nextInvoiceSeq: {
							type: "number",
							required: false,
							defaultValue: 1,
						},
						nextQuoteSeq: { type: "number", required: false, defaultValue: 1 },
						nextReceiptSeq: {
							type: "number",
							required: false,
							defaultValue: 1,
						},
						billingEmail: { type: "string", required: false },
						billingAddress: { type: "string", required: false },
						taxId: { type: "string", required: false },
					},
				},
			},
		}),
	],
})

export type Auth = typeof auth
