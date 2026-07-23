import { ComponentProps, ElementType } from "react"

import { Icons } from "@/components/shared/icons"

export const SUPPORTED_OAUTH_PROVIDERS = ["google"] as const
export type SupportedOAuthProvider = (typeof SUPPORTED_OAUTH_PROVIDERS)[number]

export const SUPPORTED_OAUTH_PROVIDER_DETAILS: Record<
	SupportedOAuthProvider,
	{ Icon: ComponentProps<ElementType>["children"]; name: string }
> = {
	google: { Icon: Icons.google, name: "Google" },
}
