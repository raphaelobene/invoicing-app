"use client"

import Link from "next/link"

import { PageHeader } from "@/components/shared/page-header"
import { InvoiceStatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardSummaryQuery } from "@/features/dashboard/queries"
import { InvoiceStatus } from "@/generated/prisma/enums"
import { formatMoney } from "@/lib/currency"
import { useOrgCurrency } from "@/lib/org-currency-context"

function SummaryCard({
	label,
	value,
	isLoading,
}: {
	label: string
	value: string
	isLoading: boolean
}) {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-normal text-muted-foreground">
					{label}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<Skeleton className="h-8 w-24" />
				) : (
					<p className="font-mono text-2xl font-semibold tabular-nums">
						{value}
					</p>
				)}
			</CardContent>
		</Card>
	)
}

export default function Dashboard() {
	const { data, isLoading } = useDashboardSummaryQuery()
	const { formatCurrency } = useOrgCurrency()

	return (
		<div>
			<PageHeader
				title="Dashboard"
				description="How the business is doing right now."
			/>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<SummaryCard
					label="Outstanding"
					value={data ? formatCurrency(data.outstandingTotal) : "—"}
					isLoading={isLoading}
				/>
				<SummaryCard
					label="Overdue"
					value={
						data
							? `${formatCurrency(data.overdueTotal)} · ${data.overdueCount}`
							: "—"
					}
					isLoading={isLoading}
				/>
				<SummaryCard
					label="Paid this month"
					value={data ? formatCurrency(data.paidThisMonthTotal) : "—"}
					isLoading={isLoading}
				/>
				<SummaryCard
					label="Draft quotes"
					value={data ? String(data.draftQuoteCount) : "—"}
					isLoading={isLoading}
				/>
			</div>

			<h2 className="mt-8 mb-3 text-sm font-semibold text-muted-foreground">
				Recent invoices
			</h2>
			<div className="rounded-lg border bg-card">
				{isLoading ? (
					<div className="space-y-3 p-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className="h-6 w-full" />
						))}
					</div>
				) : data && data.recentInvoices.length > 0 ? (
					<ul className="divide-y">
						{data.recentInvoices.map((invoice) => (
							<li key={invoice.id}>
								<Link
									href={`/invoices/${invoice.id}`}
									className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-accent"
								>
									<span className="w-fit font-mono tabular-nums">
										{invoice.number}
									</span>
									<span className="flex-1 text-muted-foreground">
										{invoice.client.name}
									</span>
									<div className="w-fit">
										<InvoiceStatusBadge
											status={invoice.status as InvoiceStatus}
										/>
									</div>
									<span className="min-w-30 text-end font-mono tabular-nums">
										{formatMoney(invoice.total, invoice.currency)}
									</span>
								</Link>
							</li>
						))}
					</ul>
				) : (
					<p className="p-6 text-center text-sm text-muted-foreground">
						No invoices yet.
					</p>
				)}
			</div>
		</div>
	)
}
