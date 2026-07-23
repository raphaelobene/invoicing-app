"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { PaginationState } from "@tanstack/react-table"

import { DataTable } from "@/components/shared/data-table"
import { Icon, Icons } from "@/components/shared/icons"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group"
import { ClientFormSheet } from "@/features/clients/components/client-form-sheet"
import { getClientColumns } from "@/features/clients/components/columns"
import { useClientsQuery } from "@/features/clients/queries"
import { useDebounce } from "@/hooks/usehooks"
import { usePage } from "@/lib/platform/client/hooks/use-page"

const SEARCH_DEBOUNCE_MS = 500
export default function Clients() {
	const router = useRouter()
	const { searchParams, replaceSearchParams } = usePage("clients")
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

	const [sheetOpen, setSheetOpen] = useState(false)

	const { data, isLoading } = useClientsQuery({ search: searchInput })

	const columns = getClientColumns({ term: searchInput })

	const handlePaginationChange = (next: PaginationState) => {
		replaceSearchParams({ page: next.pageIndex + 1 })
	}

	return (
		<div>
			<PageHeader
				title="Clients"
				description="Everyone you bill and quote."
				actions={
					<Button size="sm" onClick={() => setSheetOpen(true)}>
						<Icon icon={Icons.plus} strokeWidth={2} aria-hidden="true" />
						New client
					</Button>
				}
			/>

			<div className="space-y-4">
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

				<DataTable
					columns={columns}
					data={data?.items ?? []}
					isLoading={isLoading}
					onRowClick={(client) => router.push(`/clients/${client.id}`)}
					onPaginationChange={handlePaginationChange}
					emptyState={
						searchInput
							? "No clients match that search."
							: "No clients yet — add your first one."
					}
				/>
			</div>

			<ClientFormSheet open={sheetOpen} onOpenChange={setSheetOpen} />
		</div>
	)
}
