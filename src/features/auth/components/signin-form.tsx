"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";



import CustomFormField, { FormFieldType } from "@/components/shared/custom-form-field";
import { LoadingSwap } from "@/components/shared/loading-swap";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";





const loginSchema = z.object({
	email: z.email({ error: "Enter a valid email" }),
	password: z.string().min(1, { error: "Enter your password" }),
})

type LoginInput = z.infer<typeof loginSchema>

export default function SigninForm() {
	const router = useRouter()

	const form = useForm<LoginInput>({
		defaultValues: { email: "", password: "" },
		resolver: zodResolver(loginSchema),
	})

	const mutation = useMutation({
		mutationFn: async (values: LoginInput) => {
			const { data, error } = await authClient.signIn.email(values)
			if (error) {
				throw new Error(
					error.message ??
						"Couldn't sign you in. Check your email and password."
				)
			}

			// signIn doesn't set an active org the way signUp does — without this,
			// requireOrgContext() will fail FORBIDDEN for every returning user
			const orgsResult = await authClient.organization.list()
			const orgs = orgsResult.data ?? []

			if (orgs.length === 1 && orgs[0]) {
				await authClient.organization.setActive({ organizationId: orgs[0].id })
			}
			// orgs.length === 0 or > 1: leave unset, let the org-selection
			// page handle it — that's a legitimate choice, not a broken session

			return data
		},
		onSuccess: () => {
			router.push("/dashboard")
			router.refresh()
		},
		onError: (error) => toast.error(error.message),
	})

	const onSubmit = form.handleSubmit((values) => mutation.mutate(values))

	return (
		<div className="space-y-4">
			<form className="space-y-4" onSubmit={onSubmit}>
				<CustomFormField
					fieldType={FormFieldType.INPUT}
					control={form.control}
					size="lg"
					label="Email"
					name="email"
					type="email"
					autoComplete="email"
					autoFocus
				/>

				<CustomFormField
					fieldType={FormFieldType.PASSWORD_INPUT}
					control={form.control}
					size="lg"
					label="Password"
					name="password"
					autoComplete="current-password"
				/>

				<Button
					type="submit"
					className="w-full"
					size="lg"
					disabled={mutation.isPending}
				>
					<LoadingSwap isLoading={mutation.isPending}>Sign in</LoadingSwap>
				</Button>
			</form>
		</div>
	)
}