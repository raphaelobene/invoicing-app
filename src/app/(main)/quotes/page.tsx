import ErrorCard from "@/components/shared/error-card"
import Quotes from "@/features/quotes/components/quotes"
import { quotesSearchParams } from "@/features/quotes/schema"
import { Page } from "@/lib/platform/server/safe-page"

const QuotesPage = Page.create({
	path: "/quotes",
	name: "quotes",
})
	.searchParamsSchema(quotesSearchParams, ({ errors }) => (
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
	.page(() => <Quotes />)

declare global {
	interface PageRegistry {
		quotes: typeof QuotesPage
	}
}

export default QuotesPage
