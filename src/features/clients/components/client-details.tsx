"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { DataTable } from "@/components/shared/data-table"
import ErrorCard from "@/components/shared/error-card"
import { Icon, Icons } from "@/components/shared/icons"
import { MutationButton } from "@/components/shared/mutation-button"
import { PageHeader } from "@/components/shared/page-header"
import SyncSpinner from "@/components/shared/sync-spinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ClientFormSheet } from "@/features/clients/components/client-form-sheet"
import {
	useClientQuery,
	useDeleteClientMutation,
} from "@/features/clients/queries"
import { invoiceColumns } from "@/features/invoices/components/columns"
import { useInvoicesQuery } from "@/features/invoices/queries"
import { quoteColumns } from "@/features/quotes/components/columns"
import { useQuotesQuery } from "@/features/quotes/queries"
import { usePage } from "@/lib/platform/client/hooks/use-page"

export default function ClientDetails() {
	const router = useRouter()
	const [editOpen, setEditOpen] = useState(false)
	const { pathParams } = usePage("client-details")
	const { clientId } = pathParams

	const { data: client, isLoading } = useClientQuery(clientId)
	const { data: invoices } = useInvoicesQuery({ clientId })
	const { data: quotes } = useQuotesQuery({ clientId })
	const mutation = useDeleteClientMutation()

	if (isLoading) {
		return (
			<div className="grid h-screen w-full place-items-center">
				<SyncSpinner className="size-6 text-primary" />
			</div>
		)
	}

	if (!client)
		return (
			<div className="grid size-full place-items-center">
				<ErrorCard title="404" description="Client not found." />
			</div>
		)

	return (
		<div>
			<PageHeader
				title={client.name}
				description={client.email ?? undefined}
				actions={
					<>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setEditOpen(true)}
						>
							<Icon icon={Icons.pencil} strokeWidth={2} aria-hidden="true" />
							Edit
						</Button>
						<MutationButton
							mutation={mutation}
							mutationArgs={clientId}
							requireAreYouSure
							actionButtonText="Delete"
							variant="destructive"
							size="sm"
							disabled={mutation.isPending}
							title={`Delete ${client.name}`}
						>
							<Icon icon={Icons.trash} strokeWidth={2} aria-hidden="true" />
							Delete
						</MutationButton>
					</>
				}
			/>

			<Card className="mb-8">
				<CardContent className="grid grid-cols-2 gap-4 pt-6 text-sm sm:grid-cols-4">
					<div>
						<p className="text-muted-foreground">Phone</p>
						<p>{client.phone || "—"}</p>
					</div>
					<div>
						<p className="text-muted-foreground">Tax ID</p>
						<p>{client.taxId || "—"}</p>
					</div>
					<div className="col-span-2">
						<p className="text-muted-foreground">Billing address</p>
						<p className="whitespace-pre-line">
							{client.billingAddress || "—"}
						</p>
					</div>
				</CardContent>
			</Card>

			<h2 className="mb-3 text-sm font-semibold text-muted-foreground">
				Invoices
			</h2>
			<DataTable
				columns={invoiceColumns}
				data={invoices?.items ?? []}
				onRowClick={(invoice) => router.push(`/invoices/${invoice.id}`)}
				emptyState="No invoices for this client yet."
			/>

			<h2 className="mt-8 mb-3 text-sm font-semibold text-muted-foreground">
				Quotes
			</h2>
			<DataTable
				columns={quoteColumns}
				data={quotes?.items ?? []}
				onRowClick={(quote) => router.push(`/quotes/${quote.id}`)}
				emptyState="No quotes for this client yet."
			/>

			<ClientFormSheet
				open={editOpen}
				onOpenChange={setEditOpen}
				client={client}
			/>
		</div>
	)
}
