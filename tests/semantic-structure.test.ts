import type { Node } from "@markdoc/markdoc";
import { describe, expect, it } from "vitest";
import { getAllPages } from "@/lib/content";

/**
 * Semantic structure, enforced: one H1 per page and no heading-level skips.
 *
 * The audit that preceded this file found exactly one violation (the FAQ's
 * questions were `###` directly under the `#` title, so the page went 1 → 3
 * with no section between) and fixed it. This test is what keeps the next
 * one from shipping: crawlers and assistive technology both walk this
 * outline, and unlike prose quality it is mechanically checkable.
 *
 * Headings are read off the same AST the pages render (ids already assigned),
 * so a heading that renders is a heading that is checked.
 */

type Heading = { level: number; text: string };

function headingsOf(ast: Node): Heading[] {
	const found: Heading[] = [];
	const walk = (node: Node) => {
		for (const child of node.children ?? []) {
			if (child.type === "heading") {
				found.push({
					level: Number(child.attributes.level),
					text: (child.children ?? [])
						.map((c) => String(c.attributes?.content ?? ""))
						.join(""),
				});
			} else {
				walk(child);
			}
		}
	};
	walk(ast);
	return found;
}

describe("page semantic structure", () => {
	for (const page of getAllPages()) {
		it(`${page.slug}: exactly one H1, and it opens the page`, () => {
			const headings = headingsOf(page.ast);
			const h1s = headings.filter((h) => h.level === 1);
			expect(h1s).toHaveLength(1);
			expect(headings[0]?.level).toBe(1);
		});

		it(`${page.slug}: no heading-level skips`, () => {
			const headings = headingsOf(page.ast);
			let previous: number | null = null;
			for (const heading of headings) {
				if (previous !== null && heading.level > previous + 1) {
					throw new Error(
						`h${previous} is followed by h${heading.level} at "${heading.text.slice(0, 60)}"`,
					);
				}
				previous = heading.level;
			}
		});
	}

	it("no two published pages share a title or a description", () => {
		const published = getAllPages().filter((page) => !page.draft);
		const titles = new Map<string, string[]>();
		const descriptions = new Map<string, string[]>();
		for (const page of published) {
			titles.set(page.title, [...(titles.get(page.title) ?? []), page.slug]);
			descriptions.set(page.description, [
				...(descriptions.get(page.description) ?? []),
				page.slug,
			]);
		}
		expect(
			[...titles.entries()].filter(([, slugs]) => slugs.length > 1),
		).toEqual([]);
		expect(
			[...descriptions.entries()].filter(([, slugs]) => slugs.length > 1),
		).toEqual([]);
	});
});
