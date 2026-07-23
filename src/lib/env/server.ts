import { createEnv } from "@t3-oss/env-nextjs"
import { vercel } from "@t3-oss/env-nextjs/presets-zod"
import { z } from "zod"

/**
 * Server-side environment configuration
 * These variables are only available on the server
 */
export const env = createEnv({
	extends: [vercel()],
	server: {
		/** Database connection URL */
		DATABASE_URL: z.string().min(1),
		/** Better Auth secret for authentication */
		BETTER_AUTH_SECRET: z.string().min(1),
		/** Base URL of the application for Better Auth callbacks */
		BETTER_AUTH_URL: z.url(),
		/** Vercel cron secret for verifying cron job requests */
		// CRON_SECRET: z.string().min(1),
		/** Google OAuth Client ID for authentication */
		GOOGLE_CLIENT_ID: z.string().min(1),
		/** Google OAuth Client Secret for authentication */
		GOOGLE_CLIENT_SECRET: z.string().min(1),
		/** Base URL of the application for webhook callbacks */
		APP_URL: z.url(),
		/** Vercel webhook secret for verifying deployment webhook signatures */
		// VERCEL_WEBHOOK_SECRET: z.string().min(1),
		SMTP_HOST: z.string().min(1),
		SMTP_PORT: z.coerce.number().int().min(1),
		SMTP_SECURE: z.enum(["true", "false"]).default("false"),
		SMTP_USER: z.string().min(1),
		SMTP_PASS: z.string().min(1),
		EMAIL_FROM: z.string().min(1),
	},
	experimental__runtimeEnv: {},
})
