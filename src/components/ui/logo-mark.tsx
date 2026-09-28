import { cn } from "@/lib/utils";

/**
 * The Local Operator mark: a figure whose limbs terminate in graph nodes.
 *
 * The path geometry was traced from the raster logo in the site repo
 * (`local-operator-site/src/components/ui/logo-mark.tsx`, itself verified by
 * overlaying the path on the original at 256px). It is monochrome, so as an
 * SVG it inherits `currentColor` and needs no light/dark pair and no
 * `filter: invert` trick — only one vector to keep crisp at 20–28px.
 *
 * The viewBox is cropped to the artwork's bounding box plus even padding.
 */
export function LogoMark({ className }: { className?: string }) {
	return (
		<svg
			viewBox="285 253 520 520"
			className={cn("size-6 text-ink", className)}
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			// Decorative in every call site: the header wraps it in a link that
			// already carries "Local Operator home", and the footer pairs it with
			// the wordmark. A title here would be announced twice.
			aria-hidden="true"
			focusable="false"
		>
			<circle cx="490" cy="355" r="78" strokeWidth="35" />
			<circle cx="720" cy="326" r="42" strokeWidth="29" />
			<circle cx="368" cy="686" r="41" strokeWidth="29" />
			{/* Left limb and shoulders, one stroke. */}
			<path
				d="M370 645 V545 a90 90 0 0 1 90 -90 h60 a78 78 0 0 1 66 44"
				strokeWidth="33"
			/>
			{/* Torso. */}
			<path d="M590 498 V750" strokeWidth="33" />
			{/* Raised arm, ending at the upper node. */}
			<path d="M600 492 C 646 512 686 480 706 400 L 712 378" strokeWidth="33" />
		</svg>
	);
}
