import * as React from "react"
import { useHotkeys } from "@tanstack/react-hotkeys"
import { Column } from "@tanstack/react-table"

import { cn } from "@/lib/utils/dx"

import { Icon, Icons } from "./icons"

interface DataTableColumnHeaderProps<
	TData,
	TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
	column: Column<TData, TValue>
	title: string
}

const SORT_ICONS = {
	asc: Icons.arrowUp,
	desc: Icons.ArrowDown,
	none: Icons.chevronsUpDown,
} as const

export default function DataTableColumnHeader<TData, TValue>({
	column,
	title,
	className,
}: DataTableColumnHeaderProps<TData, TValue>) {
	const headerRef = React.useRef<HTMLDivElement>(null)
	const canSort = column.getCanSort()
	const toggleSort = column.getToggleSortingHandler()

	useHotkeys(
		[
			{ hotkey: "Enter", callback: (e) => toggleSort?.(e) },
			{ hotkey: "Space", callback: (e) => toggleSort?.(e) },
		],
		{ target: headerRef, enabled: canSort }
	)

	if (!canSort) {
		return <div className={className}>{title}</div>
	}

	const sortDirection = column.getIsSorted() || "none"
	const sortIcon = SORT_ICONS[sortDirection]

	return (
		<div
			ref={headerRef}
			role="button"
			tabIndex={0}
			className={cn(
				"flex cursor-pointer items-center gap-4 select-none focus:outline-0",
				className
			)}
			onClick={toggleSort}
		>
			{title}
			<Icon
				icon={sortIcon}
				strokeWidth={2}
				aria-hidden="true"
				className="size-3"
			/>
		</div>
	)
}
