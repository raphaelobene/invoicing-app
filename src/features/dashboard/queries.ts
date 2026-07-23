"use client"

import { useQuery } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api-client"

import type { DashboardSummary } from "./dal"

export const dashboardKeys = {
	summary: ["dashboard", "summary"] as const,
}

export function useDashboardSummaryQuery() {
	return useQuery({
		queryKey: dashboardKeys.summary,
		queryFn: () => apiFetch<DashboardSummary>("/api/dashboard/summary"),
	})
}
