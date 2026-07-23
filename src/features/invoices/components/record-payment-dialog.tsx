"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import CustomFormField, {
	FormFieldType,
} from "@/components/shared/custom-form-field"
import { LoadingSwap } from "@/components/shared/loading-swap"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { ApiError } from "@/lib/api-client"

import { useRecordPaymentMutation } from "../queries"
import {
	RecordPaymentFormValues,
	recordPaymentSchema,
	type RecordPaymentInput,
} from "../schema"

export function RecordPaymentDialog({
	open,
	onOpenChange,
	invoiceId,
	balanceDue,
	currency,
	onRecorded,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	invoiceId: string
	balanceDue: number
	currency: string
	onRecorded?: () => void
}) {
	const mutation = useRecordPaymentMutation(invoiceId)

	const form = useForm<RecordPaymentFormValues, any, RecordPaymentInput>({
		resolver: zodResolver(recordPaymentSchema),
		defaultValues: {
			amount: Number(balanceDue.toFixed(2)),
			paidAt: new Date().toISOString().slice(0, 10),
			method: undefined,
			note: undefined,
		},
	})

	useEffect(() => {
		if (open) {
			form.reset({
				amount: Number(balanceDue.toFixed(2)),
				paidAt: new Date().toISOString().slice(0, 10),
				method: undefined,
				note: undefined,
			})
		}
	}, [open, balanceDue, form])

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			await mutation.mutateAsync(values)
			toast.success("Payment recorded.")
			onOpenChange(false)
			onRecorded?.()
		} catch (error) {
			if (error instanceof ApiError && error.fieldErrors) {
				for (const [field, messages] of Object.entries(error.fieldErrors)) {
					const message = messages[0]
					if (message) {
						form.setError(field as keyof RecordPaymentFormValues, { message })
					}
				}
			}
			toast.error(
				error instanceof ApiError
					? error.message
					: "Couldn't record that payment."
			)
		}
	})

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<form onSubmit={onSubmit}>
					<DialogHeader>
						<DialogTitle>Record a payment</DialogTitle>
						<DialogDescription>
							Balance due is {balanceDue.toFixed(2)} {currency}.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<CustomFormField
							fieldType={FormFieldType.INPUT}
							control={form.control}
							name="amount"
							label="Amount"
							type="number"
							autoFocus
						/>
						<CustomFormField
							fieldType={FormFieldType.INPUT}
							control={form.control}
							name="paidAt"
							label="Date"
							type="date"
						/>
						<CustomFormField
							fieldType={FormFieldType.INPUT}
							control={form.control}
							name="method"
							label="Method (optional)"
							placeholder="Bank transfer, card, cash..."
						/>
					</div>

					<DialogFooter>
						<Button type="submit" disabled={mutation.isPending}>
							<LoadingSwap isLoading={mutation.isPending}>
								Record payment
							</LoadingSwap>
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
