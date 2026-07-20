"use client"

import * as React from "react"
import { useHotkey } from "@tanstack/react-hotkeys"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

import { HOTKEYS } from "@/lib/constants"
import { isTypingTarget } from "@/lib/utils/dx"

import { Toaster } from "../ui/sonner"
import { QueryProvider } from "./query-client"

function ThemeProvider({
	children,
	...props
}: React.ComponentProps<typeof NextThemesProvider>) {
	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
			{...props}
		>
			<QueryProvider>
				<ThemeHotkey />
				{children}
				<Toaster position="top-right" visibleToasts={1} richColors />
			</QueryProvider>
		</NextThemesProvider>
	)
}

function ThemeHotkey() {
	const { resolvedTheme, setTheme } = useTheme()

	useHotkey(HOTKEYS.DARK_MODE, (e) => {
		if (e.metaKey || e.ctrlKey || e.altKey) return
		if (isTypingTarget(e.target)) return

		setTheme(resolvedTheme === "dark" ? "light" : "dark")
	})

	return null
}

export { ThemeProvider }
