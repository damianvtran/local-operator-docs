/** Field names a search entry weights. Keep in sync with scorer's WEIGHTS. */
export type EntryField = "title" | "heading" | "breadcrumb" | "text" | "code";

/** One indexed unit: a whole page, or one h2/h3 section of it. */
export type SearchEntry = {
	id: string;
	/** Route with fragment, e.g. `/getting-started/install#verify-the-install`. */
	url: string;
	anchor: string;
	kind: "page" | "section";
	/** Page title. */
	title: string;
	/** Section heading (`""` for page entries). */
	heading: string;
	/** `Group / Page title` — shown under a result row. */
	breadcrumb: string;
	draft: boolean;
	text: string;
	code: string;
	/** Pre-tokenized fields, so the client never re-tokenizes the corpus. */
	tokens: Record<EntryField, string[]>;
};

export type SearchIndex = {
	version: number;
	generatedAt: string;
	entries: SearchEntry[];
};

/** A match range in an original string, for `<mark>` rendering. */
export type MatchRange = {
	start: number;
	end: number;
};

export type ScoredEntry = {
	entry: SearchEntry;
	score: number;
	/** How many query term-groups matched (for AND-first ranking). */
	coverage: number;
	titleRanges: MatchRange[];
	headingRanges: MatchRange[];
	/** Snippet with `**matched terms**` marked. */
	snippet: string;
};
