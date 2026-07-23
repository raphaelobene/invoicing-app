"use client"

import { UseMutationResult } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"

import { Icon, Icons } from "./icons"
import { MutationButton } from "./mutation-button"

export type DocumentActionsProps<TData = unknown, TVariables = void> = {
	mutation: UseMutationResult<TData, Error, TVariables>
	mutationArgs: TVariables
	pdfUrl: string
	hasClientEmail: boolean
	isSending: boolean
	label?: string
	title: string
}

/**
 * Shared by the invoice, quote, and receipt panels — same two actions
 * everywhere: open the PDF in a new tab (the browser handles view/save),
 * and email it to the client via the given mutation. Disabled with an
 * explanatory label when the client has no email on file, since that's
 * the one precondition every "send" endpoint enforces server-side too.
 */

export function DocumentActions<TData = unknown, TVariables = void>({
	mutation,
	mutationArgs,
	pdfUrl,
	hasClientEmail,
	isSending,
	label = "Email to client",
	title,
}: DocumentActionsProps<TData, TVariables>) {
	return (
		<div className="flex flex-wrap gap-2">
			<Button variant="outline" size="sm" asChild>
				<a href={pdfUrl} target="_blank" rel="noopener noreferrer">
					<Icon icon={Icons.download} strokeWidth={2} aria-hidden="true" />
					Download PDF
				</a>
			</Button>
			<MutationButton
				variant="outline"
				size="sm"
				mutation={mutation}
				mutationArgs={mutationArgs}
				disabled={!hasClientEmail || isSending}
				title={
					hasClientEmail ? "" : "Add an email address to this client first"
				}
				data-name={title}
			>
				<Icon icon={Icons.mail} strokeWidth={2} aria-hidden="true" />
				{label}
			</MutationButton>
		</div>
	)
}
