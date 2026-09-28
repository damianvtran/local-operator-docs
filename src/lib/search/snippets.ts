import { findRanges } from "./text";

/**
 * Match-centered snippets.
 *
 * The brief's rule — "never the first paragraph" — is the whole point: a
 * result row must show the text around the BEST match, not the top of the
 * section, because a search for "waiver" that previews paragraph one tells
 * the reader nothing about whether the hit is the one they meant.
 *
 * The index stores section prose flattened to a single string, so the "1-3
 * line window" here is a ~200-character window snapped to word boundaries —
 * roughly one to three rendered lines at the docs measure.
 */

export type SnippetOptions = {
	/** Half-window target, in characters. */
	window?: number;
	/** Hard cap on the returned text (excluding ellipses). */
	maxChars?: number;
};

const DEFAULT_WINDOW = 200;
const DEFAULT_MAX_CHARS = 240;

/** Truncate to `maxChars` without splitting the last word. */
function clip(text: string, maxChars: number): string {
	if (text.length <= maxChars) return text;
	const cut = text.slice(0, maxChars);
	const lastSpace = cut.lastIndexOf(" ");
	return `${cut.slice(0, lastSpace > maxChars * 0.6 ? lastSpace : maxChars)}…`;
}

/**
 * Builds the preview string with `**matched terms**` marked, so the client
 * can render `<mark>` from a parsed string instead of shipping offsets that
 * would have to be re-derived after any truncation.
 */
export function buildSnippet(
	source: string,
	terms: string[],
	options?: SnippetOptions,
): string {
	const windowSize = options?.window ?? DEFAULT_WINDOW;
	const maxChars = options?.maxChars ?? DEFAULT_MAX_CHARS;
	const text = source.replace(/\s+/g, " ").trim();
	if (!text) return "";

	const marks = terms.filter(Boolean);
	// All term occurrences (original-text coordinates), by attempting a match
	// over a generous span: we score candidate centres, then re-find ranges in
	// the chosen window below.
	const allRanges = marks.length > 0 ? findRanges(text, marks) : [];
	if (allRanges.length === 0) {
		// Match came from title/heading/breadcrumb only. There is nothing to
		// centre on, so show the start of the section — the honest fallback.
		return clip(text, maxChars);
	}

	// Choose the occurrence with the most neighbouring matches — a window
	// around a dense cluster beats one around an isolated hit.
	let best = allRanges[0];
	let bestNeighbours = -1;
	for (const range of allRanges) {
		let neighbours = 0;
		for (const other of allRanges) {
			if (other === range) continue;
			if (
				other.start > range.end - windowSize &&
				other.start < range.end + windowSize
			)
				neighbours++;
		}
		if (neighbours > bestNeighbours) {
			bestNeighbours = neighbours;
			best = range;
		}
	}

	// Window around the best hit, snapped to word boundaries.
	let start = Math.max(
		0,
		Math.floor((best.start + best.end) / 2) - Math.floor(windowSize / 2),
	);
	let end = Math.min(text.length, start + windowSize);
	if (start > 0) {
		const space = text.indexOf(" ", start);
		if (space !== -1 && space < end) start = space + 1;
	}
	if (end < text.length) {
		const space = text.lastIndexOf(" ", end);
		if (space !== -1 && space > start) end = space;
	}
	// Keep the cap honest even after boundary snapping.
	if (end - start > maxChars) {
		start = Math.max(0, best.start - Math.floor(maxChars / 3));
		end = Math.min(text.length, start + maxChars);
	}

	const prefix = start > 0 ? "…" : "";
	const suffix = end < text.length ? "…" : "";
	let windowText = text.slice(start, end);

	// Re-find matched terms inside the window and wrap them in ** markers.
	const windowRanges = findRanges(windowText, marks);
	for (let i = windowRanges.length - 1; i >= 0; i--) {
		const { start: rangeStart, end: rangeEnd } = windowRanges[i];
		windowText = `${windowText.slice(0, rangeStart)}**${windowText.slice(rangeStart, rangeEnd)}**${windowText.slice(rangeEnd)}`;
	}

	return `${prefix}${windowText}${suffix}`;
}
