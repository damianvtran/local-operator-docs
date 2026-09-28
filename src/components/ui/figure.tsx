import { cn } from "@/lib/utils";

/**
 * Figure: image + caption, with an optional frame mat.
 *
 * Two shapes on purpose: a real image when `src` exists, and a labelled
 * placeholder frame when it does not. Phase 1 ships no screenshots, and a
 * figure tag that silently renders nothing is how captions drift away from
 * the pages that claim to have figures — the placeholder keeps the slot
 * honest and visible.
 *
 * Width: a figure stays in the article's CONTENT track — the same 46rem
 * reading column its prose sits in — and deliberately does not take
 * `lo-bleed`. It used to: every screenshot rendered 6rem wider on each side
 * than the text beside it, which is the one property a figure must not have
 * (an image nothing lines up with reads as overflowing the page). Code
 * blocks and tables keep the wide track; they are data, and their width is
 * earned.
 *
 * The placeholder branch carries the same constraint as the image branch:
 * a missing screenshot must not be the only frame that lines up.
 */
export function Figure({
	src,
	darkSrc,
	alt = "",
	caption,
	frame = false,
	width,
	height,
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
	/** Intrinsic pixel size of the asset (both theme variants must share it),
	 *  when known. Renders as width/height so the browser reserves the box
	 *  before the file arrives: the home hero is above the fold, and without
	 *  the reservation the page shifted ~250px on load (CLS 0.288 desktop /
	 *  0.074 mobile; UX round 2, U9). Omitted for figures whose true size
	 *  nobody has measured — a wrong reservation shifts too, just earlier. */
	width?: number;
	height?: number;
}) {
	if (!src) {
		return (
			<figure className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-hairline p-8 text-center text-body-sm text-ink-dim">
				{caption ?? "Figure"}
			</figure>
		);
	}
	return (
		<figure>
			{/* Plain <img>, deliberately: content images are static files in
          /public with a known width, so next/image's runtime is not earned;
          switch when real screenshots land with unknown dimensions. */}
			{/* biome-ignore lint/performance/noImgElement: static content files in /public; next/image arrives when real screenshots have known dimensions */}
			<img
				src={src}
				alt={alt}
				width={width}
				height={height}
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
					width={width}
					height={height}
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
