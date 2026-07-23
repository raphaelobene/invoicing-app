import { redirect } from "next/navigation"

import { PageHeader } from "@/components/shared/page-header"
import { InvoiceForm } from "@/features/invoices/components/invoice-form"
import { Page } from "@/lib/platform/server/safe-page"
import { requireOrgContext } from "@/lib/session"

export default Page.create({
	path: "/invoices/new",
	name: "invoice-new",
}).page(async () => {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) redirect("/signin")

	return (
		<>
			<PageHeader title="New invoice" />
			<InvoiceForm currency={ctxResult.value.organizationDefaultCurrency} />
		</>
	)
})
