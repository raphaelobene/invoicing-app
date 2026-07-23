"use client"

import { toast } from "sonner"

import { DocumentActions } from "@/components/shared/document-actions"
import { Icon, Icons } from "@/components/shared/icons"
import { LoadingSwap } from "@/components/shared/loading-swap"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
	useCreateReceiptMutation,
	useReceiptQuery,
	useSendReceiptEmailMutation,
} from "@/features/receipts/queries"
import { ApiError } from "@/lib/api-client"
import { formatMoney } from "@/lib/currency"
import format from "@/lib/utils/formatter"

export function ReceiptPanel({
	invoiceId,
	status,
	hasClientEmail,
	currency,
}: {
	invoiceId: string
	status: string
	hasClientEmail: boolean
	currency: string
}) {
	const { data: receipt, isLoading } = useReceiptQuery(
		status === "PAID" ? invoiceId : undefined
	)
	const createMutation = useCreateReceiptMutation(invoiceId)
	const mutation = useSendReceiptEmailMutation()

	if (status !== "PAID") return null

	const handleCreate = async () => {
		try {
			await createMutation.mutateAsync()
			toast.success("Receipt created.")
		} catch (error) {
			toast.error(
				error instanceof ApiError
					? error.message
					: "Couldn't create the receipt."
			)
		}
	}

	return (
		<Card>
			<CardContent className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<Icon
						icon={Icons.fileCheck}
						strokeWidth={2}
						aria-hidden="true"
						className="text-muted-foreground"
					/>
					<div className="text-sm">
						{receipt ? (
							<>
								<p className="font-medium">Receipt {receipt.number}</p>
								<p className="text-muted-foreground">
									{formatMoney(receipt.amount, currency)} · issued{" "}
									{format(receipt.issueDate).date({ dateStyle: "medium" })}
								</p>
							</>
						) : (
							<>
								<p className="font-medium">No receipt issued yet</p>
								<p className="text-muted-foreground">
									This invoice is paid in full — issue a receipt for the client.
								</p>
							</>
						)}
					</div>
				</div>

				{isLoading ? null : receipt ? (
					<DocumentActions
						pdfUrl={`/api/invoices/${invoiceId}/receipt/pdf`}
						hasClientEmail={hasClientEmail}
						isSending={mutation.isPending}
						mutation={mutation}
						mutationArgs={invoiceId}
						label="Email receipt"
						title="Receipt"
					/>
				) : (
					<Button onClick={handleCreate} disabled={createMutation.isPending}>
						<LoadingSwap isLoading={createMutation.isPending}>
							Generate receipt
						</LoadingSwap>
					</Button>
				)}
			</CardContent>
		</Card>
	)
}
