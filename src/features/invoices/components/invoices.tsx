"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { DataTable } from "@/components/shared/data-table"
import { Icon, Icons } from "@/components/shared/icons"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group"
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { invoiceColumns } from "@/features/invoices/components/columns"
import { useInvoicesQuery } from "@/features/invoices/queries"
import { useDebounce } from "@/hooks/usehooks"
import { usePage } from "@/lib/platform/client/hooks/use-page"

import { StatusType } from "../schema"

const STATUS_OPTIONS = [
	{ value: "ALL", label: "All statuses" },
	{ value: "DRAFT", label: "Draft" },
	{ value: "SENT", label: "Sent" },
	{ value: "PARTIALLY_PAID", label: "Partially paid" },
	{ value: "PAID", label: "Paid" },
	{ value: "OVERDUE", label: "Overdue" },
	{ value: "VOID", label: "Void" },
] as const

const SEARCH_DEBOUNCE_MS = 500

export default function Invoices() {
	const router = useRouter()
	const { searchParams, replaceSearchParams } = usePage("invoices")
	const [searchInput, setSearchInput] = useState(searchParams.query)
	const [syncedSearch, setSyncedSearch] = useState(searchParams.query)
	const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS)

	useEffect(() => {
		if (debouncedSearch !== searchParams.query) {
			replaceSearchParams({ query: debouncedSearch })
		}
	}, [debouncedSearch])

	if (searchParams.query !== syncedSearch) {
		setSyncedSearch(searchParams.query)
		setSearchInput(searchParams.query)
	}

	const { data, isLoading } = useInvoicesQuery({
		search: searchInput,
		...(searchParams.status === "ALL" ? {} : { status: searchParams.status }),
	})

	return (
		<div>
			<PageHeader
				title="Invoices"
				description="Everything you've billed."
				actions={
					<Button size="sm" onClick={() => router.push("/invoices/new")}>
						<Icon icon={Icons.plus} strokeWidth={2} aria-hidden="true" />
						New invoice
					</Button>
				}
			/>

			<div className="mb-4 flex gap-3">
				<InputGroup>
					<InputGroupInput
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						placeholder="Search clients..."
					/>
					<InputGroupAddon>
						<Icon icon={Icons.search} strokeWidth={2} aria-hidden="true" />
					</InputGroupAddon>
				</InputGroup>
				<Select
					value={searchParams.status}
					onValueChange={(value) =>
						replaceSearchParams({
							status: (value === "ALL" ? "" : value) as StatusType,
						})
					}
				>
					<SelectTrigger className="w-48">
						<SelectValue />
					</SelectTrigger>
					<SelectContent position="popper">
						<SelectGroup>
							<SelectItem value="ALL">All statuses</SelectItem>
						</SelectGroup>
						<SelectSeparator />
						<SelectGroup>
							{STATUS_OPTIONS.filter((opt) => opt.value !== "ALL").map(
								(opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								)
							)}
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>

			<DataTable
				columns={invoiceColumns}
				data={data?.items ?? []}
				isLoading={isLoading}
				onRowClick={(invoice) => router.push(`/invoices/${invoice.id}`)}
				emptyState="No invoices yet — create your first one."
			/>
		</div>
	)
}
