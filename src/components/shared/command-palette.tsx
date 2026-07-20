"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useHotkey } from "@tanstack/react-hotkeys"

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "@/components/ui/command"
import { HOTKEYS } from "@/lib/constants"
import { createShortcutBadge } from "@/lib/utils/dx"

import { Kbd } from "../ui/kbd"
import { Icon, Icons } from "./icons"

export function CommandPalette() {
	const [open, setOpen] = useState(false)
	const router = useRouter()

	useHotkey(HOTKEYS.OPEN_COMMAND_PALETTE, () => setOpen((v) => !v))
	useHotkey(HOTKEYS.NEW_INVOICE, () => router.push("/invoices/new" as any))
	useHotkey(HOTKEYS.NEW_QUOTE, () => router.push("/quotes/new" as any))

	const go = (path: string) => {
		router.push(path as any)
		setOpen(false)
	}

	const NAV_ITEMS = [
		{ href: "/dashboard", label: "Dashboard", icon: Icons.layout },
		{ href: "/clients", label: "Clients", icon: Icons.users },
		{ href: "/invoices/", label: "Invoices", icon: Icons.receipt },
		{ href: "/quotes", label: "Quotes", icon: Icons.fileText },
		{
			href: "/settings/organization",
			label: "Organization settings",
			icon: Icons.settings,
		},
	] as const

	const CREATE_ITEMS: Array<{
		href: string
		label: string
		icon: any
		hotkey?: string
	}> = [
		{
			href: "/invoices/new",
			label: "New invoice",
			icon: Icons.plus,
			hotkey: HOTKEYS.NEW_INVOICE,
		},
		{
			href: "/quotes/new",
			label: "New quote",
			icon: Icons.plus,
			hotkey: HOTKEYS.NEW_QUOTE,
		},
		{ href: "/clients?new=1", label: "New client", icon: Icons.plus },
	]

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<CommandInput placeholder="Jump to, or create something..." />
			<CommandList>
				<CommandEmpty>No results.</CommandEmpty>
				<CommandGroup heading="Navigate">
					{NAV_ITEMS.map((item) => (
						<CommandItem key={item.href} onSelect={() => go(item.href)}>
							<Icon icon={item.icon} strokeWidth={2} aria-hidden="true" />
							{item.label}
						</CommandItem>
					))}
				</CommandGroup>
				<CommandSeparator />
				<CommandGroup heading="Create">
					{CREATE_ITEMS.map((item) => (
						<CommandItem key={item.href} onSelect={() => go(item.href)}>
							<Icon icon={item.icon} strokeWidth={2} aria-hidden="true" />
							{item.label}
							{item.hotkey && (
								<CommandShortcut>
									{createShortcutBadge(item.hotkey, {
										wrapper: (hotkey) => <Kbd key={hotkey}>{hotkey}</Kbd>,
									})}
								</CommandShortcut>
							)}
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	)
}
