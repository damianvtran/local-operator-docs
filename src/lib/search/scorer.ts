import { buildSnippet } from "./snippets";
import { findRanges } from "./text";
import type { EntryField, ScoredEntry, SearchEntry } from "./types";

/**
 * The ranker.
 *
 * Contract, in order of strength:
 *   - per-term match quality: exact > prefix > typo (bounded Levenshtein 1,
 *     terms >= 5 chars, candidates validated against the index vocabulary)
 *   - field weights: title x8, heading x5, breadcrumb x2, code x2, text x1
 *   - a phrase bonus when two matched terms sit at adjacent positions
 *   - mild length normalisation, so a hit in a long section does not outrank
 *     the same hit in a tight one
 *   - deterministic tie-breaks (engine sorts; nothing here uses Date or
 *     Math.random)
 *
 * Coverage — how many query term-groups matched at all — is returned but not
 * folded into the score: the engine ranks entries that match ALL terms above
 * entries that match some, which is the "all-terms AND, partial coverage
 * ranking" the brief asks for.
 */

export const FIELD_WEIGHTS: Record<EntryField, number> = {
	title: 8,
	heading: 5,
	breadcrumb: 2,
	text: 1,
	code: 2,
};

const FIELDS: EntryField[] = ["title", "heading", "breadcrumb", "text", "code"];

const MATCH_VALUE = { exact: 1, prefix: 0.7, typo: 0.5 } as const;
const PHRASE_BONUS = 2;

export type PlanVariant = {
	token: string;
	weight: number;
	/** Vocabulary tokens within one edit of `token` (empty for short terms). */
	typoCandidates: string[];
};

export type QueryPlan = {
	groups: Array<{ variants: PlanVariant[] }>;
};

/** All strings one edit away from `token` (deletes, inserts, replaces, transposes). */
export function edits1(token: string): Set<string> {
	const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
	const out = new Set<string>();
	for (let i = 0; i <= token.length; i++) {
		// deletes
		if (i < token.length) out.add(token.slice(0, i) + token.slice(i + 1));
		// transposes
		if (i < token.length - 1) {
			out.add(token.slice(0, i) + token[i + 1] + token[i] + token.slice(i + 2));
		}
		// replaces + inserts
		for (const ch of alphabet) {
			if (i < token.length)
				out.add(token.slice(0, i) + ch + token.slice(i + 1));
			out.add(token.slice(0, i) + ch + token.slice(i));
		}
	}
	out.delete(token);
	return out;
}

type VariantMatch = {
	type: keyof typeof MATCH_VALUE;
	points: number;
	position: number;
};

function matchInField(
	entry: SearchEntry,
	field: EntryField,
	variant: PlanVariant,
): VariantMatch | null {
	const tokens = entry.tokens[field];
	const exactAt = tokens.indexOf(variant.token);
	if (exactAt !== -1) {
		return {
			type: "exact",
			points: variant.weight * MATCH_VALUE.exact,
			position: exactAt,
		};
	}
	if (variant.token.length >= 3) {
		const prefixAt = tokens.findIndex(
			(token) => token !== variant.token && token.startsWith(variant.token),
		);
		if (prefixAt !== -1) {
			return {
				type: "prefix",
				points: variant.weight * MATCH_VALUE.prefix,
				position: prefixAt,
			};
		}
	}
	if (variant.typoCandidates.length > 0) {
		for (const candidate of variant.typoCandidates) {
			const at = tokens.indexOf(candidate);
			if (at !== -1) {
				const similarity = 1 - 1 / variant.token.length;
				return {
					type: "typo",
					points: variant.weight * MATCH_VALUE.typo * similarity,
					position: at,
				};
			}
		}
	}
	return null;
}

export function scoreEntry(
	entry: SearchEntry,
	plan: QueryPlan,
): ScoredEntry | null {
	let score = 0;
	let coverage = 0;
	// Matched token text per field, for the phrase check and highlighting.
	const matchedTokensByField = new Map<EntryField, Set<string>>();
	const highlightTerms = new Set<string>();

	for (const group of plan.groups) {
		let best: { total: number; token: string; field: EntryField } | null = null;
		for (const variant of group.variants) {
			for (const field of FIELDS) {
				const match = matchInField(entry, field, variant);
				if (!match) continue;
				const total = match.points * FIELD_WEIGHTS[field];
				if (!best || total > best.total) {
					best = { total, token: variant.token, field };
				}
			}
		}
		if (best) {
			coverage += 1;
			score += best.total;
			highlightTerms.add(best.token);
			const set = matchedTokensByField.get(best.field) ?? new Set<string>();
			set.add(best.token);
			matchedTokensByField.set(best.field, set);
			// Also record the prefix/typo forms so a phrase check can find what
			// actually matched, not just the query spelling.
			for (const variant of group.variants) {
				const match = matchInField(entry, best.field, variant);
				if (match) set.add(entry.tokens[best.field][match.position]);
			}
		}
	}

	if (coverage === 0) return null;

	// Phrase bonus: two or more matched terms at adjacent positions in one field.
	for (const [field, matched] of matchedTokensByField) {
		if (matched.size < 2) continue;
		const tokens = entry.tokens[field];
		let run = 0;
		for (const token of tokens) {
			run = matched.has(token) ? run + 1 : 0;
			if (run >= 2) {
				score += (PHRASE_BONUS * FIELD_WEIGHTS[field]) / FIELD_WEIGHTS.title;
				break;
			}
		}
	}

	// Mild length normalisation for the big free-text fields only.
	const bulk = entry.tokens.text.length + entry.tokens.code.length;
	if (bulk > 0) {
		score *= 1 / (1 + Math.log2(1 + bulk / 128) * 0.2);
	}

	const terms = [...highlightTerms];
	const snippetSource =
		matchedTokensByField.has("text") || !matchedTokensByField.has("code")
			? entry.text
			: entry.code;

	return {
		entry,
		score,
		coverage,
		titleRanges: findRanges(entry.title, terms),
		headingRanges: findRanges(entry.heading, terms),
		snippet: buildSnippet(snippetSource, terms),
	};
}
