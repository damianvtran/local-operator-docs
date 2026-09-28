import { edits1, type QueryPlan, scoreEntry } from "./scorer";
import { expandQuery } from "./synonyms";
import { tokenizeQuery } from "./tokenizer";
import type { ScoredEntry, SearchIndex } from "./types";

/**
 * The query engine: index in, ranked results out.
 *
 * Pure string/data work — no fs, no DOM — so the same functions run in the
 * palette, in unit tests, and in the index generator's sanity checks.
 */

/** Every token the index contains, for typo candidate validation. */
const vocabularyCache = new WeakMap<SearchIndex, Set<string>>();

export function vocabularyOf(index: SearchIndex): Set<string> {
	const cached = vocabularyCache.get(index);
	if (cached) return cached;
	const vocabulary = new Set<string>();
	for (const entry of index.entries) {
		for (const field of Object.values(entry.tokens)) {
			for (const token of field) vocabulary.add(token);
		}
	}
	vocabularyCache.set(index, vocabulary);
	return vocabulary;
}

export function buildQueryPlan(
	rawQuery: string,
	vocabulary: Set<string>,
): QueryPlan {
	const tokens = tokenizeQuery(rawQuery);
	return {
		groups: expandQuery(tokens).map((group) => ({
			variants: group.variants.map((variant) => ({
				token: variant.token,
				weight: variant.weight,
				typoCandidates:
					variant.token.length >= 5
						? [...edits1(variant.token)].filter((candidate) =>
								vocabulary.has(candidate),
							)
						: [],
			})),
		})),
	};
}

/**
 * Ranked search.
 *
 * Ordering: entries matching every query term first (coverage desc), then by
 * score, then by URL and id for a deterministic order — two identical scores
 * must never swap between keystrokes, or rows wander under the cursor while
 * someone types.
 */
export function search(
	index: SearchIndex,
	rawQuery: string,
	limit = 40,
): ScoredEntry[] {
	const query = rawQuery.trim();
	if (!query) return [];
	const vocabulary = vocabularyOf(index);
	const plan = buildQueryPlan(query, vocabulary);
	if (plan.groups.length === 0) return [];

	const scored: ScoredEntry[] = [];
	for (const entry of index.entries) {
		const result = scoreEntry(entry, plan);
		if (result) scored.push(result);
	}

	scored.sort(
		(a, b) =>
			b.coverage - a.coverage ||
			b.score - a.score ||
			a.entry.url.localeCompare(b.entry.url) ||
			a.entry.id.localeCompare(b.entry.id),
	);

	return scored.slice(0, limit);
}

/**
 * Nearest pages for the no-results state: relax to the first term only and
 * consider whole pages, which is exactly the "did you mean one of these"
 * affordance the empty state needs.
 */
export function nearestPages(
	index: SearchIndex,
	rawQuery: string,
	limit = 3,
): ScoredEntry[] {
	const first = tokenizeQuery(rawQuery)[0];
	if (!first) return [];
	const vocabulary = vocabularyOf(index);
	const plan = buildQueryPlan(first, vocabulary);
	const scored: ScoredEntry[] = [];
	for (const entry of index.entries) {
		if (entry.kind !== "page") continue;
		const result = scoreEntry(entry, plan);
		if (result) scored.push(result);
	}
	scored.sort(
		(a, b) => b.score - a.score || a.entry.url.localeCompare(b.entry.url),
	);
	return scored.slice(0, limit);
}
