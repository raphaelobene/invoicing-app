"use client"

import Link from "next/link"
import { Decimal } from "@prisma/client/runtime/client"

import { DocumentActions } from "@/components/shared/document-actions"
import ErrorCard from "@/components/shared/error-card"
import { Icon, Icons } from "@/components/shared/icons"
import { PageHeader } from "@/components/shared/page-header"
import { QuoteStatusBadge } from "@/components/shared/status-badge"
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
import { QuoteStatusActions } from "@/features/quotes/components/status-actions"
import {
	useQuoteQuery,
	useSendQuoteEmailMutation,
} from "@/features/quotes/queries"
import { formatMoney } from "@/lib/currency"
import { usePage } from "@/lib/platform/client/hooks/use-page"
import { cn } from "@/lib/utils/dx"
import format, { Formatter } from "@/lib/utils/formatter"

export default function QuoteDetail() {
	const { pathParams } = usePage("quote-details")
	const { quoteId } = pathParams
	const { data: quote, isLoading } = useQuoteQuery(quoteId)
	const sendMutation = useSendQuoteEmailMutation()

	if (isLoading) {
		return (
			<div className="grid h-screen w-full place-items-center">
				<SyncSpinner className="size-6 text-primary" />
			</div>
		)
	}

	if (!quote) {
		return (
			<div className="grid size-full place-items-center">
				<ErrorCard title="404" description="Quote not found." />
			</div>
		)
	}

	const money = (value: number | string | Decimal) =>
		formatMoney(value, quote.currency)

	return (
		<div className="space-y-6">
			<PageHeader
				title={quote.number}
				description={`Issued ${Formatter.date(quote.issueDate, { dateStyle: "long" })} · Expires ${Formatter.date(quote.expiryDate, { dateStyle: "long" })}`}
				actions={
					<>
						<QuoteStatusBadge status={quote.status} />
						{quote.status === "DRAFT" ? (
							<Link
								href={`/quotes/${quote.id}/edit`}
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
						href={`/clients/${quote.client.id}`}
						className="inline-flex cursor-pointer items-center justify-center gap-1 truncate border-b border-dashed border-border text-foreground transition duration-300 ease-in-out group-hover:border-accent-foreground hover:border-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
					>
						{quote.client.name}
					</Link>
				</div>
				<QuoteStatusActions quoteId={quote.id} status={quote.status} />
			</div>

			<DocumentActions
				pdfUrl={`/api/quotes/${quote.id}/pdf`}
				hasClientEmail={Boolean(quote.client.email)}
				isSending={sendMutation.isPending}
				mutation={sendMutation}
				mutationArgs={quoteId}
				title="Quote"
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
							{quote.items.map((item) => (
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
								{money(quote.subtotal)}
							</span>
						</div>
						<div className="flex justify-between text-muted-foreground">
							<span>Tax</span>
							<span className="font-mono tabular-nums">
								{money(quote.taxTotal)}
							</span>
						</div>
						{Number(quote.discountTotal) > 0 ? (
							<div className="flex justify-between text-muted-foreground">
								<span>Discount</span>
								<span className="font-mono tabular-nums">
									-{money(quote.discountTotal)}
								</span>
							</div>
						) : null}
						<div className="flex justify-between border-t pt-1.5 font-semibold">
							<span>Total</span>
							<span className="font-mono tabular-nums">
								{money(quote.total)}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{quote.notes ? (
				<Card>
					<CardContent className="text-sm whitespace-pre-line">
						{quote.notes}
					</CardContent>
				</Card>
			) : null}
		</div>
	)
}
