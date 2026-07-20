import React from "react"

import { cn } from "@/lib/utils/dx"

import SyncSpinner from "./sync-spinner"

export function LoadingSwap({
	children,
	className,
	isLoading,
	title,
}: React.ComponentProps<"div"> & { isLoading: boolean }) {
	return (
		<>
			<div
				className={cn(
					"absolute inset-x-0 hidden h-full translate-y-3 items-center justify-center gap-1.5 opacity-0 transition-all duration-200 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
					className,
					{
						"flex translate-y-0 opacity-100": isLoading,
					}
				)}
			>
				<SyncSpinner />
				{title && <span>{title}</span>}
			</div>
			<span
				className={cn(
					"flex items-center gap-1.5 opacity-100 transition-opacity duration-200",
					{
						"opacity-0": isLoading,
					}
				)}
			>
				{children}
			</span>
		</>
	)
}
