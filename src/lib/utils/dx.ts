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

export function createShortcutBadge(
	hotkey: string,
	options?: ShortcutBadgeOptions
): ReactNode {
	const formatted = formatForDisplay(hotkey)
	const { wrapper } = options ?? {}

	return wrapper ? wrapper(formatted) : formatted
}

export function slugify(input: string): string {
	return (
		input
			.toLowerCase()
			.normalize("NFKD")
			.replace(/[\u0300-\u036f]/g, "")
			.trim()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 50)
			.replace(/-+$/g, "") || `org-${Date.now().toString(36)}`
	)
}

export function normalizer<T>(r: T | T[] | undefined): T[] {
	if (!r) return []
	return Array.isArray(r) ? r : [r]
}
