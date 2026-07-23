import { Document, Page, Text, View } from "@react-pdf/renderer"
import { Formatter } from "@/lib/utils/formatter"
import { pdfStyles, OrgHeaderBlock, ClientBlock, ItemsTable, TotalsBlock } from "./shared"
import type { QuoteDetail } from "@/features/quotes/dal"
import type { OrgBillingProfile } from "@/features/organizations/dal"

export function QuoteDocument({ quote, org }: { quote: QuoteDetail; org: OrgBillingProfile }) {
	return (
		<Document title={`Quote ${quote.number}`}>
			<Page size="A4" style={pdfStyles.page}>
				<View style={pdfStyles.headerRow}>
					<OrgHeaderBlock org={org} />
					<View style={pdfStyles.docTitleBlock}>
						<Text style={pdfStyles.docTitle}>Quote</Text>
						<Text style={pdfStyles.docNumber}>{quote.number}</Text>
						<View style={pdfStyles.metaRow}>
							<Text style={pdfStyles.metaLabel}>Issued </Text>
							<Text>{Formatter.date(quote.issueDate, { dateStyle: "medium" })}</Text>
						</View>
						<View style={pdfStyles.metaRow}>
							<Text style={pdfStyles.metaLabel}>Valid until </Text>
							<Text>{Formatter.date(quote.expiryDate, { dateStyle: "medium" })}</Text>
						</View>
					</View>
				</View>

				<ClientBlock client={quote.client} />

				<ItemsTable items={quote.items} currency={quote.currency} />

				<TotalsBlock
					subtotal={quote.subtotal.toString()}
					taxTotal={quote.taxTotal.toString()}
					discountTotal={quote.discountTotal.toString()}
					total={quote.total.toString()}
					currency={quote.currency}
				/>

				{quote.notes ? <Text style={pdfStyles.notes}>{quote.notes}</Text> : null}

				<Text style={pdfStyles.footer}>
					{org.name}
					{org.taxId ? ` · Tax ID ${org.taxId}` : ""}
				</Text>
			</Page>
		</Document>
	)
}
