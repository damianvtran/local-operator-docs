"use client";

import type { ReactNode } from "react";
import type { MatchRange } from "@/lib/search/types";

/**
 * Highlight rendering.
 *
 * Two inputs, one output shape (`<mark>`): the scorer's match offsets for the
 * title/heading, and the `**matched terms**` markers inside a snippet. Both
 * become React nodes — never `dangerouslySetInnerHTML`, because the content
 * is user-supplied markdown text and the palette must not be an injection
 * path.
 */
export function renderRanges(text: string, ranges: MatchRange[]): ReactNode {
	if (ranges.length === 0) return text;
	const nodes: ReactNode[] = [];
	let cursor = 0;
	for (const [index, range] of ranges.entries()) {
		if (range.start > cursor) nodes.push(text.slice(cursor, range.start));
		nodes.push(
			<mark key={`m-${index}-${range.start}`}>
				{text.slice(range.start, range.end)}
			</mark>,
		);
		cursor = range.end;
	}
	if (cursor < text.length) nodes.push(text.slice(cursor));
	return nodes;
}

/** Parses `**marked**` pairs from a snippet into <mark> nodes. */
export function renderMarked(text: string): ReactNode {
	const parts = text.split("**");
	if (parts.length === 1) return text;
	return parts.map((part, index) =>
		index % 2 === 1 ? (
			// biome-ignore lint/suspicious/noArrayIndexKey: the split order is the identity here
			<mark key={`mk-${index}`}>{part}</mark>
		) : (
			// biome-ignore lint/suspicious/noArrayIndexKey: the split order is the identity here
			<span key={`sp-${index}`}>{part}</span>
		),
	);
}
