import { fold } from "./tokenizer";
import type { MatchRange } from "./types";

/**
 * Fold-aware text matching: find a query term's occurrences in an ORIGINAL
 * string (for `<mark>` rendering) even though matching happens on folded
 * tokens.
 *
 * `foldWithMap` walks the original once and records, for every folded
 * character, which original index produced it — so a match found in the
 * folded string maps back to real offsets even when folding changed lengths
 * (diacritics stripping, `ß` -> `ss`-style expansions).
 */

export type Folded = {
	folded: string;
	/** original index of the char that produced folded[i]; length = folded.length + 1 */
	map: number[];
};

export function foldWithMap(text: string): Folded {
	let folded = "";
	const map: number[] = [];
	for (let i = 0; i < text.length; i++) {
		const piece = fold(text[i]);
		for (let j = 0; j < piece.length; j++) {
			folded += piece[j];
			map.push(i);
		}
	}
	map.push(text.length);
	return { folded, map };
}

function isWordChar(ch: string | undefined): boolean {
	return ch !== undefined && /[a-z0-9]/.test(ch);
}

/**
 * All occurrences of `term` in `text` (folded compare), merged when they
 * overlap or touch. Word-start matching: a hit only counts at a word
 * boundary, so "on" does not highlight inside "phone".
 */
export function findRanges(
	text: string,
	terms: string[],
	options?: { allowInsideWord?: boolean },
): MatchRange[] {
	if (!text || terms.length === 0) return [];
	const { folded, map } = foldWithMap(text);
	const allowInsideWord = options?.allowInsideWord ?? false;
	const ranges: MatchRange[] = [];

	for (const term of terms) {
		if (!term) continue;
		let from = 0;
		for (;;) {
			const at = folded.indexOf(term, from);
			if (at === -1) break;
			const beforeOk = allowInsideWord || !isWordChar(folded[at - 1]);
			const afterOk = allowInsideWord || !isWordChar(folded[at + term.length]);
			if (beforeOk && afterOk) {
				ranges.push({ start: map[at], end: map[at + term.length - 1] + 1 });
			}
			from = at + 1;
		}
	}

	// Merge overlaps / adjacency, then sort.
	ranges.sort((a, b) => a.start - b.start || a.end - b.end);
	const merged: MatchRange[] = [];
	for (const range of ranges) {
		const last = merged[merged.length - 1];
		if (last && range.start <= last.end) {
			last.end = Math.max(last.end, range.end);
		} else {
			merged.push({ ...range });
		}
	}
	return merged;
}
