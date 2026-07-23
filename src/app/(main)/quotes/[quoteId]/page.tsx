import QuoteDetail from "@/features/quotes/components/quote-details"
import { Page } from "@/lib/platform/server/safe-page"

const QuoteDetailsPage = Page.create({
	path: "/quotes/[quoteId]",
	name: "quote-details",
}).page(() => <QuoteDetail />)

declare global {
	interface PageRegistry {
		"quote-details": typeof QuoteDetailsPage
	}
}

export default QuoteDetailsPage
