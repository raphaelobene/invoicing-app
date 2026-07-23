import ErrorCard from "@/components/shared/error-card"
import Invoices from "@/features/invoices/components/invoices"
import { invoiceSearchParams } from "@/features/invoices/schema"
import { Page } from "@/lib/platform/server/safe-page"

const InvoicesPage = Page.create({
	path: "/invoices",
	name: "invoices",
})
	.searchParamsSchema(invoiceSearchParams, ({ errors }) => (
		<ErrorCard
			title="Invalid Search Params"
			description={
				<>
					<p>Please check your url and try again.</p>
					<pre>{JSON.stringify(errors, null, 2)}</pre>
				</>
			}
		/>
	))
	.page(() => <Invoices />)

declare global {
	interface PageRegistry {
		invoices: typeof InvoicesPage
	}
}

export default InvoicesPage
