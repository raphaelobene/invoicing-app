import React from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { site } from "@/lib/constants"

export default async function AuthLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const session = await auth.api.getSession({ headers: await headers() })

	if (session) {
		redirect("/dashboard")
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
			<div className="w-full max-w-lg space-y-10">
				<div className="text-center text-3xl font-medium">{site.name}</div>
				{children}
			</div>
		</div>
	)
}
