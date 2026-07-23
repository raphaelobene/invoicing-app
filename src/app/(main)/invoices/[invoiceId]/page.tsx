import InvoiceDetails from "@/features/invoices/components/invoice-details"
import { Page } from "@/lib/platform/server/safe-page"

const InvoiceDetailsPage = Page.create({
	path: "/invoices/[invoiceId]",
	name: "invoice-details",
}).page(() => <InvoiceDetails />)

declare global {
	interface PageRegistry {
		"invoice-details": typeof InvoiceDetailsPage
	}
}

export default InvoiceDetailsPage
