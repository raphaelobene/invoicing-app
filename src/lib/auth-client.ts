import {
	inferOrgAdditionalFields,
	organizationClient,
} from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

import type { auth } from "@/lib/auth"

import { env } from "./env/client"

export const authClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_APP_URL,
	plugins: [
		organizationClient({
			schema: inferOrgAdditionalFields<typeof auth>(),
		}),
	],
})

export const {
	useSession,
	useActiveOrganization,
	useListOrganizations,
	signIn,
	signUp,
	signOut,
	organization,
} = authClient
