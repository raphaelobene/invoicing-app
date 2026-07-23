"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { ApiError, apiFetch } from "@/lib/api-client"

import type { ReceiptDetail } from "./dal"

export const receiptKeys = {
	all: ["receipts"] as const,
	byInvoice: (invoiceId: string) =>
		[...receiptKeys.all, "byInvoice", invoiceId] as const,
}

/**
 * Returns `null` (not an error) when no receipt has been issued yet — that's
 * the expected, common case for any invoice that isn't PAID, not a failure.
 * The API returns a 409 CONFLICT for "no receipt yet"; this hook treats
 * that specific case as data instead of surfacing it as a query error.
 */
export function useReceiptQuery(invoiceId: string | undefined) {
	return useQuery({
		queryKey: receiptKeys.byInvoice(invoiceId ?? ""),
		queryFn: async () => {
			try {
				return await apiFetch<ReceiptDetail>(
					`/api/invoices/${invoiceId}/receipt`
				)
			} catch (error) {
				if (error instanceof ApiError && error.status === 409) return null
				throw error
			}
		},
		enabled: Boolean(invoiceId),
	})
}

export function useCreateReceiptMutation(invoiceId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: () =>
			apiFetch<ReceiptDetail>(`/api/invoices/${invoiceId}/receipt`, {
				method: "POST",
			}),
		onSuccess: (receipt) => {
			queryClient.setQueryData(receiptKeys.byInvoice(invoiceId), receipt)
		},
	})
}

export function useSendReceiptEmailMutation() {
	return useMutation({
		mutationFn: (invoiceId: string) =>
			apiFetch<ReceiptDetail>(`/api/invoices/${invoiceId}/receipt/send`, {
				method: "POST",
			}),
		onSuccess: () => {
			toast.success("Receipt emailed.")
		},
		onError: (error) => {
			toast.error(
				error instanceof ApiError ? error.message : "Couldn't send that email."
			)
		},
	})
}
