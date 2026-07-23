import { Page } from "@/lib/platform/server/safe-page"

export default Page.create({
	path: "/quotes/[quoteId]",
	name: "quote-details",
}).page(() => <div>quote details page</div>)
