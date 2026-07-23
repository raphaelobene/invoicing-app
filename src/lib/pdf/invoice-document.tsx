import { Document, Page, Text, View } from "@react-pdf/renderer"
import { Formatter } from "@/lib/utils/formatter"
import { pdfStyles, OrgHeaderBlock, ClientBlock, ItemsTable, TotalsBlock } from "./shared"
import type { InvoiceDetail } from "@/features/invoices/dal"
import type { OrgBillingProfile } from "@/features/organizations/dal"

export function InvoiceDocument({ invoice, org }: { invoice: InvoiceDetail; org: OrgBillingProfile }) {
	const balanceDue = Number(invoice.total) - Number(invoice.amountPaid)

	return (
		<Document title={`Invoice ${invoice.number}`}>
			<Page size="A4" style={pdfStyles.page}>
				<View style={pdfStyles.headerRow}>
					<OrgHeaderBlock org={org} />
					<View style={pdfStyles.docTitleBlock}>
						<Text style={pdfStyles.docTitle}>Invoice</Text>
						<Text style={pdfStyles.docNumber}>{invoice.number}</Text>
						<View style={pdfStyles.metaRow}>
							<Text style={pdfStyles.metaLabel}>Issued </Text>
							<Text>{Formatter.date(invoice.issueDate, { dateStyle: "medium" })}</Text>
						</View>
						<View style={pdfStyles.metaRow}>
							<Text style={pdfStyles.metaLabel}>Due </Text>
							<Text>{Formatter.date(invoice.dueDate, { dateStyle: "medium" })}</Text>
						</View>
					</View>
				</View>

				<ClientBlock client={invoice.client} />

				<ItemsTable items={invoice.items} currency={invoice.currency} />

				<TotalsBlock
					subtotal={invoice.subtotal.toString()}
					taxTotal={invoice.taxTotal.toString()}
					discountTotal={invoice.discountTotal.toString()}
					total={invoice.total.toString()}
					amountPaid={invoice.amountPaid.toString()}
					currency={invoice.currency}
				/>

				{invoice.status === "PAID" ? (
					<View style={pdfStyles.stampBlock}>
						<Text style={pdfStyles.stampText}>Paid in full</Text>
					</View>
				) : balanceDue > 0 ? null : null}

				{invoice.notes ? <Text style={pdfStyles.notes}>{invoice.notes}</Text> : null}

				<Text style={pdfStyles.footer}>
					{org.name}
					{org.taxId ? ` · Tax ID ${org.taxId}` : ""}
				</Text>
			</Page>
		</Document>
	)
}
