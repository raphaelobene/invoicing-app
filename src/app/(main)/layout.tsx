import React from "react"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/shared/app-sidebar"
import { CommandPalette } from "@/components/shared/command-palette"
import { Logger } from "@/lib/platform/server/logger"
import { requireOrgContext } from "@/lib/session"

export default async function MainLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) {
		Logger.debug(ctxResult.error.kind)
		if (ctxResult.error.kind === "UNAUTHENTICATED") {
			redirect("/signin")
		}

		redirect("/settings/organization")
	}
	const ctx = ctxResult.value

	return (
		<div className="flex min-h-screen pl-62">
			<AppSidebar
				organizationName={ctx.organizationName}
				userEmail={ctx.userEmail}
			/>
			<main className="flex-1 overflow-y-auto p-8">{children}</main>
			<CommandPalette />
		</div>
	)
}
