import { Decimal } from "@prisma/client/runtime/client"
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer"

import { formatMoney } from "../currency"

/**
 * One shared stylesheet for every document type (invoice, quote, receipt)
 * so they look like they come from the same business, and so a change to
 * the look (e.g. a different accent color) happens in one place.
 */
export const pdfStyles = StyleSheet.create({
	page: {
		paddingTop: 48,
		paddingBottom: 56,
		paddingHorizontal: 48,
		fontSize: 10,
		fontFamily: "Helvetica",
		color: "#1a1a1a",
	},
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 32,
	},
	orgBlock: {
		maxWidth: 260,
	},
	orgName: {
		fontSize: 14,
		fontFamily: "Helvetica-Bold",
		marginBottom: 4,
	},
	mutedLine: {
		fontSize: 9,
		color: "#555555",
		marginBottom: 2,
	},
	docTitleBlock: {
		alignItems: "flex-end",
	},
	docTitle: {
		fontSize: 20,
		fontFamily: "Helvetica-Bold",
		marginBottom: 4,
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	docNumber: {
		fontSize: 11,
		color: "#555555",
		marginBottom: 8,
	},
	metaRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		fontSize: 9,
		color: "#555555",
	},
	metaLabel: {
		color: "#888888",
	},
	section: {
		marginBottom: 24,
	},
	sectionLabel: {
		fontSize: 8,
		color: "#888888",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: 4,
	},
	clientName: {
		fontSize: 11,
		fontFamily: "Helvetica-Bold",
		marginBottom: 2,
	},
	table: {
		marginTop: 8,
	},
	tableHeaderRow: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#1a1a1a",
		paddingBottom: 6,
		marginBottom: 6,
	},
	tableRow: {
		flexDirection: "row",
		borderBottomWidth: 0.5,
		borderBottomColor: "#dddddd",
		paddingVertical: 6,
	},
	th: {
		fontSize: 8,
		textTransform: "uppercase",
		letterSpacing: 0.5,
		color: "#555555",
	},
	colDescription: { flex: 3 },
	colQty: { flex: 1, textAlign: "right" },
	colUnitPrice: { flex: 1.3, textAlign: "right" },
	colTax: { flex: 0.8, textAlign: "right" },
	colTotal: { flex: 1.3, textAlign: "right" },
	totalsBlock: {
		marginTop: 16,
		alignSelf: "flex-end",
		width: 220,
	},
	totalsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 3,
	},
	totalsLabel: {
		color: "#555555",
	},
	totalsRowFinal: {
		flexDirection: "row",
		justifyContent: "space-between",
		borderTopWidth: 1,
		borderTopColor: "#1a1a1a",
		marginTop: 4,
		paddingTop: 6,
	},
	totalsLabelFinal: {
		fontFamily: "Helvetica-Bold",
		fontSize: 11,
	},
	totalsValueFinal: {
		fontFamily: "Helvetica-Bold",
		fontSize: 11,
	},
	notes: {
		marginTop: 24,
		fontSize: 9,
		color: "#333333",
		lineHeight: 1.4,
	},
	footer: {
		position: "absolute",
		bottom: 24,
		left: 48,
		right: 48,
		fontSize: 8,
		color: "#999999",
		textAlign: "center",
	},
	stampBlock: {
		marginTop: 24,
		padding: 12,
		borderWidth: 1,
		borderColor: "#1a1a1a",
		alignSelf: "flex-start",
	},
	stampText: {
		fontSize: 11,
		fontFamily: "Helvetica-Bold",
		textTransform: "uppercase",
		letterSpacing: 1,
	},
})

export function money(
	value: number | string | Decimal,
	currency: string
): string {
	return formatMoney(value, currency)
}

export function OrgHeaderBlock({
	org,
}: {
	org: {
		logo: string | null
		name: string
		billingAddress: string | null
		taxId: string | null
	}
}) {
	return (
		<View style={pdfStyles.orgBlock}>
			{org.logo ? (
				<Image src={org.logo} />
			) : (
				<Text style={pdfStyles.orgName}>{org.name}</Text>
			)}
			{org.billingAddress
				? org.billingAddress
						.split("\n")
						.filter(Boolean)
						.map((line, i) => (
							<Text key={i} style={pdfStyles.mutedLine}>
								{line}
							</Text>
						))
				: null}
			{org.taxId ? (
				<Text style={pdfStyles.mutedLine}>Tax ID: {org.taxId}</Text>
			) : null}
		</View>
	)
}

