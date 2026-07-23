"use client"

import { useState } from "react"
import { toast } from "sonner"

import { LoadingSwap } from "@/components/shared/loading-swap"
import { Button } from "@/components/ui/button"
import type { InvoiceStatus } from "@/generated/prisma/client"
import { ApiError } from "@/lib/api-client"
import { match } from "@/lib/utils/pattern-match"

import { useTransitionInvoiceStatusMutation } from "../queries"
import { RecordPaymentDialog } from "./record-payment-dialog"

function nextStatusOptions(
	current: InvoiceStatus
): { status: InvoiceStatus; label: string }[] {
	return match(current)
		.with("DRAFT", () => [{ status: "SENT" as const, label: "Mark as sent" }])
		.with("SENT", () => [
			{ status: "OVERDUE" as const, label: "Mark as overdue" },
		])
		.with("PARTIALLY_PAID", () => [
			{ status: "OVERDUE" as const, label: "Mark as overdue" },
		])
		.with("OVERDUE", () => [
			{ status: "SENT" as const, label: "Reopen as sent" },
		])
		.with("PAID", () => [])
		.with("VOID", () => [])
		.exhaustive()
}

export function InvoiceStatusActions({
	invoiceId,
	status,
	balanceDue,
	currency,
}: {
	invoiceId: string
	status: InvoiceStatus
	balanceDue: number
	currency: string
}) {
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
	const [pendingStatus, setPendingStatus] = useState<InvoiceStatus | null>(null)
	const mutation = useTransitionInvoiceStatusMutation(invoiceId)

	const setStatus = (next: InvoiceStatus) => {
		setPendingStatus(next)
		mutation.mutate(next, {
			onSuccess: () => toast.success("Status updated."),
			onError: (error) =>
				toast.error(
					error instanceof ApiError
						? error.message
						: "Couldn't update the status."
				),
			onSettled: () => setPendingStatus(null),
		})
	}

	const canRecordPayment = status !== "VOID" && status !== "PAID"
	const canVoid = status !== "PAID" && status !== "VOID"

	return (
		<div className="flex flex-wrap gap-2">
			{nextStatusOptions(status).map((option) => (
				<Button
					key={option.status}
					variant="outline"
					onClick={() => setStatus(option.status)}
					disabled={pendingStatus !== null}
				>
					<LoadingSwap isLoading={pendingStatus === option.status}>
						{option.label}
					</LoadingSwap>
				</Button>
			))}

			{canRecordPayment ? (
				<Button onClick={() => setPaymentDialogOpen(true)}>
					Record payment
				</Button>
			) : null}

			{canVoid ? (
				<Button
					variant="outline"
					onClick={() => setStatus("VOID")}
					disabled={pendingStatus !== null}
				>
					<LoadingSwap isLoading={pendingStatus === "VOID"}>Void</LoadingSwap>
				</Button>
			) : null}

			<RecordPaymentDialog
				open={paymentDialogOpen}
				onOpenChange={setPaymentDialogOpen}
				invoiceId={invoiceId}
				balanceDue={balanceDue}
				currency={currency}
			/>
		</div>
	)
}
