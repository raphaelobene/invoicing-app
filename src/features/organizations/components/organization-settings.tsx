"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import CustomFormField, {
	FormFieldType,
} from "@/components/shared/custom-form-field"
import { LoadingSwap } from "@/components/shared/loading-swap"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { authClient, useActiveOrganization } from "@/lib/auth-client"
import { useOrgCurrency } from "@/lib/org-currency-context"

import {
	OrganizationBillingFields,
	organizationSettingsSchema,
	OrgSettingsFormValues,
	OrgSettingsInput,
} from "../schema"

export default function OrganizationSettings() {
	const { data: organization, isPending } = useActiveOrganization()
	const queryClient = useQueryClient()
	const { defaultCurrency } = useOrgCurrency()

	const org = organization as
		(typeof organization & OrganizationBillingFields) | null | undefined

	const defaultFormValues: OrgSettingsFormValues = {
		name: "",
		defaultCurrency,
		invoicePrefix: "INV",
		quotePrefix: "QUO",
		taxId: "",
		billingAddress: "",
		billingEmail: "",
	}

	const form = useForm<OrgSettingsFormValues, any, OrgSettingsInput>({
		resolver: zodResolver(organizationSettingsSchema),
		defaultValues: org
			? {
					name: org.name ?? "",
					defaultCurrency: org.defaultCurrency ?? defaultCurrency,
					invoicePrefix: org.invoicePrefix ?? "INV",
					quotePrefix: org.quotePrefix ?? "QUO",
					taxId: org.taxId ?? "",
					billingAddress: org.billingAddress ?? "",
					billingEmail: org.billingEmail ?? "",
				}
			: defaultFormValues,
	})

	const mutation = useMutation({
		mutationFn: async (data: OrgSettingsInput) => {
			if (!org) throw new Error("No active organization")

			const { data: result, error } = await authClient.organization.update({
				organizationId: org.id,
				data,
			})

			if (error) {
				throw new Error(
					error.message ?? "Couldn't save your organization settings."
				)
			}

			return result
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["organization", "active"] })
			toast.success("Settings saved.")
		},
		onError: (error: Error) => {
			toast.error(error.message)
		},
	})

	const onSubmit = form.handleSubmit(async (data) => mutation.mutateAsync(data))

	if (isPending) {
		return (
			<div className="max-w-xl space-y-4">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-64 w-full" />
			</div>
		)
	}

	return (
		<div className="max-w-xl">
			<PageHeader
				title="Organization settings"
				description="Business details used on invoices and quotes."
			/>

			<Card>
				<CardContent className="pt-6">
					<form onSubmit={onSubmit} className="space-y-4">
						<CustomFormField
							fieldType={FormFieldType.INPUT}
							control={form.control}
							name="name"
							label="Business name"
							autoFocus
						/>

						<div className="grid grid-cols-3 gap-4">
							<CustomFormField
								fieldType={FormFieldType.INPUT}
								control={form.control}
								name="defaultCurrency"
								label="Currency"
							/>
							<CustomFormField
								fieldType={FormFieldType.INPUT}
								control={form.control}
								name="invoicePrefix"
								label="Invoice prefix"
							/>
							<CustomFormField
								fieldType={FormFieldType.INPUT}
								control={form.control}
								name="quotePrefix"
								label="Quote prefix"
							/>
						</div>

						<CustomFormField
							fieldType={FormFieldType.INPUT}
							control={form.control}
							name="taxId"
							label="Tax ID"
						/>
						<CustomFormField
							fieldType={FormFieldType.INPUT}
							control={form.control}
							label="Billing email"
							name="billingEmail"
							type="email"
							autoComplete="email"
						/>
						<CustomFormField
							fieldType={FormFieldType.TEXTAREA}
							control={form.control}
							name="billingAddress"
							label="Billing address"
							className="resize-none"
						/>

						<Button type="submit" disabled={mutation.isPending}>
							<LoadingSwap isLoading={mutation.isPending}>
								Save changes
							</LoadingSwap>
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