export function ClientBlock({
	client,
}: {
	client: {
		name: string
		email: string | null
		billingAddress: string | null
		taxId: string | null
	}
}) {
	return (
		<View style={pdfStyles.section}>
			<Text style={pdfStyles.sectionLabel}>Bill to</Text>
			<Text style={pdfStyles.clientName}>{client.name}</Text>
			{client.billingAddress
				? client.billingAddress
						.split("\n")
						.filter(Boolean)
						.map((line, i) => (
							<Text key={i} style={pdfStyles.mutedLine}>
								{line}
							</Text>
						))
				: null}
			{client.email ? (
				<Text style={pdfStyles.mutedLine}>{client.email}</Text>
			) : null}
			{client.taxId ? (
				<Text style={pdfStyles.mutedLine}>Tax ID: {client.taxId}</Text>
			) : null}
		</View>
	)
}

export interface PdfLineItem {
	description: string
	quantity: number | string
	unitPrice: number | string
	taxRate: number | string
}

export function ItemsTable({
	items,
	currency,
}: {
	items: PdfLineItem[]
	currency: string
}) {
	return (
		<View style={pdfStyles.table}>
			<View style={pdfStyles.tableHeaderRow}>
				<Text style={[pdfStyles.th, pdfStyles.colDescription]}>
					Description
				</Text>
				<Text style={[pdfStyles.th, pdfStyles.colQty]}>Qty</Text>
				<Text style={[pdfStyles.th, pdfStyles.colUnitPrice]}>Unit price</Text>
				<Text style={[pdfStyles.th, pdfStyles.colTax]}>Tax</Text>
				<Text style={[pdfStyles.th, pdfStyles.colTotal]}>Line total</Text>
			</View>
			{items.map((item, i) => {
				const qty = Number(item.quantity)
				const unitPrice = Number(item.unitPrice)
				const taxRate = Number(item.taxRate)
				const lineTotal = qty * unitPrice * (1 + taxRate / 100)
				return (
					<View key={i} style={pdfStyles.tableRow}>
						<Text style={pdfStyles.colDescription}>{item.description}</Text>
						<Text style={pdfStyles.colQty}>{qty}</Text>
						<Text style={pdfStyles.colUnitPrice}>
							{money(unitPrice, currency)}
						</Text>
						<Text style={pdfStyles.colTax}>{taxRate}%</Text>
						<Text style={pdfStyles.colTotal}>{money(lineTotal, currency)}</Text>
					</View>
				)
			})}
		</View>
	)
}

export function TotalsBlock({
	subtotal,
	taxTotal,
	discountTotal,
	total,
	amountPaid,
	currency,
	finalLabel = "Total",
}: {
	subtotal: number | string
	taxTotal: number | string
	discountTotal: number | string
	total: number | string
	amountPaid?: number | string
	currency: string
	finalLabel?: string
}) {
	const balanceDue =
		amountPaid !== undefined ? Number(total) - Number(amountPaid) : undefined
	return (
		<View style={pdfStyles.totalsBlock}>
			<View style={pdfStyles.totalsRow}>
				<Text style={pdfStyles.totalsLabel}>Subtotal</Text>
				<Text>{money(subtotal, currency)}</Text>
			</View>
			<View style={pdfStyles.totalsRow}>
				<Text style={pdfStyles.totalsLabel}>Tax</Text>
				<Text>{money(taxTotal, currency)}</Text>
			</View>
			{Number(discountTotal) > 0 ? (
				<View style={pdfStyles.totalsRow}>
					<Text style={pdfStyles.totalsLabel}>Discount</Text>
					<Text>-{money(discountTotal, currency)}</Text>
				</View>
			) : null}
			<View style={pdfStyles.totalsRowFinal}>
				<Text style={pdfStyles.totalsLabelFinal}>{finalLabel}</Text>
				<Text style={pdfStyles.totalsValueFinal}>{money(total, currency)}</Text>
			</View>
			{amountPaid !== undefined && Number(amountPaid) > 0 ? (
				<>
					<View style={pdfStyles.totalsRow}>
						<Text style={pdfStyles.totalsLabel}>Paid</Text>
						<Text>{money(amountPaid, currency)}</Text>
					</View>
					<View style={pdfStyles.totalsRow}>
						<Text style={pdfStyles.totalsLabel}>Balance due</Text>
						<Text>{money(balanceDue ?? 0, currency)}</Text>
					</View>
				</>
			) : null}
		</View>
	)
}
