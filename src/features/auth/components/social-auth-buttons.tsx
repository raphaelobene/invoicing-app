"use client"

import { Fragment } from "react"

import { BetterAuthActionButton } from "@/components/shared/better-auth-action-button"
import { Icon } from "@/components/shared/icons"
import { authClient } from "@/lib/auth-client"
import {
	SUPPORTED_OAUTH_PROVIDER_DETAILS,
	SUPPORTED_OAUTH_PROVIDERS,
} from "@/lib/o-auth-providers"

export function SocialAuthButtons() {
	return (
		<>
			{SUPPORTED_OAUTH_PROVIDERS.map((provider) => {
				const icon = SUPPORTED_OAUTH_PROVIDER_DETAILS[provider].Icon

				return (
					<Fragment key={provider}>
						<BetterAuthActionButton
							action={() => {
								return authClient.signIn.social({
									callbackURL: "/",
									provider,
								})
							}}
							size="lg"
							variant="outline"
						>
							<Icon icon={icon} strokeWidth={2} aria-hidden="true" />

							{SUPPORTED_OAUTH_PROVIDER_DETAILS[provider].name}
						</BetterAuthActionButton>
					</Fragment>
				)
			})}
		</>
	)
}
