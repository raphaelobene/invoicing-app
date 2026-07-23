import { createEnv } from "@t3-oss/env-nextjs"
import { vercel } from "@t3-oss/env-nextjs/presets-zod"
import z from "zod"

/**
 * Client-side environment configuration
 * These variables are available on both client and server
 * Must be prefixed with NEXT_PUBLIC_
 */
export const env = createEnv({
	extends: [vercel()],

	client: {
		NEXT_PUBLIC_APP_URL: z.url(),
	},
	runtimeEnv: {
		NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"],
	},
})
