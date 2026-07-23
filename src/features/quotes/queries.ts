"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { Page } from "@/features/clients/dal"
import type { InvoiceDetail } from "@/features/invoices/dal"
import { invoiceKeys } from "@/features/invoices/queries"
import type { QuoteStatus } from "@/generated/prisma/client"
import { ApiError, apiFetch } from "@/lib/api-client"

import type { QuoteDetail, QuoteListItem } from "./dal"
import type { QuoteInput } from "./schema"

export const quoteKeys = {
	all: ["quotes"] as const,
	lists: () => [...quoteKeys.all, "list"] as const,
	list: (params: Record<string, string | undefined>) =>
		[...quoteKeys.lists(), params] as const,
	details: () => [...quoteKeys.all, "detail"] as const,
	detail: (id: string) => [...quoteKeys.details(), id] as const,
}

function toQueryString(params: Record<string, string | undefined>) {
	const search = new URLSearchParams()
	for (const [key, value] of Object.entries(params)) {
		if (value) search.set(key, value)
	}
	const qs = search.toString()
	return qs ? `?${qs}` : ""
}

export function useQuotesQuery(
	params: { status?: string; clientId?: string; search?: string } = {}
) {
	return useQuery({
		queryKey: quoteKeys.list(params),
		queryFn: () =>
			apiFetch<Page<QuoteListItem>>(`/api/quotes${toQueryString(params)}`),
		placeholderData: (previous) => previous,
	})
}

export function useQuoteQuery(quoteId: string | undefined) {
	return useQuery({
		queryKey: quoteKeys.detail(quoteId ?? ""),
		queryFn: () => apiFetch<QuoteDetail>(`/api/quotes/${quoteId}`),
		enabled: Boolean(quoteId),
	})
}

export function useCreateQuoteMutation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: QuoteInput) =>
			apiFetch<QuoteDetail>("/api/quotes", {
				method: "POST",
				body: JSON.stringify(input),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: quoteKeys.lists() })
		},
	})
}

export function useUpdateQuoteMutation(quoteId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: QuoteInput) =>
			apiFetch<QuoteDetail>(`/api/quotes/${quoteId}`, {
				method: "PATCH",
				body: JSON.stringify(input),
			}),
		onSuccess: (updated) => {
			queryClient.setQueryData(quoteKeys.detail(quoteId), updated)
			queryClient.invalidateQueries({ queryKey: quoteKeys.lists() })
		},
	})
}

export function useTransitionQuoteStatusMutation(quoteId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (status: QuoteStatus) =>
			apiFetch<QuoteDetail>(`/api/quotes/${quoteId}/status`, {
				method: "PATCH",
				body: JSON.stringify({ status }),
			}),
		onSuccess: (updated) => {
			queryClient.setQueryData(quoteKeys.detail(quoteId), updated)
			queryClient.invalidateQueries({ queryKey: quoteKeys.lists() })
		},
	})
}

/** Converting a quote also creates an invoice, so both caches need to know. */
export function useConvertQuoteMutation(quoteId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (dueDate?: string) =>
			apiFetch<InvoiceDetail>(`/api/quotes/${quoteId}/convert`, {
				method: "POST",
				body: JSON.stringify(dueDate ? { dueDate } : {}),
			}),
		onSuccess: (invoice) => {
			queryClient.invalidateQueries({ queryKey: quoteKeys.lists() })
			queryClient.invalidateQueries({ queryKey: quoteKeys.detail(quoteId) })
			queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
			queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice)
		},
	})
}

export function useSendQuoteEmailMutation() {
	return useMutation({
		mutationFn: (quoteId: string) =>
			apiFetch<QuoteDetail>(`/api/quotes/${quoteId}/send`, { method: "POST" }),
		onSuccess: () => {
			toast.success("Quote emailed.")
		},
		onError: (error) => {
			toast.error(
				error instanceof ApiError ? error.message : "Couldn't send that email."
			)
		},
	})
}
