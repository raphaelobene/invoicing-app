export default function HighlightText({
	text,
	search,
}: {
	text: string
	search?: string
}) {
	if (!search || !text) return text

	const escaped = search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
	const parts = text.split(new RegExp(`(${escaped})`, 'gi'))

	return (
		<>
			{parts.map((part, i) =>
				part.toLowerCase() === search.toLowerCase() ? (
					<mark
						key={i}
						className="bg-primary text-primary-foreground rounded-[3px]"
					>
						{part}
					</mark>
				) : (
					<span key={i}>{part}</span>
				)
			)}
		</>
	)
}
