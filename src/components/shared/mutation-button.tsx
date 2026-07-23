"use client"

import { useState, type ComponentProps } from "react"
import type { UseMutationResult } from "@tanstack/react-query"

import { LoadingSwap } from "@/components/shared/loading-swap"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export type MutationButtonProps<TData = unknown, TVariables = void> = Omit<
	ComponentProps<typeof Button>,
	"onClick" | "disabled"
> & {
	mutation: UseMutationResult<TData, Error, TVariables>
	mutationArgs?: TVariables
	title: string
	description?: React.ReactNode
	actionButtonText?: string
	actionButtonClassname?: string
	requireAreYouSure?: boolean
	disabled?: boolean
}

export function MutationButton<TData = unknown, TVariables = void>({
	mutation,
	mutationArgs,
	actionButtonText = "Yes",
	actionButtonClassname,
	title,
	description = (
		<>
			<span>Are you sure you want to delete?</span>{" "}
			<span className="text-destructive/70">This action cannot be undone.</span>
		</>
	),
	requireAreYouSure = false,
	...props
}: MutationButtonProps<TData, TVariables>) {
	const [open, setOpen] = useState(false)
	const isLoading = mutation.isPending

	function performAction(onSuccess?: () => void) {
		mutation.mutate(
			mutationArgs as TVariables,
			onSuccess ? { onSuccess } : undefined
		)
	}

	if (requireAreYouSure) {
		return (
			<AlertDialog
				open={open}
				onOpenChange={(next) => {
					if (!isLoading) setOpen(next)
				}}
			>
				<AlertDialogTrigger asChild>
					<Button
						type="button"
						data-size={props.size}
						data-variant={props.variant}
						{...props}
					/>
				</AlertDialogTrigger>
				<AlertDialogContent className="sm:max-w-sm">
					<AlertDialogHeader>
						<AlertDialogTitle>{title}</AlertDialogTitle>
						<AlertDialogDescription>{description}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							disabled={isLoading}
							variant="ghost"
							size={props.size}
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={isLoading}
							onClick={(e) => {
								e.preventDefault()
								performAction(() => setOpen(false))
							}}
							variant={props.variant}
							size={props.size}
							className={actionButtonClassname}
						>
							<LoadingSwap isLoading={isLoading}>
								{actionButtonText}
							</LoadingSwap>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		)
	}

	return (
		<Button
			type="button"
			{...props}
			disabled={props.disabled ?? isLoading}
			data-size={props.size}
			data-variant={props.variant}
			onClick={() => performAction()}
		>
			<LoadingSwap isLoading={isLoading}>{props.children}</LoadingSwap>
		</Button>
	)
}
