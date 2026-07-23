"use client"

import ErrorCard from "@/components/shared/error-card"
import { PageHeader } from "@/components/shared/page-header"
import SyncSpinner from "@/components/shared/sync-spinner"
import { InvoiceForm } from "@/features/invoices/components/invoice-form"
import { useInvoiceQuery } from "@/features/invoices/queries"
import { usePage } from "@/lib/platform/client/hooks/use-page"

export default function EditInvoice() {
	const { pathParams } = usePage("invoice-edit")
	const { invoiceId } = pathParams
	const { data: invoice, isLoading } = useInvoiceQuery(invoiceId)

	if (isLoading) {
		return (
			<div className="grid h-screen w-full place-items-center">
				<SyncSpinner className="size-6 text-primary" />
			</div>
		)
	}

	if (!invoice) {
		return (
			<div className="grid size-full place-items-center">
				<ErrorCard title="404" description="Invoice not found." />
			</div>
		)
	}

	if (invoice.status !== "DRAFT") {
		return (
			<div className="grid size-full place-items-center">
				<ErrorCard
					title="Restricted"
					description="Only draft invoices can be edited — this one has already been sent."
				/>
			</div>
		)
	}

	return (
		<div>
			<PageHeader title={`Edit ${invoice.number}`} />
			<InvoiceForm invoice={invoice} currency={invoice.currency} />
		</div>
	)
}
