import EditInvoice from "@/features/invoices/components/edit-invoice"
import { Page } from "@/lib/platform/server/safe-page"

const InvoiceEditPage = Page.create({
	path: "/invoices/[invoiceId]/edit",
	name: "invoice-edit",
}).page(() => <EditInvoice />)

declare global {
	interface PageRegistry {
		"invoice-edit": typeof InvoiceEditPage
	}
}

export default InvoiceEditPage
