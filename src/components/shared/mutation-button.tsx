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
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils/dx"

export type MutationButtonProps<TData = unknown, TVariables = void> = Omit<
	ComponentProps<typeof Button>,
	"onClick" | "disabled"
> & {
	mutation: UseMutationResult<TData, Error, TVariables>
	mutationArgs?: TVariables
	areYouSureDescription?: React.ReactNode
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
	areYouSureDescription = (
		<>
			<span>Are you sure you want to delete?</span>
			<span className="font-semibold text-destructive">
				This action cannot be undone.
			</span>
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
					// Ignore attempts to close (Cancel, overlay, Esc) while the
					// mutation is in flight so the dialog can't be dismissed
					// out from under a pending request.
					if (!isLoading) setOpen(next)
				}}
			>
				<AlertDialogTrigger asChild>
					<Button type="button" {...props} />
				</AlertDialogTrigger>
				<AlertDialogContent className="sm:max-w-sm">
					<AlertDialogHeader>
						<AlertDialogTitle>{actionButtonText}</AlertDialogTitle>
						<AlertDialogDescription>
							{areYouSureDescription}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							disabled={isLoading}
							className={cn(
								buttonVariants({ variant: "ghost", size: "sm" }),
								"border bg-muted/40 not-disabled:hover:text-foreground"
							)}
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={isLoading}
							onClick={(e) => {
								// AlertDialogAction closes the dialog on click by
								// default. Block that so it stays open (and
								// showing the loading state) until the mutation
								// actually resolves.
								e.preventDefault()
								performAction(() => setOpen(false))
							}}
							className={cn(
								buttonVariants({ variant: "secondary", size: "sm" }),
								actionButtonClassname
							)}
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
			onClick={() => performAction()}
		>
			<LoadingSwap isLoading={isLoading}>{props.children}</LoadingSwap>
		</Button>
	)
}
