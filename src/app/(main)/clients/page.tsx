import ErrorCard from "@/components/shared/error-card"
import { default as Clients } from "@/features/clients/components/clients"
import { clientSearchParams } from "@/features/clients/schema"
import { Page } from "@/lib/platform/server/safe-page"

const ClientsPage = Page.create({
	path: "/clients",
	name: "clients",
})
	.searchParamsSchema(clientSearchParams, ({ errors }) => (
		<ErrorCard
			title="Invalid Search Params"
			description={
				<>
					<p>Please check your url and try again.</p>
					<pre>{JSON.stringify(errors, null, 2)}</pre>
				</>
			}
		/>
	))
	.page(async () => {
		return <Clients />
	})

declare global {
	interface PageRegistry {
		clients: typeof ClientsPage
	}
}

export default ClientsPage
