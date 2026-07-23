"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { Page } from "@/features/clients/dal"
import type { Client } from "@/generated/prisma/client"
import { apiFetch } from "@/lib/api-client"

import type { ClientInput } from "./schema"

export const clientKeys = {
	all: ["clients"] as const,
	lists: () => [...clientKeys.all, "list"] as const,
	list: (params: Record<string, string | undefined>) =>
		[...clientKeys.lists(), params] as const,
	details: () => [...clientKeys.all, "detail"] as const,
	detail: (id: string) => [...clientKeys.details(), id] as const,
}

function toQueryString(params: Record<string, string | undefined>) {
	const search = new URLSearchParams()
	for (const [key, value] of Object.entries(params)) {
		if (value) search.set(key, value)
	}
	const qs = search.toString()
	return qs ? `?${qs}` : ""
}

export function useClientsQuery(
	params: { search?: string; take?: string } = {}
) {
	return useQuery({
		queryKey: clientKeys.list(params),
		queryFn: () =>
			apiFetch<Page<Client>>(`/api/clients${toQueryString(params)}`),
		placeholderData: (previous) => previous,
	})
}

export function useClientQuery(clientId: string | undefined) {
	return useQuery({
		queryKey: clientKeys.detail(clientId ?? ""),
		queryFn: () => apiFetch<Client>(`/api/clients/${clientId}`),
		enabled: Boolean(clientId),
	})
}

export function useCreateClientMutation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: ClientInput) =>
			apiFetch<Client>("/api/clients", {
				method: "POST",
				body: JSON.stringify(input),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
		},
	})
}

export function useUpdateClientMutation(clientId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: ClientInput) =>
			apiFetch<Client>(`/api/clients/${clientId}`, {
				method: "PATCH",
				body: JSON.stringify(input),
			}),
		onSuccess: (updated) => {
			queryClient.setQueryData(clientKeys.detail(clientId), updated)
			queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
		},
	})
}

export function useDeleteClientMutation() {
	const router = useRouter()
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (clientId: string) =>
			apiFetch<void>(`/api/clients/${clientId}`, { method: "DELETE" }),
		onSuccess: (_data, clientId) => {
			queryClient.removeQueries({ queryKey: clientKeys.detail(clientId) })
			queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
			toast.success("Client deleted")
			router.push("/clients")
		},
		onError: (err) => {
			toast.error(
				err instanceof Error ? err.message : "Failed to delete client"
			)
		},
	})
}
