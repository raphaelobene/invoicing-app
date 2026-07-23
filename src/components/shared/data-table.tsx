"use client"

import * as React from "react"
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	OnChangeFn,
	PaginationState,
	SortingState,
	useReactTable,
	VisibilityState,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"

const DEFAULT_COLUMN_WIDTH = 150

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[]
	// Expected to already reflect any filtering/search — this component
	// only sorts and paginates what it's given. Filtering lives with the
	// caller (e.g. via usePage + searchParams).
	data: TData[]
	isLoading?: boolean
	onRowClick?: (row: TData) => void
	emptyState?: React.ReactNode
	// Fires on every pagination change, regardless of whether `pagination`
	// is controlled. Use this alone (without `pagination`) to persist page
	// changes somewhere — e.g. write to the URL for a shareable link —
	// without reading that value back in on mount/refresh.
	onPaginationChange?: (pagination: PaginationState) => void
}

export function DataTable<TData, TValue>({
	columns,
	data,
	isLoading,
	onRowClick,
	emptyState = "Nothing here yet.",
	onPaginationChange,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>([])
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({})

	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	})

	const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
		const next = typeof updater === "function" ? updater(pagination) : updater
		setPagination(next)
		onPaginationChange?.(next)
	}

	const table = useReactTable({
		columns,
		data,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onSortingChange: setSorting,
		onPaginationChange: handlePaginationChange,
		state: {
			columnVisibility,
			sorting,
			pagination,
		},
	})

	const rows = table.getRowModel().rows

	const handleRowKeyDown = (
		event: React.KeyboardEvent<HTMLTableRowElement>,
		original: TData
	) => {
		if (!onRowClick) return
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault()
			onRowClick(original)
		}
	}

	return (
		<div className="space-y-4">
			<div className="rounded-lg border bg-card">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="hover:bg-transparent">
								{headerGroup.headers.map((header) => {
									const style: React.CSSProperties =
										header.getSize() !== DEFAULT_COLUMN_WIDTH
											? { width: `${header.getSize()}px` }
											: {}
									return (
										<TableHead key={header.id} style={style}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: pagination.pageSize }).map((_, i) => (
								<TableRow key={i} className="hover:bg-transparent">
									{columns.map((_, j) => (
										<TableCell key={j}>
											<Skeleton className="h-4 w-full max-w-32" />
										</TableCell>
									))}
								</TableRow>
							))
						) : rows.length === 0 ? (
							<TableRow className="hover:bg-transparent">
								<TableCell
									colSpan={columns.length}
									className="h-32 text-center text-muted-foreground"
								>
									{emptyState}
								</TableCell>
							</TableRow>
						) : (
							rows.map((row) => (
								<TableRow
									key={row.id}
									onClick={
										onRowClick ? () => onRowClick(row.original) : undefined
									}
									onKeyDown={
										onRowClick
											? (event) => handleRowKeyDown(event, row.original)
											: undefined
									}
									role={onRowClick ? "button" : undefined}
									tabIndex={onRowClick ? 0 : undefined}
									className={
										onRowClick
											? "cursor-pointer focus-visible:outline focus-visible:outline-ring"
											: "hover:bg-transparent"
									}
								>
									{row.getVisibleCells().map((cell) => {
										const style: React.CSSProperties =
											cell.column.getSize() !== DEFAULT_COLUMN_WIDTH
												? { width: `${cell.column.getSize()}px` }
												: {}
										return (
											<TableCell key={cell.id} style={style}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</TableCell>
										)
									})}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{data.length > 0 && data.length > pagination.pageSize && (
				<div className="flex items-center justify-end space-x-2 px-3 py-1">
					<span className="flex-1 text-xs text-muted-foreground">
						Page {table.getState().pagination.pageIndex + 1} -{" "}
						{table.getPageCount()} of {data.length}{" "}
						{data.length === 1 ? "result" : "results"}
					</span>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<span className="text-xs text-muted-foreground">
								Rows per page
							</span>
							<Select
								value={String(table.getState().pagination.pageSize)}
								onValueChange={(value) => table.setPageSize(Number(value))}
							>
								<SelectTrigger size="sm">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[10, 20, 30, 40, 50].map((pageSize) => (
										<SelectItem key={pageSize} value={String(pageSize)}>
											{pageSize}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-x-2">
							<Button
								disabled={!table.getCanPreviousPage()}
								onClick={() => table.previousPage()}
								size="sm"
								variant="outline"
							>
								Previous
							</Button>
							<Button
								disabled={!table.getCanNextPage()}
								onClick={() => table.nextPage()}
								size="sm"
								variant="outline"
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
