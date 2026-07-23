"use client"

import { createContext, useContext } from "react"

import { useActiveOrganization } from "@/lib/auth-client"
import { formatMoney } from "@/lib/currency"

interface OrgCurrencyContextValue {
	defaultCurrency: string
	formatCurrency: (amount: number | string) => string
}

const OrgCurrencyContext = createContext<OrgCurrencyContextValue | null>(null)

export function OrgCurrencyProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const { data: organization } = useActiveOrganization()
	const defaultCurrency = (organization as any)?.defaultCurrency ?? "NGN"

	const value: OrgCurrencyContextValue = {
		defaultCurrency,
		formatCurrency: (amount) => formatMoney(amount, defaultCurrency),
	}

	return (
		<OrgCurrencyContext.Provider value={value}>
			{children}
		</OrgCurrencyContext.Provider>
	)
}

export function useOrgCurrency() {
	const ctx = useContext(OrgCurrencyContext)
	if (!ctx)
		throw new Error("useOrgCurrency must be used inside OrgCurrencyProvider")
	return ctx
}
