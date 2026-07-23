"use client"

import type { ColumnDef } from "@tanstack/react-table"

import DataTableColumnHeader from "@/components/shared/data-table-column-header"
import HighlightText from "@/components/shared/highlight-text"
import type { Client } from "@/generated/prisma/client"

export const getClientColumns = ({
	term,
}: {
	term: string
}): ColumnDef<Client>[] => [
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader title="Name" column={column} />
		),
		cell: ({ row }) => (
			<HighlightText text={row.original.name || "No name"} search={term} />
		),
	},
	{
		accessorKey: "email",
		header: "Email",
		cell: ({ row }) =>
			row.original.email || <span className="text-muted-foreground">—</span>,
	},
	{
		accessorKey: "phone",
		header: "Phone",
		cell: ({ row }) =>
			row.original.phone || <span className="text-muted-foreground">—</span>,
	},
]
