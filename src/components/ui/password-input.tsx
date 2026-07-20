"use client"

import { ComponentProps, forwardRef, useState } from "react"

import { Icon, Icons } from "@/components/shared/icons"
import { Input } from "@/components/ui/input"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils/dx"

export const PasswordInput = forwardRef<
	HTMLInputElement,
	Omit<ComponentProps<typeof Input>, "type">
>(function PasswordInput({ className, ...props }, ref) {
	const [visible, setVisible] = useState(false)

	const togglePassword = () => setVisible((prev) => !prev)

	return (
		<InputGroup className={cn(className)}>
			<InputGroupInput
				ref={ref}
				className="pr-10"
				type={visible ? "text" : "password"}
				data-name="password-input"
				{...props}
			/>
			<InputGroupAddon align="inline-end">
				<button
					type="button"
					onClick={togglePassword}
					aria-label={visible ? "Hide password" : "Show password"}
					aria-pressed={visible}
					className="px-1 text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
				>
					<Icon icon={Icons.view} altIcon={Icons.viewOff} showAlt={visible} />
				</button>
			</InputGroupAddon>
		</InputGroup>
	)
})
