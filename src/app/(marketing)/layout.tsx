import React from "react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { site } from "@/lib/constants"
import { cn } from "@/lib/utils/dx"

export default function MarketingLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<>
			<header className="flex w-full items-center justify-between gap-4 bg-accent px-6 py-4">
				<h1>{site.name}</h1>
				<nav className="flex gap-4">
					<Link
						href="/"
						className={cn(
							buttonVariants({ variant: "link", size: "sm" }),
							"px-0"
						)}
					>
						Home
					</Link>
					<Link href="/signin" className={cn(buttonVariants({ size: "sm" }))}>
						Sign in
					</Link>
				</nav>
			</header>
			<main className="flex min-h-svh w-full p-6">{children}</main>
		</>
	)
}
