import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Kbd: a key or chord the reader presses, in the machine voice.
 *
 * THE ONE CAP STYLE. Five surfaces used to carry four spellings of this box —
 * three inline copies with different grounds and inks, and a shorter footer
 * variant that was not monospace at all — so the same motif read three ways on
 * one site. Every cap now comes from here; callers add layout utilities only
 * (`ml-auto`, `shrink-0`), never another box.
 *
 * THE NUMBERS. `px-2` (8px) against the old `px-1.5` (6px) with the `0.08em`
 * tracking is what de-crowds the box: the `⌘` glyph is served by a system
 * fallback face (Geist Mono has no U+2318) and measures a 10px advance where
 * `K` measures 6.7px, so at the old padding the pair sat flush against both
 * the border and each other (measured glyph gap 0px; round-3 close-ups).
 *
 * THE INK IS `ink-dim`, one step below `ink-muted`, for the same reason the
 * app's caps are: a cap ANNOTATES the label it sits beside, and the labels it
 * annotates (the palette footer's "navigate", the trigger's "Search") are
 * themselves `ink-dim` or `ink-muted` — a cap at `ink-muted` outranks the
 * thing it explains. `rounded-xs` and `border-hairline` are the system's
 * control-scale radius and edge, stated once here.
 *
 * `INLINE-BLOCK` IS LOAD-BEARING, not a style choice: an inline <kbd>'s box
 * takes the font's content height (~16px at 12px type) instead of its 17.4px
 * line box, so the SAME cap measured 22.00px tall in the 404 page's prose
 * against 23.39px in the top bar's flex row (design round 3, D2).
 * Inline-block makes the box line-height-derived in every context.
 */
export function Kbd({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<kbd
			className={cn(
				"inline-block rounded-xs border border-hairline bg-surface px-2 py-0.5 font-mono text-mono-sm tracking-[0.08em] text-ink-dim",
				className,
			)}
		>
			{children}
		</kbd>
	);
}
