import { ReactNode } from "react"
import { formatForDisplay } from "@tanstack/react-hotkeys"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function isTypingTarget(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) {
		return false
	}

	return (
		target.isContentEditable ||
		target.tagName === "INPUT" ||
		target.tagName === "TEXTAREA" ||
		target.tagName === "SELECT"
	)
}

type ShortcutBadgeOptions = {
	wrapper?: (formattedHotkey: string) => ReactNode
}

export function ShortcutBadge(hotkey: string, options?: ShortcutBadgeOptions) {
	const formatted = formatForDisplay(hotkey)
	const { wrapper } = options ?? {}

	return wrapper ? [wrapper(formatted)] : formatted
}
