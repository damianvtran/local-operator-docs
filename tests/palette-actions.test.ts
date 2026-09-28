import { describe, expect, it } from "vitest";
import {
	actionMatches,
	actionMatchScore,
	buildActions,
} from "@/components/search/actions";
import { search } from "@/lib/search/engine";
import { buildSearchIndex } from "@/lib/search/index-gen";
import { tokenizeCode, tokenizeQuery } from "@/lib/search/tokenizer";

/**
 * The palette's action layer, pinned to the round-1 measurement (UX U2):
 * "how do I connect my phone" tokenized to [do, connect, phone]; the
 * every-token action match then failed on the one action whose keywords
 * prefix-matched "do" (install's "download"), no action row surfaced, and
 * Enter landed on the Python SDK.
 */
const actions = buildActions({
	navigate: () => {},
	copy: async () => true,
	toast: () => {},
	openShortcuts: () => {},
});

function rankedMatches(tokens: string[]) {
	return actions
		.map((action) => ({ action, matched: actionMatchScore(action, tokens) }))
		.filter(({ action }) => actionMatches(action, tokens))
		.sort((a, b) => b.matched - a.matched);
}

describe("tokenizeQuery for natural questions", () => {
	it("drops auxiliary verbs and possessive pronouns", () => {
		expect(tokenizeQuery("how do I connect my phone")).toEqual([
			"connect",
			"phone",
		]);
	});

	it("keeps them in code mode, where 'do' can be an identifier", () => {
		expect(tokenizeCode("do")).toEqual(["do"]);
	});
});

describe("palette action matching", () => {
	it("surfaces Connect my phone first for the natural phrase", () => {
		const ranked = rankedMatches(tokenizeQuery("how do I connect my phone"));
		expect(ranked[0]?.action.id).toBe("connect-phone");
		expect(ranked[0]?.matched).toBe(2);
		// "Install Local Operator" is what the old "do" prefix-match on its
		// "download" keyword surfaced; it must not appear at all.
		expect(ranked.map(({ action }) => action.id)).not.toContain("install");
	});

	it("accepts a near miss of exactly one token, and no more", () => {
		const connect = actions.find((action) => action.id === "connect-phone");
		if (!connect) throw new Error("connect-phone action is missing");
		expect(actionMatches(connect, ["connect", "phone"])).toBe(true); // strict
		expect(actionMatches(connect, ["connect", "phone", "widget"])).toBe(true); // one miss
		expect(actionMatches(connect, ["connect", "widget", "gadget"])).toBe(false); // two misses
		expect(actionMatches(connect, ["widget"])).toBe(false); // single token, no match
	});

	it("still surfaces the row when the question keeps one unmatched word", () => {
		// "use" is not in the action's vocabulary: the row survives as a
		// near miss and ranks below any strict match.
		const ranked = rankedMatches(tokenizeQuery("how do I use my phone"));
		const connect = ranked.find(({ action }) => action.id === "connect-phone");
		expect(connect?.matched).toBe(1);
	});
});

describe("engine against the real index", () => {
	it("ranks Mobile relay first for 'phone'", () => {
		const index = buildSearchIndex();
		const results = search(index, "phone");
		expect(results[0]?.entry.url.startsWith("/surfaces/mobile-relay")).toBe(
			true,
		);
	});

	it("leads the Pages group with Mobile relay for the full natural question", () => {
		const index = buildSearchIndex();
		const results = search(index, "how do I connect my phone");
		// The palette renders Actions, then Pages, then Sections; this pins the
		// group the wrong page landed in before (Python SDK led it, now 4th).
		const pages = results.filter((result) => result.entry.kind === "page");
		expect(pages[0]?.entry.url.startsWith("/surfaces/mobile-relay")).toBe(true);
	});
});
