import { redirect } from "next/navigation"

import { PageHeader } from "@/components/shared/page-header"
import { QuoteForm } from "@/features/quotes/components/quote-form"
import { Page } from "@/lib/platform/server/safe-page"
import { requireOrgContext } from "@/lib/session"

export default Page.create({
	path: "/quotes/new",
	name: "quote-new",
}).page(async () => {
	const ctxResult = await requireOrgContext()
	if (ctxResult.isErr()) redirect("/signin")

	return (
		<div>
			<PageHeader title="New quote" />
			<QuoteForm currency={ctxResult.value.organizationDefaultCurrency} />
		</div>
	)
})
