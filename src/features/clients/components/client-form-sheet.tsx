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
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet"
import type { Client } from "@/generated/prisma/client"
import { ApiError } from "@/lib/api-client"

import { useCreateClientMutation, useUpdateClientMutation } from "../queries"
import { ClientFormValues, ClientInput, clientInputSchema } from "../schema"

const EMPTY_VALUES: ClientFormValues = {
	name: "",
	email: undefined,
	phone: undefined,
	billingAddress: undefined,
	taxId: undefined,
	notes: undefined,
}

function toFormValues(client: Client): ClientFormValues {
	return {
		name: client.name,
		email: client.email ?? undefined,
		phone: client.phone ?? undefined,
		billingAddress: client.billingAddress ?? undefined,
		taxId: client.taxId ?? undefined,
		notes: client.notes ?? undefined,
	}
}

interface ClientFormSheetProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	client?: Client | null
	onSaved?: () => void
}

export function ClientFormSheet({
	open,
	onOpenChange,
	client,
	onSaved,
}: ClientFormSheetProps) {
	const isEditing = Boolean(client)
	const createMutation = useCreateClientMutation()
	const updateMutation = useUpdateClientMutation(client?.id ?? "")
	const mutation = isEditing ? updateMutation : createMutation

	const form = useForm<ClientFormValues, any, ClientInput>({
		resolver: zodResolver(clientInputSchema),
		defaultValues: EMPTY_VALUES,
	})

	useEffect(() => {
		if (open) form.reset(client ? toFormValues(client) : EMPTY_VALUES)
	}, [open, client, form])

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			await mutation.mutateAsync(values)
			toast.success(isEditing ? "Client updated." : "Client added.")
			onOpenChange(false)
			onSaved?.()
		} catch (error) {
			if (error instanceof ApiError && error.fieldErrors) {
				for (const [field, messages] of Object.entries(error.fieldErrors)) {
					const message = messages[0]
					if (message) {
						form.setError(field as keyof ClientFormValues, { message })
					}
				}
			}
			toast.error(
				error instanceof ApiError ? error.message : "Couldn't save this client."
			)
		}
	})

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent>
				<form onSubmit={onSubmit} className="flex h-full flex-col">
					<SheetHeader>
						<SheetTitle>{isEditing ? "Edit client" : "New client"}</SheetTitle>
						<SheetDescription>
							{isEditing
								? "Update this client's details."
								: "Add a client to bill and quote."}
						</SheetDescription>
					</SheetHeader>

					<div className="flex-1 space-y-4 overflow-y-auto p-4">
						<CustomFormField
							fieldType={FormFieldType.INPUT}
							control={form.control}
							name="name"
							label="Name"
							autoFocus
						/>
						<CustomFormField
							fieldType={FormFieldType.INPUT}
							control={form.control}
							name="email"
							label="Email"
							autoComplete="email"
						/>
						<CustomFormField
							fieldType={FormFieldType.INPUT}
							control={form.control}
							name="phone"
							label="Phone"
							autoComplete="tel"
						/>
						<CustomFormField
							fieldType={FormFieldType.TEXTAREA}
							control={form.control}
							name="billingAddress"
							label="Billing address"
							className="resize-none"
						/>
						<CustomFormField
							fieldType={FormFieldType.INPUT}
							control={form.control}
							name="taxId"
							label="Tax ID"
						/>
						<CustomFormField
							fieldType={FormFieldType.TEXTAREA}
							control={form.control}
							name="notes"
							label="Notes"
							className="resize-none"
						/>
					</div>

					<SheetFooter>
						<Button type="submit" disabled={mutation.isPending}>
							<LoadingSwap isLoading={mutation.isPending}>
								{isEditing ? "Save changes" : "Add client"}
							</LoadingSwap>
						</Button>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	)
}
