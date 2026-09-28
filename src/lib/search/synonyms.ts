/**
 * Query-side synonym expansion: the "the user's word != the docs' word" map.
 *
 * A docs search that only matches the vocabulary the writers chose is a
 * failure of routing, not of ranking: someone types "phone" and gets zero
 * results because every page says "mobile relay". Each key expands into
 * alternative tokens that match with a discount, so an entry matching the
 * documented word outranks one matched only through the synonym.
 *
 * Values are POST-tokenization forms (already lowercase, stemmed where the
 * stemmer would have applied) so a value matches indexed tokens directly.
 */
export const SYNONYMS: Record<string, string[]> = {
	// The four the brief named, plus their symmetric reverse directions.
	phone: ["mobile", "relay"],
	mobiles: ["phone"],
	daemon: ["always"],
	daemons: ["always"],
	background: ["always"],
	pair: ["mesh"],
	pairing: ["mesh"],
	paired: ["mesh"],
	cron: ["schedule", "workflow"],
	schedule: ["workflow", "wake"],
	scheduled: ["workflow", "wake"],
	nightly: ["schedule", "workflow"],
	// A few more that the taxonomy's own vocabulary invites.
	tui: ["terminal"],
	terminal: ["tui"],
	gui: ["desktop"],
	phoneaccess: ["mobile"],
	cli: ["terminal", "command"],
	update: ["upgrade"],
	install: ["setup"],
};

export type QueryVariant = { token: string; weight: number };

/** One term-group: the user's token plus any synonyms. Any member matches. */
export type QueryGroup = { variants: QueryVariant[] };

/** Weight given to a token that only matched through the synonym map. */
export const SYNONYM_WEIGHT = 0.6;

/**
 * Builds the scored query: each token keeps full weight; each synonym of it
 * is added as a discounted alternative in the same group.
 */
export function expandQuery(tokens: string[]): QueryGroup[] {
	return tokens.map((token) => {
		const variants: QueryVariant[] = [{ token, weight: 1 }];
		for (const synonym of SYNONYMS[token] ?? []) {
			if (synonym === token) continue;
			if (!variants.some((variant) => variant.token === synonym)) {
				variants.push({ token: synonym, weight: SYNONYM_WEIGHT });
			}
		}
		return { variants };
	});
}
