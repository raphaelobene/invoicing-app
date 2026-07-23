import { IconSvgElement } from "@hugeicons/react"

import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty"

import { Icon } from "./icons"

interface ErrorCardProps {
	icon?: IconSvgElement
	title?: string
	description?: React.ReactNode
	className?: string
	actionButton?: React.ReactNode
}
export default function ErrorCard({
	icon,
	title,
	description,
	className,
	actionButton,
}: ErrorCardProps) {
	return (
		<Empty className={className}>
			<EmptyHeader>
				{icon && <EmptyMedia>{<Icon icon={icon} />}</EmptyMedia>}
				{title && <EmptyTitle>{title}</EmptyTitle>}
				{description && (
					<EmptyDescription className="text-balance wrap-break-word hyphens-auto">
						{description}
					</EmptyDescription>
				)}
			</EmptyHeader>
			{actionButton && (
				<EmptyContent className="justify-center">{actionButton}</EmptyContent>
			)}
		</Empty>
	)
}
