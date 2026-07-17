import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { HOTKEYS } from "@/lib/constants"
import { Page } from "@/lib/platform/server/safe-page"
import { cn, createShortcutBadge } from "@/lib/utils"

export default Page.create({
	path: "/",
	name: "home",
}).page(() => (
	<div className="flex min-h-svh p-6">
		<div className="flex max-w-md min-w-0 flex-col gap-6 text-sm leading-loose">
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
			<div className="font-mono text-xs text-muted-foreground">
				(Press{" "}
				{createShortcutBadge(HOTKEYS.DARK_MODE, {
					wrapper: (hotkey) => <Kbd key={hotkey}>{hotkey}</Kbd>,
				})}{" "}
				to toggle dark mode)
			</div>
		</div>
	</div>
))
