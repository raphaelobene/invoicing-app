"use client"

import type { ColumnDef } from "@tanstack/react-table"

import DataTableColumnHeader from "@/components/shared/data-table-column-header"
import { QuoteStatusBadge } from "@/components/shared/status-badge"
import type { QuoteListItem } from "@/features/quotes/dal"
import { formatMoney } from "@/lib/currency"
import format from "@/lib/utils/formatter"

export const quoteColumns: ColumnDef<QuoteListItem>[] = [
	{
		accessorKey: "number",
		header: ({ column }) => (
			<DataTableColumnHeader title="Number" column={column} />
		),
		cell: ({ row }) => (
			<span className="font-mono text-sm tabular-nums">
				{row.original.number}
			</span>
		),
	},
	{
		accessorKey: "client.name",
		header: ({ column }) => (
			<DataTableColumnHeader title="Client" column={column} />
		),
		cell: ({ row }) => row.original.client.name,
	},
	{
		accessorKey: "expiryDate",
		header: ({ column }) => (
			<DataTableColumnHeader title="Expires" column={column} />
		),
		cell: ({ row }) =>
			format(row.original.expiryDate).date({ dateStyle: "medium" }),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => <QuoteStatusBadge status={row.original.status} />,
	},
	{
		accessorKey: "total",
		header: "Total",
		cell: ({ row }) => (
			<span className="font-mono tabular-nums">
				{formatMoney(row.original.total, row.original.currency)}
			</span>
		),
	},
]
