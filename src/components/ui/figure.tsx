import { cn } from "@/lib/utils";

/**
 * Figure: image + caption, with an optional frame mat.
 *
 * Two shapes on purpose: a real image when `src` exists, and a labelled
 * placeholder frame when it does not. Phase 1 ships no screenshots, and a
 * figure tag that silently renders nothing is how captions drift away from
 * the pages that claim to have figures — the placeholder keeps the slot
 * honest and visible.
 */
export function Figure({
	src,
	darkSrc,
	alt = "",
	caption,
	frame = false,
}: {
	src?: string;
	/** Optional second file for the dark theme. Both are in the DOM and the
	 *  `data-theme` attribute picks one (`.lo-theme-*` in globals.css), so the
	 *  swap follows the site toggle rather than the OS preference and needs
	 *  no JS. */
	darkSrc?: string;
	alt?: string;
	caption?: string;
	frame?: boolean;
}) {
	if (!src) {
		return (
			<figure className="lo-bleed flex min-h-32 items-center justify-center rounded-lg border border-dashed border-hairline p-8 text-center text-body-sm text-ink-dim">
				{caption ?? "Figure"}
			</figure>
		);
	}
	return (
		<figure className="lo-bleed">
			{/* Plain <img>, deliberately: content images are static files in
          /public with a known width, so next/image's runtime is not earned;
          switch when real screenshots land with unknown dimensions. */}
			{/* biome-ignore lint/performance/noImgElement: static content files in /public; next/image arrives when real screenshots have known dimensions */}
			<img
				src={src}
				alt={alt}
				loading="lazy"
				className={cn(
					"w-full rounded-lg border border-hairline",
					frame && "bg-surface p-2",
					darkSrc && "lo-theme-light",
				)}
			/>
			{darkSrc ? (
				// biome-ignore lint/performance/noImgElement: static content files in /public; next/image arrives when real screenshots have known dimensions
				<img
					src={darkSrc}
					alt={alt}
					loading="lazy"
					className={cn(
						"lo-theme-dark w-full rounded-lg border border-hairline",
						frame && "bg-surface p-2",
					)}
				/>
			) : null}
			{caption ? (
				<figcaption className="mt-2 text-center text-body-sm text-ink-dim">
					{caption}
				</figcaption>
			) : null}
		</figure>
	);
}
