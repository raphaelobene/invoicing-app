import { Document, Page, Text, View } from "@react-pdf/renderer"
import { Formatter } from "@/lib/utils/formatter"
import { pdfStyles, OrgHeaderBlock, ClientBlock, money } from "./shared"
import type { ReceiptDetail } from "@/features/receipts/dal"
import type { OrgBillingProfile } from "@/features/organizations/dal"

export function ReceiptDocument({ receipt, org }: { receipt: ReceiptDetail; org: OrgBillingProfile }) {
	const { invoice } = receipt

	return (
		<Document title={`Receipt ${receipt.number}`}>
			<Page size="A4" style={pdfStyles.page}>
				<View style={pdfStyles.headerRow}>
					<OrgHeaderBlock org={org} />
					<View style={pdfStyles.docTitleBlock}>
						<Text style={pdfStyles.docTitle}>Receipt</Text>
						<Text style={pdfStyles.docNumber}>{receipt.number}</Text>
						<View style={pdfStyles.metaRow}>
							<Text style={pdfStyles.metaLabel}>Issued </Text>
							<Text>{Formatter.date(receipt.issueDate, { dateStyle: "medium" })}</Text>
						</View>
						<View style={pdfStyles.metaRow}>
							<Text style={pdfStyles.metaLabel}>For invoice </Text>
							<Text>{invoice.number}</Text>
						</View>
					</View>
				</View>

				<ClientBlock client={invoice.client} />

				<View style={pdfStyles.stampBlock}>
					<Text style={pdfStyles.stampText}>Payment received in full</Text>
				</View>

				<View style={pdfStyles.totalsBlock}>
					<View style={pdfStyles.totalsRowFinal}>
						<Text style={pdfStyles.totalsLabelFinal}>Amount received</Text>
						<Text style={pdfStyles.totalsValueFinal}>{money(receipt.amount.toString(), invoice.currency)}</Text>
					</View>
				</View>

				{invoice.payments.length > 0 ? (
					<View style={pdfStyles.section}>
						<Text style={pdfStyles.sectionLabel}>Payment history</Text>
						<View style={pdfStyles.table}>
							<View style={pdfStyles.tableHeaderRow}>
								<Text style={[pdfStyles.th, { flex: 2 }]}>Date</Text>
								<Text style={[pdfStyles.th, { flex: 2 }]}>Method</Text>
								<Text style={[pdfStyles.th, { flex: 1, textAlign: "right" }]}>Amount</Text>
							</View>
							{invoice.payments.map((payment) => (
								<View key={payment.id} style={pdfStyles.tableRow}>
									<Text style={{ flex: 2 }}>{Formatter.date(payment.paidAt, { dateStyle: "medium" })}</Text>
									<Text style={{ flex: 2 }}>{payment.method || "—"}</Text>
									<Text style={{ flex: 1, textAlign: "right" }}>
										{money(payment.amount.toString(), invoice.currency)}
									</Text>
								</View>
							))}
						</View>
					</View>
				) : null}

				{receipt.notes ? <Text style={pdfStyles.notes}>{receipt.notes}</Text> : null}

				<Text style={pdfStyles.footer}>
					{org.name}
					{org.taxId ? ` · Tax ID ${org.taxId}` : ""} · Receipt for invoice {invoice.number}
				</Text>
			</Page>
		</Document>
	)
}
