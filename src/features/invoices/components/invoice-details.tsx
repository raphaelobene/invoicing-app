"use client"

import Link from "next/link"
import { Decimal } from "@prisma/client/runtime/client"

import { DocumentActions } from "@/components/shared/document-actions"
import ErrorCard from "@/components/shared/error-card"
import { Icon, Icons } from "@/components/shared/icons"
import { PageHeader } from "@/components/shared/page-header"
import { InvoiceStatusBadge } from "@/components/shared/status-badge"
import SyncSpinner from "@/components/shared/sync-spinner"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { ReceiptPanel } from "@/features/invoices/components/receipt-panel"
import { InvoiceStatusActions } from "@/features/invoices/components/status-actions"
import {
	useInvoiceQuery,
	useSendInvoiceEmailMutation,
} from "@/features/invoices/queries"
import { formatMoney } from "@/lib/currency"
import { usePage } from "@/lib/platform/client/hooks/use-page"
import { cn } from "@/lib/utils/dx"
import format, { Formatter } from "@/lib/utils/formatter"

export default function InvoiceDetails() {
	const { pathParams } = usePage("invoice-details")
	const { invoiceId } = pathParams
	const { data: invoice, isLoading } = useInvoiceQuery(invoiceId)
	const sendMutation = useSendInvoiceEmailMutation()

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

	const money = (value: number | string | Decimal) =>
		formatMoney(value, invoice.currency)
	const balanceDue = Number(invoice.total) - Number(invoice.amountPaid)

	return (
		<div className="space-y-6">
			<PageHeader
				title={invoice.number}
				description={`Issued ${Formatter.date(invoice.issueDate, { dateStyle: "long" })} · Due ${Formatter.date(invoice.dueDate, { dateStyle: "long" })}`}
				actions={
					<>
						<InvoiceStatusBadge status={invoice.status} />
						{invoice.status === "DRAFT" ? (
							<Link
								href={`/invoices/${invoice.id}/edit`}
								className={cn(
									buttonVariants({ variant: "outline", size: "sm" })
								)}
							>
								<Icon icon={Icons.pencil} strokeWidth={2} aria-hidden="true" />
								Edit
							</Link>
						) : null}
					</>
				}
			/>

			<div className="flex items-center justify-between rounded-lg border bg-card p-4">
				<div className="text-sm">
					<p className="text-muted-foreground">Client</p>
					<Link
						href={`/clients/${invoice.client.id}`}
						className="inline-flex cursor-pointer items-center justify-center gap-1 truncate border-b border-dashed border-border text-foreground transition duration-300 ease-in-out group-hover:border-accent-foreground hover:border-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
					>
						{invoice.client.name}
					</Link>
				</div>
				<InvoiceStatusActions
					invoiceId={invoice.id}
					status={invoice.status}
					balanceDue={balanceDue}
					currency={invoice.currency}
				/>
			</div>

			<DocumentActions
				pdfUrl={`/api/invoices/${invoice.id}/pdf`}
				hasClientEmail={Boolean(invoice.client.email)}
				isSending={sendMutation.isPending}
				mutation={sendMutation}
				mutationArgs={invoiceId}
				title="Invoice"
			/>

			<ReceiptPanel
				invoiceId={invoice.id}
				status={invoice.status}
				hasClientEmail={Boolean(invoice.client.email)}
				currency={invoice.currency}
			/>

			<Card>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Description</TableHead>
								<TableHead>Qty</TableHead>
								<TableHead>Unit price</TableHead>
								<TableHead>Tax</TableHead>
								<TableHead className="text-right">Line total</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{invoice.items.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="wrap-break-words whitespace-normal">
										{item.description}
									</TableCell>
									<TableCell>
										{format(item.quantity).number({ decimals: 0 })}
									</TableCell>
									<TableCell>{money(item.unitPrice)}</TableCell>
									<TableCell>
										{format(item.taxRate).percent({ decimals: 0 })}
									</TableCell>
									<TableCell className="text-right font-mono tabular-nums">
										{money(
											Number(item.quantity) *
												Number(item.unitPrice) *
												(1 + Number(item.taxRate) / 100)
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					<div className="mt-4 ml-auto w-64 space-y-1.5 text-sm">
						<div className="flex justify-between text-muted-foreground">
							<span>Subtotal</span>
							<span className="font-mono tabular-nums">
								{money(invoice.subtotal)}
							</span>
						</div>
						<div className="flex justify-between text-muted-foreground">
							<span>Tax</span>
							<span className="font-mono tabular-nums">
								{money(invoice.taxTotal)}
							</span>
						</div>
						{Number(invoice.discountTotal) > 0 ? (
							<div className="flex justify-between text-muted-foreground">
								<span>Discount</span>
								<span className="font-mono tabular-nums">
									-{money(invoice.discountTotal)}
								</span>
							</div>
						) : null}
						<div className="flex justify-between border-t pt-1.5 font-semibold">
							<span>Total</span>
							<span className="font-mono tabular-nums">
								{money(invoice.total)}
							</span>
						</div>
						{Number(invoice.amountPaid) > 0 ? (
							<>
								<div className="flex justify-between text-muted-foreground">
									<span>Paid</span>
									<span className="font-mono tabular-nums">
										{money(invoice.amountPaid)}
									</span>
								</div>
								<div className="flex justify-between font-semibold">
									<span>Balance due</span>
									<span className="font-mono tabular-nums">
										{money(balanceDue)}
									</span>
								</div>
							</>
						) : null}
					</div>
				</CardContent>
			</Card>

			{invoice.notes ? (
				<Card>
					<CardContent className="whitespace-pre-line">
						{invoice.notes}
					</CardContent>
				</Card>
			) : null}

			{invoice.payments.length > 0 ? (
				<div>
					<h2 className="mb-3 text-sm font-semibold text-muted-foreground">
						Payments
					</h2>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Date</TableHead>
								<TableHead>Method</TableHead>
								<TableHead className="text-right">Amount</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{invoice.payments.map((payment) => (
								<TableRow key={payment.id}>
									<TableCell>
										{format(payment.paidAt).date({ dateStyle: "medium" })}
									</TableCell>
									<TableCell>{payment.method || "—"}</TableCell>
									<TableCell className="text-right font-mono tabular-nums">
										{money(payment.amount)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			) : null}
		</div>
	)
}
