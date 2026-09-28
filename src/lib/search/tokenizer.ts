/**
 * The query tokenizer.
 *
 * Rules that matter, in order:
 *   1. lowercase and NFKD-fold diacritics ("über" -> "uber")
 *   2. split on anything that is not [a-z0-9] — including `-`, `_`, `.` and
 *      `/` — so `local_operator.sdk` and `lop exec` tokenize the way a user
 *      types them
 *   3. keep a full identifier token alongside its parts when the source
 *      contained separators (`local_operator.sdk` -> parts plus the joined
 *      form `localoperatorsdk`), so an exact identifier query still scores
 *      highest
 *   4. code mode: no stopwords, no stemming — identifiers stay intact
 *   5. text mode: a small stopword list and stemmer-lite (plural + suffix
 *      trim) for prose
 *
 * The stemmer is deliberately conservative — it must never maim a token that
 * could be a code word. Words a naive `s`-strip would break (`status`,
 * `css`, `ios`, `canvas`, ...) are protected by suffix guards and a small
 * exception set, and the behaviour is pinned by tests.
 */

/**
 * Function words dropped from prose queries and prose tokens.
 *
 * The auxiliaries (do/does/did, can/could/should/would/might/must, the be
 * forms) matter more than their size suggests: "how do I connect my phone"
 * kept "do", every-token action matching then failed on the one action whose
 * keywords happened to prefix-match it, and the natural question surfaced no
 * action row at all (UX round 1, U2). They carry no topic in a query, so text
 * mode drops them; code mode keeps them (`tokenizeCode`), where "do" can be an
 * identifier.
 */
const STOPWORDS = new Set([
	"a",
	"am",
	"an",
	"and",
	"are",
	"as",
	"at",
	"be",
	"been",
	"being",
	"but",
	"by",
	"can",
	"cannot",
	"could",
	"did",
	"do",
	"does",
	"for",
	"from",
	"how",
	"i",
	"if",
	"in",
	"into",
	"is",
	"it",
	"its",
	"may",
	"me",
	"might",
	"must",
	"my",
	"no",
	"not",
	"of",
	"on",
	"or",
	"shall",
	"should",
	"so",
	"that",
	"the",
	"their",
	"then",
	"there",
	"these",
	"this",
	"to",
	"up",
	"us",
	"was",
	"we",
	"were",
	"what",
	"when",
	"where",
	"which",
	"who",
	"will",
	"with",
	"would",
	"you",
	"your",
]);

/** Words a naive suffix-strip would maim. All lowercase, all post-fold. */
const STEM_EXCEPTIONS = new Set([
	"alias",
	"atlas",
	"bias",
	"boss",
	"bus",
	"canvas",
	"css",
	"gas",
	"gui",
	"https",
	"ios",
	"jsx",
	"lens",
	"macos",
	"plus",
	"sass",
	"series",
	"status",
	"tsx",
	"vs",
]);

/** NFKD-fold (kills diacritics) + lowercase. Applied before any splitting. */
export function fold(text: string): string {
	return text
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
}

/**
 * Stemmer-lite: `ies -> y`, `ing`/`ed` trim with de-doubling, `sses -> ss`,
 * and a guarded plural `s` strip. Everything it declines to touch stays as
 * written, which is the safe direction for identifiers.
 */
export function stem(token: string): string {
	if (STEM_EXCEPTIONS.has(token)) return token;
	if (token.length <= 3) return token;

	if (/ies$/.test(token) && token.length > 4) {
		return `${token.slice(0, -3)}y`;
	}
	if (/ing$/.test(token) && token.length > 5) {
		let stemmed = token.slice(0, -3);
		// De-double only consonants that genuinely double before -ing. `l`, `s`,
		// `f` and `z` are excluded on purpose: "installing" -> "install" and
		// "calling" -> "call" are already the stem, and stripping them would
		// produce "instal"/"cal".
		if (/([bdgmnprt])\1$/.test(stemmed)) stemmed = stemmed.slice(0, -1);
		return stemmed;
	}
	if (/ed$/.test(token) && token.length > 4 && !/eed$/.test(token)) {
		let stemmed = token.slice(0, -2);
		if (/([bdgmnprt])\1$/.test(stemmed)) stemmed = stemmed.slice(0, -1);
		return stemmed;
	}
	if (/sses$/.test(token)) {
		return token.slice(0, -2);
	}
	if (/s$/.test(token) && !/(ss|us|is|os|ys|as)$/.test(token)) {
		return token.slice(0, -1);
	}
	return token;
}

/** Split into raw [a-z0-9]+ runs after folding. */
function runs(folded: string): string[] {
	return folded.match(/[a-z0-9]+/g) ?? [];
}

/**
 * Identifier matches: a run sequence joined by `.`, `_`, `-` or `/`.
 * Returns the joined form plus its parts, e.g. `local_operator.sdk` ->
 * `["localoperatorsdk", "local", "operator", "sdk"]`.
 */
function identifiers(folded: string): { joined: string; parts: string[] }[] {
	const out: { joined: string; parts: string[] }[] = [];
	const re = /[a-z0-9]+(?:[._/-][a-z0-9]+)+/g;
	for (const match of folded.matchAll(re)) {
		const parts = match[0].split(/[._/-]+/).filter(Boolean);
		out.push({ joined: parts.join(""), parts });
	}
	return out;
}

/** Prose: fold, split, drop stopwords, stem. */
export function tokenizeText(text: string): string[] {
	const folded = fold(text);
	const tokens: string[] = [];
	for (const run of runs(folded)) {
		if (STOPWORDS.has(run)) continue;
		tokens.push(stem(run));
	}
	// Joined identifier forms are kept as-is (never stemmed) so exact
	// identifier hits score highest; the parts are already in `tokens`. Only
	// forms containing a letter count: "3.12" is a version, not an identifier,
	// and a bare "312" token would just pollute the vocabulary.
	for (const { joined, parts } of identifiers(folded)) {
		if (!/[a-z]/.test(joined)) continue;
		if (parts.some((part) => !STOPWORDS.has(part))) tokens.push(joined);
	}
	return tokens;
}

/** Code: fold, split, keep everything — identifiers intact, no stopwords. */
export function tokenizeCode(text: string): string[] {
	const folded = fold(text);
	const tokens: string[] = runs(folded);
	for (const { joined, parts } of identifiers(folded)) {
		tokens.push(joined, ...parts);
	}
	return tokens;
}

/**
 * Query: exactly `tokenizeText`, plus joined identifier forms kept (they are
 * added by tokenizeText already). Exported separately so the engine and the
 * tests read the same contract even if the two ever diverge.
 */
export function tokenizeQuery(text: string): string[] {
	return tokenizeText(text);
}
