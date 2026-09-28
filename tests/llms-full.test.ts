import { describe, expect, it } from "vitest";
import { getAllPages, getResolvedNav } from "@/lib/content";
import { buildLlmsFullTxt } from "@/lib/llms-full";
import { SITE } from "@/lib/site";

/**
 * `/llms-full.txt` cannot silently drift from the content tree.
 *
 * Mirrors the search-index completeness test in `tests/nav.test.ts`: the
 * artifact is rebuilt from the real loader and checked against the same
 * published/draft partition every other public surface uses. If a page is
 * added, moved, published or drafted, one of these fails before the site can
 * ship a full-text file that disagrees with the pages it claims to contain.
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

	it("lists no drafts", () => {
		const drafts = getAllPages().filter((page) => page.draft);
		expect(drafts.length).toBeGreaterThan(0);
		for (const page of drafts) {
			expect(text.includes(`Source: ${SITE.url}${page.href}`)).toBe(false);
		}
	});

	it("opens with the site title and description llms.txt opens with", () => {
		expect(text.startsWith(`# ${SITE.title}\n`)).toBe(true);
		expect(text).toContain(`> ${SITE.description}`);
	});
});
