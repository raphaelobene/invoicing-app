"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { Icon, Icons } from "@/components/shared/icons"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils/dx"

const NAV_ITEMS = [
	{ href: "/dashboard", label: "Dashboard", icon: Icons.layout },
	{ href: "/clients", label: "Clients", icon: Icons.users },
	{ href: "/invoices", label: "Invoices", icon: Icons.receipt },
	{ href: "/quotes", label: "Quotes", icon: Icons.fileText },
] as const

function initials(name: string) {
	return name
		.split(" ")
		.map((part) => part[0])
		.slice(0, 2)
		.join("")
		.toUpperCase()
}

export function AppSidebar({
	organizationName,
	userName,
	userEmail,
}: {
	organizationName: string
	userName: string
	userEmail: string
}) {
	const pathname = usePathname()
	const router = useRouter()

	const handleSignOut = async () => {
		await authClient.signOut()
		router.push("/signin")
		router.refresh()
	}

	return (
		<aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-card">
			<div className="flex h-14 items-center border-b px-4">
				<span className="truncate font-semibold">{organizationName}</span>
			</div>

			<nav className="flex-1 space-y-1 p-3">
				{NAV_ITEMS.map(({ href, label, icon }) => {
					const isActive = pathname === href || pathname.startsWith(`${href}/`)
					return (
						<Link
							key={href}
							href={href}
							className={cn(
								"flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
								isActive
									? "bg-accent text-accent-foreground"
									: "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
							)}
						>
							<Icon icon={icon} strokeWidth={2} aria-hidden="true" />
							{label}
						</Link>
					)
				})}
			</nav>

			<div className="border-t p-3">
				<DropdownMenu>
					<DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accent">
						<Avatar className="h-7 w-7">
							<AvatarFallback>{initials(userName)}</AvatarFallback>
						</Avatar>
						<span className="truncate">{userName}</span>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-56">
						<DropdownMenuLabel className="truncate font-normal text-muted-foreground">
							{userEmail}
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link href="/settings/organization">
								<Icon
									icon={Icons.settings}
									strokeWidth={2}
									aria-hidden="true"
								/>
								Organization settings
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={handleSignOut}>
							<Icon icon={Icons.logout} strokeWidth={2} aria-hidden="true" />
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</aside>
	)
}
