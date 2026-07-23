import React from "react"

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"

import { SocialAuthButtons } from "./social-auth-buttons"

export default function AuthWrapper({
	children,
	description,
	footer = null,
	isSocialAllowed = false,
	title,
}: {
	children: React.ReactNode
	description?: React.ReactNode
	footer?: React.ReactNode
	isSocialAllowed?: boolean
	title: string
}) {
	return (
		<Card>
			<CardHeader className="space-y-1">
				<CardTitle className="text-center text-xl">{title}</CardTitle>
				<CardDescription className="text-center">{description}</CardDescription>
				{isSocialAllowed && (
					<div className="flex w-full flex-col items-center gap-y-5 pt-4">
						<div className="auto-fill-[10rem] grid w-full gap-4 pb-2">
							<SocialAuthButtons />
						</div>
						<div className="relative w-full">
							<div className="absolute inset-0 flex items-center">
								<span className="h-px w-full bg-border" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-card px-4 font-medium text-muted-foreground">
									Or continue with
								</span>
							</div>
						</div>
					</div>
				)}
			</CardHeader>
			<CardContent>{children}</CardContent>
			{footer && (
				<CardFooter className="flex-col border-t-0 bg-transparent">
					<p className="text-xs text-muted-foreground">{footer}</p>
				</CardFooter>
			)}
		</Card>
	)
}
