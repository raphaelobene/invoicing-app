"use client"

import * as React from "react"
import { useHotkey } from "@tanstack/react-hotkeys"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

import { HOTKEYS } from "@/lib/constants"
import { isTypingTarget } from "@/lib/utils"

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
			<ThemeHotkey />
			{children}
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
