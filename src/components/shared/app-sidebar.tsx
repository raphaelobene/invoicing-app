"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { Icon, Icons } from "@/components/shared/icons"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
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
	userEmail,
}: {
	organizationName: string
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
		<aside className="fixed left-0 flex h-screen w-62 shrink-0 flex-col border-r bg-card">
			<div className="flex h-14 items-center border-b px-4">
				<span className="truncate font-semibold">{organizationName}</span>
			</div>

			<nav className="flex-1 space-y-1.5 p-3">
				{NAV_ITEMS.map(({ href, label, icon }) => {
					const isActive = pathname === href || pathname.startsWith(`${href}/`)
					return (
						<Link
							key={href}
							href={href}
							className={cn(
								"flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors duration-300 hover:bg-accent hover:text-accent-foreground",
								{
									"bg-accent text-accent-foreground": isActive,
								}
							)}
						>
							<Icon
								icon={icon}
								strokeWidth={2}
								aria-hidden="true"
								className="text-accent-foreground"
							/>
							{label}
						</Link>
					)
				})}
			</nav>

			<div className="p-3">
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Avatar className="size-7">
							<AvatarFallback>{initials(userEmail)}</AvatarFallback>
						</Avatar>
						<span className="truncate">{userEmail}</span>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-56">
						<DropdownMenuItem>My profile</DropdownMenuItem>
						<DropdownMenuItem>Appearance</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link href="/" target="_blank">
								Homepage
								<DropdownMenuShortcut>
									<Icon
										icon={Icons.arrowUpRight}
										strokeWidth={2}
										aria-hidden="true"
										className="size-3"
									/>
								</DropdownMenuShortcut>
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link href="/settings/organization">Organization settings</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={handleSignOut}>
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</aside>
	)
}
