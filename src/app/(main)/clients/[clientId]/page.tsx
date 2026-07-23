import ClientDetails from "@/features/clients/components/client-details"
import { Page } from "@/lib/platform/server/safe-page"

const ClientDetailsPage = Page.create({
	path: "/clients/[clientId]",
	name: "client-details",
}).page(async () => <ClientDetails />)

declare global {
	interface PageRegistry {
		"client-details": typeof ClientDetailsPage
	}
}

export default ClientDetailsPage
