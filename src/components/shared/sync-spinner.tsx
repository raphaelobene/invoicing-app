"use client"

import { Icon, Icons } from "@/components/shared/icons"
import useSynchronizedAnimation from "@/hooks/use-synchronized-animation"
import { cn } from "@/lib/utils/dx"

export default function SyncSpinner({ className }: { className?: string }) {
	const ref = useSynchronizedAnimation("spin")

	return (
		<Icon
			className={cn("animate-spin duration-75", className)}
			icon={Icons.spinner}
			strokeWidth={2}
			aria-hidden="true"
			ref={ref}
		/>
	)
}
