"use client"

import type { ColumnDef } from "@tanstack/react-table"

import DataTableColumnHeader from "@/components/shared/data-table-column-header"
import { InvoiceStatusBadge } from "@/components/shared/status-badge"
import type { InvoiceListItem } from "@/features/invoices/dal"
import { formatMoney } from "@/lib/currency"
import format from "@/lib/utils/formatter"

export const invoiceColumns: ColumnDef<InvoiceListItem>[] = [
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
		accessorKey: "dueDate",
		header: ({ column }) => (
			<DataTableColumnHeader title="Due" column={column} />
		),
		cell: ({ row }) =>
			format(row.original.dueDate).date({ dateStyle: "medium" }),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />,
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
