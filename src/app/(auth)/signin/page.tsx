import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import AuthWrapper from "@/features/auth/components/auth-wrapper"
import SigninForm from "@/features/auth/components/signin-form"
import { Page } from "@/lib/platform/server/safe-page"
import { cn } from "@/lib/utils/dx"

export default Page.create({
	path: "/signin",
	name: "signin",
}).page(() => (
	<AuthWrapper
		description={
			<>
				Don&apos;t have an account?{" "}
				<Link
					aria-label="Sign up"
					prefetch={false}
					className={cn(
						buttonVariants({ size: "lg", variant: "link" }),
						"h-auto rounded-none p-0 font-normal"
					)}
					href="/signup"
				>
					Sign up
				</Link>
			</>
		}
		footer={
			<>
				By signing in, you agree to our{" "}
				<Link
					aria-label="Terms"
					prefetch={false}
					className={cn(
						buttonVariants({ size: "sm", variant: "link" }),
						"h-auto rounded-none p-0 text-xs font-normal"
					)}
					href="/"
				>
					Terms
				</Link>{" "}
				and{" "}
				<Link
					aria-label="Privacy"
					prefetch={false}
					className={cn(
						buttonVariants({ size: "sm", variant: "link" }),
						"h-auto rounded-none p-0 text-xs font-normal"
					)}
					href="/"
				>
					Privacy Policy
				</Link>
				.
			</>
		}
		isSocialAllowed
		title="Welcome back"
	>
		<SigninForm />
	</AuthWrapper>
))
