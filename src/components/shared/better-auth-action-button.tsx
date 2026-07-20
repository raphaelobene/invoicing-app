"use client"

import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import {
	MutationButton,
	type MutationButtonProps,
} from "@/components/shared/mutation-button"

type ActionResult = { error: null | { message?: string | undefined } }

export function BetterAuthActionButton({
	action,
	successMessage,
	...props
}: Omit<MutationButtonProps<ActionResult, void>, "mutation"> & {
	action: () => Promise<ActionResult>
	successMessage?: string
}) {
	const mutation = useMutation<ActionResult, Error, void>({
		mutationFn: action,
		onSuccess: (res) => {
			if (res.error) {
				toast.error(res.error.message || "Action failed")
			} else if (successMessage) {
				toast.success(successMessage)
			}
		},
		onError: (err) => {
			toast.error(err instanceof Error ? err.message : "Action failed")
		},
	})

	return <MutationButton<ActionResult, void> {...props} mutation={mutation} />
}
