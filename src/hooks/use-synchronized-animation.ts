import * as React from "react"

export default function useSynchronizedAnimation(animationName: string) {
	const ref = React.useRef<null | SVGSVGElement>(null)

	React.useEffect(() => {
		const animations = ref.current?.getAnimations()

		if (animations) {
			animations
				.filter(
					(animation) =>
						(animation as CSSAnimation).animationName === animationName
				)
				.forEach(
					(animation) => (animation.currentTime = document.timeline.currentTime)
				)
		}
	}, [animationName])

	return ref
}
