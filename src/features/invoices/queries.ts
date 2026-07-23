"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { Page } from "@/features/clients/dal"
import type { InvoiceStatus } from "@/generated/prisma/client"
import { ApiError, apiFetch } from "@/lib/api-client"

import type { InvoiceDetail, InvoiceListItem } from "./dal"
import type { InvoiceInput, RecordPaymentInput } from "./schema"

export const invoiceKeys = {
	all: ["invoices"] as const,
	lists: () => [...invoiceKeys.all, "list"] as const,
	list: (params: Record<string, string | undefined>) =>
		[...invoiceKeys.lists(), params] as const,
	details: () => [...invoiceKeys.all, "detail"] as const,
	detail: (id: string) => [...invoiceKeys.details(), id] as const,
}

function toQueryString(params: Record<string, string | undefined>) {
	const search = new URLSearchParams()
	for (const [key, value] of Object.entries(params)) {
		if (value) search.set(key, value)
	}
	const qs = search.toString()
	return qs ? `?${qs}` : ""
}

export function useInvoicesQuery(
	params: { status?: string; clientId?: string; search?: string } = {}
) {
	return useQuery({
		queryKey: invoiceKeys.list(params),
		queryFn: () =>
			apiFetch<Page<InvoiceListItem>>(`/api/invoices${toQueryString(params)}`),
		placeholderData: (previous) => previous,
	})
}

export function useInvoiceQuery(invoiceId: string | undefined) {
	return useQuery({
		queryKey: invoiceKeys.detail(invoiceId ?? ""),
		queryFn: () => apiFetch<InvoiceDetail>(`/api/invoices/${invoiceId}`),
		enabled: Boolean(invoiceId),
	})
}

export function useCreateInvoiceMutation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: InvoiceInput) =>
			apiFetch<InvoiceDetail>("/api/invoices", {
				method: "POST",
				body: JSON.stringify(input),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
			queryClient.invalidateQueries({
				queryKey: ["dashboard", "summary"],
			})
		},
	})
}

export function useUpdateInvoiceMutation(invoiceId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: InvoiceInput) =>
			apiFetch<InvoiceDetail>(`/api/invoices/${invoiceId}`, {
				method: "PATCH",
				body: JSON.stringify(input),
			}),
		onSuccess: (updated) => {
			queryClient.setQueryData(invoiceKeys.detail(invoiceId), updated)
			queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
			queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] })
		},
	})
}

export function useTransitionInvoiceStatusMutation(invoiceId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (status: InvoiceStatus) =>
			apiFetch<InvoiceDetail>(`/api/invoices/${invoiceId}/status`, {
				method: "PATCH",
				body: JSON.stringify({ status }),
			}),
		onSuccess: (updated) => {
			queryClient.setQueryData(invoiceKeys.detail(invoiceId), updated)
			queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
			queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] })
		},
	})
}

export function useRecordPaymentMutation(invoiceId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: RecordPaymentInput) =>
			apiFetch<InvoiceDetail>(`/api/invoices/${invoiceId}/payments`, {
				method: "POST",
				body: JSON.stringify(input),
			}),
		onSuccess: (updated) => {
			queryClient.setQueryData(invoiceKeys.detail(invoiceId), updated)
			queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
			queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] })
		},
	})
}

/** Emails the invoice PDF to the client. No client-side cache change needed — sending doesn't alter the invoice. */
export function useSendInvoiceEmailMutation() {
	return useMutation({
		mutationFn: (invoiceId: string) =>
			apiFetch<InvoiceDetail>(`/api/invoices/${invoiceId}/send`, {
				method: "POST",
			}),
		onSuccess: () => {
			toast.success("Invoice emailed.")
		},
		onError: (error) => {
			toast.error(
				error instanceof ApiError ? error.message : "Couldn't send that email."
			)
		},
	})
}
