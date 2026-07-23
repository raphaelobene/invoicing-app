import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
} from "@/components/ui/card"
import { Kbd } from "@/components/ui/kbd"
import { HOTKEYS } from "@/lib/constants"
import { Page } from "@/lib/platform/server/safe-page"
import { cn, createShortcutBadge } from "@/lib/utils/dx"
import { format, formatList } from "@/lib/utils/formatter"

export default Page.create({
	path: "/",
	name: "home",
}).page(() => {
	const now = new Date()

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 text-sm leading-loose">
			<div>
				<h1 className="font-medium">Project ready!</h1>
				<p>You may now add components and start building.</p>
				<p>We&apos;ve already added the button component for you.</p>
				<div className="mt-4 flex items-center gap-2">
					<Button>Button</Button>
					<Link
						href="/"
						className={cn(
							buttonVariants({ variant: "link" }),
							"h-auto rounded-none px-0"
						)}
					>
						Home
					</Link>
				</div>
			</div>
			<Card>
				<CardHeader>
					<CardDescription>
						{format(3).plural(
							{ one: "item", other: "items" },
							{ value: "before" }
						)}
					</CardDescription>
					<CardAction>{format(now).date()}</CardAction>
				</CardHeader>
				<CardContent>
					<ul>
						<li>{formatList(["apples", "bananas", "cherries"]).list()}</li>
						<li>
							{formatList(["apples", "bananas"]).list({
								type: "disjunction",
							})}
						</li>
						<li>
							{formatList(["red", "green", "blue"]).list({ style: "short" })}
						</li>
					</ul>
					<CardDescription>
						{format(42.5).currency("NGN", {
							locale: "en-NG",
							decimals: 1,
						})}
					</CardDescription>
					<CardDescription>
						{format(1500000).bytes()} - {format(0.639).percent({ decimals: 1 })}
					</CardDescription>
				</CardContent>
				<CardFooter>
					<Link
						href="/"
						className={cn(buttonVariants({ variant: "link", size: "xs" }))}
					>
						View Details
					</Link>
				</CardFooter>
			</Card>
			<div className="font-mono text-xs text-muted-foreground">
				(Press{" "}
				{createShortcutBadge(HOTKEYS.DARK_MODE, {
					wrapper: (hotkey) => <Kbd key={hotkey}>{hotkey}</Kbd>,
				})}{" "}
				to toggle dark mode)
			</div>
		</div>
	)
})
