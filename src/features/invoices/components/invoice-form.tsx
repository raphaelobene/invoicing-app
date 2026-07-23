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
import { LoadingSwap } from "@/components/shared/loading-swap"
import { Button } from "@/components/ui/button"
import { FieldLabel, FieldSet } from "@/components/ui/field"
import { useClientsQuery } from "@/features/clients/queries"
import { ApiError } from "@/lib/api-client"
import { useOrgCurrency } from "@/lib/org-currency-context"

import type { InvoiceDetail } from "../dal"
import { useCreateInvoiceMutation, useUpdateInvoiceMutation } from "../queries"
import {
	InvoiceFormValues,
	invoiceInputSchema,
	type InvoiceInput,
} from "../schema"

function toDateInputValue(date: Date | string) {
	return new Date(date).toISOString().slice(0, 10)
}

function toFormValues(
	invoice: InvoiceDetail | undefined,
	defaultCurrency: string
): InvoiceInput {
	if (!invoice) {
		return {
			clientId: "",
			issueDate: toDateInputValue(new Date()),
			dueDate: toDateInputValue(
				new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
			),
			currency: defaultCurrency,
			notes: undefined,
			discountTotal: 0,
			items: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 0 }],
		}
	}
	return {
		clientId: invoice.clientId,
		issueDate: toDateInputValue(invoice.issueDate),
		dueDate: toDateInputValue(invoice.dueDate),
		currency: invoice.currency,
		notes: invoice.notes ?? undefined,
		discountTotal: Number(invoice.discountTotal),
		items: invoice.items.map((item) => ({
			description: item.description,
			quantity: Number(item.quantity),
			unitPrice: Number(item.unitPrice),
			taxRate: Number(item.taxRate),
		})),
	}
}

export function InvoiceForm({
	invoice,
	currency,
}: {
	invoice?: InvoiceDetail
	currency: string | null
}) {
	const router = useRouter()
	const isEditing = Boolean(invoice)
	const { defaultCurrency } = useOrgCurrency()

	const createMutation = useCreateInvoiceMutation()
	const updateMutation = useUpdateInvoiceMutation(invoice?.id ?? "")
	const mutation = isEditing ? updateMutation : createMutation

	// take: "100" keeps this simple for now — fine for the client lists most
	// small businesses have. If that stops being true, swap this for a
	// search-as-you-type fetch instead of loading everything up front.
	const { data: clientsPage } = useClientsQuery({ take: "100" })
	const clientOptions: BaseFieldOption[] = (clientsPage?.items ?? []).map(
		(client) => ({
			label: client.name,
			value: client.id,
		})
	)

	const formCurrency = currency || defaultCurrency

	const form = useForm<InvoiceFormValues, any, InvoiceInput>({
		resolver: zodResolver(invoiceInputSchema),
		defaultValues: toFormValues(invoice, formCurrency),
	})
	const items = form.watch("items") as InvoiceInput["items"]
	const discountTotal = form.watch("discountTotal") as number
	const lineItemCurrency =
		(form.watch("currency") as string | undefined) || formCurrency

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			const result = await mutation.mutateAsync(values)
			toast.success(isEditing ? "Invoice updated." : "Invoice created.")
			router.push(`/invoices/${result.id}`)
		} catch (error) {
			if (error instanceof ApiError && error.fieldErrors) {
				for (const [field, messages] of Object.entries(error.fieldErrors)) {
					const message = messages[0]
					if (message) {
						form.setError(field as keyof InvoiceFormValues, { message })
					}
				}
			}
			toast.error(
				error instanceof ApiError
					? error.message
					: "Couldn't save this invoice."
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
						placeholder={formCurrency}
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
						name="dueDate"
						label="Due date"
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
				placeholder="Payment terms, thank-you note, anything the client should see..."
				className="resize-none"
			/>

			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" onClick={() => router.back()}>
					Cancel
				</Button>
				<Button type="submit" disabled={mutation.isPending}>
					<LoadingSwap isLoading={mutation.isPending}>
						{isEditing ? "Save changes" : "Create invoice"}
					</LoadingSwap>
				</Button>
			</div>
		</form>
	)
}
