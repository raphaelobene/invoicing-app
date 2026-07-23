"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { QuoteStatus } from "@/generated/prisma/client"
import { ApiError } from "@/lib/api-client"
import { match } from "@/lib/utils/pattern-match"

import {
	useConvertQuoteMutation,
	useTransitionQuoteStatusMutation,
} from "../queries"

function nextStatusOptions(
	current: QuoteStatus
): { status: QuoteStatus; label: string }[] {
	return match(current)
		.with("DRAFT", () => [{ status: "SENT" as const, label: "Mark as sent" }])
		.with("SENT", () => [
			{ status: "ACCEPTED" as const, label: "Mark as accepted" },
			{ status: "EXPIRED" as const, label: "Mark as expired" },
		])
		.with("ACCEPTED", () => [])
		.with("REJECTED", () => [])
		.with("EXPIRED", () => [])
		.with("CONVERTED", () => [])
		.exhaustive()
}

export function QuoteStatusActions({
	quoteId,
	status,
}: {
	quoteId: string
	status: QuoteStatus
}) {
	const router = useRouter()
	const [pending, setPending] = useState<string | null>(null)
	const statusMutation = useTransitionQuoteStatusMutation(quoteId)
	const convertMutation = useConvertQuoteMutation(quoteId)

	const setStatus = (next: QuoteStatus) => {
		setPending(next)
		statusMutation.mutate(next, {
			onSuccess: () => toast.success("Status updated."),
			onError: (error) =>
				toast.error(
					error instanceof ApiError
						? error.message
						: "Couldn't update the status."
				),
			onSettled: () => setPending(null),
		})
	}

	const handleConvert = () => {
		setPending("convert")
		convertMutation.mutate(undefined, {
			onSuccess: (invoice) => {
				toast.success("Converted to invoice.")
				router.push(`/invoices/${invoice.id}`)
			},
			onError: (error) =>
				toast.error(
					error instanceof ApiError
						? error.message
						: "Couldn't convert this quote."
				),
			onSettled: () => setPending(null),
		})
	}

	const canReject = status === "DRAFT" || status === "SENT"
	const canConvert = status === "SENT" || status === "ACCEPTED"

	return (
		<div className="flex flex-wrap gap-2">
			{nextStatusOptions(status).map((option) => (
				<Button
					key={option.status}
					variant="outline"
					onClick={() => setStatus(option.status)}
					disabled={pending !== null}
				>
					{pending === option.status ? "Updating..." : option.label}
				</Button>
			))}
			{canConvert ? (
				<Button onClick={handleConvert} disabled={pending !== null}>
					{pending === "convert" ? "Converting..." : "Convert to invoice"}
				</Button>
			) : null}
			{canReject ? (
				<Button
					variant="outline"
					onClick={() => setStatus("REJECTED")}
					disabled={pending !== null}
				>
					{pending === "REJECTED" ? "Rejecting..." : "Mark as rejected"}
				</Button>
			) : null}
		</div>
	)
}
