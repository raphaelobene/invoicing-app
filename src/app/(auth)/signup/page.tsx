import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import AuthWrapper from "@/features/auth/components/auth-wrapper"
import SignupForm from "@/features/auth/components/signup-form"
import { Page } from "@/lib/platform/server/safe-page"
import { cn } from "@/lib/utils/dx"

export default Page.create({
	path: "/signup",
	name: "signup",
}).page(() => (
	<AuthWrapper
		description={
			<>
				Already have an account?{" "}
				<Link
					aria-label="Sign in"
					prefetch={false}
					className={cn(
						buttonVariants({ size: "lg", variant: "link" }),
						"h-auto rounded-none p-0 font-normal"
					)}
					href="/signin"
				>
					Sign in
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
		title="Create your workspace"
	>
		<SignupForm />
	</AuthWrapper>
))
