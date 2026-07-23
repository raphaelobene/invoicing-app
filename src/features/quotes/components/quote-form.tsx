"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import CustomFormField, {
	FormFieldType,
	type BaseFieldOption,
} from "@/components/shared/custom-form-field"
import { LineItemsEditor } from "@/components/shared/line-items-editor"
import { Button } from "@/components/ui/button"
import { FieldLabel, FieldSet } from "@/components/ui/field"
import { useClientsQuery } from "@/features/clients/queries"
import { ApiError } from "@/lib/api-client"
import { useOrgCurrency } from "@/lib/org-currency-context"

import type { QuoteDetail } from "../dal"
import { useCreateQuoteMutation, useUpdateQuoteMutation } from "../queries"
import {
	quoteInputSchema,
	type QuoteFormValues,
	type QuoteInput,
} from "../schema"

function toDateInputValue(date: Date | string) {
	return new Date(date).toISOString().slice(0, 10)
}

function toFormValues(
	quote: QuoteDetail | undefined,
	defaultCurrency: string
): QuoteInput {
	if (!quote) {
		return {
			clientId: "",
			issueDate: toDateInputValue(new Date()),
			expiryDate: toDateInputValue(
				new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
			),
			currency: defaultCurrency,
			notes: undefined,
			discountTotal: 0,
			items: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 0 }],
		}
	}
	return {
		clientId: quote.clientId,
		issueDate: toDateInputValue(quote.issueDate),
		expiryDate: toDateInputValue(quote.expiryDate),
		currency: quote.currency,
		notes: quote.notes ?? undefined,
		discountTotal: Number(quote.discountTotal),
		items: quote.items.map((item) => ({
			description: item.description,
			quantity: Number(item.quantity),
			unitPrice: Number(item.unitPrice),
			taxRate: Number(item.taxRate),
		})),
	}
}

export function QuoteForm({
	quote,
	currency,
}: {
	quote?: QuoteDetail
	currency: string | null
}) {
	const router = useRouter()
	const isEditing = Boolean(quote)
	const { defaultCurrency } = useOrgCurrency()

	const createMutation = useCreateQuoteMutation()
	const updateMutation = useUpdateQuoteMutation(quote?.id ?? "")
	const mutation = isEditing ? updateMutation : createMutation

	const { data: clientsPage } = useClientsQuery({ take: "100" })
	const clientOptions: BaseFieldOption[] = (clientsPage?.items ?? []).map(
		(client) => ({
			label: client.name,
			value: client.id,
		})
	)

	const formCurrency = currency || defaultCurrency

	const form = useForm<QuoteFormValues, any, QuoteInput>({
		resolver: zodResolver(quoteInputSchema),
		defaultValues: toFormValues(quote, formCurrency),
	})
	const items = form.watch("items") as QuoteInput["items"]
	const discountTotal = form.watch("discountTotal") as number
	const lineItemCurrency =
		(form.watch("currency") as string | undefined) || formCurrency

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			const result = await mutation.mutateAsync(values)
			toast.success(isEditing ? "Quote updated." : "Quote created.")
			router.push(`/quotes/${result.id}`)
		} catch (error) {
			if (error instanceof ApiError && error.fieldErrors) {
				for (const [field, messages] of Object.entries(error.fieldErrors)) {
					const message = messages[0]
					if (message) {
						form.setError(field as keyof QuoteFormValues, { message })
					}
				}
			}
			toast.error(
				error instanceof ApiError ? error.message : "Couldn't save this quote."
			)
		}
	})

	return (
		<form onSubmit={onSubmit} className="space-y-6">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="sm:col-span-2">
					<CustomFormField
						fieldType={FormFieldType.COMBOBOX}
						control={form.control}
						name="clientId"
						label="Client"
						options={clientOptions}
						placeholder="Search clients..."
					/>
				</div>
				<div className="grid grid-cols-3 gap-4 sm:col-span-2">
					<CustomFormField
						fieldType={FormFieldType.INPUT}
						control={form.control}
						name="currency"
						label="Currency"
						placeholder={defaultCurrency}
					/>
					<CustomFormField
						fieldType={FormFieldType.INPUT}
						control={form.control}
						name="issueDate"
						label="Issue date"
						type="date"
					/>
					<CustomFormField
						fieldType={FormFieldType.INPUT}
						control={form.control}
						name="expiryDate"
						label="Expires"
						type="date"
					/>
				</div>
			</div>

			<FieldSet>
				<FieldLabel>Line Items</FieldLabel>
				<LineItemsEditor
					items={items}
					onChange={(nextItems) =>
						form.setValue("items", nextItems, {
							shouldDirty: true,
							shouldTouch: true,
							shouldValidate: true,
						})
					}
					discountTotal={discountTotal}
					onDiscountChange={(nextDiscountTotal) =>
						form.setValue("discountTotal", nextDiscountTotal, {
							shouldDirty: true,
							shouldTouch: true,
							shouldValidate: true,
						})
					}
					currency={lineItemCurrency}
				/>
			</FieldSet>

			<CustomFormField
				fieldType={FormFieldType.TEXTAREA}
				control={form.control}
				name="notes"
				label="Notes"
				placeholder="Scope notes, validity terms, anything the client should see..."
			/>

			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" onClick={() => router.back()}>
					Cancel
				</Button>
				<Button type="submit" disabled={mutation.isPending}>
					{mutation.isPending
						? "Saving..."
						: isEditing
							? "Save changes"
							: "Create quote"}
				</Button>
			</div>
		</form>
	)
}
