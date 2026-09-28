import { describe, expect, it } from "vitest";
import { nearestPages, search, vocabularyOf } from "@/lib/search/engine";
import { buildSearchIndex } from "@/lib/search/index-gen";
import { edits1, type QueryPlan, scoreEntry } from "@/lib/search/scorer";
import { tokenizeCode, tokenizeText } from "@/lib/search/tokenizer";
import type { EntryField, SearchEntry, SearchIndex } from "@/lib/search/types";

/** Fixture builder: explicit fields, real tokenizer. */
function entry(args: {
	slug?: string;
	url?: string;
	kind?: "page" | "section";
	title?: string;
	heading?: string;
	breadcrumb?: string;
	text?: string;
	code?: string;
	draft?: boolean;
}): SearchEntry {
	const slug = args.slug ?? "test/page";
	const anchor = args.kind === "section" ? "section" : "";
	const tokens: Record<EntryField, string[]> = {
		title: tokenizeText(args.title ?? ""),
		heading: tokenizeText(args.heading ?? ""),
		breadcrumb: tokenizeText(args.breadcrumb ?? ""),
		text: tokenizeText(args.text ?? ""),
		code: tokenizeCode(args.code ?? ""),
	};
	return {
		id: `${slug}::${anchor || "page"}`,
		url: args.url ?? `/${slug}${anchor ? `#${anchor}` : ""}`,
		anchor,
		kind: args.kind ?? "page",
		title: args.title ?? "",
		heading: args.heading ?? "",
		breadcrumb: args.breadcrumb ?? "",
		draft: args.draft ?? false,
		text: args.text ?? "",
		code: args.code ?? "",
		tokens,
	};
}

function index(entries: SearchEntry[]): SearchIndex {
	return { version: 1, generatedAt: "test", entries };
}

describe("scorer", () => {
	it("ranks a title hit above a text hit", () => {
		const withTitle = entry({ slug: "a", title: "Deploy", text: "" });
		const withText = entry({
			slug: "b",
			title: "Other",
			text: "deploy deploy",
		});
		const idx = index([withTitle, withText]);
		const plan: QueryPlan = {
			groups: [
				{ variants: [{ token: "deploy", weight: 1, typoCandidates: [] }] },
			],
		};
		const a = scoreEntry(withTitle, plan);
		const b = scoreEntry(withText, plan);
		expect(a).not.toBeNull();
		expect(b).not.toBeNull();
		expect((a as { score: number }).score).toBeGreaterThan(
			(b as { score: number }).score,
		);
		expect(idx.entries.length).toBe(2);
	});

	it("ranks exact above prefix", () => {
		const exact = entry({ slug: "exact", text: "install the runtime" });
		const prefix = entry({ slug: "prefix", text: "installation notes" });
		const plan: QueryPlan = {
			groups: [
				{ variants: [{ token: "install", weight: 1, typoCandidates: [] }] },
			],
		};
		const a = scoreEntry(exact, plan)?.score ?? 0;
		const b = scoreEntry(prefix, plan)?.score ?? 0;
		expect(a).toBeGreaterThan(b);
	});

	it("matches one-edit typos for terms of 5+ chars, validated against the vocabulary", () => {
		const target = entry({ slug: "t", text: "install the runtime" });
		const vocabulary = new Set(["install", "the", "runtime"]);
		const typo: QueryPlan = {
			groups: [
				{
					variants: [
						{
							token: "isntall",
							weight: 1,
							typoCandidates: [...edits1("isntall")].filter((c) =>
								vocabulary.has(c),
							),
						},
					],
				},
			],
		};
		expect(vocabulary.has("install")).toBe(true);
		expect(scoreEntry(target, typo)).not.toBeNull();

		const short: QueryPlan = {
			groups: [
				{ variants: [{ token: "instll", weight: 1, typoCandidates: [] }] },
			],
		};
		expect(scoreEntry(target, short)).toBeNull();
	});

	it("gives a phrase bonus to adjacent terms", () => {
		const adjacent = entry({ slug: "adj", text: "try lop exec now" });
		const apart = entry({
			slug: "apart",
			text: "lop then something then exec",
		});
		const vocabulary = new Set(["lop", "exec"]);
		const plan: QueryPlan = {
			groups: [
				{ variants: [{ token: "lop", weight: 1, typoCandidates: [] }] },
				{ variants: [{ token: "exec", weight: 1, typoCandidates: [] }] },
			],
		};
		void vocabulary;
		const a = scoreEntry(adjacent, plan)?.score ?? 0;
		const b = scoreEntry(apart, plan)?.score ?? 0;
		expect(a).toBeGreaterThan(b);
	});
});

describe("engine", () => {
	it("ranks all-term matches above partial matches and is deterministic", () => {
		const both = entry({
			slug: "both",
			title: "Install & first run",
			text: "quickstart for install",
		});
		const one = entry({ slug: "one", text: "install only here" });
		const idx = index([one, both]);
		const first = search(idx, "install quickstart");
		expect(first[0]?.entry.url).toBe("/both");
		const second = search(idx, "install quickstart");
		expect(second.map((r) => r.entry.url)).toEqual(
			first.map((r) => r.entry.url),
		);
	});

	it("expands synonyms: 'phone' finds 'mobile relay'", () => {
		const mobile = entry({
			slug: "mobile",
			title: "Mobile relay",
			text: "steer sessions from your phone",
		});
		const idx = index([mobile]);
		const results = search(idx, "phone");
		expect(results.length).toBeGreaterThan(0);
		expect(results[0]?.entry.url).toBe("/mobile");
	});

	it("exposes the vocabulary for typo validation", () => {
		const idx = index([entry({ slug: "v", text: "install" })]);
		expect(vocabularyOf(idx).has("install")).toBe(true);
	});

	it("nearestPages returns page-kind entries only", () => {
		const page = entry({
			slug: "p",
			kind: "page",
			title: "Streaming",
			text: "sse stream",
		});
		const section = entry({
			slug: "s",
			kind: "section",
			title: "Streaming",
			heading: "stream",
			text: "sse stream",
		});
		const results = nearestPages(index([page, section]), "stream");
		expect(results.length).toBeGreaterThan(0);
		expect(results.every((r) => r.entry.kind === "page")).toBe(true);
	});

	it("finds the install page first for 'install' against the real index", () => {
		const idx = buildSearchIndex();
		const results = search(idx, "install");
		expect(results.length).toBeGreaterThan(0);
		expect(results[0]?.entry.url.startsWith("/getting-started/install")).toBe(
			true,
		);
	});

	it("finds a typo against the real index", () => {
		const idx = buildSearchIndex();
		const results = search(idx, "quikstart");
		expect(results.some((r) => r.entry.url.includes("quickstart"))).toBe(true);
	});

	it("finds 'lop exec' somewhere real", () => {
		const idx = buildSearchIndex();
		const results = search(idx, "lop exec");
		expect(results.length).toBeGreaterThan(0);
	});
});
