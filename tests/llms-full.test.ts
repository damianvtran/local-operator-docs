import { describe, expect, it } from "vitest";
import { getAllPages, getResolvedNav } from "@/lib/content";
import { buildLlmsFullTxt } from "@/lib/llms-full";
import { SITE } from "@/lib/site";

/**
 * `/llms-full.txt` cannot silently drift from the content tree.
 *
 * Mirrors the search-index completeness test in `tests/nav.test.ts`: the
 * artifact is rebuilt from the real loader and checked against the same
 * published/draft partition every other public surface uses. What it pins is
 * the artifact↔loader boundary — a page added to or dropped from the build, a
 * draft leaking in, a source line that no longer matches the navigation. A
 * pure content edit correctly cannot fail it: both sides move together by
 * construction, which is the property the artifact exists to keep.
 */

describe("llms-full completeness", () => {
	const text = buildLlmsFullTxt();

	it("contains every published page exactly once, with its source link", () => {
		const published = getResolvedNav()
			.flatMap((group) => group.items)
			.filter((item) => item.status === "published");
		expect(published.length).toBeGreaterThan(0);

		for (const item of published) {
			const source = `Source: ${SITE.url}${item.href}`;
			const occurrences = text.split(source).length - 1;
			expect(
				occurrences,
				`${item.slug}: ${occurrences} source line(s) in llms-full.txt`,
			).toBe(1);
		}
	});

	it("contains every published page body, byte-identical to /raw", () => {
		for (const page of getAllPages()) {
			if (page.draft) continue;
			expect(
				text.includes(page.body.trimEnd()),
				`${page.slug}: body missing from llms-full.txt`,
			).toBe(true);
		}
	});

	it("lists no drafts, and nothing the navigation does not publish", () => {
		/*
		 * The loop is deliberately unconditional: with a zero-draft tree it is
		 * vacuous by construction (publishing the last draft is a legitimate
		 * content change, not a defect), and the set equality below still pins
		 * the partition — a leaked draft produces a Source line outside the
		 * published set and fails there (round-1 review, MINOR).
		 */
		for (const page of getAllPages().filter((page) => page.draft)) {
			expect(
				text.includes(`Source: ${SITE.url}${page.href}`),
				`draft ${page.slug} leaked into llms-full.txt`,
			).toBe(false);
		}

		const sourceLines = text
			.split("\n")
			.filter((line) => line.startsWith("Source: "));
		const publishedLines = getResolvedNav()
			.flatMap((group) => group.items)
			.filter((item) => item.status === "published")
			.map((item) => `Source: ${SITE.url}${item.href}`);
		expect(sourceLines.length).toBe(publishedLines.length);
		expect(new Set(sourceLines)).toEqual(new Set(publishedLines));
	});

	it("opens with the site title and description llms.txt opens with", () => {
		expect(text.startsWith(`# ${SITE.title}\n`)).toBe(true);
		expect(text).toContain(`> ${SITE.description}`);
	});
});
