"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

import CustomFormField, {
	FormFieldType,
} from "@/components/shared/custom-form-field"
import { LoadingSwap } from "@/components/shared/loading-swap"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { slugify } from "@/lib/utils/dx"

const signupSchema = z.object({
	name: z.string().trim().min(1, { error: "Enter your name" }),
	businessName: z.string().trim().min(1, { error: "Enter a business name" }),
	email: z.email({ error: "Enter a valid email" }),
	password: z.string().min(8, { error: "At least 8 characters" }),
})

type SignupInput = z.infer<typeof signupSchema>

export default function SignupForm() {
	const router = useRouter()
	const form = useForm<SignupInput>({
		resolver: zodResolver(signupSchema),
		defaultValues: { name: "", businessName: "", email: "", password: "" },
	})

	const mutation = useMutation({
		mutationFn: async (values: SignupInput) => {
			const signUpResult = await authClient.signUp.email({
				name: values.name,
				email: values.email,
				password: values.password,
			})
			if (signUpResult.error) {
				throw new Error(
					signUpResult.error.message ?? "Couldn't create your account."
				)
			}

			const orgResult = await authClient.organization.create({
				name: values.businessName,
				slug: slugify(values.businessName),
			})

			if (orgResult.error || !orgResult.data) {
				throw new Error(
					"Account created, but we couldn't set up your workspace. Try signing in."
				)
			}

			await authClient.organization.setActive({
				organizationId: orgResult.data.id,
			})
		},
		onSuccess: () => {
			router.push("/dashboard")
			router.refresh()
		},
		onError: (error) => toast.error(error.message),
	})

	const onSubmit = form.handleSubmit((values) => mutation.mutate(values))

	return (
		<form className="space-y-4" onSubmit={onSubmit}>
			<CustomFormField
				fieldType={FormFieldType.INPUT}
				control={form.control}
				label="Name"
				name="name"
				autoComplete="name"
				autoFocus
			/>
			<CustomFormField
				fieldType={FormFieldType.INPUT}
				control={form.control}
				name="businessName"
				label="Business name"
				placeholder="Acme Studio"
				autoComplete="organization"
			/>
			<CustomFormField
				fieldType={FormFieldType.INPUT}
				control={form.control}
				label="Email"
				name="email"
				type="email"
				autoComplete="email"
			/>

			<CustomFormField
				fieldType={FormFieldType.PASSWORD_INPUT}
				control={form.control}
				label="Password"
				name="password"
				autoComplete="new-password"
			/>

			<Button type="submit" className="w-full" disabled={mutation.isPending}>
				<LoadingSwap isLoading={mutation.isPending}>
					Create workspace
				</LoadingSwap>
			</Button>
		</form>
	)
}
