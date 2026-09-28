import { describe, expect, it } from "vitest";
import { buildSnippet } from "@/lib/search/snippets";
import { findRanges } from "@/lib/search/text";

describe("findRanges", () => {
	it("matches only at word boundaries", () => {
		expect(findRanges("phone", ["on"])).toEqual([]);
		expect(findRanges("turn it on now", ["on"])).toHaveLength(1);
	});

	it("matches through diacritics and reports original offsets", () => {
		const ranges = findRanges("Über alles", ["uber"]);
		expect(ranges).toHaveLength(1);
		expect("Über alles".slice(ranges[0].start, ranges[0].end)).toBe("Über");
	});

	it("merges overlapping hits and stays sorted", () => {
		const ranges = findRanges("install install", ["install", "install"]);
		expect(ranges).toHaveLength(2);
		expect(ranges[0].start).toBeLessThan(ranges[1].start);
	});
});

describe("buildSnippet", () => {
	const filler =
		"This opening paragraph talks about something else entirely and gives no clue. ";

	it("centres on the match, never the first paragraph", () => {
		const text = `${filler}${filler}The waiver expires in March unless renewed. ${filler}`;
		const snippet = buildSnippet(text, ["waiver"]);
		expect(snippet).toContain("waiver");
		expect(snippet.startsWith("This opening paragraph")).toBe(false);
	});

	it("marks matched terms with ** for client-side <mark> rendering", () => {
		const snippet = buildSnippet(
			"The waiver is here and the waiver is there.",
			["waiver"],
		);
		expect(snippet).toContain("**waiver**");
	});

	it("keeps the window small (<= ~240 chars plus ellipses and markers)", () => {
		const text = `${filler.repeat(10)}unique-token appears here ${filler.repeat(10)}`;
		const snippet = buildSnippet(text, ["unique", "token"]);
		expect(snippet.length).toBeLessThan(300);
	});

	it("falls back to the section start when only the heading matched", () => {
		const text = "Plain opening line without any of the queried words.";
		const snippet = buildSnippet(text, ["absent"]);
		expect(snippet).toBe(text);
		expect(snippet).not.toContain("**");
	});

	it("returns empty for empty text", () => {
		expect(buildSnippet("", ["x"])).toBe("");
	});
});
