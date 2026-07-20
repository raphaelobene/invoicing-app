import { Badge, type BadgeProps } from "@/components/ui/badge"
import type { InvoiceStatus, QuoteStatus } from "@/generated/prisma/client"
import { match } from "@/lib/utils/pattern-match"

function invoiceStatusStyle(status: InvoiceStatus): {
	label: string
	variant: BadgeProps["variant"]
} {
	return match(status)
		.with("DRAFT", () => ({ label: "Draft", variant: "secondary" as const }))
		.with("SENT", () => ({ label: "Sent", variant: "outline" as const }))
		.with("PARTIALLY_PAID", () => ({
			label: "Partially paid",
			variant: "warning" as const,
		}))
		.with("PAID", () => ({ label: "Paid", variant: "success" as const }))
		.with("OVERDUE", () => ({
			label: "Overdue",
			variant: "destructive" as const,
		}))
		.with("VOID", () => ({ label: "Void", variant: "secondary" as const }))
		.exhaustive()
}

function quoteStatusStyle(status: QuoteStatus): {
	label: string
	variant: BadgeProps["variant"]
} {
	return match(status)
		.with("DRAFT", () => ({ label: "Draft", variant: "secondary" as const }))
		.with("SENT", () => ({ label: "Sent", variant: "outline" as const }))
		.with("ACCEPTED", () => ({
			label: "Accepted",
			variant: "success" as const,
		}))
		.with("REJECTED", () => ({
			label: "Rejected",
			variant: "destructive" as const,
		}))
		.with("EXPIRED", () => ({
			label: "Expired",
			variant: "secondary" as const,
		}))
		.with("CONVERTED", () => ({
			label: "Converted",
			variant: "success" as const,
		}))
		.exhaustive()
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
	const { label, variant } = invoiceStatusStyle(status)
	return <Badge variant={variant}>{label}</Badge>
}

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
	const { label, variant } = quoteStatusStyle(status)
	return <Badge variant={variant}>{label}</Badge>
}
